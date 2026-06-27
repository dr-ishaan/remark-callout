/**
 * Tests for the 4 new plugin improvements:
 *   1. Custom IDs ({#my-id} syntax)
 *   2. aria-expanded on foldable/accordion summaries
 *   3. types whitelist option
 *   4. Dev-mode warnings for unknown types
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast } from '../dist/index.js';
import { parseCalloutMarker, parseAccordionMarker, resolveConfig } from '../dist/transform.js';

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
// FEATURE 1: Custom IDs ({#my-id} syntax)
// ═══════════════════════════════════════════════════════════════════════════
console.log('═══ FEATURE 1: Custom IDs ({#my-id} syntax) ═══');

// Unit tests: parseCalloutMarker
console.log('── Unit: parseCalloutMarker with {#id} ──');
{
  const m = parseCalloutMarker('[!NOTE]{#my-id}', true);
  ok('parses id', m?.id === 'my-id', `got: ${m?.id}`);
  ok('type is note', m?.type === 'note');
  ok('title is empty', m?.title === '');
}

{
  const m = parseCalloutMarker('[!NOTE]{#my-id}+ Custom', true);
  ok('parses id with foldable+title', m?.id === 'my-id' && m?.foldable === 'open' && m?.title === 'Custom');
}

{
  const m = parseCalloutMarker('[!WARNING]{#warn-1}- Watch out', true);
  ok('parses id with foldable- and title', m?.id === 'warn-1' && m?.foldable === 'closed' && m?.title === 'Watch out');
}

{
  const m = parseCalloutMarker('[!NOTE]', true);
  ok('no id when absent', m?.id === undefined);
}

{
  const m = parseCalloutMarker('[!NOTE]{#id-with-hyphens_and_underscores}', true);
  ok('id with hyphens and underscores', m?.id === 'id-with-hyphens_and_underscores');
}

// End-to-end: callout renders id
console.log('\n── E2E: callout renders id ──');
{
  const html = await run('> [!NOTE]{#important}\n> body');
  ok('callout has id="important"', html.includes('id="important"'), html.slice(0, 200));
  ok('callout still has class', html.includes('class="callout'));
}

{
  const html = await run('> [!WARNING]{#warn-test}+ Title\n> body');
  ok('foldable callout has id', html.includes('id="warn-test"'));
  ok('foldable callout has open', html.includes('open'));
}

{
  const html = await run('> [!TIP]{#my-tip} Custom Title\n> body');
  ok('callout with id and custom title', html.includes('id="my-tip"') && html.includes('Custom Title'));
}

// End-to-end: literary types render id
console.log('\n── E2E: literary types render id ──');
{
  const html = await run('> [!EPIGRAPH]{#epi-1}\n> Quote.');
  ok('epigraph has id', html.includes('id="epi-1"'), html.slice(0, 200));
  ok('epigraph still figure', html.includes('<figure'));
}

{
  const html = await run('> [!ASIDE]{#aside-1} Heading\n> body');
  ok('aside has id', html.includes('id="aside-1"'));
  ok('aside still aside', html.includes('<aside'));
}

{
  const html = await run('> [!SIDEBAR]{#sb-1} Title\n> body');
  ok('sidebar has id', html.includes('id="sb-1"'));
}

// End-to-end: accordion renders id
console.log('\n── E2E: accordion renders id ──');
{
  const html = await run('> [!!]{#acc-1} Title\n> body');
  ok('accordion bare has id', html.includes('id="acc-1"'), html.slice(0, 200));
  ok('accordion still details', html.includes('<details'));
}

{
  const html = await run('> [! 💻 !]{#acc-2} Laptop\n> body');
  ok('accordion shorthand has id', html.includes('id="acc-2"'));
  ok('accordion still has icon', html.includes('💻'));
}

// No id when not specified
console.log('\n── E2E: no id when not specified ──');
{
  const html = await run('> [!NOTE]\n> body');
  ok('no id attribute when not specified', !html.includes('id="'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 2: aria-expanded on foldable/accordion summaries
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 2: aria-expanded ═══');

console.log('── Foldable callouts ──');
{
  const htmlOpen = await run('> [!NOTE]+\n> body');
  ok('foldable open has aria-expanded="true"',
     htmlOpen.includes('aria-expanded="true"'), htmlOpen.slice(0, 250));

  const htmlClosed = await run('> [!NOTE]-\n> body');
  ok('foldable closed has aria-expanded="false"',
     htmlClosed.includes('aria-expanded="false"'), htmlClosed.slice(0, 250));
}

console.log('\n── Non-foldable callouts (no aria-expanded) ──');
{
  const html = await run('> [!NOTE]\n> body');
  ok('non-foldable has no aria-expanded', !html.includes('aria-expanded'));
}

console.log('\n── Accordions ──');
{
  const htmlOpen = await run('> [!!]+ Title\n> body');
  ok('accordion open has aria-expanded="true"',
     htmlOpen.includes('aria-expanded="true"'), htmlOpen.slice(0, 250));

  const htmlClosed = await run('> [!!] Title\n> body');
  ok('accordion closed has aria-expanded="false"',
     htmlClosed.includes('aria-expanded="false"'), htmlClosed.slice(0, 250));
}

console.log('\n── Literary types (no aria-expanded — not foldable) ──');
{
  const html = await run('> [!EPIGRAPH]\n> Quote.');
  ok('epigraph has no aria-expanded', !html.includes('aria-expanded'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 3: types whitelist option
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 3: types whitelist ═══');

console.log('── Whitelisted types render as callouts ──');
{
  const html = await run('> [!NOTE]\n> body', { types: ['note', 'warning'] });
  ok('note renders as callout', html.includes('class="callout'), html.slice(0, 200));

  const html2 = await run('> [!WARNING]\n> body', { types: ['note', 'warning'] });
  ok('warning renders as callout', html2.includes('class="callout'));
}

console.log('\n── Non-whitelisted types fall through to blockquote ──');
{
  const html = await run('> [!TIP]\n> body', { types: ['note', 'warning'] });
  ok('tip does NOT render as callout', !html.includes('class="callout'), html.slice(0, 200));
  ok('tip falls through to blockquote', html.includes('<blockquote>'));
}

console.log('\n── Whitelist is case-insensitive ──');
{
  const html = await run('> [!NOTE]\n> body', { types: ['NOTE', 'WARNING'] });
  ok('uppercase whitelist matches lowercase marker', html.includes('class="callout'));
}

console.log('\n── Literary types always render regardless of whitelist ──');
{
  const html = await run('> [!EPIGRAPH]\n> Quote.', { types: ['note'] });
  ok('epigraph renders despite whitelist', html.includes('<figure'), html.slice(0, 200));

  const html2 = await run('> [!ASIDE] Title\n> body', { types: ['note'] });
  ok('aside renders despite whitelist', html2.includes('<aside'));

  const html3 = await run('> [!SIDEBAR] Title\n> body', { types: ['note'] });
  ok('sidebar renders despite whitelist', html3.includes('<aside'));

  const html4 = await run('> [!PULLQUOTE]\n> Quote.', { types: ['note'] });
  ok('pullquote renders despite whitelist', html4.includes('<figure'));
}

console.log('\n── Accordions always render regardless of whitelist ──');
{
  const html = await run('> [!!] Title\n> body', { types: ['note'] });
  ok('accordion renders despite whitelist', html.includes('<details'), html.slice(0, 200));
}

console.log('\n── No whitelist = all types render (default) ──');
{
  const html = await run('> [!TIP]\n> body');
  ok('tip renders without whitelist', html.includes('class="callout'));
}

console.log('\n── Empty whitelist = no callouts (but literary/accordion still work) ──');
{
  const html = await run('> [!NOTE]\n> body', { types: [] });
  ok('note does NOT render with empty whitelist', !html.includes('class="callout'));

  const html2 = await run('> [!EPIGRAPH]\n> Quote.', { types: [] });
  ok('epigraph renders with empty whitelist', html2.includes('<figure'));
}

console.log('\n── resolveConfig builds allowedTypes correctly ──');
{
  const cfg1 = resolveConfig({ types: ['note', 'warning'] });
  ok('allowedTypes is a Set', cfg1.allowedTypes instanceof Set);
  ok('allowedTypes has note', cfg1.allowedTypes?.has('note'));
  ok('allowedTypes has warning', cfg1.allowedTypes?.has('warning'));
  ok('allowedTypes does not have tip', !cfg1.allowedTypes?.has('tip'));

  const cfg2 = resolveConfig({});
  ok('no types option = allowedTypes is null', cfg2.allowedTypes === null);

  const cfg3 = resolveConfig({ types: [] });
  ok('empty types array = allowedTypes is empty Set', cfg3.allowedTypes instanceof Set && cfg3.allowedTypes.size === 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 4: Dev-mode warnings for unknown types
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 4: Dev-mode warnings ═══');

// Capture console.warn
const originalWarn = console.warn;
const warnings = [];

console.log('── Unknown type warns in dev mode ──');
{
  warnings.length = 0;
  console.warn = (msg) => warnings.push(msg);
  delete process.env.NODE_ENV;
  const html = await run('> [!FOOBAR]\n> body');
  console.warn = originalWarn;

  ok('warning emitted for unknown type', warnings.length > 0, `warnings: ${warnings.length}`);
  ok('warning mentions type name', warnings[0]?.includes('FOOBAR') || warnings[0]?.includes('foobar'));
  ok('warning includes plugin name', warnings[0]?.includes('remark-callout'));
  // Unknown types still render (backward compat)
  ok('unknown type still renders as callout', html.includes('class="callout'));
}

console.log('\n── Warning includes "Did you mean" suggestion ──');
{
  warnings.length = 0;
  console.warn = (msg) => warnings.push(msg);
  delete process.env.NODE_ENV;
  await run('> [!NOT]\n> body');  // close to "note"
  console.warn = originalWarn;

  ok('suggestion provided for close match', warnings[0]?.includes('Did you mean'), warnings[0] || '(no warning)');
  ok('suggestion mentions "note"', warnings[0]?.includes('note'));
}

console.log('\n── Known type does NOT warn ──');
{
  warnings.length = 0;
  console.warn = (msg) => warnings.push(msg);
  delete process.env.NODE_ENV;
  await run('> [!NOTE]\n> body');
  console.warn = originalWarn;

  ok('no warning for known type', warnings.length === 0, `warnings: ${warnings.length}`);
}

console.log('\n── Literary types do NOT warn ──');
{
  warnings.length = 0;
  console.warn = (msg) => warnings.push(msg);
  delete process.env.NODE_ENV;
  await run('> [!EPIGRAPH]\n> Quote.');
  console.warn = originalWarn;

  ok('no warning for epigraph', warnings.length === 0);
}

console.log('\n── Warnings suppressed in production ──');
{
  warnings.length = 0;
  console.warn = (msg) => warnings.push(msg);
  process.env.NODE_ENV = 'production';
  await run('> [!FOOBAR]\n> body');
  console.warn = originalWarn;
  delete process.env.NODE_ENV;

  ok('no warning in production', warnings.length === 0, `warnings: ${warnings.length}`);
}

console.log('\n── Warning fires only once per type ──');
{
  warnings.length = 0;
  console.warn = (msg) => warnings.push(msg);
  delete process.env.NODE_ENV;
  await run('> [!FOOBAR]\n> body\n\n> [!FOOBAR]\n> body2');
  console.warn = originalWarn;

  ok('warning fires only once for same type', warnings.length === 1, `warnings: ${warnings.length}`);
}

console.log('\n── Whitelisted unknown type warns and falls through ──');
{
  warnings.length = 0;
  console.warn = (msg) => warnings.push(msg);
  delete process.env.NODE_ENV;
  const html = await run('> [!FOOBAR]\n> body', { types: ['note', 'warning'] });
  console.warn = originalWarn;

  ok('unknown type warns when whitelisted', warnings.length > 0);
  ok('unknown type falls through to blockquote', !html.includes('class="callout'));
  ok('unknown type renders as blockquote', html.includes('<blockquote>'));
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`  4-feature test suite: ${pass} pass, ${fail} fail`);
console.log(`${'═'.repeat(60)}`);
console.log(results.join('\n'));
if (fail > 0) process.exit(1);
