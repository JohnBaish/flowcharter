// Design mock-up script (not app code), 2026-10-20: ways to make the List | Chart
// switch clearer at a glance. Drives the real built app (`npm run build`, then
// `npx vite preview --port 4173`), builds the booking chart through the cards,
// then swaps in each version of the switch just before taking pictures of the
// header on the List and the Chart, at 1200px and at 390px with touch.
//   node design/mock-view-switch.mjs
import { mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const globalRoot = execSync('npm root -g').toString().trim();
const { chromium } = createRequire(`${globalRoot}/`)('playwright');
const OUT = new URL('./previews/view-switch/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const INK = '#201e1d';
// Small line icons, drawn in the text colour (so they turn cream on the orange button).
const SMALL = {
  list: `<svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <circle cx="2.5" cy="3" r="1.1" fill="currentColor" stroke="none"/><path d="M6.5 3H16"/>
    <circle cx="2.5" cy="8" r="1.1" fill="currentColor" stroke="none"/><path d="M6.5 8H16"/>
    <circle cx="2.5" cy="13" r="1.1" fill="currentColor" stroke="none"/><path d="M6.5 13H16"/></svg>`,
  chart: `<svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <rect x="1" y="1" width="8" height="4" rx="1"/><path d="M5 5V7.5"/>
    <path d="M5 7.5L9 11L5 14.5L1 11Z"/><path d="M9 11H12.5"/><rect x="12.5" y="9" width="4.5" height="4" rx="1"/></svg>`,
};
// Bigger pictures in the shapes' own colours, for the picture version.
const BIG = {
  list: `<svg width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">
    <rect x="0.75" y="0.75" width="42.5" height="28.5" rx="5" fill="#fffaf2" stroke="${INK}" stroke-width="1.2"/>
    <g font-family="Figtree, sans-serif" font-size="6" font-weight="700" fill="${INK}"><text x="5" y="10">1</text><text x="5" y="17.5">2</text><text x="5" y="25">3</text></g>
    <g stroke="${INK}" stroke-width="1.6" stroke-linecap="round"><path d="M11 8H36"/><path d="M11 15.5H31"/><path d="M11 23H34"/></g></svg>`,
  chart: `<svg width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">
    <g stroke="${INK}" stroke-width="1.1" stroke-linejoin="round">
      <rect x="9" y="1" width="14" height="7" rx="3.5" fill="#d8e6bd"/>
      <path d="M16 8V11"/>
      <path d="M16 11L23 16L16 21L9 16Z" fill="#f4dd8e"/>
      <path d="M23 16H30"/><rect x="30" y="12.5" width="13" height="7" fill="#d2def2"/>
      <path d="M16 21V23"/><rect x="9" y="23" width="14" height="6" fill="#d2def2"/></g></svg>`,
};

/** Puts one version of the switch in place of the real one's contents. */
const apply = (page, version) => page.evaluate(([v, small, big]) => {
  const seg = document.querySelector('.view-toggle');
  const labels = [...seg.querySelectorAll('.seg-opt')];
  const css = document.createElement('style');
  document.head.append(css);
  labels.forEach((l) => {
    const input = l.querySelector('input');
    const which = input.value;
    const word = which === 'list' ? 'List' : 'Chart';
    if (v === 'icons') l.innerHTML = `${small[which]}${word}`;
    if (v === 'pictures') l.innerHTML = `${big[which]}<span>${word}</span>`;
    if (v === 'tabs') l.innerHTML = `${small[which]}${word}`;
    l.prepend(input);
  });
  if (v === 'icons') css.textContent = `.view-toggle .seg-opt { gap: 8px; padding: 7px 18px 7px 14px; font-weight: 600; }`;
  if (v === 'pictures') css.textContent = `
    .view-toggle { border-radius: 16px; }
    .view-toggle .seg-opt { flex-direction: column; gap: 4px; padding: 8px 18px 6px; font-weight: 600; font-size: 13px; min-width: 72px; }
    .view-toggle .seg-opt:has(input:checked) { background: var(--color-accent-100); color: var(--color-accent-700); box-shadow: inset 0 0 0 2px var(--color-accent); }
    .view-toggle .seg-opt:not(:has(input:checked)) svg { opacity: .55; }
    .view-toggle .seg-opt:not(:has(input:checked)) { color: var(--color-neutral-700); }`;
  if (v === 'tabs') css.textContent = `
    .view-toggle { border: 0; border-radius: 0; gap: 4px; border-bottom: 2px solid var(--color-divider); overflow: visible; }
    .view-toggle .seg-opt { gap: 8px; padding: 8px 18px; font-size: 15px; font-weight: 600; border: 0 !important; border-radius: 10px 10px 0 0;
      margin-bottom: -2px; border-bottom: 3px solid transparent !important; color: var(--color-neutral-700); background: transparent; }
    .view-toggle .seg-opt:has(input:checked) { background: transparent; color: var(--color-accent-700); border-bottom-color: var(--color-accent) !important; }`;
}, [version, SMALL, BIG]);

const browser = await chromium.launch();
for (const [width, phone] of [[1200, false], [390, true]]) {
  const ctx = await browser.newContext({ viewport: { width, height: phone ? 844 : 860 }, deviceScaleFactor: 2, hasTouch: phone, isMobile: phone });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto('http://localhost:4173/');
  const click = (name) => page.getByRole('button', { name, exact: true }).first().click();
  const choose = (label) => page.locator('.wiz-choice, .wiz-pill', { hasText: label }).first().click();
  const type = (t) => page.locator('[data-wiz-input]').fill(t);
  await click('New chart'); await choose('Step by step');
  await type('Booking a table'); await click('Next');
  await choose('Something gets done'); await type('Choose a restaurant'); await click('Next');
  await choose('We ask a question'); await type('Do they have a table free at 8pm?'); await click('Next');
  await click('Next');
  await choose('Something gets done'); await type('Pay the deposit'); await click('Next');
  await choose("That's the end"); await type('Table booked'); await click('Next');
  await choose('It goes back to an earlier step');
  await page.locator('.wiz-picks .wiz-pill', { hasText: 'Choose a restaurant' }).click();
  await click('Go to the List');

  for (const screen of ['list', 'chart']) {
    for (const version of ['now', 'icons', 'pictures', 'tabs']) {
      await page.goto('http://localhost:4173/');
      await page.locator('.view-toggle').waitFor();
      await page.locator('.view-toggle .seg-opt', { hasText: screen === 'list' ? 'List' : 'Chart' }).click();
      await page.waitForTimeout(600);
      if (version !== 'now') await apply(page, version);
      await page.mouse.move(1, 1);
      await page.waitForTimeout(150);
      const h = phone ? 560 : 360;
      await page.screenshot({ path: `${OUT}${version}-${screen}-${phone ? 'phone' : 'computer'}.png`, clip: { x: 0, y: 0, width, height: h } });
    }
  }
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  if (sw > width) console.error('sideways scroll', width, sw);
  await ctx.close();
}
await browser.close();
console.log('done');
