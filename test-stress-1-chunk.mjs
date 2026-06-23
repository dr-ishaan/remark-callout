/**
 * PHASE 3 — TEST 1 (chunked)
 * Same as test-stress-1.mjs but reads START/END env vars so we can run it
 * in chunks and avoid being killed by process reapers.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast, BUILT_IN_KEYS, BUILT_IN_CALLOUTS } from './dist/index.js';

const ITERATIONS_PER_TYPE = 10000;

const START = parseInt(process.env.START || '0', 10);
const END = parseInt(process.env.END || String(BUILT_IN_KEYS.length), 10);

function mdFor(type, opts = {}) {
  const { foldable = '', title = '', body = 'Body content for testing.' } = opts;
  const titlePart = title ? ' ' + title : '';
  return `> [!${type}]${foldable}${titlePart}\n> ${body}`;
}

const proc = unified()
  .use(remarkParse)
  .use(remarkCallout)
  .use(remarkRehype, { handlers: { callout: calloutToHast } })
  .use(rehypeStringify);

let totalTests = 0;
let totalPass = 0;
let totalFail = 0;
const failures = [];

const t0 = performance.now();

const subset = BUILT_IN_KEYS.slice(START, END);
console.log(`\nPhase 3 — Test 1 (chunk ${START}-${END}): ${subset.length} types × ${ITERATIONS_PER_TYPE} = ${subset.length * ITERATIONS_PER_TYPE} invocations\n`);

for (let tIdx = 0; tIdx < subset.length; tIdx++) {
  const type = subset[tIdx];
  const typeStart = performance.now();
  let typePass = 0, typeFail = 0;

  for (let i = 0; i < ITERATIONS_PER_TYPE; i++) {
    const variant = i % 5;
    let md, label;
    if (variant === 0) { md = mdFor(type); label = 'basic'; }
    else if (variant === 1) { md = mdFor(type, { foldable: '+' }); label = 'open'; }
    else if (variant === 2) { md = mdFor(type, { foldable: '-' }); label = 'closed'; }
    else if (variant === 3) { md = `> [!${type.toUpperCase()}]\n> upper body`; label = 'uppercase'; }
    else {
      const mixed = type.split('').map((c, idx) => idx % 2 === 0 ? c.toUpperCase() : c).join('');
      md = `> [!${mixed}]\n> mixed body`;
      label = 'mixedcase';
    }

    try {
      const html = String(await proc.process(md));
      const expectedClass = `callout-${type.toLowerCase()}`;

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
          if (ok) { totalPass++; typePass++; }
          else {
            totalFail++; typeFail++;
            if (failures.length < 10) failures.push({ type, variant: label, iteration: i, check: name });
          }
        }
      } else {
        totalTests++;
        if (html && html.length > 50) { totalPass++; typePass++; }
        else {
          totalFail++; typeFail++;
          if (failures.length < 10) failures.push({ type, variant: label, iteration: i, check: 'non-empty html' });
        }
      }
    } catch (err) {
      totalTests++; totalFail++; typeFail++;
      if (failures.length < 10) failures.push({ type, variant: label, iteration: i, error: err.message });
    }
  }

  const typeElapsed = performance.now() - typeStart;
  // Print every type, compactly
  process.stdout.write(`  [${(START + tIdx + 1).toString().padStart(3)}/${BUILT_IN_KEYS.length}] ${type.padEnd(28)} ${typeElapsed.toFixed(0).padStart(5)}ms  pass ${typePass}  fail ${typeFail}\n`);
}

const elapsed = performance.now() - t0;

console.log(`\n${'='.repeat(60)}`);
console.log(`  CHUNK ${START}-${END} SUMMARY`);
console.log(`${'='.repeat(60)}`);
console.log(`  Types in chunk   : ${subset.length}`);
console.log(`  Total invocations: ${subset.length * ITERATIONS_PER_TYPE}`);
console.log(`  Total assertions : ${totalTests}`);
console.log(`  Passed           : ${totalPass}`);
console.log(`  Failed           : ${totalFail}`);
console.log(`  Pass rate        : ${(totalPass / totalTests * 100).toFixed(4)}%`);
console.log(`  Wall time        : ${(elapsed / 1000).toFixed(2)}s`);
console.log(`  Throughput       : ${(subset.length * ITERATIONS_PER_TYPE / (elapsed / 1000)).toFixed(0)} docs/sec`);
console.log(`${'='.repeat(60)}`);

if (totalFail > 0) {
  console.log(`\n  Failures (first 10):`);
  failures.forEach((f, i) => {
    console.log(`    ${i + 1}. ${f.type} [${f.variant}] iter ${f.iteration} — ${f.check || f.error}`);
  });
}

// Write JSON summary for aggregation
import { writeFileSync } from 'node:fs';
writeFileSync(`/home/z/my-project/stress1-chunk-${START}-${END}.json`, JSON.stringify({
  chunk: `${START}-${END}`,
  types: subset.length,
  invocations: subset.length * ITERATIONS_PER_TYPE,
  assertions: totalTests,
  pass: totalPass,
  fail: totalFail,
  wallMs: elapsed,
  throughput: subset.length * ITERATIONS_PER_TYPE / (elapsed / 1000),
  failures: failures.slice(0, 10),
}, null, 2));

if (totalFail > 0) process.exit(1);
