# Flowcharter — specification

**Create a flowchart from a list.** A free-to-use personal project by John
Baish, at `flowcharter.baish.net`.

This file is the agreed design. `PLAN.md` says what gets built in what
order. `HOUSE-STYLE.md` (copied from `JohnBaish/clockwheel`, which holds the
master copy) covers everything shared with Clockmaker and Backtimer: colours,
type, buttons, phone rules, privacy wording, hosting and ways of working.
Where this file is silent, follow the house style; where they disagree, ask
John.

Agreed with John on 2026-10-15. Everything in this file has his yes (the last
open points were confirmed later that day).

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
(primary button); links **Library · Guide** (List and Chart are reached from an open chart's own List | Chart switch, not the nav — John, 2026-10-15); "saved …" tag.
On a phone the links stay in the bar and the "saved …" tag is hidden (no menu button, 2026-10-17).

**The browser's Back (phone back gesture), agreed 2026-10-17:** opening a chart
adds one step to the browser's history, however you then move between List,
Chart and the cards, so Back from a chart returns to the Library and Back again
leaves the site. Peek and Full screen each add one step while open, so Back
closes them. Closing anything another way takes its step back off, so steps
never pile up. The web address never changes. (A "leave site?" warning was
considered and rejected: phones mostly don't show it, and its fixed wording
about unsaved changes would be untrue, since everything is saved.)

| Screen | What's on it |
|---|---|
| **Library** | All saved charts as cards (name, number of items, last edited). Open, Duplicate, Delete (with `window.confirm`). **Import** / **Export** of the whole library. The footer notice (§9). |
| **List** | The open chart's rows (§4). Header: on the left the kicker "Flowchart", the chart name (edit in place) and a tag "8 items · 2 questions" beneath it; centred, a **List \| Chart** switch (the only way between the two); on the right, in one line as in Backtimer, **Print** (ghost), **+ Add item** (ghost), **Clear** (ghost, grey). No Duplicate (it's on the Library's cards) and no Done (the nav's Library link does that). |
| **Chart** | The drawn flowchart (§5). Same header, with actions **Print** (ghost) and **Copy image**. A **Direction** switch: Automatic · Down · Across. A key underneath showing only the shape types this chart uses. |
| **Guide** | What Flowcharter is, how to fill in the list, the full key of shapes with their meanings, and tips for a clear chart, taken from John's guide. |

List and Chart are two views of the same chart, as List and Clock are in
Clockmaker. Mock-ups: `design/mock-list.html`, `design/mock-chart.html`
(rendered in `design/previews/`).

## 3. Shape types

Seven types: the four core shapes from the guide plus three extras John chose.
On 2026-10-16 John renamed four (Process → Action, Decision → Question,
Input / Output → Data in/out, Predefined process → Standard routine) and removed
Connector. The saved ids (`process`, `decision`, `io`, `predefined`) are unchanged;
a saved Connector loads as an Action.
(The fifth core symbol, the arrow, is drawn automatically.)

| Type (as shown in the list) | Shape | Fill |
|---|---|---|
| Start / End | Rectangle with fully rounded ends | `#d8e6bd` sage |
| Action | Plain rectangle | `#d2def2` pale blue |
| Question | Diamond | `#f4dd8e` butter |
| Data in/out | Parallelogram | `#e4d3f0` lavender |
| Standard routine | Rectangle with a double line down each side | `#bfe3e1` pale teal |
| Document | Rectangle with a wavy bottom edge | `#f3cfd6` pale rose |
| Delay | "D" shape: flat left, rounded right | `#f7cba9` peach |

- Every shape has a 1.5px ink (`#201e1d`) outline and ink text, so the chart
  still reads printed in black and white, as the guide advises ("don't rely on
  colour alone").
- The fills were checked on 2026-10-15. Ink text has at least 10:1 contrast
  on each one, and every fill is clearly distinct from the cream page and from
  the others. Don't change one without re-checking.
- Geometry is prototyped in `design/shapes.js`; preview in
  `design/previews/shapes.png`.
- Connector was removed (2026-10-16): Flowcharter routes every line itself, so
  it never needs one.

## 4. The list

### Columns

| Column | What it holds |
|---|---|
| (grip) | Drag to reorder (copy `useDragReorder.ts`). A decision's answer rows move with it. |
| **#** | Item number, 1, 2, 3…, for reference within the list only. **Never drawn on the chart.** Recalculated whenever rows move. |
| **Item** | The text drawn inside the shape. Edit in place (`.plain-input`). Up to 80 characters. |
| **Type** | Dropdown of the eight types, with a small colour swatch of that type's fill beside it. |
| **Routes** | For a **Question**: a number box, how many answers (2–6, default 2). For anything else: **then →** a dropdown, **next** (default), any item by number, or **ends here**. |
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
  otherwise. (Added while drafting; agreed by John 2026-10-15.) It's needed so that a path can rejoin the main
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
   final full stop) → **Start / End**. (Added while building; confirmed by John.)
