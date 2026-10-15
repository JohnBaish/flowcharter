// The list's rules (SPEC §4) as plain functions on an array of items — no
// React, so they can be checked on their own (npm run check). The store wraps
// these with state, persistence and "last edited" stamps.
//
// Every function returns a new array and leaves its input alone. Structural
// changes (add, remove, reorder) never change a row's type behind the
// person's back: the type is guessed only when a row is created or its text
// is edited, and only until they pick a type themselves.

import {
  MAX_ITEM_TEXT, MAX_ROUTES, MIN_ROUTES, uid,
  type Item, type ItemId, type Next, type Route,
} from '../data/charts.ts';
import type { ShapeType } from '../data/shapes.ts';

const END_WORDS = ['start', 'end', 'finish', 'stop'];

/** SPEC §4 "Type guessing": row 1 → Start/End; the words Start/End/Finish/Stop
 *  → Start/End; ends with "?" → Decision; otherwise Process. */
export function guessType(text: string, index: number): ShapeType {
  if (index === 0) return 'terminator';
  const trimmed = text.trim();
  const word = trimmed.replace(/\.$/, '').trim().toLowerCase();
  if (END_WORDS.includes(word)) return 'terminator';
  if (trimmed.endsWith('?')) return 'decision';
  return 'process';
}

/** A Start/End row leads on only if it's row 1; anywhere else it ends the chart. */
export function defaultThen(type: ShapeType, index: number): Next {
  return type === 'terminator' && index > 0 ? { kind: 'end' } : { kind: 'next' };
}

/** A decision needs at least two answers. The first goes to the next row, the
 *  rest start as "Choose…". With two answers the labels default to Yes / No. */
export function withMinimumRoutes(routes: Route[], followingId: ItemId | null): Route[] {
  if (routes.length >= MIN_ROUTES) return routes;
  if (routes.length === 0) {
    return [
      { id: uid(), label: 'Yes', to: followingId },
      { id: uid(), label: 'No', to: null },
    ];
  }
  return [...routes, { id: uid(), label: '', to: null }];
}

/** Changes one row's type. Its "then" goes back to the new type's default
 *  unless the person pointed it at a specific item; its answers are created
 *  if it has become a decision (and kept, hidden, if it stops being one). */
function retype(item: Item, type: ShapeType, byPerson: boolean, index: number, followingId: ItemId | null): Item {
  if (item.type === type) return byPerson ? { ...item, typeChosen: true } : item;
  return {
    ...item,
    type,
    typeChosen: byPerson ? true : item.typeChosen,
    then: item.then.kind === 'item' ? item.then : defaultThen(type, index),
    routes: type === 'decision' ? withMinimumRoutes(item.routes, followingId) : item.routes,
  };
}

const followingId = (items: Item[], index: number): ItemId | null => items[index + 1]?.id ?? null;

export function setText(items: Item[], id: ItemId, text: string): Item[] {
  return items.map((it, i) => {
    if (it.id !== id) return it;
    const next = { ...it, text: text.slice(0, MAX_ITEM_TEXT) };
    if (it.typeChosen) return next;
    return retype(next, guessType(next.text, i), false, i, followingId(items, i));
  });
}

/** The person picked a type: from now on it's never guessed for this row. */
export function setType(items: Item[], id: ItemId, type: ShapeType): Item[] {
  return items.map((it, i) => (it.id === id ? retype(it, type, true, i, followingId(items, i)) : it));
}

/** Inserts a blank row after `afterId` (or at the end), with the id the caller made. */
export function addItem(items: Item[], newId: ItemId, afterId: ItemId | null): Item[] {
  const found = afterId ? items.findIndex((it) => it.id === afterId) : -1;
  const at = found >= 0 ? found + 1 : items.length;
  const type = guessType('', at);
  const fresh: Item = { id: newId, text: '', type, typeChosen: false, then: defaultThen(type, at), routes: [] };
  const out = [...items.slice(0, at), fresh, ...items.slice(at)];
  // Typing a list from the top, the row after a question is its first answer's
  // destination — so fill that in rather than leave "Choose…" behind.
  const before = out[at - 1];
  if (before && before.type === 'decision' && before.routes[0] && before.routes[0].to === null) {
    out[at - 1] = { ...before, routes: before.routes.map((r, i) => (i === 0 ? { ...r, to: newId } : r)) };
  }
  return out;
}

