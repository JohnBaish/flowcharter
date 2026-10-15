// Shape geometry for the chart (SPEC §3, §5): each type's outline, how big it
// must be to hold its text, and where a line meets its outline. Plain maths,
// no DOM, so it can be checked on its own. Ported from design/shapes.js.
//
// Everything is in chart units (px at 100%), relative to the shape's top-left.

import type { ShapeType } from '../data/shapes.ts';

/** A shape on the chart: one of the eight types, or the small open circle at
 *  the end of an answer that hasn't been given a destination yet. */
export type DrawnShape = ShapeType | 'stub';

export type Side = 'N' | 'E' | 'S' | 'W';

export const FONT_SIZE = 14;
export const LINE_HEIGHT = 17.5;
export const TEXT_FONT = `400 ${FONT_SIZE}px Figtree`;
export const LABEL_FONT_SIZE = 12.5;
export const LABEL_FONT = `700 ${LABEL_FONT_SIZE}px Figtree`;
export const LABEL_HEIGHT = 20;
export const LABEL_PAD_X = 7;
export const STUB_SIZE = 10;

const PAD_X = 14;
const PAD_Y = 11;
const DIAMOND_PAD = 6;

/** Text wider than this wraps onto another line. */
export function textMaxWidth(type: DrawnShape): number {
  if (type === 'decision') return 120;
  if (type === 'connector') return 40;
  return 180;
}

export interface ShapeBox {
  w: number;
  h: number;
  /** Where the middle of the text sits, relative to the shape's centre. */
  textDx: number;
  textDy: number;
}

const ioSlant = (h: number) => h * 0.32;
/** The document shape's wave height, from its full height. */
const DOC_WAVE = 0.08;
const docAmp = (h: number) => h * DOC_WAVE;
/** The wavy bottom edge: y at a given x (0..w). Dips to h a quarter of the way
 *  along and rises to h−2a three-quarters along, like the usual document symbol. */
const waveY = (x: number, w: number, h: number) => h - docAmp(h) + docAmp(h) * Math.sin((2 * Math.PI * x) / w);

/** How big a shape must be to hold a block of text `tw` wide and `th` tall. */
export function shapeBox(type: DrawnShape, tw: number, th: number): ShapeBox {
  const plainH = Math.max(th + 2 * PAD_Y, 44);
  switch (type) {
    case 'stub':
      return { w: STUB_SIZE, h: STUB_SIZE, textDx: 0, textDy: 0 };
    case 'connector': {
      const d = Math.max(tw + 16, th + 12, 36);
      return { w: d, h: d, textDx: 0, textDy: 0 };
    }
    case 'decision': {
      // The smallest diamond whose inside holds the text block: its corners
      // (tw/2+p, th/2+p) sit exactly on the diamond's edges when each half-width
      // is twice the text's half-width.
      const w = Math.max(2 * (tw + 2 * DIAMOND_PAD), 120);
      const h = Math.max(2 * (th + 2 * DIAMOND_PAD), 64);
      return { w, h, textDx: 0, textDy: 0 };
    }
    case 'terminator': {
      const h = Math.max(th + 2 * PAD_Y, 40);
      return { w: Math.max(tw + 2 * PAD_X + h * 0.5, 100), h, textDx: 0, textDy: 0 };
    }
    case 'io':
      return { w: Math.max(tw + 2 * PAD_X + ioSlant(plainH), 120), h: plainH, textDx: 0, textDy: 0 };
    case 'predefined':
      return { w: Math.max(tw + 2 * PAD_X + 18, 120), h: plainH, textDx: 0, textDy: 0 };
    case 'document': {
      // Tall enough that the text area above the wave is the usual height.
      const h = plainH / (1 - 2 * DOC_WAVE);
      return { w: Math.max(tw + 2 * PAD_X, 110), h, textDx: 0, textDy: -docAmp(h) };
    }
    case 'delay': {
      const r = plainH / 2;
      return { w: Math.max(tw + 2 * PAD_X + r * 0.6, 110), h: plainH, textDx: -r * 0.3, textDy: 0 };
    }
    case 'process':
    default:
      return { w: Math.max(tw + 2 * PAD_X, 110), h: plainH, textDx: 0, textDy: 0 };
  }
}

const f = (n: number) => Math.round(n * 100) / 100;

