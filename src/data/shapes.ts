// The seven shape types (SPEC §3; Connector removed and names changed by John, 2026-10-16).
// The ids ('process', 'decision', 'io', 'predefined', …) are saved in people's
// browsers and export files, so they never change — only the names shown do. Fills were checked on 2026-10-15 for ink
// contrast and for being distinct from the cream page and from each other —
// don't change one without re-checking. Geometry lives with the chart
// drawing (Stage 2); prototype in design/shapes.js.

export type ShapeType =
  | 'terminator' | 'process' | 'decision' | 'io'
  | 'predefined' | 'document' | 'delay';

export interface ShapeInfo {
  /** The name shown in the list's Type dropdown and in the key. */
  name: string;
  fill: string;
  meaning: string;
}

/** In the order they appear in the Type dropdown. */
export const SHAPE_ORDER: ShapeType[] = [
  'terminator', 'process', 'decision', 'io', 'predefined', 'document', 'delay',
];

export const SHAPES: Record<ShapeType, ShapeInfo> = {
  terminator: { name: 'Start / End', fill: '#d8e6bd', meaning: 'Where the process begins or finishes. One start, as many ends as needed.' },
  process: { name: 'Action', fill: '#d2def2', meaning: 'Something that gets done. The wording usually starts with a verb.' },
  decision: { name: 'Question', fill: '#f4dd8e', meaning: 'A question. Each arrow leaving it is labelled with an answer.' },
  io: { name: 'Data in/out', fill: '#e4d3f0', meaning: 'Information coming in to, or going out of, the process.' },
  predefined: { name: 'Standard routine', fill: '#bfe3e1', meaning: 'A routine that has its own separate flowchart elsewhere.' },
  document: { name: 'Document', fill: '#f3cfd6', meaning: 'A document or report is produced or used.' },
  delay: { name: 'Delay', fill: '#f7cba9', meaning: 'A waiting period where nothing happens.' },
};

export function isShapeType(v: unknown): v is ShapeType {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(SHAPES, v);
}
