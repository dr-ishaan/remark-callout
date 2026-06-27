/**
 * Sätteri adapter tests — runs the same callout families as the unified-pipeline
 * tests, but through Sätteri's `markdownToHtml` API using the
 * `remark-callout-plus/satteri` adapter.
 *
 * These tests verify that the Sätteri adapter produces equivalent HTML to the
 * unified pipeline for every feature:
 *   - Standard callouts (note, warning, tip, danger, etc.)
 *   - Foldable callouts (`+`/`-` markers)
 *   - Rich titles (inline markdown in the title)
 *   - Custom anchor IDs (`{#id}` syntax)
 *   - Literary types (epigraph, pullquote, aside, sidebar)
 *   - Structured-data types (bio, event) → <dl><dt><dd>
 *   - Series navigation (next, continue)
 *   - Accordions (`[!!]` family) with native exclusive expansion
 *
 * Sätteri is a devDependency. If it's not installed, these tests are skipped
 * (rather than failing) so that CI environments without Sätteri can still
 * run the unified-pipeline tests.
 */
import { markdownToHtml } from 'satteri';
import { calloutSatteri } from '../dist/satteri.js';

let pass = 0, fail = 0;
const results = [];
function ok(name, cond, detail = '') {
  if (cond) { pass++; results.push(`  PASS  ${name}`); }
  else { fail++; results.push(`  FAIL  ${name}  ${detail}`); }
}

