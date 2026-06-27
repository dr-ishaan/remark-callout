// Smoke test v3: use markdownToHtml (the full pipeline), not markdownToHast
// (which skips mdast plugins entirely).

import { markdownToHtml } from 'satteri';

console.log('--- Test: visitor firing via markdownToHtml ---');
try {
  const { html } = markdownToHtml('> [!NOTE]\n> Hello', {
    mdastPlugins: [
      {
        name: 'callout-test',
        blockquote(node, ctx) {
          console.log('[visitor] blockquote fired!');
          const first = node.children[0];
          if (!first || first.type !== 'paragraph') return;
          const firstChild = first.children[0];
          if (!firstChild || firstChild.type !== 'text') return;
          if (!firstChild.value.startsWith('[!NOTE]')) return;

          console.log('[visitor] MATCH — calling replaceNode');

          // Build a new subtree using native HAST data hints (hName/hProperties).
          // If Sätteri honors these like remark-rehype does, the output HTML
          // will be <div class="callout callout-note">...</div>.
          const newNode = {
            type: 'blockquote',
            data: {
              hName: 'div',
              hProperties: {
                className: ['callout', 'callout-note'],
                'data-callout': 'note',
                style: '--callout-l: 0.55; --callout-c: 0.18; --callout-h: 250;',
              },
            },
            children: [
              {
                type: 'blockquote',
                data: {
                  hName: 'div',
                  hProperties: { className: ['callout-header'] },
                },
                children: [
                  {
                    type: 'paragraph',
                    data: {
                      hName: 'span',
                      hProperties: { className: ['callout-title'] },
                    },
                    children: [{ type: 'text', value: 'Note' }],
                  },
                ],
              },
              {
                type: 'blockquote',
                data: {
                  hName: 'div',
                  hProperties: { className: ['callout-body'] },
                },
                children: [
                  {
                    type: 'paragraph',
                    children: [{ type: 'text', value: 'Hello' }],
                  },
                ],
              },
            ],
          };

          ctx.replaceNode(node, newNode);
          console.log('[visitor] replaceNode returned cleanly');
        },
      },
    ],
  });

  console.log('\n=== OUTPUT HTML ===');
  console.log(html);
} catch (err) {
  console.error('FAILED:', err.message);
  console.error(err.stack);
}
