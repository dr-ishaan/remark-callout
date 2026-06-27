/**
 * Sätteri adapter for remark-callout-plus.
 *
 * Sätteri is Astro 7's new default Markdown engine (Rust-based, via
 * `@astrojs/markdown-satteri`). It exposes a TypeScript-level plugin API
 * (`MdastPluginDefinition`) that is conceptually similar to unified/remark,
 * but with a few key differences:
 *
 *   1. Plugins are objects with per-node-type visitor functions
 *      (`blockquote(node, ctx)`, `paragraph(node, ctx)`, etc.), not the
 *      `(tree) => void` transformer signature used by unified.
 *   2. Mutations go through a context object (`ctx.replaceNode`,
 *      `ctx.setProperty`, `ctx.parent`, `ctx.indexOf`) rather than direct
 *      in-place edits to the MDAST tree. This is because Sätteri keeps the
 *      authoritative tree in a Rust arena and materializes JS proxies on
 *      demand; mutations are recorded into a command buffer and applied
 *      after the visitor returns.
 *   3. There is no `root` visitor — `VISITOR_KEYS` skips the root node.
 *      Tree-wide post-passes (like adjacency grouping) must be done inside
 *      per-node-type visitors using `ctx.data` as a side-channel.
 *
 * Despite these differences, Sätteri honors the same `data.hName` /
 * `data.hProperties` / `data.hChildren` fields that `remark-rehype` uses for
 * native HAST mode. This means the existing `transformBlockquoteNative` &
 * friends in `transform.ts` produce MDAST subtrees that Sätteri converts to
 * the exact same HTML as the unified pipeline — no HAST-side adaptation
 * needed.
 *
 * This adapter therefore:
 *   - Reuses every parsing/extraction helper from `transform.ts` verbatim
 *     (they are pure functions operating on plain MDAST nodes).
 *   - Reuses the native-HAST transformer functions (`transformBlockquoteNative`,
 *     `transformLiteraryNative`, `transformAsideNative`,
 *     `transformAccordionNative`, `transformStructuredNative`) verbatim —
 *     they return plain MDAST subtrees with `data.hName`/`hProperties`,
 *     which Sätteri consumes identically to remark-rehype.
 *   - Replaces the tree-walk + array-splice strategy from
 *     `remarkCalloutTransformer` with a single Sätteri `blockquote` visitor
 *     that calls `ctx.replaceNode`.
 *   - Replaces the `groupAdjacentAccordions` post-pass with a side-channel
 *     approach: the `blockquote` visitor assigns group IDs by reading
 *     `ctx.data.calloutAccordionState`, and a `paragraph`/`heading`/etc.
 *     visitor resets the state when a non-blockquote top-level node
 *     interrupts an accordion run.
 *
 * Usage in Astro 7 (via `@astrojs/markdown-satteri`):
 *
 * ```ts
 * // astro.config.mjs
 * import { defineConfig } from 'astro/config'
 * import { satteri } from '@astrojs/markdown-satteri'
 * import { calloutSatteri } from 'remark-callout-plus/satteri'
 *
 * export default defineConfig({
 *   markdown: {
 *     processor: satteri({
 *       mdastPlugins: [calloutSatteri()],
 *     }),
 *   },
 * })
 * ```
 *
 * Or via the auto-detecting Astro integration (recommended):
 *
 * ```ts
 * import { defineConfig } from 'astro/config'
 * import calloutPlus from 'remark-callout-plus/astro'
 *
 * export default defineConfig({
 *   integrations: [calloutPlus()],
 * })
 * ```
 *
 * The integration detects whether the consumer is on Sätteri or unified and
 * wires the correct plugin automatically.
 *
 * @since v3.2.0
 */

import type { Blockquote, Paragraph } from 'mdast';
import type { CalloutOptions, ResolvedConfig, ParsedCallout, ParsedAccordion } from './types.js';
import {
  resolveConfig,
  parseCalloutMarker,
  parseAccordionMarker,
  isCalloutBlockquote,
  tryParseAccordionParagraph,
  transformAccordionBlockquote,
  transformBlockquote,
} from './transform.js';
import type { MdastPluginDefinition } from 'satteri';

