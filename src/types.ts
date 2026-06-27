import type { Properties } from 'hast';
import type { Parent, PhrasingContent } from 'mdast';

/**
 * Foldable state for a callout.
 * - `false` — not foldable (default)
 * - `'open'` — collapsible, expanded by default (`[!NOTE]+`)
 * - `'closed'` — collapsible, collapsed by default (`[!NOTE]-`)
 */
export type Foldable = false | 'open' | 'closed';

/**
 * Configuration for a single callout type.
 */
export interface CalloutTypeConfig {
  /** Default title when no custom title is provided */
  defaultTitle: string;
  /** Inline SVG string (stroke-based, 24x24 viewBox, uses currentColor) */
  icon: string;
  /** oklch lightness component (0–1) or a CSS var string like 'var(--brand-l)' */
  colorL: number | string;
  /** oklch chroma component (0–0.4) or a CSS var string like 'var(--brand-c)' */
  colorC: number | string;
  /** oklch hue component (0–360) or a CSS var string like 'var(--brand-h)' */
  colorH: number | string;
}

/**
 * Options passed to the remark-callout plugin.
 */
export interface CalloutOptions {
  /**
   * Custom callout type definitions.
   * Keys are matched case-insensitively against `[!KEY]` markers.
   * Values override the built-in defaults for that type, or define new types.
   */
  callouts?: Record<string, Partial<Omit<CalloutTypeConfig, 'defaultTitle'>> & { defaultTitle?: string }>;
  /**
   * Whether to show the callout title header.
   * @default true
   */
  showTitle?: boolean;
  /**
   * Whether to show the icon.
   * @default true
   */
  showIcon?: boolean;
  /**
   * Whether to enable collapsible callout syntax (`+` / `-`).
   * @default true
   */
  enableFoldable?: boolean;
  /**
   * Whether to disable all built-in callout types.
   * Use this if you want to define all types yourself via `callouts`.
   * @default false
   */
  disableBuiltins?: boolean;
  /**
   * Tag name for the callout container (only used for non-foldable callouts;
   * foldable callouts always use `<details>`).
   * @default 'div'
   */
  tag?: string;
  /**
   * Custom icon mapping. Keys are type names (case-insensitive), values are
   * SVG strings. Overrides the built-in icon for that type. If the key does
   * not yet exist in `types` (e.g., when `disableBuiltins: true`), a stub
   * type entry is auto-created so the override still takes effect.
   */
  icons?: Record<string, string>;
  /**
   * Custom title mapping. Keys are type names (case-insensitive), values are
   * title strings. Overrides the built-in default title for that type. If
   * the key does not yet exist in `types`, a stub type entry is auto-created.
   */
  titles?: Record<string, string>;
  /**
   * Whitelist of callout types that should render as callouts.
   * Any type not in this list falls through to a plain blockquote.
   * Literary types (epigraph, pullquote, pull, aside, sidebar) and
   * accordions are NOT affected by this filter — they always render.
   *
   * When unset (default), all built-in + custom types render.
   *
   * @example
   * // Only render note, warning, tip as callouts; everything else is a blockquote
   * remarkCallout({ types: ['note', 'warning', 'tip'] })
   *
   * @default undefined (all types allowed)
   */
  types?: string[];

  /**
   * Callback invoked when an unknown callout type is encountered (not in
   * `types` config and not a literary/accordion type).
   *
   * - If the function returns a `Callout` object, the callout is rendered
   *   using the returned type's config (allowing runtime type remapping).
   * - If the function returns `undefined`, the callout falls through to a
   *   plain blockquote (no callout rendering).
   * - If unset, the default behavior is used: unknown types render as
   *   callouts with default styling (note colors/icon) and a dev-mode
   *   warning is logged.
   *
   * @example
   * // Remap unknown types to 'note', or drop them
   * remarkCallout({
   *   onUnknownCallout: (callout) => {
   *     if (callout.type === 'experimental') return { ...callout, type: 'note' };
   *     return undefined; // fall back to plain blockquote
   *   },
   * })
   *
   * @since v1.3.0
   */
  onUnknownCallout?: (callout: { type: string; title?: string; foldable: Foldable; id?: string }) =>
    { type: string; title?: string; foldable: Foldable; id?: string } | undefined;

  /**
   * Callback to dynamically resolve the icon for a callout type.
   * Takes precedence over the static `icons` map and built-in defaults.
   *
   * @example
   * remarkCallout({
   *   icon: (callout) => callout.type === 'warning' ? '<svg>...</svg>' : '<svg>...</svg>',
   * })
   *
   * @since v1.3.0
   */
  icon?: (callout: { type: string; title?: string; foldable: Foldable }) => string;

  /**
   * Callback to dynamically resolve the default title for a callout type.
   * Takes precedence over the static `titles` map and built-in defaults.
   *
   * @example
   * remarkCallout({
   *   title: (callout) => callout.type.toUpperCase(),
   * })
   *
   * @since v1.3.0
   */
  title?: (callout: { type: string; title?: string; foldable: Foldable }) => string;

