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

  const header: Element = {
    type: 'element',
    tagName: isFoldable ? 'summary' : 'div',
    properties: { className: ['callout-header'] },
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
