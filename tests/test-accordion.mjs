// Test the new accordion family: [!!] marker.
//
// Accordions are a separate family from callouts:
//   - Bare [!!] marker (no TYPE inside)
//   - Optional [! icon !] token for emoji/SVG icon
//   - Title is text after the marker (and after optional icon token)
//   - Default closed; `+` forces open, `-` forces closed (same as default)
//   - Adjacent [!!] panels form a group with exclusive <details name="..."> expansion
//
// This script covers: bare accordion, emoji icon, SVG icon, foldable states,
// adjacency grouping, group separation by non-accordion content, body
// preservation, and no-callout-DNA verification.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkCalloutMod, { calloutToHast } from '../dist/index.js';
const remarkCallout = remarkCalloutMod.default || remarkCalloutMod;

const render = async (md) => String(
  await unified()
    .use(remarkParse)
    .use(remarkCallout)
    .use(remarkRehype, { handlers: { callout: calloutToHast } })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md)
);

let pass = 0, fail = 0;
const check = (name, ok, html) => {
  console.log(`\n=== ${name} === ${ok ? 'PASS \u2705' : 'FAIL \u274c'}`);
  console.log('output:', html.slice(0, 400) + (html.length > 400 ? '\u2026' : ''));
  ok ? pass++ : fail++;
};

// ── 1. Bare accordion (no icon, just title) ───────────────────────────────
{
  const html = await render('> [!!] Frequently asked question\n> The answer appears here.');
  check(
    'Bare accordion (no icon)',
    html.includes('<details') &&
      html.includes('class="accordion"') &&
      html.includes('class="accordion-header"') &&
      html.includes('class="accordion-title"') &&
      html.includes('Frequently asked question') &&
      html.includes('class="accordion-body"') &&
      html.includes('The answer appears here.') &&
      !html.includes('class="accordion-icon"') &&
      !html.includes('class="callout"') &&      // no callout DNA
      !html.includes('open'),                    // default closed
    html
  );
}

// ── 2. Accordion with emoji icon ──────────────────────────────────────────
{
  const html = await render('> [!!] [! 💻 !] Laptop\n> Body text.');
  check(
    'Accordion with emoji icon',
    html.includes('<details') &&
      html.includes('class="accordion"') &&
      html.includes('class="accordion-icon"') &&
      html.includes('💻') &&
      html.includes('class="accordion-title"') &&
      html.includes('Laptop') &&
      !html.includes('open'),
    html
  );
}

// ── 3. Accordion with SVG icon ────────────────────────────────────────────
{
  const svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  const html = await render(`> [!!] [! ${svgIcon} !] Custom SVG\n> Body.`);
  check(
    'Accordion with SVG icon',
    html.includes('<details') &&
      html.includes('class="accordion-icon"') &&
      html.includes('<svg') &&
      html.includes('circle cx="12"') &&
      html.includes('stroke="#3b82f6"') &&     // SVG keeps its own color
      html.includes('Custom SVG'),
    html
  );
}

// ── 4. Forced open state: [!!]+ ───────────────────────────────────────────
{
  const html = await render('> [!!]+ [! 💡 !] Open by default\n> Expanded content.');
  check(
    'Forced open state ([!!]+)',
    html.includes('<details') &&
      html.includes(' open>') &&                // `open` attribute present
      html.includes('class="accordion"') &&
      html.includes('Open by default'),
    html
  );
}

// ── 5. Forced closed state: [!!]- (same as default) ───────────────────────
{
  const html = await render('> [!!]- [! 📜 !] Closed\n> Hidden content.');
  check(
    'Forced closed state ([!!]-)',
    html.includes('<details') &&
      !html.includes(' open>') &&               // no `open` attribute
      html.includes('Closed'),
    html
  );
}

