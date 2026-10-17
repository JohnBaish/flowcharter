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
  - `screens/`, `components/`: Library, List, Chart and Steps (the step-by-step
    cards, Stage 5; `components/LiveChart.tsx` draws the chart beside them) screens, Nav, and
    `EditorHeader` (shared by List and Chart). `GuideScreen` holds John's
    editable Guide text. `components/FlowChart.tsx` draws a laid-out chart as SVG
    (colours written out, not CSS variables, so Stage 3 can save it as an
    image) plus the shape key.
  - `lib/shapes.ts`: each shape's outline, its size for its text, and where a
    line meets it (`outlineInset`). `lib/textWrap.ts`: measuring and wrapping
    text in the real font. `lib/layout.ts`: list → elkjs graph → positions
    (`layoutChart`), and Automatic's choice (`chooseDirection`).
  - `lib/exportImage.ts`: Copy image (one standalone SVG — name, chart, key —
    with the fonts embedded as data URLs, drawn to a PNG). `lib/print.ts`: sets
    the paper's direction and the chart's maximum height just before printing;
    the rest of printing is `@media print` in `global.css`.
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
- `design/`: mock-ups and design sources, not app code. (`og-flowcharter.html`
  makes the link-preview image; `favicon-options*` are the favicon candidates.) Open the HTML files
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

### 2026-10-15 — Across view: loops no longer cross other lines (branch `stage-2-chart`)

**What:** John spotted lines crossing in the worked example's Across view. Cause:
when across, a question's second answer leaves from the diamond's bottom, but
loops arrived on the top of their shape, so a "No" loop had to climb over the
line it looped round. Loops now arrive on the bottom when across (still the
right-hand side when down) — the same side second answers leave from.

**Verified:** counted crossings in every test chart both ways: 11 before (all
Across: the example 1, every-shape 1, the 30-row list 9), none after. That count
is now one of the layout checks (`npm run check`: 22 + 11). Re-drew every test
chart in Chromium at 1200px (Automatic and Across) and 390px — no errors, no
sideways page scroll; looked at the example and every-shape Across views.

### 2026-10-15 — Stage 2 merged; Stage 3 (part 1): Print, Copy image, Guide (branch `stage-3-launch`)

**Merged:** `stage-2-chart` into `main` at John's say-so; production build green.

**What:** Print on the List and Chart headers; Copy image on the Chart header; the
Guide screen (draft words for John to edit). Favicon and link-preview image are
made and shown to John **but not wired in yet** (HOUSE-STYLE §10: show images and
icons for approval first). `public/` has no favicon and `index.html` has no
favicon or `og:` tags until he chooses; when he does, copy his favicon option to
`public/favicon.svg`, render `design/og-flowcharter.html` to
`public/og-flowcharter.png` (1200×630, `node` + Playwright, as clockwheel does),
and add `<link rel="icon">`, `og:`/`twitter:` tags to `index.html` (title
"Flowcharter", description "Create a flowchart from a list", image/URL on
`https://flowcharter.baish.net/`).

**Why these choices** (behaviour in SPEC §5/§6 "Details settled while building
Stage 3"; mechanics here):

- Copy image builds one standalone SVG (title, the chart's own `<svg>` cloned at
  full size, key) because an SVG drawn as an image can't see the page's fonts. The
  font files are fetched once and embedded as data URLs, as clockwheel's
  `exportImage.ts` now does for the clock (its fix, commit `3f381b7`). The chart's
  colours were written out in `FlowChart.tsx` from the start, so no CSS variables
  need inlining.
- Paper direction can't be set from a stylesheet per chart, so `printScreen` adds
  a short-lived `<style>` (`@page` size, the chart's max height) and removes it
  after printing. The chart's own `<svg>` carries `data-direction` so Print knows
  which way Automatic chose.
- A text box can't wrap long wording, so the List's item text and answers are
  drawn twice: the box (hidden when printing) and a plain `<span class="print-only">`.
- Print rules live in `global.css` (`@media print`): nav and buttons hidden,
  name shown, chart full width, label pills white, List as a plain table.

**Left alone:** the favicon and link-preview wiring (awaiting John); the
`flowcharter.baish.net` domain and the card on baish.net's landing page (a change
in the clockwheel repo, which John must OK).

**Verified:** `npm run build` clean; `npm run lint` only the two known warnings;
`npm run check` 22 + 11. In Chromium at 1200px and 390px with touch: Copy image
read back from the clipboard for four charts (the example, every-shape, the
newsreaders tree, the 30-row list), with the real Caprasimo/Figtree visible, and
the download fallback with its file name; Print made into real A4 PDFs from the
page's print rules for five charts (one page each, portrait/landscape as
expected) and the List (1 page for the example, 5 for 30 rows); the Guide and the
busier headers at both widths — no errors, no sideways scroll, every button 44px
on the phone. All earlier checks still pass (the one old check that expected the
Chart placeholder is obsolete).

