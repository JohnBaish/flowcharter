// Turns a chart's list into positioned shapes and lines (SPEC §5), using
// elkjs's "layered" layout. Settings proven in design/layout-spike.cjs:
//  - model-order cycle breaking, so a loop keeps the list's order instead of
//    the chart being turned upside down to "fix" it;
//  - ports (fixed connection points) on every shape, so lines leave from the
//    middle of a side and a decision's answers leave from the diamond's tips.
//
// elkjs is large, so it's loaded only when a chart is first drawn.

import type { ElkExtendedEdge, ElkNode, ElkPort } from 'elkjs/lib/elk-api';
import type { Item } from '../data/charts.ts';
import { leadsTo } from './chartOps.ts';
import {
  LABEL_FONT, LABEL_HEIGHT, LABEL_PAD_X, LINE_HEIGHT, TEXT_FONT,
  outlineInset, shapeBox, textMaxWidth, type DrawnShape, type Side,
} from './shapes.ts';
import { wrapText, type Measure } from './textWrap.ts';

export type LaidOutDirection = 'down' | 'across';

export interface Point { x: number; y: number }

export interface LayoutNode {
  id: string;
  type: DrawnShape;
  x: number; y: number; w: number; h: number;
  lines: string[];
  textDx: number; textDy: number;
}

export interface LayoutLabel { x: number; y: number; w: number; h: number; text: string }

export interface LayoutEdge {
  id: string;
  points: Point[];
  label: LayoutLabel | null;
  /** Ends at an unfinished answer's open circle rather than a shape (no arrowhead). */
  toStub: boolean;
}

