// Writes design/test-charts.json: a Flowcharter export file of charts that
// exercise the drawing (PLAN.md Stage 2, step 6). Import it on the Library
// screen to look at them. Run with: node scripts/make-test-charts.ts

import { writeFileSync } from 'node:fs';
import { seedChart, type Chart, type Item, type Next, type Route } from '../src/data/charts.ts';
import type { ShapeType } from '../src/data/shapes.ts';
import { defaultThen } from '../src/lib/chartOps.ts';
import { exportJson, sanitiseLibrary } from '../src/lib/exchange.ts';

type Row = [text: string, type: ShapeType, routes?: [label: string, to: number | null][], then?: number | 'end'];

/** Rows refer to each other by number (1-based), as the List shows them. */
function chart(id: string, name: string, rows: Row[], direction: Chart['direction'] = 'auto'): Chart {
  const ids = rows.map((_, i) => `${id}-${i + 1}`);
  const items: Item[] = rows.map(([text, type, routes, then], i) => {
    const next: Next = then === 'end' ? { kind: 'end' } : typeof then === 'number' ? { kind: 'item', to: ids[then - 1] } : defaultThen(type, i);
    const rs: Route[] = (routes ?? []).map(([label, to], j) => ({ id: `${ids[i]}-r${j}`, label, to: to === null ? null : ids[to - 1] }));
    return { id: ids[i], text, type, typeChosen: true, then: next, routes: rs };
  });
  return { id, name, items, direction, lastEditedAt: Date.UTC(2026, 9, 15) };
}

const charts: Chart[] = [
  seedChart(),
  chart('tea', 'Test: a straight line', [
    ['Start', 'terminator'], ['Boil the kettle', 'process'], ['Pour the water onto the tea bag', 'process'], ['End', 'terminator'],
  ]),
  chart('drink', 'Test: a three-way question', [
    ['Start', 'terminator'],
    ['Which drink would they like?', 'decision', [['Tea', 3], ['Coffee', 4], ['Water', 5]]],
    ['Make the tea', 'process', undefined, 6],
    ['Make the coffee', 'process', undefined, 6],
    ['Pour a glass of water', 'process'],
    ['Serve the drink', 'process'],
    ['End', 'terminator'],
  ]),
  chart('five', 'Test: five answers', [
    ['Start', 'terminator'],
    ["What's the weather like?", 'decision', [['Sunny', 3], ['Cloudy', 4], ['Rain', 5], ['Snow', 6], ['Fog', 7]]],
    ['Play the summer jingle', 'process', undefined, 8],
    ['Read the forecast', 'process', undefined, 8],
    ['Warn about flooding', 'process', undefined, 8],
    ['Read the school closures', 'document', undefined, 8],
    ['Warn drivers', 'process'],
    ['Tell the listeners', 'io'],
    ['End', 'terminator'],
  ]),
  chart('rejoin', 'Test: two paths rejoining', [
    ['Start', 'terminator'],
    ['Receive sick call', 'io'],
    ['Is a backup available?', 'decision', [['Yes', 4], ['No', 5]]],
    ['Book the backup', 'process', undefined, 6],
    ['Ask another station for cover', 'process'],
    ['Send the updated rota', 'document'],
    ['End', 'terminator'],
  ]),
  chart('shapes', 'Test: every shape', [
    ['Start', 'terminator'],
    ['Receive the order', 'io'],
    ['Check the stock system', 'predefined'],
    ['Is it in stock?', 'decision', [['Yes', 5], ['No', 8]]],
    ['Print the invoice', 'document'],
    ['Wait for payment', 'delay'],
    ['A', 'connector', undefined, 9],
    ['Order more stock', 'process', undefined, 3],
    ['End', 'terminator'],
  ]),
  chart('unfinished', 'Test: unfinished answers and a stray row', [
    ['Start', 'terminator'],
    ['Is the studio free?', 'decision', [['Yes', 3], ['No', null]]],
    ['Book the studio', 'process'],
    ['End', 'terminator'],
    ['Find another room', 'process'],
  ]),
  chart('newsreaders', "Test: John's weekend newsreaders tree", [
    ['Start', 'terminator'],
    ['Which station is without a newsreader?', 'decision', [['Berkshire', 3], ['Oxford', 10], ['Solent', 17]]],
    ['What day is it?', 'decision', [['Saturday', 4], ['Sunday', 7]]],
    ['What time is it?', 'decision', [['0700-0900', 5], ['1000-1400', 6]]],
    ['Solent do live bulletins for Solent & Berkshire. No opting out required.', 'terminator'],
    ['Oxford do live bulletins for Oxford & Berkshire via Contribution', 'terminator'],
    ['What time is it?', 'decision', [['0700-0900', 8], ['1000-1300', 9]]],
    ['Oxford do live bulletins for Oxford & Berkshire. No opting out required.', 'terminator'],
    ['Oxford do live bulletins for Oxford & Berkshire via Contribution', 'terminator'],
    ['What day is it?', 'decision', [['Saturday', 11], ['Sunday', 14]]],
    ['What time is it?', 'decision', [['0700-0900', 12], ['1000-1400', 13]]],
    ['Solent do live bulletins for Solent & Oxford. No opting out required.', 'terminator'],
    ['Berkshire do live bulletins for Berkshire & Oxford. No opting out required.', 'terminator'],
    ['What time is it?', 'decision', [['0700-0900', 15], ['1000-1300', 16]]],
    ['Berkshire do live bulletins for Berkshire & Oxford via Contribution', 'terminator'],
    ['Berkshire do live bulletins for Berkshire & Oxford. No opting out required.', 'terminator'],
    ['What day is it?', 'decision', [['Saturday', 18], ['Sunday', 21]]],
    ['What time is it?', 'decision', [['0700-0900', 19], ['1000-1300', 20]]],
    ['Berkshire do live bulletins for Berkshire & Solent via Contribution', 'terminator'],
    ['Berkshire do live bulletins for Berkshire & Solent. No opting out required.', 'terminator'],
    ['What time is it?', 'decision', [['0700-0900', 22], ['1000-1300', 23]]],
    ['Oxford do live bulletins for Oxford & Solent. No opting out required.', 'terminator'],
    ['Berkshire do live bulletins for Berkshire & Solent. No opting out required.', 'terminator'],
  ]),
  (() => {
    // About 30 rows: nine segments, each prepared, written up and approved (or redone).
    const rows: Row[] = [['Start', 'terminator']];
    for (let k = 1; k <= 9; k++) {
      const first = rows.length + 1;
      rows.push([`Prepare segment ${k}`, 'process']);
      rows.push([`Write the cue sheet for segment ${k}`, 'document']);
      rows.push([`Is segment ${k} approved?`, 'decision', [['Yes', first + 3], ['No', first]]]);
    }
    rows.push(['Go live', 'io']);
    rows.push(['End', 'terminator']);
    return chart('long', 'Test: a long list (30 rows)', rows);
  })(),
];

// Fixed dates, so re-running this script doesn't change the file needlessly.
for (const c of charts) c.lastEditedAt = Date.UTC(2026, 9, 15);
const library = sanitiseLibrary({ charts: Object.fromEntries(charts.map((c) => [c.id, c])), chartOrder: charts.map((c) => c.id), openChartId: charts[0].id });
if (!library) throw new Error('test charts failed to validate');
writeFileSync(new URL('../design/test-charts.json', import.meta.url), exportJson(library, new Date(Date.UTC(2026, 9, 15))) + '\n');
console.log(`wrote design/test-charts.json: ${charts.length} charts, ${charts.reduce((n, c) => n + c.items.length, 0)} rows`);
