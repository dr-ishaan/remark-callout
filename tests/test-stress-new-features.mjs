/**
 * TARGETED STRESS TEST — 100k+ iterations for new accordion + literary features.
 *
 * Part A: Accordion family (50k iterations, ~150k assertions)
 *   - Bare [!!] marker
 *   - Shorthand [! icon !] marker (emoji + SVG)
 *   - Long form [!!] [! icon !] marker
 *   - Foldable states (+ / -)
 *   - Adjacency grouping (2, 3, 5 panels)
 *   - Group separation (non-accordion content breaks group)
 *   - Multi-paragraph blockquote splitting
 *   - Disambiguation from callouts
 *   - Body preservation (multi-paragraph, lists, code)
 *   - No callout DNA
 *
 * Part B: Literary types (50k iterations, ~150k assertions)
 *   - Epigraph (with/without attribution, em-dash/en-dash/double-hyphen)
 *   - Pullquote + PULL alias
 *   - Aside (with/without title, with attribution)
 *   - Sidebar (with title + attribution)
 *   - No callout DNA
 *   - Not foldable
 *
 * Run: node tests/test-stress-new-features.mjs
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast } from '../dist/index.js';

const ITERATIONS_EACH = 50000;

const proc = unified()
  .use(remarkParse)
  .use(remarkCallout)
  .use(remarkRehype, { handlers: { callout: calloutToHast } })
  .use(rehypeStringify);

// ═══════════════════════════════════════════════════════════════════════════
// PART A: Accordion fragments
// ═══════════════════════════════════════════════════════════════════════════

const ACCORDION_FRAGMENTS = [
  // Bare marker
  { name: 'bare', md: '> [!!] Title\n> body', expect: { hasDetails: true, hasClass: 'accordion', title: 'Title', body: 'body', noOpen: true } },
  { name: 'bare-no-title', md: '> [!!]\n> body', expect: { hasDetails: true, hasClass: 'accordion', body: 'body', noTitle: true } },
  { name: 'bare-no-body', md: '> [!!] Title', expect: { hasDetails: true, hasClass: 'accordion', title: 'Title' } },

  // Shorthand emoji
  { name: 'emoji', md: '> [! 💻 !] Laptop\n> body', expect: { hasDetails: true, hasClass: 'accordion', hasIcon: true, iconContent: '💻', title: 'Laptop', body: 'body' } },
  { name: 'emoji-no-spaces', md: '> [!💻!] Quick\n> body', expect: { hasDetails: true, hasIcon: true, iconContent: '💻', title: 'Quick' } },
  { name: 'emoji-no-title', md: '> [! 💻 !]\n> body', expect: { hasDetails: true, hasIcon: true, noTitle: true } },
  { name: 'emoji-no-body', md: '> [! 💻 !] Title', expect: { hasDetails: true, hasIcon: true, title: 'Title' } },

  // Shorthand SVG
  { name: 'svg', md: '> [! <svg><circle/></svg> !] Custom\n> body', expect: { hasDetails: true, hasIcon: true, hasSvg: true, title: 'Custom' } },
  { name: 'svg-attrs', md: '> [! <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="12" cy="12" r="10"/></svg> !] Full SVG\n> body', expect: { hasDetails: true, hasSvg: true, hasCircle: true, title: 'Full SVG' } },

  // Long form
  { name: 'long-form', md: '> [!!] [! 💻 !] Laptop\n> body', expect: { hasDetails: true, hasIcon: true, iconContent: '💻', title: 'Laptop' } },
  { name: 'long-form-svg', md: '> [!!] [! <svg><rect/></svg> !] Title\n> body', expect: { hasDetails: true, hasSvg: true, title: 'Title' } },

  // Foldable states
  { name: 'open', md: '> [!!]+ Title\n> body', expect: { hasDetails: true, hasOpen: true, title: 'Title' } },
  { name: 'closed', md: '> [!!]- Title\n> body', expect: { hasDetails: true, noOpen: true, title: 'Title' } },
  { name: 'emoji-open', md: '> [! 💡 !]+ Open\n> body', expect: { hasDetails: true, hasOpen: true, hasIcon: true, title: 'Open' } },
  { name: 'emoji-closed', md: '> [! 📜 !]- Closed\n> body', expect: { hasDetails: true, noOpen: true, hasIcon: true, title: 'Closed' } },

  // Chevron
  { name: 'chevron', md: '> [!!] Title\n> body', expect: { hasChevron: true } },

  // Disambiguation
  { name: 'not-callout', md: '> [!!] Title\n> body', expect: { noCallout: true } },
  { name: 'note-is-callout', md: '> [!NOTE]\n> body', expect: { isCallout: true, noAccordion: true } },
  { name: 'note-icon-is-accordion', md: '> [! NOTE !] Title\n> body', expect: { hasClass: 'accordion', hasIcon: true, iconContent: 'NOTE' } },

  // Body preservation
  { name: 'multi-para', md: '> [!!] Title\n> First.\n>\n> Second.', expect: { body: 'First', body2: 'Second' } },
  { name: 'list', md: '> [!!] Title\n> - Item 1\n> - Item 2', expect: { hasList: true, body: 'Item 1' } },
  { name: 'code', md: '> [!!] Title\n> ```js\n> const x = 1;\n> ```', expect: { hasPre: true, body: 'const' } },

  // Various emojis
  { name: 'emoji-fire', md: '> [! 🔥 !] Hot\n> body', expect: { iconContent: '🔥' } },
  { name: 'emoji-star', md: '> [! ⭐ !] Star\n> body', expect: { iconContent: '⭐' } },
  { name: 'emoji-check', md: '> [! ✅ !] Done\n> body', expect: { iconContent: '✅' } },
  { name: 'emoji-warning', md: '> [! ⚠️ !] Warn\n> body', expect: { iconContent: '⚠️' } },
  { name: 'emoji-rocket', md: '> [! 🚀 !] Launch\n> body', expect: { iconContent: '🚀' } },

  // Title variations
  { name: 'long-title', md: '> [!!] This is a very long accordion title with many words\n> body', expect: { title: 'long accordion title' } },
  { name: 'special-title', md: '> [!!] Title with "quotes" & symbols!\n> body', expect: { hasDetails: true } },
  { name: 'unicode-title', md: '> [!!] 日本語タイトル\n> body', expect: { title: '日本語タイトル' } },
  { name: 'emoji-title', md: '> [!!] 🎉 Party Time\n> body', expect: { title: 'Party Time' } },
];

// Multi-fragment documents (adjacency)
const ACCORDION_MULTI = [
  { name: '2-adjacent', md: '> [!!] Panel A\n> A.\n\n> [!!] Panel B\n> B.', expect: { detailsCount: 2, sameGroup: true } },
  { name: '3-adjacent', md: '> [!!] A\n> a.\n\n> [!!] B\n> b.\n\n> [!!] C\n> c.', expect: { detailsCount: 3, sameGroup: true } },
  { name: '5-adjacent', md: '> [!!] 1\n> a.\n\n> [!!] 2\n> b.\n\n> [!!] 3\n> c.\n\n> [!!] 4\n> d.\n\n> [!!] 5\n> e.', expect: { detailsCount: 5, sameGroup: true } },
  { name: 'separated', md: '> [!!] A\n> a.\n\nParagraph breaks.\n\n> [!!] B\n> b.', expect: { detailsCount: 2, differentGroups: true } },
  { name: 'callout-separates', md: '> [!!] A\n> a.\n\n> [!NOTE]\n> middle\n\n> [!!] B\n> b.', expect: { detailsCount: 2, differentGroups: true, hasCallout: true } },
  { name: 'multi-para-blockquote', md: '>[!😮!] First\n>\n>[!!] Second', expect: { detailsCount: 2 } },
];

// ═══════════════════════════════════════════════════════════════════════════
// PART B: Literary fragments
// ═══════════════════════════════════════════════════════════════════════════

const LITERARY_FRAGMENTS = [
  // Epigraph
  { name: 'epigraph-basic', md: '> [!EPIGRAPH]\n> Best of times.', expect: { hasFigure: true, figureClass: 'epigraph', hasBlockquote: true, body: 'Best of times', noCallout: true } },
  { name: 'epigraph-title-attr', md: '> [!EPIGRAPH] Charles Dickens\n> Best of times.', expect: { hasFigure: true, hasFigcaption: true, attr: 'Charles Dickens', body: 'Best of times' } },
  { name: 'epigraph-em-dash', md: '> [!EPIGRAPH]\n> Best of times.\n> — Dickens', expect: { hasFigcaption: true, attr: 'Dickens' } },
  { name: 'epigraph-en-dash', md: '> [!EPIGRAPH]\n> To be.\n> – Shakespeare', expect: { hasFigcaption: true, attr: 'Shakespeare' } },
  { name: 'epigraph-double-hyphen', md: '> [!EPIGRAPH]\n> I think.\n> -- Descartes', expect: { hasFigcaption: true, attr: 'Descartes' } },
  { name: 'epigraph-no-attr', md: '> [!EPIGRAPH]\n> Just a quote.', expect: { hasFigure: true, noFigcaption: true } },

  // Pullquote
  { name: 'pullquote-basic', md: '> [!PULLQUOTE]\n> Design is how it works.', expect: { hasFigure: true, figureClass: 'pullquote', body: 'Design is how it works' } },
  { name: 'pullquote-attr', md: '> [!PULLQUOTE]\n> Design.\n> — Steve Jobs', expect: { hasFigcaption: true, attr: 'Steve Jobs' } },
  { name: 'pull-alias', md: '> [!PULL]\n> Short quote.', expect: { hasFigure: true, figureClass: 'pullquote' } },
  { name: 'pull-alias-attr', md: '> [!PULL]\n> Quote.\n> — Author', expect: { hasFigcaption: true, attr: 'Author' } },

  // Aside
  { name: 'aside-basic', md: '> [!ASIDE]\n> A note.', expect: { hasAside: true, asideClass: 'aside', body: 'A note', noCallout: true } },
  { name: 'aside-title', md: '> [!ASIDE] Heading\n> Body text.', expect: { hasAside: true, hasTitle: true, titleContent: 'Heading', body: 'Body text' } },
  { name: 'aside-attr', md: '> [!ASIDE]\n> Body.\n> — Author', expect: { hasAside: true, hasAttribution: true, attr: 'Author' } },
  { name: 'aside-title-attr', md: '> [!ASIDE] Heading\n> Body.\n> — Author', expect: { hasTitle: true, hasAttribution: true, titleContent: 'Heading', attr: 'Author' } },

  // Sidebar
  { name: 'sidebar-basic', md: '> [!SIDEBAR]\n> Magazine box.', expect: { hasAside: true, asideClass: 'sidebar', body: 'Magazine box' } },
  { name: 'sidebar-title', md: '> [!SIDEBAR] Related\n> Content.', expect: { hasTitle: true, titleContent: 'Related', body: 'Content' } },
  { name: 'sidebar-attr', md: '> [!SIDEBAR]\n> Content.\n> — Author', expect: { hasAttribution: true, attr: 'Author' } },
  { name: 'sidebar-full', md: '> [!SIDEBAR] Heading\n> Body.\n> — Author', expect: { hasTitle: true, hasAttribution: true, titleContent: 'Heading', attr: 'Author' } },

  // No callout DNA
  { name: 'epigraph-no-dna', md: '> [!EPIGRAPH]\n> Quote.', expect: { noCallout: true, noIcon: true, noBorder: true } },
  { name: 'aside-no-dna', md: '> [!ASIDE]\n> Note.', expect: { noCallout: true, noIcon: true } },
  { name: 'sidebar-no-dna', md: '> [!SIDEBAR]\n> Box.', expect: { noCallout: true, noIcon: true } },

  // Not foldable
  { name: 'epigraph-not-foldable', md: '> [!EPIGRAPH]+\n> Quote.', expect: { noDetails: true, noOpen: true } },
  { name: 'aside-not-foldable', md: '> [!ASIDE]-\n> Note.', expect: { noDetails: true } },
  { name: 'pullquote-not-foldable', md: '> [!PULLQUOTE]+\n> Quote.', expect: { noDetails: true } },

  // Multi-paragraph body
  { name: 'epigraph-multi', md: '> [!EPIGRAPH]\n> Line 1.\n>\n> Line 2.', expect: { body: 'Line 1', body2: 'Line 2' } },
  { name: 'aside-multi', md: '> [!ASIDE] Title\n> Para 1.\n>\n> Para 2.', expect: { body: 'Para 1', body2: 'Para 2' } },

  // Unicode
  { name: 'epigraph-unicode', md: '> [!EPIGRAPH]\n> 日本語の引用文', expect: { body: '日本語' } },
  { name: 'aside-unicode', md: '> [!ASIDE] 見出し\n> 本文', expect: { titleContent: '見出し', body: '本文' } },
];

// ═══════════════════════════════════════════════════════════════════════════
// Assertion engine
// ═══════════════════════════════════════════════════════════════════════════

function assertFragment(html, frag) {
  const e = frag.expect;
  const checks = [];

  if (e.hasDetails !== undefined) checks.push(['has details', e.hasDetails === html.includes('<details')]);
  if (e.hasClass) checks.push(['has class', html.includes(`class="${e.hasClass}"`)]);
  if (e.title) checks.push(['has title', html.includes(e.title)]);
  if (e.body) checks.push(['has body', html.includes(e.body)]);
  if (e.body2) checks.push(['has body2', html.includes(e.body2)]);
  if (e.hasIcon) checks.push(['has icon', html.includes('accordion-icon')]);
  if (e.iconContent) checks.push(['icon content', html.includes(e.iconContent)]);
  if (e.hasSvg) checks.push(['has svg', html.includes('<svg')]);
  if (e.hasCircle) checks.push(['has circle', html.includes('<circle')]);
  if (e.hasChevron) checks.push(['has chevron', html.includes('accordion-chevron')]);
  if (e.hasOpen) checks.push(['has open', /<details[^>]*\sopen/.test(html)]);
  if (e.noOpen) checks.push(['no open', !/<details[^>]*\sopen/.test(html)]);
  if (e.noTitle) checks.push(['no title span', !html.includes('accordion-title')]);
  if (e.noCallout) checks.push(['no callout class', !html.includes('class="callout')]);
  if (e.isCallout) checks.push(['is callout', html.includes('class="callout')]);
  if (e.noAccordion) checks.push(['no accordion', !html.includes('class="accordion"')]);
  if (e.hasList) checks.push(['has list', html.includes('<ul>') || html.includes('<ol>')]);
  if (e.hasPre) checks.push(['has pre', html.includes('<pre>')]);
  if (e.hasFigure) checks.push(['has figure', html.includes('<figure')]);
  if (e.figureClass) checks.push(['figure class', html.includes(`class="${e.figureClass}"`)]);
  if (e.hasBlockquote) checks.push(['has blockquote', html.includes('blockquote')]);
  if (e.hasFigcaption) checks.push(['has figcaption', html.includes('figcaption')]);
  if (e.noFigcaption) checks.push(['no figcaption', !html.includes('figcaption')]);
  if (e.attr) checks.push(['attribution', html.includes(e.attr)]);
  if (e.hasAside) checks.push(['has aside', html.includes('<aside')]);
  if (e.asideClass) checks.push(['aside class', html.includes(`class="${e.asideClass}"`)]);
  if (e.hasTitle) checks.push(['has title heading', html.includes('-title')]);
  if (e.titleContent) checks.push(['title content', html.includes(e.titleContent)]);
  if (e.hasAttribution) checks.push(['has attribution', html.includes('-attribution')]);
  if (e.noIcon) checks.push(['no icon', !html.includes('callout-icon') && !html.includes('accordion-icon')]);
  if (e.noBorder !== undefined && e.noBorder) checks.push(['no border style', !html.includes('--callout-l:')]);
  if (e.noDetails) checks.push(['no details', !html.includes('<details')]);

  // Multi-fragment checks
  if (e.detailsCount) {
    const count = (html.match(/<details/g) || []).length;
    checks.push(['details count', count === e.detailsCount]);
  }
  if (e.sameGroup) {
    const names = html.match(/name="accordion-group-\d+"/g) || [];
    checks.push(['same group', names.length >= 2 && names.every(n => n === names[0])]);
  }
  if (e.differentGroups) {
    const names = html.match(/name="accordion-group-\d+"/g) || [];
    const unique = new Set(names);
    checks.push(['different groups', names.length >= 2 && unique.size >= 2]);
  }
  if (e.hasCallout) checks.push(['has callout', html.includes('class="callout')]);

  return checks;
}

// ═══════════════════════════════════════════════════════════════════════════
// Deterministic PRNG
// ═══════════════════════════════════════════════════════════════════════════
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════
let totalTests = 0, totalPass = 0, totalFail = 0;
const failures = [];
const t0 = performance.now();

console.log(`\n╔══════════════════════════════════════════════════════════════════════╗`);
console.log(`║  STRESS TEST: Accordion + Literary (100k+ iterations each)          ║`);
console.log(`╚══════════════════════════════════════════════════════════════════════╝`);

// ── Part A: Accordion ──────────────────────────────────────────────────────
console.log(`\n┌─ PART A: Accordion family (${ITERATIONS_EACH.toLocaleString()} iterations) ─┐`);
const allAccordion = [...ACCORDION_FRAGMENTS, ...ACCORDION_MULTI];
console.log(`  Fragment pool: ${allAccordion.length} accordion fragments`);

for (let iter = 0; iter < ITERATIONS_EACH; iter++) {
  const rand = mulberry32(iter + 1);
  const frag = allAccordion[Math.floor(rand() * allAccordion.length)];

  try {
    const html = String(await proc.process(frag.md));
    const checks = assertFragment(html, frag);
    for (const [name, ok] of checks) {
      totalTests++;
      if (ok) totalPass++;
      else {
        totalFail++;
        if (failures.length < 20) {
          failures.push({ part: 'A', iter, frag: frag.name, check: name, md: frag.md.slice(0, 80) });
        }
      }
    }
  } catch (err) {
    totalTests++; totalFail++;
    if (failures.length < 20) failures.push({ part: 'A', iter, frag: frag.name, error: err.message });
  }

  if ((iter + 1) % 10000 === 0) {
    const elapsed = performance.now() - t0;
    console.log(`  [${(iter + 1).toLocaleString().padStart(6)}/${ITERATIONS_EACH.toLocaleString()}] ${elapsed.toFixed(0).padStart(6)}ms — pass ${totalPass.toLocaleString()} fail ${totalFail}`);
  }
}

// ── Part B: Literary ───────────────────────────────────────────────────────
console.log(`\n┌─ PART B: Literary types (${ITERATIONS_EACH.toLocaleString()} iterations) ─┐`);
console.log(`  Fragment pool: ${LITERARY_FRAGMENTS.length} literary fragments`);

const partBStart = totalTests;
const partBPassStart = totalPass;

for (let iter = 0; iter < ITERATIONS_EACH; iter++) {
  const rand = mulberry32(iter + 100001);
  const frag = LITERARY_FRAGMENTS[Math.floor(rand() * LITERARY_FRAGMENTS.length)];

  try {
    const html = String(await proc.process(frag.md));
    const checks = assertFragment(html, frag);
    for (const [name, ok] of checks) {
      totalTests++;
      if (ok) totalPass++;
      else {
        totalFail++;
        if (failures.length < 20) {
          failures.push({ part: 'B', iter, frag: frag.name, check: name, md: frag.md.slice(0, 80) });
        }
      }
    }
  } catch (err) {
    totalTests++; totalFail++;
    if (failures.length < 20) failures.push({ part: 'B', iter, frag: frag.name, error: err.message });
  }

  if ((iter + 1) % 10000 === 0) {
    const elapsed = performance.now() - t0;
    console.log(`  [${(iter + 1).toLocaleString().padStart(6)}/${ITERATIONS_EACH.toLocaleString()}] ${elapsed.toFixed(0).padStart(6)}ms — pass ${totalPass.toLocaleString()} fail ${totalFail}`);
  }
}

const elapsed = performance.now() - t0;

console.log(`\n${'═'.repeat(70)}`);
console.log(`  STRESS TEST — SUMMARY`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Part A (accordion)  : ${ITERATIONS_EACH.toLocaleString()} iterations`);
console.log(`  Part B (literary)   : ${ITERATIONS_EACH.toLocaleString()} iterations`);
console.log(`  Total iterations    : ${(ITERATIONS_EACH * 2).toLocaleString()}`);
console.log(`  Total assertions    : ${totalTests.toLocaleString()}`);
console.log(`  Passed              : ${totalPass.toLocaleString()}`);
console.log(`  Failed              : ${totalFail.toLocaleString()}`);
console.log(`  Pass rate           : ${(totalPass / totalTests * 100).toFixed(4)}%`);
console.log(`  Wall time           : ${(elapsed / 1000).toFixed(2)}s`);
console.log(`  Throughput          : ${(ITERATIONS_EACH * 2 / (elapsed / 1000)).toFixed(0)} docs/sec`);
console.log(`${'═'.repeat(70)}`);

if (failures.length > 0) {
  console.log(`\n  Failures (first 20):`);
  failures.forEach((f, i) => {
    console.log(`    ${i + 1}. [${f.part}] iter ${f.iter} ${f.frag} — ${f.check || f.error}`);
  });
  process.exit(1);
}
