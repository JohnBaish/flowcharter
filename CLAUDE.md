# Flowcharter — working notes

**Create a flowchart from a list.** A sister tool to Clockmaker and
Backtimer (repo `JohnBaish/clockwheel`), for `flowcharter.baish.net`.

Read these first, in this order:

1. `SPEC.md`: what Flowcharter is and does (agreed with John).
2. `PLAN.md`: the staged build. Work one stage at a time, on its branch.
3. `HOUSE-STYLE.md`: the shared look and ways of working. Copied from
   `JohnBaish/clockwheel`; last re-copied 2026-10-23 (clockwheel commit
   `36378ed`). Clockwheel holds the master copy. If it has changed since,
   re-copy it and note that here. The same goes for `SEO-HANDOVER.md` and
   `.claude/skills/fresh-look/` (the `/fresh-look` review).

Key points from the house style, repeated because they matter most:

- John is not a developer. Explain plainly and briefly, say what he needs to
  do, and use British spelling. He decides wording.
- Agree before building anything significant. Show rendered previews of
  images and icons before wiring them in.
- Build on a branch. Notes, documents, review files and checking scripts
  can be merged without asking (say afterwards); anything a visitor could
  see or feel only when John says so (HOUSE-STYLE §10, "When to merge").
- Check in a real browser at 1200px and at 390px with touch emulation, and
  say what couldn't be checked.
- Never rename the storage key (`flowcharter-state-v1`) once live.
- Numbers in running text: one to nine as words, 10 and above as digits
  (John, 2026-10-18; helpers in `lib/words.ts`). Names and controls stay as
  digits (see the 2026-10-18 number-style entry).
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

### 2026-10-17 — Fresh look (full review), and the review written up as house style (branch `fresh-look`)

**The review** (John's request: a long careful look at the whole project on
computers and phones, report only, nothing changed). Reviewed `main` at
`098c024` in Chromium at 1200px and 390px with touch, using the test charts and
charts built from scratch. No page errors, no sideways page scroll, no small tap
targets. Findings, as numbered in the report:
- 2.1 the first card's "It goes back to an earlier step" opens an empty pick list;
  2.2 after Back from an End, choosing another kind pre-fills "End";
  2.3 changing a question to another kind via Back leaves its answer rows stranded
  or joined by accident (options: restrict the change, or warn);
  2.4 the phone card footer puts Next last, below the quiet buttons;
  2.5 a greyed-out pill explains itself only on hover.
- 3.1 abandoned New charts pile up in the Library as empty "New chart" cards;
  3.2 the Library card title can't be reached from the keyboard.
- 4.1 rows nothing leads to aren't flagged in the List;
  4.2 deleting a row is instant with no undo.
- 5.1 phone charts only slightly too wide (382–402px in 355px) still scroll
  sideways; 5.2 big trees are hard to see on a phone (full-screen view idea);
  5.3 the editor header takes nearly half a phone screen.
- 6.1 the phone's back gesture leaves the site; 6.2 the phone menu hides only two
  links; 6.3 the live chart redraws per keystroke (fine here, untested on slow
  phones).
- Left alone: two tabs overwriting each other, repeated answer names, paths ending
  without an End box, cards resuming at the first loose end.
**John's decisions:** 9.1 quick fixes (2.1, 2.2, 2.4, 3.1, 4.1, 5.1) and 2.3
option (a) built and live, see the entries below. Still to discuss: the optional
items 6.1, 4.2, 5.2, 5.3 and 6.2, and the tiny extras 2.5 and 3.2. 6.3 and section 7
are left alone for now.

**The write-up:** at John's request, the way this review was done and reported
is now part of the house style, as **fresh look**:
`.claude/skills/fresh-look/SKILL.md` (copied from clockwheel, which holds the
master) and `HOUSE-STYLE.md` §11. Typing `/fresh-look` in a thread runs it once
it's on `main`. Words after the command narrow it, e.g.
`/fresh-look phones only`. No app code changed.

**Same day:** the fresh-look procedure was extended at John's request. The
"Suggested order" section must now place every item, with a coverage line and
a check before sending (this report's first version missed 2.5, 3.2 and 6.3;
it was corrected and the PDF resent). The report is also always sent as an
A5 PDF in the brand fonts (`report-template.html`, `make-pdf.mjs`). Re-copied
from clockwheel along with `HOUSE-STYLE.md`.

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

### 2026-10-17 — `fresh-look` merged into `main` (both repos)

At John's say-so: `fresh-look` merged into `main` here and in
`JohnBaish/clockwheel`, so `/fresh-look` (with its PDF template and script) and
`HOUSE-STYLE.md` §11 are available to new threads. The only conflict was this
log (both branches had added entries at the end); kept both, in date order. No
app code changed.

### 2026-10-17 — Fresh look optional items 2.5, 3.2, 4.2, 5.2, 5.3, 6.2 (branch `optional-items`, live)

