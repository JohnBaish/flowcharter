// "Copy image" on the Chart screen (SPEC §6): the chart, with its name above and
// a key of its shapes below, as a PNG on a cream background at 2× resolution.
// It goes to the clipboard, or downloads if the browser won't take images on
// the clipboard (same pattern as Clockmaker's exportImage.ts).
//
// The picture is built as one standalone SVG and then drawn onto a canvas.
// A standalone SVG can't see the page's web fonts, so the fonts it uses are
// embedded inside it as data URLs — without that, the chart would silently
// fall back to the device's default fonts.

import { SHAPES, SHAPE_ORDER, type ShapeType } from '../data/shapes.ts';
import { keyIcon } from './shapes.ts';
import { canvasMeasure, fontsReady } from './textWrap.ts';
import caprasimo400 from '@fontsource/caprasimo/files/caprasimo-latin-400-normal.woff2?url';
import caprasimo400Ext from '@fontsource/caprasimo/files/caprasimo-latin-ext-400-normal.woff2?url';
import figtree400 from '@fontsource/figtree/files/figtree-latin-400-normal.woff2?url';
import figtree400Ext from '@fontsource/figtree/files/figtree-latin-ext-400-normal.woff2?url';
import figtree700 from '@fontsource/figtree/files/figtree-latin-700-normal.woff2?url';
import figtree700Ext from '@fontsource/figtree/files/figtree-latin-ext-700-normal.woff2?url';

const BG = '#f5ead8';
const INK = '#201e1d';
const MUTED = '#645c50';
const TITLE_FONT = '400 26px Caprasimo';
const KEY_FONT = '400 12.5px Figtree';