export interface ChartLayout {
  direction: LaidOutDirection;
  width: number;
  height: number;
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

// Which side of a shape each kind of connection uses. "Forward" is the way the
// chart reads (down, or across to the right). A loop arrives on the same side
// a decision's second answer leaves from (right when down, bottom when across):
// loops mostly come from answers, so they then go round the outside instead of
// crossing the line they loop back over. (With loops arriving on the top when
// across, the test charts had 11 crossings; on the bottom, none.)
const SIDES: Record<LaidOutDirection, { in: Side; out: Side; back: Side }> = {
  down: { in: 'N', out: 'S', back: 'E' },
  across: { in: 'W', out: 'E', back: 'S' },
};

/** Which side each of a decision's answers leaves from, in list order, so the
 *  answers read in the same order as the list (left to right, or top to bottom):
 *  two answers — the first carries straight on, the second goes to the side (as
 *  in the approved mock-up); three — one from each free tip of the diamond; more
 *  — the first and last from the side tips, the rest along the forward edge. */
export function branchSides(count: number, direction: LaidOutDirection): Side[] {
  const [first, forward, last]: Side[] = direction === 'down' ? ['W', 'S', 'E'] : ['N', 'E', 'S'];
  if (count <= 1) return [forward];
  if (count === 2) return [forward, last];
  return [first, ...Array.from({ length: count - 2 }, () => forward), last];
}

const CLOCKWISE: Side[] = ['N', 'E', 'S', 'W'];
const ELK_SIDE: Record<Side, string> = { N: 'NORTH', E: 'EAST', S: 'SOUTH', W: 'WEST' };

const portId = (nodeId: string, name: string) => `${nodeId}::${name}`;

interface Wanted { id: string; label: string; source: string; sourcePort: string; target: string; targetPort: string | null; toStub: boolean }

/** Builds the graph elkjs lays out. Exported for checking without a browser. */
export function buildGraph(items: Item[], direction: LaidOutDirection, measure: Measure): { graph: ElkNode; meta: Map<string, Omit<LayoutNode, 'x' | 'y'>>; owner: Map<string, string> } {
  const sides = SIDES[direction];
  const position = new Map(items.map((it, i) => [it.id, i]));
  const meta = new Map<string, Omit<LayoutNode, 'x' | 'y'>>();
  const children: ElkNode[] = [];
  const wanted: Wanted[] = [];
  const needsBack = new Set<string>();
  // Which shape each connection point (port) belongs to.
  const owner = new Map<string, string>();

  // Where every line goes. A line to a row at or above its own is a loop.
  items.forEach((it, i) => {
    const target = (to: string) => {
      const back = (position.get(to) ?? 0) <= i;
      if (back) needsBack.add(to);
      return { target: to, targetPort: portId(to, back ? 'back' : 'in') };
    };
    if (it.type === 'decision') {
      it.routes.forEach((r, j) => {
        const base = { id: `${it.id}::route${j}`, label: r.label.trim(), source: it.id, sourcePort: portId(it.id, `r${j}`) };
        if (r.to && position.has(r.to)) wanted.push({ ...base, ...target(r.to), toStub: false });
        else wanted.push({ ...base, target: `${it.id}::stub${j}`, targetPort: null, toStub: true });
      });
    } else {
      const to = leadsTo(items, i);
      if (to) wanted.push({ id: `${it.id}::then`, label: '', source: it.id, sourcePort: portId(it.id, 'out'), ...target(to), toStub: false });
    }
  });

  const port = (nodeId: string, name: string, side: Side): ElkPort & { side: Side } => {
    owner.set(portId(nodeId, name), nodeId);
    return { id: portId(nodeId, name), side, width: 0, height: 0, layoutOptions: { 'elk.port.side': ELK_SIDE[side] } };
  };
  /** Places a decision's connection points exactly (relative to its top-left):
   *  one answer on a side leaves from that tip; several share the middle part of
   *  the edge, spread out in reading order; a loop arriving on a side that also
   *  has an answer lands a little before the tip, leaving the tip to the answer. */
  const placeOnDiamond = (ports: (ElkPort & { side: Side })[], w: number, h: number) => {
    for (const side of CLOCKWISE) {
      const onSide = ports.filter((p) => p.side === side);
      if (!onSide.length) continue;
      const horizontal = side === 'N' || side === 'S';
      const length = horizontal ? w : h;
      const back = onSide.filter((p) => p.id.endsWith('::back'));
      const rest = onSide.filter((p) => !p.id.endsWith('::back'));
      const at = new Map<ElkPort, number>();
      if (rest.length === 1) at.set(rest[0], length / 2);
      else rest.forEach((p, i) => at.set(p, length * (0.3 + (0.4 * i) / (rest.length - 1))));
      back.forEach((p) => at.set(p, rest.length ? length * 0.22 : length / 2));
      for (const p of onSide) {
        const along = at.get(p) ?? length / 2;
        p.x = horizontal ? along : side === 'E' ? w : 0;
        p.y = horizontal ? (side === 'S' ? h : 0) : along;
      }
    }
  };

  items.forEach((it) => {
    const maxW = textMaxWidth(it.type);
    const lines = wrapText(it.text, maxW, TEXT_FONT, measure);
    const tw = Math.max(0, ...lines.map((l) => measure(l, TEXT_FONT)));
    const box = shapeBox(it.type, tw, Math.max(1, lines.length) * LINE_HEIGHT);
    meta.set(it.id, { id: it.id, type: it.type, w: box.w, h: box.h, lines, textDx: box.textDx, textDy: box.textDy });

    const isDecision = it.type === 'decision';
    const ports = [port(it.id, 'in', sides.in)];
    // A loop arriving at a decision comes in before (above / left of) any answer
    // leaving from the same side.
    if (needsBack.has(it.id) && isDecision) ports.push(port(it.id, 'back', sides.back));
    if (isDecision) {
      const out = branchSides(it.routes.length, direction);
      it.routes.forEach((_, j) => ports.push(port(it.id, `r${j}`, out[j])));
      placeOnDiamond(ports, box.w, box.h);
    } else {
      ports.push(port(it.id, 'out', sides.out));
      if (needsBack.has(it.id)) ports.push(port(it.id, 'back', sides.back));
    }
    children.push({
      id: it.id, width: box.w, height: box.h, ports: ports.map(({ side: _side, ...p }) => p),
      layoutOptions: {
        // A decision's connection points are placed exactly (placeOnDiamond),
        // which also keeps its answers in list order; other shapes only need
        // each connection centred on the right side.
        'elk.portConstraints': isDecision ? 'FIXED_POS' : 'FIXED_SIDE',
        'elk.portAlignment.default': 'CENTER',
      },
    });
    // An unfinished answer ends at a small open circle, placed just after its question.
    if (it.type === 'decision') it.routes.forEach((r, j) => {
      if (r.to && position.has(r.to)) return;
      const id = `${it.id}::stub${j}`;
      const s = shapeBox('stub', 0, 0);
      meta.set(id, { id, type: 'stub', w: s.w, h: s.h, lines: [], textDx: 0, textDy: 0 });
      children.push({ id, width: s.w, height: s.h });
    });
  });

  const edges: ElkExtendedEdge[] = wanted.map((e) => ({
    id: e.id,
    sources: [e.sourcePort],
    targets: [e.targetPort ?? e.target],
    labels: e.label ? [{ text: e.label, width: measure(e.label, LABEL_FONT) + 2 * LABEL_PAD_X, height: LABEL_HEIGHT }] : [],
  }));

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction === 'down' ? 'DOWN' : 'RIGHT',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.spacing.nodeNodeBetweenLayers': '44',
      'elk.spacing.nodeNode': '36',
      'elk.layered.spacing.edgeNodeBetweenLayers': '22',
      'elk.spacing.edgeNode': '20',
      'elk.spacing.edgeEdge': '14',
      'elk.spacing.edgeLabel': '4',
      'elk.edgeLabels.inline': 'true',
      'elk.edgeLabels.placement': 'TAIL',
      'elk.spacing.componentComponent': '48',
      'elk.padding': '[top=20,left=20,bottom=20,right=20]',
    },
    children,
    edges,
  };
  return { graph, meta, owner };
}

