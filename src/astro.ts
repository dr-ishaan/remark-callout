/**
 * Astro integration for remark-callout-plus.
 *
 * One-line setup that auto-detects the active Markdown engine (Sätteri or
 * unified) and wires the correct plugin path:
 *
 *   - On Astro 7's default Sätteri engine (`@astrojs/markdown-satteri`),
 *     the integration injects the Sätteri MDAST plugin via
 *     `markdown.processor.options.mdastPlugins`. The Sätteri plugin uses
 *     Sätteri's visitor API (`blockquote(node, ctx)`, `ctx.replaceNode`)
 *     and the same native-HAST data mechanism (`data.hName`/`hProperties`)
 *     that Sätteri honors identically to remark-rehype.
 *
 *   - On the unified engine (`@astrojs/markdown-remark`, the Astro 6
 *     default and Astro 7 fallback), the integration adds the remark
 *     plugin to `markdown.remarkPlugins` and the legacy `calloutToHast`
 *     handler to `markdown.remarkRehype.handlers`.
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
 *
 * @since v3.2.0  Auto-detects Sätteri (Astro 7 default) vs unified.
 */

import remarkCallout, { calloutToHast } from './index.js';
import { calloutSatteri } from './satteri.js';
import type { CalloutOptions } from './types.js';

// We avoid importing 'astro' as a hard dependency — consumers who install
// this integration will have astro in their node_modules. The return type
// is loosely typed as `any` to avoid a devDependency on astro.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function calloutPlus(options?: CalloutOptions): any {
  return {
    name: 'remark-callout-plus',
    hooks: {
      'astro:config:setup'({ config, updateConfig }: any) {
        const markdown = config.markdown ?? {};

        // ── Detect the active Markdown engine ──────────────────────────
        //
        // Astro 7's `markdown.processor` is an object with a `name` field.
        //   - Sätteri:    name === 'satteri' (from `@astrojs/markdown-satteri`)
        //   - Unified:    name === 'unified-remark' (from `@astrojs/markdown-remark`)
        //   - Astro 6:    `markdown.processor` is undefined; the unified
        //                  pipeline is implied and `markdown.remarkPlugins`
        //                  is the active config surface.
        //
        // We branch on this to wire the correct plugin path. If the
        // processor is unknown (third-party), we fall back to the unified
        // path and emit a dev-mode warning so consumers know to file an
        // issue if their engine isn't supported.

        const processorName: string | undefined = markdown.processor?.name;
        const isSatteri = processorName === 'satteri';
        const isUnified = !processorName || processorName === 'unified-remark';

        if (isSatteri) {
          // ── Sätteri path ─────────────────────────────────────────────
          //
          // Astro 7's `satteri()` factory returns a processor object whose
          // `createRenderer(shared)` closure reads `processor.options.mdastPlugins`
          // at render time (not at factory time). So we can mutate
          // `processor.options.mdastPlugins` in place and the change will
          // be picked up when Astro renders markdown pages.
          //
          // IMPORTANT: We must NOT use `updateConfig({ markdown: { processor: ... } })`
          // here. Astro's `mergeConfig` has a special case for `markdown.processor`:
          // when the new value has a `createRenderer` function, the entire
          // processor is REPLACED (not merged). This would discard the
          // original `createRenderer` closure (which reads the original
          // options) and silently break the integration.
          //
          // Instead, we mutate `config.markdown.processor.options.mdastPlugins`
          // directly. The closure in the original `createRenderer` reads
          // this array at render time, so our addition is picked up.

          const processorOptions = markdown.processor?.options;
          if (!processorOptions) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                `[remark-callout-plus] Sätteri processor has no options.mdastPlugins. ` +
                  `The plugin will not run. Please file an issue at ` +
                  `https://github.com/dr-ishaan/remark-callout/issues.`
              );
            }
            return;
          }

          const existingMdastPlugins: any[] = processorOptions.mdastPlugins ?? [];
          const hasPlugin = existingMdastPlugins.some(
            (p: any) => p?.name === 'remark-callout-plus'
          );

          if (!hasPlugin) {
            existingMdastPlugins.push(calloutSatteri(options ?? {}));
          }

          // No updateConfig call needed — we mutated the options object
          // that the existing createRenderer closure already references.
          return;
        }

        if (!isUnified) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `[remark-callout-plus] Unrecognized markdown.processor "${processorName}". ` +
                `Falling back to the unified/remark plugin path. If your engine is ` +
                `Sätteri-compatible, please file an issue at ` +
                `https://github.com/dr-ishaan/remark-callout/issues.`
            );
          }
        }

        // ── Unified/remark path (Astro 6 default, Astro 7 fallback) ────
        //
        // 1. Add the remark plugin (if not already present).
        // 2. Add the calloutToHast handler to remarkRehype.handlers.

        const hasPlugin = (markdown.remarkPlugins ?? []).some(
          (p: any) =>
            p === remarkCallout || (Array.isArray(p) && p[0] === remarkCallout)
        );

        const remarkPlugins = hasPlugin
          ? markdown.remarkPlugins ?? []
          : [...(markdown.remarkPlugins ?? []), [remarkCallout, options ?? {}]];

        const existingRehypeOptions = markdown.remarkRehype ?? {};
        const remarkRehype = {
          ...existingRehypeOptions,
          handlers: {
            ...(existingRehypeOptions as any)?.handlers,
            callout: calloutToHast,
          },
        };

        updateConfig({
          markdown: {
            ...markdown,
            remarkPlugins,
            remarkRehype,
          },
        });
      },
    },
  };
}
