# remark-callout

[![npm version](https://img.shields.io/npm/v/remark-callout.svg)](https://www.npmjs.com/package/remark-callout)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [remark](https://github.com/remarkjs/remark) plugin for the unified pipeline that transforms GitHub/Obsidian-style callout blockquotes into styled HTML containers — with SVG icons, oklch colors, collapsible support, rich titles, literary types (epigraph/pullquote/aside/sidebar), and a separate accordion family with native exclusive expansion.

## Syntax

### Callouts — `[!TYPE]`

```markdown
> [!NOTE]
> Simple note body.

> [!WARNING] Custom title
> Multi-line content.

> [!TIP]+
> Collapsible, open by default.

> [!DANGER]-
> Collapsible, closed by default.

> [!NOTE] **Rich title** with `inline code` and [links](https://example.com)
> Body text on the next line.
```

### Rich titles

Inline markdown on the marker line (after `[!TYPE]`) is rendered as HTML inside the title span:

| Input | Rendered title |
|---|---|
| `> [!NOTE] **bold**` | `<strong>bold</strong>` |
| `> [!NOTE] mixed **bold** text` | `mixed <strong>bold</strong> text` |
| `> [!NOTE] [link](http://x)` | `<a href="http://x">link</a>` |
| `> [!NOTE] \`code\`` | `<code>code</code>` |
| `> [!NOTE] plain text` | `plain text` |
| `> [!NOTE]` (nothing) | `Note` (default from config) |

Content on subsequent lines (after a newline) is body content, not title.

### Literary types — `[!EPIGRAPH]`, `[!PULLQUOTE]`, `[!ASIDE]`, `[!SIDEBAR]`

Literary types render as semantic HTML elements (`<figure>` / `<aside>`) instead of callout boxes — no border, no icon, no colored chrome. They include automatic attribution detection (em-dash `—`, en-dash `–`, or double-hyphen `--` on the last body line).

```markdown
> [!EPIGRAPH] Charles Dickens
> "It was the best of times, it was the worst of times."

> [!PULLQUOTE]
> "Design is not just what it looks like and feels like. Design is how it works."
> — Steve Jobs

> [!ASIDE] Tangent
> A marginal note that doesn't break the main flow.

> [!SIDEBAR] Related concept
> A magazine-style sidebar with its own visual identity.
> — Author Name
```

| Type | Renders as | Attribution |
|---|---|---|
| `[!EPIGRAPH]` | `<figure><blockquote/><figcaption/></figure>` | Custom title or `— Author` trailing line |
| `[!PULLQUOTE]` / `[!PULL]` | `<figure>` (smaller) | Same as epigraph |
| `[!ASIDE]` | `<aside>` with optional heading + body + attribution | `— Author` trailing line |
| `[!SIDEBAR]` | `<aside>` (wider, magazine-style) | `— Author` trailing line |

### Accordions — `[!!]` (separate family)

Accordions are a **separate visual family** from callouts — no callout DNA (no left-border accent, no colored chrome, no type-driven color theming). The only color comes from the user-supplied icon. Adjacent panels form a group with **native exclusive expansion** via `<details name="...">` (zero JavaScript).

```markdown
> [!!] Bare accordion (no icon)
> Body content goes here.

> [! 💻 !] Laptop
> A panel with an emoji icon.

> [! 💡 !]+ Bright idea
> A panel that's open by default.

> [! <svg>...</svg> !] Custom SVG icon
> A panel with an inline SVG icon.
```

**Multiple panels in one blockquote** — separated by blank `>` lines, they auto-group:

```markdown
> [! 😮 !] What is this?
> First panel body.
>
> [!!] Who are you?
> Second panel body.
```

#### Accordion marker forms

| Form | Syntax | Description |
|---|---|---|
| Bare | `[!!] Title` | No icon, just title |
| Shorthand | `[! icon !] Title` | Icon (emoji or SVG) between the two `!`s |
| Long form | `[!!] [! icon !] Title` | Bare marker + icon sub-token (legacy) |

All three forms support `+` / `-` foldable suffixes:
- `[!!]+` — open by default
- `[!!]-` — closed by default (same as bare default)
- `[! 💡 !]+` — open with icon

Default state is **collapsed**.

#### Adjacency grouping

Adjacent accordion panels (siblings with no non-accordion content between them) form a group with **native exclusive expansion** — opening one panel automatically closes the others in the same group. This is implemented via the HTML `<details name="...">` attribute (no JavaScript).

Different groups get unique counter-based name IDs (`accordion-group-1`, `accordion-group-2`, …).

## Features

- **210+ built-in callout types** across 12 color families (note, tip, warning, danger, success, question, info, example, abstract, quote, bug, best-practice, …)
- **Literary types** — epigraph, pullquote, aside, sidebar render as semantic `<figure>`/`<aside>` with attribution detection
- **Accordion family** — `[!!]` marker with native `<details name="...">` exclusive expansion, zero JavaScript
- **SVG icons** — Lucide-style, 24×24 viewBox, stroke-based, using `currentColor`
- **oklch colors** — perceptually uniform, automatic dark mode via `prefers-color-scheme`
- **Collapsible callouts** — native `<details>`/`<summary>` with `+` (open) / `-` (closed) syntax, zero JavaScript
- **Rich titles** — inline markdown in the title (bold, italic, links, code) renders as HTML in the title span
- **Case-insensitive** type matching — `[!NOTE]`, `[!note]`, `[!NoTe]` all work
- **Hyphenated types** — `[!BEST-PRACTICE]`, `[!RATE-LIMIT]`, `[!CI-CD]`
- **CRLF-compatible** — Windows (`\r\n`), old Mac (`\r`), and Unix (`\n`) line endings all work
- **Custom callout types** — define your own with `callouts`, `icons`, `titles` options
- **Single-pass recursive transformer** — handles arbitrarily deep nesting with no cap
- **No `allowDangerousHtml` required** — SVG icons are parsed into proper HAST elements via `hast-util-from-html`

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

### Epigraph (literary)

```markdown
> [!EPIGRAPH]
> "It was the best of times."
> — Charles Dickens
```

```html
<figure class="epigraph">
  <blockquote class="epigraph-quote">
    <p>"It was the best of times."</p>
  </blockquote>
  <figcaption class="epigraph-attribution">— Charles Dickens</figcaption>
</figure>
```

### Accordion panel

```markdown
> [! 💻 !] Laptop
> A panel with an emoji icon.
```

```html
<details class="accordion" name="accordion-group-1">
  <summary class="accordion-header">
    <span class="accordion-icon" aria-hidden="true">💻</span>
    <span class="accordion-title">Laptop</span>
    <span class="accordion-chevron" aria-hidden="true"></span>
  </summary>
  <div class="accordion-body">
    <p>A panel with an emoji icon.</p>
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

  /* Accordion variables */
  --accordion-radius: 12px;
  --accordion-border-color: #e5e7eb;
  --accordion-bg: #ffffff;
  --accordion-body-bg: #f9fafb;
  --accordion-title-color: #111827;
  --accordion-chevron-color: #6b7280;
  --accordion-icon-size: 1.25rem;
}
```

Dark mode is automatic via `@media (prefers-color-scheme: dark)`.

## Built-in Callout Types

The plugin ships with **210+ built-in callout types** across 12 color families:

| Family | Hue | Examples |
|---|---|---|
| Blue | ~250 | note, info, example, abstract, update, figure, … |
| Green | ~155 | tip, hint, success, check, done, … |
| Purple | ~300 | important, quote, cite, definition, bibliography, references, citation, related, … |
| Amber | ~80 | warning, attention, todo, correction, draft, … |
| Orange | ~55 | question, help, faq, further-reading, discussion, … |
| Red | ~25 | caution, danger, error, failure, bug, … |
| Cyan | ~195 | security, accessibility, … |
| Teal | ~180 | best-practice, milestone, scalability, … |
| Pink | ~345 | trivia, ux-insight, … |
| Indigo | ~270 | deep-dive, … |
| Gray | ~0 | shortcut, environment, hardware, … |
| Silver | ~0 | licensing, … |

**Literary types** (render as `<figure>`/`<aside>`, not callout boxes):
- `[!EPIGRAPH]` — large article-opener quote
- `[!PULLQUOTE]` / `[!PULL]` — mid-article scanner-bait quote
- `[!ASIDE]` — compact marginal note
- `[!SIDEBAR]` — magazine-style content box

**Accordion family** (separate from callouts):
- `[!!]` — bare accordion panel
- `[! icon !]` — accordion with emoji or SVG icon

See `src/defaults.ts` for the complete list with their default titles, icons, and colors.

## Development

```bash
# Install dependencies
npm install

# Build TypeScript → dist/
npm run build

# Watch mode for development
npm run dev
```

## License

[MIT](./LICENSE) © dr-ishaan
