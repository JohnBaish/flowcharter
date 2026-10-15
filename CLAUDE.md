# Flowcharter — working notes

**Create a flowchart from a list.** A sister tool to Clockmaker and
Backtimer (repo `JohnBaish/clockwheel`), for `flowcharter.baish.net`.

Read these first, in this order:

1. `SPEC.md`: what Flowcharter is and does (agreed with John).
2. `PLAN.md`: the staged build. Work one stage at a time, on its branch.
3. `HOUSE-STYLE.md`: the shared look and ways of working. Copied from
   `JohnBaish/clockwheel` on 2026-10-15 (at clockwheel commit `f62a1b1`).
   Clockwheel holds the master copy. If it has changed since, re-copy it and
   note that here.

Key points from the house style, repeated because they matter most:

- John is not a developer. Explain plainly and briefly, say what he needs to
  do, and use British spelling. He decides wording.
- Agree before building anything significant. Show rendered previews of
  images and icons before wiring them in.
- Build on a branch and merge to `main` only when John says so.
- Check in a real browser at 1200px and at 390px with touch emulation, and
  say what couldn't be checked.
- Never rename the storage key (`flowcharter-state-v1`) once live.
- Add a dated entry below for every change.

## Layout

- `src/`: the app (Vite + React + TypeScript; no backend).
  - `data/`: `shapes.ts` (the eight types and fills), `charts.ts` (types from
    SPEC §7, the seed chart, `newChart()`).
  - `lib/chartOps.ts`: **all the list's rules** (type guessing, routes, delete,
    reorder) as plain functions. Change list behaviour here, not in the screens.
  - `lib/exchange.ts`: checking and repairing anything read from outside (the
    browser's saved copy, import files) and the export format.
  - `state/store.tsx`: app state, `localStorage` (`flowcharter-state-v1`), and
    thin wrappers over `chartOps`.
  - `screens/`, `components/`: Library, List and Chart screens, Nav, and
    `EditorHeader` (shared by List and Chart). `GuideScreen` is a placeholder
    until Stage 3. `components/FlowChart.tsx` draws a laid-out chart as SVG
    (colours written out, not CSS variables, so Stage 3 can save it as an
    image) plus the shape key.
  - `lib/shapes.ts`: each shape's outline, its size for its text, and where a
    line meets it (`outlineInset`). `lib/textWrap.ts`: measuring and wrapping
    text in the real font. `lib/layout.ts`: list → elkjs graph → positions
    (`layoutChart`), and Automatic's choice (`chooseDirection`).
  - `lib/`: also `icons.tsx`, `responsive.ts`, `useDragReorder.ts` (copied from
    clockwheel), `time.ts`, and `focus.ts` (focusing a row's box, plus
    `isTouch`/`selectAllSoon` from clockwheel's `timeInput.ts`).
  - `chartOps.leadsTo()` is the one rule for where an ordinary row flows; the
    Chart (Stage 2) must use it rather than re-deriving "next".
  - `styles/organic.css`, `global.css`: from clockwheel; `global.css` is trimmed
    of Clockmaker-only rules and has the List screen's styles added.
- `scripts/check-chart-ops.ts` and `scripts/check-layout.ts`: `npm run check`
  runs both (Node runs them directly; there is no test framework). The layout
  checks run every chart in `design/test-charts.json` both ways.
- `scripts/make-test-charts.ts` writes `design/test-charts.json`, a normal
  Flowcharter export of test charts (straight line, three and five answers,
  rejoining paths, every shape, unfinished answers, John's newsreaders tree,
  30 rows). Import it on the Library to look at them.
- `design/`: mock-ups and design sources, not app code. Open the HTML files
  from disk after `npm ci` (fonts load from `node_modules` by path).
  `previews/` holds their renders. `shapes.js` is the prototype shape
  geometry. `layout-spike.cjs` is the elkjs test (SPEC §5; needs `npm i elkjs`).
- Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run check`.
  `npm run lint` shows two `only-export-components` warnings (`icons.tsx`,
  `store.tsx`); clockwheel has the same ones, and they are harmless.

## Log

### 2026-10-15 — design agreed; spec, plan and previews (branch `spec-and-plan`)

**What:** Worked through the design with John (his answers are recorded in
SPEC.md). Wrote `SPEC.md`, `PLAN.md` and this file. Copied `HOUSE-STYLE.md`,
`organic.css`, `global.css` and `.gitignore` from clockwheel. Made previews
for John's approval: the eight shapes in their colours, and the List
(computer and phone) and Chart screens for the worked example.

**Decisions worth knowing:**

- The list uses "goes to" references, not nesting. A decision's answers are
  indented rows beneath it, each with an arrow label and a destination.
  Answers are drawn as labels on the arrows, not as boxes, per the
  conventions. Both were confirmed by John.
- Each type has its own pale fill. All eight were checked for ink contrast
  (≥10:1) and for being distinct from each other and from the cream page.
- Layout uses elkjs. A spike showed two required settings, model-order cycle
  breaking and ports on decisions (SPEC §5).

**Agreed later the same day:** the "then →" choice on ordinary rows (SPEC §4).

**Still to confirm with John:** the small Start/End-word addition to type guessing, and the footer and
library wording (SPEC §9). *(All confirmed later the same day; see the review entry below.)*

**Left alone:** no app code yet. Nothing in clockwheel was changed.

**Verified:** previews rendered in Chromium (Playwright) at 1200px and at
390px with touch emulation. Brand fonts were confirmed loaded, there was no
sideways scroll at 390px, and there were no script errors.

### 2026-10-15 — Stage 1: the app, Library and List (branch `stage-1-list`)

**What:** Scaffolded the app to match clockwheel (same dependency versions,
tsconfigs, `oxlint`), then built the Library screen, the List screen (a table on
a computer, cards on a phone), the nav and header, saving in the browser,
Export/Import, the footer notice and Vercel Analytics. Chart and Guide are
placeholders. `main` had `spec-and-plan` merged into it first, at John's say-so.

**Why these choices:** see "Details settled while building Stage 1" in SPEC §4
for the behaviours John hasn't been asked about yet. Beyond those:

- The list's rules live in `lib/chartOps.ts` as plain functions, so they can be
  checked without a browser and Stage 2 can't accidentally depend on screen code.
- Everything read from outside is repaired by `lib/exchange.ts` (unknown shapes
  dropped, routes to missing rows cleared), so a damaged save or a hand-edited
  import file can't crash the app.
- The answer rows of a decision are in the same `<tbody>` (computer) or card
  (phone) as the decision, so dragging the grip moves them together, and the drop
  target covers the whole block.

**Left alone:** the Chart and Guide screens, Print, Copy image, favicon, link
preview tags and the Vercel project (Stages 2–3). No favicon means the browser
asks for `/favicon.ico` and gets a 404. Nothing in clockwheel was changed. The
`design/` files are as they were.

**Verified:**

- `npm run build` is clean; `npm run lint` has only the two warnings above;
  `npm run check` passes (19 checks).
- Real browser (Playwright, Chromium) against the built app, at 1200px and at
  390px with touch emulation: first-visit contents; adding rows by button and by
  Enter; type guessing; Yes/No answers; route count 2–6; loops; "needs a
  destination"; deleting with and without the confirmation; reordering by mouse
  on both layouts; reload keeps the same rows; Duplicate; Delete; Export file
  name and contents; Import (replace with confirmation, a Clockmaker file, a
  non-JSON file); New chart focusing the name box; hamburger menu. No page
  errors, no sideways scroll at 390px, nothing sticking out of a card, every box
  and button 44px tall or more on the phone, all boxes 16px text there.
- The only failed request locally is `/_vercel/insights/script.js`, which Vercel
  itself serves, so it is expected until the site is on Vercel.

**Couldn't be checked:** a real iPhone (the keyboard opening on Add, Safari's
drop-down and scrolling behaviour); dragging a card by touch (only a mouse at
phone width was tried — `useDragReorder` is clockwheel's, unchanged); Vercel
itself (the build there, Analytics, the preview link).

### 2026-10-15 — John's verdict on the Stage 1 preview, and requests

John tried the Vercel preview on a computer and a phone: "looks really good on
the desktop and on the phone", with some tweaking possible later. The Vercel
project now exists and builds `stage-1-list` successfully. `main` still shows a
red production build because it has no app yet; it turns green when Stage 1 is
merged (not yet — waiting for John to say so).

**Requested, not yet built:** a **Clear** button on the List screen. Proposed
design, for John to confirm: it removes every row of the open chart (the name and
direction stay), after a `window.confirm` saying how many items will be lost; text
style button in `--color-neutral-700` in the header's action row (HOUSE-STYLE §5);
hidden or disabled when the list is already empty; also reachable on a phone.

### 2026-10-15 — Stage 1 review, the Clear button, and John's confirmations (branch `stage-1-list`)

**John confirmed:** the Start/End-word guessing rule, the footer and Library
wording (SPEC §9), and every item in "Details settled while building Stage 1"
(SPEC §4). SPEC.md no longer has anything marked "to confirm".

**Review (Opus), against SPEC, HOUSE-STYLE and clockwheel.** The code was in good
shape: the rules are in one place, everything read from outside is repaired, and
the screens match the approved mock-ups. Nothing found was a wrong design choice.
Fixed:

- **Routes box on iPhone (bug).** It kept only the *first* digit typed, and an
  iPhone doesn't reliably select the old number on tap (clockwheel's `timeInput.ts`
  exists for exactly this), so typing "3" into "2" could give "23" → "2" and be
  ignored. Now it keeps the digit just typed, and selects with clockwheel's
  `selectAllSoon`.
- **Stage 4 trap.** `sanitiseChart` runs on every page load and rebuilt each chart
  field by field, so `positions` (moving boxes by hand) would have been silently
  thrown away on every reload. It now keeps valid positions, with a comment that
  every new Chart field must be carried across there.
- **Stage 2 trap.** A damaged file could leave a decision with fewer than two
  answers; the sanitiser now tops it up to two, so the chart can rely on it.
- **One rule for "where does this row lead"** (`chartOps.leadsTo`), used by the
  List now and for the Chart in Stage 2, so they can't disagree.
- Small: Enter doesn't add a row while an input-method keyboard is still composing
  (accents, other alphabets); answer-label length is one constant (`MAX_LABEL`);
  a chart whose name was deleted shows as "Untitled" in the Library instead of an
  empty, unclickable title.

Looked at and left alone, deliberately: two browser tabs editing at once overwrite
each other's saves (Clockmaker behaves the same; rare for one person); the empty
table's column headings shift slightly when there are no rows (cosmetic).

**Added: Clear** (John's request, design confirmed by him). Grey text button after
"+ Add item" in the List header, as Backtimer's Clear. It asks first — "Clear all 8
items from "Backup newsreader"? This can't be undone." ("the 1 item" for one) —
then removes every row; the name and direction stay. Greyed out (and no hover
shading) when the list is already empty.

**Verified:** `npm run build` clean; `npm run lint` only the two known warnings;
`npm run check` 22 checks (new: `leadsTo`, decisions topped up to two answers,
positions kept). In Chromium at 1200px and at 390px with touch emulation: the whole
Stage 1 browser run again with no regressions; Clear (Cancel keeps rows, OK empties,
name kept, greyed out when empty, survives reload, singular wording, 44px tall on a
phone); the routes box selects on tap and accepts a new digit typed after an
unselected old one; "Untitled" in the Library. No page errors, no sideways scroll.

**Couldn't be checked:** a real iPhone — the routes-box fix is aimed at real iPhone
behaviour that touch emulation in Chromium doesn't reproduce exactly, so it's worth
John trying it on his phone in the next preview.

### 2026-10-15 — Stage 1 merged; Stage 2: the chart (branch `stage-2-chart`)

**Merged:** `stage-1-list` into `main` at John's say-so; Vercel's production build
went green.

**What (Stage 2):** the Chart screen draws the open chart from its list —
shapes in their colours, right-angled lines with arrowheads, answers written on
their lines on cream pills, loops, the open circle for an unfinished answer,
stray rows as their own island, the Automatic / Down / Across switch (saved with
each chart), and a key of the shape types used. Built on elkjs (lazy-loaded,
its own ~440 KB file) with the settings proven in the spike.

**Why these choices** (SPEC §5 "Details settled while building Stage 2" has the
behaviour; these are the mechanics):

- Every shape has fixed connection points ("ports"): in on the near side, out
  on the far side, loops on their own side. Decisions place theirs exactly
  (`placeOnDiamond`): elkjs otherwise ignores port spacing when the order is
  fixed, and bunched five answers at the bottom tip.
- elkjs routes to the shape's *box*; each line's ends are then extended along
  their last straight stretch onto the real outline (`outlineInset`), so arrows
  touch the diamond's slope, the document's wave, the Start/End's curve.
- elkjs puts labels beside lines; they're moved onto the nearest stretch of
  their own line (`onLine`), kept clear of its ends.
- The document shape's wave is one sine formula used for both drawing and
  outline-meeting, so they can't disagree.
- Both directions are laid out on every change (a few ms each), so Automatic
  can compare which needs less shrinking for the space available.

**Left alone:** Print, Copy image, the Guide, favicon and link preview (Stage 3).
Moving boxes by hand (Stage 4). In a chart forced Across, elkjs sometimes routes
a loop the long way round or crosses one line over another; Automatic picks Down
for those, and Stage 4 will give John the last word. No change to the List or
Library apart from `EditorHeader` gaining a Chart mode.

**Verified:** `npm run build` clean (the one size warning for elkjs's own file is
silenced in `vite.config.ts` with a comment); `npm run lint` only the two known
warnings; `npm run check` 22 + 10 layout checks (every line of every test chart
starts and ends on a shape's outline, right angles only, labels on their lines,
answers in list order, loops not turning the chart upside down, five answers
on the diamond's outline). In Chromium: all nine test charts drawn at 1200px in
Automatic, Down and Across, and at 390px with touch — no errors, no sideways page
scroll; direction remembered after reload; List edits appear on the Chart;
the layout library isn't fetched until the Chart opens; empty-chart message;
44px buttons and ~10.5px chart text on the phone. The earlier Stage 1 browser
checks still pass (one old check expected the Chart placeholder, now gone).

**Couldn't be checked:** a real iPhone or Safari (fonts, the sideways-scrolling
frame); very long single words in boxes beyond the test charts; performance on
a slow phone with a very large chart (the 30-row chart lays out instantly here).
