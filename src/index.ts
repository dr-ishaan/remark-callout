/**
 * remark-callout
 *
 * A remark plugin for the unified pipeline that transforms callout blockquotes
 * (GitHub / Obsidian style) into styled HTML containers.
 *
 * Syntax:
 *   > [!NOTE]
 *   > Content here.
 *
 *   > [!WARNING] Custom title
 *   > Multi-line content.
 *
 *   > [!TIP]+
 *   > Collapsible, open by default.
 *
 *   > [!DANGER]-
 *   > Collapsible, closed by default.
 */

import type { Plugin } from 'unified';
import type { Root, Parent } from 'mdast';
import type { CalloutOptions, CalloutNode, Foldable } from './types.js';
import { resolveConfig, remarkCalloutTransformer } from './transform.js';
import { calloutToHast } from './to-hast.js';
import { BUILT_IN_CALLOUTS } from './defaults.js';

export { calloutToHast } from './to-hast.js';
export type { CalloutOptions, CalloutNode, CalloutTypeConfig, Foldable, ParsedCallout, ParsedAccordion, ResolvedConfig } from './types.js';
export { BUILT_IN_CALLOUTS, BUILT_IN_KEYS } from './defaults.js';

/**
 * @deprecated since v3.0 — use `useNativeHast: true` (now the default) instead.
 *
 * `calloutToHast` is the legacy HAST handler required in v1.x and v2.x when
 * wiring the plugin into `remark-rehype`:
 *
 * ```ts
 * // LEGACY (v1.x, v2.x) — still works but deprecated
 * .use(remarkCallout, { useNativeHast: false })
 * .use(remarkRehype, { handlers: { callout: calloutToHast } })
 * ```
 *
 * In v3.0+, native HAST mode is the default and no handler is needed:
 *
 * ```ts
 * // MODERN (v3.0+) — no handler required
 * .use(remarkCallout)
 * .use(remarkRehype)
 * ```
 *
 * The `calloutToHast` export will be removed in v4.0.
 */

/**
 * Create a callout MDAST node programmatically, for injection into the tree
 * from frontmatter, data files, or any non-markdown source.
 *
 * The returned node has the same shape as a marker-parsed callout and will
 * be rendered identically by `calloutToHast`.
 *
 * @example
 * ```ts
 * import { createCalloutNode } from 'remark-callout-plus'
 *
 * const node = createCalloutNode('note', {
 *   title: 'Generated from frontmatter',
 *   children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Body text' }] }],
 * })
 *
 * // Inject into the tree via a custom remark plugin
 * const injectFromFrontmatter = () => (tree) => {
 *   tree.children.unshift(node)
 * }
 * ```
 */
export function createCalloutNode(
  type: string,
  opts: {
    title?: string;
    icon?: string;
    foldable?: Foldable;
    id?: string;
    children?: Parent['children'];
  } = {}
): CalloutNode {
  const typeConfig = BUILT_IN_CALLOUTS[type.toLowerCase()];
  const icon = opts.icon ?? typeConfig?.icon ?? BUILT_IN_CALLOUTS.note.icon;
  const colorL = typeConfig?.colorL ?? 0.55;
  const colorC = typeConfig?.colorC ?? 0.18;
  const colorH = typeConfig?.colorH ?? 250;

  return {
    type: 'callout' as const,
    data: {
      calloutType: type.toLowerCase(),
      calloutTitle: opts.title ?? typeConfig?.defaultTitle ?? type,
      calloutIcon: icon,
      foldable: opts.foldable ?? false,
      showTitle: true,
      showIcon: true,
      hName: opts.foldable ? 'details' : 'div',
      hProperties: {
        style: `--callout-l: ${colorL}; --callout-c: ${colorC}; --callout-h: ${colorH};`,
      },
      calloutId: opts.id,
    },
    children: opts.children ?? [],
  };
}

/**
 * Remark plugin to transform callout blockquotes into styled containers.
 *
 * @param options - Plugin options (all optional).
 *
 * @example
 * ```ts
 * import { unified } from 'unified'
 * import remarkParse from 'remark-parse'
 * import remarkCallout, { calloutToHast } from 'remark-callout'
 * import remarkRehype from 'remark-rehype'
 * import rehypeStringify from 'rehype-stringify'
 *
 * const result = unified()
 *   .use(remarkParse)
 *   .use(remarkCallout, {
 *     callouts: {
 *       machinelearning: {
 *         defaultTitle: 'Machine Learning',
 *         icon: '<svg>...</svg>',
 *         colorL: 0.55,
 *         colorC: 0.20,
 *         colorH: 300,
 *       },
 *     },
 *   })
 *   .use(remarkRehype, { handlers: { callout: calloutToHast } })
 *   .use(rehypeStringify)
 *   .processSync('> [!ML] This is a custom callout')
 * ```
 *
 * **Important:** You MUST pass `{ handlers: { callout: calloutToHast } }` to
 * `remark-rehype`. Without it, callouts render as empty `<div>`s with no
 * header, body, or icon.
 */
const remarkCallout: Plugin<[CalloutOptions?], Root> = function (options) {
  const config = resolveConfig(options);

  return (tree: Root) => {
    remarkCalloutTransformer(tree, config);
  };
};

export default remarkCallout;
