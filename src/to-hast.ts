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

/**
 * Lazily-loaded `hast-util-from-html`. We use dynamic `import()` so that
 * the module works in ESM contexts where `require` is unavailable (the
 * previous `require()` call always threw in ESM and silently fell back
 * to the manual parser, making the declared dependency dead code).
 *
 * The promise is cached so subsequent calls do not re-import.
 */
let fromHtmlPromise: Promise<typeof import('hast-util-from-html') | null> | null = null;

async function getFromHtml(): Promise<typeof import('hast-util-from-html') | null> {
  if (fromHtmlPromise === null) {
    fromHtmlPromise = import('hast-util-from-html')
      .then((mod) => mod)
      .catch(() => null);
  }
  return fromHtmlPromise;
}

/**
 * Parse an inline SVG string into a HAST ElementContent array.
 *
 * Strategy 1 (preferred): `hast-util-from-html` — robust, handles any
 * well-formed HTML/SVG including comments, CDATA, single-quoted attrs.
 *
 * Strategy 2 (fallback): a manual parser for the specific SVG format
 * produced by the `svg()` template in defaults.ts. Used if the dynamic
 * import fails (e.g., the dependency was tree-shaken away).
 *
 * Because `calloutToHast` is called synchronously by `mdast-util-to-hast`,
 * we eagerly kick off the dynamic import at module load and check its
 * resolved value here. If the import hasn't resolved yet on the first
 * call, we fall back to the manual parser — once the import resolves,
 * subsequent calls use the library.
 */
let fromHtmlResolved: typeof import('hast-util-from-html') | null = null;
let fromHtmlAttempted = false;

function svgToHast(svgString: string): ElementContent[] {
  // Strategy 1: Use hast-util-from-html if already imported.
  if (!fromHtmlAttempted) {
    fromHtmlAttempted = true;
    // Kick off the import; result will be available on subsequent calls.
    getFromHtml().then((mod) => { fromHtmlResolved = mod; });
  }
  if (fromHtmlResolved) {
    try {
      const hastRoot = fromHtmlResolved.fromHtml(svgString, { fragment: true });
      return hastRoot.children.filter(
        (child: { type: string }): child is ElementContent =>
          child.type === 'element' || child.type === 'text'
      );
    } catch {
      // Fall through to manual parser
    }
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
  if (data.showTitle !== false && data.calloutTitle) {
    headerChildren.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['callout-title'] },
      children: [
        {
          type: 'text',
          value: data.calloutTitle,
        } as HastText,
      ],
    });
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
