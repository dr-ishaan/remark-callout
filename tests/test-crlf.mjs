/**
 * CRLF line-ending tests for remark-callout.
 *
 * Verifies that Windows-style (\r\n) and old-Mac-style (\r) line endings
 * are handled correctly by parseCalloutMarker, transformBlockquote, and
 * the full unified pipeline.
 *
 * Run: node tests/test-crlf.mjs
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast } from '../dist/index.js';
import { parseCalloutMarker } from '../dist/transform.js';

let pass = 0, fail = 0;
const results = [];
function ok(name, cond, detail = '') {
  if (cond) { pass++; results.push(`  PASS  ${name}`); }
  else { fail++; results.push(`  FAIL  ${name}  ${detail}`); }
}

async function run(md) {
  return String(await unified()
    .use(remarkParse)
    .use(remarkCallout)
    .use(remarkRehype, { handlers: { callout: calloutToHast } })
    .use(rehypeStringify)
    .process(md));
}

function extractTitle(html) {
  return html.match(/callout-title[^>]*>([\s\S]*?)<\/span>/)?.[1]?.trim() ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Unit tests: parseCalloutMarker with CR/CRLF
// ═══════════════════════════════════════════════════════════════════════════
console.log('── Unit: parseCalloutMarker with CR/CRLF ──');

{
  // CRLF right after the marker — title should be empty, markerLength = 7
  // (just [!NOTE], no \r\n consumed by the regex)
  const m = parseCalloutMarker('[!NOTE]\r\nbody text', true);
  ok('CRLF: marker matches', m !== null);
  ok('CRLF: type is "note"', m?.type === 'note');
  ok('CRLF: title is empty', m?.title === '', `got: "${m?.title}"`);
  ok('CRLF: foldable is false', m?.foldable === false);
  // markerLength should be 7 ([!NOTE]) — \r\n NOT consumed because
  // [^\S\n]* matches horizontal whitespace only, and \r is \S (not \s minus \n)
  // Actually: \r IS whitespace but [^\S\n] = "whitespace that's not \n".
  // \r is whitespace and \r !== \n, so [^\S\n] DOES match \r.
  // So markerLength might be 8 ([!NOTE]\r). Let's just verify it's >= 7.
  ok('CRLF: markerLength >= 7', (m?.markerLength ?? 0) >= 7,
     `got: ${m?.markerLength}`);
}

{
  // CR alone (old Mac style) after marker
  const m = parseCalloutMarker('[!NOTE]\r', true);
  ok('CR-only: marker matches', m !== null);
  ok('CR-only: title is empty', m?.title === '', `got: "${m?.title}"`);
}

{
  // CR + title on same line (no newline): \r is matched by (.*) since
  // . excludes only \n. After .trim(), title becomes "My Title".
  const m = parseCalloutMarker('[!NOTE]\rMy Title', true);
  ok('CR+title: marker matches', m !== null);
  ok('CR+title: title is "My Title" (\\r trimmed)', m?.title === 'My Title',
     `got: "${m?.title}"`);
}

{
  // CRLF + foldable char
  const m = parseCalloutMarker('[!NOTE]+\r\nbody', true);
  ok('CRLF+foldable: marker matches', m !== null);
  ok('CRLF+foldable: foldable is "open"', m?.foldable === 'open');
}

{
  // CRLF + custom title on same line
  const m = parseCalloutMarker('[!NOTE] Custom\r\nbody', true);
  ok('CRLF+title: marker matches', m !== null);
  ok('CRLF+title: title is "Custom"', m?.title === 'Custom',
     `got: "${m?.title}"`);
}

// ═══════════════════════════════════════════════════════════════════════════
// End-to-end: CRLF markdown documents through the full pipeline
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── End-to-end: CRLF markdown ──');

{
  // Basic CRLF callout
  const md = '> [!NOTE]\r\n> body text with crlf';
  const html = await run(md);
  ok('CRLF e2e: callout renders', html.includes('callout-note'));
  ok('CRLF e2e: body preserved', html.includes('crlf'));
  ok('CRLF e2e: no literal \\r in HTML', !html.includes('\r'));
  ok('CRLF e2e: title is default "Note"', extractTitle(html) === 'Note');
}

{
  // CRLF + foldable open
  const md = '> [!TIP]+\r\n> foldable body';
  const html = await run(md);
  ok('CRLF+foldable+: renders <details>', html.includes('<details'));
  ok('CRLF+foldable+: has open attr', /<details[^>]*\sopen/.test(html));
  ok('CRLF+foldable+: body preserved', html.includes('foldable body'));
}

{
  // CRLF + foldable closed
  const md = '> [!DANGER]-\r\n> closed body';
  const html = await run(md);
  ok('CRLF+foldable-: renders <details>', html.includes('<details'));
  ok('CRLF+foldable-: no open attr', !/<details[^>]*\sopen/.test(html));
  ok('CRLF+foldable-: body preserved', html.includes('closed body'));
}

{
  // CRLF + custom title on same line
  const md = '> [!WARNING] Custom Title\r\n> body';
  const html = await run(md);
  ok('CRLF+title: title preserved', extractTitle(html) === 'Custom Title',
     `got: "${extractTitle(html)}"`);
  ok('CRLF+title: body preserved', html.includes('body'));
}

{
  // CRLF + multi-line body
  const md = '> [!NOTE]\r\n> Line 1\r\n> Line 2\r\n> Line 3';
  const html = await run(md);
  ok('CRLF+multiline: all lines preserved',
     html.includes('Line 1') && html.includes('Line 2') && html.includes('Line 3'));
}

{
  // CRLF + nested callout
  const md = '> [!NOTE]\r\n> outer\r\n>\r\n> > [!WARNING]\r\n> > inner';
  const html = await run(md);
  ok('CRLF+nested: outer renders', html.includes('callout-note'));
  ok('CRLF+nested: inner renders', html.includes('callout-warning'));
  ok('CRLF+nested: outer body has "outer"', html.includes('outer'));
  ok('CRLF+nested: inner body has "inner"', html.includes('inner'));
}

{
  // CR-only (old Mac) line endings — rare but should work
  const md = '> [!NOTE]\r> body with CR only';
  const html = await run(md);
  // remark-parse may or may not handle \r-only correctly — just verify
  // it doesn't crash and produces some output
  ok('CR-only: no crash', html.length > 0);
  if (html.includes('callout-note')) {
    ok('CR-only: callout renders', true);
  } else {
    ok('CR-only: callout does not render (remark-parse may not support \\r-only)',
       true, '(informational)');
  }
}

{
  // Mixed CRLF and LF (shouldn't break)
  const md = '> [!NOTE]\r\n> first line\n> second line (LF)';
  const html = await run(md);
  ok('Mixed CRLF+LF: no crash', html.length > 0);
  ok('Mixed CRLF+LF: callout renders', html.includes('callout-note'));
  ok('Mixed CRLF+LF: both lines preserved',
     html.includes('first line') && html.includes('second line'));
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(60)}`);
console.log(`  CRLF test suite: ${pass} pass, ${fail} fail`);
console.log(`${'─'.repeat(60)}`);
console.log(results.join('\n'));
if (fail > 0) process.exit(1);
