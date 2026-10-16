// Reading charts back from outside the app: the browser's saved copy and
// Export/Import files. Both are untrusted — an old version, a hand-edited
// file or a half-written save must never crash the app — so everything is
// checked and repaired here rather than trusted.

import {
  MAX_ITEM_TEXT, MAX_LABEL, MAX_NAME, MAX_ROUTES, uid,
  type Chart, type Direction, type Item, type Route,
} from '../data/charts.ts';
import { isShapeType } from '../data/shapes.ts';
import { withMinimumRoutes } from './chartOps.ts';

/** The part of the app's state that is a person's work (not which screen is open). */
export interface Library {
  charts: Record<string, Chart>;
  chartOrder: string[];
  openChartId: string | null;
}

export const EXPORT_APP = 'flowcharter';
export const EXPORT_VERSION = 1;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback: string, max: number): string => (typeof v === 'string' ? v.slice(0, max) : fallback);
const DIRECTIONS: Direction[] = ['auto', 'down', 'across'];

function sanitiseItems(raw: unknown): Item[] {
  if (!Array.isArray(raw)) return [];
  // First pass: the rows themselves, each kept beside the record it came from.
  const seen = new Set<string>();
  const rows: { item: Item; rec: Record<string, unknown> }[] = [];
  for (const raw0 of raw) {
    // Connector was removed on 2026-10-16; a saved one becomes an Action.
    const rec = isObject(raw0) && raw0.type === 'connector' ? { ...raw0, type: 'process' } : raw0;
    if (!isObject(rec) || !isShapeType(rec.type)) continue;
    let id = typeof rec.id === 'string' && rec.id ? rec.id : uid();
    if (seen.has(id)) id = uid();
    seen.add(id);
    rows.push({
      rec,
      item: { id, text: str(rec.text, '', MAX_ITEM_TEXT), type: rec.type, typeChosen: rec.typeChosen === true, then: { kind: 'next' }, routes: [] },
    });
  }
  // Second pass, now every id is known: drop references to rows that don't exist.
  for (const { item, rec } of rows) {
    const t = rec.then;
    if (isObject(t) && t.kind === 'end') item.then = { kind: 'end' };
    else if (isObject(t) && t.kind === 'item' && typeof t.to === 'string' && seen.has(t.to)) item.then = { kind: 'item', to: t.to };
    if (Array.isArray(rec.routes)) {
      item.routes = rec.routes.filter(isObject).slice(0, MAX_ROUTES).map((rt): Route => ({
        id: typeof rt.id === 'string' && rt.id ? rt.id : uid(),
        label: str(rt.label, '', MAX_LABEL),
        to: typeof rt.to === 'string' && seen.has(rt.to) ? rt.to : null,
      }));
    }
  }
  // A decision always has at least two answers (the List and the Chart rely on it).
  rows.forEach(({ item }, i) => {
    if (item.type === 'decision') item.routes = withMinimumRoutes(item.routes, rows[i + 1]?.item.id ?? null);
  });
  return rows.map((r) => r.item);
}

function sanitisePositions(raw: unknown, items: Item[]): Chart['positions'] {
  if (!isObject(raw)) return undefined;
  const known = new Set(items.map((i) => i.id));
  const out: NonNullable<Chart['positions']> = {};
  for (const [id, p] of Object.entries(raw)) {
    if (known.has(id) && isObject(p) && Number.isFinite(p.x) && Number.isFinite(p.y)) out[id] = { x: p.x as number, y: p.y as number };
  }
  return Object.keys(out).length ? out : undefined;
}

// Every field of Chart must be carried across here: anything left out is
// silently dropped the next time the page loads (this runs on every load).
export function sanitiseChart(raw: unknown): Chart | null {
  if (!isObject(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  const items = sanitiseItems(raw.items);
  const positions = sanitisePositions(raw.positions, items);
  return {
    id: raw.id,
    name: str(raw.name, 'Untitled', MAX_NAME),
    items,
    direction: DIRECTIONS.includes(raw.direction as Direction) ? (raw.direction as Direction) : 'auto',
    ...(positions ? { positions } : {}),
    lastEditedAt: typeof raw.lastEditedAt === 'number' ? raw.lastEditedAt : Date.now(),
  };
}

/** Checks a library from anywhere. Returns null if it isn't one at all. */
export function sanitiseLibrary(raw: unknown): Library | null {
  if (!isObject(raw) || !isObject(raw.charts) || !Array.isArray(raw.chartOrder)) return null;
  const charts: Record<string, Chart> = {};
  for (const value of Object.values(raw.charts)) {
    const c = sanitiseChart(value);
    if (c) charts[c.id] = c;
  }
  const chartOrder = raw.chartOrder.filter((id): id is string => typeof id === 'string' && id in charts);
  // A chart that exists but is missing from the order would be unreachable.
  for (const id of Object.keys(charts)) if (!chartOrder.includes(id)) chartOrder.push(id);
  const open = typeof raw.openChartId === 'string' && raw.openChartId in charts ? raw.openChartId : (chartOrder[0] ?? null);
  return { charts, chartOrder, openChartId: open };
}

export function exportJson(library: Library, now = new Date()): string {
  return JSON.stringify({ app: EXPORT_APP, version: EXPORT_VERSION, exportedAt: now.toISOString(), state: library }, null, 2);
}

/** `flowcharter-library-2026-10-15-1430.json`, using the person's local date and time (as Clockmaker does). */
export function exportFilename(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `flowcharter-library-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
}

export type ParsedImport = { error: string } | { library: Library };

export function parseImport(json: string): ParsedImport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: "That file isn't valid JSON." };
  }
  if (!isObject(parsed) || parsed.app !== EXPORT_APP || !isObject(parsed.state)) {
    return { error: "That doesn't look like a Flowcharter export file." };
  }
  if (typeof parsed.version === 'number' && parsed.version > EXPORT_VERSION) {
    return { error: 'That file was made by a newer version of Flowcharter than this one.' };
  }
  const library = sanitiseLibrary(parsed.state);
  if (!library) return { error: 'That file is missing data Flowcharter needs — it may be corrupted.' };
  return { library };
}