**Couldn't be checked:** an actual printer or the browser's own print dialog (only
the PDF the print rules produce), Safari's clipboard and print behaviour, and a
real iPhone.

### 2026-10-15 — Stage 3 (part 2): favicon and link preview wired in (branch `stage-3-launch`)

**John chose** favicon option A (the boxes-and-line mark: ink square, line, terracotta dot, on a cream disc) and approved the link-preview image.

**What:** `public/favicon.svg` (copy of `design/favicon-options/a-boxes.svg`), `public/og-flowcharter.png` (1200×630, rendered from `design/og-flowcharter.html` with Playwright; identical to the image John approved), and the favicon link plus `og:`/`twitter:` tags in `index.html` (title "Flowcharter", description "Create a flowchart from a list", image/URL on `https://flowcharter.baish.net/`). This replaces the earlier note that wiring was pending.

**Verified:** `npm run build` clean; `npm run lint` only the two known warnings; `npm run check` 22 + 11. In Chromium against the built app: the favicon and preview image are served with the right types and the page links to them; the only failed request is Vercel's own `/_vercel/insights/script.js`, expected until it's on Vercel.

**Couldn't be checked:** how the preview looks when a link is pasted into a real app (needs the live domain; apps also cache previews), and the favicon in Safari's tab bar.

**Still to do:** the `flowcharter.baish.net` domain (after John says merge), and the optional Flowcharter card on baish.net's landing page (a change in the clockwheel repo — needs John's OK).

### 2026-10-15 — Stage 3 finished: export file name, and merge (branch `stage-3-launch` → `main`)

**John confirmed:** the Stage 3 details in SPEC.md (now marked confirmed), the favicon and preview, and that the Guide stays as drafted for now — he will come back to edit its words (`src/screens/GuideScreen.tsx`) **before real users arrive**.

**Changed:** Export's file name now has the local time as well as the date, as Clockmaker's does: `flowcharter-library-2026-10-15-1430.json` (`exportFilename` in `lib/exchange.ts`; one new check, 23 + 11 now).

**Don't forget (flagged by John):** near the end, add a Flowcharter card to baish.net's landing page (`landing.html` in `JohnBaish/clockwheel`) — a change in the other repo, needing John's OK first.

**Still to do with John:** add `flowcharter.baish.net` in Vercel and DNS; turn on Web Analytics in the Vercel dashboard (the code is already in `src/main.tsx`; no repo change needed).

### 2026-10-15 — First visit opens the Guide with an empty Library (branch `first-visit`)

**John asked for:** the site to open blank rather than with "Backup newsreader", and the Guide to appear for first-time users as Clockmaker's does. The live site is https://flowcharter.vercel.app/ (works without a login).