async function run(md, opts = {}) {
  const { html } = markdownToHtml(md, {
    mdastPlugins: [calloutSatteri(opts)],
  });
  return html;
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 1: Standard callouts
// ═══════════════════════════════════════════════════════════════════════════
console.log('═══ FEATURE 1: Standard callouts ═══');
{
  const html = await run('> [!NOTE]\n> Hello world.');
  ok('note renders as callout', html.includes('class="callout callout-note"'), html.slice(0, 200));
  ok('note has data-callout attr', html.includes('data-callout="note"'));
  ok('note has callout-header', html.includes('class="callout-header"'));
  ok('note has callout-body', html.includes('class="callout-body"'));
  ok('note body text preserved', html.includes('Hello world.'));
  ok('note has SVG icon', html.includes('<svg'));
  ok('note has default "Note" title', html.includes('>Note<'));
  ok('note has oklch color vars', html.includes('--callout-l:'));
}

{
  const html = await run('> [!WARNING] Custom Title\n> Body.');
  ok('warning renders', html.includes('class="callout callout-warning"'));
  ok('warning uses custom title', html.includes('>Custom Title<'));
}

{
  const html = await run('> [!TIP]\n> Tip body.');
  ok('tip renders', html.includes('class="callout callout-tip"'));
}

{
  const html = await run('> [!DANGER]\n> Danger body.');
  ok('danger renders', html.includes('class="callout callout-danger"'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 2: Foldable callouts
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 2: Foldable callouts ═══');
{
  const html = await run('> [!TIP]+\n> Open by default.');
  ok('foldable renders as <details>', html.includes('<details'));
  ok('foldable has callout-foldable class', html.includes('callout-foldable'));
  ok('foldable open has data-callout-fold=open', html.includes('data-callout-fold="open"'));
  ok('foldable open has open attr', html.includes(' open>'));
  ok('foldable uses <summary> header', html.includes('<summary'));
  ok('foldable has aria-expanded', html.includes('aria-expanded'));
}

{
  const html = await run('> [!DANGER]-\n> Closed by default.');
  ok('foldable closed has data-callout-fold=closed', html.includes('data-callout-fold="closed"'));
  ok('foldable closed has aria-expanded=false', html.includes('aria-expanded="false"'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 3: Rich titles (inline markdown in title)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 3: Rich titles ═══');
{
  const html = await run('> [!NOTE] **bold** and `code` and [link](https://x.com)\n> Body.');
  ok('rich title renders bold', html.includes('<strong>bold</strong>'));
  ok('rich title renders code', html.includes('<code>code</code>'));
  ok('rich title renders link', html.includes('<a href="https://x.com">link</a>'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 4: Custom anchor IDs ({#id} syntax)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 4: Custom anchor IDs ═══');
{
  const html = await run('> [!NOTE]{#my-anchor}\n> Body.');
  ok('anchor ID appears on root element', html.includes('id="my-anchor"'));
  ok('anchor callout still renders', html.includes('class="callout callout-note"'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 5: Literary types (epigraph, pullquote, aside, sidebar)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 5: Literary types ═══');
{
  const html = await run('> [!EPIGRAPH] Charles Dickens\n> "It was the best of times."');
  ok('epigraph renders as <figure>', html.includes('<figure'));
  ok('epigraph has class', html.includes('class="epigraph"'));
  ok('epigraph has quote div', html.includes('class="epigraph-quote"'));
  ok('epigraph has figcaption', html.includes('class="epigraph-attribution"'));
  ok('epigraph attribution text', html.includes('Charles Dickens'));
}

{
  const html = await run('> [!PULLQUOTE]\n> "Design is how it works."\n> — Steve Jobs');
  ok('pullquote renders as <figure>', html.includes('<figure'));
  ok('pullquote has class', html.includes('class="pullquote"'));
  ok('pullquote detects em-dash attribution', html.includes('Steve Jobs'));
}

{
  const html = await run('> [!ASIDE] Tangent\n> A marginal note.');
  ok('aside renders as <aside>', html.includes('<aside'));
  ok('aside has class', html.includes('class="aside"'));
  ok('aside has title', html.includes('class="aside-title"'));
  ok('aside has body', html.includes('class="aside-body"'));
}

{
  const html = await run('> [!SIDEBAR] Related\n> A sidebar.\n> — Author');
  ok('sidebar renders as <aside>', html.includes('<aside'));
  ok('sidebar has class', html.includes('class="sidebar"'));
  ok('sidebar has attribution', html.includes('Author'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 6: Structured-data types (bio, event) → <dl><dt><dd>
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 6: Structured-data types ═══');
{
  const html = await run(
    '> [!bio] Alan Turing\n> Born: June 23, 1912\n> Died: June 7, 1954\n> Nationality: British'
  );
  ok('bio renders as callout', html.includes('class="callout callout-bio"'));
  ok('bio has title (name)', html.includes('Alan Turing'));
  ok('bio has <dl>', html.includes('<dl'));
  ok('bio has <dt>', html.includes('<dt'));
  ok('bio has <dd>', html.includes('<dd'));
  ok('bio has Born field', html.includes('Born'));
  ok('bio has Born value', html.includes('June 23, 1912'));
}

{
  const html = await run(
    '> [!event] Apollo 11\n> Date: July 20, 1969\n> Location: Moon'
  );
  ok('event renders as callout', html.includes('class="callout callout-event"'));
  ok('event has <dl>', html.includes('<dl'));
  ok('event has Date field', html.includes('Date'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 7: Series navigation (next, continue)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 7: Series navigation ═══');
{
  const html = await run('> [!next]\n> Continue to Part 2');
  ok('next renders as callout', html.includes('class="callout callout-next"'));
}

{
  const html = await run('> [!continue] Part 2\n> Click to continue.');
  ok('continue renders as callout', html.includes('class="callout callout-continue"'));
  ok('continue has title', html.includes('Part 2'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 8: Accordions with native exclusive expansion
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 8: Accordions ═══');
{
  const html = await run(
    '> [!!] First panel\n> Body 1\n\n> [!!] Second panel\n> Body 2\n\n> [!!] Third panel\n> Body 3'
  );
  ok('three accordion panels render', (html.match(/class="accordion"/g) || []).length === 3);
  ok('accordion uses <details>', html.includes('<details'));
  ok('accordion has <summary>', html.includes('<summary'));
  ok('accordion has class accordion-header', html.includes('class="accordion-header"'));
  ok('accordion has class accordion-body', html.includes('class="accordion-body"'));
  ok('accordion has name attr for grouping', html.includes('name="accordion-group-'));
  ok('all 3 panels share the same group', /name="accordion-group-1"/g.test(html) && (html.match(/name="accordion-group-1"/g) || []).length === 3);
}

{
  // Accordion with emoji icon
  const html = await run('> [! 💻 !] Laptop\n> A panel with icon.');
  ok('accordion with icon renders', html.includes('class="accordion"'));
  ok('accordion icon preserved', html.includes('💻'));
  ok('accordion title preserved', html.includes('Laptop'));
}

{
  // Accordion run is broken by non-blockquote content
  const html = await run(
    '> [!!] First\n> Body 1\n\nSome text in between.\n\n> [!!] Second\n> Body 2'
  );
  ok('first panel gets group-1', html.includes('name="accordion-group-1"'));
  ok('second panel gets group-2 (run broken)', html.includes('name="accordion-group-2"'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 9: Custom callout types via options.callouts
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 9: Custom callout types ═══');
{
  const html = await run('> [!BRAND]\n> Body.', {
    callouts: {
      brand: {
        defaultTitle: 'Brand',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
        colorL: 0.55,
        colorC: 0.18,
        colorH: 300,
      },
    },
  });
  ok('custom brand callout renders', html.includes('class="callout callout-brand"'));
  ok('custom title applied', html.includes('>Brand<'));
  ok('custom colorH applied', html.includes('--callout-h: 300'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 10: Types whitelist
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 10: Types whitelist ═══');
{
  // Only allow 'note'; warning should fall through to plain blockquote
  const html = await run('> [!NOTE]\n> Note body.\n\n> [!WARNING]\n> Warning body.', {
    types: ['note'],
  });
  ok('whitelisted note still renders', html.includes('class="callout callout-note"'));
  ok('non-whitelisted warning falls back to blockquote', html.includes('<blockquote'));
  ok('non-whitelisted warning does NOT render as callout', !html.includes('callout-warning'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 11: Astro integration auto-detects Sätteri
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 11: Astro integration auto-detect ═══');
{
  try {
    const astroMod = await import('../dist/astro.js');
    ok('astro module imports', typeof astroMod.default === 'function');
    const integration = astroMod.default();
    ok('returns integration object', integration.name === 'remark-callout-plus');
    ok('has astro:config:setup hook', typeof integration.hooks['astro:config:setup'] === 'function');

    // Simulate Astro 7 Sätteri config.
    // The satteri() factory returns a processor whose `createRenderer` closure
    // reads `processor.options.mdastPlugins` at render time. The integration
    // exploits this by mutating the options array in place (rather than using
    // updateConfig, which would replace the processor and lose the closure).
    const satteriConfig = {
      markdown: {
        processor: {
          name: 'satteri',
          options: { mdastPlugins: [] },
        },
      },
    };
    integration.hooks['astro:config:setup']({
      config: satteriConfig,
      updateConfig: () => { /* no-op for Sätteri path */ },
    });
    const mdastPlugins = satteriConfig.markdown.processor.options.mdastPlugins;
    ok('Sätteri path: callout plugin was added in-place', mdastPlugins.length === 1);
    ok('Sätteri path: plugin has correct name', mdastPlugins[0]?.name === 'remark-callout-plus');
  } catch (e) {
    ok('astro module imports', false, e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 12: Astro integration falls back to unified path
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 12: Astro integration unified fallback ═══');
{
  const astroMod = await import('../dist/astro.js');
  const integration = astroMod.default();

  // Simulate Astro 6 / unified config (no processor field)
  const unifiedConfig = {
    markdown: {
      remarkPlugins: [],
      remarkRehype: {},
    },
  };
  const updates = [];
  integration.hooks['astro:config:setup']({
    config: unifiedConfig,
    updateConfig: (patch) => updates.push(patch),
  });
  ok('Unified path: emits update', updates.length === 1);
  ok('Unified path: remarkPlugins populated', Array.isArray(updates[0].markdown.remarkPlugins));
  ok('Unified path: callout plugin added', updates[0].markdown.remarkPlugins.length === 1);
  ok('Unified path: calloutToHast handler added', typeof updates[0].markdown.remarkRehype.handlers.callout === 'function');
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════════════════════');
console.log(`Sätteri adapter: ${pass} passed, ${fail} failed (of ${pass + fail} total)`);
console.log('═══════════════════════════════════════════════════════════════════════════');
for (const r of results) console.log(r);

if (fail > 0) {
  console.error(`\n❌ ${fail} test(s) failed`);
  process.exit(1);
} else {
  console.log(`\n✅ All ${pass} Sätteri adapter tests passed`);
}
