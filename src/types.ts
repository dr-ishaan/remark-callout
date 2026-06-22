import type { Properties } from 'hast';
import type { Parent } from 'mdast';

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
  /** oklch lightness component */
  colorL: number;
  /** oklch chroma component */
  colorC: number;
  /** oklch hue component */
  colorH: number;
}

/**
 * Options passed to the remark-callout plugin.
 */
export interface CalloutOptions {
  /**
   * Custom callout type definitions.
   * Keys are the type name (lowercase), matched against `[!KEY]`.
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
   * Tag name for the callout container.
   * @default 'div'
   */
  tag?: string;
  /**
   * Custom icon mapping. Keys are type names, values are SVG strings.
   * Overrides the built-in icon for that type.
   */
  icons?: Record<string, string>;
  /**
   * Custom title mapping. Keys are type names, values are title strings.
   * Overrides the built-in default title for that type.
   */
  titles?: Record<string, string>;
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
}

/**
 * Custom MDAST node for a callout.
 */
export interface CalloutNode extends Parent {
  type: 'callout';
  data: {
    calloutType: string;
    calloutTitle: string;
    calloutIcon: string;
    foldable: Foldable;
    hName: string;
    hProperties: Properties;
  };
}

/**
 * Parsed result from the callout marker line.
 */
export interface ParsedCallout {
  /** Lowercase type key (e.g., 'note', 'warning') */
  type: string;
  /** Custom title (empty string if none) */
  title: string;
  /** Foldable state */
  foldable: Foldable;
  /** Length of the full marker including title, for slicing the text node */
  markerLength: number;
}