**John said yes** to all six; built for screenshots before going live. 6.1 (back
gesture) and the section 7 items are for a later conversation.
- **2.5** A visible line under the choices when "It goes back to an earlier
  step" is greyed out: "“It goes back to an earlier step” isn't available
  here, because *X* has already been added. To remove it, use List mode."
  (draft; `.wiz-note`; not shown on the locked-question card, which explains
  itself).
- **3.2** A Library card's name is a real button (`.library-chart-title`):
  Tab reaches it, Enter opens the chart; looks as before, accent on hover.
- **4.2** Undo after deleting a row in the List: a dark message at the bottom,
  "Deleted “*text*”" (or "Deleted item N") with **Undo**, for 6 seconds
  (`.toast`; `store.restoreItems`). It only shows while the rows are exactly as
  the delete left them, so Undo can't throw away a later edit. The existing
  confirmation for a row other routes lead to is kept. Clear isn't covered.
- **5.2** Full screen on a phone: offered in the Chart header (beside Print and
  Copy image) only while the chart is too wide for the screen; opens the whole
  chart shrunk to fit width and height (`.chart-full`), pinch to zoom, Close.
  The header and Chart screen share two unsaved flags in the store
  (`chartWide`, `chartFull`), reset on leaving the Chart.
- **5.3** The chart's name is 24px on a phone (32px on a computer).
- **6.2** No menu button: Library and Guide sit in the top bar on a phone too;
  the "saved … ago" tag is hidden there for room (`.nav-main`, `.nav-saved`).
  Computer nav unchanged.

**Verified:** build clean; lint the two known warnings (one new ref warning
fixed); checks 30 + 12. In Chromium at 1200px and 390px touch: phone nav one
row 62px tall, links 44px, no menu button, no sideways scroll; Tab reaches a
card name and Enter opens it; Undo restores the rows exactly, the message
goes after Undo, after another edit, and after 6s, and appears after the
confirmed delete of a referenced row; name 24px on the phone, chart starts
~55px higher (360 vs ~413); Full screen only on wide charts (newsreaders,
five answers; not the long list, drink or the example), fits 366×312 in
390×844, Close works; 2.5 line shown. Earlier run-throughs (Stage 5 cards,
2.3, quick fixes) all still pass. No page errors.

**Couldn't be checked:** pinch-zoom inside Full screen on a real iPhone.

**Approved by John and merged (same day)**, wording as drafted.

### 2026-10-17 — Fresh look report: points numbered (docs only, straight to `main`)

At John's request, section 7 ("would leave alone") of this project's
fresh-look report is now 7.1–7.4, and section 8 ("couldn't check") 8.1–8.3, so
he can discuss them by number; section 9 refers to 7.1–7.4 and its coverage
line includes them. The PDF was rebuilt and resent. The fresh-look method now
requires this numbering in every report: `SKILL.md`, `report-template.html`
and `HOUSE-STYLE.md` re-copied from clockwheel (commit `c86369d`).

### 2026-10-17 — Cards: naming an ending (branch `end-names`, live)

**John asked** whether the cards could name the End shape, as the List can. They
couldn't: "That's the end" added "End" and moved straight on. He chose option
(a), with my wording, Start left as it is, and asked for it to go live once
thoroughly tested. **Now:** "That's the end" opens a text card like the other
kinds: "How does this path end?" / "Leave it as “End”, or say what the outcome
is." / box with "End" filled in and selected / "e.g. Cover arranged". Next
keeps "End" (one extra tap); typing replaces it; blank falls back to "End".
After Next, the path finishes as before ("That's the Yes path finished."). Back
returns to it with the name, to rename. Changing an ending into another kind
still starts with an empty box (2.2). Code: `'end'` is now a `Kind` in
`StepsScreen.tsx` (type `terminator`, its own `PROMPT`); `chooseKind` no longer
adds the End itself; `textNext` finishes the path for a terminator. SPEC's
Step-by-step section updated.

**Verified:** build clean, lint the two known warnings, checks 30 + 12. In
Chromium at 1200px and 390px touch: the card appears with "End" selected;
typing "Backup booked" names it (and the chart beside the card shows it as
typed); Next → "Now back to … No" with "That's the Yes path finished."; a
second ending kept as "End" with one Next; Back shows the name and renaming
works; Back to the kind card says "You chose *name* here"; changing to "Something
gets done" gives an empty box; a blank name gives "End". The Stage 5 run-through
(worked example), 2.3, quick-fix and optional-item run-throughs all pass (each
updated for the extra Next). No page errors, no sideways scroll. Before/after
sheet sent to John.

**Couldn't be checked:** a real iPhone (keyboard opening with "End" selected).

### 2026-10-17 — Licence: none, deliberately (notes only)

John asked whether to use CC BY 4.0. Agreed: no licence for now. Both repos are
public, and without a licence normal copyright applies (nobody may reuse the
code or words without asking). CC BY suits content, not code. If John later
wants others to reuse the work: MIT for code, optionally CC BY for the Guide
text and images. Making the repos private is the option if the notes should
not be readable. No change made.

