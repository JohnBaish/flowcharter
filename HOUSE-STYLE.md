# baish.net house style

The shared look, behaviour and ways of working behind John Baish's tools
(Clockmaker, Backtimer, the baish.net landing page), written so a new
project — starting with **Flowcharter** — can match them without
re-deriving anything. Everything here is taken from what is live in this
repo (`JohnBaish/clockwheel`) as of 2026-10-18.

**Rule of thumb: copy, don't reinvent.** Copy the files listed below into
the new project and build on them. If something here and the code
disagree, the code is right; update this file.

`CLAUDE.md` in this repo is the full dated history of Clockmaker and
Backtimer — long, and mostly about those apps. Read it only for the
"why" behind a specific decision.

---

## 1. Files to copy into a new project

| File | What it gives you |
|---|---|
| `src/styles/organic.css` | The design system: colour, type, spacing, radius and shadow tokens, plus buttons, inputs, cards, tags, nav, tables. Self-hosted fonts are imported at the top. |
| `src/styles/global.css` | App-level additions: `.plain-input` / `.outlined-input` (edit-in-place boxes), `.link-card`, `.list-cards` (phone list layout), the hamburger nav at ≤720px, iPhone no-zoom and 44px tap-height rules, print rules (`[data-noprint]`, `.print-only`). Drop the Clockmaker-specific bits (`.week-*`, `.library-clock-name`, `.callout-label`, `.print-clock-card`). |
| `src/lib/icons.tsx` | Pattern for icons: Lucide (`lucide-react`) wrapped at stroke width **2.75**. |
| `src/lib/responsive.ts` | `useIsNarrow(720)` — the phone/computer switch. |
| `src/lib/timeInput.ts` | Phone keyboard helpers (`isTouch`, `toColon`, `selectAllSoon`). Only if the new tool has time or number entry. |
| `src/lib/useDragReorder.ts` | Drag-to-reorder by a grip handle, mouse and touch. Only if needed. |
| `src/lib/words.ts` | `numberWord` / `countOf`: the number rule for running text (§13). |
| `src/lib/staleCopy.ts` and `.stale-bar` in `global.css` | The "changed in another tab" warning (§14). The matching code in `state/store.tsx` and `App.tsx` is small; copy the pattern. |
| `public/favicon*.svg` | Favicon style to adapt (see §7). |
| `design/og-clockmaker.html` | Link-preview image source; use it as the template for a new tool (see §7). |
| `SEO-HANDOVER.md` | How search (titles, descriptions, canonical, robots.txt/sitemap, visible text, Search Console) was done, with a checklist for each new tool (see §12). |
| `HOUSE-STYLE.md` and `.claude/skills/fresh-look/` | This file, and the "fresh look" review procedure with its PDF template and script (see §11). Copy both into every project, new or existing. |

Dependencies these rely on: `@fontsource/caprasimo`, `@fontsource/figtree`,
`lucide-react`, React. Stack is **Vite + React + TypeScript**, `oxlint`
for linting, no backend.

## 2. Colour

Core tokens (all in `organic.css` `:root`):

| Token | Value | Used for |
|---|---|---|
| `--color-bg` | `#f5ead8` cream | page background |
| `--color-surface` | `#ebddc5` | cards, nav bar, inputs being edited |
| `--color-text` | `#201e1d` ink | text |
| `--color-accent` | `#c67139` terracotta | primary buttons, links, focus rings, kickers |
| `--color-accent-2` | `#7a8a5e` olive | secondary accent (rarely used) |
| `--color-divider` | ink at 16% | hairlines, button outlines |

Each of neutral, accent and accent-2 has a 100–900 ramp
(`--color-neutral-700` `#645c50` is the standard muted text colour;
`--color-accent-700` `#8c491a` is the darker terracotta used for
text-style action buttons and links). Light theme only — there is no
dark mode.

## 3. Type

- **Headings and buttons:** Caprasimo, weight 400 — the only weight that
  exists. Don't ask for bold or italic Caprasimo: the browser fakes it and
  John found the result "mushy".
- **Body:** Figtree 400 / 600 / 700, base size 15px, line-height 1.55.
- Heading sizes: h1 42, h2 32, h3 25, h4 20 (px).
- Both fonts are **self-hosted** through `@fontsource` (imported at the top
  of `organic.css`), never loaded from Google Fonts — that would send every
  visitor's IP address to Google. This was a deliberate privacy decision.
- Numbers that line up in columns get `.mono` (tabular figures).

## 4. Spacing, shape, elevation

- Spacing: `--space-1` 4.4, `-2` 8.8, `-3` 13.2, `-4` 17.6, `-6` 26.4,
  `-8` 35.2 (px). Most gaps are `-2` to `-4`.
