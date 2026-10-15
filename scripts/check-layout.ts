// Checks the chart layout (src/lib/layout.ts, src/lib/shapes.ts) without a
// browser: text is measured roughly instead of with the real font, which is
// enough to check the structure. Run with: npm run check

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedChart, type Item } from '../src/data/charts.ts';
import { branchSides, layoutChart, type ChartLayout, type LayoutNode, type Point } from '../src/lib/layout.ts';
import { outlineInset, shapeBox } from '../src/lib/shapes.ts';
import { sanitiseLibrary } from '../src/lib/exchange.ts';

const measure = (text: string, font: string) => text.length * (font.startsWith('700') ? 7.4 : 7.2);

let passed = 0;
const test = async (name: string, fn: () => Promise<void> | void) => {
  try { await fn(); passed++; } catch (e) { console.error(`FAIL: ${name}`); throw e; }
};

const node = (L: ChartLayout, id: string) => L.nodes.find((n) => n.id === id)!;
const edge = (L: ChartLayout, id: string) => L.edges.find((e) => e.id === id)!;
const close = (a: number, b: number, tol = 1) => Math.abs(a - b) <= tol;
const centre = (n: LayoutNode): Point => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });

/** True if p lies on the shape's actual outline (not just its box). */
function onOutline(p: Point, n: LayoutNode): boolean {
  const sides = [
    { side: 'N' as const, d: p.y - n.y, t: p.x - n.x },
    { side: 'S' as const, d: n.y + n.h - p.y, t: p.x - n.x },
    { side: 'W' as const, d: p.x - n.x, t: p.y - n.y },
    { side: 'E' as const, d: n.x + n.w - p.x, t: p.y - n.y },
  ];
  return sides.some(({ side, d, t }) => close(d, outlineInset(n.type, n.w, n.h, side, t), 1.5));
}

const fixtures = sanitiseLibrary(JSON.parse(readFileSync(new URL('../design/test-charts.json', import.meta.url), 'utf8')).state)!;

await test('answers leave in list order: 2 → forward then side; 3 → side, forward, side', () => {
  assert.deepEqual(branchSides(2, 'down'), ['S', 'E']);
  assert.deepEqual(branchSides(3, 'down'), ['W', 'S', 'E']);
  assert.deepEqual(branchSides(5, 'down'), ['W', 'S', 'S', 'S', 'E']);
  assert.deepEqual(branchSides(2, 'across'), ['E', 'S']);
  assert.deepEqual(branchSides(3, 'across'), ['N', 'E', 'S']);
});

await test('a diamond is big enough to hold its text', () => {
  const tw = 110, th = 35;
  const b = shapeBox('decision', tw, th);
  // the text block's corner must be inside the diamond: |x|/(w/2) + |y|/(h/2) ≤ 1
  assert.ok((tw / 2) / (b.w / 2) + (th / 2) / (b.h / 2) <= 1);
});

for (const direction of ['down', 'across'] as const) {
  await test(`the worked example lays out ${direction}`, async () => {
    const L = await layoutChart(seedChart().items, direction, measure);
    assert.equal(L.nodes.length, 8, 'one shape per row');
    assert.equal(L.edges.length, 8, 'six "then"s plus two answers each from two questions, minus the two Ends');
    // Yes leaves forward from the diamond's tip; No from the side tip
    const q = node(L, 's3'), c = centre(q);
    const yes = edge(L, 's3::route0').points[0], no = edge(L, 's3::route1').points[0];
    if (direction === 'down') {
      assert.ok(close(yes.x, c.x) && close(yes.y, q.y + q.h), 'Yes leaves from the bottom tip');
      assert.ok(close(no.x, q.x + q.w) && close(no.y, c.y), 'No leaves from the right-hand tip');
    } else {
      assert.ok(close(yes.x, q.x + q.w) && close(yes.y, c.y), 'Yes leaves from the right-hand tip');
      assert.ok(close(no.x, c.x) && close(no.y, q.y + q.h), 'No leaves from the bottom tip');
    }
    // the loop (7b "No" → 6) is there and arrives at 6
    const loop = edge(L, 's7::route1');
    assert.ok(onOutline(loop.points[loop.points.length - 1], node(L, 's6')), 'the loop arrives on "Ask the next station"');
    // the list's order is kept: 6 comes before 7 in the reading direction
    const a = node(L, 's6'), b = node(L, 's7');
    assert.ok(direction === 'down' ? a.y < b.y : a.x < b.x, 'not turned upside down by the loop');
  });
}

