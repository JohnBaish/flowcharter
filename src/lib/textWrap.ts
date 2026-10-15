// Measuring and wrapping the text that goes inside shapes and on arrows.

/** Width in px of `text` drawn in a CSS `font` (e.g. "400 14px Figtree"). */
export type Measure = (text: string, font: string) => number;

/** Measures with a canvas in the page's own fonts. Call after the fonts have
 *  loaded (see fontsReady) or the widths are for a fallback font. */
export function canvasMeasure(): Measure {
  const ctx = document.createElement('canvas').getContext('2d');
  const cache = new Map<string, number>();
  return (text, font) => {
    const key = `${font}|${text}`;
    let w = cache.get(key);
    if (w === undefined) {
      if (ctx) { ctx.font = font; w = ctx.measureText(text).width; } else { w = text.length * 7.5; }
      cache.set(key, w);
    }
    return w;
  };
}

/** Waits until the chart's fonts are ready to measure and draw with. */
export async function fontsReady(fonts: string[]): Promise<void> {
  try {
    await Promise.all(fonts.map((font) => document.fonts.load(font)));
  } catch {
    // Measuring in a fallback font still gives a usable chart.
  }
}

/** Breaks text into lines no wider than maxWidth, at spaces where possible. */
export function wrapText(text: string, maxWidth: number, font: string, measure: Measure): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate, font) <= maxWidth) { line = candidate; continue; }
    if (line) lines.push(line);
    // A single word longer than the line: split it where it runs out of room.
    let rest = word;
    while (measure(rest, font) > maxWidth && rest.length > 1) {
      let cut = rest.length - 1;
      while (cut > 1 && measure(rest.slice(0, cut), font) > maxWidth) cut--;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    line = rest;
  }
  if (line) lines.push(line);
  return lines;
}