3. The text ends with "?" → **Question** (with 2 routes, Yes/No).
4. Otherwise → **Action**.

### Keyboard and phones

Follow Clockmaker's List screen and HOUSE-STYLE §6.

- Enter in an item box adds a row beneath it and focuses its text box.
- Up/Down arrows move between rows.
- On phones: one card per row (`.list-cards`), with the answer rows inside the
  decision's card, and a full-width **+ Add item** under the list. Add-and-focus
  uses `flushSync` so the keyboard opens. The Routes box uses
  `inputMode="numeric"`. Every box is 16px text, and tap targets are at least
  44px.

### Details settled while building Stage 1 (2026-10-15)

Small behaviours the spec above didn't spell out. All confirmed by John on
2026-10-15.

- **A new chart starts with no rows**, and its name box is ready to type over.
  "+ Add item" (or Enter in a box) adds rows.
- **Adding a row straight after a question** fills in that question's first
  answer (if it still says "Choose…") to point at the new row, which is what
  typing a list from the top wants.
- **The last row's "then" shows as "ends here"** (nothing follows it). Add a row
  after it and it leads on to that row again.
- **The "loops back" tag also appears on a "then" that points at an earlier row**,
  not only on a decision's answers.
- **A row nothing leads to gets a "nothing leads here" tag** (e.g. a row added
  after an End), since the Chart draws it on its own. Row 1 never gets it. The
  tag is on screen only, not printed. (Added 2026-10-17, fresh look 4.1.)
- **Types are guessed only when a row is created or its text is edited.** Moving
  or deleting rows never changes a row's type.
- **Changing a row's type** resets its "then" to the new type's default (Start/End
  on row 2 or later ends here; anything else leads on), unless it was pointed at a
  specific item.
- **Deleting a row** that other routes lead to asks first; those routes go back
  to "Choose…" (answers) or to the row's default (then). Hidden answers pointing
  at it are cleared quietly.
- **Import replaces the whole library**, so it asks first if there's anything in
  the library to lose. (Clockmaker's doesn't.)
- **First visit lands on the Guide, with an empty Library**, as Clockmaker does
  (changed at John's request, 2026-10-15; it first landed on the Library with the
  example chart in it).
- **On a phone, an ordinary row's "then" box gets its own line** under the type
  box; the two can't share a 390px-wide line. A decision keeps its route-count box
  beside the type box, as in the mock-up.
