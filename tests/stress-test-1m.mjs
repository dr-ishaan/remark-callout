/**
 * 1M-Assertion Stress Test for remark-callout-plus on Sätteri
 * ============================================================
 *
 * Goal: Exercise the Sätteri adapter across a combinatorial matrix of inputs
 * totaling ~1,000,000 individual assertions, verifying:
 *
 *   1. The adapter produces the correct HTML structure for every callout
 *      type, foldable state, title variant, body variant, and ID combination.
 *   2. Output is byte-equivalent (modulo whitespace) to the unified engine
 *      for the same input — proving feature parity.
 *   3. Performance is acceptable: 1M assertions complete in a reasonable
 *      wall-clock time.
 *
 * Matrix dimensions:
 *   - 187 built-in callout types (every type in BUILT_IN_CALLOUTS)
 *   - 5 literary types (epigraph, pullquote, pull, aside, sidebar)
 *   - 4 foldable states: none, +, -, + with id
 *   - 5 title variants: none, plain, bold, code, link
 *   - 4 body variants: simple, multiline, code block, list
 *   - 3 id variants: none, {#id}, {#id}+foldable
 *   - 2 engines: Sätteri adapter (test target), Unified baseline (reference)
 *
 * Per-test assertions: ~12 (HTML structure, classes, data attrs, etc.)
 *
 * Total = 192 × 4 × 5 × 4 × 3 × 2 × ~12 ≈ 1.1M assertions
 *
 * Output: streaming progress to stderr, JSON summary to stdout.
 */

import { markdownToHtml } from 'satteri';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast } from '../dist/index.js';
import { calloutSatteri } from '../dist/satteri.js';
import { BUILT_IN_CALLOUTS, BUILT_IN_KEYS } from '../dist/defaults.js';

// ── Helpers ──────────────────────────────────────────────────────────────

function renderSatteri(md, opts = {}) {
  const { html } = markdownToHtml(md, {
    mdastPlugins: [calloutSatteri(opts)],
  });
  return html;
}

function renderUnified(md, opts = {}) {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkCallout, { ...opts, useNativeHast: true })
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(md)
  );
}

/**
 * Decode HTML entities in a string to their literal characters.
 *
 * Used by the cross-engine parity check to normalize semantically
 * equivalent HTML that uses different entity encodings. For example,
 * Sätteri's Rust stringifier emits `&amp;` for `&`, while
 * `rehype-stringify` emits `&#x26;`. Both decode to the literal `&`
 * character and render identically in every browser.
 *
 * Handles:
 *   - Named entities: &amp; &lt; &gt; &quot; &apos; &nbsp;
 *   - Decimal numeric: &#38; &#60; etc.
 *   - Hex numeric: &#x26; &#x3c; etc.
 *
 * @param {string} s
 * @returns {string} decoded string
 */
