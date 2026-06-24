/**
 * Custom mdast-util-to-hast handler for the `callout` MDAST node.
 *
 * Converts a `callout` node into a HAST element tree:
 *
 *   <div class="callout callout-{type}" data-callout="{type}">
 *     <div class="callout-header">
 *       <span class="callout-icon">{SVG}</span>
 *       <span class="callout-title">{title}</span>
 *     </div>
 *     <div class="callout-body">
 *       {…children transformed recursively…}
 *     </div>
 *   </div>
 *
 * For foldable callouts, the root element is a <details> with a <summary>
 * header, giving native open/close behavior with zero JavaScript.
 *
 * Usage with remark-rehype:
 *   .use(remarkRehype, { handlers: { callout: calloutToHast } })
 *
 * If you forget to wire up the handler, the plugin will emit a console
 * warning (dev only) — see `index.ts` for the bridge.
 */

import type { CalloutNode } from './types.js';
import type { Element, ElementContent, Properties, Text as HastText } from 'hast';
import type { State } from 'mdast-util-to-hast';
// `hast-util-from-html` is a declared runtime dependency (see package.json).
// We import it statically (top-level) so it is always available on the first
// call. The previous dynamic `import()` dance meant the library hadn't
// resolved yet on the first callout icon, silently falling back to the
// manual parser — which mishandled HTML comments, CDATA, and certain
// attribute forms. With a static import, the manual parser only runs as a
// true fallback if `fromHtml` itself throws on malformed input.
import { fromHtml } from 'hast-util-from-html';

/**
 * Parse an inline SVG string into a HAST ElementContent array.
 *
 * Strategy 1 (preferred): `hast-util-from-html` — robust, handles any
 * well-formed HTML/SVG including comments, CDATA, single-quoted attrs.
 *
 * Strategy 2 (fallback): a manual parser for the specific SVG format
 * produced by the `svg()` template in defaults.ts. Used only if
 * `fromHtml` throws (e.g., on severely malformed input).
 */
function svgToHast(svgString: string): ElementContent[] {
  // Strategy 1: hast-util-from-html (always available via static import).
  try {
    const hastRoot = fromHtml(svgString, { fragment: true });
    return hastRoot.children.filter(
      (child: { type: string }): child is ElementContent =>
        child.type === 'element' || child.type === 'text'
    );
  } catch {
    // Fall through to manual parser
  }

  // Strategy 2: Manual SVG parsing fallback
  return parseSvgManual(svgString);
}

/**
 * Minimal manual SVG-to-HAST parser for the specific SVG format produced by
 * the `svg()` template in defaults.ts:
 *   <svg xmlns="..." width="16" height="16" viewBox="0 0 24 24" ...>paths</svg>
 *
 * Handles:
 *   - Self-closing void SVG elements (circle, line, polyline, polygon, rect,
 *     path, ellipse)
 *   - Nested elements with matching closing tags
 *   - Double-quoted, single-quoted, AND unquoted attribute values
 *   - `<svg>` tags with OR without attributes (previous version dropped
 *     attribute-less `<svg>` icons silently)
 *
 * Does NOT handle SVG comments or CDATA — `hast-util-from-html` is required
 * for those (and is the preferred strategy above).
 */
function parseSvgManual(svgString: string): ElementContent[] {
  // Extract the <svg ...> opening tag and its attributes (optional).
  const openTagMatch = svgString.match(/^<svg\b([^>]*)>/i);
  if (!openTagMatch) return [];

  const attrs = openTagMatch[1];
  const rest = svgString.slice(openTagMatch[0].length);

  // Remove closing </svg>
  const inner = rest.replace(/<\/svg>\s*$/i, '');

  // Parse SVG attributes
  const svgProps = parseAttributes(attrs);

  // Parse inner content into child elements
  const children = parseInnerSvg(inner);

  const svgElement: Element = {
    type: 'element',
    tagName: 'svg',
    properties: svgProps,
    children,
  };

  return [svgElement];
}

/**
 * Parse an attribute string like `width="16" height="16" viewBox="0 0 24 24"`
 * into a Properties object. Supports double-quoted, single-quoted, and
 * unquoted attribute values.
 */
function parseAttributes(attrString: string): Properties {
  const props: Properties = {};
  // Matches: name="value"  |  name='value'  |  name=value
  const re = /(\w[\w-]*)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrString)) !== null) {
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    props[match[1]] = value;
  }
  return props;
}

