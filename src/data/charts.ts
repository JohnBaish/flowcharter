// Chart data shapes (SPEC §7), the seed chart, and newChart().
//
// Everything that points at an item does so by item id, never by number —
// numbers are derived from list order, so inserting, deleting or reordering
// rows can never leave a route pointing at the wrong step.

import type { ShapeType } from './shapes.ts';

export type ItemId = string;

/** Where an ordinary (non-decision) row leads. */
export type Next = { kind: 'next' } | { kind: 'item'; to: ItemId } | { kind: 'end' };

/** One answer leaving a decision. `to: null` is "Choose…" (not decided yet). */
export interface Route {
  id: string;
  label: string;
  to: ItemId | null;
}

export interface Item {
  id: ItemId;
  text: string;
  type: ShapeType;
  /** False while the type is still being guessed from the text. */
  typeChosen: boolean;
  /** Used when type !== 'decision'. */
  then: Next;
  /** Used when type === 'decision'. Kept (hidden) if the type changes away. */
  routes: Route[];
}

export type Direction = 'auto' | 'down' | 'across';

export interface Chart {
  id: string;
  name: string;
  /** List order = item numbers. */
  items: Item[];
  direction: Direction;
  /** Stage 4 (moving boxes by hand). Not used yet. */
  positions?: Record<ItemId, { x: number; y: number }>;
  lastEditedAt: number;
}

export const MIN_ROUTES = 2;
export const MAX_ROUTES = 6;
export const MAX_ITEM_TEXT = 80;
export const MAX_NAME = 40;
export const MAX_LABEL = 40;

/** Short random id. Unique within a chart is all that's needed. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
}

export function newChart(name = 'New chart'): Chart {
  return { id: uid(), name, items: [], direction: 'auto', lastEditedAt: Date.now() };
}

export const SEED_CHART_ID = 'seed-backup-newsreader';

/** The worked example from SPEC §4 — what a first-time visitor sees. */
export function seedChart(): Chart {
  const item = (n: number, text: string, type: ShapeType, then: Next, routes: Route[] = []): Item =>
    ({ id: `s${n}`, text, type, typeChosen: true, then, routes });
  const next: Next = { kind: 'next' };
  const end: Next = { kind: 'end' };
  return {
    id: SEED_CHART_ID,
    name: 'Backup newsreader',
    direction: 'auto',
    lastEditedAt: Date.now(),
    items: [
      item(1, 'Start', 'terminator', next),
      item(2, 'Receive sick call', 'io', next),
      item(3, 'Is a backup available?', 'decision', next, [
        { id: 's3a', label: 'Yes', to: 's4' },
        { id: 's3b', label: 'No', to: 's6' },
      ]),
      item(4, 'Book the backup', 'process', next),
      item(5, 'End', 'terminator', end),
      item(6, 'Ask the next station for cover', 'process', next),
      item(7, 'Has cover been agreed?', 'decision', next, [
        { id: 's7a', label: 'Yes', to: 's8' },
        { id: 's7b', label: 'No', to: 's6' },
      ]),
      item(8, 'End', 'terminator', end),
    ],
  };
}