let elkPromise: Promise<{ layout: (g: ElkNode) => Promise<ElkNode> }> | null = null;
function loadElk() {
  elkPromise ??= import('elkjs/lib/elk.bundled.js').then(({ default: ELK }) => new ELK());
  return elkPromise;
}

/** Which side of a shape's box a line's end touches. */
function sideOf(p: Point, n: LayoutNode): Side {
  const d: [Side, number][] = [['N', Math.abs(p.y - n.y)], ['S', Math.abs(p.y - (n.y + n.h))], ['W', Math.abs(p.x - n.x)], ['E', Math.abs(p.x - (n.x + n.w))]];
  return d.sort((a, b) => a[1] - b[1])[0][0];
}

/** Moves a line's end from the shape's box onto the shape's outline. */
function onOutline(p: Point, n: LayoutNode): Point {
  const side = sideOf(p, n);
  const t = side === 'N' || side === 'S' ? p.x - n.x : p.y - n.y;
  const inset = outlineInset(n.type, n.w, n.h, side, t);
  if (side === 'N') return { x: p.x, y: p.y + inset };
  if (side === 'S') return { x: p.x, y: p.y - inset };
  if (side === 'W') return { x: p.x + inset, y: p.y };
  return { x: p.x - inset, y: p.y };
}

/** elkjs puts an answer's label beside its line; the agreed look (SPEC §5) has it
 *  sitting on the line, on a cream pill. So move each label's centre onto the
 *  nearest stretch of its line, kept clear of that stretch's ends where there's
 *  room, so it never covers an arrowhead or a shape. */
function onLine(label: LayoutLabel, points: Point[]): LayoutLabel {
  const c = { x: label.x + label.w / 2, y: label.y + label.h / 2 };
  let best: { p: Point; d: number; a: Point; b: Point } | null = null;
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i], b = points[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / len2)) : 0;
    const p = { x: a.x + t * dx, y: a.y + t * dy };
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (!best || d < best.d) best = { p, d, a, b };
  }
  if (!best) return label;
  const { a, b } = best;
  const p = { ...best.p };
  const keepClear = (lo: number, hi: number, v: number, half: number) => {
    const min = Math.min(lo, hi) + half + 6, max = Math.max(lo, hi) - half - 6;
    return min <= max ? Math.max(min, Math.min(max, v)) : (lo + hi) / 2;
  };
  if (Math.abs(a.x - b.x) < 0.5) p.y = keepClear(a.y, b.y, p.y, label.h / 2);
  else if (Math.abs(a.y - b.y) < 0.5) p.x = keepClear(a.x, b.x, p.x, label.w / 2);
  return { ...label, x: p.x - label.w / 2, y: p.y - label.h / 2 };
}

/** Lays a chart out in one direction. */
export async function layoutChart(items: Item[], direction: LaidOutDirection, measure: Measure): Promise<ChartLayout> {
  const { graph, meta, owner } = buildGraph(items, direction, measure);
  const elk = await loadElk();
  const out = await elk.layout(graph);

  const nodes: LayoutNode[] = (out.children ?? []).map((c) => ({ ...meta.get(c.id)!, x: c.x ?? 0, y: c.y ?? 0 }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ownerOf = (end: string) => byId.get(owner.get(end) ?? end);

  const edges: LayoutEdge[] = (out.edges ?? []).map((e) => {
    const s = (e as ElkExtendedEdge).sections?.[0];
    const points: Point[] = s ? [s.startPoint, ...(s.bendPoints ?? []), s.endPoint].map((p) => ({ x: p.x, y: p.y })) : [];
    const src = ownerOf((e as ElkExtendedEdge).sources[0]);
    const tgtEnd = (e as ElkExtendedEdge).targets[0];
    const tgt = ownerOf(tgtEnd);
    if (points.length >= 2 && src) points[0] = onOutline(points[0], src);
    if (points.length >= 2 && tgt) points[points.length - 1] = onOutline(points[points.length - 1], tgt);
    const l = e.labels?.[0];
    const label = l && l.text ? { x: l.x ?? 0, y: l.y ?? 0, w: l.width ?? 0, h: l.height ?? LABEL_HEIGHT, text: l.text } : null;
    return {
      id: e.id ?? '',
      points,
      label: label && points.length >= 2 ? onLine(label, points) : label,
      toStub: tgt?.type === 'stub',
    };
  });

  return { direction, width: out.width ?? 0, height: out.height ?? 0, nodes, edges };
}

/** How much a layout would have to shrink to fit a space (1 = fits at full size). */
export function fitScale(layout: ChartLayout, width: number, height: number): number {
  if (!layout.width || !layout.height) return 1;
  return Math.min(1, width / layout.width, height / layout.height);
}

/** "Automatic": whichever way round needs less shrinking to fit; top-to-bottom if equal. */
export function chooseDirection(down: ChartLayout, across: ChartLayout, width: number, height: number): ChartLayout {
  return fitScale(across, width, height) > fitScale(down, width, height) + 0.001 ? across : down;
}