await test('every line starts and ends exactly on a shape (all test charts, both ways)', async () => {
  let lines = 0;
  for (const id of fixtures.chartOrder) {
    for (const direction of ['down', 'across'] as const) {
      const items: Item[] = fixtures.charts[id].items;
      const L = await layoutChart(items, direction, measure);
      assert.equal(L.nodes.filter((n) => n.type !== 'stub').length, items.length, `${id}: one shape per row`);
      for (const n of L.nodes) assert.ok([n.x, n.y, n.w, n.h].every(Number.isFinite), `${id}: shape ${n.id} has a position`);
      for (const e of L.edges) {
        assert.ok(e.points.length >= 2 && e.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)), `${id}: ${e.id} has a route`);
        const ends = [e.points[0], e.points[e.points.length - 1]];
        assert.ok(L.nodes.some((n) => onOutline(ends[0], n)), `${id} ${direction}: ${e.id} starts on a shape's outline`);
        assert.ok(L.nodes.some((n) => onOutline(ends[1], n)), `${id} ${direction}: ${e.id} ends on a shape's outline`);
        // right-angled lines only
        for (let i = 0; i + 1 < e.points.length; i++) {
          const p = e.points[i], q = e.points[i + 1];
          assert.ok(close(p.x, q.x, 0.6) || close(p.y, q.y, 0.6), `${id}: ${e.id} has a slanted stretch`);
        }
        lines++;
      }
    }
  }
  assert.ok(lines > 100);
});

await test('answer labels sit on their own lines', async () => {
  for (const id of fixtures.chartOrder) {
    const L = await layoutChart(fixtures.charts[id].items, 'down', measure);
    for (const e of L.edges) {
      if (!e.label) continue;
      const c = { x: e.label.x + e.label.w / 2, y: e.label.y + e.label.h / 2 };
      const onIt = e.points.some((p, i) => {
        const q = e.points[i + 1];
        if (!q) return false;
        const inX = c.x >= Math.min(p.x, q.x) - 1 && c.x <= Math.max(p.x, q.x) + 1;
        const inY = c.y >= Math.min(p.y, q.y) - 1 && c.y <= Math.max(p.y, q.y) + 1;
        return inX && inY;
      });
      assert.ok(onIt, `${id}: label "${e.label.text}" is on its line`);
    }
  }
});

await test('an unfinished answer ends at an open circle; a row nothing leads to still appears', async () => {
  const items = fixtures.charts['unfinished'].items;
  const L = await layoutChart(items, 'down', measure);
  const stubs = L.nodes.filter((n) => n.type === 'stub');
  assert.equal(stubs.length, 1);
  const toStub = L.edges.filter((e) => e.toStub);
  assert.equal(toStub.length, 1);
  assert.equal(toStub[0].label?.text, 'No');
  assert.ok(node(L, 'unfinished-5'), 'the stray row is drawn');
});

await test('three answers read in list order (Tea, Coffee, Water left to right)', async () => {
  const L = await layoutChart(fixtures.charts['drink'].items, 'down', measure);
  const xs = ['drink-3', 'drink-4', 'drink-5'].map((id) => node(L, id).x);
  assert.ok(xs[0] < xs[1] && xs[1] < xs[2], `got ${xs}`);
  const A = await layoutChart(fixtures.charts['newsreaders'].items, 'across', measure);
  const ys = ['newsreaders-3', 'newsreaders-10', 'newsreaders-17'].map((id) => node(A, id).y);
  assert.ok(ys[0] < ys[1] && ys[1] < ys[2], `Berkshire, Oxford, Solent top to bottom: got ${ys}`);
});

await test('five answers leave from the diamond in list order, starting on its outline', async () => {
  for (const direction of ['down', 'across'] as const) {
    const L = await layoutChart(fixtures.charts['five'].items, direction, measure);
    const q = node(L, 'five-2');
    const starts = [0, 1, 2, 3, 4].map((j) => edge(L, `five-2::route${j}`).points[0]);
    for (const p of starts) assert.ok(onOutline(p, q), `${direction}: answer starts on the diamond`);
    const targets = ['five-3', 'five-4', 'five-5', 'five-6', 'five-7'].map((id) => node(L, id));
    const along = targets.map((n) => (direction === 'down' ? n.x : n.y));
    assert.ok(along.every((v, i) => i === 0 || v > along[i - 1]), `${direction}: answers in list order, got ${along}`);
  }
});

await test('an empty chart and a single row lay out', async () => {
  const empty = await layoutChart([], 'down', measure);
  assert.equal(empty.nodes.length, 0);
  const one = await layoutChart([{ id: 'a', text: '', type: 'terminator', typeChosen: false, then: { kind: 'next' }, routes: [] }], 'down', measure);
  assert.equal(one.nodes.length, 1);
  assert.equal(one.edges.length, 0);
});

console.log(`${passed} layout checks passed`);