/**
 * Self-closing SVG void element tag names.
 */
const SVG_VOID_ELEMENTS = new Set([
  'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect',
]);

/**
 * Parse inner SVG content (between <svg> and </svg>) into ElementContent[].
 */
function parseInnerSvg(inner: string): ElementContent[] {
  const result: ElementContent[] = [];
  let remaining = inner.trim();

  while (remaining.length > 0) {
    // Try matching a self-closing tag: <tag ... />
    const selfCloseMatch = remaining.match(/^<(\w[\w-]*)((?:\s+[^>]*?)?)\s*\/>/);
    // Try matching an opening tag: <tag ...>
    const openMatch = remaining.match(/^<(\w[\w-]*)((?:\s+[^>]*?)?)>/);

    if (selfCloseMatch) {
      const [, tagName, attrs] = selfCloseMatch;
      result.push({
        type: 'element',
        tagName: tagName.toLowerCase(),
        properties: parseAttributes(attrs),
        children: [],
      });
      remaining = remaining.slice(selfCloseMatch[0].length).trim();
    } else if (openMatch) {
      const [, tagName, attrs] = openMatch;
      const props = parseAttributes(attrs);

      if (SVG_VOID_ELEMENTS.has(tagName.toLowerCase())) {
        // Treat as self-closing even without />
        result.push({
          type: 'element',
          tagName: tagName.toLowerCase(),
          properties: props,
          children: [],
        });
        remaining = remaining.slice(openMatch[0].length).trim();
      } else {
        // Find closing tag — search for the LAST occurrence to handle nested
        // same-named elements correctly (previously used indexOf which broke
        // on nested <g><g></g></g> patterns).
        const closeTag = `</${tagName}>`;
        let searchFrom = openMatch[0].length;
        let closeIdx = -1;
        let depth = 1;
        while (searchFrom < remaining.length) {
          const nextOpen = remaining.indexOf(`<${tagName}`, searchFrom);
          const nextClose = remaining.indexOf(closeTag, searchFrom);
          if (nextClose === -1) break;
          if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            searchFrom = nextOpen + 1;
          } else {
            depth--;
            if (depth === 0) {
              closeIdx = nextClose;
              break;
            }
            searchFrom = nextClose + 1;
          }
        }
        if (closeIdx !== -1) {
          const childContent = remaining.slice(openMatch[0].length, closeIdx);
          const childElements = parseInnerSvg(childContent);
          result.push({
            type: 'element',
            tagName: tagName.toLowerCase(),
            properties: props,
            children: childElements,
          });
          remaining = remaining.slice(closeIdx + closeTag.length).trim();
        } else {
          // No closing tag found — skip this tag
          remaining = remaining.slice(openMatch[0].length).trim();
        }
      }
    } else {
      // Text content
      const nextTag = remaining.indexOf('<');
      if (nextTag === -1) {
        if (remaining.trim()) {
          result.push({ type: 'text', value: remaining });
        }
        break;
      } else if (nextTag > 0) {
        result.push({ type: 'text', value: remaining.slice(0, nextTag) });
        remaining = remaining.slice(nextTag);
      } else {
        // Unparseable — skip one character
        remaining = remaining.slice(1);
      }
    }
  }

  return result;
}

/**
 * Handler function — passed to `remark-rehype` via the `handlers` option.
 *
 * `state` is the mdast-util-to-hast state object (has `.all()`, `.patch()`,
 * `.applyData()` methods).
 */
