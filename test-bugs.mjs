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

/** Extract the callout title text from rendered HTML */
function extractTitle(html) {
  return html.match(/callout-title[^>]*>([^<]+)/)?.[1] ?? null;
}

/** Check if text appears inside the callout-body div */
function bodyContains(html, text) {
  const bodyMatch = html.match(/callout-body[^>]*>([\s\S]*?)<\/div>\s*<\/(?:div|details)>/);
  return bodyMatch ? bodyMatch[1].includes(text) : false;
}

// ─── Test Bug 1 Fix: Body content NOT silently dropped ─────────────────

console.log('\n=== Bug 1: Body content silently dropped ===');

{
  // Multi-line: body on subsequent lines
  const html = await processMarkdown('> [!WARNING]\n> First paragraph\n> Second paragraph');
  assert(
    html.includes('First paragraph') && html.includes('Second paragraph'),
    'Multi-line body content is preserved'
  );
  assert(
    extractTitle(html) === 'Warning',
    'Multi-line: title is "Warning" (not body text)'
  );
}

{
  // No body at all
  const html = await processMarkdown('> [!TIP]');
  assert(
    html.includes('callout'),
    'Callout without body still renders'
  );
  assert(
    extractTitle(html) === 'Tip',
    'No-body: title is "Tip"'
  );
}

{
  // Custom title + body on next line
  const html = await processMarkdown('> [!NOTE] Custom Title\n> Body content here');
  assert(
    extractTitle(html) === 'Custom Title',
    'Custom title + body: title is "Custom Title"'
  );
  assert(
    bodyContains(html, 'Body content here'),
    'Custom title + body: body contains "Body content here"'
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

// ─── Test: \s* newline regression (Bug 3 from verification) ────────────

console.log('\n=== Bug 3 regression: \\s* eats newlines ===');

{
  // When remark-parse merges lines into one text node with \n,
  // the body text must NOT leak into the title.
  const html = await processMarkdown('> [!NOTE]\n> Body after newline');
  assert(
    extractTitle(html) === 'Note',
    'Newline-separated: title is "Note" (body text did NOT leak into title)'
  );
  assert(
    bodyContains(html, 'Body after newline'),
    'Newline-separated: body contains "Body after newline"'
  );
}

{
  // Foldable with newline body
  const html = await processMarkdown('> [!NOTE]+\n> Foldable body');
  assert(
    extractTitle(html) === 'Note',
    'Foldable newline: title is "Note" (no leak)'
  );
  assert(
    bodyContains(html, 'Foldable body'),
    'Foldable newline: body contains "Foldable body"'
  );
}

// ─── Test: Foldable renders as <details> (Bug 4 from verification) ────

console.log('\n=== Bug 4: Foldable renders as <details> ===');

{
  const html = await processMarkdown('> [!BEST-PRACTICE]+ Expandable tip');
  const rootTag = html.match(/^<(\w+)/)?.[1];
  assert(
    rootTag === 'details',
    'Foldable [!BEST-PRACTICE]+ renders as <details>'
  );
  assert(
    html.includes('callout-foldable'),
    'Foldable has callout-foldable class'
  );
  assert(
    html.includes('<summary'),
    'Foldable has <summary> element'
  );
  assert(
    html.includes('data-callout-fold="open"'),
    'Foldable + has data-callout-fold="open"'
  );
}

{
  const html = await processMarkdown('> [!CI-CD]- Collapsed by default');
  const rootTag = html.match(/^<(\w+)/)?.[1];
  assert(
    rootTag === 'details',
    'Foldable [!CI-CD]- renders as <details>'
  );
  assert(
    html.includes('data-callout-fold="closed"'),
    'Foldable - has data-callout-fold="closed"'
  );
}

// ─── Test: open=true boolean attribute on <details> ─────────────────────

console.log('\n=== Bug 6: open attribute dropped by rehype-stringify ===');

{
  const html = await processMarkdown('> [!NOTE]+ Open by default\n> Body');
  // The opening <details> tag must have an `open` attribute. Without
  // it the callout appears collapsed despite data-callout-fold="open".
  // rehype-stringify drops boolean attributes whose value is '', so we
  // set open=true instead.
  const openTag = html.match(/<details[^>]*>/)?.[0] ?? '';
  assert(
    /\bopen\b/.test(openTag),
    'Open foldable <details> has the `open` attribute in its opening tag'
  );
}

{
  const html = await processMarkdown('> [!NOTE]- Closed by default\n> Body');
  const openTag = html.match(/<details[^>]*>/)?.[0] ?? '';
  assert(
    !/\bopen\b/.test(openTag),
    'Closed foldable <details> does NOT have the `open` attribute'
  );
}

{
  const html = await processMarkdown('> [!NOTE] Not foldable');
  const rootTag = html.match(/^<(\w+)/)?.[1];
  assert(
    rootTag === 'div',
    'Non-foldable [!NOTE] renders as <div>'
  );
  assert(
    !html.includes('callout-foldable'),
    'Non-foldable has no callout-foldable class'
  );
}

// ─── Test: Duplicate terms key (Bug 5 from verification) ──────────────

console.log('\n=== Bug 5: Duplicate terms key ===');

assert(
  BUILT_IN_CALLOUTS['terms'].icon.includes('svg'),
  '"terms" key exists (purple glossary cluster, not overwritten by amber)'
);
assert(
  BUILT_IN_CALLOUTS['terms'].icon.includes('M8 6h13'),
  '"terms" uses ICONS.list (purple glossary icon, updated)'
);
assert(
  BUILT_IN_CALLOUTS['legal-terms'] !== undefined,
  '"legal-terms" key exists as renamed amber duplicate'
);
assert(
  BUILT_IN_CALLOUTS['legal-terms'].icon.includes('M8 21h12'),
  '"legal-terms" uses ICONS.scrollSeal (amber legal icon, dedup variant)'
);
assert(
  BUILT_IN_CALLOUTS['legal-terms'].icon !== BUILT_IN_CALLOUTS['file'].icon,
  '"legal-terms" has a distinct icon from "file" (uniqueness pass)'
);

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