// The unicode ranges @fontsource splits each font into (copied from its CSS),
// so accented letters still come from the real font.
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const FONTS = [
  { family: 'Caprasimo', weight: 400, range: LATIN, url: caprasimo400 },
  { family: 'Caprasimo', weight: 400, range: LATIN_EXT, url: caprasimo400Ext },
  { family: 'Figtree', weight: 400, range: LATIN, url: figtree400 },
  { family: 'Figtree', weight: 400, range: LATIN_EXT, url: figtree400Ext },
  { family: 'Figtree', weight: 700, range: LATIN, url: figtree700 },
  { family: 'Figtree', weight: 700, range: LATIN_EXT, url: figtree700Ext },
];

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Fetched on the first copy, then reused.
let fontFaceCss: Promise<string> | null = null;
function embeddedFontFaces(): Promise<string> {
  fontFaceCss ??= Promise.all(FONTS.map(async (f) =>
    `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};unicode-range:${f.range};` +
    `src:url(${await toDataUrl(f.url)}) format('woff2');}`,
  )).then((rules) => rules.join(''))
    // If the fonts can't be fetched, still make the image (in fallback fonts)
    // rather than none — and try again next time.
    .catch(() => { fontFaceCss = null; return ''; });
  return fontFaceCss;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PAD = 28;
const KEY_ROW_H = 26;
const KEY_GAP = 22;

/** The key, laid out in centred rows no wider than `width`. */
function keySvg(types: ShapeType[], width: number, measure: (text: string, font: string) => number): { svg: string; height: number } {
  const used = SHAPE_ORDER.filter((t) => types.includes(t));
  const items = used.map((t) => ({ t, w: 32 + 6 + measure(SHAPES[t].name, KEY_FONT) }));
  const rows: (typeof items)[] = [];
  let row: typeof items = [], rowW = 0;
  for (const it of items) {
    const next = rowW + (row.length ? KEY_GAP : 0) + it.w;
    if (row.length && next > width) { rows.push(row); row = []; rowW = 0; }
    rowW += (row.length ? KEY_GAP : 0) + it.w;
    row.push(it);
  }
  if (row.length) rows.push(row);

  let out = '';
  rows.forEach((r, ri) => {
    const total = r.reduce((n, it, i) => n + it.w + (i ? KEY_GAP : 0), 0);
    let x = (width - total) / 2;
    const y = ri * KEY_ROW_H;
    for (const it of r) {
      const { w, h, path, inner } = keyIcon(it.t);
      out += `<g transform="translate(${x + (32 - w) / 2} ${y + (22 - h) / 2})">`
        + `<path d="${path}" fill="${SHAPES[it.t].fill}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`
        + (inner ? `<path d="${inner}" fill="none" stroke="${INK}" stroke-width="1.2"/>` : '')
        + '</g>'
        + `<text x="${x + 38}" y="${y + 11}" dominant-baseline="central" font-family="Figtree, sans-serif" font-size="12.5" fill="${MUTED}">${esc(SHAPES[it.t].name)}</text>`;
      x += it.w + KEY_GAP;
    }
  });
  return { svg: out, height: rows.length * KEY_ROW_H };
}

/** Builds the whole picture as one SVG document. Exported for checking. */
export function buildImageSvg(
  chartSvg: SVGSVGElement, title: string, types: ShapeType[], fonts: string,
  measure: (text: string, font: string) => number,
): { svg: string; width: number; height: number } {
  const vb = chartSvg.viewBox.baseVal;
  const cw = Math.ceil(vb.width), ch = Math.ceil(vb.height);
  const heading = title.trim() || 'Flowchart';
  const width = Math.ceil(Math.max(cw, measure(heading, TITLE_FONT), 360) + 2 * PAD);
  const key = keySvg(types, width - 2 * PAD, measure);

  // The chart, exactly as drawn on screen, but at full size rather than shrunk to fit.
  const copy = chartSvg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('x', String((width - cw) / 2));
  copy.setAttribute('y', String(PAD + 38));
  copy.setAttribute('width', String(cw));
  copy.setAttribute('height', String(ch));
  copy.removeAttribute('style');
  copy.removeAttribute('role');
  copy.removeAttribute('aria-label');
  const chart = new XMLSerializer().serializeToString(copy);

  const keyY = PAD + 38 + ch + 14;
  const height = Math.ceil(keyY + key.height + PAD - 6);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<style>${fonts}</style>`
    + `<rect width="100%" height="100%" fill="${BG}"/>`
    + `<text x="${width / 2}" y="${PAD + 20}" text-anchor="middle" font-family="Caprasimo, serif" font-size="26" fill="${INK}">${esc(heading)}</text>`
    + chart
    + `<g transform="translate(${PAD} ${keyY})">${key.svg}</g>`
    + '</svg>';
  return { svg, width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))), 'image/png');
  });
}

/** Clipboard image writes aren't universally reliable (older browsers, and
 *  Safari can be fussy about timing) — if it fails or isn't supported, fall
 *  back to a plain file download rather than silently doing nothing. */
async function deliver(blob: Blob, filename: string): Promise<'copied' | 'downloaded'> {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && 'write' in navigator.clipboard) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return 'copied';
    }
  } catch {
    // fall through to download
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

/** A file name from a chart name: "Backup newsreader" → "backup-newsreader". */
export function slug(name: string): string {
  const s = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || 'flowchart';
}

// Browsers limit how large a canvas can be (Safari: about 16 million pixels in
// all), so a very large chart is drawn at a lower resolution rather than failing.
const MAX_PIXELS = 14_000_000;
const MAX_SIDE = 16_000;

/** Draws the chart's own SVG (plus name and key) to a PNG and puts it on the
 *  clipboard — the clipboard only takes raster images, not vector markup. */
export async function copyChartImage(
  chartSvg: SVGSVGElement, title: string, types: ShapeType[], filename: string,
): Promise<'copied' | 'downloaded'> {
  await fontsReady([TITLE_FONT, KEY_FONT]);
  const { svg, width, height } = buildImageSvg(chartSvg, title, types, await embeddedFontFaces(), canvasMeasure());
  const scale = Math.min(2, Math.sqrt(MAX_PIXELS / (width * height)), MAX_SIDE / Math.max(width, height));

  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load the chart as an image.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported in this browser.');
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await deliver(await canvasToBlob(canvas), filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}