  /**
   * Callback to dynamically resolve the root element tag name for a
   * callout. Takes precedence over the static `tag` option.
   *
   * Note: foldable callouts always use `<details>` regardless of this
   * callback (native HTML open/close behavior requires it).
   *
   * @example
   * remarkCallout({
   *   root: (callout) => callout.type === 'note' ? 'aside' : 'div',
   * })
   *
   * @since v1.3.0
   */
  root?: (callout: { type: string; title?: string; foldable: Foldable }) => string;

  /**
   * When `true`, the plugin sets `hName`/`hProperties`/`hChildren` data on
   * MDAST nodes instead of creating a custom `callout` node type. This
   * eliminates the need to wire `calloutToHast` into `remark-rehype` —
   * consumers can use `.use(remarkRehype)` with default config.
   *
   * **Current limitation:** Only standard callouts (note/warning/tip/etc.)
   * and foldable callouts support native HAST mode. Literary types
   * (epigraph/pullquote/aside/sidebar), structured-data types (bio/event),
   * and accordions still use the custom `callout` node type and require
   * the `calloutToHast` handler.
   *
   * When `false` (default), all callout types create custom `callout` MDAST
   * nodes and require `{ handlers: { callout: calloutToHast } }` in
   * `remark-rehype`.
   *
   * @default false
   * @since v1.3.0
   */
  useNativeHast?: boolean;
}

/**
 * Resolved configuration after merging defaults with user options.
 */
export interface ResolvedConfig {
  types: Record<string, CalloutTypeConfig>;
  showTitle: boolean;
  showIcon: boolean;
  enableFoldable: boolean;
  tag: string;
  /**
   * Whitelist of callout types that render as callouts (lowercase).
   * When null, all types are allowed. When set, types not in this list
   * fall through to plain blockquotes. Literary types and accordions
   * are always allowed regardless of this setting.
   */
  allowedTypes: Set<string> | null;
  /** Callback for unknown callout types (v1.3.0+) */
  onUnknownCallout?: (callout: { type: string; title?: string; foldable: Foldable; id?: string }) =>
    { type: string; title?: string; foldable: Foldable; id?: string } | undefined;
  /** Callback to dynamically resolve icon (v1.3.0+) */
  icon?: (callout: { type: string; title?: string; foldable: Foldable }) => string;
  /** Callback to dynamically resolve title (v1.3.0+) */
  title?: (callout: { type: string; title?: string; foldable: Foldable }) => string;
  /** Callback to dynamically resolve root tag (v1.3.0+) */
  root?: (callout: { type: string; title?: string; foldable: Foldable }) => string;
  /** Use native HAST (hName/hProperties) instead of custom callout node (v1.3.0+) */
  useNativeHast: boolean;
}

/**
 * Custom MDAST node for a callout.
 *
 * The `accordionGroupId` field is only set for accordion panels (when
 * `calloutType === 'accordion'`); it's assigned during the post-transform
 * adjacency pass in `groupAdjacentAccordions`.
 */
export interface CalloutNode extends Parent {
  type: 'callout';
  data: {
    calloutType: string;
    /** Plain-text title (used when calloutTitleNodes is empty/undefined) */
    calloutTitle: string;
    /** Rich title nodes (inline MDAST). When non-empty, rendered via state.all
     *  into the title span instead of calloutTitle text. */
    calloutTitleNodes?: PhrasingContent[];
    calloutIcon: string;
    foldable: Foldable;
    showTitle: boolean;
    showIcon: boolean;
    hName: string;
    hProperties: Properties;
    /** Group ID for exclusive expansion — only set for accordion panels */
    accordionGroupId?: string;
    /** Custom anchor ID from {#id} syntax — rendered as `id` attribute */
    calloutId?: string;
  };
}

/**
 * Parsed result from the callout marker line.
 */
export interface ParsedCallout {
  /** Lowercase type key (e.g., 'note', 'warning') */
  type: string;
  /** Custom title (empty string if none) — plain text portion only */
  title: string;
  /** Rich title nodes (inline MDAST from the marker line). Empty if the
   *  marker line had no inline content after the marker text. */
  titleNodes: PhrasingContent[];
  /** Foldable state */
  foldable: Foldable;
  /** Length of the full marker including title, for slicing the text node */
  markerLength: number;
  /** Custom anchor ID extracted from {#id} syntax, or undefined if none */
  id?: string;
}

/**
 * Parsed result from an accordion marker line (`[!!]` or `[! icon !]`).
 *
 * Accordions are a separate family from callouts:
 *   - The marker is `[!!]` (bare) or `[! icon !]` (shorthand with icon).
 *   - An optional icon can be an emoji or an inline SVG string.
 *   - The remaining text after the optional icon token is the panel title.
 *   - `+` / `-` after the marker controls open/closed state (default: closed).
 *   - Adjacent accordion panels form a group with exclusive expansion via
 *     native `<details name="...">`.
 */
export interface ParsedAccordion {
  /** Custom icon (emoji string or inline SVG string), or '' if none */
  icon: string;
  /** Panel title (empty string if none) */
  title: string;
  /** Foldable state — accordions default to 'closed' */
  foldable: 'open' | 'closed';
  /** Length of the full marker (including icon spec + title) for slicing */
  markerLength: number;
  /** Custom anchor ID extracted from {#id} syntax, or undefined if none */
  id?: string;
}