- Radius: `--radius-sm` 8, `--radius-md` 16, `--radius-lg` 28.
- Shadows: `--shadow-sm/md/lg`, soft and ink-tinted.

## 5. Layout and components

**Page frame**
- Nav bar: `--color-surface` background, padding `--space-3` × `--space-6`.
  Brand name on the left in Caprasimo 18px; links on the right, 14px,
  terracotta when current. At ≤720px the links collapse behind a hamburger
  (`.nav-menu-toggle` / `.nav-panel`); a tool with only one screen skips
  the hamburger entirely.
- Content column: max-width **1100px**, centred; each screen has padding
  `0 var(--space-6) var(--space-6)`.
- Page header: a small uppercase terracotta kicker (`.card-kicker`, 10px,
  letter-spaced) above an `h2`.
- Action row (top right of a screen): text-style buttons —
  `btn btn-ghost` in `--color-accent-700` with a 15px Lucide icon, e.g.
  "🖨 Print", "+ Add item"; destructive ones ("Clear") in
  `--color-neutral-700`. Print lives on each screen that can print, not in
  the nav.

**Buttons** (`.btn` + one of): `btn-primary` (terracotta fill, cream text —
the main action, e.g. Next/Done), `btn-secondary` (hairline outline —
e.g. Duplicate, the full-width "+ Add item" under a phone list),
`btn-ghost` (text only — light actions). All rounded `--radius-md`,
Caprasimo 14px.

**Cards:** `.card` — surface background, radius 16, padding `--space-3`
(use `--space-6` when a card holds paragraphs, so text clears the rounded
corners). `.card-kicker`, `.card-title`, `.card-body` inside.

**Tags / chips:** `.tag` + `tag-neutral` / `tag-accent` — small rounded
pills for counts and status ("2 items", "saved just now").

**Tables:** `.table` — uppercase 11px headers, faint row lines, row hover.
Fixed column widths rather than stretching to full width.

**Edit-in-place boxes:** `.plain-input` looks like plain text until hovered
or focused (accent border + surface fill when editing). Add
`.outlined-input` where a box should always look editable (durations).

