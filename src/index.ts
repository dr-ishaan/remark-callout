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
import type { Root } from 'mdast';
import type { CalloutOptions } from './types.js';
import { resolveConfig, remarkCalloutTransformer } from './transform.js';
import { calloutToHast } from './to-hast.js';

export { calloutToHast } from './to-hast.js';
export type { CalloutOptions, CalloutNode, CalloutTypeConfig, Foldable, ResolvedConfig } from './types.js';
export { BUILT_IN_CALLOUTS, BUILT_IN_KEYS } from './defaults.js';

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
 */
const remarkCallout: Plugin<[CalloutOptions?], Root> = function (options) {
  const config = resolveConfig(options);

  return (tree: Root) => {
    remarkCalloutTransformer(tree, config);
  };
};

export default remarkCallout;