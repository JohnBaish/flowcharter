I'd like to think about bringing two ideas across from Flowcharter to Clockmaker. Please don't change anything until I've decided.

First, read Clockmaker's CLAUDE.md and HOUSE-STYLE.md as usual. Then read the handover file from my Flowcharter repo: `design/handover-clockmaker-2026-10-18.md` on the `main` branch of `JohnBaish/flowcharter` (add that repo to the session if you need to; it's read-only for this job, and please don't change anything in it).

The two ideas are:

1. A warning when Clockmaker has been changed in another browser tab, so one tab can't quietly overwrite the other's saved work (Flowcharter's 7.1).
2. My number rule: one to nine as words, 10 and above as digits, with the decisions I made about where it doesn't apply.

The handover explains what we did in Flowcharter and why, and which parts might not suit Clockmaker. It was written without looking at Clockmaker's code, so please check what Clockmaker really does before suggesting anything.

Please start by telling me plainly what you find for each idea: for the tabs, what happens today when two tabs are open and edited, and how likely that is in practice; for the numbers, every place Clockmaker shows a number in its words, listed with the surrounding context and grouped as in the handover, and what each would become. Then we'll go through them one at a time, and I'll decide. Also tell me whether the number rule should be added to the house style in clockwheel, but don't edit it yet.

As usual: plain explanations, British spelling, a branch rather than main, and the usual checks in a real browser at 1200px and at 390px with touch before anything goes live. I'll tell you when to merge.
