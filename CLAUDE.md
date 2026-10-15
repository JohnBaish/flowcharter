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

- `design/`: mock-ups and design sources, not app code. Open the HTML files
  from disk after `npm ci` (fonts load from `node_modules` by path).
  `previews/` holds their renders. `shapes.js` is the prototype shape
  geometry. `layout-spike.cjs` is the elkjs test (SPEC §5).
- `src/styles/organic.css`, `global.css`: copied unchanged from clockwheel
  on 2026-10-15. Stage 1 trims Clockmaker-only rules from `global.css`.

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
library wording (SPEC §9).

**Left alone:** no app code yet. Nothing in clockwheel was changed.

**Verified:** previews rendered in Chromium (Playwright) at 1200px and at
390px with touch emulation. Brand fonts were confirmed loaded, there was no
sideways scroll at 390px, and there were no script errors.