/**
 * State carried across visitor calls via `ctx.data` so that adjacent
 * accordion panels can be assigned the same `name` attribute for native
 * exclusive expansion.
 *
 * Sätteri's visitor pattern fires one call per matching node in document
 * order. We use this side-channel to detect runs of consecutive accordion
 * blockquotes at the same parent level.
 */
interface AccordionState {
  /** Monotonic counter for generating unique group IDs. */
  counter: number;
  /**
   * The group ID assigned to the most recent accordion panel, or `null` if
   * the last top-level node was not an accordion (broken the run).
   */
  lastGroupId: string | null;
}

const ACCORDION_STATE_KEY = '__remarkCalloutPlusAccordionState';

/**
 * Check whether a node is a top-level child of the root (i.e., its parent
 * is the root). Used to distinguish paragraphs that are siblings of
 * blockquotes from paragraphs nested INSIDE blockquotes (which should not
 * break an accordion run).
 *
 * Sätteri exposes `ctx.parent(node)` returning the materialized parent
 * node. We compare its `type` to `'root'`.
 */
function isTopLevel(node: any, ctx: any): boolean {
  const parent = ctx.parent(node);
  return parent?.type === 'root';
}

/**
 * Build a Sätteri MDAST plugin definition that transforms callout/accordion
 * blockquotes into styled HTML containers.
 *
 * @param options - Same options accepted by the unified `remarkCallout` plugin.
 * @returns A `MdastPluginDefinition` ready to be passed to
 *          `satteri({ mdastPlugins: [...] })` or
 *          `@astrojs/markdown-satteri`'s `satteri({ mdastPlugins: [...] })`.
 *
 * @example
 * ```ts
 * import { satteri } from '@astrojs/markdown-satteri'
 * import { calloutSatteri } from 'remark-callout-plus/satteri'
 *
 * satteri({
 *   mdastPlugins: [calloutSatteri({ callouts: { brand: { ... } } })],
 * })
 * ```
 */