### 2026-10-17 — Fresh look 6.1: the phone's Back, one step (branch `back-step`, live)

**John's concern:** sites that fill your history with their own addresses are
annoying. Asked about a "you're about to leave" warning instead: explained it's
not workable (browsers show only their own fixed wording about unsaved changes,
which would be untrue here; iPhone Safari doesn't show it; Chrome skips history
traps). **He chose** the one-step version, with Back also closing Peek and Full
screen.

**What:** `lib/backLayers.ts`, `useBackLayer(open, id, onBack)`: while a
"layer" is open it adds one history entry (`pushState`, same address); the
browser's Back closes the top layer (`popstate`); closing it any other way
takes its entry back off (`history.back()`, that pop ignored), so entries
never pile up. Layers: the chart (in `App.tsx`, open while on List, Chart or
cards; Back → Library), Peek (`StepsScreen.tsx`) and Full screen
(`ChartScreen.tsx`). After a reload on a chart the browser is already on the
chart's entry, so it's adopted rather than added; a reload with Peek/Full
screen open turns that entry into the chart's. React's development double-run
is absorbed (a layer closed and reopened at once keeps its entry). SPEC §2
records the behaviour.

**Verified:** build clean, lint the two known warnings, checks 30 + 12. In
Chromium (built app) at 1200px and 390px touch, with a page before the site in
the history: open a chart, switch List/Chart/List → history grows by one; Back →
Library, Back → leaves; open a chart then Library via the top bar → Back leaves
straight away (no dead press); New chart → cards, Back → Library and no empty
chart left; List → Step by step, Back → Library; Peek: Back closes it, and after
closing it by its button, Back → Library; Full screen the same; reload on a
chart, Back → Library then leaves; Guide, Back leaves; address unchanged
throughout. Same results in the development server (desktop). Earlier
run-throughs (Stage 5, 2.3, optional items, ending names) all pass.

**Couldn't be checked:** the real gestures on an iPhone (swipe back) and
Android (back button). That's why John is trying the branch's preview first.

**John tried the preview on his phone (2026-10-17):** "All works." Merged into
`main` at his say-so.

### 2026-10-17 — Contact address now workshop@baish.net (branch `contact-email`, live)

**John asked** for every flowcharter@baish.net to become workshop@baish.net,
made live. Changed in the Library footer (`LibraryScreen.tsx`), the Guide's
closing paragraph (`GuideScreen.tsx`), the "chart couldn't be drawn" message
(`ChartScreen.tsx`) and SPEC §9's agreed footer wording. Left as they were: the
old Guide kept in `design/guide-archive/` (a record of the page as it was on
2026-10-16), and earlier log entries.

**Verified:** build clean, lint the two known warnings. In Chromium at 1200px
and 390px touch, the Guide and the Library show workshop@baish.net and no
trace of the old address; no errors. The "couldn't be drawn" message only
appears if drawing fails, so it was checked in the code, not on screen.

### 2026-10-17 — SEO handover copied; research only (branch `claude/dazzling-ptolemy-645jyt`)

**John asked** for `SEO-HANDOVER.md` to be copied from `JohnBaish/clockwheel`
(main, commit `e8f971b`; clockwheel holds the master copy) and its checklist
(§2) researched, with recommendations held until he asks. No app code changed.

**Found, against the checklist** (not yet discussed with John):
- 1–3, 4: `<title>` is just "Flowcharter"; the one description, "Create a
  flowchart from a list", is used for search and link previews alike. The
  link-preview picture draws that same wording, so the og:/twitter: tags
  should keep it and only `<meta name="description">` change.
- 5: no canonical tag (needed: flowcharter.vercel.app still serves the site).
- 6: nothing in `src/` sets `document.title`.
- 7: no search comment in `index.html` yet.
- 8: `public/` has no robots.txt or sitemap.xml (one Vercel project, one
  domain, so plain files will do). Locally, `vite preview` answers
  `/robots.txt` with the app's HTML; whether live Vercel does the same or
  gives a 404 can't be checked from here (Google treats a 404 as "no
  rules"). Adding the real files settles it either way.
- 9: a first visit opens the Guide (about 470 words, both widths), so
  that's what Google sees; it says how to use the tool but not what a
  flowchart is or the other names people search for (flow chart, flow
  diagram, process map, decision tree).
- 10: "Contact: workshop@baish.net" appears in the Guide's last card and the
  Library footer; neither has the "More free tools at www.baish.net." link.
- 11–12: done (card in `landing.html`; hub title already names flowchart tools).
- 13–18: to do after the changes (checks, live files, Search Console, log).

### 2026-10-18 — Section 7 notes saved for discussion (notes only, straight to `main`)

