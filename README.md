# Flowcharter

**Create a flowchart from a list.** Type your steps row by row, say what sort of
step each one is, and Flowcharter draws the flowchart. A free-to-use personal
project by John Baish, for `flowcharter.baish.net`.

Everything is saved in your own browser; there is no backend.

- `SPEC.md` is what it does, `PLAN.md` is the staged build, `CLAUDE.md` is the
  working notes and dated log, and `HOUSE-STYLE.md` is the look shared with
  Clockmaker and Backtimer.
- Stack: Vite + React + TypeScript.

```
npm ci
npm run dev      # run it locally
npm run build    # type-check and build
npm run lint
npm run check    # tests the list's rules and the chart layout
```
