# remark-callout-plus

[![npm version](https://img.shields.io/npm/v/remark-callout-plus.svg)](https://www.npmjs.com/package/remark-callout-plus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [remark](https://github.com/remarkjs/remark) plugin for the unified pipeline that transforms GitHub/Obsidian-style callout blockquotes into styled HTML containers — with 210+ built-in callout types, literary types (epigraph/pullquote/aside/sidebar), a separate accordion family with native exclusive expansion, rich titles, structured-data types (bio/event), CSS variable integration, and an Astro integration wrapper.

## Features

- **210+ built-in callout types** across 12 color families
- **Literary types** — epigraph, pullquote, aside, sidebar render as semantic `<figure>`/`<aside>` with attribution detection
- **Accordion family** — `[!!]` marker with native `<details name="...">` exclusive expansion, zero JavaScript
- **Structured-data types** — `[!bio]` and `[!event]` render `Key: Value` body lines as `<dl><dt><dd>`
- **Rich titles** — inline markdown in the title (bold, italic, links, code) renders as HTML
- **Custom anchor IDs** — `{#my-id}` syntax for deep linking
- **CSS variable integration** — `colorL: 'var(--brand-l)'` works alongside numeric values
- **Accessibility** — `aria-expanded` on all foldable/accordion summaries
- **Types whitelist** — restrict which types render as callouts
- **Dev-mode warnings** — "Did you mean ...?" suggestions for unknown types
- **Programmatic API** — `createCalloutNode()` for injecting callouts from frontmatter or code
- **Astro integration** — one-line setup, auto-wires plugin + handler
- **SVG icons** — Lucide-style, 24×24 viewBox, stroke-based, using `currentColor`
- **oklch colors** — perceptually uniform, automatic dark mode
- **Zero JavaScript** — all interactivity uses native HTML (`<details>`, `<summary>`)
- **No `allowDangerousHtml` required** — SVG icons parsed into proper HAST elements
- **Single-pass recursive transformer** — handles arbitrarily deep nesting with no cap
- **CRLF-compatible** — Windows, old Mac, and Unix line endings all work

## Install

```bash
npm install remark-callout-plus
```

## Quick Start

### Standard setup (any unified pipeline)

**v1.3.0+ — Native HAST mode (no handler required):**

```ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkCallout from 'remark-callout-plus'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

// Import the default stylesheet
import 'remark-callout-plus/styles/callout.css'

const result = unified()
  .use(remarkParse)
  .use(remarkCallout, { useNativeHast: true })  // ← no handler needed!
  .use(remarkRehype)                             // ← standard config
  .use(rehypeStringify)
  .processSync('> [!NOTE]\n> Hello world')

console.log(String(result))
```

> **Note:** `useNativeHast: true` currently supports standard callouts (note/warning/tip/etc.) and foldable callouts. Literary types (epigraph/pullquote/aside/sidebar), structured-data types (bio/event), and accordions still require the handler (see below).

**Handler-based setup (all callout types, v1.0.0+):**

```ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkCallout, { calloutToHast } from 'remark-callout-plus'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

// Import the default stylesheet
import 'remark-callout-plus/styles/callout.css'

const result = unified()
  .use(remarkParse)
  .use(remarkCallout)
  .use(remarkRehype, { handlers: { callout: calloutToHast } })
  .use(rehypeStringify)
  .processSync('> [!NOTE]\n> Hello world')

console.log(String(result))
```

> **Important:** When NOT using `useNativeHast: true`, you MUST pass `{ handlers: { callout: calloutToHast } }` to `remark-rehype`. Without it, callouts render as empty `<div>`s.

### Astro setup (one line)

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config'
import calloutPlus from 'remark-callout-plus/astro'

export default defineConfig({
  integrations: [calloutPlus()],
})
```

Then add the CSS once in your global stylesheet:
```css
@import 'remark-callout-plus/styles/callout.css';
```

The Astro integration automatically wires up the remark plugin AND the `calloutToHast` handler — no manual `remarkRehype` configuration needed.

> **CSS import portability:** The `@import` syntax above works in bundlers that honor the package's `exports` map (Tailwind CSS 4, Vite, Webpack 5+, esbuild). If your bundler doesn't resolve subpath exports, use the JS-side import instead, which works everywhere:
> ```js
> import 'remark-callout-plus/styles/callout.css'
> ```
> Both forms resolve to the same file (`styles/callout.css` is declared in the package's `exports` field).

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

### Custom anchor IDs — `{#id}`

```markdown
> [!NOTE]{#important-warning} Don't do this
> Body text.

> [!EPIGRAPH]{#chapter-quote} Author Name
> Quote text.

> [!!]{#faq-1} Frequently asked question
> Answer here.
```

Renders as `id="important-warning"` on the root element, enabling deep links like `[see warning](#important-warning)`.

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

### Literary types

Render as semantic HTML elements (`<figure>` / `<aside>`) instead of callout boxes — no border, no icon, no colored chrome. Includes automatic attribution detection (em-dash `—`, en-dash `–`, or double-hyphen `--` on the last body line).

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
| `[!EPIGRAPH]` | `<figure><div/><figcaption/></figure>` | Custom title or `— Author` trailing line |
| `[!PULLQUOTE]` / `[!PULL]` | `<figure>` (smaller) | Same as epigraph |
| `[!ASIDE]` | `<aside>` with optional heading + body + attribution | `— Author` trailing line |
| `[!SIDEBAR]` | `<aside>` (wider, magazine-style) | `— Author` trailing line |

> **CSS isolation:** Literary types use `<div>` for inner content (not `<blockquote>`) to avoid conflicts with site-wide blockquote styles.

### Structured-data types — `[!bio]`, `[!event]`

Render `Key: Value` body lines as a `<dl>` definition list inside a callout box:

```markdown
> [!bio] Alan Turing
> Born: June 23, 1912
> Died: June 7, 1954
> Nationality: British
> Role: Mathematician
```

```html
<div class="callout callout-bio" ...>
  <div class="callout-header">
    <span class="callout-icon">...</span>
    <span class="callout-title">Alan Turing</span>
  </div>
  <div class="callout-body">
    <dl class="callout-fields">
      <dt>Born</dt><dd>June 23, 1912</dd>
      <dt>Died</dt><dd>June 7, 1954</dd>
      <dt>Nationality</dt><dd>British</dd>
      <dt>Role</dt><dd>Mathematician</dd>
    </dl>
  </div>
</div>
```

`[!event]` works identically — use it for event metadata (Date, Location, Significance, etc.).

### Series navigation — `[!next]`, `[!continue]`

```markdown
> [!next]
> Continue to Part 2: The Awakening

> [!continue] Part 2: The Awakening
> Click to continue reading
```

### Accordions — `[!!]` (separate family)

Accordions are a **separate visual family** from callouts — no callout DNA. Adjacent panels form a group with **native exclusive expansion** via `<details name="...">` (zero JavaScript).

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

All forms support `+` / `-` foldable suffixes and `{#id}` anchor IDs:
- `[!!]+` — open by default
- `[!!]-` — closed by default (same as bare default)
- `[! 💡 !]{#idea}+` — open with icon and anchor ID

Default state is **collapsed**.

## Options

```ts
remarkCallout({
  // Custom callout type definitions (keys are case-insensitive)
  callouts: {
    myType: {
      defaultTitle: 'My Type',
      icon: '<svg>...</svg>',
      colorL: 0.55,           // oklch lightness (0–1) OR 'var(--brand-l)'
      colorC: 0.18,           // oklch chroma  (0–0.4) OR 'var(--brand-c)'
      colorH: 300,            // oklch hue      (0–360) OR 'var(--brand-h)'
    },
  },

  // Override icons for existing types
  icons: { note: '<svg>...</svg>' },

  // Override default titles for existing types
  titles: { note: 'Heads Up' },

  // Hide the title or icon span entirely
  showTitle: true,            // default
  showIcon:  true,            // default

  // Enable collapsible syntax (+ / -)
  enableFoldable: true,       // default

  // Disable all built-in types
  disableBuiltins: false,     // default

  // Tag name for non-foldable callout container
  tag: 'div',                 // default

  // Whitelist — only these types render as callouts
  // Literary types and accordions always render regardless
  types: ['note', 'warning', 'tip'],  // default: undefined (all allowed)

  // ── v1.3.0+ new options ──────────────────────────────────────────

  // Native HAST mode — no calloutToHast handler required.
  // Currently supports standard + foldable callouts.
  // Literary/structured-data/accordion still need the handler.
  useNativeHast: false,       // default (true planned for v2.0)

  // Intercept unknown callout types (instead of console.warn).
  // Return a {type, ...} to remap, or undefined to drop to blockquote.
  onUnknownCallout: (callout) => {
    if (callout.type === 'experimental') return { ...callout, type: 'note' };
    return undefined; // fall back to plain blockquote
  },

  // Dynamic icon resolution (takes precedence over `icons` map)
  icon: (callout) => callout.type === 'warning' ? '<svg>...</svg>' : '<svg>...</svg>',

  // Dynamic title resolution (takes precedence over `titles` map)
  title: (callout) => callout.type.toUpperCase(),

  // Dynamic root tag (takes precedence over `tag`; foldable always uses <details>)
  root: (callout) => callout.type === 'note' ? 'aside' : 'div',
})
```

### CSS variable integration

`colorL`, `colorC`, and `colorH` accept either numeric values or CSS variable strings:

```ts
remarkCallout({
  callouts: {
    brand: {
      defaultTitle: 'Brand',
      icon: '<svg>...</svg>',
      colorL: 'var(--brand-l)',  // uses your design system's CSS variable
      colorC: 'var(--brand-c)',
      colorH: 'var(--brand-h)',
    },
  },
})
```

This enables design-system integration — callouts automatically adapt to section-specific accent colors.

## Programmatic API

### `createCalloutNode(type, options)`

Create a callout MDAST node programmatically for injection from frontmatter, data files, or code:

```ts
import { createCalloutNode } from 'remark-callout-plus'

const node = createCalloutNode('note', {
  title: 'Generated from frontmatter',
  foldable: 'open',
  id: 'auto-note',
  children: [
    { type: 'paragraph', children: [{ type: 'text', value: 'Body text' }] },
  ],
})

// Inject into the tree via a custom remark plugin
const injectFromFrontmatter = () => (tree) => {
  tree.children.unshift(node)
}
```

### Rendering a programmatically-created callout

**Important:** `createCalloutNode` returns an MDAST node, not an HTML string. To render it, you must inject it into a markdown tree (as shown above) and run the full unified pipeline. Do **not** pass the node directly to `processor.processSync()` — `processSync` expects a markdown string and will either throw `Cannot processSync without parser` or silently return an empty string.

The correct pattern is to use `runSync` (MDAST → HAST) followed by `stringify` (HAST → HTML):

```ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkCallout, { calloutToHast, createCalloutNode } from 'remark-callout-plus'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const node = createCalloutNode('note', {
  title: 'Programmatic',
  children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Body text' }] }],
})

const tree = { type: 'root', children: [node] }

const processor = unified()
  .use(remarkParse)
  .use(remarkCallout)
  .use(remarkRehype, { handlers: { callout: calloutToHast } })
  .use(rehypeStringify)

// Two-step render: MDAST → HAST → HTML
const hast = processor.runSync(tree)
const html = processor.stringify(hast)
console.log(html)
// → <div class="callout callout-note" ...>...<p>Body text</p>...</div>
```

If you need to render the node alongside regular markdown, inject it into the tree via a custom remark plugin (as shown in the first example) and call `processSync(markdownString)` as usual — the injected node will be transformed alongside the parsed markdown.

## Output HTML

### Non-foldable callout

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

### Foldable callout (with aria-expanded)

```html
<details class="callout callout-tip callout-foldable" data-callout="tip"
         data-callout-fold="open" open
         style="--callout-l: 0.60; --callout-c: 0.17; --callout-h: 155;">
  <summary class="callout-header" aria-expanded="true">
    <span class="callout-icon" aria-hidden="true"><svg>...</svg></span>
    <span class="callout-title">Tip</span>
  </summary>
  <div class="callout-body">
    <p>Expanded by default.</p>
  </div>
</details>
```

### Epigraph (literary)

```html
<figure class="epigraph">
  <div class="epigraph-quote">
    <p>"It was the best of times."</p>
  </div>
  <figcaption class="epigraph-attribution">— Charles Dickens</figcaption>
</figure>
```

### Accordion panel (with aria-expanded)

```html
<details class="accordion" name="accordion-group-1">
  <summary class="accordion-header" aria-expanded="false">
    <span class="accordion-icon" aria-hidden="true">💻</span>
    <span class="accordion-title">Laptop</span>
    <span class="accordion-chevron" aria-hidden="true"></span>
  </summary>
  <div class="accordion-body">
    <p>A panel with an emoji icon.</p>
  </div>
</details>
```

### Structured-data callout (bio)

```html
<div class="callout callout-bio" data-callout="bio" ...>
  <div class="callout-header">
    <span class="callout-icon">...</span>
    <span class="callout-title">Alan Turing</span>
  </div>
  <div class="callout-body">
    <dl class="callout-fields">
      <dt>Born</dt><dd>June 23, 1912</dd>
      <dt>Died</dt><dd>June 7, 1954</dd>
    </dl>
  </div>
</div>
```

## Styling

Override any CSS custom properties:

```css
:root {
  --callout-radius: 0.5rem;
  --callout-padding: 1rem 1.25rem;
  --callout-margin: 1.5em 0;
  --callout-border-width: 4px;
  --callout-title-font-size: 1.2rem;
  --callout-body-font-size: 1.05rem;
  --callout-icon-size: 1.15rem;

  --accordion-radius: 12px;
  --accordion-border-color: #e5e7eb;
  --accordion-bg: #ffffff;
  --accordion-title-color: #111827;
}
```

Dark mode is automatic via `@media (prefers-color-scheme: dark)`.

## Built-in Types

**210+ callout types** across 12 color families. Literary types, structured-data types, accordions, and series navigation are always allowed regardless of the `types` whitelist.

| Category | Types |
|---|---|
| **Literary** | `[!EPIGRAPH]`, `[!PULLQUOTE]`/`[!PULL]`, `[!ASIDE]`, `[!SIDEBAR]` |
| **Structured-data** | `[!bio]`, `[!event]` |
| **Series navigation** | `[!next]`, `[!continue]` |
| **Accordion** | `[!!]`, `[! icon !]` |
| **Callout families** | note, tip, warning, danger, success, question, info, example, abstract, quote, bug, best-practice, + 190 more |

See `src/defaults.ts` for the complete list.

## Accessibility

- **`aria-expanded`** on all foldable callout and accordion `<summary>` elements
- **`aria-hidden`** on decorative icons and chevrons
- **Native `<details>`/`<summary>`** semantics for all collapsible content
- **Zero JavaScript** — all interactivity is native HTML

## Development

```bash
npm install
npm run build    # TypeScript → dist/
npm run dev      # Watch mode
```

## License

[MIT](./LICENSE) © dr-ishaan