export function calloutToHast(state: State, node: CalloutNode): Element {
  const data = node.data;

  // ── Route to specialized renderers for non-callout variants ───────────
  // Literary types (epigraph, pullquote) → <figure><div/><figcaption/></figure>
  if (data.calloutType === 'epigraph' || data.calloutType === 'pullquote') {
    return renderLiterary(state, node, data.calloutType as 'epigraph' | 'pullquote');
  }
  // Literary types (aside, sidebar) → <aside>[(<p class="{variant}-title"/>)? body...]</aside>
  if (data.calloutType === 'aside' || data.calloutType === 'sidebar') {
    return renderAside(state, node, data.calloutType as 'aside' | 'sidebar');
  }
  // Structured-data types (bio, event) → callout box with <dl> body
  if (data.calloutType === 'bio' || data.calloutType === 'event') {
    return renderStructured(state, node);
  }
  // Accordion panels ([!!] marker) → <details class="accordion" name="...">
  if (data.calloutType === 'accordion') {
    return renderAccordion(state, node);
  }

  // ── Standard callout rendering ────────────────────────────────────────
  const isFoldable = data.foldable !== false;
  const isClosed = data.foldable === 'closed';
  const tagName = isFoldable ? 'details' : (data.hName as string) || 'div';

  // ── Build header children ──────────────────────────────────────────────

  const headerChildren: ElementContent[] = [];

  // Icon — parse SVG string into proper HAST elements so it renders
  // correctly without requiring `allowDangerousHtml` on the stringifier.
  // Honors `showIcon: false` (set on the node from config).
  if (data.showIcon !== false && data.calloutIcon) {
    const svgChildren = svgToHast(data.calloutIcon);
    if (svgChildren.length > 0) {
      headerChildren.push({
        type: 'element',
        tagName: 'span',
        properties: {
          className: ['callout-icon'],
          'aria-hidden': 'true',
        },
        children: svgChildren,
      });
    }
  }

  // Title — honors `showTitle: false` (set on the node from config).
  // If `calloutTitleNodes` is set (rich title from issue #3), render the
  // inline MDAST nodes via state.all into the title span. Otherwise, fall
  // back to the plain-text `calloutTitle`.
  if (data.showTitle !== false) {
    let titleChildren: ElementContent[] | null = null;

    if (data.calloutTitleNodes && data.calloutTitleNodes.length > 0) {
      // Rich title: wrap titleNodes in a temporary paragraph and transform
      // via state.all. This converts MDAST inline nodes (strong, em, link,
      // code, etc.) into proper HAST elements inside the title span.
      const tempParagraph = { type: 'paragraph', children: data.calloutTitleNodes };
      const transformed = state.all
        ? (state.all(tempParagraph as any) as ElementContent[])
        : [];
      if (transformed.length > 0) {
        titleChildren = transformed;
      }
    }

    if (!titleChildren && data.calloutTitle) {
      // Plain-text fallback
      titleChildren = [{ type: 'text', value: data.calloutTitle } as HastText];
    }

    if (titleChildren && titleChildren.length > 0) {
      headerChildren.push({
        type: 'element',
        tagName: 'span',
        properties: { className: ['callout-title'] },
        children: titleChildren,
      });
    }
  }

  // ── Build header element ───────────────────────────────────────────────

  // For foldable callouts, add `aria-expanded` to the <summary> so screen
  // readers can announce open/closed state. Must be a string ("true"/"false"),
  // NOT a boolean — rehype-stringify renders boolean true as a bare attribute
  // (just `aria-expanded`) which is incorrect for this aria attribute.
  const headerProperties: Properties = { className: ['callout-header'] };
  if (isFoldable) {
    headerProperties['aria-expanded'] = isClosed ? 'false' : 'true';
  }

  const header: Element = {
    type: 'element',
    tagName: isFoldable ? 'summary' : 'div',
    properties: headerProperties,
    children: headerChildren,
  };

  // ── Build body ─────────────────────────────────────────────────────────

  // Transform MDAST children → HAST via the state's `all` method.
  // Falls back to empty array for empty callouts.
  // Cast to `any` here because mdast-util-to-hast's `State.all` typing
  // expects a `Root`/`Nodes`, but our custom `CalloutNode` extends `Parent`
  // and is structurally compatible at runtime.
  const bodyChildren: ElementContent[] = state.all
    ? (state.all(node as any) as ElementContent[])
    : [];

  const body: Element = {
    type: 'element',
    tagName: 'div',
    properties: { className: ['callout-body'] },
    children: bodyChildren,
  };

  // ── Assemble root element ──────────────────────────────────────────────

  const properties: Properties = {
    className: [
      'callout',
      `callout-${data.calloutType}`,
      ...(isFoldable ? ['callout-foldable'] : []),
      // Fallback for older browsers that don't support `:has()`.
      // When the body has no children, add a `callout-empty` class so the
      // CSS rule `.callout.callout-empty` can reset the header margin.
      ...(bodyChildren.length === 0 ? ['callout-empty'] : []),
    ],
    'data-callout': data.calloutType,
    ...(isFoldable ? { 'data-callout-fold': isClosed ? 'closed' : 'open' } : {}),
    ...(data.hProperties?.style ? { style: data.hProperties.style as string } : {}),
    // Custom anchor ID from {#id} syntax — enables deep linking.
    ...(data.calloutId ? { id: data.calloutId } : {}),
  };

  // If foldable and open, add the `open` attribute to <details>.
  // Must be `true` (boolean), NOT `''` (empty string) — rehype-stringify
  // drops boolean attributes whose value is an empty string, but keeps
  // them when the value is `true`. Without this, <details> renders without
  // `open` and appears collapsed despite `data-callout-fold="open"`.
  if (isFoldable && !isClosed) {
    properties.open = true;
  }

  const result: Element = {
    type: 'element',
    tagName,
    properties,
    children: [header, body],
  };

  // Apply position info. We deliberately do NOT call `state.applyData`
  // here because it would re-merge `node.data.hProperties` onto `result`
  // (which we've already merged manually above) and could re-set
  // `tagName` from `hName` (also already set). Single source of truth.
  if (state.patch) state.patch(node as any, result);

  return result;
}