- **Every button is at least 44px tall on a phone**, including the nav's.
- **Each Library card shows a thin colour strip** of the shape types in that chart.
- **Clear** (added at John's request after Stage 1): removes every row of the open
  chart; the name and settings stay. It asks first ("Clear all eight items from
  'Backup newsreader'? This can't be undone."; "the only item" for one) and is greyed out when the list is
  already empty. A grey text button in the header, as in Clockmaker's Backtimer.
- **A chart whose name has been deleted** shows as "Untitled" in the Library.

### The worked example

Used for the seed chart (§7) and the mock-ups:

| # | Item | Type | Routes |
|---|---|---|---|
| 1 | Start | Start / End | then → next |
| 2 | Receive sick call | Data in/out | then → next |
| 3 | Is a backup available? | Question | 2 |
| ↳ 3a | *Yes* | | goes to 4 |
| ↳ 3b | *No* | | goes to 6 |
| 4 | Book the backup | Action | then → next |
| 5 | End | Start / End | ends here |
| 6 | Ask the next station for cover | Action | then → next |
| 7 | Has cover been agreed? | Question | 2 |
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
  boxes. Each sits on the first stretch of its arrow, where it leaves the
  question, so question and answer read together; if that stretch is too short
  (shorter than the label plus 12px either side) it goes on the next stretch
  that's long enough (John, 2026-10-15).
- Text inside shapes is Figtree 400 14px, wrapped to fit: about 200px wide for
  boxes. For diamonds the text is narrower and the diamond is sized so the
  text block fits inside it.

### Details settled while building Stage 2 (2026-10-15)

Not yet seen by John; easy to change.

- **Which tips a decision's answers leave from**, so they read in list order:
  two answers — the first carries straight on (down, or right), the second
  goes to the side (right, or down), as in the approved mock-up; three — left,
  bottom, right in list order (top, right, bottom when across); four to six —
  first and last from the side tips, the rest spread along the forward edges.
- **Paths that rejoin** meet at the middle of the shape they lead into, so
  several arrows merge into one, as is usual on flowcharts.
- **A loop** (an arrow back to an earlier row) arrives on the right-hand side
  of its shape when the chart runs down, and on the bottom when it runs across
  — the same side a question's second answer leaves from — so it goes round
  the outside rather than crossing other lines. (Changed after John spotted a
  crossing in the Across view; the test charts now have no crossings either way.)
- **Size:** shown at full size if it fits the width, otherwise shrunk to fit,
  but never below 60% (75% on a phone, about 10.5px text). On a phone, a chart
  that would fit completely at 65% or more is shrunk to fit rather than scroll a
  few boxes out of sight. A chart still too wide scrolls sideways inside its
  frame; the page scrolls up and down as usual.
- The layout library loads only when a chart is first drawn, so the List and
  Library stay quick.

### "+ New step" (Stage 4, agreed with John 2026-10-16)

Each answer's "goes to" box offers **+ New step** under "Choose…". It adds a
blank row at the bottom of the list, points the answer at it and puts the
cursor in it. The row that was last keeps ending where it did. The row added
straight after a question still becomes its first answer's destination.

### Details settled while building Stage 3 (2026-10-15)

Confirmed by John on 2026-10-15.

- **Print is on the List screen too** (Clockmaker's is on every screen that can
  print). The List prints on portrait A4 as a plain table: the item wording and
  answers as ordinary wrapping text, no boxes or drop-down arrows, the chart's
  name at the top, and the column headings repeated on later pages.
- **The Chart prints on one page:** portrait for Down, landscape for Across
  (whichever way Automatic chose, if Automatic). A big chart, such as the
  23-row newsreaders tree, is shrunk until it fits and so prints small — that
  is "fit one A4 page" working as agreed, not a bug. The answer labels print on
  white rather than cream, to match the paper.
- **Copy image** makes the picture at full chart size (not the screen's shrunk
  size) at 2× resolution, or less for an enormous chart, because browsers can't
  make canvases beyond about 14 million pixels; it says "Copied!", or
  "Downloaded" when the browser won't take images on the clipboard (the file is
  named after the chart, e.g. `backup-newsreader.png`), or "Couldn't copy".
  The key wraps onto several lines if it has to.
- **The Guide** is a first draft for John to edit: what it does, six steps, the
  shape key with samples, tips (from John's symbols guide, trimmed to what
  suits Flowcharter), and where flowcharts are kept (using the approved wording).

### Direction

- **Automatic** (the default for a new chart) lays the chart out both ways and
  picks the one that better fits the space available. Its button says which
  it picks — "Automatic · Down" or "Automatic · Across".
- The only other button is the opposite direction ("Down" or "Across"), which
  forces it. Forcing the direction Automatic already picks would look the same,
  so it isn't offered (John, 2026-10-15). A chart saved with that direction
  forced shows as Automatic.
- The choice is saved with each chart.

### Unfinished routes

An answer still on **Choose…** is drawn as a short arrow ending in a small
open circle, with its label. Nothing is hidden just because it isn't
finished. A row that nothing leads to (other than row 1) still appears, as
its own little island.

### Changing words on the Chart (agreed with John 2026-10-20)

- Clicking (or tapping) a box or an answer on a line changes its **words only**:
  the shape never changes, even if the List would guess a different one from
  the new words. Open circles can't be changed (there's nothing to change).
- A line beside **Direction** says so: "Click a box to change its words." (a
  touch screen says "Tap").
- **On a computer:** a box is outlined in orange on hover; clicking turns the
  box itself into the place to type, words selected, with "Enter to save · Esc
  to cancel" beside it. Enter or clicking elsewhere saves; Esc cancels. The
  keyboard works too (Tab to a box, Enter).
- **On a phone** (≤720px): tapping outlines the box and opens a panel at the
  top of the screen, "Change the words", with the words in a box, **Cancel**
  and **Save**, so the keyboard doesn't cover it.
- Left empty, the old words stay. The List's limits apply (80 characters for a
  step, 40 for an answer). Saved straight away, as in the List; the chart
  redraws, so boxes may shift a little.
