/**
 * Tests for the 7 new features:
 *   1. CSS isolation (literary types use <div>, not <blockquote>)
 *   2. Astro integration export exists
 *   3. [!bio] type with <dl><dt><dd> structure
 *   4. [!event] type
 *   5. createCalloutNode programmatic API
 *   6. CSS variable integration (string color values)
 *   7. [!next] / [!continue] series navigation types
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCallout, { calloutToHast, createCalloutNode } from '../dist/index.js';

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
// FEATURE 1: CSS isolation — literary types use <div>, not <blockquote>
// ═══════════════════════════════════════════════════════════════════════════
console.log('═══ FEATURE 1: CSS isolation (div, not blockquote) ═══');
{
  const epi = await run('> [!EPIGRAPH]\n> Quote.');
  ok('epigraph uses <div> not <blockquote>', !epi.includes('<blockquote'), epi.slice(0, 200));
  ok('epigraph has div.epigraph-quote', epi.includes('class="epigraph-quote"'));
  ok('epigraph still <figure>', epi.includes('<figure'));

  const pull = await run('> [!PULLQUOTE]\n> Quote.');
  ok('pullquote uses <div> not <blockquote>', !pull.includes('<blockquote'));
  ok('pullquote has div.pullquote-quote', pull.includes('class="pullquote-quote"'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 2: Astro integration export exists
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 2: Astro integration ═══');
{
  // Dynamic import — astro.ts may not resolve without astro installed,
  // but the file should exist and be importable.
  try {
    const astroMod = await import('../dist/astro.js');
    ok('astro module imports', typeof astroMod.default === 'function');
    ok('astro default export is a function', typeof astroMod.default === 'function');
    // Call it — should return an integration object
    const integration = astroMod.default();
    ok('returns integration object with name', integration.name === 'remark-callout-plus');
    ok('has hooks', typeof integration.hooks === 'object');
    ok('has astro:config:setup hook', typeof integration.hooks['astro:config:setup'] === 'function');
  } catch (e) {
    ok('astro module imports', false, e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 3: [!bio] type with <dl><dt><dd>
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 3: [!bio] type ═══');
{
  const html = await run('> [!bio] Alan Turing\n> Born: June 23, 1912\n> Died: June 7, 1954\n> Nationality: British\n> Role: Mathematician');
  ok('bio renders as callout', html.includes('class="callout callout-bio"'), html.slice(0, 200));
  ok('bio has title', html.includes('Alan Turing'));
  ok('bio has <dl>', html.includes('<dl'));
  ok('bio has <dt>', html.includes('<dt'));
  ok('bio has <dd>', html.includes('<dd'));
  ok('bio has Born field', html.includes('Born'));
  ok('bio has date value', html.includes('June 23, 1912'));
  ok('bio has Nationality', html.includes('British'));
  ok('bio has callout-fields class', html.includes('callout-fields'));
  ok('bio no <blockquote>', !html.includes('<blockquote'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 4: [!event] type
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 4: [!event] type ═══');
{
  const html = await run('> [!event] Apollo 11\n> Date: July 20, 1969\n> Location: Sea of Tranquility, Moon\n> Significance: First human moon landing');
  ok('event renders as callout', html.includes('class="callout callout-event"'), html.slice(0, 200));
  ok('event has title', html.includes('Apollo 11'));
  ok('event has <dl>', html.includes('<dl'));
  ok('event has Date field', html.includes('Date'));
  ok('event has date value', html.includes('July 20, 1969'));
  ok('event has Location', html.includes('Sea of Tranquility'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 5: createCalloutNode programmatic API
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 5: createCalloutNode API ═══');
{
  // Create a callout node programmatically
  const node = createCalloutNode('note', {
    title: 'Programmatic Callout',
    children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Injected from code' }] }],
  });

  ok('createCalloutNode returns object', typeof node === 'object');
  ok('node type is callout', node.type === 'callout');
  ok('calloutType is note', node.data.calloutType === 'note');
  ok('title set', node.data.calloutTitle === 'Programmatic Callout');
  ok('has icon', node.data.calloutIcon.length > 0);
  ok('has children', node.children.length === 1);
  ok('has hProperties style', typeof node.data.hProperties.style === 'string');

  // Render it via the pipeline
  const html = String(await unified()
    .use(remarkParse)
    .use(() => (tree) => { tree.children.unshift(node); })  // inject
    .use(remarkCallout)
    .use(remarkRehype, { handlers: { callout: calloutToHast } })
    .use(rehypeStringify)
    .process('Body'));

  ok('injected node renders as callout', html.includes('class="callout callout-note"'), html.slice(0, 200));
  ok('injected node has title', html.includes('Programmatic Callout'));
  ok('injected node has body', html.includes('Injected from code'));
}

// Create with foldable + id
{
  const node = createCalloutNode('warning', {
    title: 'Custom',
    foldable: 'open',
    id: 'my-warning',
    children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Body' }] }],
  });

  ok('foldable node has hName=details', node.data.hName === 'details');
  ok('foldable state set', node.data.foldable === 'open');
  ok('id set', node.data.calloutId === 'my-warning');
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 6: CSS variable integration (string color values)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 6: CSS variable integration ═══');
{
  // Custom callout with string CSS variable values
  const html = await run('> [!NOTE]\n> body', {
    callouts: {
      note: {
        defaultTitle: 'Note',
        icon: '<svg><circle/></svg>',
        colorL: 'var(--brand-l)',
        colorC: 'var(--brand-c)',
        colorH: 'var(--brand-h)',
      },
    },
  });

  ok('uses CSS var for colorL', html.includes('--callout-l: var(--brand-l)'), html.slice(0, 300));
  ok('uses CSS var for colorC', html.includes('--callout-c: var(--brand-c)'));
  ok('uses CSS var for colorH', html.includes('--callout-h: var(--brand-h)'));
  ok('no hardcoded oklch numbers', !html.includes('--callout-l: 0.55'));
}

// Numeric values still work (backward compat)
{
  const html = await run('> [!NOTE]\n> body');
  ok('numeric colors still work', html.includes('--callout-l: 0.55'));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 7: [!next] / [!continue] series navigation types
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══ FEATURE 7: [!next] / [!continue] types ═══');
{
  const htmlNext = await run('> [!next]\n> Continue to Part 2');
  ok('next renders as callout', htmlNext.includes('class="callout callout-next"'), htmlNext.slice(0, 200));
  ok('next has default title', htmlNext.includes('Next in Series'));
  ok('next has body', htmlNext.includes('Continue to Part 2'));

  const htmlCont = await run('> [!continue]\n> Keep reading');
  ok('continue renders as callout', htmlCont.includes('class="callout callout-continue"'));
  ok('continue has default title', htmlCont.includes('Continue Reading'));
  ok('continue has body', htmlCont.includes('Keep reading'));

  // With custom title
  const htmlCustom = await run('> [!next] Part 2: The Awakening\n> Click to continue');
  ok('next with custom title', htmlCustom.includes('Part 2: The Awakening'));
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`  7-feature test suite: ${pass} pass, ${fail} fail`);
console.log(`${'═'.repeat(60)}`);
console.log(results.join('\n'));
if (fail > 0) process.exit(1);