// ─── Accordion Icon Helper ─────────────────────────────────────────────────

/**
 * Render an accordion icon (emoji text or inline SVG string) as HAST content.
 *
 * If the icon looks like an SVG (starts with `<svg`), parse it via `svgToHast`
 * into proper HAST elements. Otherwise (emoji, plain text), render as a text
 * node. This avoids the `allowDangerousHtml` requirement that the original
 * accordion version had.
 */
function renderAccordionIcon(icon: string): ElementContent[] {
  if (icon.startsWith('<svg')) {
    return svgToHast(icon);
  }
  return [{ type: 'text', value: icon } as HastText];
}

// ─── Literary Renderer (Epigraph + Pullquote) ─────────────────────────────

/**
 * Render a literary callout node (epigraph or pullquote) as:
 *
 *   <figure class="{variant}">
 *     <blockquote class="{variant}-quote">
 *       <p>Quote text...</p>
 *     </blockquote>
 *     <figcaption class="{variant}-attribution">— Author</figcaption>
 *   </figure>
 *
 * Attribution is determined in this priority order:
 *   1. Custom title from `[!EPIGRAPH] Author Name` (stored in data.calloutTitle)
 *   2. Last body line that starts with `—`, `–`, or `--`
 *   3. No attribution (just the quote)
 */
function renderLiterary(
  state: State,
  node: CalloutNode,
  variant: 'epigraph' | 'pullquote'
): Element {
  const data = node.data;
  let attribution: string | undefined =
    data.calloutTitle && data.calloutTitle.length > 0
      ? data.calloutTitle
      : undefined;

  let bodyMdast = node.children ? [...node.children] : [];

  // If no explicit attribution, inspect the last paragraph for an em-dash
  // attribution line.
  if (!attribution && bodyMdast.length > 0) {
    const last = bodyMdast[bodyMdast.length - 1];
    if (last && (last as any).type === 'paragraph') {
      const lastPara = last as { type: 'paragraph'; children: any[] };
      const firstChild = lastPara.children[0];
      if (firstChild && firstChild.type === 'text') {
        const text = firstChild.value.replace(/\r\n/g, '\n');
        const lines = text.split('\n');

        let attrLineIdx = -1;
        let attrText = '';
        for (let i = lines.length - 1; i >= 0; i--) {
          const m = lines[i].match(/^\s*(?:--|—|–)\s*(.+)/);
          if (m) {
            attrLineIdx = i;
            attrText = m[1].trim();
            break;
          }
        }

        if (attrLineIdx >= 0) {
          attribution = attrText;
          const bodyText = lines.slice(0, attrLineIdx).join('\n').replace(/\s+$/, '');
          if (bodyText.length > 0) {
            lastPara.children[0] = { ...firstChild, value: bodyText };
          } else {
            bodyMdast = bodyMdast.slice(0, -1);
          }
        }
      }
    }
  }

  const bodyNode = { ...node, children: bodyMdast };
  const bodyChildren: ElementContent[] = state.all
    ? (state.all(bodyNode as any) as ElementContent[])
    : [];

  const figureChildren: ElementContent[] = [
    {
      type: 'element',
      // Use <div> instead of <blockquote> to avoid CSS conflicts with
      // site-wide blockquote styles (borders, padding, etc.). The class
      // name `{variant}-quote` still allows full styling control.
      tagName: 'div',
      properties: { className: [`${variant}-quote`] },
      children: bodyChildren,
    },
  ];

  if (attribution) {
    figureChildren.push({
      type: 'element',
      tagName: 'figcaption',
      properties: { className: [`${variant}-attribution`] },
      children: [
        { type: 'text', value: `— ${attribution}` } as HastText,
      ],
    });
  }

  const figureProperties: Properties = { className: [variant] };
  if (data.calloutId) {
    figureProperties.id = data.calloutId;
  }

  const figure: Element = {
    type: 'element',
    tagName: 'figure',
    properties: figureProperties,
    children: figureChildren,
  };

  if (state.patch) state.patch(node as any, figure);
  return figure;
}