// ── 6. Adjacent accordions form a group with shared name ──────────────────
// Note: in Markdown, a blank line WITHOUT `>` between two blockquotes makes
// them separate blockquote nodes. A blank line WITH `>` is a continuation
// of the same blockquote (and the second `[!!]` would be treated as body
// content of the first). So adjacent accordions MUST be separated by a
// truly blank line (no `>`).
{
  const html = await render(
    '> [!!] [! 💻 !] Panel A\n> Body A.\n\n> [!!] [! 🔐 !] Panel B\n> Body B.'
  );
  // Both panels should have the SAME name attribute (exclusive group)
  const nameMatches = html.match(/name="accordion-group-\d+"/g) || [];
  check(
    'Adjacent accordions share a group name',
    html.includes('<details') &&
      nameMatches.length === 2 &&
      nameMatches[0] === nameMatches[1],         // same name on both
    html
  );
}

// ── 7. Non-accordion content between [!!] blocks breaks the group ─────────
{
  const html = await render(
    '> [!!] [! 1️⃣ !] Group 1, panel A\n> Body.\n\nThis paragraph breaks the group.\n\n> [!!] [! 2️⃣ !] Group 2, panel A\n> Body.'
  );
  // The two accordions should have DIFFERENT name attributes (separate groups)
  const nameMatches = html.match(/name="accordion-group-\d+"/g) || [];
  check(
    'Non-accordion content breaks the group',
    nameMatches.length === 2 &&
      nameMatches[0] !== nameMatches[1],         // different names
    html
  );
}

// ── 8. A callout between two accordions breaks the group ──────────────────
{
  const html = await render(
    '> [!!] [! 1️⃣ !] Accordion 1\n> Body.\n\n> [!NOTE]\n> A callout in between.\n\n> [!!] [! 2️⃣ !] Accordion 2\n> Body.'
  );
  const accordionNames = (html.match(/name="accordion-group-\d+"/g) || []);
  check(
    'Callout between accordions breaks the group',
    html.includes('class="accordion"') &&
      html.includes('class="callout ') &&        // callout still renders as callout (note: class="callout callout-note")
      accordionNames.length === 2 &&
      accordionNames[0] !== accordionNames[1],
    html
  );
}

// ── 9. Body preservation: multi-paragraph, lists, code blocks ─────────────
{
  const html = await render(
    '> [!!] [! 📦 !] Installation\n> First paragraph.\n>\n> Second paragraph.\n>\n> - Item 1\n> - Item 2\n>\n> ```bash\n> npm install\n> ```'
  );
  check(
    'Body preservation (multi-paragraph, list, code)',
    html.includes('class="accordion-body"') &&
      html.includes('First paragraph.') &&
      html.includes('Second paragraph.') &&
      html.includes('<ul>') &&
      html.includes('Item 1') &&
      html.includes('Item 2') &&
      html.includes('<pre>') &&
      html.includes('npm install'),
    html
  );
}

// ── 10. No callout DNA — accordion must not have callout classes/styles ───
{
  const html = await render('> [!!] [! 💻 !] Test\n> Body.');
  check(
    'No callout DNA',
    html.includes('class="accordion"') &&
      !html.includes('class="callout') &&
      !html.includes('callout-foldable') &&
      !html.includes('data-callout=') &&
      !html.includes('--callout-l:') &&          // no oklch color vars
      !html.includes('--callout-h:'),
    html
  );
}

// ── 11. Chevron is always present (even without icon) ─────────────────────
{
  const html = await render('> [!!] No icon here\n> Body.');
  check(
    'Chevron always present',
    html.includes('class="accordion-chevron"') &&
      html.includes('aria-hidden="true"'),
    html
  );
}

// ── 12. Empty title is allowed (icon only) ────────────────────────────────
{
  const html = await render('> [!!] [! 💻 !]\n> Body with no title.');
  check(
    'Icon-only accordion (no title)',
    html.includes('<details') &&
      html.includes('class="accordion-icon"') &&
      html.includes('💻') &&
      !html.includes('class="accordion-title"'),
    html
  );
}

// ── 13. Bare [!!] with no title and no icon ───────────────────────────────
{
  const html = await render('> [!!]\n> Just a body, no header text.');
  check(
    'Bare [!!] with no title and no icon',
    html.includes('<details') &&
      html.includes('class="accordion-header"') &&
      html.includes('class="accordion-chevron"') &&
      !html.includes('class="accordion-title"') &&
      !html.includes('class="accordion-icon"') &&
      html.includes('Just a body'),
    html
  );
}