export function calloutSatteri(
  options: CalloutOptions = {}
): MdastPluginDefinition {
  const config = resolveConfig(options);
  const literaryTypes = new Set(['epigraph', 'pullquote', 'pull', 'aside', 'sidebar']);

  // Dev-mode warning helper (mirrors the one in remarkCalloutTransformer).
  const warnedTypes = new Set<string>();
  const warnUnknownType = (type: string, willRender: boolean) => {
    if (process.env.NODE_ENV === 'production') return;
    if (warnedTypes.has(type)) return;
    warnedTypes.add(type);
    // Levenshtein "did you mean" suggestion is computed inside transform.ts
    // via findClosestType. We don't have direct access here, so the warning
    // is shorter. The full suggestion logic still runs when transformBlockquote
    // is called for the actual rendering.
    const action = willRender
      ? 'Rendering with default styling (note colors/icon).'
      : 'Falling back to plain blockquote.';
    console.warn(`[remark-callout-plus] Unknown callout type "${type}". ${action}`);
  };

  // ── Blockquote visitor ────────────────────────────────────────────────
  //
  // This is the core transformation entry point. It fires once per
  // blockquote node in document order. For each blockquote, we:
  //   1. Check if it's an accordion (`[!!]` or `[! icon !]`).
  //   2. If yes, transform it (may produce multiple sibling panels if the
  //      blockquote contains multiple markers) and assign group IDs via
  //      the ctx.data side-channel.
  //   3. If no, check if it's a callout (`[!TYPE]`).
  //   4. If yes, transform it via the existing transformBlockquote, which
  //      returns a CalloutNode with native-HAST data.
  //   5. Replace the original blockquote with the new node via ctx.replaceNode.
  //
  // The literary-types whitelist, onUnknownCallout callback, and the
  // `useNativeHast: true` default are all respected because we delegate to
  // the existing transformBlockquote function.

  const blockquoteVisitor = (node: Blockquote, ctx: any) => {
    // Skip if not at top level? NO — callouts can be nested inside list
    // items, table cells, etc. The visitor fires for blockquotes at any
    // depth. We do, however, only group adjacent accordions at the same
    // parent level (handled by the side-channel state below).

    // Initialize accordion state if not yet present.
    if (!ctx.data[ACCORDION_STATE_KEY]) {
      ctx.data[ACCORDION_STATE_KEY] = {
        counter: 0,
        lastGroupId: null,
      } as AccordionState;
    }
    const state = ctx.data[ACCORDION_STATE_KEY] as AccordionState;

    // ── Accordion detection ──────────────────────────────────────────
    // Reuse the existing transformAccordionBlockquote helper. It scans the
    // blockquote for one or more `[!!]` markers and returns an array of
    // synthetic blockquote nodes (one per marker), each already transformed
    // via transformAccordionNative (which sets hName='details' with the
    // appropriate hProperties).
    //
    // The `useNativeHast: true` argument ensures we get the native-HAST
    // path (transformAccordionNative) rather than the legacy handler path.
    const accordionNodes = transformAccordionBlockquote(
      node,
      config.enableFoldable,
      /* useNativeHast */ true
    );

    if (accordionNodes && accordionNodes.length > 0) {
      // Assign group IDs to each panel.
      //
      // Adjacency rule (matches transform.ts groupAdjacentAccordions):
      // consecutive accordion panels at the same parent level share a group
      // ID. If the previous top-level node was also an accordion (i.e.,
      // state.lastGroupId is non-null), reuse the group ID. Otherwise,
      // start a new group.
      //
      // Note: Sätteri fires the visitor in document order, so by the time
      // we process the second panel of a run, state.lastGroupId has been
      // set by the first panel's visitor call.

      // Determine whether we should continue the previous run.
      //
      // Edge case: if a SINGLE blockquote contains multiple `[!!]` markers
      // (e.g., `> [!!] A\n> body\n>\n> [!!] B\n> body`), all panels in that
      // blockquote should share a group ID. transformAccordionBlockquote
      // returns them as a single array, so we handle that here by reusing
      // the same group ID for all panels from this one visitor call.
      let groupId: string | null = null;

      for (const panel of accordionNodes) {
        if (groupId === null) {
          // First panel of this visitor call — decide whether to continue
          // the previous run or start a new one.
          if (state.lastGroupId) {
            groupId = state.lastGroupId;
          } else {
            state.counter++;
            groupId = `accordion-group-${state.counter}`;
          }
          state.lastGroupId = groupId;
        }

        // Set the `name` attribute on the panel's hProperties.
        const panelAny = panel as any;
        if (panelAny.data?.hProperties) {
          panelAny.data.hProperties.name = groupId;
        }
      }

      // Replace the original blockquote with the array of panels.
      // Sätteri's replaceNode accepts a single new node; to splice multiple
      // siblings we use insertAfter for the extras.
      if (accordionNodes.length === 1) {
        ctx.replaceNode(node, accordionNodes[0]);
      } else {
        // Replace the first, then insert the rest after it.
        ctx.replaceNode(node, accordionNodes[0]);
        let prev = accordionNodes[0];
        for (let i = 1; i < accordionNodes.length; i++) {
          ctx.insertAfter(prev, accordionNodes[i]);
          prev = accordionNodes[i];
        }
      }
      return;
    }

    // ── Callout detection ────────────────────────────────────────────
    const parsed = isCalloutBlockquote(node, config.enableFoldable);
    if (!parsed) {
      // Not an accordion, not a callout — break any accordion run if this
      // blockquote is at the top level.
      if (isTopLevel(node, ctx)) {
        state.lastGroupId = null;
      }
      return;
    }

    // ── Whitelist enforcement (literary types always allowed) ────────
    const isLiterary = literaryTypes.has(parsed.type);
    if (config.allowedTypes && !config.allowedTypes.has(parsed.type) && !isLiterary) {
      // onUnknownCallout callback (v1.3.0+)
      if (config.onUnknownCallout) {
        const remapped = config.onUnknownCallout({
          type: parsed.type,
          title: parsed.title || undefined,
          foldable: parsed.foldable,
          id: parsed.id,
        });
        if (remapped) {
          parsed.type = remapped.type.toLowerCase();
          if (remapped.title !== undefined) parsed.title = remapped.title;
          parsed.foldable = remapped.foldable;
          parsed.id = remapped.id;
          const newNode = transformBlockquote(node, parsed, config);
          ctx.replaceNode(node, newNode as any);
          // Callouts break accordion runs at the top level.
          if (isTopLevel(node, ctx)) state.lastGroupId = null;
          return;
        }
      }
      // Warn for truly unknown types (not in config.types at all).
      if (!config.types[parsed.type]) {
        warnUnknownType(parsed.type, /* willRender */ false);
      }
      // Leave as plain blockquote.
      if (isTopLevel(node, ctx)) state.lastGroupId = null;
      return;
    }

    // Warn for unknown types even when no whitelist is set.
    if (
      !config.allowedTypes &&
      !config.types[parsed.type] &&
      !isLiterary
    ) {
      if (config.onUnknownCallout) {
        const remapped = config.onUnknownCallout({
          type: parsed.type,
          title: parsed.title || undefined,
          foldable: parsed.foldable,
          id: parsed.id,
        });
        if (remapped) {
          parsed.type = remapped.type.toLowerCase();
          if (remapped.title !== undefined) parsed.title = remapped.title;
          parsed.foldable = remapped.foldable;
          parsed.id = remapped.id;
          const newNode = transformBlockquote(node, parsed, config);
          ctx.replaceNode(node, newNode as any);
          if (isTopLevel(node, ctx)) state.lastGroupId = null;
          return;
        }
        // Consumer returned undefined → fall through to plain blockquote.
        if (isTopLevel(node, ctx)) state.lastGroupId = null;
        return;
      }
      warnUnknownType(parsed.type, /* willRender */ true);
    }

    // ── Transform the callout via the existing native-HAST transformer ──
    // transformBlockquote delegates to transformBlockquoteNative /
    // transformLiteraryNative / transformAsideNative /
    // transformStructuredNative based on the callout type, all of which
    // return MDAST nodes with `data.hName`/`hProperties` that Sätteri
    // consumes identically to remark-rehype.
    const newNode = transformBlockquote(node, parsed, config);
    ctx.replaceNode(node, newNode as any);

    // A callout between two accordions breaks the run.
    if (isTopLevel(node, ctx)) state.lastGroupId = null;
  };

  // ── "Run-breaker" visitors ────────────────────────────────────────────
  //
  // Any top-level non-blockquote content breaks an accordion run. We attach
  // no-op visitors to the most common block-level node types that signal a
  // run break. Sätteri fires these in document order, so the state update
  // is visible to the next blockquote visitor.
  //
  // Note: we only break the run if the node is at the TOP LEVEL (parent is
  // root). Paragraphs/headings/etc. INSIDE a blockquote don't break sibling
  // accordion runs at the outer level.
  const breakRun = (node: any, ctx: any) => {
    const state = ctx.data[ACCORDION_STATE_KEY] as AccordionState | undefined;
    if (state && isTopLevel(node, ctx)) {
      state.lastGroupId = null;
    }
  };

  return {
    name: 'remark-callout-plus',
    blockquote: blockquoteVisitor,
    paragraph: breakRun,
    heading: breakRun,
    code: breakRun,
    list: breakRun,
    thematicBreak: breakRun,
    html: breakRun,
    table: breakRun,
  } as MdastPluginDefinition;
}

/**
 * Factory variant that returns a fresh plugin instance per compile.
 *
 * Sätteri accepts plugin factories (`() => MdastPluginDefinition`) so that
 * closures reset per document. This is the recommended form for plugins
 * that carry per-compile state (like our accordion run counter).
 *
 * @example
 * ```ts
 * satteri({
 *   mdastPlugins: [calloutSatteriFactory({ callouts: { ... } })],
 * })
 * ```
 */
export function calloutSatteriFactory(
  options: CalloutOptions = {}
): () => MdastPluginDefinition {
  return () => calloutSatteri(options);
}

export default calloutSatteri;
