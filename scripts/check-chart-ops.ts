// Checks the list's rules (src/lib/chartOps.ts) and the import/export
// checking (src/lib/exchange.ts). Run with: npm run check
// (Node runs the .ts files directly; there's no test framework in this project.)

import assert from 'node:assert/strict';
import { seedChart, newChart, type Item } from '../src/data/charts.ts';
import {
  addItem, addStepForAnswer, countReferences, guessType, leadsTo, removeItem, reorderItems, setRouteCount, setRouteLabel,
  setRouteTo, setText, setThen, setType, summary,
} from '../src/lib/chartOps.ts';
import { exportFilename, exportJson, parseImport, sanitiseChart } from '../src/lib/exchange.ts';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error(`FAIL: ${name}`); throw e; }
};
const byText = (items: Item[], text: string) => items.find((i) => i.text === text)!;

test('type guessing follows SPEC §4', () => {
  assert.equal(guessType('Anything', 0), 'terminator');
  assert.equal(guessType('Is it raining?', 0), 'terminator'); // row 1 wins, as specified
  assert.equal(guessType('Start', 3), 'terminator');
  assert.equal(guessType('  END. ', 3), 'terminator');
  assert.equal(guessType('Finish', 3), 'terminator');
  assert.equal(guessType('Stop', 3), 'terminator');
  assert.equal(guessType('Stop the clock', 3), 'process');
  assert.equal(guessType('Is a backup available?', 3), 'decision');
  assert.equal(guessType('Is a backup available? ', 3), 'decision');
  assert.equal(guessType('Book the backup', 3), 'process');
  assert.equal(guessType('', 3), 'process');
});

test('the seed chart summarises as in the mock-up', () => {
  assert.equal(summary(seedChart().items), '8 items · 2 questions');
  assert.equal(summary([]), '0 items · 0 questions');
});

test('typing a question makes a decision with Yes/No; removing the ? hides the answers but keeps them', () => {
  let items = addItem([], 'a', null);
  items = addItem(items, 'b', 'a');
  items = setText(items, 'b', 'Is it ready?');
  const b = items[1];
  assert.equal(b.type, 'decision');
  assert.deepEqual(b.routes.map((r) => r.label), ['Yes', 'No']);
  assert.equal(b.typeChosen, false);
  items = setText(items, 'b', 'Is it ready');
  assert.equal(items[1].type, 'process');
  assert.equal(items[1].routes.length, 2, 'answers kept while hidden');
  items = setText(items, 'b', 'Is it ready?');
  assert.equal(items[1].routes.length, 2, 'not duplicated when it becomes a decision again');
});

test("a decision's first answer goes to the next row; adding a row right after fills it in", () => {
  let items = addItem([], 'a', null);
  items = addItem(items, 'q', 'a');
  items = setText(items, 'q', 'Ready?');
  assert.equal(items[1].routes[0].to, null, 'nothing follows yet');
  items = addItem(items, 'c', 'q');
  assert.equal(items[1].routes[0].to, 'c');
  assert.equal(items[1].routes[1].to, null, 'the other answers start as Choose…');
  // …but it doesn't overwrite a destination that was already chosen
  items = addItem(items, 'd', 'q');
  assert.equal(items[1].routes[0].to, 'c');
});

test('a row guessed as a decision when something already follows points its first answer at that row', () => {
  let items = addItem([], 'a', null);
  items = addItem(items, 'b', 'a');
  items = addItem(items, 'c', 'b');
  items = setText(items, 'b', 'Ok?');
  assert.equal(items[1].routes[0].to, 'c');
});

test('choosing a type stops guessing for that row', () => {
  let items = addItem(addItem([], 'a', null), 'b', 'a');
  items = setType(items, 'b', 'document');
  assert.equal(items[1].typeChosen, true);
  items = setText(items, 'b', 'Is this a question?');
  assert.equal(items[1].type, 'document');
});

