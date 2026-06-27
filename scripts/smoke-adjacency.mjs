// Smoke test v9: only break accordion run on TOP-LEVEL non-blockquote content.
// Use ctx.parent() to check if the paragraph is a child of the root.

import { markdownToHtml } from 'satteri';

const md = `> [!!] First panel
> Body 1

> [!!] Second panel
> Body 2

> [!!] Third panel
> Body 3

Some text in between.

> [!!] Fourth panel
> Body 4

> [!!] Fifth panel
> Body 5`;

function isTopLevel(node, ctx) {
  const parent = ctx.parent(node);
  return parent?.type === 'root';
}

const { html } = markdownToHtml(md, {
  mdastPlugins: [
    {
      name: 'accordion-grouping-v9',
      blockquote(node, ctx) {
        const first = node.children[0];
        if (!first || first.type !== 'paragraph') return;
        const firstChild = first.children[0];
        if (!firstChild || firstChild.type !== 'text') return;

        const isAccordion = firstChild.value.startsWith('[!!]');
        if (!ctx.data.acc) ctx.data.acc = { counter: 0, lastGroupId: null };

        if (!isAccordion) {
          if (isTopLevel(node, ctx)) ctx.data.acc.lastGroupId = null;
          return;
        }

        const title = firstChild.value.slice(4).trim();
        let groupId;
        if (ctx.data.acc.lastGroupId) {
          groupId = ctx.data.acc.lastGroupId;
          console.log(`[visitor] "${title.split('\n')[0]}" → continuing ${groupId}`);
        } else {
          ctx.data.acc.counter++;
          groupId = `accordion-group-${ctx.data.acc.counter}`;
          ctx.data.acc.lastGroupId = groupId;
          console.log(`[visitor] "${title.split('\n')[0]}" → starting ${groupId}`);
        }

        ctx.replaceNode(node, {
          type: 'blockquote',
          data: {
            hName: 'details',
            hProperties: {
              className: ['accordion'],
              'data-accordion-native': 'true',
              name: groupId,
            },
          },
          children: [
            {
              type: 'paragraph',
              data: {
                hName: 'summary',
                hProperties: { className: ['accordion-title'] },
              },
              children: [{ type: 'text', value: title }],
            },
          ],
        });
      },
      paragraph(node, ctx) {
        // Only break the run if this paragraph is at the top level
        // (paragraphs INSIDE blockquotes don't break sibling-accordion runs).
        if (ctx.data.acc && isTopLevel(node, ctx)) {
          ctx.data.acc.lastGroupId = null;
        }
      },
      heading(node, ctx) {
        if (ctx.data.acc && isTopLevel(node, ctx)) ctx.data.acc.lastGroupId = null;
      },
      code(node, ctx) {
        if (ctx.data.acc && isTopLevel(node, ctx)) ctx.data.acc.lastGroupId = null;
      },
      list(node, ctx) {
        if (ctx.data.acc && isTopLevel(node, ctx)) ctx.data.acc.lastGroupId = null;
      },
      thematicBreak(node, ctx) {
        if (ctx.data.acc && isTopLevel(node, ctx)) ctx.data.acc.lastGroupId = null;
      },
    },
  ],
});

console.log('\n=== OUTPUT HTML ===');
console.log(html);
console.log('\n=== EXPECTED ===');
console.log('- First 3 accordions: name="accordion-group-1"');
console.log('- Last 2 accordions: name="accordion-group-2"');