John is moving the discussion of the fresh-look report's section 7 (7.1–7.4,
"would leave alone") to a new thread. The page shown to him, with each item's
current behaviour, why it was left, and roughly what changing it would take
(with options), is saved as `design/fresh-look/section-7-2026-10-18.html`.
7.3 is worded more exactly there than in the report: a step set to "ends
here" in the List counts as finished on the cards. No app code changed.

### 2026-10-18 — Fresh look 7.1: a warning when another tab has changed things (branch `claude/epic-brahmagupta-muah7v`, not merged)

**John chose** option (a) for 7.1 (two tabs overwriting each other): a message
with a Reload button, not a quiet refresh. Flowcharter only; Clockmaker is not
touched (its handover notes are collected at the end of the section 7
discussion). 7.3 and 7.4 are to be left alone. 7.2 and a site-wide number-style
check (one to nine in words, 10 and above in digits) are agreed but not built.

**What:** when another tab saves *different charts* (`savedCopyDiffers` in
`lib/exchange.ts`; which screen or chart is open doesn't count, and field order
doesn't matter), a dark bar appears at the top: "Flowcharter was changed in
another tab. Reload to see the changes. Until you do, this tab won’t save
anything." (draft wording) with a **Reload** button (`.stale-bar` in
`App.tsx`/`global.css`, hidden when printing). The store listens for the
browser's `storage` event (`changedElsewhere` in `store.tsx`).

**Why saving pauses:** without that, merely moving between screens in the
older tab would save its old copy over the other tab's work, so the warning
would come too late. Trade-off: anything done in the older tab after the
warning isn't kept. Nothing is lost silently, because the bar says so.

**Verified:** build clean; lint the two known warnings; `npm run check` 31 + 12
(new: `savedCopyDiffers`). In Chromium with two tabs at 1200px and 390px touch:
no bar in the tab that edited; the other tab gets it; it can move between
screens without overwriting the edit; Reload clears the bar and shows the
edit; saving works again afterwards; changing screen alone in another tab
gives no bar; bar is one row on a computer and stacked on a phone, Reload 44px
tall there, no sideways scroll, no page errors.

**Couldn't be checked:** a real iPhone or Safari (including Safari's private
windows, where tabs may not share storage at all). One tiny gap remains: if a
second tab is opened in the same instant the first saves, the newer copy can
be overwritten and the first tab may show the bar; that window is a few
milliseconds.

**John approved 7.1** (wording as drafted, and saving pausing while the bar
shows). Not merged yet: John hasn't said to.

### 2026-10-18 — Fresh look 7.2: a note when answers share a name (same branch, not merged)

**John chose** option (a): repeated answer names stay allowed, but are pointed
out, and the cards say which answer they mean.
- **List** (computer and phone): under a question's answers, "Two answers are
  both called “Yes”." ("all called" for three or more; one sentence per
  repeated name; screen only, not printed). Doesn't stop anything.
- **Cards:** the answers card shows the same line while typing. Cards that
  ask about one answer (the kind card, the text card and the pick card) show,
  small, under the heading: "(Two answers are called Yes. This is the first of
  them.)" ("the second", and so on).
- Names count as the same ignoring capitals and spaces around them; blank
  answers don't count. Rules in `chartOps` (`repeatedAnswers`, `answerPlace`),
  wording in `lib/answerNotes.ts`.
- **New:** `lib/words.ts` (`numberWord`, `ordinalWord`, `capitalise`) for John's
  number rule (one to nine as words, 10 and above as digits), for the coming
  site-wide check.

**Verified:** build clean; lint the two known warnings; `npm run check` 33 +
12 (new: repeated names, number words). In Chromium at 1200px and 390px touch:
no note for Yes / No; typing "yes" over "No" shows it on the answers card; the
first and second answers' cards, the text card and the pick card say "first"
and "second"; the List shows the note, it goes when names differ, returns with
"YES " (nothing is stopped or changed), and says "Three answers are all
called" for three; no sideways scroll, no page errors.

**Couldn't be checked:** a real iPhone (only the wording and layout changed).

### 2026-10-18 — Number style: one to nine as words, 10 and above as digits (same branch, not merged)

