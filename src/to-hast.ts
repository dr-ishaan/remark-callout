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
 */

import type { CalloutNode } from './types.js';
import type { Element, ElementContent, Properties, Text as HastText } from 'hast';
import type { State } from 'mdast-util-to-hast';

/**
 * Parse an inline SVG string into a HAST ElementContent array.
 *
 * Uses `hast-util-from-html` (part of the rehype ecosystem) so the SVG is
 * represented as proper HAST element nodes instead of a raw/escaped string.
 * Falls back to a simple manual parser for well-known SVG patterns if the
 * library is not available.
 */
function svgToHast(svgString: string): ElementContent[] {
  // Strategy 1: Use hast-util-from-html if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { fromHtml } = require('hast-util-from-html');
    const hastRoot = fromHtml(svgString, { fragment: true });
    return hastRoot.children.filter(
      (child: { type: string }): child is ElementContent =>
        child.type === 'element' || child.type === 'text'
    );
  } catch {
    // Strategy 2: Manual SVG parsing fallback for simple inline SVGs
    return parseSvgManual(svgString);
  }
}

/**
 * Minimal manual SVG-to-HAST parser for the specific SVG format produced by
 * the `svg()` template in defaults.ts:
 *   <svg xmlns="..." width="16" height="16" viewBox="0 0 24 24" ...>paths</svg>
 *
 * This avoids requiring `linkedom` or `jsdom` as a dependency. It handles
 * the self-closing void SVG elements (circle, line, polyline, polygon, rect,
 * path, ellipse) and nested text content.
 */
function parseSvgManual(svgString: string): ElementContent[] {
  // Extract the <svg ...> opening tag and its attributes
  const openTagMatch = svgString.match(/^<svg\s+([^>]*)>/i);
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
 * into a Properties object.
 */
function parseAttributes(attrString: string): Properties {
  const props: Properties = {};
  const re = /(\w[\w-]*)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrString)) !== null) {
    props[match[1]] = match[2];
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
        // Find closing tag
        const closeTag = `</${tagName}>`;
        const closeIdx = remaining.indexOf(closeTag, openMatch[0].length);
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
 * `.applyData()` methods).  Typed loosely as `any` to avoid coupling to a
 * specific version of mdast-util-to-hast.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calloutToHast(state: any, node: CalloutNode): Element {
  const data = node.data;
  const isFoldable = data.foldable !== false;
  const isClosed = data.foldable === 'closed';
  const tagName = isFoldable ? 'details' : (data.hName as string) || 'div';

  // ── Build header children ──────────────────────────────────────────────

  const headerChildren: ElementContent[] = [];

  // Icon — parse SVG string into proper HAST elements so it renders
  // correctly without requiring `allowDangerousHtml` on the stringifier.
  if (data.calloutIcon) {
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

  // Title
  if (data.calloutTitle) {
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
  const bodyChildren: ElementContent[] = state.all
    ? (state.all(node) as ElementContent[])
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
    ],
    'data-callout': data.calloutType,
    ...(isFoldable ? { 'data-callout-fold': isClosed ? 'closed' : 'open' } : {}),
    ...(data.hProperties?.style ? { style: data.hProperties.style as string } : {}),
  };

  const result: Element = {
    type: 'element',
    tagName,
    properties,
    children: [header, body],
  };

  // If foldable and open, add the `open` attribute to <details>.
  // Must be `true` (boolean), NOT `''` (empty string) — rehype-stringify
  // drops boolean attributes whose value is an empty string, but keeps
  // them when the value is `true`. Without this, <details> renders without
  // `open` and appears collapsed despite `data-callout-fold="open"`.
  if (isFoldable && !isClosed) {
    result.properties.open = true;
  }

  // Apply position info and any extra hProperties from the node
  if (state.patch) state.patch(node, result);
  if (state.applyData) return state.applyData(node, result) as Element;

  return result;
}
