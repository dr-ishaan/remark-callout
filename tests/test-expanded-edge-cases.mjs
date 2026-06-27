/**
 * Expanded edge-case test suite — covers r4ai's edge cases adapted for
 * remark-callout-plus. Tests scenarios that were missing from our original
 * test suites.
 *
 * Adapted from https://github.com/r4ai/remark-callout/blob/main/packages/remark-callout/src/plugin.test.ts
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast } from '../dist/index.js';
import { parseCalloutMarker, parseAccordionMarker } from '../dist/transform.js';

let pass = 0, fail = 0;
const results = [];
function ok(name, cond, detail = '') {
  if (cond) { pass++; results.push(`  PASS  ${name}`); }
  else { fail++; results.push(`  FAIL  ${name}  ${detail}`); }
}

async function run(md, opts = {}) {
  return String(await unified()
    .use(remarkParse)
    .use(remarkCallout, opts)
    .use(remarkRehype, { handlers: { callout: calloutToHast } })
    .use(rehypeStringify)
    .process(md));
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: parseCalloutMarker edge cases (adapted from r4ai)
// ═══════════════════════════════════════════════════════════════════════════
console.log('═══ SECTION 1: parseCalloutMarker edge cases ═══');

// Callout without title
{
  const m = parseCalloutMarker('[!NOTE]\nBody', true);
  ok('parses callout without title', m?.type === 'note' && m?.title === '');
}
{
  const m = parseCalloutMarker('[!NOTE]', true);
  ok('parses callout without title or body', m?.type === 'note');
}

// Uppercase type
{
  const m = parseCalloutMarker('[!NOTE] Title', true);
  ok('parses uppercase type (lowercased)', m?.type === 'note');
}
{
  const m = parseCalloutMarker('[!WARNING] Title', true);
  ok('parses uppercase WARNING', m?.type === 'warning');
}

// Spaces in type name (our fix #4 — r4ai also handles this)
{
  const m = parseCalloutMarker('[! NOTE ] Title', true);
  ok('parses type with spaces inside brackets', m?.type === 'note');
}
{
  const m = parseCalloutMarker('[!NOTE ] Title', true);
  ok('parses type with trailing space in brackets', m?.type === 'note');
}
{
  const m = parseCalloutMarker('[! NOTE] Title', true);
  ok('parses type with leading space in brackets', m?.type === 'note');
}

// Foldable variants
{
  const m = parseCalloutMarker('[!NOTE]-', true);
  ok('parses foldable minus (closed)', m?.foldable === 'closed');
}
{
  const m = parseCalloutMarker('[!NOTE]+', true);
  ok('parses foldable plus (open)', m?.foldable === 'open');
}
{
  const m = parseCalloutMarker('[!NOTE]+ Title', true);
  ok('parses foldable plus with title', m?.foldable === 'open' && m?.title === 'Title');
}

// Multiple spaces between type and title
{
  const m = parseCalloutMarker('[!NOTE]   Multiple spaces', true);
  ok('parses multiple spaces between type and title', m?.title === 'Multiple spaces');
}

// Brackets in title
{
  const m = parseCalloutMarker('[!NOTE] Title [with brackets]', true);
  ok('parses brackets in title', m?.title === 'Title [with brackets]');
}

// {#id} anchor (our fix #7 / GH #17)
{
  const m = parseCalloutMarker('[!NOTE]{#my-id} Title', true);
  ok('parses {#id} without space', m?.id === 'my-id' && m?.title === 'Title');
}
{
  const m = parseCalloutMarker('[!NOTE] {#my-id} Title', true);
  ok('parses {#id} with space (GH #17 fix)', m?.id === 'my-id' && m?.title === 'Title');
}

// Invalid callout markers (should return null)
{
  const m = parseCalloutMarker('Not a callout', true);
  ok('returns null for non-callout text', m === null);
}
{
  const m = parseCalloutMarker('[!NOTE', true);
  ok('returns null for unclosed bracket', m === null);
}
{
  const m = parseCalloutMarker('![NOTE]', true);
  ok('returns null for image-like syntax', m === null);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: parseAccordionMarker edge cases
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ SECTION 2: parseAccordionMarker edge cases ═══');

{
  const m = parseAccordionMarker('[!!] Title', true);
  ok('parses bare accordion', m?.title === 'Title' && m?.foldable === 'closed');
}
{
  const m = parseAccordionMarker('[!!]+ Title', true);
  ok('parses bare accordion open', m?.foldable === 'open');
}
{
  const m = parseAccordionMarker('[! 💡 !] Title', true);
  ok('parses accordion with emoji icon', m?.icon === '💡' && m?.title === 'Title');
}
{
  const m = parseAccordionMarker('[!!]{#acc-1} Title', true);
  ok('parses accordion with {#id}', m?.id === 'acc-1');
}
{
  const m = parseAccordionMarker('[!!] {#acc-1} Title', true);
  ok('parses accordion with {#id} and space', m?.id === 'acc-1');
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Rendering edge cases
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ SECTION 3: Rendering edge cases ═══');

// Empty blockquote
{
  const html = await run('> ');
  ok('empty blockquote does not crash', !html.includes('callout'));
}

// Callout with empty first line
{
  const html = await run('> [!NOTE]\n>\n> Body after blank line.');
  ok('callout with blank line after marker', html.includes('class="callout callout-note"') && html.includes('Body after blank line.'));
}

// Callout with title and without body
{
  const html = await run('> [!NOTE] Title only');
  ok('callout with title but no body', html.includes('callout-note') && html.includes('Title only'));
}

// Callout without title and without body
{
  const html = await run('> [!NOTE]');
  ok('callout with no title and no body', html.includes('callout-note'));
}

// Callout with title consisting of multiple inline nodes
{
  const html = await run('> [!NOTE] **bold** and *italic* and `code`');
  ok('callout with multiple inline title nodes', html.includes('<strong>bold</strong>') && html.includes('<em>italic</em>') && html.includes('<code>code</code>'));
}

// Callout with body consisting of multiple paragraphs
{
  const html = await run('> [!NOTE] Title\n>\n> First paragraph.\n>\n> Second paragraph.');
  ok('callout with multi-paragraph body', html.includes('First paragraph.') && html.includes('Second paragraph.'));
}

// Callout with strong, emphasis, and inline code in body
{
  const html = await run('> [!NOTE] Title\n> Body with **bold**, *italic*, and `code`.');
  ok('callout with inline formatting in body', html.includes('<strong>bold</strong>') && html.includes('<em>italic</em>') && html.includes('<code>code</code>'));
}

// Nested callouts (callout inside callout body)
{
  const html = await run('> [!NOTE] Outer\n> Outer body.\n>\n> > [!WARNING] Inner\n> > Inner body.');
  ok('nested callouts render both', html.includes('callout-note') && html.includes('callout-warning'));
  ok('nested callout titles preserved', html.includes('Outer') && html.includes('Inner'));
}

// Callout with list in body
{
  const html = await run('> [!NOTE] Title\n> - Item 1\n> - Item 2\n> - Item 3');
  ok('callout with list body', html.includes('<ul') && html.includes('Item 1') && html.includes('Item 3'));
}

// Callout with code block in body
{
  const html = await run('> [!NOTE] Title\n>\n> ```js\n> console.log("hello")\n> ```');
  ok('callout with code block body', html.includes('<pre') || html.includes('<code>'));
}

// CRLF line endings
{
  const html = await run('> [!NOTE] CRLF Title\r\n> CRLF body.');
  ok('CRLF line endings work', html.includes('callout-note') && html.includes('CRLF Title') && html.includes('CRLF body.'));
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Literary types edge cases
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ SECTION 4: Literary types edge cases ═══');

// Epigraph with italic quote + em-dash (the article's exact case — v1.2.4 fix)
{
  const html = await run('> [!EPIGRAPH] An ancient wish\n> *"Could we build one?"*\n> — The oldest question');
  const quoteBody = html.slice(html.indexOf('epigraph-quote'), html.indexOf('</div>', html.indexOf('epigraph-quote')));
  ok('epigraph: italic quote + em-dash — em-dash NOT in quote body', !quoteBody.includes('—'));
  ok('epigraph: italic quote preserved', quoteBody.includes('<em>"Could we build one?"</em>'));
  ok('epigraph: title as figcaption', html.includes('figcaption') && html.includes('An ancient wish'));
}

// Epigraph with bold quote + em-dash
{
  const html = await run('> [!EPIGRAPH] Title\n> **"Quote"**\n> — Author');
  const quoteBody = html.slice(html.indexOf('epigraph-quote'), html.indexOf('</div>', html.indexOf('epigraph-quote')));
  ok('epigraph: bold quote + em-dash — em-dash NOT in quote body', !quoteBody.includes('—'));
}

// Epigraph with code quote + em-dash
{
  const html = await run('> [!EPIGRAPH] Title\n> `Quote`\n> — Author');
  const quoteBody = html.slice(html.indexOf('epigraph-quote'), html.indexOf('</div>', html.indexOf('epigraph-quote')));
  ok('epigraph: code quote + em-dash — em-dash NOT in quote body', !quoteBody.includes('—'));
}

// Epigraph with link quote + em-dash
{
  const html = await run('> [!EPIGRAPH] Title\n> [Quote](http://x)\n> — Author');
  const quoteBody = html.slice(html.indexOf('epigraph-quote'), html.indexOf('</div>', html.indexOf('epigraph-quote')));
  ok('epigraph: link quote + em-dash — em-dash NOT in quote body', !quoteBody.includes('—'));
}

// Epigraph with no attribution
{
  const html = await run('> [!EPIGRAPH]\n> "Just a quote."');
  ok('epigraph: no attribution → no figcaption', !html.includes('figcaption'));
}

// Epigraph with em-dash only (no title)
{
  const html = await run('> [!EPIGRAPH]\n> "Quote."\n> — Author');
  ok('epigraph: em-dash only → figcaption with author', html.includes('figcaption') && html.includes('Author'));
}

// Aside with rich title (v1.2.0 fix)
{
  const html = await run('> [!ASIDE] *Floating Man*\n> Body.');
  ok('aside: italic title preserved', html.includes('<em>Floating Man</em>'));
}

// Sidebar with rich title
{
  const html = await run('> [!SIDEBAR] Related *concept*\n> Body.');
  ok('sidebar: italic title preserved', html.includes('<em>concept</em>'));
}

// Pullquote alias [!PULL]
{
  const html = await run('> [!PULL]\n> "Quote."');
  ok('pull alias renders as pullquote', html.includes('class="pullquote"'));
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Structured-data edge cases
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ SECTION 5: Structured-data edge cases ═══');

// Bio with bold labels (v1.2.0 fix)
{
  const html = await run('> [!bio] Alan Turing\n> **Born:** June 23, 1912\n> **Died:** June 7, 1954');
  ok('bio: bold labels → <dl> generated', html.includes('<dl'));
  ok('bio: bold label in <dt>', html.includes('<strong>Born:</strong>'));
  ok('bio: value preserved', html.includes('June 23, 1912') && html.includes('June 7, 1954'));
}

// Bio with plain labels
{
  const html = await run('> [!bio] Alan Turing\n> Born: June 23, 1912');
  ok('bio: plain labels → <dl>', html.includes('<dl') && html.includes('Born') && html.includes('June 23, 1912'));
}

// Event with bold labels
{
  const html = await run('> [!event] Apollo 11\n> **Date:** July 20, 1969\n> **Location:** Moon');
  ok('event: bold labels → <dl>', html.includes('<dl'));
  ok('event: values preserved', html.includes('July 20, 1969') && html.includes('Moon'));
}

// Bio with mixed bold and plain labels
{
  const html = await run('> [!bio] Mixed\n> **Bold:** value1\n> Plain: value2');
  ok('bio: mixed labels → <dl>', html.includes('<dl'));
  ok('bio: bold label in <dt>', html.includes('<strong>Bold:</strong>'));
  ok('bio: plain label in <dt>', html.includes('Plain:'));
  ok('bio: both values preserved', html.includes('value1') && html.includes('value2'));
}

// Bio with non-field content after fields
{
  const html = await run('> [!bio] Turing\n> Born: 1912\n>\n> He was a pioneer.');
  ok('bio: non-field paragraph after <dl>', html.includes('<dl') && html.includes('pioneer'));
}

// Bio with value containing colon (URL)
{
  const html = await run('> [!bio] Turing\n> Website: https://turing.org\n> Born: 1912');
  ok('bio: URL value with colon', html.includes('<dl') && html.includes('https://turing.org') && html.includes('1912'));
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Accordion edge cases
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ SECTION 6: Accordion edge cases ═══');

// Multi-panel accordion exclusive expansion
{
  const html = await run('> [!!] Panel A\n> Body A.\n>\n> [!!] Panel B\n> Body B.');
  const detailsCount = (html.match(/<details/g) || []).length;
  ok('multi-panel: 2 <details> elements', detailsCount === 2);
  const nameMatches = html.match(/name="accordion-group-\d+"/g) || [];
  ok('multi-panel: both have same group name', nameMatches.length === 2 && new Set(nameMatches).size === 1);
}

// Accordion with SVG icon
{
  const html = await run('> [! <svg><circle/></svg> !] Custom Icon\n> Body.');
  ok('accordion: SVG icon rendered', html.includes('<svg') && html.includes('circle'));
}

// Accordion with {#id}
{
  const html = await run('> [!!]{#my-acc} Panel\n> Body.');
  ok('accordion: {#id} set', html.includes('id="my-acc"'));
}

// Accordion open by default
{
  const html = await run('> [!!]+ Open Panel\n> Body.');
  ok('accordion: open by default', html.includes('open'));
}

// Accordion closed by default (default state)
{
  const html = await run('> [!!] Closed Panel\n> Body.');
  ok('accordion: closed by default (no open attr)', !html.includes('open>'));
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: v1.3.0 callback config edge cases
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ SECTION 7: v1.3.0 callback config edge cases ═══');

// onUnknownCallout remap
{
  const html = await run('> [!XYZZY] Title\n> Body.', {
    onUnknownCallout: (c) => ({ ...c, type: 'note' }),
  });
  ok('onUnknownCallout: remapped to note', html.includes('callout-note'));
}

// onUnknownCallout drop
{
  const html = await run('> [!XYZZY] Title\n> Body.', {
    onUnknownCallout: () => undefined,
  });
  ok('onUnknownCallout: dropped to blockquote', html.includes('<blockquote'));
}

// icon callback
{
  const html = await run('> [!NOTE] Title\n> Body.', {
    icon: () => '<svg><rect/></svg>',
  });
  ok('icon callback: custom SVG used', html.includes('rect'));
}

// title callback
{
  const html = await run('> [!NOTE]\n> Body.', {
    title: (c) => `Custom ${c.type.toUpperCase()}`,
  });
  ok('title callback: custom title', html.includes('Custom NOTE'));
}

// root callback
{
  const html = await run('> [!NOTE] Title\n> Body.', {
    root: () => 'section',
  });
  ok('root callback: custom root tag', html.includes('<section'));
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`  Expanded edge-case suite: ${pass} pass, ${fail} fail`);
console.log(`${'═'.repeat(60)}`);
console.log(results.join('\n'));
if (fail > 0) process.exit(1);
