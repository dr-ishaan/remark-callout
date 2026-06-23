# remark-callout

[![npm version](https://img.shields.io/npm/v/remark-callout.svg)](https://www.npmjs.com/package/remark-callout)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [remark](https://github.com/remarkjs/remark) plugin for the unified pipeline that transforms GitHub/Obsidian-style callout blockquotes into styled HTML containers — with SVG icons, oklch colors, and optional collapsible support.

## Syntax

```markdown
> [!NOTE]
> Simple note body.

> [!WARNING] Custom title
> Multi-line content.

> [!TIP]+
> Collapsible, open by default.

> [!DANGER]-
> Collapsible, closed by default.
```

## Features

- **206 built-in callout types** across 12 color families (note, tip, warning, danger, success, question, info, example, abstract, quote, bug, best-practice, …)
- **SVG icons** — Lucide-style, 24×24 viewBox, stroke-based, using `currentColor`
- **oklch colors** — perceptually uniform, automatic dark mode via `prefers-color-scheme`
- **Collapsible callouts** — native `<details>`/`<summary>` with `+` (open) / `-` (closed) syntax, zero JavaScript
- **Case-insensitive** type matching — `[!NOTE]`, `[!note]`, `[!NoTe]` all work
- **Hyphenated types** — `[!BEST-PRACTICE]`, `[!RATE-LIMIT]`, `[!CI-CD]`
- **Custom callout types** — define your own with `callouts`, `icons`, `titles` options
- **Single-pass recursive transformer** — handles arbitrarily deep nesting with no cap

## Install

```bash
npm install remark-callout
```

## Usage

```ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkCallout, { calloutToHast } from 'remark-callout'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

// Import the default stylesheet (Astro / Vite / any CSS-aware bundler)
import 'remark-callout/styles/callout.css'

const result = unified()
  .use(remarkParse)
  .use(remarkCallout)
  .use(remarkRehype, { handlers: { callout: calloutToHast } })
  .use(rehypeStringify)
  .processSync('> [!NOTE]\n> Hello world')

console.log(String(result))
```

> **Important:** You MUST pass `{ handlers: { callout: calloutToHast } }` to `remark-rehype`. Without it, callouts render as empty `<div>`s with no header, body, or icon.

## Options

```ts
remarkCallout({
  // Custom callout type definitions (keys are case-insensitive)
  callouts: {
    myType: {
      defaultTitle: 'My Type',
      icon: '<svg>...</svg>',
      colorL: 0.55,  // oklch lightness (0–1)
      colorC: 0.18,  // oklch chroma  (0–0.4)
      colorH: 300,   // oklch hue      (0–360)
    },
  },

  // Override icons for existing types (auto-creates a stub type if missing)
  icons: {
    note: '<svg>...</svg>',
  },

  // Override default titles for existing types
  titles: {
    note: 'Heads Up',
  },

  // Hide the title or icon span entirely
  showTitle: true,   // default
  showIcon:  true,   // default

  // Enable collapsible syntax (+ / -). Default: true.
  enableFoldable: true,

  // Disable all built-in types (use with `callouts` to define everything yourself)
  disableBuiltins: false,

  // Tag name for non-foldable callout container. Default: 'div'.
  // (Foldable callouts always use <details>.)
  tag: 'div',
})
```

## Output HTML

### Non-foldable callout

```markdown
> [!NOTE]
> Body text.
```

```html
<div class="callout callout-note" data-callout="note"
     style="--callout-l: 0.55; --callout-c: 0.18; --callout-h: 250;">
  <div class="callout-header">
    <span class="callout-icon" aria-hidden="true"><svg>...</svg></span>
    <span class="callout-title">Note</span>
  </div>
  <div class="callout-body">
    <p>Body text.</p>
  </div>
</div>
```

### Foldable callout (open)

```markdown
> [!TIP]+
> Expanded by default.
```

```html
<details class="callout callout-tip callout-foldable" data-callout="tip"
         data-callout-fold="open" open
         style="--callout-l: 0.60; --callout-c: 0.17; --callout-h: 155;">
  <summary class="callout-header">
    <span class="callout-icon" aria-hidden="true"><svg>...</svg></span>
    <span class="callout-title">Tip</span>
  </summary>
  <div class="callout-body">
    <p>Expanded by default.</p>
  </div>
</details>
```

## Styling

The default stylesheet uses CSS custom properties (oklch color components) set inline on each callout. Override any of these in your own CSS:

```css
:root {
  --callout-radius: 0.5rem;
  --callout-padding: 1rem 1.25rem;
  --callout-margin: 1.5em 0;
  --callout-border-width: 4px;
  --callout-header-gap: 0.5rem;
  --callout-header-margin-bottom: 0.5rem;
  --callout-body-font-size: 1.05rem;
  --callout-title-font-size: 1.2rem;
  --callout-title-font-weight: 600;
  --callout-icon-size: 1.15rem;

  --callout-bg-alpha: 0.06;
  --callout-border-alpha: 1;
  --callout-icon-alpha: 1;
}
```

Dark mode is automatic via `@media (prefers-color-scheme: dark)`.

## Built-in Callout Types

The plugin ships with **206 built-in callout types** across 12 color families:

| Family | Hue | Examples |
|---|---|---|
| Blue | ~250 | note, info, example, abstract, update, figure, … |
| Green | ~155 | tip, hint, success, check, done, … |
| Purple | ~300 | important, quote, cite, definition, aside, … |
| Amber | ~80 | warning, attention, todo, correction, draft, … |
| Orange | ~55 | question, help, faq, further-reading, discussion, … |
| Red | ~25 | caution, danger, error, failure, bug, … |
| Cyan | ~195 | security, accessibility, … |
| Teal | ~180 | best-practice, milestone, scalability, … |
| Pink | ~345 | trivia, ux-insight, … |
| Indigo | ~270 | deep-dive, … |
| Gray | ~0 | shortcut, environment, hardware, … |
| Silver | ~0 | licensing, … |

See `src/defaults.ts` for the complete list with their default titles, icons, and colors.

## Development

```bash
# Install dependencies
npm install

# Build TypeScript → dist/
npm run build

# Run the test suite
npm test

# Run stress tests (2M+ assertions, takes ~3 minutes)
npm run test:stress
```

### Test Suite

| File | Description | Assertions |
|---|---|---|
| `tests/test-bugs.mjs` | Original bug-fix tests | 86 |
| `tests/test-fixes.mjs` | Phase 2 audit fix verification | 38 |
| `tests/test-edge-probe.mjs` | Permanent edge-case probe | 63 |
| `tests/test-stress-1.mjs` | Per-callout × 10k iterations | 2,240,868 |
| `tests/test-stress-2.mjs` | Full pipeline × 10k iterations | 16,000 |

## License

[MIT](./LICENSE) © dr-ishaan