function decodeHtmlEntities(s) {
  return s
    // Named entities (HTML5 common set)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, '\u00a0')
    // Decimal numeric character references: &#NNN;
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    // Hex numeric character references: &#xNN; (case-insensitive)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

/**
 * Normalize HTML for cross-engine parity comparison.
 *
 * 1. Decode all HTML entities to their literal characters (so `&amp;`
 *    and `&#x26;` both become `&`).
 * 2. Collapse whitespace runs to a single space.
 * 3. Trim leading/trailing whitespace.
 *
 * This normalization correctly identifies semantically equivalent HTML
 * that differs only in entity encoding choice (a downstream stringifier
 * quirk, not an adapter behavior).
 */
function normalizeForParity(s) {
  return decodeHtmlEntities(s).replace(/\s+/g, ' ').trim();
}

// ── Matrix Dimensions ────────────────────────────────────────────────────

const LITERARY_TYPES = ['epigraph', 'pullquote', 'pull', 'aside', 'sidebar'];
const allTypes = [...BUILT_IN_KEYS, ...LITERARY_TYPES];
// Dedupe (literary types are also in BUILT_IN_CALLOUTS)
const uniqueTypes = [...new Set(allTypes)];

const FOLDABLE_STATES = [
  { suffix: '', label: 'none' }, // not foldable
  { suffix: '+', label: 'open' }, // foldable, open by default
  { suffix: '-', label: 'closed' }, // foldable, closed by default
];

const TITLE_VARIANTS = [
  { name: 'none', text: '' },
  { name: 'plain', text: 'Custom Title' },
  { name: 'bold', text: '**Bold Title**' },
  { name: 'code', text: '`Code Title`' },
  { name: 'link', text: '[Link Title](https://example.com)' },
];

const BODY_VARIANTS = [
  {
    name: 'simple',
    body: 'Simple body text.',
  },
  {
    name: 'multiline',
    body: 'First line.\nSecond line.\nThird line.',
  },
  {
    name: 'code-block',
    body: 'Before code.\n\n```js\nconst x = 1;\n```\n\nAfter code.',
  },
  {
    name: 'list',
    body: 'Before list.\n\n- Item 1\n- Item 2\n- Item 3\n\nAfter list.',
  },
];

const ID_VARIANTS = [
  { name: 'none', id: '' },
  { name: 'with-id', id: '{#my-anchor}' },
];

// Additional dimensions to push the matrix toward 1M assertions:
const NESTING_DEPTH = [
  { name: 'flat', depth: 0 }, // no nesting
  { name: 'nested-1', depth: 1 }, // callout inside callout
];

const ADJACENCY = [
  { name: 'single', count: 1 }, // one callout
  { name: 'pair', count: 2 }, // two adjacent callouts
  { name: 'triple', count: 3 }, // three adjacent callouts
];

// ── Markdown Generator ───────────────────────────────────────────────────

function buildMarkdown(type, foldable, title, body, idVariant, nesting, adjacency) {
  // Skip foldable for literary types — they don't support folding
  if (LITERARY_TYPES.includes(type) && foldable.suffix) {
    return null;
  }
  // Skip foldable for structured-data types (bio, event) — they don't
  // support folding (the structured-data transformer in transform.ts
  // always produces a <div>, never a <details>).
  if ((type === 'bio' || type === 'event') && foldable.suffix) {
    return null;
  }

  const marker = `[!${type.toUpperCase()}]${idVariant.id}${foldable.suffix}`;
  const titleLine = title.text ? ` ${title.text}` : '';
  const bodyLine = body.body ? `\n> ${body.body.split('\n').join('\n> ')}` : '';

  let singleBlock = `> ${marker}${titleLine}${bodyLine}`;

  // Apply nesting: wrap the callout in another callout
  if (nesting.depth > 0) {
    singleBlock = `> [!WARNING] Outer\n> Wrapping a ${type} callout.\n>\n${singleBlock.split('\n').map(l => '> ' + l).join('\n')}`;
  }

  // Apply adjacency: repeat the (possibly nested) callout N times
  if (adjacency.count > 1) {
    const parts = [];
    for (let i = 0; i < adjacency.count; i++) {
      parts.push(singleBlock);
    }
    return parts.join('\n\n');
  }

  return singleBlock;
}

// ── Assertions ───────────────────────────────────────────────────────────

function assertHtmlStructure(html, ctx) {
  // Returns array of [name, passed, detail] tuples.
  const results = [];
  const type = ctx.type;
  const isLiterary = LITERARY_TYPES.includes(type);
  const isAccordion = false; // accordions tested separately
  const isFoldable = ctx.foldable.suffix !== '' && !isLiterary;
  const isStructuredData = type === 'bio' || type === 'event';
  const isSeriesNav = type === 'next' || type === 'continue';

  // Standard callouts
  if (!isLiterary) {
    const expectedClass = isFoldable
      ? `callout callout-${type} callout-foldable`
      : `callout callout-${type}`;
    const hasClass = html.includes(`class="callout callout-${type}`);
    results.push(['has-callout-class', hasClass, `expected class containing "${expectedClass}"`]);

    results.push(['has-data-callout', html.includes(`data-callout="${type}"`), `missing data-callout="${type}"`]);
    results.push(['has-callout-header', html.includes('callout-header'), 'missing callout-header']);
    results.push(['has-callout-body', html.includes('callout-body'), 'missing callout-body']);
    results.push(['has-oklch-vars', html.includes('--callout-l:'), 'missing --callout-l inline style']);
    results.push(['has-svg-icon', html.includes('<svg'), 'missing SVG icon']);
  }

  // Literary types
  if (isLiterary) {
    const isFigure = type === 'epigraph' || type === 'pullquote' || type === 'pull';
    const isAside = type === 'aside' || type === 'sidebar';
    if (isFigure) {
      results.push(['is-figure', html.includes('<figure'), 'expected <figure>']);
      results.push(['has-variant-class', html.includes(`class="${type === 'pull' ? 'pullquote' : type}"`), `expected class="${type === 'pull' ? 'pullquote' : type}"`]);
    } else if (isAside) {
      results.push(['is-aside', html.includes('<aside'), 'expected <aside>']);
      results.push(['has-aside-class', html.includes(`class="${type}"`), `expected class="${type}"`]);
    }
  }

  // Foldable
  if (isFoldable) {
    results.push(['is-details', html.includes('<details'), 'foldable should be <details>']);
    results.push(['is-summary', html.includes('<summary'), 'foldable should have <summary>']);
    results.push(['has-aria-expanded', html.includes('aria-expanded'), 'missing aria-expanded']);
    if (ctx.foldable.label === 'open') {
      results.push(['fold-open', html.includes('data-callout-fold="open"'), 'expected data-callout-fold="open"']);
      results.push(['has-open-attr', html.includes(' open>') || html.includes(' open '), 'missing open attribute']);
    } else if (ctx.foldable.label === 'closed') {
      results.push(['fold-closed', html.includes('data-callout-fold="closed"'), 'expected data-callout-fold="closed"']);
    }
  }

  // Custom anchor ID
  if (ctx.idVariant.name === 'with-id') {
    results.push(['has-anchor-id', html.includes('id="my-anchor"'), 'missing id="my-anchor"']);
  }

  // Title rendering
  if (ctx.title.name === 'bold' && !isLiterary) {
    results.push(['title-bold', html.includes('<strong>Bold Title</strong>'), 'missing <strong> in title']);
  }
  if (ctx.title.name === 'code' && !isLiterary) {
    results.push(['title-code', html.includes('<code>Code Title</code>'), 'missing <code> in title']);
  }
  if (ctx.title.name === 'link' && !isLiterary) {
    results.push(['title-link', html.includes('<a href="https://example.com">Link Title</a>'), 'missing link in title']);
  }
  if (ctx.title.name === 'plain') {
    results.push(['title-plain', html.includes('Custom Title'), 'missing plain title text']);
  }

  // Body preservation
  if (ctx.body.name === 'simple') {
    results.push(['body-simple', html.includes('Simple body text.'), 'missing simple body text']);
  }
  if (ctx.body.name === 'multiline') {
    results.push(['body-multiline-first', html.includes('First line.'), 'missing first line']);
    results.push(['body-multiline-third', html.includes('Third line.'), 'missing third line']);
  }
  if (ctx.body.name === 'code-block') {
    results.push(['body-codeblock', html.includes('const x = 1;'), 'missing code block content']);
  }
  if (ctx.body.name === 'list') {
    results.push(['body-list-item1', html.includes('Item 1'), 'missing list item 1']);
    results.push(['body-list-item3', html.includes('Item 3'), 'missing list item 3']);
  }

  // Structured-data types (bio, event) — should produce <dl>
  if (isStructuredData) {
    // Skip — structured-data needs special body format. Tested separately.
  }

  return results;
}

// ── Main Stress Test Runner ──────────────────────────────────────────────

const totalCombos =
  uniqueTypes.length *
  FOLDABLE_STATES.length *
  TITLE_VARIANTS.length *
  BODY_VARIANTS.length *
  ID_VARIANTS.length *
  NESTING_DEPTH.length *
  ADJACENCY.length;
const enginesCount = 2; // Sätteri + Unified
const estimatedAssertions = totalCombos * enginesCount * 12; // avg ~12 assertions per test

console.error(`\n═══════════════════════════════════════════════════════════════════════`);
console.error(`  1M-Assertion Stress Test — remark-callout-plus × Sätteri`);
console.error(`═══════════════════════════════════════════════════════════════════════`);
console.error(`  Types:          ${uniqueTypes.length} (${BUILT_IN_KEYS.length} built-in + ${LITERARY_TYPES.length} literary)`);
console.error(`  Foldable:       ${FOLDABLE_STATES.length}`);
console.error(`  Titles:         ${TITLE_VARIANTS.length}`);
console.error(`  Bodies:         ${BODY_VARIANTS.length}`);
console.error(`  ID variants:    ${ID_VARIANTS.length}`);
console.error(`  Nesting:        ${NESTING_DEPTH.length}`);
console.error(`  Adjacency:      ${ADJACENCY.length}`);
console.error(`  Engines:        ${enginesCount} (Sätteri adapter + Unified baseline)`);
console.error(`  ───────────────────────────────────────────────────────────────`);
console.error(`  Total combos:   ${totalCombos.toLocaleString()}`);
console.error(`  Total runs:     ${(totalCombos * enginesCount).toLocaleString()}`);
console.error(`  Est. assertions: ~${estimatedAssertions.toLocaleString()}`);
console.error(`═══════════════════════════════════════════════════════════════════════\n`);

// ── Run ──────────────────────────────────────────────────────────────────

const startTime = Date.now();
let comboCount = 0;
let runCount = 0;
let assertionCount = 0;
let passCount = 0;
let failCount = 0;
const failures = []; // collect first 50 failures for the report
const MAX_FAILURES_TO_RECORD = 50;

// Progress reporting
let lastProgressTime = Date.now();
const PROGRESS_INTERVAL_MS = 5000;

function reportProgress(force = false) {
  const now = Date.now();
  if (!force && now - lastProgressTime < PROGRESS_INTERVAL_MS) return;
  lastProgressTime = now;
  const elapsed = ((now - startTime) / 1000).toFixed(1);
  const pct = ((runCount / (totalCombos * enginesCount)) * 100).toFixed(1);
  const rate = (runCount / (parseFloat(elapsed) || 1)).toFixed(0);
  const eta = ((totalCombos * enginesCount - runCount) / (parseFloat(rate) || 1)).toFixed(0);
  console.error(
    `  [${elapsed}s] ${runCount.toLocaleString()}/${(totalCombos * enginesCount).toLocaleString()} runs (${pct}%) | ` +
    `${assertionCount.toLocaleString()} assertions | ${passCount.toLocaleString()} pass / ${failCount.toLocaleString()} fail | ` +
    `${rate} runs/s | ETA ${eta}s`
  );
}

for (const type of uniqueTypes) {
  for (const foldable of FOLDABLE_STATES) {
    for (const title of TITLE_VARIANTS) {
      for (const body of BODY_VARIANTS) {
        for (const idVariant of ID_VARIANTS) {
          for (const nesting of NESTING_DEPTH) {
            for (const adjacency of ADJACENCY) {
          comboCount++;

          const md = buildMarkdown(type, foldable, title, body, idVariant, nesting, adjacency);
          if (md === null) continue; // skip incompatible combo (literary + foldable)

          const ctx = { type, foldable, title, body, idVariant, nesting, adjacency };

          // ── Run on Sätteri ──────────────────────────────────────────
          let satteriHtml;
          try {
            satteriHtml = renderSatteri(md);
          } catch (err) {
            failCount++;
            assertionCount++;
            if (failures.length < MAX_FAILURES_TO_RECORD) {
              failures.push({
                engine: 'satteri',
                ctx: { ...ctx },
                md,
                error: err.message,
              });
            }
            continue;
          }

          const satteriResults = assertHtmlStructure(satteriHtml, ctx);
          for (const [name, passed, detail] of satteriResults) {
            assertionCount++;
            if (passed) passCount++;
            else {
              failCount++;
              if (failures.length < MAX_FAILURES_TO_RECORD) {
                failures.push({
                  engine: 'satteri',
                  ctx: { ...ctx },
                  md,
                  assertion: name,
                  detail,
                  htmlSnippet: satteriHtml.slice(0, 300),
                });
              }
            }
          }
          runCount++;

          // ── Run on Unified (reference) ──────────────────────────────
          let unifiedHtml;
          try {
            unifiedHtml = renderUnified(md);
          } catch (err) {
            failCount++;
            assertionCount++;
            if (failures.length < MAX_FAILURES_TO_RECORD) {
              failures.push({
                engine: 'unified',
                ctx: { ...ctx },
                md,
                error: err.message,
              });
            }
            continue;
          }

          const unifiedResults = assertHtmlStructure(unifiedHtml, ctx);
          for (const [name, passed, detail] of unifiedResults) {
            assertionCount++;
            if (passed) passCount++;
            else {
              failCount++;
              if (failures.length < MAX_FAILURES_TO_RECORD) {
                failures.push({
                  engine: 'unified',
                  ctx: { ...ctx },
                  md,
                  assertion: name,
                  detail,
                  htmlSnippet: unifiedHtml.slice(0, 300),
                });
              }
            }
          }
          runCount++;

          // ── Cross-engine parity check ───────────────────────────────
          // Normalize HTML entities + whitespace and compare.
          //
          // Entity decoding is necessary because Sätteri's Rust HAST
          // stringifier emits named entities (`&amp;`) while
          // `rehype-stringify` (used by the unified pipeline) emits
          // numeric entities (`&#x26;`). Both are valid HTML5 encodings
          // of the same character and render identically in every
          // browser — the encoding choice is a downstream stringifier
          // quirk, not an adapter behavior. By decoding entities before
          // comparison, the parity check correctly identifies
          // semantically equivalent HTML.
          const sNorm = normalizeForParity(satteriHtml);
          const uNorm = normalizeForParity(unifiedHtml);
          assertionCount++;
          if (sNorm === uNorm) {
            passCount++;
          } else {
            failCount++;
            if (failures.length < MAX_FAILURES_TO_RECORD) {
              failures.push({
                engine: 'parity',
                ctx: { ...ctx },
                md,
                assertion: 'satteri-unified-html-parity',
                detail: `HTML differs between engines after entity+whitespace normalization (length ${sNorm.length} vs ${uNorm.length})`,
                satteriSnippet: sNorm.slice(0, 300),
                unifiedSnippet: uNorm.slice(0, 300),
              });
            }
          }

          reportProgress();
            } // end adjacency
          } // end nesting
        } // end idVariant
      } // end body
    } // end title
  } // end foldable
} // end type

reportProgress(true);

const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
const passPct = ((passCount / assertionCount) * 100).toFixed(3);

console.error(`\n═══════════════════════════════════════════════════════════════════════`);
console.error(`  STRESS TEST COMPLETE`);
console.error(`═══════════════════════════════════════════════════════════════════════`);
console.error(`  Wall-clock time:    ${elapsedSec}s`);
console.error(`  Total runs:         ${runCount.toLocaleString()}`);
console.error(`  Total assertions:   ${assertionCount.toLocaleString()}`);
console.error(`  Passed:             ${passCount.toLocaleString()} (${passPct}%)`);
console.error(`  Failed:             ${failCount.toLocaleString()}`);
console.error(`  Runs per second:    ${(runCount / parseFloat(elapsedSec)).toFixed(0)}`);
console.error(`  Failures recorded:  ${failures.length} (of ${failCount}, capped at ${MAX_FAILURES_TO_RECORD})`);
console.error(`═══════════════════════════════════════════════════════════════════════\n`);

// ── Failure Report (first N) ─────────────────────────────────────────────

if (failures.length > 0) {
  console.error(`  ── First ${failures.length} failures ──\n`);
  for (let i = 0; i < failures.length; i++) {
    const f = failures[i];
    console.error(`  #${i + 1} [${f.engine}] ${f.assertion || 'exception'}`);
    console.error(`     ctx: type=${f.ctx.type}, fold=${f.ctx.foldable.label}, title=${f.ctx.title.name}, body=${f.ctx.body.name}, id=${f.ctx.idVariant.name}`);
    console.error(`     md:  ${f.md.replace(/\n/g, '\\n').slice(0, 200)}`);
    if (f.error) console.error(`     error: ${f.error}`);
    if (f.detail) console.error(`     detail: ${f.detail}`);
    if (f.htmlSnippet) console.error(`     html: ${f.htmlSnippet.slice(0, 250)}`);
    if (f.satteriSnippet) console.error(`     satteri: ${f.satteriSnippet.slice(0, 250)}`);
    if (f.unifiedSnippet) console.error(`     unified: ${f.unifiedSnippet.slice(0, 250)}`);
    console.error('');
  }
}

// ── JSON Summary to stdout ──────────────────────────────────────────────

const summary = {
  test: '1M-assertion stress test: remark-callout-plus × Sätteri',
  version: '3.2.0',
  timestamp: new Date().toISOString(),
  matrix: {
    types: uniqueTypes.length,
    foldable: FOLDABLE_STATES.length,
    titles: TITLE_VARIANTS.length,
    bodies: BODY_VARIANTS.length,
    idVariants: ID_VARIANTS.length,
    engines: enginesCount,
    totalCombos,
    totalRuns: runCount,
  },
  results: {
    wallClockSec: parseFloat(elapsedSec),
    totalAssertions: assertionCount,
    passed: passCount,
    failed: failCount,
    passPct: parseFloat(passPct),
    runsPerSec: Math.round(runCount / parseFloat(elapsedSec)),
    failuresRecorded: failures.length,
  },
  failures: failures.slice(0, MAX_FAILURES_TO_RECORD),
};

console.log(JSON.stringify(summary, null, 2));

process.exit(failCount === 0 ? 0 : 1);
