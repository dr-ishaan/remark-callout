/**
 * Astro integration for remark-callout-plus.
 *
 * One-line setup that handles:
 *   1. Adding the remark plugin to markdown.remarkPlugins
 *   2. Adding the calloutToHast handler to markdown.remarkRehype.handlers
 *   3. (CSS import is left to the user — it must go in a layout/global CSS)
 *
 * Usage in astro.config.mjs:
 *   import { defineConfig } from 'astro/config'
 *   import calloutPlus from 'remark-callout-plus/astro'
 *
 *   export default defineConfig({
 *     integrations: [calloutPlus()],
 *   })
 *
 * Then import the CSS once in your global stylesheet:
 *   @import 'remark-callout-plus/styles/callout.css';
 */

import remarkCallout, { calloutToHast } from './index.js';
import type { CalloutOptions } from './types.js';

// We avoid importing 'astro' as a hard dependency — consumers who install
// this integration will have astro in their node_modules. The return type
// is loosely typed as `any` to avoid a devDependency on astro.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function calloutPlus(options?: CalloutOptions): any {
  return {
    name: 'remark-callout-plus',
    hooks: {
      'config:setup'({ config, updateConfig }: any) {
        // 1. Add the remark plugin (if not already present)
        const hasPlugin = (config.markdown?.remarkPlugins ?? []).some(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p: any) => p === remarkCallout || (Array.isArray(p) && p[0] === remarkCallout)
        );

        const remarkPlugins = hasPlugin
          ? config.markdown?.remarkPlugins ?? []
          : [...(config.markdown?.remarkPlugins ?? []), [remarkCallout, options ?? {}]];

        // 2. Add the calloutToHast handler to remarkRehype
        const existingRehypeOptions = config.markdown?.remarkRehype ?? {};
        const remarkRehype = {
          ...existingRehypeOptions,
          handlers: {
            ...(existingRehypeOptions as any)?.handlers,
            callout: calloutToHast,
          },
        };

        updateConfig({
          markdown: {
            ...config.markdown,
            remarkPlugins,
            remarkRehype,
          },
        });
      },
    },
  };
}
