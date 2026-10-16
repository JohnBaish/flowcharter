# Flowcharter — build plan

Staged so John can see and approve each stage on a Vercel preview before the
next begins. Each stage is built on its own branch and merged to `main` only
when John says so (HOUSE-STYLE §10). Read `SPEC.md` and `HOUSE-STYLE.md`
before starting any stage.

At the end of every stage:

- `npm run build` and `npm run lint` are clean.
- The stage has been checked in a real browser (Playwright, Chromium at
  `/opt/pw-browsers/chromium`) at 1200px and at 390px with touch emulation.
  There must be no sideways page scroll at 390px. Screenshots are shown to
  John.
- There's a dated entry in `CLAUDE.md`: what was built, why, what was left
  alone, how it was verified, and what couldn't be checked (e.g. a real
  iPhone keyboard).
- John gets the preview link and a short plain-English summary.

---

## Stage 1 — the app, Library and List

Branch: `stage-1-list`

1. Scaffold Vite + React + TypeScript to match clockwheel's `package.json`
   (same versions, `oxlint`, `.oxlintrc.json`, tsconfigs, `vercel.json` if it
   applies). Dependencies: `@fontsource/caprasimo`, `@fontsource/figtree`,
   `lucide-react`, `@vercel/analytics`.
2. Style files. `src/styles/organic.css` and `global.css` are already copied
   in. Trim `global.css` of the Clockmaker-only rules HOUSE-STYLE §1 lists.
   Copy `src/lib/icons.tsx` (keep only the icons used), `responsive.ts` and
   `useDragReorder.ts` from clockwheel.
3. `src/data/shapes.ts`: the eight types, names, fills and meanings (port
   from `design/shapes.js`). `src/data/charts.ts`: types from SPEC §7, the
   seed chart (worked example), `newChart()`.
4. `src/state/store.tsx`: state, `localStorage` (`flowcharter-state-v1`),
   all list actions (add/insert/remove/reorder items, set text with type
   guessing, set type, set then, set route count, set route label/to),
   rename, duplicate, delete chart, export/import. Store references by id
   only; derive numbers from order.
5. Nav, editor header, Library screen, List screen: table on a computer and
   cards on a phone, as in `design/mock-list.html`. Guide and Chart are
   placeholders for now.
6. Footer notice and Analytics.
7. Push the branch. **Ask John to create the Vercel project now**, with
   step-by-step instructions (import `JohnBaish/flowcharter`, framework
   Vite, defaults otherwise), then share the branch preview link.

## Stage 2 — the Chart

Branch: `stage-2-chart`

1. `src/lib/shapes.ts`: SVG geometry for each type (port `design/shapes.js`),
   plus where a line meets each shape's outline.
2. `src/lib/textWrap.ts`: measure with canvas `measureText` in Figtree (after
   `document.fonts.ready`) and wrap to width. Size diamonds to fit their text.
3. `src/lib/layout.ts`: turn a Chart into an elkjs graph and back (nodes, decision
   ports, edges with label sizes), with the options proven in
   `design/layout-spike.cjs`. Lazy-load elkjs. Automatic direction: lay out
   both ways and choose the one whose shape best fits the chart area.
4. `ChartScreen` + `FlowChart` component: shapes, orthogonal lines with arrowheads,
   answer labels on cream pills, unfinished-route stubs, Direction switch,
   key of the types used. Check against `design/mock-chart.html`.
5. Phones: a readable-size frame that scrolls both ways.
6. Test charts beyond the example: a straight 3-step line; a 3-way decision;
   two paths rejoining (needs `then →`); a long list (~30 items); John's
   newsreader tree rebuilt as a list. Show John screenshots of each.

## Stage 3 — finishing and launch

Branch: `stage-3-launch`

1. Print (Chart and List) and Copy image (with Figtree embedded), SPEC §6.
2. Guide screen. Draft the words for John to edit.
3. Favicon: show John 2–3 rendered options at real 16px first.
4. Link-preview image (`design/og-flowcharter.html` from clockwheel's
   template, fonts by path) and the `og:`/`twitter:` tags.
5. Final words agreed (SPEC §9). After John says merge: he adds
   `flowcharter.baish.net` in Vercel and DNS (Claude says exactly what to
   click).
6. Separately, in `JohnBaish/clockwheel`: add a Flowcharter card to
   `landing.html`. *(Deferred by John until semi-public release; see below.)*

## Re-planned with John, 2026-10-15

Stages 1–3 are live at `flowcharter.baish.net`, being tried by about three
people. What comes next, in this order:

### Stage 4 — smoother answers for a decision on the List (done 2026-10-16: "+ New step")

**John's note:** when you type something that leads to choices, the List
should prompt for the choices that come out of the Yes / No more smoothly. At
the moment it's clunky: you have to realise you need to add a new row before
you can tell the system where each branch goes.

Not designed yet. Talk it through with John first and show mock-ups before
building. Ideas to bring (none agreed): offer to add the step for each answer
straight from the answer row (e.g. a "+ new step" choice in its "goes to" box,
which adds the row and points the answer at it); after a decision, move the
cursor to its first answer; mark unfinished answers more clearly. List rules
go in `lib/chartOps.ts`, as always. Branch: `stage-4-answers`.

### Stage 5 — a step-by-step card walkthrough (built 2026-10-16; SPEC §10b)

**John's idea:** a set of cards, like Backtimer's walkthrough
(`BacktimerWalkthrough.tsx` in clockwheel), that leads people through making a
flowchart in conversational English, and builds the chart in the List and Chart
as they go. Probably bigger cards than Backtimer's, and some a little more
complicated (e.g. asking what the choices are at a decision and where each
leads). Re-plan with John (and Opus) before starting: the questions, their
wording, how the cards handle decisions and loops, and how someone leaves and
comes back. Branch: `stage-5-walkthrough`.

### Before semi-public release (not yet)

- **The Guide:** John rewrites it once the big design elements are finished
  (Stages 4 and 5). Step 6 still says "Open the Chart"; it should mention the
  List | Chart switch.
- **The Flowcharter card on baish.net** (`landing.html` in
  `JohnBaish/clockwheel`): only when John says it's ready for semi-public
  release, not while it's being tested by a few people.

### Parked: moving boxes by hand (was Stage 4)

An idea that may be revisited, not planned. John (2026-10-15): it's neater for
now to let the system lay the chart out. The open questions, if it ever comes
back, are how lines re-route around a moved box and what happens to moved
boxes when the list changes. `Chart.positions` is still in the data shape (and
kept on load by `sanitiseChart`), so nothing needs undoing.