// ── 14. [!!] must NOT be mistaken for a callout ───────────────────────────
{
  const html = await render('> [!!] Not a callout\n> Body.');
  check(
    '[!!] is not parsed as a callout',
    !html.includes('class="callout"') &&
      html.includes('class="accordion"'),
    html
  );
}

// ── 15. Three adjacent accordions all share the same group name ───────────
{
  const html = await render(
    '> [!!] [! 1️⃣ !] One\n> A.\n\n> [!!] [! 2️⃣ !] Two\n> B.\n\n> [!!] [! 3️⃣ !] Three\n> C.'
  );
  const nameMatches = html.match(/name="accordion-group-\d+"/g) || [];
  check(
    'Three adjacent accordions share one group name',
    nameMatches.length === 3 &&
      nameMatches[0] === nameMatches[1] &&
      nameMatches[1] === nameMatches[2],
    html
  );
}

// ── 16. Nested callout inside an accordion body ───────────────────────────
{
  const html = await render(
    '> [!!] [! 💻 !] Outer accordion\n> > [!NOTE]\n> > Inner callout body.'
  );
  check(
    'Nested callout inside accordion body',
    html.includes('class="accordion"') &&
      html.includes('class="callout ') &&        // note: class="callout callout-note"
      html.includes('callout-note') &&
      html.includes('Inner callout body'),
    html
  );
}

// ── 17. Shorthand [! icon !] standalone marker (with spaces) ──────────────
// The shorthand form `[! icon !] Title` (no `[!!]` prefix) is an accordion
// with the icon between the two `!`s and the title after `!]`. This is the
// form the user actually types in practice — `[!!] [! icon !] Title` is the
// verbose legacy form.
{
  const html = await render('> [! 💻 !] Laptop\n> Body text.');
  check(
    'Shorthand [! icon !] marker (with spaces)',
    html.includes('<details') &&
      html.includes('class="accordion"') &&
      html.includes('class="accordion-icon"') &&
      html.includes('💻') &&
      html.includes('class="accordion-title"') &&
      html.includes('Laptop') &&
      html.includes('Body text.') &&
      !html.includes('open') &&                  // default closed
      !html.includes('class="callout"'),         // not a callout
    html
  );
}

// ── 18. Shorthand [!icon!] (no spaces) ────────────────────────────────────
// The user often writes the marker without spaces around the icon — the
// regex must handle both forms.
{
  const html = await render('> [!😮!] What is this?\n> Body.');
  check(
    'Shorthand [!icon!] marker (no spaces)',
    html.includes('<details') &&
      html.includes('class="accordion"') &&
      html.includes('class="accordion-icon"') &&
      html.includes('😮') &&
      html.includes('class="accordion-title"') &&
      html.includes('What is this?') &&
      !html.includes('class="callout"'),
    html
  );
}

// ── 19. Shorthand with forced open state ──────────────────────────────────
{
  const html = await render('> [! 💡 !]+ Open by default\n> Body.');
  check(
    'Shorthand [! icon !]+ forced open',
    html.includes('<details') &&
      html.includes(' open>') &&                 // <details ... open>
      html.includes('class="accordion-icon"') &&
      html.includes('💡') &&
      html.includes('Open by default'),
    html
  );
}

// ── 20. Shorthand with forced closed state ────────────────────────────────
{
  const html = await render('> [! 📜 !]- Closed by default\n> Body.');
  check(
    'Shorthand [! icon !]- forced closed',
    html.includes('<details') &&
      !html.includes(' open>') &&
      html.includes('class="accordion-icon"') &&
      html.includes('📜') &&
      html.includes('Closed by default'),
    html
  );
}

// ── 21. Multi-paragraph blockquote splits into multiple accordions ────────
// When a SINGLE blockquote contains MULTIPLE accordion markers separated by
// blank `>` lines, each marker paragraph becomes its own accordion panel.
// Without this, only the first marker is detected and the rest become body
// text (which is the bug the user reported).
{
  const html = await render(
    '>[!😮!] What is this?\n>\n>[!!] Who are you?'
  );
  const detailsCount = (html.match(/<details/g) || []).length;
  const titleCount = (html.match(/class="accordion-title"/g) || []).length;
  check(
    'Multi-paragraph blockquote → multiple accordions',
    detailsCount === 2 &&
      titleCount === 2 &&
      html.includes('😮') &&
      html.includes('What is this?') &&
      html.includes('Who are you?') &&
      !html.includes('[!') &&                   // no literal marker text
      !html.includes('[!!]'),                   // no literal marker text
    html
  );
}