test('Start/End rows: ends here unless row 1; leaving that type restores "next"', () => {
  let items = addItem(addItem([], 'a', null), 'b', 'a');
  assert.deepEqual(items[0].then, { kind: 'next' });
  items = setText(items, 'b', 'End');
  assert.equal(items[1].type, 'terminator');
  assert.deepEqual(items[1].then, { kind: 'end' });
  items = setText(items, 'b', 'Ending soon');
  assert.equal(items[1].type, 'process');
  assert.deepEqual(items[1].then, { kind: 'next' });
});

test('an explicit "then" to an item survives a change of type', () => {
  let items = addItem(addItem(addItem([], 'a', null), 'b', 'a'), 'c', 'b');
  items = setThen(items, 'b', { kind: 'item', to: 'a' });
  items = setType(items, 'b', 'document');
  assert.deepEqual(items[1].then, { kind: 'item', to: 'a' });
});

test('route count: 2–6, grows blank at the bottom, shrinks from the bottom', () => {
  const chart = seedChart();
  let items = setRouteCount(chart.items, 's3', 4);
  const r = byText(items, 'Is a backup available?').routes;
  assert.deepEqual(r.map((x) => x.label), ['Yes', 'No', '', '']);
  assert.deepEqual(r.map((x) => x.to), ['s4', 's6', null, null]);
  items = setRouteCount(items, 's3', 2);
  assert.deepEqual(byText(items, 'Is a backup available?').routes.map((x) => x.label), ['Yes', 'No']);
  assert.equal(setRouteCount(items, 's3', 1)[2].routes.length, 2, 'clamped up to 2');
  assert.equal(setRouteCount(items, 's3', 99)[2].routes.length, 6, 'clamped down to 6');
  assert.equal(setRouteCount(items, 's4', 3)[3].routes.length, 0, 'ignored for a non-decision');
});

test('route labels and destinations edit in place', () => {
  let items = setRouteLabel(seedChart().items, 's3', 's3a', 'Definitely');
  items = setRouteTo(items, 's3', 's3b', 's2');
  const routes = items[2].routes;
  assert.equal(routes[0].label, 'Definitely');
  assert.equal(routes[1].to, 's2');
  items = setRouteTo(items, 's3', 's3b', null);
  assert.equal(items[2].routes[1].to, null);
});

test('references count only routes in use, and not a row pointing at itself', () => {
  const items = seedChart().items;
  assert.equal(countReferences(items, 's6'), 2); // 3b and 7b
  assert.equal(countReferences(items, 's4'), 1);
  assert.equal(countReferences(items, 's1'), 0);
  const hidden = setType(items, 's7', 'process'); // 7's answers are hidden now
  assert.equal(countReferences(hidden, 's6'), 1);
  assert.equal(countReferences(setThen(items, 's6', { kind: 'item', to: 's6' }), 's6'), 2);
});

test('deleting a row sends what led to it back to Choose… / its default', () => {
  let items = setThen(seedChart().items, 's2', { kind: 'item', to: 's6' });
  items = removeItem(items, 's6');
  assert.equal(items.length, 7);
  assert.equal(items.find((i) => i.id === 's3')!.routes[1].to, null);
  assert.equal(items.find((i) => i.id === 's7')!.routes[1].to, null);
  assert.deepEqual(items.find((i) => i.id === 's2')!.then, { kind: 'next' });
  assert.equal(items.find((i) => i.id === 's3')!.routes[0].to, 's4', 'unrelated routes untouched');
  // a terminator that pointed at a deleted row goes back to ends-here, not next
  let t = setThen(seedChart().items, 's8', { kind: 'item', to: 's6' });
  t = removeItem(t, 's6');
  assert.deepEqual(t.find((i) => i.id === 's8')!.then, { kind: 'end' });
});