// ─── Aside / Sidebar Renderer ─────────────────────────────────────────────

/**
 * Render an aside or sidebar callout node as:
 *
 *   <aside class="{variant}">
 *     [<p class="{variant}-title">Title</p>]    ← only if custom title given
 *     <div class="{variant}-body">{...children...}</div>
 *     [<p class="{variant}-attribution">— Author</p>]   ← em-dash attribution
 *   </aside>
 */
function renderAside(
  state: State,
  node: CalloutNode,
  variant: 'aside' | 'sidebar'
): Element {
  const data = node.data;
  const heading: string | undefined =
    data.calloutTitle && data.calloutTitle.length > 0
      ? data.calloutTitle
      : undefined;

  let bodyMdast = node.children ? [...node.children] : [];

  // Attribution detection (same as renderLiterary)
  let attribution: string | undefined;
  if (bodyMdast.length > 0) {
    const last = bodyMdast[bodyMdast.length - 1];
    if (last && (last as any).type === 'paragraph') {
      const lastPara = last as { type: 'paragraph'; children: any[] };
      const firstChild = lastPara.children[0];
      if (firstChild && firstChild.type === 'text') {
        const text = firstChild.value.replace(/\r\n/g, '\n');
        const lines = text.split('\n');

        let attrLineIdx = -1;
        let attrText = '';
        for (let i = lines.length - 1; i >= 0; i--) {
          const m = lines[i].match(/^\s*(?:--|—|–)\s*(.+)/);
          if (m) {
            attrLineIdx = i;
            attrText = m[1].trim();
            break;
          }
        }

        if (attrLineIdx >= 0) {
          attribution = attrText;
          const bodyText = lines.slice(0, attrLineIdx).join('\n').replace(/\s+$/, '');
          if (bodyText.length > 0) {
            lastPara.children[0] = { ...firstChild, value: bodyText };
          } else {
            bodyMdast = bodyMdast.slice(0, -1);
          }
        }
      }
    }
  }

  const bodyNode = { ...node, children: bodyMdast };
  const bodyChildren: ElementContent[] = state.all
    ? (state.all(bodyNode as any) as ElementContent[])
    : [];

  const asideChildren: ElementContent[] = [];

  if (heading) {
    asideChildren.push({
      type: 'element',
      tagName: 'p',
      properties: { className: [`${variant}-title`] },
      children: [{ type: 'text', value: heading } as HastText],
    });
  }

  asideChildren.push({
    type: 'element',
    tagName: 'div',
    properties: { className: [`${variant}-body`] },
    children: bodyChildren,
  });

  if (attribution) {
    asideChildren.push({
      type: 'element',
      tagName: 'p',
      properties: { className: [`${variant}-attribution`] },
      children: [{ type: 'text', value: `— ${attribution}` } as HastText],
    });
  }

  const asideProperties: Properties = { className: [variant] };
  if (data.calloutId) {
    asideProperties.id = data.calloutId;
  }

  const aside: Element = {
    type: 'element',
    tagName: 'aside',
    properties: asideProperties,
    children: asideChildren,
  };

  if (state.patch) state.patch(node as any, aside);
  return aside;
}

// ─── Accordion Renderer ───────────────────────────────────────────────────

/**
 * Render an accordion panel node as:
 *
 *   <details class="accordion" name="accordion-group-N" [open]>
 *     <summary class="accordion-header">
 *       [<span class="accordion-icon">{icon}</span>]   ← only if icon provided
 *       <span class="accordion-title">{title}</span>    ← only if title provided
 *       <span class="accordion-chevron" aria-hidden="true"></span>
 *     </summary>
 *     <div class="accordion-body">{...children...}</div>
 *   </details>
 *
 * Uses `svgToHast` for SVG icons and text nodes for emoji icons — does NOT
 * require `allowDangerousHtml` on the stringifier.
 */