**Footer notice** (bottom of a tool's main screen):
`marginTop: 64`, `paddingTop: var(--space-3)`, top border
`1px solid var(--color-divider)`, 12px text, line-height 1.6,
`--color-neutral-700`, centred, `data-noprint`. Links in it are
`--color-accent-700`, underlined.

**Step-through cards** (Backtimer's getting-started walkthrough,
`src/components/BacktimerWalkthrough.tsx`): a `.card` with a border and
`0 12px 32px` shadow; "Step N of M" kicker with **Skip** top right; title
in Caprasimo 20px; one question, one box, one "You can change this later
in…" line; **Back** (ghost) and **Next/Done** (primary) bottom right;
"Don't show this again" tickbox. On a computer it sits in the page under
the content; on a phone it sits at the top (see §6).

**Confirmations:** destructive actions with no undo (Clear, Delete) use a
plain `window.confirm()` that says exactly what will be lost.

## 6. Phones (≤720px)

Every screen must work on a 390px-wide phone with no sideways scrolling.

- Use `useIsNarrow(720)` to render genuinely different markup when needed
  (e.g. a table on a computer, a stack of `.list-card`s on a phone) —
  render one or the other, never both hidden with CSS.
- Text in input boxes is **16px** on phones, or iPhone zooms the page when
  a box is tapped (handled by `global.css` for `.plain-input` and `.input`;
  anything with an inline font size needs it set explicitly).
- Tap targets at least **44px** tall. A small icon button (e.g. a bin on a
  phone card) can keep its small icon inside a 44px tap area
  (`.list-card-delete` in `global.css`).
- **Phones have no Shift key.** Where Shift-click adds to a selection on a
  computer, make a tap add or remove that item on a touch screen.
- **Back must stay inside the tool.** If a tool has more than one screen,
  give each its own address (`…/#week`, see `src/lib/screenHash.ts`), so
  the phone's Back gesture returns to the previous screen instead of
  leaving the site.
- **Keyboards only open when focus happens during a tap.** If a button
  should open the keyboard (Add, Next), update state with `flushSync` and
  focus the new box inside the same click handler. Never auto-focus a box
  on page load on a touch screen — it looks ready to type but no keyboard
  appears.
- Time/number boxes: `inputMode="decimal"` (digits keypad with a "." key)
  and convert "." / "," to ":" as typed (`toColon`). The number keypad
  has no ":" and no Return key.
- Phones have no Tab key: if Tab adds a row on a computer, give phones a
  visible button for it (a full-width "+ Add …" under the list).
- Keep important buttons in the top ~60% of the screen while a keypad is
  open (it covers roughly the bottom 40%).
- Drag-to-reorder uses `useDragReorder` on a grip handle only (never the
  browser's own drag-and-drop, which ignores touch).

## 7. Icons, favicons and link previews

**Favicons** are hand-written SVGs on a 48×48 viewBox: a circle `r="21"`,
either cream fill with a 2.5px terracotta ring (Clockmaker, baish.net) or
solid terracotta (Backtimer), with two 4.5px round-capped strokes in ink and
terracotta/cream. Each tool gets its own variation on that recipe, so they
read as a family but are easy to tell apart in a row of browser tabs.
Check every new one at a real 16px before using it.

**Link-preview images** (`og:image`, 1200×630): cream background,
illustration 440×440 at (96, 95), tool name in Caprasimo 72px and a
one-line tagline at (592, 225). Start from `design/og-clockmaker.html`
(`design/` also holds the Backtimer and baish.net sources).
Both fonts must be loaded from `node_modules` by file path — loading from
Google Fonts fails silently without network access and the title falls
back to a plain serif (this happened once). Each HTML entry point needs
its own `og:title`, `og:description`, `og:image`, `og:url` and `twitter:*`
tags; any tagline baked into the image must be updated too whenever the
description changes.

**Status (2026-10-15): done for every existing site.** Clockmaker,
Backtimer and baish.net all have finished preview images, rebuilt from the
`design/` sources with both brand fonts, and their tags are in place
(baish.net: title "baish.net", description "John Baish’s websites"). A new
tool like Flowcharter only needs its own image: copy
`design/og-clockmaker.html`, swap the drawing and words, screenshot it,
and add its tags. Nothing else needs fixing or remaking first.

## 8. Data and privacy

- No accounts and no backend. Everything a person makes is saved
  automatically in their own browser (`localStorage`), with Export /
  Import of a JSON file for backups and moving between devices.
- Once a tool is live, **never rename its storage key** — that would make
  every existing user's work silently disappear.
- Vercel Web Analytics is on (anonymous visit counts, no cookies):
  `<Analytics />` from `@vercel/analytics/react` in React entry points,
  `inject()` from `@vercel/analytics` in non-React pages.
- Privacy wording is scoped to the person's content, not "your data"
  generally, because visit statistics *are* collected. Approved wording,
  for reuse:
  - "The clocks you build here are not collected; they're only saved in
    your browser. We collect anonymous visit statistics (no cookies, no
    personal data) to see how the site is used."
  - "The data you enter here is not collected; it's only saved in your own
    browser and you can clear it at any time."
- Each tool says it is "a free-to-use personal project by John Baish" and
  gives the shared contact address `workshop@baish.net` (one address for
  every tool, since 2026-10-17), as plain text, not a mailto link.

## 9. Hosting

- GitHub (`JohnBaish/…`) → Vercel, which deploys `main` automatically.
- Each tool lives at its own `*.baish.net` subdomain. John adds domains in
  Vercel and DNS himself; ask Vercel's dashboard for the exact DNS record.
- One Vercel project can serve several domains from one build (this repo
  serves clockmaker, backtimer and baish.net, chosen by hostname in
  `src/lib/hostMode.ts` and `middleware.ts`). For a large new tool a
  separate repo and Vercel project is cleaner.
- The baish.net landing page (`landing.html` here) has a card per tool;
  add one for each new tool when it goes live, and update the hub's
  `<title>` and search description to match (see §12).

## 10. Working with John

- John is not a developer. Explain in plain English, briefly, and say what
  he needs to do (if anything) and what to expect.
- He decides wording; draft text for him to edit, and use his words
  exactly once agreed. British spelling ("colour", "visualise").
  "Out-time" is hyphenated.
- Propose and agree before building anything significant. For images and
  icons, show a rendered preview for approval before wiring it in.
- Build new features on a **branch**, not `main`. Vercel gives every
  branch a private preview at
  `https://<project>-git-<branch>-john-baish.vercel.app` (append
  `?host=…` overrides as needed). Merge to `main` only when he says so.
  Small agreed wording fixes can go straight to `main`.
- Check work in a real browser (Playwright) at 1200px and at 390px with
  touch emulation — not just "it builds". Say plainly what couldn't be
  checked (e.g. a real iPhone keyboard).
- Keep a dated entry in the project's `CLAUDE.md` for every change: what,
  why, what was deliberately left alone, how it was verified.
- Ask before anything destructive or outside the repo.

## 11. Fresh look (a full review)

When John asks for a **fresh look** (or types `/fresh-look`), give the whole
project a long, careful review on a computer and a phone, and report back
**without changing anything**. The full procedure is in
`.claude/skills/fresh-look/SKILL.md`. Claude Code loads it as the
`/fresh-look` command in any repo that has the file on `main`. In short:

- Read the notes first, so agreed decisions aren't reported as faults.
  Review the live `main`.
- Use it like a real person at 1200px and at 390px with touch: first visit,
  every screen, realistic and extreme content, abandoning and going back.
  Run an automatic sweep for errors, sideways scrolling and small tap targets.
  Look at every screenshot.
- Read the code for suspects, then prove or drop each one with a targeted
  test. Report nothing unconfirmed without saying so.
- Report in numbered sections and sub-sections. Start with the overall verdict.
  Then for each area give faults first, then usability points, each with
  **size · priority**, "What happens" and "Recommendation" (options where it's a
  choice). Then "Looked at and would leave alone", "What I couldn't check" and
  "Suggested order". Plain English, British spelling.
- Number every point, never bullets, in every section, including "would
  leave alone" and "couldn't check", so John can reply by number.
- "Suggested order" must place **every** numbered item: quick fixes,
  decisions, optional items, or left alone, ending with a coverage line.
  Check this before sending.
- Send the report as an A5 PDF too, in the brand fonts, so John can read it on
  his phone alongside Claude (`report-template.html` and `make-pdf.mjs` sit
  beside the skill).
- Build nothing until John picks. Then log the findings and his decisions in
  `CLAUDE.md`.

Clockwheel holds the master copy of the skill, like this file. If it
changes, re-copy it to the other projects.

## 12. Search (SEO)

Done for Clockmaker, Backtimer and the hub on 2026-10-17; the full record
and a step-by-step checklist for a new tool are in **`SEO-HANDOVER.md`**
(copy it into the new project). In short:
- `<title>` "Name – free <what it is> for <who>" and a search description
  starting "Free …", both John's wording. The search description is
  separate from the link-preview (`og:`) description.
- A canonical tag naming the tool's one main address; the hub's is
  `https://www.baish.net/`. If the app sets `document.title`, it matches.
- robots.txt and a one-address sitemap.xml (plain files in `public/` for a
  one-domain project).
- A short visible explanation a first-time visitor sees, folded parts
  allowed, no FAQ; and "More free tools at www.baish.net." just before
  "Contact:".
- Search Console: one Domain property for baish.net covers every
  subdomain, so a new tool only needs its sitemap submitted and its main
  address inspected and requested.

## 13. Numbers in running text

John's rule: **one to nine as words, 10 and above as digits**, wherever a
number is counted inside a sentence. Decided for Flowcharter (2026-10-18)
and applied to Clockmaker the same day. Check each tool by searching every
file that holds words people see, including messages built in code
(`${count}`), listing every case with its surrounding words, and showing John
before changing anything. Helpers: `numberWord(n)` and `countOf(n, 'hour')`
in `src/lib/words.ts`.

| Kind of number | Rule | Examples |
|---|---|---|
| Counted inside a sentence (pop-up boxes, messages, explanatory text) | Follows the rule | "assigned to three hours … those hours will become unassigned"; "all 12 items" |
| Names, labels and controls: anything that must match what is on screen | Digits | row numbers, "Step 2 of 4", "Mon 06:00", a clock called "Daytime 1", a box you type a number into |
| Times, durations and dates | Digits | "saved 5 min ago", "29:30", "18 Oct" |
| Short count tags (small pill labels) and short count lines | Digits | "3 clocks", "8 songs", "18 segments", "12 of 83 active hours assigned", "used 3 times" |

- **One** is written "one hour", not "the one hour" or "the only hour": the
  latter reads as if it were the single one that exists. (Flowcharter uses
  "the only item" where it really is the only row. Choose for readability,
  not mechanically.) Where a plural verb follows, make it agree: "that hour
  will become unassigned".
- Zero is "zero" only inside a sentence; tags keep "0".

## 14. Two tabs: warn, and stop saving

A tool that saves its whole state to `localStorage` lets an old tab silently
overwrite a newer one (even just by clicking between screens in the old
tab). Pattern, from Flowcharter 7.1 and Clockmaker (2026-10-18):

- The browser sends a `storage` event to a tab only when **another** tab
  changes storage. Compare the new saved text with this tab's own state
  (`savedCopyDiffers`): only the person's **work**, never which screen or item
  is open, and not the last-edited stamp. Compare with sorted keys, and
  treat unreadable or missing text as "nothing to warn about".
- On a difference, show a dark bar across the top ("X was changed in another
  tab. Reload to see the changes. Until you do, this tab won’t save
  anything.") and **stop saving** in this tab. Stopping is the point: a quiet
  refresh could change the screen under someone typing, and warning without
  stopping would still let the next click overwrite the newer copy.
- Hide any "saved … ago" tag while saving is stopped. Bar: one row on a
  computer, stacked on a phone with a 44px Reload button, hidden in print.
- Known tiny gap, accepted: a second tab opened in the same few milliseconds
  as the first one's save can make the first show the bar. Not checkable
  here: Safari and real iPhones.
- Test with two pages in one Playwright browser context (they share
  storage); wait about half a second after the second loads.