// ── 22. Multi-paragraph blockquote with body content per panel ────────────
// Each panel's body is the content between its marker and the next marker.
{
  const html = await render(
    '>[! 💻 !] First panel\n>First body.\n>\n>[! 🔐 !] Second panel\n>Second body.'
  );
  const detailsCount = (html.match(/<details/g) || []).length;
  check(
    'Multi-paragraph blockquote preserves per-panel body',
    detailsCount === 2 &&
      html.includes('First panel') &&
      html.includes('First body.') &&
      html.includes('Second panel') &&
      html.includes('Second body.') &&
      !html.includes('[!'),
    html
  );
}

// ── 23. Shorthand with SVG icon ───────────────────────────────────────────
{
  const svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  const html = await render(`> [! ${svgIcon} !] Custom SVG\n> Body.`);
  check(
    'Shorthand [! <svg> !] marker',
    html.includes('<details') &&
      html.includes('class="accordion-icon"') &&
      html.includes('<svg') &&
      html.includes('circle cx="12"') &&
      html.includes('Custom SVG') &&
      !html.includes('class="callout"'),
    html
  );
}

// ── 24. Disambiguation: [!NOTE] is a callout, NOT an accordion ────────────
// `[!NOTE]` has `]` immediately after the type → callout.
// `[! NOTE !]` has `!]` at the end → accordion-with-icon "NOTE".
// Both must be handled correctly — callouts must NOT become accordions.
{
  const html = await render('> [!NOTE]\n> Callout body.');
  check(
    '[!NOTE] is a callout (not accordion)',
    html.includes('class="callout ') &&          // it's a callout
      html.includes('callout-note') &&
      !html.includes('class="accordion"'),       // not an accordion
    html
  );
}

// ── 25. Disambiguation: [! NOTE !] is an accordion-with-icon ──────────────
{
  const html = await render('> [! NOTE !] Accordion with NOTE icon\n> Body.');
  check(
    '[! NOTE !] is an accordion (not callout)',
    html.includes('class="accordion"') &&
      html.includes('class="accordion-icon"') &&
      html.includes('>NOTE<') &&                 // icon content is "NOTE"
      html.includes('Accordion with NOTE icon') &&
      !html.includes('class="callout'),
    html
  );
}

// ── 26. Mixed shorthand and bare markers in one blockquote ────────────────
// The user's actual test case from the bug report: a shorthand-icon panel
// followed by a bare [!!] panel, both in one blockquote.
{
  const html = await render(
    '>[!😮!] What is this?\n>\n>[!!] Who are you?\n>\n>[! 🛡️ !] Protected'
  );
  const detailsCount = (html.match(/<details/g) || []).length;
  check(
    'Mixed shorthand + bare markers in one blockquote',
    detailsCount === 3 &&
      html.includes('😮') &&
      html.includes('What is this?') &&
      html.includes('Who are you?') &&
      html.includes('🛡️') &&
      html.includes('Protected') &&
      !html.includes('[!') &&                    // no literal marker text leaked
      !html.includes('[!!]'),
    html
  );
}

// ── 27. Shorthand and long-form produce equivalent output ─────────────────
// `[! 💻 !] Laptop` and `[!!] [! 💻 !] Laptop` should produce the same HTML
// (same icon, same title, same body).
{
  const shorthandHtml = await render('> [! 💻 !] Laptop\n> Body.');
  const longFormHtml = await render('> [!!] [! 💻 !] Laptop\n> Body.');
  check(
    'Shorthand and long-form produce equivalent output',
    shorthandHtml === longFormHtml,
    `shorthand: ${shorthandHtml}\nlong-form:   ${longFormHtml}`
  );
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\n──────────────────────────────────────────`);
console.log(`Accordion tests: ${pass} passed, ${fail} failed`);
console.log(`──────────────────────────────────────────`);
if (fail > 0) process.exit(1);
