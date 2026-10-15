// Flowcharter shape geometry and colours — used by the design mock-ups in
// this folder (shapes.html, mock-chart.html). Written as plain browser JS so
// the mock-ups open straight from disk; Stage 2 ports this to
// src/lib/shapes.ts. See SPEC.md §6.

const INK = '#201e1d';
const BG = '#f5ead8';

// One pale fill per shape type. Checked 2026-10-15: ink text is at least
// 10:1 contrast on every fill, and every fill is clearly distinct from the
// cream page and from each other (CIE Lab distance ≥ 11).
const SHAPES = {
  terminator: { name: 'Start / End', fill: '#d8e6bd', meaning: 'Where the process begins or finishes. One start, as many ends as needed.' },
  process: { name: 'Process', fill: '#d2def2', meaning: 'An action or task. The wording usually starts with a verb.' },
  decision: { name: 'Decision', fill: '#f4dd8e', meaning: 'A question. Each arrow leaving it is labelled with an answer.' },
  io: { name: 'Input / Output', fill: '#e4d3f0', meaning: 'Information coming in to, or going out of, the process.' },
  predefined: { name: 'Predefined process', fill: '#bfe3e1', meaning: 'A step that has its own separate flowchart elsewhere.' },
  document: { name: 'Document', fill: '#f3cfd6', meaning: 'A document or report is produced or used.' },
  delay: { name: 'Delay', fill: '#f7cba9', meaning: 'A waiting period where nothing happens.' },
  connector: { name: 'Connector', fill: '#d4c9b6', meaning: 'Jumps to a matching circle elsewhere, to avoid long or crossing lines.' },
};

const STROKE = `stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"`;

/** SVG markup for one shape, centred on (cx, cy), w × h. */
function shapeSvg(type, cx, cy, w, h) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const fill = `fill="${SHAPES[type].fill}"`;
  switch (type) {
    case 'terminator':
      return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${h / 2}" ${fill} ${STROKE}/>`;
    case 'process':
      return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" ${fill} ${STROKE}/>`;
    case 'decision':
      return `<path d="M${cx} ${y0} L${x1} ${cy} L${cx} ${y1} L${x0} ${cy} Z" ${fill} ${STROKE}/>`;
    case 'io': {
      const s = h * 0.32;
      return `<path d="M${x0 + s} ${y0} H${x1} L${x1 - s} ${y1} H${x0} Z" ${fill} ${STROKE}/>`;
    }
    case 'predefined':
      return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" ${fill} ${STROKE}/>`
        + `<path d="M${x0 + 9} ${y0} V${y1} M${x1 - 9} ${y0} V${y1}" fill="none" ${STROKE}/>`;
    case 'document': {
      const a = h * 0.1;
      return `<path d="M${x0} ${y0} H${x1} V${y1 - a} Q${x1 - w / 4} ${y1 - 3 * a} ${cx} ${y1 - a} T${x0} ${y1 - a} Z" ${fill} ${STROKE}/>`;
    }
    case 'delay': {
      const r = h / 2;
      return `<path d="M${x0} ${y0} H${x1 - r} A${r} ${r} 0 0 1 ${x1 - r} ${y1} H${x0} Z" ${fill} ${STROKE}/>`;
    }
    case 'connector': {
      const r = Math.min(w, h) / 2;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" ${fill} ${STROKE}/>`;
    }
  }
  return '';
}

/** Centred text, one tspan per line (the real app will measure and wrap). */
function textSvg(cx, cy, lines, size = 14, weight = 400) {
  const lh = size * 1.25;
  const top = cy - ((lines.length - 1) * lh) / 2;
  return `<text text-anchor="middle" dominant-baseline="central" font-family="Figtree, sans-serif" font-size="${size}" font-weight="${weight}" fill="${INK}">`
    + lines.map((l, i) => `<tspan x="${cx}" y="${top + i * lh}">${l}</tspan>`).join('')
    + '</text>';
}

/** Arrowhead marker; put once inside <defs>. */
const ARROW_DEFS = `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">`
  + `<path d="M0 1 L10 5 L0 9 Z" fill="${INK}"/></marker>`;

/** A flowline through the given points, ending in an arrowhead. */
function lineSvg(points) {
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.5" marker-end="url(#arrow)"/>`;
}

/** A route label sitting on a flowline: cream pill so the line doesn't run through the text. */
function routeLabelSvg(cx, cy, text) {
  const w = text.length * 7.6 + 14;
  return `<rect x="${cx - w / 2}" y="${cy - 10}" width="${w}" height="20" rx="10" fill="${BG}"/>`
    + textSvg(cx, cy, [text], 12.5, 700);
}
