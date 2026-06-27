// Integration test: run the actual calloutSatteri adapter against a rich
// Markdown sample exercising every callout family, and verify the output HTML
// matches what the unified pipeline produces.

import { markdownToHtml } from 'satteri';
import { calloutSatteri } from '../dist/satteri.js';

const md = `# Callout Demo

## Standard callouts

> [!NOTE]
> A simple note.

> [!WARNING] Custom Warning Title
> Multi-line body.

> [!TIP]
> Inline **markdown** in body.

## Foldable callouts

> [!TIP]+
> Open by default.

> [!DANGER]-
> Closed by default.

## Rich titles

> [!NOTE] **bold** and \`code\` and [a link](https://example.com)
> Body.

## Custom anchor IDs

> [!NOTE]{#important-warning}
> Body with anchor.

## Literary types

> [!EPIGRAPH] Charles Dickens
> "It was the best of times, it was the worst of times."

> [!PULLQUOTE]
> "Design is how it works."
> — Steve Jobs

> [!ASIDE] Tangent
> A marginal note.

> [!SIDEBAR] Related
> A sidebar.
> — Author

## Structured-data

> [!bio] Alan Turing
> Born: June 23, 1912
> Died: June 7, 1954
> Nationality: British

> [!event] Apollo 11
> Date: July 20, 1969
> Location: Moon

## Series navigation

> [!next]
> Continue to Part 2

> [!continue] Part 2
> Click to continue.

## Accordions (with exclusive expansion)

> [!!] First panel
> Body 1

> [!!] Second panel
> Body 2

> [! 💻 !] Third panel with icon
> Body 3

## Summary

If everything above rendered as styled containers, the adapter works.
`;

const { html, data } = markdownToHtml(md, {
  mdastPlugins: [calloutSatteri()],
});

console.log('=== OUTPUT HTML ===');
console.log(html);

console.log('\n=== ADAPTER STATE ===');
console.log(JSON.stringify(data, null, 2));

console.log('\n=== ASSERTIONS ===');
const checks = [
  ['standard note callout', html.includes('class="callout callout-note"')],
  ['warning callout with custom title', html.includes('class="callout callout-warning"')],
  ['tip callout', html.includes('class="callout callout-tip"')],
  ['foldable tip (open)', html.includes('callout-foldable') && html.includes('data-callout-fold="open"')],
  ['foldable danger (closed)', html.includes('data-callout-fold="closed"')],
  ['rich title with bold', html.includes('<strong>bold</strong>')],
  ['rich title with code', html.includes('<code>code</code>')],
  ['custom anchor ID', html.includes('id="important-warning"')],
  ['epigraph literary type', html.includes('class="epigraph"')],
  ['epigraph attribution', html.includes('class="epigraph-attribution"')],
  ['pullquote literary type', html.includes('class="pullquote"')],
  ['aside literary type', html.includes('class="aside"')],
  ['sidebar literary type', html.includes('class="sidebar"')],
  ['bio structured-data', html.includes('class="callout callout-bio"')],
  ['bio definition list', html.includes('class="callout-fields"')],
  ['bio dt/dd', html.includes('<dt>') && html.includes('<dd>')],
  ['event structured-data', html.includes('class="callout callout-event"')],
  ['next series nav', html.includes('class="callout callout-next"')],
  ['continue series nav', html.includes('class="callout callout-continue"')],
  ['accordion panels', html.includes('class="accordion"')],
  ['accordion summary', html.includes('class="accordion-header"')],
  ['accordion exclusive name attr', html.includes('name="accordion-group-')],
  ['oklch color vars', html.includes('--callout-l:')],
];

let pass = 0, fail = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${name}`);
  if (ok) pass++; else fail++;
}

console.log(`\n${pass}/${checks.length} checks passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