function renderAccordion(state: State, node: CalloutNode): Element {
  const data = node.data;
  const isOpen = data.foldable === 'open';
  const groupId = data.accordionGroupId as string;

  // ── Build summary (header) children ───────────────────────────────────
  const summaryChildren: ElementContent[] = [];

  // Optional icon — SVG icons via svgToHast, emoji/text via text node
  if (data.calloutIcon) {
    const iconChildren = renderAccordionIcon(data.calloutIcon);
    if (iconChildren.length > 0) {
      summaryChildren.push({
        type: 'element',
        tagName: 'span',
        properties: {
          className: ['accordion-icon'],
          'aria-hidden': 'true',
        },
        children: iconChildren,
      });
    }
  }

  // Optional title
  if (data.calloutTitle) {
    summaryChildren.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['accordion-title'] },
      children: [{ type: 'text', value: data.calloutTitle } as HastText],
    });
  }

  // Chevron — empty span, styled entirely via CSS
  summaryChildren.push({
    type: 'element',
    tagName: 'span',
    properties: {
      className: ['accordion-chevron'],
      'aria-hidden': 'true',
    },
    children: [],
  });

  // Accordion summaries are always foldable — add `aria-expanded` for a11y.
  // Must be a string ("true"/"false"), NOT a boolean — see callout header above.
  const summary: Element = {
    type: 'element',
    tagName: 'summary',
    properties: {
      className: ['accordion-header'],
      'aria-expanded': isOpen ? 'true' : 'false',
    },
    children: summaryChildren,
  };

  // ── Build body ────────────────────────────────────────────────────────
  const bodyChildren: ElementContent[] = state.all
    ? (state.all(node as any) as ElementContent[])
    : [];

  const body: Element = {
    type: 'element',
    tagName: 'div',
    properties: { className: ['accordion-body'] },
    children: bodyChildren,
  };

  // ── Assemble <details> root ───────────────────────────────────────────
  const properties: Properties = {
    className: ['accordion'],
  };

  // `name` attribute enables native exclusive expansion
  if (groupId) {
    properties.name = groupId;
  }

  // Custom anchor ID from {#id} syntax
  if (data.calloutId) {
    properties.id = data.calloutId;
  }

  const result: Element = {
    type: 'element',
    tagName: 'details',
    properties,
    children: [summary, body],
  };

  // `open` attribute — must be `true` (boolean), NOT `''` (empty string)
  if (isOpen) {
    properties.open = true;
  }

  if (state.patch) state.patch(node as any, result);
  return result;
}

// ─── Structured-Data Renderer (Bio, Event) ────────────────────────────────

/**
 * Parse "Key: Value" lines from the callout body into dt/dd pairs.
 *
 * Lines that don't match the "Key: Value" pattern are kept as regular
 * paragraphs and rendered after the <dl>.
 */
function parseStructuredBody(children: any[]): { fields: { dt: string; dd: string }[]; extra: any[] } {
  const fields: { dt: string; dd: string }[] = [];
  const extra: any[] = [];

  for (const child of children) {
    if (child.type === 'paragraph' && child.children?.length > 0) {
      // Concatenate all text in the paragraph
      let text = '';
      for (const c of child.children) {
        if (c.type === 'text') text += c.value;
      }

      // remark-parse merges blockquote continuation lines into a single
      // text node with \n separators. Split on \n and parse each line as
      // a "Key: Value" field.
      const lines = text.split('\n');
      let allLinesAreFields = true;
      const lineFields: { dt: string; dd: string }[] = [];

      for (const line of lines) {
        const match = line.match(/^\s*([^:\n]+):\s*(.+)\s*$/);
        if (match) {
          lineFields.push({ dt: match[1].trim(), dd: match[2].trim() });
        } else {
          // This line doesn't match — the paragraph has mixed content
          allLinesAreFields = false;
          break;
        }
      }

      if (allLinesAreFields && lineFields.length > 0) {
        fields.push(...lineFields);
      } else {
        extra.push(child);
      }
    } else {
      extra.push(child);
    }
  }

  return { fields, extra };
}

