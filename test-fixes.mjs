/**
 * Sanity tests for the Phase 2 audit fixes.
 * Confirms each bug fix actually changes behavior.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast, BUILT_IN_KEYS } from './dist/index.js';
import { resolveConfig } from './dist/transform.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.log('  FAIL:', m); } };

async function run(md, opts = {}) {
  return String(await unified()
    .use(remarkParse)
    .use(remarkCallout, opts)
    .use(remarkRehype, { handlers: { callout: calloutToHast } })
    .use(rehypeStringify)
    .process(md));
}

// ── BUG #1: inline non-text children after marker preserved ──
console.log('\n=== BUG #1: inline children preserved ===');
{
  const html = await run('> [!NOTE] **bold** text');
  ok(html.includes('<strong>bold</strong>'), 'bold preserved in body');
  ok(html.includes('text'), 'trailing text preserved');
  ok(html.includes('callout-title">Note'), 'title is "Note" (default), not "bold"');

  const html2 = await run('> [!NOTE] [link](http://x)');
  ok(html2.includes('<a href="http://x">link</a>'), 'link preserved in body');

  const html3 = await run('> [!NOTE] `code`');
  ok(html3.includes('<code>code</code>'), 'inline code preserved in body');
}

// ── BUG #2: showTitle / showIcon respected ──
console.log('\n=== BUG #2: showTitle / showIcon ===');
{
  const html1 = await run('> [!NOTE] body', { showTitle: false });
  ok(!html1.includes('callout-title'), 'showTitle:false omits title span');

  const html2 = await run('> [!NOTE] body', { showIcon: false });
  ok(!html2.includes('callout-icon'), 'showIcon:false omits icon span');
  ok(!html2.includes('<svg'), 'showIcon:false emits no SVG');

  const html3 = await run('> [!NOTE] body', { showTitle: false, showIcon: false });
  ok(!html3.includes('callout-title') && !html3.includes('callout-icon'), 'both off together');

  const html4 = await run('> [!NOTE] body'); // defaults
  ok(html4.includes('callout-title') && html4.includes('callout-icon'), 'defaults keep both');
}

// ── BUG #3: case-insensitive key matching ──
console.log('\n=== BUG #3: case-insensitive keys ===');
{
  // Use multi-line callout so 'body' is body, not title.
  const html = await run('> [!MYTYPE]\n> body', {
    callouts: { myType: { defaultTitle: 'My Type', icon: '<svg><circle/></svg>' } },
  });
  ok(html.includes('callout-mytype'), 'lowercased class name applied');
  ok(html.includes('callout-title">My Type'), 'user-supplied defaultTitle used');

  const html2 = await run('> [!note]\n> body', {
    icons: { Note: '<svg class="custom-icon"><circle/></svg>' }, // capital N
  });
  ok(html2.includes('custom-icon'), 'capitalized icon override key works');

  const html3 = await run('> [!NOTE]\n> body', {
    titles: { NOTE: 'Capital Title' },
  });
  ok(html3.includes('Capital Title'), 'capitalized title override works');
}

// ── BUG #4: attribute-less <svg> icons render ──
console.log('\n=== BUG #4: attribute-less SVG ===');
{
  const html = await run('> [!NOTE] body', {
    callouts: {
      note: {
        defaultTitle: 'Note',
        icon: '<svg><circle cx="12" cy="12" r="10"/></svg>',
      },
    },
  });
  ok(html.includes('<svg'), 'attribute-less svg emitted');
  ok(html.includes('<circle'), 'inner circle preserved');
  ok(html.includes('cx="12"'), 'circle attributes preserved');
}

// ── BUG #5: icons/titles overrides with disableBuiltins ──
console.log('\n=== BUG #5: overrides with disableBuiltins ===');
{
  const html = await run('> [!myType]\n> body', {
    disableBuiltins: true,
    icons: { myType: '<svg class="custom"><circle/></svg>' },
    titles: { myType: 'My Custom Title' },
  });
  ok(html.includes('custom'), 'disableBuiltins + icon override works');
  ok(html.includes('My Custom Title'), 'disableBuiltins + title override works');

  // also: existing type override still works (not disabled)
  const html2 = await run('> [!note]\n> body', {
    icons: { note: '<svg class="custom-note"><circle/></svg>' },
  });
  ok(html2.includes('custom-note'), 'override on existing built-in still works');
}

// ── BUG #13: capitalize handles hyphens ──
console.log('\n=== BUG #13: capitalize hyphens ===');
{
  // Unknown type with hyphen, no title, no body — should use capitalize fallback
  const html = await run('> [!unknown-type]\n> body');
  ok(html.includes('callout-title">Unknown Type'), 'hyphenated fallback title is "Unknown Type"');
}

// ── BUG #14: user-select only on foldable ──
console.log('\n=== BUG #14: user-select scoped (CSS) ===');
{
  const css = await import('node:fs').then(m => m.readFileSync('./styles/callout.css', 'utf8'));
  // Use anchored regexes that don't accidentally match substrings of longer selectors.
  const hasGlobal = /(^|\n)\s*\.callout-header\s*\{[^}]*user-select:\s*none/.test(css);
  const hasScoped = /(^|\n)\s*\.callout-foldable\s*>\s*\.callout-header\s*\{[^}]*user-select:\s*none/.test(css);
  ok(!hasGlobal, 'no global user-select:none on .callout-header');
  ok(hasScoped, 'user-select:none scoped to .callout-foldable > .callout-header');
}

// ── BUG #15: callout-empty class emitted for empty body ──
console.log('\n=== BUG #15: callout-empty class ===');
{
  const html = await run('> [!NOTE]'); // no body
  ok(html.includes('callout-empty'), 'empty callout gets callout-empty class');

  const html2 = await run('> [!NOTE]\n> body');
  ok(!html2.includes('callout-empty'), 'non-empty callout does NOT get callout-empty class');
}

// ── BUG #8: single-quoted attributes ──
console.log('\n=== BUG #8: single-quoted SVG attributes ===');
{
  const html = await run('> [!NOTE] body', {
    callouts: {
      note: {
        defaultTitle: 'Note',
        icon: "<svg xmlns='http://www.w3.org/2000/svg'><circle cx='12' cy='12' r='10'/></svg>",
      },
    },
  });
  ok(html.includes('xmlns='), 'single-quoted xmlns preserved');
  ok(html.includes('cx="12"') || html.includes("cx='12'"), 'single-quoted cx preserved (as either quote style)');
}

// ── Nested callouts still work (regression check) ──
console.log('\n=== Nested callouts regression ===');
{
  const html = await run('> [!NOTE] outer\n> > [!WARNING] inner');
  ok(html.includes('callout-note'), 'outer callout rendered');
  ok(html.includes('callout-warning'), 'inner callout rendered');
  ok(/callout-note[\s\S]*callout-warning/.test(html), 'inner nested inside outer');
}

// ── Deep nesting (5 levels) ──
console.log('\n=== Deep nesting (5 levels) ===');
{
  const md = ['> [!NOTE] L1', '> > [!WARNING] L2', '> > > [!TIP] L3', '> > > > [!DANGER] L4', '> > > > > [!SUCCESS] L5'].join('\n');
  const html = await run(md);
  ok(html.includes('callout-note'), 'L1 rendered');
  ok(html.includes('callout-warning'), 'L2 rendered');
  ok(html.includes('callout-tip'), 'L3 rendered');
  ok(html.includes('callout-danger'), 'L4 rendered');
  ok(html.includes('callout-success'), 'L5 rendered');
}

// ── resolveConfig: BUILT_IN_KEYS still all lowercase after normalization ──
console.log('\n=== BUILT_IN_KEYS sanity ===');
{
  const cfg = resolveConfig({});
  const allLower = Object.keys(cfg.types).every(k => k === k.toLowerCase());
  ok(allLower, 'all built-in types are lowercase keys');
  ok(cfg.types.note != null, 'note present');
  ok(cfg.types['best-practice'] != null, 'best-practice (hyphenated) present');
}

console.log(`\n=========================================`);
console.log(`  Phase 2 fix tests:  Passed: ${pass}  |  Failed: ${fail}`);
console.log(`=========================================`);
if (fail > 0) process.exit(1);
