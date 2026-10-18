# Handover for Clockmaker: what came out of Flowcharter's "section 7" discussion

Written 2026-10-18, in the Flowcharter repo (`JohnBaish/flowcharter`), for a
thread working on Clockmaker (repo `JohnBaish/clockwheel`). Nothing in
clockwheel was touched. **This is a list of ideas for John to judge, not a to-do
list.** Flowcharter's code is the working example; Clockmaker's data and screens
differ, so everything below needs checking against Clockmaker before it is
proposed. I (the Flowcharter thread) have not read Clockmaker's current code,
so where I say "probably", that is a guess to verify.

Flowcharter's changes are on `main` at the merge of branch
`claude/epic-brahmagupta-muah7v` (commits `71c9941`, `7c2cbd2`, `8a89543`).
Their log entries are at the end of Flowcharter's `CLAUDE.md`.

How John works (also in `HOUSE-STYLE.md`): he is not a developer, so explain
plainly and briefly, use British spelling, show context before changing
anything, agree before building, and merge to `main` only when he says so.

---

## 1. Two browser tabs overwriting each other's saves (Flowcharter 7.1): likely relevant

**The problem.** If the tool is open in two tabs and you edit in both, each tab
saves its whole copy over the other's. Whichever saved last wins, and the other
tab's changes are lost on reload. Flowcharter's earlier review noted that
Clockmaker behaves the same way (I have not re-checked this). It is rare for
one person working alone, so it is John's call whether it is worth doing.

**What John chose for Flowcharter.** A message with a Reload button, not a
quiet refresh. A quiet refresh could change the screen under someone who is
typing, so it was ruled out. The bar reads:

> Flowcharter was changed in another tab. Reload to see the changes. Until you
> do, this tab won’t save anything.

(Dark bar across the top of the page, one row on a computer, stacked on a
phone, Reload button 44px tall there, hidden when printing.) In Clockmaker it
would say "Clockmaker". John approved this wording for Flowcharter, not for
Clockmaker, so it is his to confirm.

**How it works** (Flowcharter: `src/state/store.tsx`, `src/lib/exchange.ts`,
`src/App.tsx`, `.stale-bar` in `src/styles/global.css`):

1. Browsers send a `storage` event to a tab when *another* tab changes
   `localStorage`. They never send it for the tab's own saves, and not when
   the new value is identical to the old one.
2. The tab compares the new saved copy with its own in-memory copy
   (`savedCopyDiffers`). Only **the person's work** is compared, not which
   screen or item is open, because moving between screens is saved too and
   should not trigger a warning.
3. If the work differs, the tab shows the bar **and stops saving**. This is
   the important design point. Without it, the older tab saves its stale copy
   over the newer one the moment someone just clicks around in it, so the
   warning would come too late. The cost is that anything done in the older
   tab after the warning isn't kept, which is why the bar says so.
4. Reload re-reads the saved copy; the bar goes and saving resumes.

**Things learned that would save time:**

- Compare with a *sorted-key* JSON (`stableJson`), so the same data built in a
  different field order isn't seen as a change. Run the other tab's saved text
  through the same repair/sanitise step the app uses on load before comparing,
  so both sides are in the same shape.
- Unreadable or missing saved text means "nothing to warn about", not a
  warning.
- Keep a ref to the latest state for the listener to compare against, and add
  the listener once (an effect with no dependencies).
- **Known tiny gap:** if a second tab is opened in the very same instant the
  first one saves, the newer copy can be overwritten and the first tab may
  show the bar. The window is a few milliseconds. Skipping the save on first
  load would close it, but changes when first-visit data is first saved, so I
  left it.
- **Not checked:** Safari and real iPhones. Safari's private windows may not
  share storage between tabs at all, so the bar might never appear there.
- Testing in a browser: open **two pages in one Playwright browser context**
  (they share storage), edit in one, and look at the other. Wait about half a
  second after the second page loads before editing, or its start-up save can
  look like a change. Test: no bar in the tab that edited; bar in the other;
  moving between screens in the older tab doesn't overwrite the edit; Reload
  clears it; saving works again afterwards; a screen change alone gives no
  bar; the bar's layout at 1200px and at 390px with touch.