test('hidden answers pointing at a deleted row are cleared too', () => {
  let items = setType(seedChart().items, 's7', 'process');
  items = removeItem(items, 's6');
  assert.equal(items.find((i) => i.id === 's7')!.routes[1].to, null);
});

test('reordering moves a decision with its answers, and numbers follow the order', () => {
  const items = reorderItems(seedChart().items, 2, 0);
  assert.equal(items[0].text, 'Is a backup available?');
  assert.equal(items[0].routes.length, 2);
  assert.equal(items[0].routes[0].to, 's4', 'still points at the same item, not the same number');
  assert.equal(items.length, 8);
  assert.equal(reorderItems(seedChart().items, 2, 2).length, 8);
});

test('operations never change their input', () => {
  const chart = seedChart();
  const before = JSON.stringify(chart.items);
  setText(chart.items, 's2', 'x'); setType(chart.items, 's2', 'delay'); addItem(chart.items, 'n', 's2');
  removeItem(chart.items, 's6'); reorderItems(chart.items, 0, 3); setRouteCount(chart.items, 's3', 5);
  setThen(chart.items, 's2', { kind: 'end' }); setRouteLabel(chart.items, 's3', 's3a', 'z');
  assert.equal(JSON.stringify(chart.items), before);
});

test('text is limited to 80 characters', () => {
  assert.equal(setText(seedChart().items, 's2', 'x'.repeat(200))[1].text.length, 80);
});

test('export → import round-trips a library', () => {
  const chart = seedChart();
  const library = { charts: { [chart.id]: chart }, chartOrder: [chart.id], openChartId: chart.id };
  const parsed = parseImport(exportJson(library));
  assert.ok('library' in parsed);
  if ('library' in parsed) assert.deepEqual(parsed.library, library);
});

