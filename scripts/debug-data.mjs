import { markdownToHtml } from 'satteri';

const md = `> [!!] First
> Body 1

> [!!] Second
> Body 2`;

const { html, data } = markdownToHtml(md, {
  mdastPlugins: [
    {
      name: 'debug',
      blockquote(node, ctx) {
        console.log('[ bq visitor] ctx.data keys:', Object.keys(ctx.data));
        console.log('[ bq visitor] ctx.data.accordionState:', ctx.data.accordionState);
        if (!ctx.data.accordionState) ctx.data.accordionState = { counter: 0, lastGroupId: null };
        const state = ctx.data.accordionState;
        if (state.lastGroupId) {
          console.log('  → continuing group', state.lastGroupId);
        } else {
          state.counter++;
          state.lastGroupId = `g${state.counter}`;
          console.log('  → starting new group', state.lastGroupId);
        }
      },
    },
  ],
});

console.log('\nFinal data:', JSON.stringify(data, null, 2));