/** Routes that lead to `id` and are actually in use: a decision's answers, or
 *  an ordinary row's "then". Hidden answers (a decision that was retyped) and
 *  a row pointing at itself don't count. */
export function countReferences(items: Item[], id: ItemId): number {
  let n = 0;
  for (const it of items) {
    if (it.id === id) continue;
    if (it.type === 'decision') n += it.routes.filter((r) => r.to === id).length;
    else if (it.then.kind === 'item' && it.then.to === id) n += 1;
  }
  return n;
}

/** Removes a row. Anything that led to it goes back to "Choose…" (answers) or
 *  to the row's default (then) — hidden answers too, so they can't dangle. */
export function removeItem(items: Item[], id: ItemId): Item[] {
  return items
    .filter((it) => it.id !== id)
    .map((it, i) => ({
      ...it,
      then: it.then.kind === 'item' && it.then.to === id ? defaultThen(it.type, i) : it.then,
      routes: it.routes.some((r) => r.to === id) ? it.routes.map((r) => (r.to === id ? { ...r, to: null } : r)) : it.routes,
    }));
}

export function reorderItems(items: Item[], from: number, to: number): Item[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const out = [...items];
  const [moved] = out.splice(from, 1);
  out.splice(to, 0, moved);
  return out;
}

export function setThen(items: Item[], id: ItemId, then: Next): Item[] {
  return items.map((it) => (it.id === id ? { ...it, then } : it));
}

/** Sets how many answers a decision has (2–6). New answers are added at the
 *  bottom, blank; fewer removes from the bottom. */
export function setRouteCount(items: Item[], id: ItemId, count: number): Item[] {
  const n = Math.max(MIN_ROUTES, Math.min(MAX_ROUTES, Math.round(count)));
  return items.map((it) => {
    if (it.id !== id || it.type !== 'decision' || it.routes.length === n) return it;
    const routes = it.routes.length > n
      ? it.routes.slice(0, n)
      : [...it.routes, ...Array.from({ length: n - it.routes.length }, (): Route => ({ id: uid(), label: '', to: null }))];
    return { ...it, routes };
  });
}

function editRoute(items: Item[], id: ItemId, routeId: string, change: Partial<Route>): Item[] {
  return items.map((it) =>
    it.id !== id ? it : { ...it, routes: it.routes.map((r) => (r.id === routeId ? { ...r, ...change } : r)) });
}

export function setRouteLabel(items: Item[], id: ItemId, routeId: string, label: string): Item[] {
  return editRoute(items, id, routeId, { label });
}

export function setRouteTo(items: Item[], id: ItemId, routeId: string, to: ItemId | null): Item[] {
  return editRoute(items, id, routeId, { to });
}

// — read-only helpers the screens (and the chart drawing) share —

/** Where an ordinary (non-decision) row leads: the id of the row it flows into,
 *  or null if the chart stops there. "next" on the last row means it stops.
 *  The List shows this and the Chart draws it, so both must use this one rule. */
export function leadsTo(items: Item[], index: number): ItemId | null {
  const then = items[index].then;
  if (then.kind === 'end') return null;
  if (then.kind === 'item') return items.some((it) => it.id === then.to) ? then.to : null;
  return items[index + 1]?.id ?? null;
}

export const routeLetter = (i: number): string => 'abcdef'[i] ?? String(i + 1);

export function decisionCount(items: Item[]): number {
  return items.filter((it) => it.type === 'decision').length;
}

/** "8 items · 2 decisions" */
export function summary(items: Item[]): string {
  const d = decisionCount(items);
  return `${items.length} item${items.length === 1 ? '' : 's'} · ${d} decision${d === 1 ? '' : 's'}`;
}

/** How an item reads in a "goes to" dropdown: "4 · Book the backup". */
export function itemLabel(items: Item[], index: number): string {
  const text = items[index].text.trim() || '(no text yet)';
  return `${index + 1} · ${text.length > 40 ? `${text.slice(0, 39)}…` : text}`;
}