/** The outline as an SVG path, relative to the top-left. */
export function shapePath(type: DrawnShape, w: number, h: number): string {
  switch (type) {
    case 'terminator': {
      const r = h / 2;
      return `M${f(r)} 0 H${f(w - r)} A${f(r)} ${f(r)} 0 0 1 ${f(w - r)} ${f(h)} H${f(r)} A${f(r)} ${f(r)} 0 0 1 ${f(r)} 0 Z`;
    }
    case 'decision':
      return `M${f(w / 2)} 0 L${f(w)} ${f(h / 2)} L${f(w / 2)} ${f(h)} L0 ${f(h / 2)} Z`;
    case 'io': {
      const s = ioSlant(h);
      return `M${f(s)} 0 H${f(w)} L${f(w - s)} ${f(h)} H0 Z`;
    }
    case 'document': {
      const steps = 32;
      let d = `M0 0 H${f(w)} V${f(waveY(w, w, h))}`;
      for (let i = steps - 1; i >= 0; i--) {
        const x = (w * i) / steps;
        d += ` L${f(x)} ${f(waveY(x, w, h))}`;
      }
      return `${d} Z`;
    }
    case 'delay': {
      const r = h / 2;
      return `M0 0 H${f(w - r)} A${f(r)} ${f(r)} 0 0 1 ${f(w - r)} ${f(h)} H0 Z`;
    }
    case 'connector':
    case 'stub': {
      const r = w / 2;
      return `M0 ${f(r)} A${f(r)} ${f(r)} 0 1 0 ${f(w)} ${f(r)} A${f(r)} ${f(r)} 0 1 0 0 ${f(r)} Z`;
    }
    case 'predefined':
    case 'process':
    default:
      return `M0 0 H${f(w)} V${f(h)} H0 Z`;
  }
}

/** Extra lines drawn inside a shape (the predefined process's double sides). */
export function shapeInnerLines(type: DrawnShape, w: number, h: number): string | null {
  if (type !== 'predefined') return null;
  return `M9 0 V${f(h)} M${f(w - 9)} 0 V${f(h)}`;
}

/** A shape drawn small for a key (32×22 box): its outline, and any inner lines.
 *  Shared by the on-screen key and the saved image's key. */
export function keyIcon(type: ShapeType): { w: number; h: number; path: string; inner: string | null } {
  const w = type === 'connector' ? 18 : type === 'decision' ? 28 : 30;
  const h = type === 'connector' ? 18 : type === 'decision' ? 20 : 17;
  return { w, h, path: shapePath(type, w, h), inner: type === 'predefined' ? `M3.5 0 V${h} M${w - 3.5} 0 V${h}` : null };
}

const circleInset = (r: number, along: number) => r - Math.sqrt(Math.max(0, r * r - (along - r) * (along - r)));

/** How far inside its bounding box a shape's outline is, at a point on one side
 *  of the box. `t` is measured along that side from its start (left for N/S, top
 *  for E/W). A line arriving at the box is extended by this much so it touches
 *  the shape itself — the tip of a diamond, the curve of a Start/End — rather
 *  than stopping in the empty corner of the box. */
export function outlineInset(type: DrawnShape, w: number, h: number, side: Side, t: number): number {
  const ns = side === 'N' || side === 'S';
  switch (type) {
    case 'terminator': {
      const r = h / 2;
      if (!ns) return circleInset(r, t);
      if (t < r) return circleInset(r, t);
      if (t > w - r) return circleInset(r, t - (w - 2 * r));
      return 0;
    }
    case 'decision':
      return ns ? (Math.abs(t - w / 2) / (w / 2)) * (h / 2) : (Math.abs(t - h / 2) / (h / 2)) * (w / 2);
    case 'io': {
      const s = ioSlant(h);
      if (side === 'N') return t < s ? ((s - t) / s) * h : 0;
      if (side === 'S') return t > w - s ? ((t - (w - s)) / s) * h : 0;
      if (side === 'E') return (t / h) * s;
      return s * (1 - t / h);
    }
    case 'document':
      return side === 'S' ? Math.max(0, h - waveY(t, w, h)) : 0;
    case 'delay': {
      const r = h / 2;
      if (side === 'E') return circleInset(r, t);
      if (ns && t > w - r) return circleInset(r, t - (w - 2 * r));
      return 0;
    }
    case 'connector':
    case 'stub':
      return circleInset(w / 2, t);
    default:
      return 0;
  }
}
