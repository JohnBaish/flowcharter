// The list's rules (SPEC §4) as plain functions on an array of items — no
// React, so they can be checked on their own (npm run check). The store wraps
// these with state, persistence and "last edited" stamps.
//
// Every function returns a new array and leaves its input alone. Structural
// changes (add, remove, reorder) never change a row's type behind the
// person's back: the type is guessed only when a row is created or its text
// is edited, and only until they pick a type themselves.

import {
  MAX_ITEM_TEXT, MAX_LABEL, MAX_ROUTES, MIN_ROUTES, uid,
  type Item, type ItemId, type Next, type Route,
} from '../data/charts.ts';
import type { ShapeType } from '../data/shapes.ts';

const END_WORDS = ['start', 'end', 'finish', 'stop'];

/** SPEC §4 "Type guessing": row 1 → Start/End; the words Start/End/Finish/Stop
 *  → Start/End; ends with "?" → Question; otherwise Action. */
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

/** Changing a step's words on the Chart: only the words change, never its
 *  shape, even when typing in the List would guess a new one (John, 2026-10-20). */
export function setWords(items: Item[], id: ItemId, text: string): Item[] {
  return items.map((it) => (it.id === id ? { ...it, text: text.slice(0, MAX_ITEM_TEXT) } : it));
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

/** "+ New step" in an answer's "goes to" box (Stage 4): adds a blank row at the
 *  end of the list and points the answer at it, so a branch can be started
 *  without first adding its row by hand. The row that was last keeps ending
 *  where it did — a "next" there meant "ends here" (nothing came after it), and
 *  it mustn't start flowing into the new branch. */
export function addStepForAnswer(items: Item[], decisionId: ItemId, routeId: string, newId: ItemId): Item[] {
  const last = items[items.length - 1];
  let out = items;
  if (last && last.id !== decisionId && last.type !== 'decision' && last.then.kind === 'next') {
    out = items.map((it) => (it.id === last.id ? { ...it, then: { kind: 'end' } } : it));
  }
  const at = out.length;
  const type = guessType('', at);
  out = [...out, { id: newId, text: '', type, typeChosen: false, then: defaultThen(type, at), routes: [] }];
  return setRouteTo(out, decisionId, routeId, newId);
}

// — the step-by-step cards (Stage 5) —
// The cards build the same list as typing does, through these functions. A
// "slot" is a loose end the next step can be attached to: after an ordinary row
// that leads nowhere yet, or a question's answer that has no destination.

export type Slot = { kind: 'after'; id: ItemId } | { kind: 'answer'; id: ItemId; routeId: string };

/** The first loose end, for the cards to ask about: an answer with no
 *  destination (questions in list order, answers in order), else a last row
 *  that leads nowhere yet. Null when every path is finished. */
export function nextOpenSlot(items: Item[]): Slot | null {
  for (const it of items) {
    if (it.type !== 'decision') continue;
    const r = it.routes.find((route) => route.to === null || !items.some((x) => x.id === route.to));
    if (r) return { kind: 'answer', id: it.id, routeId: r.id };
  }
  const i = items.length - 1;
  const last = items[i];
  if (last && last.type !== 'decision' && last.then.kind === 'next' && !(last.type === 'terminator' && i > 0)) {
    return { kind: 'after', id: last.id };
  }
  return null;
}

/** A question's first answer that has no destination yet. */
export function openAnswer(items: Item[], id: ItemId): Slot | null {
  const it = items.find((x) => x.id === id);
  if (!it || it.type !== 'decision') return null;
  const r = it.routes.find((route) => route.to === null || !items.some((x) => x.id === route.to));
  return r ? { kind: 'answer', id, routeId: r.id } : null;
}

/** Adds a new row at the bottom of the list and attaches it to `slot`. As with
 *  "+ New step", the row that was last keeps ending where it did. */
export function appendStep(items: Item[], slot: Slot, newId: ItemId, type: ShapeType, text: string): Item[] {
  const prevLast = items[items.length - 1];
  let out = items;
  if (prevLast && prevLast.type !== 'decision' && prevLast.then.kind === 'next' && !(slot.kind === 'after' && slot.id === prevLast.id)) {
    out = setThen(out, prevLast.id, { kind: 'end' });
  }
  const at = out.length;
  const fresh: Item = {
    id: newId, text: text.slice(0, MAX_ITEM_TEXT), type, typeChosen: true,
    then: defaultThen(type, at), routes: type === 'decision' ? withMinimumRoutes([], null) : [],
  };
  out = [...out, fresh];
  if (slot.kind === 'answer') return setRouteTo(out, slot.id, slot.routeId, newId);
  // An ordinary row: "next" if the new row now follows it directly, else point at it.
  const before = out[at - 1];
  return setThen(out, slot.id, before && before.id === slot.id ? { kind: 'next' } : { kind: 'item', to: newId });
}

/** "It goes back to an earlier step": joins a loose end to an existing row. */
export function linkSlot(items: Item[], slot: Slot, to: ItemId): Item[] {
  return slot.kind === 'answer' ? setRouteTo(items, slot.id, slot.routeId, to) : setThen(items, slot.id, { kind: 'item', to });
}

/** The answers card: sets a question's answers to these words (2–6 of them),
 *  keeping the destinations of answers that stay. */
export function setAnswers(items: Item[], id: ItemId, labels: string[]): Item[] {
  const n = Math.max(MIN_ROUTES, Math.min(MAX_ROUTES, labels.length));
  let out = setRouteCount(items, id, n);
  const it = out.find((x) => x.id === id);
  if (!it) return out;
  it.routes.forEach((r, i) => { out = setRouteLabel(out, id, r.id, (labels[i] ?? '').slice(0, MAX_LABEL)); });
  return out;
}

// — repeated answer names (fresh look 7.2): allowed, but pointed out —

const answerKey = (label: string) => label.trim().toLowerCase();

/** Answer names used more than once on one question, as typed the first time
 *  (capital letters and spaces around a name don't make a different name).
 *  Blank answers don't count. */
export function repeatedAnswers(labels: string[]): { name: string; count: number }[] {
  const seen = new Map<string, { name: string; count: number }>();
  for (const label of labels) {
    const key = answerKey(label);
    if (!key) continue;
    const found = seen.get(key);
    if (found) found.count += 1;
    else seen.set(key, { name: label.trim(), count: 1 });
  }
  return [...seen.values()].filter((g) => g.count > 1);
}

/** For the answer at `index`: how many answers share its name, and which of
 *  them it is (1 = the first). Null when its name is blank or its own. */
export function answerPlace(labels: string[], index: number): { count: number; nth: number } | null {
  const key = answerKey(labels[index] ?? '');
  if (!key) return null;
  const same = labels.map((l, i) => (answerKey(l) === key ? i : -1)).filter((i) => i >= 0);
  return same.length > 1 ? { count: same.length, nth: same.indexOf(index) + 1 } : null;
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

/** True when no other row leads to this one, so the chart draws it as a
 *  separate island (e.g. a row added after an End). Row 1 is where the chart
 *  starts, so it never counts; a row looping to itself doesn't count either. */
export function nothingLeadsTo(items: Item[], index: number): boolean {
  if (index === 0) return false;
  const id = items[index].id;
  return !items.some((it, j) => j !== index
    && (it.type === 'decision' ? it.routes.some((r) => r.to === id) : leadsTo(items, j) === id));
}

export const routeLetter = (i: number): string => 'abcdef'[i] ?? String(i + 1);

export function decisionCount(items: Item[]): number {
  return items.filter((it) => it.type === 'decision').length;
}

/** "8 items · 2 questions" */
export function summary(items: Item[]): string {
  const d = decisionCount(items);
  return `${items.length} item${items.length === 1 ? '' : 's'} · ${d} question${d === 1 ? '' : 's'}`;
}

/** How an item reads in a "goes to" dropdown: "4 · Book the backup". */
export function itemLabel(items: Item[], index: number): string {
  const text = items[index].text.trim() || '(no text yet)';
  return `${index + 1} · ${text.length > 40 ? `${text.slice(0, 39)}…` : text}`;
}
