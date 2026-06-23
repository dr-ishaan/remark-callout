/**
 * Edge case probe — permanent test file.
 *
 * Probes scenarios that the main test suites (test-bugs.mjs, test-fixes.mjs,
 * test-stress-1.mjs, test-stress-2.mjs) don't explicitly cover. Each probe
 * is small, fast, and named so failures are easy to triage.
 *
 * Categories:
 *   - Type name edge cases (underscore, hyphen)
 *   - Whitespace edge cases (tab, CRLF)
 *   - Empty/minimal callouts
 *   - Title-with-markdown interaction (see issue #3)
 *   - XSS probes (raw HTML in title/body/icon)
 *   - Deep nesting
 *   - Plugin composition (double-use, in-list, in-table)
 *   - Direct unit tests for parseCalloutMarker and resolveConfig
 *
 * Run with: node test-edge-probe.mjs
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast } from './dist/index.js';
import { resolveConfig, parseCalloutMarker } from './dist/transform.js';

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

// ── EDGE 1: Underscore in type name ────────────────────────────────────────
// \w matches underscore, so [!BEST_PRACTICE] matches the regex.
// It's not in BUILT_IN_CALLOUTS, so it renders with the fallback path.
// See issue #4 for discussion of whether to tighten this.
console.log('── EDGE 1: underscore in type name ──');
{
  const html = await run('> [!BEST_PRACTICE]\n> body');
  ok('underscore type matches regex', html.includes('callout-best_practice'),
     `html: ${html.slice(0, 200)}`);
  // capitalize() splits on '-' only, so 'best_practice' → 'Best_practice'
  // (NOT 'Best Practice'). This is current-behavior; issue #4 tracks the fix.
  const title = html.match(/callout-title[^>]*>([^<]+)/)?.[1];
  ok('underscore type title is `Best_practice` (current behavior)', title === 'Best_practice',
     `got: "${title}"`);
}

// ── EDGE 2: Tab character after marker ─────────────────────────────────────
console.log('\n── EDGE 2: tab after marker ──');
{
  const html = await run('> [!NOTE]\tTabbed title\n> body');
  const title = html.match(/callout-title[^>]*>([^<]+)/)?.[1];
  ok('tab-consumed title', title === 'Tabbed title', `got: "${title}"`);
}

// ── EDGE 3: CRLF line endings ──────────────────────────────────────────────
// See issue #5 for a more thorough CRLF test suite.
console.log('\n── EDGE 3: CRLF line endings ──');
{
  const md = '> [!NOTE]\r\n> body with crlf';
  const html = await run(md);
  ok('crlf callout renders', html.includes('callout-note'));
  ok('crlf body preserved', html.includes('crlf'));
}

// ── EDGE 4: Empty callout (no body, no title) ──────────────────────────────
console.log('\n── EDGE 4: empty callout ──');
{
  const html = await run('> [!NOTE]');
  ok('empty callout renders', html.includes('callout-note'));
  ok('empty callout gets callout-empty class', html.includes('callout-empty'),
     `html: ${html.slice(0, 300)}`);
  ok('empty callout has default title', html.includes('>Note<'));
}

// ── EDGE 5: Empty callout + foldable ───────────────────────────────────────
console.log('\n── EDGE 5: empty foldable callout ──');
{
  const html = await run('> [!NOTE]+');
  ok('empty foldable has <details>', html.includes('<details'));
  ok('empty foldable has open attr', /<details[^>]*\sopen/.test(html));
  ok('empty foldable has callout-empty class', html.includes('callout-empty'));
}

// ── EDGE 6: Title with markdown formatting ─────────────────────────────────
// CURRENT BEHAVIOR (tracked in issue #3):
//   remark-parse parses **bold** into a `strong` MDAST node BEFORE our
//   transformer runs. The regex `(.*)` only captures the leading text node,
//   so the bold content "leaks" into the body. The split-point between
//   title and body is inconsistent when the title contains inline markdown.
//
//   - `> [!NOTE] **bold title**` → title is `Note` (default), body is `<strong>bold title</strong>`
//   - `> [!NOTE] mixed **bold** text` → title is `mixed`, body is `<strong>bold</strong> text`
//
// These tests document the current behavior. When issue #3 is resolved,
// these expectations should be updated (or moved to a "rich-title" test file).
console.log('\n── EDGE 6: title with markdown formatting (current behavior, see issue #3) ──');
{
  const html = await run('> [!NOTE] **bold title**\n> body');
  // Title falls back to default `Note` because the leading text node is empty
  // (remark-parse already split the `**bold title**` into a `strong` node).
  const title = html.match(/callout-title[^>]*>([^<]*)/)?.[1];
  ok('markdown title falls back to default (issue #3)', title === 'Note',
     `got: "${title}"`);
  // The bold content ends up in the body via the BUG #1 fix (no content dropped).
  ok('markdown title content preserved in body', html.includes('<strong>bold title</strong>'),
     `html: ${html.slice(0, 400)}`);
}

// ── EDGE 7: Title with HTML chars (XSS probe) ──────────────────────────────
console.log('\n── EDGE 7: title with HTML chars (XSS) ──');
{
  const html = await run('> [!NOTE] <script>alert(1)</script>\n> body');
  // remark-rehype treats raw HTML in markdown as text (no raw HTML support
  // by default), so the literal text `<script>alert(1)</script>` becomes
  // body content (NOT title, because the regex captures the leading text
  // node which remark-parse has already split).
  //
  // The title falls back to default `Note`. The HTML chars end up in the
  // body as escaped text (`&lt;script&gt;...`) or are dropped entirely
  // depending on remark-rehype's behavior.
  ok('no unescaped <script> tag in HTML', !/<script>alert/.test(html),
     `html: ${html.slice(0, 400)}`);
  ok('callout renders without executing script', html.includes('callout-note'));
}

// ── EDGE 8: Body with HTML chars (XSS probe) ──────────────────────────────
console.log('\n── EDGE 8: body with HTML chars (XSS) ──');
{
  const html = await run('> [!NOTE]\n> <script>alert(1)</script>');
  ok('script tag NOT executed in body', !/callout-body[^>]*>\s*<script>/.test(html),
     `html: ${html.slice(0, 400)}`);
}

// ── EDGE 9: User-supplied icon with event handler ─────────────────────────
// Documented user-trust boundary: icons come from the consumer's own config,
// not from untrusted markdown. The user CAN inject event handlers via custom
// icons. This is intentional (icons are arbitrary SVG strings) and is the
// consumer's responsibility to sanitize if icons come from untrusted sources.
console.log('\n── EDGE 9: user icon with event handler (trust boundary) ──');
{
  const malicious = '<svg onload="alert(1)"><circle/></svg>';
  const html = await run('> [!NOTE]\n> body', {
    callouts: { note: { defaultTitle: 'Note', icon: malicious } },
  });
  // The onload attribute IS preserved in the output. This is by design —
  // icons are user-supplied and trusted. Documented in the callouts option
  // JSDoc.
  ok('onload attr preserved in user-supplied SVG (trust boundary)', html.includes('onload'),
     `html: ${html.slice(0, 400)}`);
}

// ── EDGE 10: Very deeply nested callouts (15 levels) ──────────────────────
console.log('\n── EDGE 10: 15-level deep nesting ──');
{
  let md = '';
  for (let i = 0; i < 15; i++) {
    md += '> '.repeat(i + 1) + '[!NOTE] L' + (i + 1) + '\n';
  }
  const html = await run(md);
  const noteCount = (html.match(/callout-note/g) || []).length;
  ok('15-level nesting all render', noteCount === 15,
     `got ${noteCount} callout-note classes, expected 15`);
}

// ── EDGE 11: Callout-like syntax in table cell (should NOT transform) ─────
console.log('\n── EDGE 11: callout-like syntax in table cell ──');
{
  const md = '| Col1 | Col2 |\n|---|---|\n| [!NOTE] | text |';
  const html = await run(md);
  ok('table cell [!NOTE] not transformed', !html.includes('class="callout'),
     `html: ${html.slice(0, 300)}`);
}

// ── EDGE 12: Callout marker NOT at start of blockquote ────────────────────
console.log('\n── EDGE 12: marker not at start of blockquote ──');
{
  const md = '> Some intro text\n> [!NOTE]\n> body';
  const html = await run(md);
  ok('non-marker-start blockquote NOT transformed', !html.includes('class="callout'),
     `html: ${html.slice(0, 300)}`);
}

// ── EDGE 13: Two callouts separated by blank line ─────────────────────────
console.log('\n── EDGE 13: two callouts separated by blank line ──');
{
  const md = '> [!NOTE]\n> first\n\n> [!WARNING]\n> second';
  const html = await run(md);
  ok('both callouts render', html.includes('callout-note') && html.includes('callout-warning'));
  ok('callout-note appears before callout-warning',
     html.indexOf('callout-note') < html.indexOf('callout-warning'));
}

// ── EDGE 14: Callout immediately followed by paragraph ────────────────────
console.log('\n── EDGE 14: callout then paragraph (no blank line) ──');
{
  const md = '> [!NOTE]\n> body\nParagraph after';
  const html = await run(md);
  ok('callout renders', html.includes('callout-note'));
  ok('paragraph after renders', html.includes('Paragraph after'));
}

// ── EDGE 15: Foldable with explicit + and explicit title ──────────────────
console.log('\n── EDGE 15: foldable + explicit title ──');
{
  const md = '> [!WARNING]+ My Title\n> body';
  const html = await run(md);
  ok('foldable + title renders as details', html.includes('<details'));
  ok('foldable + title has open attr', /<details[^>]*\sopen/.test(html));
  const title = html.match(/callout-title[^>]*>([^<]+)/)?.[1];
  ok('foldable + title preserves title', title === 'My Title', `got: "${title}"`);
}

// ── EDGE 16: enableFoldable: false with + in marker ───────────────────────
console.log('\n── EDGE 16: enableFoldable:false ignores +/- ──');
{
  const md = '> [!NOTE]+\n> body';
  const html = await run(md, { enableFoldable: false });
  ok('enableFoldable:false renders as div', html.includes('<div class="callout'));
  ok('enableFoldable:false no <details>', !html.includes('<details'));
  ok('enableFoldable:false no callout-foldable class', !html.includes('callout-foldable'));
  // The `+` is consumed by the regex (markerLength includes it), so it
  // doesn't appear in the body. This is current behavior; we may want to
  // emit a console warning in a future version.
}

// ── EDGE 17: Multiple instances of remarkCallout plugin ───────────────────
console.log('\n── EDGE 17: plugin used twice in pipeline ──');
{
  const html = String(await unified()
    .use(remarkParse)
    .use(remarkCallout)
    .use(remarkCallout)  // second instance — should be a no-op
    .use(remarkRehype, { handlers: { callout: calloutToHast } })
    .use(rehypeStringify)
    .process('> [!NOTE]\n> body'));
  ok('double-use no crash', html.length > 0);
  ok('double-use single callout', (html.match(/class="callout /g) || []).length === 1,
     `got ${(html.match(/class="callout /g) || []).length} callouts`);
}

// ── EDGE 18: parseCalloutMarker direct unit tests ─────────────────────────
console.log('\n── EDGE 18: parseCalloutMarker direct ──');
{
  const m1 = parseCalloutMarker('[!NOTE]', true);
  ok('parse basic', m1?.type === 'note' && m1?.title === '' && m1?.foldable === false);

  const m2 = parseCalloutMarker('[!NOTE]+', true);
  ok('parse +', m2?.foldable === 'open');

  const m3 = parseCalloutMarker('[!NOTE]-', true);
  ok('parse -', m3?.foldable === 'closed');

  const m4 = parseCalloutMarker('[!NOTE] custom title', true);
  ok('parse title', m4?.title === 'custom title');

  const m5 = parseCalloutMarker('[!BEST-PRACTICE]', true);
  ok('parse hyphenated', m5?.type === 'best-practice');

  const m6 = parseCalloutMarker('[!note]+', false);  // foldable disabled
  ok('parse foldable disabled', m6?.foldable === false);

  const m7 = parseCalloutMarker('not a marker', true);
  ok('parse non-marker returns null', m7 === null);

  // Tab after ] — consumed by [^\S\n]*
  const m8 = parseCalloutMarker('[!NOTE]\tTab title', true);
  ok('parse tab title', m8?.title === 'Tab title', `got: "${m8?.title}"`);

  // CR in title — `.` matches \r (only \n is excluded), so `(.*)` captures
  // `\rTitle`, then .trim() strips the \r. Result: title is `Title`.
  const m9 = parseCalloutMarker('[!NOTE]\rTitle', true);
  ok('parse CR title (trim strips \\r)', m9?.title === 'Title',
     `got: "${m9?.title}" (length ${m9?.title.length})`);
}

// ── EDGE 19: resolveConfig direct unit tests ──────────────────────────────
console.log('\n── EDGE 19: resolveConfig direct ──');
{
  const c1 = resolveConfig({});
  ok('default has showTitle', c1.showTitle === true);
  ok('default has showIcon', c1.showIcon === true);
  ok('default has enableFoldable', c1.enableFoldable === true);
  ok('default has tag', c1.tag === 'div');
  ok('default has note type', c1.types.note != null);
  ok('default has best-practice type', c1.types['best-practice'] != null);

  // disableBuiltins + icons auto-create stub type
  const c2 = resolveConfig({
    disableBuiltins: true,
    icons: { myType: '<svg>custom</svg>' },
  });
  ok('disableBuiltins: no note', c2.types.note == null);
  ok('disableBuiltins + icons: auto-create', c2.types.mytype?.icon === '<svg>custom</svg>');
  // Note: capitalize() splits on '-' only. 'mytype' has no hyphens, so
  // the auto-generated title is 'Mytype' (not 'My Type'). This is current
  // behavior; issue #4 tracks whether to extend capitalize to also split
  // on case boundaries.
  ok('disableBuiltins + icons: stub title is `Mytype` (capitalize splits on - only)',
     c2.types.mytype?.defaultTitle === 'Mytype',
     `got: "${c2.types.mytype?.defaultTitle}"`);

  // Conflicting case keys merge correctly
  const c3 = resolveConfig({
    callouts: { Foo: { defaultTitle: 'A' } },
    icons: { foo: '<svg>B</svg>' },
    titles: { FOO: 'C' },
  });
  ok('case-insensitive merge: title C wins', c3.types.foo?.defaultTitle === 'C',
     `got: "${c3.types.foo?.defaultTitle}"`);
  ok('case-insensitive merge: icon B wins', c3.types.foo?.icon === '<svg>B</svg>');
}

// ── EDGE 20: Callout as direct child of list item ─────────────────────────
console.log('\n── EDGE 20: callout in list (nested) ──');
{
  const md = '- Item 1\n  > [!NOTE]\n  > in list\n- Item 2';
  const html = await run(md);
  ok('in-list callout renders', html.includes('callout-note'));
  ok('list still renders', html.includes('Item 1'));
}

// ── EDGE 21: SVG with xml:space attribute ─────────────────────────────────
console.log('\n── EDGE 21: SVG with xml:space attr ──');
{
  const icon = '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve"><circle cx="12" cy="12" r="10"/></svg>';
  const html = await run('> [!NOTE]\n> body', {
    callouts: { note: { defaultTitle: 'Note', icon } },
  });
  ok('xml:space attr preserved', html.includes('xml:space'),
     `html: ${html.slice(0, 400)}`);
}

// ── EDGE 22: Empty user icon string ───────────────────────────────────────
console.log('\n── EDGE 22: empty user icon ──');
{
  const html = await run('> [!NOTE]\n> body', {
    callouts: { note: { defaultTitle: 'Note', icon: '' } },
  });
  // data.calloutIcon is '' (empty string is falsy), so `data.calloutIcon`
  // check fails and no icon span renders. This is current behavior.
  ok('empty icon: no icon span', !html.includes('callout-icon'),
     `html: ${html.slice(0, 300)}`);
}

// ── EDGE 23: SVG with HTML comment (BUG A regression check) ───────────────
// BUG A: the manual SVG parser used to break on HTML comments, producing
// malformed output like `<svg>!-- comment --><circle/></svg>`. After
// switching to a static import of hast-util-from-html, the comment is
// preserved correctly.
console.log('\n── EDGE 23: SVG with HTML comment (BUG A regression) ──');
{
  const icon = '<svg><!-- comment --><circle cx="12" cy="12" r="10"/></svg>';
  const html = await run('> [!NOTE]\n> body', {
    callouts: { note: { defaultTitle: 'Note', icon } },
  });
  ok('svg comment preserved (BUG A fixed)', html.includes('<!-- comment -->'),
     `html: ${html.slice(0, 400)}`);
  ok('no malformed ">!--" in output', !html.includes('>!--'),
     `html: ${html.slice(0, 400)}`);
  ok('circle element preserved', html.includes('<circle'));
  ok('cx attr preserved', html.includes('cx="12"'));
}

// ── EDGE 24: Title containing ]] (looks like nested marker) ───────────────
console.log('\n── EDGE 24: title with ]] ──');
{
  const md = '> [!NOTE] array]]\n> body';
  const html = await run(md);
  const title = html.match(/callout-title[^>]*>([^<]*)/)?.[1];
  ok('title with ]] preserved', title === 'array]]', `got: "${title}"`);
}

// ── EDGE 25: 100kb body (stress the body preservation) ────────────────────
console.log('\n── EDGE 25: large body (100kb) ──');
{
  const big = 'word '.repeat(20000);  // 100kb
  const md = `> [!NOTE]\n> ${big}`;
  const t0 = performance.now();
  const html = await run(md);
  const t1 = performance.now();
  ok('large body renders in <2s', (t1 - t0) < 2000, `took ${(t1 - t0).toFixed(0)}ms`);
  ok('large body contains "word"', html.includes('word'));
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`  Edge case probe: ${pass} pass, ${fail} fail`);
console.log(`${'─'.repeat(60)}`);
console.log(results.join('\n'));
if (fail > 0) process.exit(1);
