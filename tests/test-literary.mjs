/**
 * Literary type tests — epigraph, pullquote, aside, sidebar.
 *
 * Tests the literary family that renders as <figure>/<aside> instead of
 * callout boxes, including attribution detection (em-dash, en-dash, double-hyphen).
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast } from '../dist/index.js';

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

// ── Epigraph ────────────────────────────────────────────────────────────────
console.log('── Epigraph ──');
{
  const html = await run('> [!EPIGRAPH]\n> It was the best of times.');
  ok('epigraph renders as <figure>', html.includes('<figure class="epigraph">'));
  ok('epigraph has blockquote', html.includes('class="epigraph-quote"'));
  ok('epigraph no callout DNA', !html.includes('class="callout"'));
  ok('epigraph no icon span', !html.includes('callout-icon'));
  ok('epigraph body preserved', html.includes('best of times'));
}

// ── Epigraph with explicit attribution ─────────────────────────────────────
console.log('\n── Epigraph with explicit attribution ──');
{
  const html = await run('> [!EPIGRAPH] Charles Dickens\n> It was the best of times.');
  ok('epigraph has figcaption', html.includes('class="epigraph-attribution"'));
  ok('epigraph attribution text', html.includes('— Charles Dickens'));
  ok('epigraph body preserved', html.includes('best of times'));
}

// ── Epigraph with em-dash attribution in body ──────────────────────────────
console.log('\n── Epigraph with em-dash attribution in body ──');
{
  const html = await run('> [!EPIGRAPH]\n> It was the best of times.\n> — Charles Dickens');
  ok('epigraph detects em-dash attribution', html.includes('class="epigraph-attribution"'));
  ok('epigraph attribution extracted', html.includes('— Charles Dickens'));
  // The attribution should be in the figcaption, NOT in the blockquote body
  const bodyMatch = html.match(/epigraph-quote[^>]*>([\s\S]*?)<\/blockquote>/);
  ok('epigraph attribution removed from body',
     !bodyMatch || !bodyMatch[1].includes('Charles Dickens'),
     `body still contains attribution: ${bodyMatch?.[1]?.slice(0, 100)}`);
}

// ── Epigraph with en-dash attribution ──────────────────────────────────────
console.log('\n── Epigraph with en-dash attribution ──');
{
  const html = await run('> [!EPIGRAPH]\n> To be or not to be.\n> – Shakespeare');
  ok('epigraph detects en-dash attribution', html.includes('class="epigraph-attribution"'));
  ok('epigraph attribution text', html.includes('— Shakespeare'));
}

// ── Epigraph with double-hyphen attribution ────────────────────────────────
console.log('\n── Epigraph with double-hyphen attribution ──');
{
  const html = await run('> [!EPIGRAPH]\n> I think therefore I am.\n> -- Descartes');
  ok('epigraph detects -- attribution', html.includes('class="epigraph-attribution"'));
  ok('epigraph attribution text', html.includes('— Descartes'));
}

// ── Pullquote ───────────────────────────────────────────────────────────────
console.log('\n── Pullquote ──');
{
  const html = await run('> [!PULLQUOTE]\n> Design is how it works.');
  ok('pullquote renders as <figure>', html.includes('<figure class="pullquote">'));
  ok('pullquote has blockquote', html.includes('class="pullquote-quote"'));
  ok('pullquote no callout DNA', !html.includes('class="callout"'));
  ok('pullquote body preserved', html.includes('Design is how it works'));
}

// ── Pull alias ──────────────────────────────────────────────────────────────
console.log('\n── Pull alias ──');
{
  const html = await run('> [!PULL]\n> Short quote.');
  ok('pull alias renders as pullquote', html.includes('<figure class="pullquote">'));
  ok('pull alias no callout DNA', !html.includes('class="callout"'));
}

// ── Aside ───────────────────────────────────────────────────────────────────
console.log('\n── Aside ──');
{
  const html = await run('> [!ASIDE] Tangent\n> A marginal note.');
  ok('aside renders as <aside>', html.includes('<aside class="aside">'));
  ok('aside has heading', html.includes('class="aside-title">Tangent'));
  ok('aside has body', html.includes('class="aside-body"'));
  ok('aside body preserved', html.includes('marginal note'));
  ok('aside no callout DNA', !html.includes('class="callout"'));
  ok('aside no icon', !html.includes('callout-icon'));
}

// ── Aside without title ─────────────────────────────────────────────────────
console.log('\n── Aside without title ──');
{
  const html = await run('> [!ASIDE]\n> Just a note.');
  ok('aside no title heading', !html.includes('class="aside-title"'));
  ok('aside has body', html.includes('class="aside-body"'));
  ok('aside body preserved', html.includes('Just a note'));
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
console.log('\n── Sidebar ──');
{
  const html = await run('> [!SIDEBAR] Related\n> Magazine-style sidebar.');
  ok('sidebar renders as <aside>', html.includes('<aside class="sidebar">'));
  ok('sidebar has heading', html.includes('class="sidebar-title">Related'));
  ok('sidebar has body', html.includes('class="sidebar-body"'));
  ok('sidebar body preserved', html.includes('Magazine-style sidebar'));
  ok('sidebar no callout DNA', !html.includes('class="callout"'));
}

// ── Sidebar with attribution ────────────────────────────────────────────────
console.log('\n── Sidebar with attribution ──');
{
  const html = await run('> [!SIDEBAR] Heading\n> Body text.\n> — Author');
  ok('sidebar has heading', html.includes('class="sidebar-title">Heading'));
  ok('sidebar detects attribution', html.includes('class="sidebar-attribution"'));
  ok('sidebar attribution text', html.includes('— Author'));
}

// ── Literary types are not foldable ─────────────────────────────────────────
console.log('\n── Literary types not foldable ──');
{
  const html1 = await run('> [!EPIGRAPH]+\n> Quote.');
  ok('epigraph ignores + foldable', !html1.includes('<details') && !html1.includes('open'));
  const html2 = await run('> [!ASIDE]-\n> Note.');
  ok('aside ignores - foldable', !html2.includes('<details'));
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`  Literary type tests: ${pass} pass, ${fail} fail`);
console.log(`${'─'.repeat(60)}`);
console.log(results.join('\n'));
if (fail > 0) process.exit(1);
