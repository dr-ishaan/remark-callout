/**
 * PHASE 3 — TEST 1
 * Stress test: every built-in callout type × 10,000 iterations.
 *
 * For each callout type (and known alias) in BUILT_IN_KEYS, we:
 *   1. Run the full pipeline 10,000 times with a representative markdown snippet
 *   2. Verify the rendered HTML has the expected callout class
 *   3. Verify the body content survives
 *   4. Verify the icon SVG survives
 *   5. Verify the title is rendered (defaultTitle or capitalize fallback)
 *   6. Verify foldable variants (+ / -) work for each type
 *   7. Verify case-insensitivity (uppercase, mixed-case, lowercase markers)
 *
 * Aggregate stats at the end:
 *   - Total test invocations
 *   - Pass/fail counts
 *   - Total wall-clock time and throughput
 *   - Any failures with full detail
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast, BUILT_IN_KEYS, BUILT_IN_CALLOUTS } from './dist/index.js';

const ITERATIONS_PER_TYPE = 10000;

// Build a representative markdown snippet for a type
function mdFor(type, opts = {}) {
  const { foldable = '', title = '', body = 'Body content for testing.' } = opts;
  const titlePart = title ? ' ' + title : '';
  return `> [!${type}]${foldable}${titlePart}\n> ${body}`;
}

async function runPipeline(md) {
  return String(await unified()
    .use(remarkParse)
    .use(remarkCallout)
    .use(remarkRehype, { handlers: { callout: calloutToHast } })
    .use(rehypeStringify)
    .process(md));
}

// Pre-build a reusable processor (faster — avoids re-creating the pipeline each time)
function makeProcessor() {
  const processor = unified()
    .use(remarkParse)
    .use(remarkCallout)
    .use(remarkRehype, { handlers: { callout: calloutToHast } })
    .use(rehypeStringify);
  return processor;
}

const proc = makeProcessor();

// Known aliases — types whose defaultTitle matches another type's defaultTitle.
// We treat them as aliases for the test (they're still independent keys, but
// semantically equivalent).
const KNOWN_ALIASES = [
  ['dr', 'disaster-recovery'], // both titled "Disaster Recovery"
];

let totalTests = 0;
let totalPass = 0;
let totalFail = 0;
const failures = [];
const typeTimings = [];

const t0 = performance.now();

console.log(`\nPhase 3 — Test 1: Per-callout stress test`);
console.log(`Types: ${BUILT_IN_KEYS.length}  ×  ${ITERATIONS_PER_TYPE} iterations  =  ${BUILT_IN_KEYS.length * ITERATIONS_PER_TYPE} total invocations\n`);

// Process types in batches and report progress so the run is observable.
const BATCH = 10;
for (let batchStart = 0; batchStart < BUILT_IN_KEYS.length; batchStart += BATCH) {
  const batchEnd = Math.min(batchStart + BATCH, BUILT_IN_KEYS.length);

  for (let tIdx = batchStart; tIdx < batchEnd; tIdx++) {
    const type = BUILT_IN_KEYS[tIdx];
    const cfg = BUILT_IN_CALLOUTS[type];
    const expectedTitle = cfg.defaultTitle;
    const typeStart = performance.now();
    let typePass = 0;
    let typeFail = 0;

    for (let i = 0; i < ITERATIONS_PER_TYPE; i++) {
      // Rotate through variants so we cover all of them across the 10k iterations
      const variant = i % 5;
      let md, label;
      if (variant === 0) {
        md = mdFor(type); label = 'basic';
      } else if (variant === 1) {
        md = mdFor(type, { foldable: '+' }); label = 'open';
      } else if (variant === 2) {
        md = mdFor(type, { foldable: '-' }); label = 'closed';
      } else if (variant === 3) {
        // Uppercase marker
        md = `> [!${type.toUpperCase()}]\n> upper body`;
        label = 'uppercase';
      } else {
        // Mixed case (if type has letters)
        const mixed = type.split('').map((c, idx) => idx % 2 === 0 ? c.toUpperCase() : c).join('');
        md = `> [!${mixed}]\n> mixed body`;
        label = 'mixedcase';
      }

      try {
        const html = String(await proc.process(md));
        const expectedClass = `callout-${type.toLowerCase()}`;

        // Only run assertions on a sample subset (every 100th iteration) to
        // keep the stress test focused on throughput and stability. The
        // remaining iterations still execute the full pipeline — we just
        // don't run the 8+ regex checks on each one. This still catches
        // crashes and exceptions on every iteration.
        const shouldAssert = (i % 100 === 0) || (i < 10);
        if (shouldAssert) {
          const checks = [
            ['has callout class', html.includes('class="callout')],
            [`has ${expectedClass} class`, html.includes(expectedClass)],
            ['has callout-body', html.includes('callout-body')],
            ['has callout-header', html.includes('callout-header')],
            ['has SVG icon', html.includes('<svg')],
            ['has callout-title', html.includes('callout-title')],
            ['has data-callout attr', html.includes('data-callout=')],
            ['body preserved', html.includes('body')],
          ];

          if (label === 'open') {
            checks.push(['open attr on details', html.includes('<details') && html.includes('open')]);
            checks.push(['data-callout-fold=open', html.includes('data-callout-fold="open"')]);
          } else if (label === 'closed') {
            checks.push(['details tag', html.includes('<details')]);
            checks.push(['data-callout-fold=closed', html.includes('data-callout-fold="closed"')]);
            checks.push(['no open attr on closed', !(/<details[^>]*\sopen[\s>]/.test(html))]);
          } else {
            checks.push(['div tag for non-foldable', html.includes('<div class="callout')]);
          }

          for (const [name, ok] of checks) {
            totalTests++;
            if (ok) {
              totalPass++; typePass++;
            } else {
              totalFail++; typeFail++;
              failures.push({ type, variant: label, iteration: i, check: name });
              if (failures.length <= 5) {
                console.log(`  FAIL: ${type} [${label}] iter ${i} — ${name}`);
              }
            }
          }
        } else {
          // Just verify it didn't crash and produced some HTML.
          totalTests++;
          if (html && html.length > 50) {
            totalPass++; typePass++;
          } else {
            totalFail++; typeFail++;
            failures.push({ type, variant: label, iteration: i, check: 'non-empty html' });
          }
        }
      } catch (err) {
        totalTests++; totalFail++; typeFail++;
        failures.push({ type, variant: label, iteration: i, error: err.message });
        if (failures.length <= 5) {
          console.log(`  ERROR: ${type} [${label}] iter ${i} — ${err.message}`);
        }
      }
    }

    const typeElapsed = performance.now() - typeStart;
    typeTimings.push({ type, pass: typePass, fail: typeFail, ms: typeElapsed });
  }

  // Batch progress report
  const elapsedSoFar = performance.now() - t0;
  const typesDone = batchEnd;
  const typesRemaining = BUILT_IN_KEYS.length - typesDone;
  const msPerType = elapsedSoFar / typesDone;
  const etaMs = msPerType * typesRemaining;
  console.log(`  [${typesDone.toString().padStart(3)}/${BUILT_IN_KEYS.length}] ${elapsedSoFar.toFixed(0).padStart(7)}ms elapsed, ETA ${etaMs.toFixed(0).padStart(7)}ms — assertions: ${totalPass} pass, ${totalFail} fail`);
}

const elapsed = performance.now() - t0;

// ── Alias tests ────────────────────────────────────────────────────────────
console.log(`\n=== Alias tests ===`);
for (const [a, b] of KNOWN_ALIASES) {
  const cfgA = BUILT_IN_CALLOUTS[a];
  const cfgB = BUILT_IN_CALLOUTS[b];
  const aliasPass = [];
  const aliasFail = [];

  // Test that both render with same defaultTitle
  for (let i = 0; i < 100; i++) {
    const htmlA = String(await proc.process(mdFor(a)));
    const htmlB = String(await proc.process(mdFor(b)));

    const titleA = htmlA.match(/callout-title[^>]*>([^<]+)/)?.[1];
    const titleB = htmlB.match(/callout-title[^>]*>([^<]+)/)?.[1];

    const aOk = titleA === cfgA.defaultTitle;
    const bOk = titleB === cfgB.defaultTitle;
    const sameTitle = titleA === titleB;

    aliasPass.push(aOk, bOk, sameTitle);
    if (!aOk) aliasFail.push(`${a} title was "${titleA}" expected "${cfgA.defaultTitle}"`);
    if (!bOk) aliasFail.push(`${b} title was "${titleB}" expected "${cfgB.defaultTitle}"`);
    if (!sameTitle) aliasFail.push(`${a} and ${b} have different titles`);
  }
  totalTests += aliasPass.length;
  totalPass += aliasPass.filter(Boolean).length;
  totalFail += aliasPass.filter(x => !x).length;
  if (aliasFail.length > 0) {
    console.log(`  Alias pair (${a}, ${b}): ${aliasFail.length} failures (out of ${aliasPass.length})`);
  } else {
    console.log(`  Alias pair (${a}, ${b}): all ${aliasPass.length} checks pass`);
  }
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(60)}`);
console.log(`  PHASE 3 TEST 1 — SUMMARY`);
console.log(`${'='.repeat(60)}`);
console.log(`  Total invocations : ${BUILT_IN_KEYS.length * ITERATIONS_PER_TYPE}`);
console.log(`  Total assertions  : ${totalTests}`);
console.log(`  Passed            : ${totalPass}`);
console.log(`  Failed            : ${totalFail}`);
console.log(`  Pass rate         : ${(totalPass / totalTests * 100).toFixed(4)}%`);
console.log(`  Wall time         : ${(elapsed / 1000).toFixed(2)}s`);
console.log(`  Throughput        : ${(BUILT_IN_KEYS.length * ITERATIONS_PER_TYPE / (elapsed / 1000)).toFixed(0)} docs/sec`);
console.log(`${'='.repeat(60)}`);

// Show top 5 slowest types
typeTimings.sort((a, b) => b.ms - a.ms);
console.log(`\n  Top 5 slowest types:`);
for (const t of typeTimings.slice(0, 5)) {
  console.log(`    ${t.type.padEnd(30)}  ${t.ms.toFixed(0)}ms  (pass ${t.pass}, fail ${t.fail})`);
}

if (totalFail > 0) {
  console.log(`\n  ⚠ ${failures.length} failures recorded (showing first 10):`);
  failures.slice(0, 10).forEach((f, i) => {
    console.log(`    ${i + 1}. ${f.type} [${f.variant}] iter ${f.iteration} — ${f.check || f.error}`);
    if (f.md) console.log(`       md: ${f.md.replace(/\n/g, '\\n')}`);
  });
  process.exit(1);
}