test('import gives friendly errors', () => {
  const err = (s: string) => { const r = parseImport(s); assert.ok('error' in r, s); return (r as { error: string }).error; };
  assert.match(err('not json'), /isn't valid JSON/);
  assert.match(err('{"app":"clockwheel","state":{}}'), /Flowcharter export/);
  assert.match(err('[]'), /Flowcharter export/);
  assert.match(err('{"app":"flowcharter","version":9,"state":{}}'), /newer version/);
  assert.match(err('{"app":"flowcharter","version":1,"state":{"charts":3}}'), /missing data/);
});

test('damaged charts are repaired, not trusted', () => {
  const c = sanitiseChart({
    id: 'x', name: 5, direction: 'sideways', lastEditedAt: 'yesterday',
    items: [
      { id: 'a', text: 'One', type: 'process', then: { kind: 'item', to: 'ghost' }, routes: 'nope' },
      { id: 'a', text: 'Dup id', type: 'decision', routes: [{ id: 'r', label: 'Yes', to: 'a' }, { label: 7, to: 'ghost' }] },
      { id: 'c', text: 'Bad type', type: 'blob' },
      'junk',
    ],
  })!;
  assert.equal(c.name, 'Untitled');
  assert.equal(c.direction, 'auto');
  assert.equal(typeof c.lastEditedAt, 'number');
  assert.equal(c.items.length, 2, 'rows with an unknown type or no shape are dropped');
  assert.notEqual(c.items[0].id, c.items[1].id, 'duplicate ids are separated');
  assert.deepEqual(c.items[0].then, { kind: 'next' }, 'a "then" to a missing row is dropped');
  assert.deepEqual(c.items[0].routes, []);
  assert.equal(c.items[1].routes[0].to, c.items[0].id, "answers point at the first row that had that id");
  assert.equal(c.items[1].routes[1].to, null);
  assert.equal(c.items[1].routes[1].label, '');
  assert.equal(sanitiseChart({ name: 'no id' }), null);
  assert.equal(newChart().items.length, 0);
});

test('leadsTo: next row, a chosen row, or nowhere', () => {
  const items = seedChart().items;
  assert.equal(leadsTo(items, 0), 's2', 'row 1 leads on to row 2');
  assert.equal(leadsTo(items, 3), 's5', '"Book the backup" leads into End');
  assert.equal(leadsTo(items, 4), null, 'End ends');
  assert.equal(leadsTo(items, 7), null, 'the last row ends');
  assert.equal(leadsTo(setThen(items, 's2', { kind: 'item', to: 's6' }), 1), 's6', 'a chosen row');
  const last = addItem(items, 'z', 's8'); // a Process after the final End
  assert.equal(leadsTo(last, 8), null, '"next" on the last row means it stops');
  assert.equal(leadsTo(addItem(last, 'y', 'z'), 8), 'y', '…until a row is added after it');
});

test('a decision always has at least two answers, even from a damaged file', () => {
  const c = sanitiseChart({ id: 'x', items: [
    { id: 'q', text: 'Ok?', type: 'decision', routes: [] },
    { id: 'n', text: 'Next', type: 'process' },
    { id: 'r', text: 'One?', type: 'decision', routes: [{ id: 'only', label: 'Yes', to: 'n' }] },
  ] })!;
  assert.deepEqual(c.items[0].routes.map((r) => [r.label, r.to]), [['Yes', 'n'], ['No', null]]);
  assert.deepEqual(c.items[2].routes.map((r) => [r.label, r.to]), [['Yes', 'n'], ['', null]]);
});

test('saved box positions (Stage 4) survive a reload; bad ones are dropped', () => {
  const c = sanitiseChart({ id: 'x', items: [{ id: 'a', type: 'process' }, { id: 'b', type: 'process' }],
    positions: { a: { x: 10, y: 20 }, b: { x: 'left', y: 0 }, ghost: { x: 1, y: 1 } } })!;
  assert.deepEqual(c.positions, { a: { x: 10, y: 20 } });
  assert.equal('positions' in sanitiseChart({ id: 'y', items: [] })!, false, 'no positions → no field');
});

test('export file name carries local date and time, like Clockmaker', () => {
  assert.equal(exportFilename(new Date(2026, 9, 5, 9, 7)), 'flowcharter-library-2026-10-05-0907.json');
});

test('"+ New step" on an answer adds a row at the end and points the answer at it', () => {
  // The worked example without its last two rows: 1 Start … 5 End, 6 Ask the next station.
  const items = seedChart().items.slice(0, 6);
  const out = addStepForAnswer(items, 's3', 's3b', 'n1');
  assert.equal(out.length, 7);
  assert.equal(out[6].id, 'n1');
  assert.equal(out[6].text, '');
  assert.equal(out[2].routes[1].to, 'n1', 'No now goes to the new row');
  // Row 6 used to end the chart ("next" with nothing after); it still does.
  assert.deepEqual(out[5].then, { kind: 'end' });
  assert.equal(leadsTo(out, 5), null);
});

test('"+ New step" straight after a question at the end of the list', () => {
  const items = seedChart().items.slice(0, 3); // … 3 Is a backup available? (last)
  const a = addStepForAnswer(items, 's3', 's3a', 'y');
  const b = addStepForAnswer(a, 's3', 's3b', 'n');
  assert.deepEqual(b.map((it) => it.id).slice(3), ['y', 'n']);
  assert.equal(b[2].routes[0].to, 'y');
  assert.equal(b[2].routes[1].to, 'n');
  assert.equal(leadsTo(b, 3), null, "the Yes step doesn't flow into the No step");
});

test('a saved Connector (removed 2026-10-16) comes back as an Action, keeping its words', () => {
  const c = sanitiseChart({ id: 'x', items: [{ id: 'a', type: 'terminator', text: 'Start' }, { id: 'b', type: 'connector', text: 'A' }] })!;
  assert.equal(c.items.length, 2);
  assert.equal(c.items[1].type, 'process');
  assert.equal(c.items[1].text, 'A');
});

console.log(`${passed} checks passed`);
