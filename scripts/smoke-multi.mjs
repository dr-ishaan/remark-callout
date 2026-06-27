// Smoke test v4: verify multiple visitor keys + post-pass walking works.
// Specifically: can a single plugin have BOTH a `blockquote` visitor (transform)
// AND a `root` or `paragraph` visitor (post-pass for adjacency grouping)?

import { markdownToHtml } from 'satteri';

const html = '> [!NOTE]\n> First\n\n> [!WARNING]\n> Second';

console.log('--- Test: multiple blockquotes, multiple visitor calls ---');
const seen = [];
const { html: out } = markdownToHtml(html, {
  mdastPlugins: [
    {
      name: 'multi-visitor-test',
      blockquote(node, ctx) {
        const first = node.children[0];
        if (!first || first.type !== 'paragraph') return;
        const firstChild = first.children[0];
        if (!firstChild || firstChild.type !== 'text') return;
        const text = firstChild.value;
        seen.push(text);
        console.log('[visitor] saw blockquote with first text:', JSON.stringify(text));

        if (text.startsWith('[!')) {
          // Replace with a div that has a data attribute so we can verify
          // post-pass behavior on sibling nodes.
          const type = text.match(/^\[!([A-Z]+)/)?.[1].toLowerCase() ?? 'unknown';
          ctx.replaceNode(node, {
            type: 'blockquote',
            data: {
              hName: 'div',
              hProperties: {
                className: ['callout', `callout-${type}`],
                'data-callout': type,
              },
            },
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: `Replaced: ${type}` }],
              },
            ],
          });
        }
      },
    },
  ],
});

console.log('\n[seen] blockquote visitor fired', seen.length, 'times');
console.log('\n=== OUTPUT HTML ===');
console.log(out);
