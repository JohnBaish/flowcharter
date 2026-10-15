import { SHAPES, SHAPE_ORDER, type ShapeType } from '../data/shapes.ts';
import type { ChartLayout, LayoutNode, Point } from '../lib/layout.ts';
import {
  FONT_SIZE, LABEL_FONT_SIZE, LINE_HEIGHT, keyIcon, shapeInnerLines, shapePath, type DrawnShape,
} from '../lib/shapes.ts';

// The chart is drawn in the house ink and cream (HOUSE-STYLE §2) with each
// shape type's own pale fill (SPEC §3). Colours are written out rather than
// taken from CSS variables so the same SVG can later be saved as an image
// (Stage 3), where the page's stylesheet doesn't apply.
const INK = '#201e1d';
const CREAM = '#f5ead8';
const FONT_FAMILY = 'Figtree, system-ui, sans-serif';
const STROKE = 1.5;

const fillOf = (type: DrawnShape) => (type === 'stub' ? CREAM : SHAPES[type].fill);

function path(points: Point[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${Math.round(p.x * 10) / 10} ${Math.round(p.y * 10) / 10}`).join(' ');
}

function Shape({ n }: { n: LayoutNode }) {
  const inner = shapeInnerLines(n.type, n.w, n.h);
  const cx = n.w / 2 + n.textDx;
  const top = n.h / 2 + n.textDy - ((n.lines.length - 1) * LINE_HEIGHT) / 2;
  return (
    <g transform={`translate(${n.x} ${n.y})`}>
      <path
        d={shapePath(n.type, n.w, n.h)} fill={fillOf(n.type)} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round"
        className={n.type === 'stub' ? 'chart-paper-fill' : undefined}
      />
      {inner && <path d={inner} fill="none" stroke={INK} strokeWidth={STROKE} />}
      {n.lines.length > 0 && (
        <text textAnchor="middle" dominantBaseline="central" fontFamily={FONT_FAMILY} fontSize={FONT_SIZE} fill={INK}>
          {n.lines.map((line, i) => <tspan key={i} x={cx} y={top + i * LINE_HEIGHT}>{line}</tspan>)}
        </text>
      )}
    </g>
  );
}

/** The flowchart itself, at `scale` (1 = full size). */
export function FlowChart({ layout, scale, title }: { layout: ChartLayout; scale: number; title: string }) {
  return (
    <svg
      viewBox={`0 0 ${Math.ceil(layout.width)} ${Math.ceil(layout.height)}`}
      width={Math.floor(layout.width * scale)}
      height={Math.floor(layout.height * scale)}
      role="img"
      aria-label={`Flowchart: ${title}`}
      data-direction={layout.direction}
      style={{ display: 'block', margin: '0 auto', maxWidth: 'none' }}
    >
      <defs>
        <marker id="fc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M0 1 L10 5 L0 9 Z" fill={INK} />
        </marker>
      </defs>
      {/* Lines first, so shapes and labels sit on top of them. */}
      {layout.edges.map((e) => e.points.length >= 2 && (
        <path key={e.id} d={path(e.points)} fill="none" stroke={INK} strokeWidth={STROKE} markerEnd={e.toStub ? undefined : 'url(#fc-arrow)'} />
      ))}
      {layout.nodes.map((n) => <Shape key={n.id} n={n} />)}
      {layout.edges.map((e) => e.label && (
        <g key={`${e.id}-label`}>
          <rect className="chart-paper-fill" x={e.label.x} y={e.label.y} width={e.label.w} height={e.label.h} rx={e.label.h / 2} fill={CREAM} />
          <text
            x={e.label.x + e.label.w / 2} y={e.label.y + e.label.h / 2}
            textAnchor="middle" dominantBaseline="central"
            fontFamily={FONT_FAMILY} fontSize={LABEL_FONT_SIZE} fontWeight={700} fill={INK}
          >
            {e.label.text}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** A key to the shape types a chart uses, in the usual order. */
export function ShapeKey({ types }: { types: ShapeType[] }) {
  const used = SHAPE_ORDER.filter((t) => types.includes(t));
  if (!used.length) return null;
  return (
    <div className="chart-key" aria-label="Key to the shapes">
      {used.map((t) => {
        const { w, h, path: d, inner } = keyIcon(t);
        return (
          <span key={t} className="chart-key-item">
            <svg width={32} height={22} viewBox="0 0 32 22" aria-hidden="true">
              <g transform={`translate(${(32 - w) / 2} ${(22 - h) / 2})`}>
                <path d={d} fill={SHAPES[t].fill} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
                {inner && <path d={inner} fill="none" stroke={INK} strokeWidth={1.2} />}
              </g>
            </svg>
            {SHAPES[t].name}
          </span>
        );
      })}
    </div>
  );
}