- One check was added (`savedCopyDiffers` in `scripts/check-chart-ops.ts`):
  same copy, another screen only, different field order, edited rows, removed
  item, missing and damaged text.

**What would differ in Clockmaker (check):** its storage key and saved shape;
what counts as "the person's work" versus navigation; whether it has the same
kind of repair step on load; whether a running clock or timer saves
continuously (which would make "saved elsewhere" more likely to fire and
needs thought); where the bar would sit relative to its header.

---

## 2. Number style: one to nine as words, 10 and above as digits: probably relevant

John's rule applies to numbers in running text across his tools. Flowcharter's
`lib/words.ts` has `numberWord(n)` (2 → "two", 12 → "12"), `ordinalWord(n)`
(1 → "first", 12 → "12th") and `capitalise`. John went through every case in
Flowcharter and decided as follows. **The logic is the useful part**, because
Clockmaker's cases will be different:

| Kind of number | Decision | Flowcharter examples |
|---|---|---|
| A number **counted inside a sentence** (pop-up boxes, messages, explanatory text) | Follows the rule | "Clear all eight items…", "is where three other routes lead", "replace the four flowcharts … with the two in this file", "leading to two steps". 10 and above stay digits: "all 12 items". |
| **Names, labels and controls**: anything that must match what is on screen | Stay digits | Row numbers, answer codes like "2a", "Item 2", "3 · Book the backup", a box you type a number into, the numbered answer boxes. |
| **Times and dates** | Stay digits | "saved 5 min ago", "3 hr ago", "18 Oct". |
| **Short count tags** (small pill labels) | Left as digits. These are not sentences, and John chose to leave them. | "8 items · 2 questions", "3 charts", "3 steps so far". |

Also:

- **Singular wording is chosen for readability, not mechanically.** For one
  row, the rule would give "the one item", which reads oddly and can sound as
  if one particular item was picked out of several. John chose **"the only
  item"**.
- **How the check was done:** search every file that holds words people see
  (screens, components, helper functions that build messages) for numbers in
  text, including numbers built into messages by code (`${count}`), then list
  every case with its surrounding words and what it would become under the
  rule, grouped as in the table, and **show John before changing anything**. He
  answered group by group. Pop-up boxes are the browser's own, so test them by
  reading the dialog's text in the browser.
- **Likely Clockmaker candidates to look at** (guesses, not seen): messages
  that count segments or clocks in confirmation boxes; count tags such as
  "18 segments"; durations and clock times (probably stay digits, as times);
  the Guide's wording; import/export messages.
- **The rule isn't written into `HOUSE-STYLE.md` yet.** The master copy of the
  house style lives in clockwheel. Whether to add this rule there (so it
  reaches all the tools) is John's decision. Flowcharter only recorded it in
  its own `CLAUDE.md` key points.

---

## 3. Repeated answer names (Flowcharter 7.2): probably not relevant

In Flowcharter, a question can have two answers with the same name. John
chose to keep allowing it, but to point it out gently (a note under the answers
in the List and on the cards, and "This is the first of them" on the cards).
This is specific to flowchart questions and their answers. The only possible
parallel is if Clockmaker lets two things share a name where that could
confuse someone (for example two segments with the same name when one is
referred to by name in a message). Worth a quick look; otherwise skip.

---

## 4. Decided in Flowcharter and not relevant to Clockmaker

- **7.3** (a step set to "ends here" counts as finished on the step-by-step
  cards): John chose to leave it. Flowchart-specific.
- **7.4** (coming back to the cards starts at the first loose end rather than
  the exact card): John chose to leave it. Flowchart-specific.

---

## Suggested way to work through this with John

1. Check what Clockmaker actually does about two tabs, without changing
   anything, and tell John plainly what you see (and whether it is rare enough
   to leave).
2. Run the number-style check as described in section 2, and show him the
   cases grouped before changing anything.
3. Ask whether the number rule should go into `HOUSE-STYLE.md` in clockwheel.
4. Only then build, on a branch, with the usual checks (build, lint, the
   project's own checks, a real browser at 1200px and 390px with touch, say
   what couldn't be checked, add a dated log entry), and merge only when John
   says so.