**Changed:** `firstVisit()` in `state/store.tsx` now gives an empty library and `screen: 'guide'`; `seedChart()` is kept for the checks and `design/test-charts.json` only. Guide wording: added "(You can return to this intro page at any time via “Guide”.)" after "There's no dragging boxes about." SPEC §4 and §7 updated. Anyone who has already visited keeps what they saved (including John's copy of the example).

### 2026-10-15 — flowcharter.baish.net is live; Analytics on (branch `log-domain-live`)

**John did** (in Vercel and his DNS, no code change): added `flowcharter.baish.net` to the Vercel project and its DNS record, and switched on Web Analytics. He reports the domain working. The site is also still at https://flowcharter.vercel.app/.

**Couldn't be checked from here:** the live domain (the sandbox's network blocks it). `index.html`'s `og:` and `twitter:` tags already point at `https://flowcharter.baish.net/`, so the link preview should work once apps refresh their caches.

**Note for users:** charts saved at `flowcharter.vercel.app` don't appear at `flowcharter.baish.net` (browsers keep saved data per address); Export then Import moves them.

**Still to do:** John edits the Guide's words before real users arrive; the Flowcharter card on baish.net's landing page (clockwheel repo, needs John's OK); Stage 4 (moving boxes by hand) when John wants to plan it.

### 2026-10-15 — Proposal: tidier List/Chart header (branch `tidy-header`, not merged)

**John asked** (on Opus) for a review of the List/Chart header against Clockmaker: drop Duplicate there (the Library has it), put Print top-right as Clockmaker does, and an easy way to go from the List to the Chart.

**Compared with Clockmaker:** its header's right-hand group is the same on List and Clock (Print · Duplicate · Copy image · Done), and "+ Add segment" sits in a strip under the header ("18 segments · drag to reorder"). Ours had Add item and Clear in the header, so its right-hand group changed between List and Chart and Print sat in the middle.

**Built as a preview for John to judge:** Duplicate removed from both screens (still on each Library card); Add item and Clear moved to a strip above the list (`.list-toolbar`, "Drag to reorder" on the left), as Clockmaker's; the header's right-hand group is now Print · (Copy image on the Chart) · Done; a **List | Chart** switch in the header (`.view-toggle`, same place on both screens). The nav's List and Chart links stay, as Clockmaker keeps its own. The phone's bottom "+ Add item" button is unchanged.

**Verified:** build clean, lint the two known warnings, checks 23 + 11. In Chromium at 1200px and 390px with touch: no Duplicate; Add item adds a row and focuses it; the switch goes to the Chart and back; Clear asks, empties, then greys out; switch and strip buttons 44px on the phone; no errors, no sideways scroll.

**Second preview, at John's request (same branch):** the nav's List and Chart links removed (the switch is now the only way between them, so nobody wonders what the duplicates do; a chart is opened from the Library); the count tag moved under the name so the switch sits centred (`.editor-header` is a 1fr · auto · 1fr grid, stacking on a phone); Done removed (the nav's Library does that); the strip above the list removed again, and **Print · + Add item · Clear** put in one line at the top right, as in Backtimer (Chart: **Print · Copy image**). John chose the wording "List | Chart" and no Copy image on the List. SPEC §2 updated. The Guide's step 6 ("Open the Chart") may want rewording to mention the switch — John's call when he edits the Guide.

**Verified:** build clean, lint the two known warnings. In Chromium at 1200px and 390px with touch: nav shows only Library and Guide; no Duplicate or Done; Add item adds and focuses a row; the switch goes to the Chart and back; Clear asks, empties, then greys out; action buttons and switch 44px on a phone; no errors, no sideways scroll.

**Third change on the same branch (preview):** the sentence "Automatic is showing it … which fits this chart best" is gone; instead the Automatic button itself says what it picks ("Automatic · Down" / "Automatic · Across"), even when Down or Across is selected, so it's clear what choosing it would do (`automatic` in `ChartScreen.tsx`; hover text explains). Option A (plain "Automatic" with the chosen direction lightly shaded) was shown to John as a screenshot only. Note: Automatic doesn't always choose Down — the worked example goes Across on a computer and Down on a phone.

**Verified:** build clean; lint two known warnings; in Chromium at 1200px (example: "Automatic · Across", drawn across; forcing Down keeps the label and redraws down) and 390px touch ("Automatic · Down"; fits, no sideways scroll); no errors.

**Fourth change (preview), at John's suggestion:** the Direction switch has two buttons, not three: "Automatic · Down" + "Across", or "Automatic · Across" + "Down". The second is always the direction Automatic didn't pick, and forces it (`options`/`selected` in `ChartScreen.tsx`). Saved values are unchanged (`auto`/`down`/`across`); a chart forced to the direction Automatic picks anyway shows as Automatic. Trade-off accepted: you can no longer pin the direction Automatic currently picks so it stays put on another screen size or on paper.

**Verified:** in Chromium at 1200px (example: "Automatic · Across | Down"; Down redraws down and survives reload; Automatic returns to across; a chart forced Across shows as Automatic) and 390px touch ("Automatic · Down | Across", same checks); no errors, no sideways scroll; build, lint, checks as before.

**Fifth change, then merged at John's say-so:** "Direction:" now has a colon, is bold and ink-coloured, and sits 8px from its switch (`.chart-toolbar-label`; option B of three mock-ups shown to John). `tidy-header` merged into `main`.

### 2026-10-15 — Plan changed: what comes next (docs only; branch `plan-update`)

**John decided:** moving boxes by hand (the old Stage 4) is parked as an idea that may be revisited; the automatic layout stays. Next comes a new **Stage 4: smoother answers for a decision on the List** (today you must add the rows before an answer can point anywhere), then **Stage 5: a step-by-step card walkthrough** like Backtimer's, in conversational English, building the chart as it goes. Both are to be talked through with John, with mock-ups, before building. The Guide rewrite waits until the big design work is done; the baish.net landing card waits until John calls it ready for semi-public release (about three people are testing it now). Recorded in PLAN.md ("Re-planned with John") and SPEC §5, §11.

### 2026-10-15 — Answer labels where the line leaves the question (branch `label-placement`)

**John asked** (with his "Am I married to my cousin?" chart): some "No" labels sat after the line's corner, far from their question, where two lines shared a run. **Changed:** `onLine` in `lib/layout.ts` now centres a label on the first stretch of its line if that stretch is at least the label's width plus 12px each side (`LABEL_ROOM`), else on the next stretch that is, else (rare) the old nearest-stretch rule. Judging upright stretches by the label's width too stops labels squeezing onto the short drop under a diamond (the first try did that in the five-answer chart and the example's Across view). John's chart added to the test charts as `cousin`; a new layout check (23 + 12) that labels sit centred on a long-enough first stretch. SPEC §5 updated.

**Verified:** before/after pictures of all ten test charts both ways (only the straight line, with no answers, is unchanged); John's chart, the example, five answers, three answers and the newsreaders tree looked at closely. No errors.

### 2026-10-15 — More space above the key (branch `key-space`)

**John asked** (from his phone) for space between the bottom of the chart and the key. Screen: 17.6px → 35.2px (`.chart-key` padding, `--space-8`); print: `--space-3` → `--space-6`; Copy image: 14px → 32px (`KEY_SPACE` in `exportImage.ts`).

**Verified:** in Chromium at 1200px and 390px touch, the chart-to-key gap measures 35px; the cousin chart still prints on one A4 page; build, lint, checks (23 + 12) as before; no errors.

### 2026-10-16 — Stage 4 first draft: "+ New step" in an answer's "goes to" box (branch `stage-4-answers`, not merged)

**For John to judge** (PLAN.md Stage 4: answers needed rows to exist before they could point anywhere). Each answer's "goes to" box now has **+ New step** under "Choose…". Picking it adds a blank row at the end of the list, points the answer at it and puts the cursor in it (`chartOps.addStepForAnswer`, `store.addStepForAnswer`). The row that was last keeps ending where it did: if it was an ordinary row on "next" (which, with nothing after it, meant "ends here") it's set to "ends here", so it doesn't start flowing into the new branch. The existing rule stays: the row added straight after a question becomes its first answer's destination. Two new checks (25 + 12).

**Verified so far:** in Chromium at 1200px and 390px touch, typing the worked example from scratch: "+ New step" on "No" adds row 6, focuses it, "No" shows "6 · Ask the next station for cover", row 5 shows "ends here", the chart draws as the example; no errors, no sideways scroll. The drop-down list in the screenshots for John is drawn by hand (browsers' own lists don't appear in screenshots).

**Couldn't be checked:** on a real iPhone, whether the keyboard opens for the new row after picking from the drop-down (iOS may only open it after a direct tap).

**John approved (2026-10-16):** wording "+ New step", new rows at the bottom of the list; tried on his iPhone and the keyboard opens for the new row. SPEC updated. Merged into `main`.

### 2026-10-16 — Shape names changed; Connector removed (branch `shape-names`)

**John decided** (and asked for it to go live without another check): Process → **Action**, Decision → **Question**, Input / Output → **Data in/out**, Predefined process → **Standard routine**, and **Connector removed**. Changed everywhere people see them: the Type drop-down, the key, Copy image, the Guide (its wording too, though the Guide is still a draft), the count tag ("2 questions"), the List's hint and labels, SPEC §3–4 and §7. Meanings reworded for Action and Standard routine. The saved ids are unchanged (`process`, `decision`, `io`, `predefined`), so nothing saved breaks; `sanitiseItems` turns a saved `connector` into an Action, keeping its words (new check: 26 + 12). Connector's geometry is gone from `lib/shapes.ts`; the open circle for an unfinished answer (`stub`) stays. The test chart "every shape" now has an Action where its Connector was.

**Verified:** build clean, lint the two known warnings, checks 26 + 12. In Chromium at 1200px and 390px touch: the Type drop-down lists the seven new names; the key, the Guide's shape tiles and the Library show them; the "every shape" chart draws with no Connector; a saved chart containing a Connector loads with an Action in its place; no errors, no sideways scroll.

### 2026-10-16 — Stage 5 card mock-ups (branch `stage-5-cards-mockups`, design only)

**Agreed with John so far:** the cards follow one path to its end, then come back for each unfinished answer; each card first asks what kind of step comes next in plain English ("Something gets done", "We ask a question", "Information comes in or goes out", "That's the end"; under More: "We wait", "A document is made or used", "We follow a standard routine", "It goes back to an earlier step"), then a box with a prompt suited to that kind; the first card offers the buttons too. **Proposed, not yet agreed:** New chart asks "Step by step / Start with a blank list"; the part-built chart beside the card on a computer; "Finish in the List" on every card; cards for new charts only (no resuming).

**Made:** `design/mock-cards.html` (`?card=start|next|question|answers|back|done`; static) and renders in `design/previews/cards/` at 1200px and 390px. The charts beside the cards are real renders from the app (`chart-*.png`). No app code changed.

### 2026-10-16 — Stage 5: the step-by-step cards (branch `stage-5-walkthrough`, not merged)

**John agreed** (on the mock-ups): "Switch to building in List mode" on every card; the chart beside the card on a computer; **Peek at the chart** on a phone; New chart offers Step by step / blank list every time; **Back revisits** (Option 2: returns to the previous card with what was written, to change it; it never deletes); and switching back from the List to the cards, picking up at the first loose end.

**What:** a new screen `'steps'` (`screens/StepsScreen.tsx`). New chart now opens it (`createChart('steps')`); its first card asks Step by step / Start with a blank list. The List header has a **Step by step** button. The rules live in `chartOps` like everything else: `Slot` (a loose end: after an ordinary row that leads nowhere, or an answer without a destination), `nextOpenSlot`, `openAnswer`, `appendStep` (new row at the bottom, attached to a slot; the old last row keeps ending, as "+ New step"), `linkSlot` ("It goes back to an earlier step"), `setAnswers`. The screen keeps a history of cards (for Back) in component state; a card that made a row remembers it, so choosing again there changes that row rather than adding another. Changes are made inside `flushSync` and the next card is worked out from the fresh rows (`itemsRef`), because what comes next depends on what the change produced. `LiveChart` lays the chart out top to bottom and shrinks it to fit its column (not below 45%). Three new checks (29 + 12), including building the whole worked example through the card rules.

**Verified:** build clean; lint the two known warnings; checks 29 + 12. In Chromium at 1200px and at 390px with touch: New chart → Step by step → name → the whole worked example made through the cards (Data in/out, a question with Yes/No, Back to fix a typo with the words kept, That's the end, "Now back to … No" with "That's the Yes path finished.", a second question, its No looping back to step 6 via the pick card) gives exactly the example's eight rows and links; the cards' box is focused on each text card; the List's Step by step button resumes at an answer cleared in the List; Switch to building in List mode; New chart → blank list focuses the name; Peek at the chart on the phone; no errors (only Vercel's analytics script 404s locally), no sideways scroll.

**Couldn't be checked:** a real iPhone (keyboard opening as each card appears; the cards' height with the keyboard up).

**Change at John's request (same branch):** "That's the Yes path finished." now sits above "Now back to …" (between the kicker and the heading, in the small context style), so it reads in the order things happen.

**Fix (same branch):** John found "Peek at the chart" seemed not to work on his iPhone. The chart was drawn below the card, out of sight. It now opens over the whole screen (`.wiz-peek`) with a **Back to the questions** button.

**Fix (same branch):** John noticed Peek showed the chart without the step being typed. The chart beside the card and in Peek now draws a preview (`preview` in `StepsScreen.tsx`) that includes the words on the current card (and the answers on the answers card) without saving them; Next still saves.

**Change at John's request (same branch):** the List's **Step by step** button only shows while the chart has a loose end (or is empty); on a finished chart the cards would have nothing to ask, so it's hidden. It comes back as soon as something is left unfinished (e.g. an answer set to "Choose…", or a new last row).

**Merged:** `stage-5-walkthrough` into `main` at John's say-so (2026-10-16).

### 2026-10-16 — Guide redrafted (branch `guide-redraft`)

**John asked** for a redraft reflecting the changes since the first draft, shorter where sensible, to go live for his second pass. **Changed** (`src/screens/GuideScreen.tsx`): the intro mentions both ways of building (his "(You can return … via “Guide”.)" kept); "Making a flowchart" replaced by **Two ways to build a chart** (New chart → Step by step / blank list; how the cards work; Peek; Back; switching between cards and List), **Writing the steps yourself** (the List, incl. "+ New step"), and **Seeing and sharing it** (List | Chart switch, the two-button Direction, Print, Copy image); the shapes' footnote shortened; tips cut from five to four; "Where they're kept" unchanged (agreed wording). Shape names and meanings come from `data/shapes.ts`, so they're already the new ones.

**Verified:** build clean; in Chromium at 1200px and 390px touch the Guide shows on a first visit, no errors, no sideways scroll.

### 2026-10-16 — Flowcharter on the baish.net landing page (in `JohnBaish/clockwheel`)

At John's say-so: a fourth card in clockwheel's `landing.html`, third in the list (after Clockmaker, before John's Blog): **Flowcharter** — "Create a flowchart from a list, or build it step by step." Built on clockwheel branch `landing-flowcharter`, logged in clockwheel's CLAUDE.md, merged to its `main` (Vercel production build green). John still plans a rethink of the Guide's length and look.

### 2026-10-16 — Guide trimmed to John's wording (branch `guide-trim`)

**Kept first:** the previous Guide, in `design/guide-archive/` (`guide-2026-10-16.md`, its text as shown on the page; `GuideScreen-2026-10-16.tsx.txt`, the code), so John can reuse its phrasing.

**Changed, word for word as John gave it:** the intro card is now just "*You can return to this intro page at any time via “Guide”.*" (italic); "Getting started" is cut to the Step by step sentence and "Alternatively you can write the steps yourself.", then the List bullets (the separate "The List" card is gone, its bullets folded in), then "You can switch between the two building modes at any time until your chart is complete, then you can edit it further in List mode."; the Chart card drops its middle sentence about Automatic; the tips keep only the middle two. Standard routine's meaning (`data/shapes.ts`, shown in the Guide's shape tiles) is now "A procedure that has its own separate routine set of steps."

### 2026-10-17 — Fresh look quick fixes (report §9.1), live (branch `quick-fixes`)

**John approved** the six quick fixes from the fresh-look report and said to
make them live without another check:
- **2.1** "It goes back to an earlier step" isn't offered when there's no
  earlier step (the first card, after Start). The pick card and the pill use
  one list (`backTargets` in `StepsScreen.tsx`).
- **2.2** Changing an End into another kind via Back starts the box empty
  (the text card's fill skips a terminator row's words).
- **2.4** Phone card foot: count, then Back and the main button on the first
  line; Peek and Switch beneath (`.wiz-foot-main` / `.wiz-foot-links`; one line
  on a computer as before).
- **3.1** Abandoned new charts (still "New chart", no rows) are removed on
  leaving: `withoutAbandoned` in `store.tsx`, run by `setScreen` (unless going
  to the List, Chart or cards), `openChart`, `createChart` and on load (which
  also tidies any left from before).
- **4.1** "nothing leads here" tag on rows no other row or answer leads to
  (`chartOps.nothingLeadsTo`; a self-loop doesn't count; row 1 never). Under
  the item's text on both layouts, screen only.
- **5.1** On a phone a chart that fits at 65% or more shrinks to fit
  (`FIT_SCALE_PHONE`); otherwise the 75% floor and sideways scroll stay.
SPEC §4, §5 and the Step-by-step section updated.

**Verified:** build clean; lint the two known warnings; `npm run check` 30 + 12
(new: `nothingLeadsTo`). In Chromium at 1200px and 390px touch, before and
after: abandoned cards 1 → 0; first-card pill 1 → 0; "End" pre-fill → empty;
phone Back/Next on one line above the links, and Next still advances; stray
tag 0 → 1; test charts `drink`/`unfinished`/`cousin` 382/402/391px scrolling →
355px fitting on the phone (computer unchanged). The full Stage 5 run-through
(the worked example through the cards, loop-back pick card, resume from the
List) gives the same rows as before. No page errors, no sideways page scroll.
Before/after sheet sent to John.

**Couldn't be checked:** a real iPhone (the new foot with the keyboard up).

### 2026-10-17 — Fresh look 2.3: changing a question via Back (branch `question-change`, live)

**John chose option (a).** Pressing Back to a question whose answers already
lead to steps now shows: "*Q* already has answers leading to N steps, so here
you can only reword it. To make it a different kind of step, change it in List
mode, where you can see what happens to its answers." (draft wording) and a
**Change it in List mode** button (opens the List with that row's Type box
focused, `changeInList` in `StepsScreen.tsx`). Only **We ask a question** stays
active (to reword it and its answers); the other choices are greyed out. A
question whose answers have no steps yet is unaffected. In the List, changing
the Type hides the answers, the row flows on, and any step only they led to
shows "nothing leads here" (4.1).

**Verified:** build clean, lint the two known warnings, checks 30 + 12. In
Chromium at 1200px and 390px touch: unanswered question: everything still open
(only the existing "goes back" lock); answered: 7 choices greyed out, text as
above, "We ask a question" opens the question's words; the button lands on the
List with "Type of item 2" focused; changing it to Action gives one "nothing
leads here". No errors, no sideways scroll. Screenshots sent to John.

**Revised (same branch), after John asked where you'd reword it:** the text now
reads "*Q* already has answers leading to N steps. To change its words or its
answers, choose **We ask a question** below. To make it a different kind of
step, change it in List mode, where you can see what happens to its answers.",
and that choice has an orange outline (`.wiz-choice-open`). Re-checked at both
sizes, with the same results. Screenshots of the card and of the rewording card
it leads to were sent to John.

**Approved and merged (same day)** with John's final wording: "… To reword the
question or change its answers, choose We ask a question below. To make it a
different kind of step, change it in List mode, where you can decide what
happens to its answers." SPEC's Step-by-step section updated.
