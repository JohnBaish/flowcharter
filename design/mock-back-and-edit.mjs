// Design mock-up script (not app code): makes the screenshots for
// design/mock-back-and-edit.html — (a) Back un-drawing the chart on the
// step-by-step cards, and (b) changing a box's words on the Chart.
//
// It drives the real app (run `npm run build` and `npx vite preview --port 4173`
// first), building the booking-a-table chart through the cards. The proposed
// changes don't exist in the app yet, so they are painted on top of the real
// screens just before each screenshot: the dashed "being written" shape, the
// "You chose…" line, and the edit boxes. Uses the globally installed Playwright:
//   node design/mock-back-and-edit.mjs
import { mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const globalRoot = execSync('npm root -g').toString().trim();
const { chromium } = createRequire(`${globalRoot}/`)('playwright');

const OUT = new URL('./previews/back-and-edit/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const URL_ = 'http://localhost:4173/';

const browser = await chromium.launch();

async function open(width, phone) {
  const ctx = await browser.newContext({
    viewport: { width, height: phone ? 844 : 860 },
    deviceScaleFactor: 2, hasTouch: phone, isMobile: phone,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(URL_);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

const settle = (page) => page.waitForTimeout(700);

// — things painted on top of the real screens —

/** Draws the shape holding these words dashed: the step on the card being written. */
const dashShape = (page, words) => page.evaluate((w) => {
  for (const g of document.querySelectorAll('.wiz-chart svg g, .wiz-peek svg g')) {
    const t = g.querySelector('text');
    if (t && t.textContent.replace(/\s+/g, ' ').includes(w)) {
      g.querySelectorAll('path').forEach((p) => { p.setAttribute('stroke-dasharray', '6 4'); });
    }
  }
}, words);

/** On the answers card: the answers' lines (still open circles) drawn dashed. */
const dashAnswers = (page) => page.evaluate(() => {
  for (const p of document.querySelectorAll('.wiz-chart svg > path')) {
    if (!p.getAttribute('marker-end')) p.setAttribute('stroke-dasharray', '6 4');
  }
});

/** On a kind card revisited by Back: the earlier choice outlined, and a line saying so. */
const chosenNote = (page, label, kindWords, stepWords) => page.evaluate(([l, k, s]) => {
  const h2 = document.querySelector('.wiz-card h2');
  const p = document.createElement('p');
  p.innerHTML = `You chose <strong>${k}</strong> here: <strong>${s}</strong>. Choose it again to carry on with those words, or choose something different.`;
  h2.after(p);
  for (const b of document.querySelectorAll('.wiz-choice, .wiz-pill')) {
    if (b.textContent.includes(l)) b.classList.add('wiz-choice-open');
  }
}, [label, kindWords, stepWords]);

/** The Chart's toolbar hint (draft wording). */
const chartHint = (page, text) => page.evaluate((t) => {
  const bar = document.querySelector('.chart-toolbar');
  const s = document.createElement('span');
  s.textContent = t;
  s.style.cssText = 'font-size:13px;color:var(--color-neutral-700);margin-left:auto';
  bar.append(s);
}, text);

/** The chart's shape (or answer pill) holding these words. */
const shapeBox = (page, words, pill) => page.evaluate(([w, isPill]) => {
  for (const g of document.querySelectorAll('.chart-frame svg g')) {
    const t = g.querySelector('text');
    const isLabel = !!g.querySelector('rect');
    if (isLabel !== isPill) continue;
    if (t && t.textContent.replace(/\s+/g, ' ').trim().startsWith(w)) {
      const el = isPill ? g.querySelector('rect') : g.querySelector('path');
      const r = el.getBoundingClientRect();
      return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height, fill: el.getAttribute('fill') };
    }
  }
  return null;
}, [words, !!pill]);

/** Hover on a computer: an orange outline round the shape. */
const outlineShape = (page, words, pill) => page.evaluate(([w, isPill]) => {
  for (const g of document.querySelectorAll('.chart-frame svg g')) {
    const t = g.querySelector('text');
    const isLabel = !!g.querySelector('rect');
    if (isLabel !== isPill) continue;
    if (t && t.textContent.replace(/\s+/g, ' ').trim().startsWith(w)) {
      const p = isPill ? g.querySelector('rect') : g.querySelector('path');
      p.setAttribute('stroke', '#c2552f'); p.setAttribute('stroke-width', '3');
    }
  }
}, [words, !!pill]);

/** Computer: the shape becomes the edit box — same place, size and colour,
 *  words selected, an orange outline — with a small hint beside it. */
const editOver = async (page, words, pill) => {
  const b = await shapeBox(page, words, pill);
  await page.evaluate(([b, w, isPill]) => {
    const fill = isPill ? '#fffdf8' : b.fill;
    const box = document.createElement('div');
    const pad = isPill ? 6 : 0;
    box.style.cssText = `position:absolute;left:${b.x - pad}px;top:${b.y - pad}px;width:${b.w + 2 * pad}px;height:${b.h + 2 * pad}px;z-index:50;
      display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:2.5px solid var(--color-accent);
      border-radius:${isPill ? 999 : 3}px;background:${fill};box-shadow:0 4px 14px rgba(0,0,0,.18);
      font:${isPill ? '700 13px' : '400 15px'}/1.3 Figtree,sans-serif;color:#201e1d;text-align:center;padding:0 8px;outline:none`;
    box.contentEditable = 'true';
    box.textContent = w;
    document.body.append(box);
    const hint = document.createElement('div');
    hint.textContent = 'Enter to save · Esc to cancel';
    hint.style.cssText = `position:absolute;left:${b.x + b.w + pad + 14}px;top:${b.y + b.h / 2 - 11}px;z-index:50;
      font:600 12px Figtree,sans-serif;color:var(--color-neutral-700);background:var(--color-surface);border-radius:8px;padding:4px 8px;white-space:nowrap`;
    document.body.append(hint);
    box.focus();
    const r = document.createRange(); r.selectNodeContents(box);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  }, [b, words, !!pill]);
};

/** Phone: the shape outlined and a panel at the top of the screen with the words. */
const phonePanel = (page, title, value) => page.evaluate(([t, v]) => {
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:60;background:var(--color-surface);padding:14px 16px 16px;box-shadow:0 8px 24px rgba(0,0,0,.18);border-radius:0 0 22px 22px';
  panel.innerHTML = `
    <div style="font:700 11px Figtree,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--color-accent-700)">${t}</div>
    <textarea rows="2" style="margin-top:8px;width:100%;box-sizing:border-box;resize:none;font:600 16px/1.35 Figtree,sans-serif;padding:10px 12px;
      border:1.5px solid var(--color-accent);border-radius:14px;background:var(--color-bg);color:var(--color-text);outline:none">${v}</textarea>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px">
      <button class="btn btn-ghost" style="min-height:44px;padding:0 18px">Cancel</button>
      <button class="btn btn-primary" style="min-height:44px;padding:0 22px">Save</button>
    </div>`;
  document.body.append(panel);
  const ta = panel.querySelector('textarea');
  ta.focus(); ta.select();
}, [title, value]);

/** A close-up around a shape, for the pictures where the edit box is too small to see. */
async function closeUp(page, words, pill, name) {
  const b = await shapeBox(page, words, pill);
  const cx = b.x + b.w / 2 + 80, cy = b.y + b.h / 2;
  await page.mouse.move(1, 1);
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: true, clip: { x: cx - 330, y: cy - 150, width: 660, height: 300 } });
}

// — driving the cards —

const click = (page, name) => page.getByRole('button', { name, exact: true }).first().click();
const choose = (page, label) => page.locator('.wiz-choice, .wiz-pill', { hasText: label }).first().click();
const type = (page, words) => page.locator('[data-wiz-input]').fill(words);
// The app reuses the chart's lines and shapes as it redraws, so anything painted
// on them is taken off again after each picture.
const unpaint = (page) => page.evaluate(() => {
  document.querySelectorAll('svg [stroke-dasharray]').forEach((el) => el.removeAttribute('stroke-dasharray'));
});
// Card pictures on a computer stop below the card: the rest is empty page.
const CARD_CLIP = { x: 0, y: 0, width: 1200, height: 720 };
const shot = async (page, name, opts = {}) => {
  await page.mouse.move(1, 1); await settle(page);
  const clip = name.startsWith('back-') && name.endsWith('computer') ? { clip: CARD_CLIP } : {};
  await page.screenshot({ path: `${OUT}${name}.png`, ...clip, ...opts });
  await unpaint(page);
};

async function run(width, phone) {
  const tag = phone ? 'phone' : 'computer';
  const page = await open(width, phone);
  await click(page, 'New chart');
  await choose(page, 'Step by step');
  await type(page, 'Booking a table'); await click(page, 'Next');

  // Each "back" frame is captured on the way forward, then painted to show how
  // the same card would look when Back returns to it.
  await choose(page, 'Something gets done');
  await type(page, 'Choose a restaurant'); await click(page, 'Next');

  // Frame 5: the kind card after "Choose a restaurant", revisited.
  await settle(page);
  const f5 = await page.evaluate(() => document.querySelector('.wiz-card').outerHTML);
  await chosenNote(page, 'We ask a question', 'We ask a question', 'Do they have a table free at 8pm?');
  if (!phone) await shot(page, `back-5-${tag}`);
  await page.evaluate(() => location.reload()); // clears the painted note; the cards pick up at the same loose end
  await page.waitForSelector('.wiz-card'); void f5;

  await choose(page, 'We ask a question');
  await type(page, 'Do they have a table free at 8pm?');
  await settle(page);
  await dashShape(page, 'Do they have');
  await dashAnswers(page);
  if (!phone) await shot(page, `back-4-${tag}`);
  await click(page, 'Next');

  await settle(page);
  await dashAnswers(page);
  if (!phone) await shot(page, `back-3-${tag}`);
  await click(page, 'Next');

  await settle(page);
  await chosenNote(page, 'Something gets done', 'Something gets done', 'Pay the deposit');
  await shot(page, `back-2-${tag}`);
  if (phone) {
    await click(page, 'Peek at the chart');
    await shot(page, `back-2-peek-${tag}`);
    await click(page, 'Back to the questions');
  }
  await page.evaluate(() => document.querySelectorAll('.wiz-card p').forEach((p) => { if (p.textContent.startsWith('You chose')) p.remove(); }));

  await choose(page, 'Something gets done');
  await type(page, 'Pay the deposit');
  await settle(page);
  await dashShape(page, 'Pay the deposit');
  if (!phone) await shot(page, `back-1-${tag}`);
  await click(page, 'Next');

  await settle(page);
  await shot(page, `back-0-${tag}`);
  if (phone) {
    await click(page, 'Peek at the chart');
    await shot(page, `back-0-peek-${tag}`);
    await click(page, 'Back to the questions');
  }

  // Finish the chart, for the Chart screen pictures.
  await choose(page, 'We wait'); await type(page, 'Wait for the confirmation email'); await click(page, 'Next');
  await choose(page, 'A document is made or used'); await type(page, 'Check the confirmation email'); await click(page, 'Next');
  await choose(page, "That's the end"); await type(page, 'Table booked'); await click(page, 'Next');
  await choose(page, 'It goes back to an earlier step');
  await page.locator('.wiz-picks .wiz-pill', { hasText: 'Choose a restaurant' }).click();
  await click(page, 'See your chart');
  await settle(page);

  if (!phone) {
    await chartHint(page, 'Click a box to change its words.');
    await outlineShape(page, 'Pay the deposit');
    await page.evaluate(() => { document.body.style.cursor = 'pointer'; });
    await shot(page, 'edit-1-hover-computer', { fullPage: true });
    await page.reload(); await settle(page);
    await chartHint(page, 'Click a box to change its words.');
    await editOver(page, 'Pay the deposit');
    await shot(page, 'edit-2-box-computer', { fullPage: true });
    await editOver(page, 'Pay the deposit');
    await closeUp(page, 'Pay the deposit', false, 'edit-2-box-closeup-computer');
    await page.reload(); await settle(page);
    await chartHint(page, 'Click a box to change its words.');
    await editOver(page, 'No', true);
    await shot(page, 'edit-3-answer-computer', { fullPage: true });
    await closeUp(page, 'No', true, 'edit-3-answer-closeup-computer');
  } else {
    await chartHint(page, 'Tap a box to change its words.');
    await shot(page, 'edit-1-phone');
    await outlineShape(page, 'Pay the deposit');
    const b = await shapeBox(page, 'Pay the deposit');
    await page.evaluate((y) => scrollTo(0, y - 420), b.y);
    await phonePanel(page, 'Change the words', 'Pay the deposit');
    await shot(page, 'edit-2-panel-phone');
  }
  await page.context().close();
}

await run(1200, false);
await run(390, true);
await browser.close();
console.log('done');