**John's rule, and his decisions from a case-by-case check** of every word the
app shows (the page of cases was shown to him before anything changed):
- **Changed (full sentences):** the Clear confirmation ("Clear all eight items
  from “…”?", and "the only item" for one: John's wording, chosen over "the one
  item" and "the item"); the delete confirmation ("…is where three other routes
  lead", "one other route leads"); the import confirmation ("replace the four
  flowcharts … with the two in this file"); the cards' "already has answers
  leading to two steps" and "Your flowchart has eight steps". Numbers of 10 or
  more stay as digits ("all 12 items"). SPEC's Clear wording updated.
- **Left as digits, deliberately:** the short counts ("8 items · 2 questions" in
  the header and on Library cards, "3 charts" in the Library, "3 steps so far" on
  the cards); names and controls (row numbers, answer codes like 2a, "Item 2",
  "3 · Go" in the goes-to list, the routes box, the answers card's numbered
  boxes); times and dates ("5 min ago", "3 hr ago", "18 Oct").
- **The logic, for applying it elsewhere (and for the Clockmaker handover):** a
  number that is *counted in a sentence* follows the rule; a number that is a
  *name, label or control* (it has to match what is on screen) stays a digit;
  *times and dates* stay digits; short *count tags* are left alone unless the
  owner asks. Singular wording is chosen for readability, not mechanically
  ("the only item", not "the one item").
- Not checked: notes and design files (`SPEC.md`, `CLAUDE.md`, `design/`),
  which site visitors never see.

**Verified:** build clean; lint the two known warnings; `npm run check` 33 + 12.
In Chromium at 1200px and 390px touch, each message read exactly from the
browser's own pop-up: Clear for one, eight, nine and 12 rows; delete for three
routes and one; import of two charts over four; the cards' done card ("five
steps") and the locked-question card ("two steps"). No page errors, no sideways
scroll.

### 2026-10-18 — Handover for Clockmaker; section 7 merged into `main` (notes, then merge)

**Written, at John's request:** `design/handover-clockmaker-2026-10-18.md`, the
section 7 ideas that might suit Clockmaker (the two-tab warning with how it
works and what was learned; the number rule with the logic behind John's
decisions; repeated answer names, probably not relevant; 7.3 and 7.4 not
relevant), with a suggested way to work through it. Written without reading
Clockmaker's code. Also `design/handover-clockmaker-prompt-2026-10-18.md`, the
words John can paste to start a Clockmaker thread. Nothing in clockwheel was
touched, and `HOUSE-STYLE.md` was not changed (the number rule is in this
file's key points only; the master house style is in clockwheel).

**Merged at John's say-so:** branch `claude/epic-brahmagupta-muah7v` (7.1, 7.2,
number style, this handover) into `main`.

### 2026-10-18 — Search (SEO), following `SEO-HANDOVER.md` (branch `claude/dazzling-ptolemy-645jyt`, merged)

**John approved** the recommendations and all the wording as drafted.
**Changed:**
- `index.html`: `<title>` "Flowcharter – free flowchart maker from a simple
  list"; search description "Free flowchart maker. Type your steps as a list,
  or answer simple questions step by step, and Flowcharter draws the chart.
  Print it or copy it as an image."; canonical `https://flowcharter.baish.net/`;
  a comment saying which tags are for search and which for link previews. The
  og:/twitter: tags are unchanged ("Create a flowchart from a list" is drawn
  into the preview picture).
- `public/robots.txt` and `public/sitemap.xml` (plain files; one domain).
- Guide: a new card before "Where they're kept", **What's a flowchart?**
  (other names: flow charts, flow diagrams, process maps, decision tree).
- "More free tools at www.baish.net." (new tab) before "Contact:" in the
  Guide's last card and the Library footer.

**Verified:** build clean, lint the two known warnings, checks 30 + 12. In
Chromium against the built app (`vite preview`) at 1200px and 390px touch: tab
title, description, canonical and og:/twitter: tags correct after the app has
started; the new card shows on a first visit; both links present with
`target="_blank"` and `rel="noopener noreferrer"`, and the Guide's opens a new
tab at www.baish.net (the sandbox can't load it); `/robots.txt` (text/plain) and
`/sitemap.xml` (text/xml) serve the right text; no page errors, no sideways
scroll.

**Still to do after merging:** John opens the live `/robots.txt` and
`/sitemap.xml`; Search Console (add sitemap, Test live URL, View tested page,
Request indexing); Flowcharter's row in clockwheel's `SEO-HANDOVER.md` §1 table
(needs John's OK, other repo).

**Merged into `main` at John's say-so**, and OK given for the clockwheel table row.
The only conflict was this log (another thread had added section 7 entries); kept both.

**Same day:** Flowcharter's row added to the table in clockwheel's
`SEO-HANDOVER.md` (clockwheel commit `c13e569`, straight to its `main`), and
this repo's copy re-copied from there.

**Live check (John, 2026-10-18):** `https://flowcharter.baish.net/robots.txt` and
`/sitemap.xml` show the right text. John is doing the Search Console steps
(sitemap, Test live URL, View tested page, Request indexing) himself.

### 2026-10-18 — Examples: booking a table, not backup newsreaders (branch `claude/focused-bardeen-551939`, not merged)

**Why:** a new user mentioned the newsreader examples. John wants more general
ones that don't draw attention to his own work procedures. He chose booking a
table at a restaurant, from the customer's side, and approved the wording below.

**Changed** (all 12 newsreader-themed places a visitor can see):
- Cards (`PROMPT` and the name box in `StepsScreen.tsx`): name "e.g. Booking a
  table"; Choose a restaurant; Do they have a table free at 8pm?; Ask for a
  table for four on Friday; Wait for the confirmation email; Check the
  confirmation email; Pay the deposit; Table booked.
- Guide shape samples (`SAMPLES` in `GuideScreen.tsx`): Start (unchanged), Pick a
  restaurant, Table / free?, Ask for a table, Pay the deposit, Confirmation /
  email, Wait for email.
- Together they make one small chart: Start → Choose a restaurant → Ask for a
  table … → Table free? Yes → Pay the deposit → Wait for … → Check … → Table
  booked; No → back to Choose a restaurant.
- Left alone: the "Backup newsreader" chart in `data/charts.ts` and
  `design/test-charts.json` (used only by the checks and as a test chart), code
  comments, and earlier log entries.

**Verified:** build clean; lint the two known warnings; `npm run check` 33 + 12.
In Chromium at 1200px and 390px touch: the name box and all seven card hints
read exactly as above; every Guide sample sits inside its shape (measured, and
looked at); no page errors, no sideways scroll.

**Approved by John and merged into `main` (same day).**

### 2026-10-20 — Mock-ups: Back un-draws the cards' chart; changing words on the Chart (branch `claude/beautiful-ramanujan-v19j5u`, design only)

**John asked** whether Back on the cards could un-draw the chart, and whether
a finished chart's boxes could be clicked to change their words.

**John decided:**
- **Back really undoes** (option a). This reverses the 2026-10-16 "Back
  revisits, it never deletes" choice: users found going back and then jumping
  forward too complex to be worth keeping. Each Back removes what the card
  before it added; going forward again means answering the cards again.
- **Editing on the Chart changes only the words**, never the shape (unlike the
  List, where new words can change a guessed shape).

**Made, for John to judge** (nothing built in the app yet):
`design/mock-back-and-edit.html` and its PDF
`design/previews/back-and-edit/mock-back-and-edit.pdf`. The pictures are real
screens from the built app, with the proposed parts painted on top by
`design/mock-back-and-edit.mjs` (it drives the cards, building the booking
chart; run it against `npx vite preview --port 4173`).
- Back, five presses from "Pay the deposit": the step being written is drawn
  **dashed** (so every Back visibly changes the chart, since the cards already
  draw what's being typed); a card you come back to outlines the choice made
  there and says so (draft: "You chose *Something gets done* here: *Pay the
  deposit*. Choose it again to carry on with those words, or choose something
  different."). Back only undoes what was done on the cards this time. The 2.3
  locked-question card and the 2.5 note would no longer be reachable, so they
  would be removed.
- Chart editing: on a computer, hover outlines a box; clicking turns the box
  itself into the place to type (Enter or clicking away saves, Esc cancels);
  answers on lines work the same way. On a phone, tapping outlines the box and
  opens a panel at the top of the screen (the keyboard opens below it). Hint
  line beside Direction (drafts: "Click/Tap a box to change its words.").
  Empty keeps the old words; List limits (80/40). Not in Full screen, the
  cards' chart, print or Copy image.

**Open for John (numbered in the PDF):** 1a the "You chose" wording; 1b the
dashed step; 2a the hint wording; 2b the phone panel's title and place; 2c no
editing in Full screen (suggested).

**Verified:** the mock-up page in Chromium at 1200px and 390px with touch:
fonts loaded, every picture present, no sideways scroll. The screenshots come
from the real app with no page errors.

**Couldn't be checked:** how the phone panel behaves with a real iPhone
keyboard (to try on the preview once built).

**John's answers (same day):** 1a, 1b, 2a and 2b agreed as drafted; 2c no
editing in Full screen. Built straight away, below.

### 2026-10-20 — Back undoes on the cards; changing words on the Chart (branch `claude/beautiful-ramanujan-v19j5u`, not merged)

**Back undoes** (`StepsScreen.tsx`). Each card in the history now carries
`before`, the steps as they were when it appeared (`Shown`); Back restores the
previous card's `before` (`store.restoreItems`) and pops the top card, so every
press un-draws what the card after it added. Cards remember what was entered
on them for when Back returns: a text card its words (`typed`), an answers
card its answers, a kind card its choice (`chose`) and the words written for
it (`words`, with their kind, so an untouched "End" doesn't replace them).
Words carry to a different kind except to or from an ending (as 2.2). Words
typed on a text card and abandoned with Back are kept for the kind card below.
Because a step is now always new when written, the old "change the row in
place" path, the 2.3 locked-question card (`changeInList`, `.wiz-locked`) and
the 2.5 note are gone. `FlowChart` takes a `draft` (steps, and questions'
answer lines, drawn dashed); `LiveChart` passes it through.

**Changing words on the Chart** (`ChartScreen.tsx`, `FlowChart.tsx`). Boxes
and answer pills are `g.fc-edit` (role button, Tab + Enter work); the outline
is CSS only (`.fc-outline`, hover only where a real pointer exists), so Copy
image and print never see it. Computer: `EditBox`, a contenteditable over the
shape, same size and fill, words selected, hint to the right (or below if
there's no room). Phone (≤720px): `.chart-edit-panel` fixed at the top, the
shape scrolled into sight below it. Opening uses `flushSync` so the box is
focused inside the tap (the phone keyboard). Saves through the new
`chartOps.setWords` (words only, never re-guessing the shape; one new check)
and `setRouteLabel`. Empty keeps the old words. Not in Full screen or the
cards' chart. SPEC §5 ("Changing words on the Chart") and §10b updated.

**Verified:** build clean; lint the two known warnings; `npm run check` 34 + 12.
In Chromium (built app) at 1200px and 390px with touch:
- Cards: five Backs from "Pay the deposit" un-draw exactly as in the mock-ups
  (words kept, dashed step, gone; answer lines dashed; question dashed, gone);
  the "You chose" line and outline; choosing again restores the words, an
  ending starts as "End"; answers remembered; Back from done undoes the loop;
  Back to the name card removes Start and Next adds it again; resuming from the
  List has no Back on the first card; the full booking chart built with the
  right links.
- Chart: hint wording; seven of the booking chart's shapes and answers
  respond; hover outline; the box sits over the shape with the words selected;
  Enter saves and a question mark doesn't turn an Action into a Question; Esc
  cancels; empty keeps the words; clicking away saves; renaming an answer keeps
  its loop; keyboard opening; the hint isn't printed. Phone: panel, 16px text,
  selected words, outlined shape in sight below the panel, 44px buttons, Save
  and Cancel, no outline left behind. Copy image after hovering has no orange
  in it. All ten test charts draw at both widths (Full screen on the phone has
  no editing). No page errors, no sideways scroll.

**Couldn't be checked:** a real iPhone (the keyboard opening when a box is
tapped and its effect on the panel; dashed lines in Safari).

**John tried the preview (2026-10-20):** "Looks great." Merged into `main` at
his say-so.

### 2026-10-20 — Guide: a line about changing words on the Chart (branch `claude/beautiful-ramanujan-v19j5u`, restarted from `main`; draft, not merged)

**John asked** for a draft, shown in context. Added a second paragraph to the
Guide's "Seeing and sharing it" card (`GuideScreen.tsx`), draft wording: "To
change the words in a box, or an answer on a line, click it (on a phone, tap
it). This changes only the words: to change a step's shape, use the List."
Pictures of the real Guide at both widths: `design/previews/guide-chart-edit-
computer.png` and `-phone.png`.

**Verified:** build clean; in Chromium at 1200px and 390px touch the card reads
as above, no page errors, no sideways scroll.

**Approved by John and merged into `main` (same day)**, wording as drafted.

### 2026-10-20 — Mock-ups: a clearer List | Chart switch (branch `claude/beautiful-ramanujan-v19j5u`, restarted from `main`; design only)

**John asked** for a way to make the List | Chart switch clearer at a glance.
Observation: on the Chart screen it looks exactly like the Direction switch
below it (both orange-and-cream pills). **Made:** `design/mock-view-switch.html`
and its PDF `design/previews/view-switch/mock-view-switch.pdf`, from real
screens with only the switch swapped (`design/mock-view-switch.mjs`): now;
**A** small list and flowchart icons beside the words; **B** picture buttons
(a numbered list, a mini flowchart in the shapes' colours; the current one
outlined, not filled; ~25px taller on a phone); **C** tabs (icon + word, the
current one orange and underlined; no extra room). Suggested C; B if it must be
impossible to miss. No app code changed.

**Verified:** the pictures from the built app in Chromium at 1200px and 390px
touch, no page errors, no sideways scroll; the mock-up page with fonts loaded
and every picture present.

**John chose C, tabs (same day). Built:** `EditorHeader.tsx` now draws
`.view-toggle` as two `.view-tab` labels (still radio buttons: Tab reaches them,
arrow keys switch), each with its picture (`components/ViewIcons.tsx`, kept out
of `lib/icons.tsx` so lint stays at the two known warnings); styles in
`global.css` (orange text and a 3px orange underline on the current tab, a
grey line under both; 44px tall on a phone). SPEC §2 updated.

**Verified:** build clean; lint the two known warnings; `npm run check` 34 + 12.
In Chromium (built app) at 1200px and 390px touch: both tabs with pictures;
the current one orange and underlined; switching both ways; Tab reaches them
with a visible focus outline and arrow keys switch; 44px tall on a phone; not
printed; no sideways scroll, no page errors. The Back and Chart-editing
browser checks from earlier today still all pass. Pictures:
`design/previews/view-switch/built-computer.png` and `built-phone.png`.
Not merged: waiting for John.

**Approved by John and merged into `main` (same day).**

### 2026-10-22 — house style, SEO handover and fresh-look review re-copied (notes only, straight to `main`)

From clockwheel `199e20d`, after John answered the house-style questions
drawn from Hindcaster's work (clockwheel's notes have the list): when to
merge without asking, git and preview-server checks, wording rules,
privacy, charts, automatic checks and more. The fresh-look PDF script now
checks every brand font style (the old one passed an unused style as
"loaded"). `SEO-HANDOVER.md` gains Hindcaster's column and the hub's new
title. The key points above now give the new merge rule. No app code
changed.

### 2026-10-22 — Safety net; card wording (K1, K3) (branch `house-style-k1-k3`, merged)

From the house-style follow-up questions, agreed by John. **K1:**
`src/components/SafetyNet.tsx` wraps the screens in `App.tsx` (keyed by screen
and chart): if one fails while drawing, "Sorry, this screen couldn’t be shown.
Your flowcharts are still saved in this browser." with **Go to the Library**.
**K3** (sentences ending in a preposition, HOUSE-STYLE §15), in
`StepsScreen.tsx`: the wait card asks "What has to happen before you carry
on?"; the name card "What shall we call this flowchart?"; "Change the words if
necessary." (was "if you need to"); and the pick card (after "It goes back to
an earlier step") now reads **Which step comes next?** / "Choose one you’ve
already written. The path either loops back to it or joins another path
there." (John's choice of Claude's wording).

**Verified:** build clean; lint the two known warnings; `npm run check` 34 +
12. In Chromium at 1200px and 390px with touch, a scratch build with a
deliberate fault: the message and button show (44px on a phone), Go to the
Library works; the real build shows no message; no errors, no sideways scroll.
Merged to `main` at John's word.

### 2026-10-22 — house style re-copied (notes only, straight to `main`)

From clockwheel `d8c3aee`: §5 and §10 now point to the safety nets and
Clockmaker's new `npm run check`. No app code changed.

### 2026-10-22 — house style re-copied (§16, starting a new tool)

From clockwheel `d8c3aee`: a new §16, the checklist and first prompt for
starting a new tool. Docs only.

### 2026-10-22 — Full screen on iPads too (branch `ipad-full-screen`, merged the same day)

**John asked** (after a look at the sites at iPad and iPhone Duo sizes): offer
Full screen on iPads, not only phones. iPads (744px wide and more) get the
computer layout, where Full screen was never offered, so a wide chart could
only be scrolled inside its frame. Now Full screen shows on a phone **or any
touch screen** (`(pointer: coarse)`, `isTouch()`) whenever the chart is too wide
to fit (`wide` in `ChartScreen.tsx`; the button in `EditorHeader.tsx`). Computers
with a mouse are unchanged. SPEC §5 "Size" updated.

**Verified:** build clean; lint the two known warnings; checks 34 + 12. In
Chromium with touch at 744px (iPad mini), 890×626 (iPhone Duo open sideways,
estimated) and 1032px (iPad Pro 13): offered for the newsreaders tree at 744
and 890 (it fits at 1032, so not offered there); opens the whole chart, Close
and Back both close it. Not offered at 1200px with a mouse. Phones unchanged.
Noticed: the 30-row test chart, drawn Across on the open Duo, becomes a very
thin strip in Full screen (it fits the width); choosing Down avoids that.
**Couldn't be checked:** a real iPad (pinch to zoom inside Full screen).

### 2026-10-22 — typing boxes 16px on any touch screen; the words panel on tablets (same branch, merged)

**John agreed** (after before/after pictures) that typing boxes and lists are
16px on any touch screen, not just phones, as an iPhone (and maybe an iPad)
zooms in on smaller ones. `global.css`: `.plain-input, .input, select.input,
.wiz-field, .wiz-answer input` 16px under `@media (pointer: coarse)`.
Changing words on the Chart: on a touch screen the box drawn over the shape
was 14px, so tablets now get the phone's "Change the words" panel at the top
(`usePanel` in `ChartScreen.tsx`); a mouse still edits in place.
`HOUSE-STYLE.md` re-copied from clockwheel `c9d991e` (§6).

**Verified:** build clean; lint the two known warnings; checks 34 + 12. In
Chromium with touch at 744, 820, 890×626, 1032 and 1180px: every box 16px; the
panel opens with the words selected and saves; no sideways scroll, no errors.
At 1200px with a mouse: unchanged, and the in-place box still saves. Phones
unchanged. **Side effect, accepted for now:** in the List on an iPad mini
(744px) the bigger drop-down lists leave the Item column narrower, so three of
the example's eight items are cut off in their boxes (one was already); at
820px one is. Tapping a box shows the whole text. **Couldn't be checked:** a
real iPad (pinch to zoom inside Full screen; whether iPad Safari zooms on small
boxes at all).

### 2026-10-23 — house style re-copied (notes only, straight to `main`)

From clockwheel `a47861d`: §15 now asks for clock times written with a full
stop ("9.30am"), as Hindcaster now does (John). Flowcharter shows no clock
times with minutes (only examples such as "8pm"), so no app code changed.

### 2026-10-23 — house style re-copied (notes only, straight to `main`)

From clockwheel `36378ed`: §15 now says temperatures are written "20°C", with no
space (John). No app code changed.