/**
 * Render a structured-data callout (bio or event) as a standard callout box
 * with a <dl> definition list for "Key: Value" fields.
 *
 * Example markdown:
 *   > [!bio] Alan Turing
 *   > Born: June 23, 1912
 *   > Died: June 7, 1954
 *   > Nationality: British
 *   > Role: Mathematician
 *
 * Renders as:
 *   <div class="callout callout-bio" ...>
 *     <div class="callout-header">
 *       <span class="callout-icon">...</span>
 *       <span class="callout-title">Alan Turing</span>
 *     </div>
 *     <div class="callout-body">
 *       <dl class="callout-fields">
 *         <dt>Born</dt><dd>June 23, 1912</dd>
 *         <dt>Died</dt><dd>June 7, 1954</dd>
 *         ...
 *       </dl>
 *     </div>
 *   </div>
 */
function renderStructured(state: State, node: CalloutNode): Element {
  const data = node.data;
  const typeConfig = node.data.calloutType;
  const isFoldable = data.foldable !== false;
  const isClosed = data.foldable === 'closed';
  const tagName = isFoldable ? 'details' : (data.hName as string) || 'div';

  // ── Build header children ──────────────────────────────────────────────
  const headerChildren: ElementContent[] = [];

  if (data.showIcon !== false && data.calloutIcon) {
    const svgChildren = svgToHast(data.calloutIcon);
    if (svgChildren.length > 0) {
      headerChildren.push({
        type: 'element',
        tagName: 'span',
        properties: { className: ['callout-icon'], 'aria-hidden': 'true' },
        children: svgChildren,
      });
    }
  }

  if (data.showTitle !== false && data.calloutTitle) {
    headerChildren.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['callout-title'] },
      children: [{ type: 'text', value: data.calloutTitle } as HastText],
    });
  }

  const headerProperties: Properties = { className: ['callout-header'] };
  if (isFoldable) {
    headerProperties['aria-expanded'] = isClosed ? 'false' : 'true';
  }

  const header: Element = {
    type: 'element',
    tagName: isFoldable ? 'summary' : 'div',
    properties: headerProperties,
    children: headerChildren,
  };

  // ── Build body with <dl> for structured fields ─────────────────────────
  const rawChildren = state.all ? (state.all(node as any) as ElementContent[]) : [];
  const { fields, extra } = parseStructuredBody(node.children as any[]);

  const bodyChildren: ElementContent[] = [];

  // Render the <dl> if we have any fields
  if (fields.length > 0) {
    const dlChildren: ElementContent[] = [];
    for (const field of fields) {
      dlChildren.push({
        type: 'element',
        tagName: 'dt',
        properties: {},
        children: [{ type: 'text', value: field.dt } as HastText],
      });
      dlChildren.push({
        type: 'element',
        tagName: 'dd',
        properties: {},
        children: [{ type: 'text', value: field.dd } as HastText],
      });
    }
    bodyChildren.push({
      type: 'element',
      tagName: 'dl',
      properties: { className: ['callout-fields'] },
      children: dlChildren,
    });
  }

  // Append any non-field content (paragraphs that didn't match Key: Value)
  for (const item of extra) {
    if (state.all) {
      const transformed = state.all({ type: 'root', children: [item] } as any) as ElementContent[];
      bodyChildren.push(...transformed);
    }
  }

  const body: Element = {
    type: 'element',
    tagName: 'div',
    properties: { className: ['callout-body'] },
    children: bodyChildren,
  };

  // ── Assemble root element ──────────────────────────────────────────────
  const properties: Properties = {
    className: [
      'callout',
      `callout-${data.calloutType}`,
      ...(isFoldable ? ['callout-foldable'] : []),
      ...(bodyChildren.length === 0 ? ['callout-empty'] : []),
    ],
    'data-callout': data.calloutType,
    ...(isFoldable ? { 'data-callout-fold': isClosed ? 'closed' : 'open' } : {}),
    ...(data.hProperties?.style ? { style: data.hProperties.style as string } : {}),
    ...(data.calloutId ? { id: data.calloutId } : {}),
  };

  if (isFoldable && !isClosed) {
    properties.open = true;
  }

  const result: Element = {
    type: 'element',
    tagName,
    properties,
    children: [header, body],
  };

  if (state.patch) state.patch(node as any, result);
  return result;
}
