# Flowcharter — specification

**Create a flowchart from a list.** A free-to-use personal project by John
Baish, at `flowcharter.baish.net`.

This file is the agreed design. `PLAN.md` says what gets built in what
order. `HOUSE-STYLE.md` (copied from `JohnBaish/clockwheel`, which holds the
master copy) covers everything shared with Clockmaker and Backtimer: colours,
type, buttons, phone rules, privacy wording, hosting and ways of working.
Where this file is silent, follow the house style; where they disagree, ask
John.

Agreed with John on 2026-10-15. Anything marked **(to confirm)** still
needs his yes.

---

## 1. What it does

You type a list of steps, row by row, as in Clockmaker's List screen. For
each row you say what sort of step it is (the **type**, which sets its shape)
and, for questions, how many answers it has. Flowcharter draws the
flowchart automatically, following the conventions in John's guide
*Flowchart Symbols: A Simple Guide*
(<https://claude.ai/code/artifact/1726997c-ec81-4633-8a89-26d4c04aff6e>).

Intended for describing fairly simple processes. Most charts will be a few
to a couple of dozen steps with the odd question and loop. Big decision
trees (like John's weekend-newsreader chart) must work, but needn't be
the thing the design is optimised for.

## 2. Screens

Nav bar, as Clockmaker: brand **Flowcharter** on the left; **New chart**
(primary button); links **Library · List · Chart · Guide**; "saved …" tag.
Hamburger at ≤720px.

| Screen | What's on it |
|---|---|
| **Library** | All saved charts as cards (name, number of items, last edited). Open, Duplicate, Delete (with `window.confirm`). **Import** / **Export** of the whole library. The footer notice (§9). |
| **List** | The open chart's rows (§4). Header: kicker "Flowchart", the chart name (edit in place), a tag "8 items · 2 decisions", actions **+ Add item** (ghost), **Duplicate**, **Done** (→ Library). |
| **Chart** | The drawn flowchart (§5). Same header, with actions **Print** (ghost), **Duplicate**, **Copy image**, **Done**. A **Direction** switch: Automatic · Down · Across. A key underneath showing only the shape types this chart uses. |
| **Guide** | What Flowcharter is, how to fill in the list, the full key of shapes with their meanings, and tips for a clear chart, taken from John's guide. |

List and Chart are two views of the same chart, as List and Clock are in
Clockmaker. Mock-ups: `design/mock-list.html`, `design/mock-chart.html`
(rendered in `design/previews/`).

## 3. Shape types

Eight types: the four core shapes from the guide plus four extras John chose.
(The fifth core symbol, the arrow, is drawn automatically.)

| Type (as shown in the list) | Shape | Fill |
|---|---|---|
| Start / End | Rectangle with fully rounded ends | `#d8e6bd` sage |
| Process | Plain rectangle | `#d2def2` pale blue |
| Decision | Diamond | `#f4dd8e` butter |
| Input / Output | Parallelogram | `#e4d3f0` lavender |
| Predefined process | Rectangle with a double line down each side | `#bfe3e1` pale teal |
| Document | Rectangle with a wavy bottom edge | `#f3cfd6` pale rose |
| Delay | "D" shape: flat left, rounded right | `#f7cba9` peach |
| Connector | Small circle (holds a letter or number) | `#d4c9b6` stone |

- Every shape has a 1.5px ink (`#201e1d`) outline and ink text, so the chart
  still reads printed in black and white, as the guide advises ("don't rely on
  colour alone").
- The fills were checked on 2026-10-15. Ink text has at least 10:1 contrast
  on each one, and every fill is clearly distinct from the cream page and from
  the others. Don't change one without re-checking.
- Geometry is prototyped in `design/shapes.js`; preview in
  `design/previews/shapes.png`.
- Connectors: in this version a Connector is just a shape you can choose. The
  tool does not yet replace long lines with connector pairs on its own.

## 4. The list

### Columns

| Column | What it holds |
|---|---|
| (grip) | Drag to reorder (copy `useDragReorder.ts`). A decision's answer rows move with it. |
| **#** | Item number, 1, 2, 3…, for reference within the list only. **Never drawn on the chart.** Recalculated whenever rows move. |
| **Item** | The text drawn inside the shape. Edit in place (`.plain-input`). Up to 80 characters. |
| **Type** | Dropdown of the eight types, with a small colour swatch of that type's fill beside it. |
| **Routes** | For a **Decision**: a number box, how many answers (2–6, default 2). For anything else: **then →** a dropdown, **next** (default), any item by number, or **ends here**. |
| (bin) | Delete the row. |

### Answer rows (a decision's routes)

When a row is a Decision, one indented **answer row** per route appears
directly beneath it, numbered `3a`, `3b`… Each answer row has:

- **Answer**: the text written on that arrow. With two routes the defaults are
  **Yes** and **No**. With three or more they start blank.
- **goes to**: a dropdown of every item, shown as "4 · Book the backup". An
  item at or above the decision gets a small **loops back** tag.

Defaults: the first answer goes to the next item. The others start as
**Choose…**, and the list and chart both show that they still need a
destination (§5, "Unfinished routes"). Changing the number of routes adds
blank answer rows at the bottom or removes them from the bottom. Changing a
row's type away from Decision hides its answer rows without deleting them,
so changing it back restores them.

### How rows connect

- **Only decisions branch** (agreed). Every other row has exactly one way
  out, or none.
- An ordinary row leads to the **next** row unless its **then →** says
  otherwise. **(to confirm)** This "then →" choice was added while drafting,
  and John hasn't agreed it yet. It's needed so that a path can rejoin the main
  flow further down, or skip the rows that belong to another answer. Without
  it, in the example below, "Book the backup" could only ever lead into
  whatever row happens to come next.
- A **Start / End** row is a start if it's row 1 and leads on to the next
  row. Anywhere else it defaults to **ends here**.
- The last row defaults to **ends here**.
- References are stored by item id, never by number. Inserting, deleting or
  reordering rows renumbers everything, and every **goes to** and **then →**
  still points at the same item.
- Deleting a row that other routes point to: `window.confirm` saying how many
  routes go to it. Those routes then go back to **Choose…**.

### Type guessing

As you type, the type is guessed until you pick one yourself for that row.
After that it's never changed for you.

1. Row 1 → **Start / End**.
2. The text is just "Start", "End", "Finish" or "Stop" (any capitals, ignoring a
   final full stop) → **Start / End**. (A small addition to the agreed rule.)
3. The text ends with "?" → **Decision** (with 2 routes, Yes/No).
4. Otherwise → **Process**.

### Keyboard and phones

Follow Clockmaker's List screen and HOUSE-STYLE §6.

- Enter in an item box adds a row beneath it and focuses its text box.
- Up/Down arrows move between rows.
- On phones: one card per row (`.list-cards`), with the answer rows inside the
  decision's card, and a full-width **+ Add item** under the list. Add-and-focus
  uses `flushSync` so the keyboard opens. The Routes box uses
  `inputMode="numeric"`. Every box is 16px text, and tap targets are at least
  44px.

### The worked example

Used for the seed chart (§7) and the mock-ups:

| # | Item | Type | Routes |
|---|---|---|---|
| 1 | Start | Start / End | then → next |
| 2 | Receive sick call | Input / Output | then → next |
| 3 | Is a backup available? | Decision | 2 |
| ↳ 3a | *Yes* | | goes to 4 |
| ↳ 3b | *No* | | goes to 6 |
| 4 | Book the backup | Process | then → next |
| 5 | End | Start / End | ends here |
| 6 | Ask the next station for cover | Process | then → next |
| 7 | Has cover been agreed? | Decision | 2 |
| ↳ 7a | *Yes* | | goes to 8 |
| ↳ 7b | *No* | | goes to 6 (loops back) |
| 8 | End | Start / End | ends here |

## 5. The chart

### Layout

- Drawn as SVG in the app's own component, in the same way Clockmaker draws its
  clock face. Positions come from **elkjs** (Eclipse Layout Kernel), using its
  "layered" algorithm with orthogonal (right-angled) lines. Checked
  2026-10-15: version 0.12.0, about 470 KB compressed. **Load it only when the
  Chart screen opens** (dynamic `import()`), so the List screen stays quick.
  Licence EPL-2.0, which is fine for using it unchanged.
- **Tested on the worked example** (`design/layout-spike.cjs`). Two settings
  matter:
  - **Model-order cycle breaking**, so loops keep the list's order. Without it
    the chart was drawn with step 7 above step 6.
  - **Ports** on each decision (one way in, one per answer, centred on its
    sides), so lines leave from the diamond's points.
- Lines must end on each shape's actual outline (the slanted side of a
  parallelogram, the curve of a Start/End) rather than its surrounding box.
- Answers are drawn **on their arrows**, in Figtree 700 12.5px on a small cream
  pill so the line doesn't run through the words. They are never drawn as
  boxes.
- Text inside shapes is Figtree 400 14px, wrapped to fit: about 200px wide for
  boxes. For diamonds the text is narrower and the diamond is sized so the
  text block fits inside it.

### Direction

- **Automatic** (the default for a new chart) lays the chart out both ways and
  picks the one that better fits the space available. A short line says which
  it chose ("Automatic is showing it top to bottom, which fits this chart
  best.").
- **Down** and **Across** force the direction.
- The choice is saved with each chart.

### Unfinished routes

An answer still on **Choose…** is drawn as a short arrow ending in a small
open circle, with its label. Nothing is hidden just because it isn't
finished. A row that nothing leads to (other than row 1) still appears, as
its own little island.

### Moving boxes by hand (Stage 4, later)

Drag a box to move it. Its lines re-route, and the position is remembered for
that chart. A **Tidy up** button returns to the automatic layout. Not in the
first version, by agreement.

### Phones

At ≤720px the chart is shown at a readable size inside a frame that scrolls
both ways. The page itself never scrolls sideways. Automatic will usually pick
Down on a phone, because the screen is tall and narrow.

## 6. Print and image

- **Print** (Chart screen): the chart scaled to fit one A4 page, with the chart
  name at the top and the key underneath. Use landscape for Across and portrait
  for Down. The nav and buttons are hidden (`data-noprint`). The List screen
  prints as a plain table too, as Clockmaker's does.
- **Copy image**: a PNG at 2× resolution with a cream background, the name and
  the key. It goes to the clipboard and falls back to a download, using
  Clockmaker's `deliver()` pattern in `exportImage.ts`. **Embed Figtree in the
  SVG** as a data-URL `@font-face` before turning it into a picture. An SVG
  drawn as an image can't use the page's fonts and would otherwise fall back
  to a system font.
- No share links (agreed: everything lives in the browser).

## 7. Saving, library, import/export

- No accounts, no backend. Everything is saved automatically in the browser
  (`localStorage`) under the key **`flowcharter-state-v1`**. Once live,
  **never rename this key**.
- First visit: the library contains one chart, the worked example (§4),
  named "Backup newsreader", so there's something to look at.
- **Export** saves the whole library as
  `flowcharter-library-YYYY-MM-DD.json` (local date) containing
  `{ app: 'flowcharter', version: 1, exportedAt, state }`. **Import** reads such
  a file back, with a friendly error if it isn't one. Follow Clockmaker's
  `exportState` / `importState`.
- Vercel Web Analytics (`<Analytics />`) as on the other sites.

### Data shape (for the build)

```ts
type ShapeType = 'terminator' | 'process' | 'decision' | 'io'
  | 'predefined' | 'document' | 'delay' | 'connector';

type ItemId = string;
type Next = { kind: 'next' } | { kind: 'item'; to: ItemId } | { kind: 'end' };

interface Route { id: string; label: string; to: ItemId | null }  // null = "Choose…"

interface Item {
  id: ItemId;
  text: string;
  type: ShapeType;
  typeChosen: boolean;   // false while the type is still being guessed
  then: Next;            // used when type !== 'decision'
  routes: Route[];       // used when type === 'decision'; kept if type changes
}

interface Chart {
  id: string;
  name: string;
  items: Item[];                       // list order = item numbers
  direction: 'auto' | 'down' | 'across';
  positions?: Record<ItemId, { x: number; y: number }>;  // Stage 4
  lastEditedAt: number;
}

interface State { charts: Record<string, Chart>; chartOrder: string[]; openChartId: string | null; screen: Screen }
```

## 8. Look and feel

All from HOUSE-STYLE: cream/terracotta tokens, Caprasimo headings, Figtree
body, Lucide icons at stroke 2.75, a 1100px content column, `.table` on a
computer and `.list-cards` on a phone. Light theme only.

## 9. Words (drafts for John to edit)

- Page title / `og:title`: **Flowcharter**.
- Tagline / `og:description`: **Create a flowchart from a list** (agreed).
- Footer notice on the Library screen: "Flowcharter is a free-to-use personal
  project by John Baish. The flowcharts you make here are not collected;
  they're only saved in your browser. We collect anonymous visit statistics
  (no cookies, no personal data) to see how the site is used. Contact:
  flowcharter@baish.net" **(to confirm wording)**
- Library note (as Clockmaker): "Your flowcharts are saved automatically, but
  only in this browser, on this device. Use Export to keep a backup or move
  them to another device." **(to confirm wording)**
- The Guide screen text: drafted in Stage 3 for John to edit.

## 10. Hosting and launch

- Repo `JohnBaish/flowcharter` → its own Vercel project, deploying `main`.
  Branch previews at `https://flowcharter-git-<branch>-john-baish.vercel.app`.
  John creates the Vercel project when Stage 1's first branch is pushed;
  Claude gives him step-by-step instructions at that point.
- Domain `flowcharter.baish.net`, added by John in Vercel and DNS at launch.
- At launch: favicon (48×48 SVG on the house recipe, preview first), a
  link-preview image from clockwheel's `design/og-clockmaker.html` template,
  `og:`/`twitter:` tags, and a card on the baish.net landing page. The landing
  page lives in the clockwheel repo, so that's a small separate change there.

## 11. Not in this version

Swimlanes (not now, possibly never). Share links. Automatic connector pairs
for long lines. Dark mode. The step-by-step card walkthrough (possibly
later). Moving boxes by hand comes in Stage 4.
