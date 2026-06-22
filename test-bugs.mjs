/**
 * Comprehensive test for remark-callout bug fixes.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast, BUILT_IN_CALLOUTS, BUILT_IN_KEYS } from './dist/index.js';

const passed = [];
const failed = [];

function assert(condition, testName) {
  if (condition) {
    passed.push(testName);
    console.log(`  PASS: ${testName}`);
  } else {
    failed.push(testName);
    console.log(`  FAIL: ${testName}`);
  }
}

async function processMarkdown(md) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkCallout)
    .use(remarkRehype, { handlers: { callout: calloutToHast } })
    .use(rehypeStringify)
    .process(md);
  return String(result);
}

// ─── Test Bug 1 Fix: Body content NOT silently dropped ─────────────────

console.log('\n=== Bug 1: Body content silently dropped ===');

{
  const html = await processMarkdown('> [!NOTE] This is inline body text');
  assert(
    html.includes('This is inline body text'),
    'Inline body text on marker line is preserved'
  );
  assert(
    html.includes('callout-body'),
    'Callout body container exists'
  );
}

{
  const html = await processMarkdown('> [!WARNING]\n> First paragraph\n> Second paragraph');
  assert(
    html.includes('First paragraph') && html.includes('Second paragraph'),
    'Multi-line body content is preserved'
  );
}

{
  const html = await processMarkdown('> [!TIP]');
  assert(
    html.includes('callout'),
    'Callout without body still renders'
  );
}

{
  const html = await processMarkdown('> [!NOTE] Custom Title\n> Body content here');
  assert(
    html.includes('Custom Title') && html.includes('Body content here'),
    'Custom title + body both preserved'
  );
}

// ─── Test Bug 2 Fix: SVG icons rendered as proper elements ─────────────

console.log('\n=== Bug 2: SVG icons rendered as escaped text ===');

{
  const html = await processMarkdown('> [!NOTE] Test');
  assert(
    html.includes('<svg'),
    'SVG element is rendered as actual HTML tag (not escaped)'
  );
  assert(
    !html.includes('&lt;svg'),
    'SVG is NOT escaped as &lt;svg'
  );
  assert(
    html.includes('callout-icon'),
    'callout-icon class is present'
  );
}

{
  const html = await processMarkdown('> [!DANGER] Test');
  assert(
    html.includes('<svg'),
    'DANGER callout also renders SVG properly'
  );
}

// ─── Test Bug 3 Fix: Hyphenated callout types ──────────────────────────

console.log('\n=== Bug 3: Hyphenated callout types not matching ===');

const hyphenatedTypes = [
  'API-ENDPOINT',
  'BREAKING-CHANGE',
  'LEGACY-MOVE',
  'DISASTER-RECOVERY',
  'TEST-CASE',
  'TEST-SPEC',
  'AI-MODEL',
  'FLAVOR-TEXT',
  'PEER-REVIEW',
  'ERROR-FIX',
  'EDGE-CASE',
  'FURTHER-READING',
  'TRADE-OFF',
  'PROS-CONS',
  'ANTI-PATTERN',
  'BAD-PRACTICE',
  'BEST-PRACTICE',
  'PRO-TIP',
  'SPRINT-GOAL',
  'EASTER-EGG',
  'FUN-FACT',
  'USER-STORY',
  'UX-INSIGHT',
  'DEEP-DIVE',
  'CI-CD',
  'GITHUB-ACTIONS',
  'RATE-LIMIT',
];

for (const type of hyphenatedTypes) {
  const html = await processMarkdown(`> [!${type}] Testing ${type}`);
  const expectedClass = `callout-${type.toLowerCase()}`;
  const hasCallout = html.includes('callout');
  const hasTypeClass = html.includes(expectedClass);
  const hasBody = html.includes(`Testing ${type}`);
  assert(
    hasCallout && hasTypeClass,
    `[!${type}] matches and creates .${expectedClass}`
  );
  assert(
    hasBody,
    `[!${type}] body content preserved`
  );
}

// ─── Test Bug 3 sub: rate-limit in BUILT_IN_CALLOUTS ───────────────────

console.log('\n=== Bug 3 sub: rate-limit defined in BUILT_IN_CALLOUTS ===');

assert(
  'rate-limit' in BUILT_IN_CALLOUTS,
  'rate-limit is defined in BUILT_IN_CALLOUTS'
);
assert(
  BUILT_IN_CALLOUTS['rate-limit'].defaultTitle === 'Rate Limit',
  'rate-limit has correct defaultTitle "Rate Limit"'
);
assert(
  BUILT_IN_KEYS.includes('rate-limit'),
  'rate-limit is in BUILT_IN_KEYS'
);

// ─── Additional edge case tests ────────────────────────────────────────

console.log('\n=== Additional edge cases ===');

{
  const html = await processMarkdown('> [!BEST-PRACTICE]+ Expandable tip');
  assert(
    html.includes('callout-foldable'),
    'Foldable hyphenated callout works with +'
  );
  assert(
    html.includes('open'),
    'Foldable open state is set'
  );
}

{
  const html = await processMarkdown('> [!CI-CD]- Collapsed by default');
  assert(
    html.includes('callout-foldable'),
    'Foldable hyphenated callout works with -'
  );
  assert(
    html.includes('closed'),
    'Foldable closed state is set'
  );
}

{
  const html = await processMarkdown('> [!NOTE] Still works');
  assert(
    html.includes('callout-note'),
    'Non-hyphenated [!NOTE] still works'
  );
}

{
  assert(
    BUILT_IN_CALLOUTS['terms'].icon.includes('svg'),
    '"terms" key exists (purple glossary cluster, not overwritten by amber)'
  );
  assert(
    BUILT_IN_CALLOUTS['legal-terms'] !== undefined,
    '"legal-terms" key exists as renamed amber duplicate'
  );
}

// ─── Summary ───────────────────────────────────────────────────────────

console.log('\n=========================================');
console.log(`  Passed: ${passed.length}  |  Failed: ${failed.length}`);
console.log('=========================================');

if (failed.length > 0) {
  console.log('\n  Failed tests:');
  for (const f of failed) console.log(`    - ${f}`);
  process.exit(1);
} else {
  console.log('\n  All tests passed!');
  process.exit(0);
}