- Not in Full screen (it's for looking), not on the chart beside the cards, and
  never in print or Copy image.

### Moving boxes by hand (parked idea, not planned)

Drag a box to move it. Its lines re-route, and the position is remembered for
that chart. A **Tidy up** button returns to the automatic layout. Not in the
first version, by agreement; on 2026-10-15 John parked it as an idea that may
be revisited (PLAN.md).

### Phones

At ≤720px the chart is shown at a readable size; a wide chart scrolls sideways
inside its frame, and the page scrolls up and down as usual. The page itself
never scrolls sideways. Automatic will usually pick
Down on a phone, because the screen is tall and narrow.

## 6. Print and image

- **Print** (Chart screen — and the List, below): the chart scaled to fit one A4 page, with the chart
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
- First visit: the library is empty and the Guide is shown. (The worked example,
  "Backup newsreader", still exists in code as `seedChart()` for the checks and
  the test charts, but is no longer added for new visitors.)
- **Export** saves the whole library as
  `flowcharter-library-YYYY-MM-DD-HHMM.json` (local date and time, as Clockmaker does) containing
  `{ app: 'flowcharter', version: 1, exportedAt, state }`. **Import** reads such
  a file back, with a friendly error if it isn't one. Follow Clockmaker's
  `exportState` / `importState`.
- Vercel Web Analytics (`<Analytics />`) as on the other sites.

### Data shape (for the build)

```ts
type ShapeType = 'terminator' | 'process' | 'decision' | 'io'
  | 'predefined' | 'document' | 'delay';

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
  workshop@baish.net" (confirmed by John)
- Library note (as Clockmaker): "Your flowcharts are saved automatically, but
  only in this browser, on this device. Use Export to keep a backup or move
  them to another device." (confirmed by John)
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

## 10b. Step by step (Stage 5, agreed with John 2026-10-16)

A third way of working on the open chart, beside the List and the Chart: a
series of cards in conversational English (mock-ups: `design/mock-cards.html`).

- **New chart** always opens a card: "How would you like to make it?" — **Step
  by step** or **Start with a blank list**. The List's header also has a **Step
  by step** button, so you can switch back to the cards whenever the chart has
  something unfinished (it's hidden on a finished chart).
- The cards ask the chart's name, add Start, then ask "What happens first?" /
  "After *X*, what happens next?" with plain-English choices: **Something gets
  done** (Action), **We ask a question** (Question), **Information comes in or
  goes out** (Data in/out), **That's the end** (asks "How does this path end?" with "End" filled in and selected, so Next keeps it and typing gives the ending a name, e.g. "Cover arranged"; left blank it's "End"; Start is still added as "Start"); under **More**: **We
  wait** (Delay), **A document is made or used** (Document), **We follow a
  standard routine** (Standard routine), **It goes back to an earlier step**
  (pick a step: loops and rejoining paths; not offered on the very first step,
  where there's nothing earlier). Each kind then gets its own prompt and
  example.
- A question gets an answers card (Yes / No filled in, up to six). The cards
  follow the first answer's path to its end, then come back: "Now back to *Q*.
  If the answer is *No*, what happens next?" ("That's the *Yes* path finished.")
- Every answer writes a real row into the List straight away (new rows at the
  bottom, as "+ New step"). Switching to the cards picks up at the first loose
  end: an answer with no destination, else a last step that leads nowhere;
  if there are none, "That's every path covered."
- **Back undoes** (John, 2026-10-20; this replaced "Back revisits, it never
  deletes" from 2026-10-16, because going back and then jumping forward proved
  too complex for users). Each Back returns to the previous card and takes away
  what that card added, so the chart un-draws one step at a time. Going forward
  again means answering the cards again.
- The card Back returns to offers what was there before: a text card has its
  words in the box; an answers card has its answers; a kind card outlines the
  choice made and says "You chose *Something gets done* here: *Pay the
  deposit*. Choose it again to carry on with those words, or choose something
  different." (agreed wording; "You chose *It goes back to an earlier step*
  here. Choose it again, or choose something different." for a loop). The words
  also come back for a different kind of step, except to or from an ending
  (an ending's words don't suit another step).
- What's still being written is drawn **dashed** beside the card (and in Peek):
  the step on a text card, and a question's answer lines on the answers card.
  Next saves it and it's drawn solid.
- Back only undoes what was done on the cards this time: coming to the cards
  from the List, the first card has no Back.
- On a phone, **Back** and the card's main button share the first line of the
  card's foot; **Peek at the chart** and **Switch to building in List mode**
  sit beneath.
- Pressing **New chart** and leaving without doing anything (still called "New
  chart", no rows) doesn't leave an empty card in the Library: such a chart is
  removed when you go to another screen or chart.
- Every card has **Switch to building in List mode**. On a computer the chart
  so far is drawn beside the card; on a phone, **Peek at the chart** shows it.

## 11. Not in this version

Swimlanes (not now, possibly never). Share links. Automatic connector pairs
for long lines. Dark mode. The step-by-step cards are §10b. Moving boxes by hand is parked.
