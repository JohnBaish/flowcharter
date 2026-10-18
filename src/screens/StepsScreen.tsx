import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useApp } from '../state/store.tsx';
import { MAX_ITEM_TEXT, MAX_LABEL, MAX_NAME, MAX_ROUTES, MIN_ROUTES, type Item, type ItemId } from '../data/charts.ts';
import { SHAPES, type ShapeType } from '../data/shapes.ts';
import {
  appendStep as withStep, itemLabel, leadsTo, nextOpenSlot, openAnswer, setAnswers as withAnswers, setText as withText, setType as withType, type Slot,
} from '../lib/chartOps.ts';
import { cardRepeatNote, repeatedNameNotes } from '../lib/answerNotes.ts';
import { useIsNarrow } from '../lib/responsive.ts';
import { LiveChart } from '../components/LiveChart.tsx';
import { useBackLayer } from '../lib/backLayers.ts';

// The step-by-step cards (PLAN.md Stage 5; mock-ups in design/mock-cards.html).
// They follow one path to its end, then come back for each answer still
// without a destination. Every answer writes a real row into the List straight
// away, through the same rules as typing (chartOps), so the cards and the List
// are two ways of working on the same chart. All wording is John's to change.

type Kind = 'action' | 'question' | 'data' | 'wait' | 'doc' | 'routine' | 'end';
/** The answer whose path the cards are following, for "That's the Yes path finished." */
type Branch = { q: string; a: string } | null;

type Card =
  | { t: 'choose' }
  | { t: 'name' }
  | { t: 'kind'; slot: Slot; branch: Branch; note?: string; made?: ItemId }
  | { t: 'text'; slot: Slot; branch: Branch; kind: Kind; row?: ItemId }
  | { t: 'answers'; row: ItemId; branch: Branch }
  | { t: 'pick'; slot: Slot; branch: Branch }
  | { t: 'done' };

const TYPE: Record<Kind, ShapeType> = {
  action: 'process', question: 'decision', data: 'io', wait: 'delay', doc: 'document', routine: 'predefined', end: 'terminator',
};

const MAIN: { kind: Kind; label: string; type: ShapeType }[] = [
  { kind: 'action', label: 'Something gets done', type: 'process' },
  { kind: 'question', label: 'We ask a question', type: 'decision' },
  { kind: 'data', label: 'Information comes in or goes out', type: 'io' },
  { kind: 'end', label: "That's the end", type: 'terminator' },
];
const MORE: { kind: Kind; label: string; type: ShapeType }[] = [
  { kind: 'wait', label: 'We wait', type: 'delay' },
  { kind: 'doc', label: 'A document is made or used', type: 'document' },
  { kind: 'routine', label: 'We follow a standard routine', type: 'predefined' },
];

/** What the text card asks, for each kind of step. */
const PROMPT: Record<Kind, { title: string; help?: string; example: string }> = {
  action: { title: 'What gets done?', help: 'Starting with a verb works best.', example: 'Book the backup' },
  question: { title: "What's the question?", help: "Write it the way you'd ask it, so it can be answered simply — usually yes or no.", example: 'Has cover been agreed?' },
  data: { title: 'What information comes in or goes out?', example: 'Receive sick call' },
  wait: { title: 'What are you waiting for?', example: 'Wait for the results' },
  doc: { title: 'Which document is made or used?', example: 'Send the updated rota' },
  routine: { title: 'Which standard routine?', help: 'One that has its own flowchart elsewhere.', example: 'Arrange cover' },
  // An ending can say what the outcome is; "End" is filled in, so Next keeps it (John, 2026-10-17).
  end: { title: 'How does this path end?', help: 'Leave it as “End”, or say what the outcome is.', example: 'Cover arranged' },
};

const INK = '#201e1d';
/** A shape's small picture, as in the key (src/lib/shapes.ts draws the real ones). */
function ShapeIcon({ type, small }: { type: ShapeType | 'back'; small?: boolean }) {
  const w = small ? 24 : 34, h = small ? 17 : 24;
  const fill = type === 'back' ? 'none' : SHAPES[type].fill;
  const p = { fill, stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  const shape: Record<string, ReactNode> = {
    process: <rect x="1" y="3" width="32" height="18" {...p} />,
    decision: <path d="M17 1 L33 12 L17 23 L1 12 Z" {...p} />,
    io: <path d="M7 3 H33 L27 21 H1 Z" {...p} />,
    terminator: <rect x="1" y="3" width="32" height="18" rx="9" {...p} />,
    delay: <path d="M1 3 H24 A9 9 0 0 1 24 21 H1 Z" {...p} />,
    document: <path d="M1 3 H33 V18 C25 14 9 24 1 18 Z" {...p} />,
    predefined: <><rect x="1" y="3" width="32" height="18" {...p} /><path d="M5 3 V21 M29 3 V21" stroke={INK} strokeWidth={1.4} /></>,
    back: <path d="M28 18 H10 V6 M10 6 L5 11 M10 6 L15 11" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />,
  };
  return <svg width={w} height={h} viewBox="0 0 34 24" aria-hidden="true" style={{ flex: 'none' }}>{shape[type]}</svg>;
}

const words = (it: Item | undefined) => (it?.text.trim() || 'the step with no words yet');

export function StepsScreen() {
  const {
    chart, setScreen, renameChart, addItem, setItemText, setItemType, appendStep, linkSlot, setAnswers,
  } = useApp();
  const items = chart?.items ?? [];
  const isNarrow = useIsNarrow(720);

  // The latest rows, readable straight after a change made inside flushSync —
  // the next card depends on what that change produced.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const [history, setHistory] = useState<Card[]>(() => [firstCard(chart?.items ?? [], chart?.name ?? '')]);
  const card = history[history.length - 1];
  const [text, setText] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [peek, setPeek] = useState(false);
  // Back closes Peek, as people expect on a phone (fresh look 6.1).
  useBackLayer(peek, 'peek', () => setPeek(false));
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fill a card's boxes when it appears (also after Back, with what was typed).
  const cardKey = history.length;
  useLayoutEffect(() => {
    const now = itemsRef.current;
    if (card.t === 'name') setText(chart && chart.name !== 'New chart' ? chart.name : '');
    // An ending starts as "End" (or its name, after Back); any other step changed
    // from an End starts empty, not with the word "End" (fresh look 2.2).
    if (card.t === 'text') {
      const row = card.row ? now.find((it) => it.id === card.row) : undefined;
      if (card.kind === 'end') setText(row && row.type === 'terminator' ? row.text : 'End');
      else setText(row && row.type !== 'terminator' ? row.text : '');
    }
    if (card.t === 'answers') setLabels(now.find((it) => it.id === card.row)?.routes.map((r) => r.label) ?? ['Yes', 'No']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey]);

  if (!chart) return null;

  const byId = (id: ItemId) => items.find((it) => it.id === id);
  /** The steps a loose end could go back to: any but the step it comes from. */
  const backTargets = (slot: Slot) => items.filter((it) => !(slot.kind === 'after' && it.id === slot.id));

  /** Shows a card, rendering it at once so its box can be focused inside the
   *  tap — the only way a phone opens its keyboard. */
  const show = (next: Card) => {
    setError(null);
    flushSync(() => setHistory((h) => [...h, next]));
    const el = inputRef.current;
    if (el) { el.focus(); el.select(); }
  };
  const back = () => { setError(null); setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)); };

  /** A path has finished: on to the next loose end, or the last card. */
  const pathEnded = (branch: Branch) => {
    const slot = nextOpenSlot(itemsRef.current);
    const note = branch ? `That's the ${branch.a || 'answer'} path finished.` : "That path's finished.";
    show(slot ? { t: 'kind', slot, branch: branchFor(slot), note } : { t: 'done' });
  };

  /** After a step is written: carry on from it if it's a loose end; if it
   *  already leads somewhere (it was changed after Back), the next loose end. */
  const carryOn = (row: ItemId, branch: Branch) => {
    const now = itemsRef.current;
    const i = now.findIndex((it) => it.id === row);
    const it = now[i];
    if (it && it.type !== 'decision' && it.then.kind === 'next' && leadsTo(now, i) === null) {
      show({ t: 'kind', slot: { kind: 'after', id: row }, branch });
      return;
    }
    const slot = nextOpenSlot(now);
    show(slot ? { t: 'kind', slot, branch: branchFor(slot) } : { t: 'done' });
  };

  const branchFor = (slot: Slot): Branch => {
    if (slot.kind !== 'answer') return null;
    const q = itemsRef.current.find((it) => it.id === slot.id);
    const r = q?.routes.find((x) => x.id === slot.routeId);
    return { q: words(q), a: r?.label.trim() ?? '' };
  };

  // — the actions on each card —

  const startStepByStep = () => show({ t: 'name' });
  const startBlankList = () => {
    flushSync(() => setScreen('list'));
    const name = document.getElementById('chart-name-input') as HTMLTextAreaElement | null;
    if (name) { name.focus(); name.select(); }
  };

  const nameNext = () => {
    renameChart(chart.id, text.trim().slice(0, MAX_NAME) || 'New chart');
    if (itemsRef.current.length === 0) {
      let start = '';
      flushSync(() => { start = addItem(null); setItemText(start, 'Start'); });
      show({ t: 'kind', slot: { kind: 'after', id: start }, branch: null });
      return;
    }
    const slot = nextOpenSlot(itemsRef.current);
    show(slot ? { t: 'kind', slot, branch: branchFor(slot) } : { t: 'done' });
  };

  const chooseKind = (c: Extract<Card, { t: 'kind' }>, kind: Kind | 'back') => {
    const made = c.made && byId(c.made) ? c.made : undefined;
    if (kind === 'back') { show({ t: 'pick', slot: c.slot, branch: c.branch }); return; }
    show({ t: 'text', slot: c.slot, branch: c.branch, kind, row: made });
  };

  const textNext = (c: Extract<Card, { t: 'text' }>) => {
    // An ending left blank is just "End".
    const value = (text.trim() || (c.kind === 'end' ? 'End' : '')).slice(0, MAX_ITEM_TEXT);
    if (!value) { setError('Please type something, or press Back.'); return; }
    const type = TYPE[c.kind];
    let row = c.row && byId(c.row) ? c.row : '';
    flushSync(() => {
      if (row) {
        setItemText(row, value);
        if (byId(row)?.type !== type) setItemType(row, type);
      } else {
        row = appendStep(c.slot, type, value);
      }
    });
    // The kind card below this one now has a step it made; this card has its row.
    setHistory((h) => {
      const out = [...h];
      out[out.length - 1] = { ...c, row };
      const below = out[out.length - 2];
      if (below && below.t === 'kind') out[out.length - 2] = { ...below, made: row };
      return out;
    });
    if (type === 'decision') show({ t: 'answers', row, branch: c.branch });
    else if (type === 'terminator') pathEnded(c.branch);
    else carryOn(row, c.branch);
  };

  const answersNext = (c: Extract<Card, { t: 'answers' }>) => {
    const clean = labels.map((l) => l.trim().slice(0, MAX_LABEL));
    if (clean.some((l) => !l)) { setError('Please give every answer a name, or remove the empty one.'); return; }
    flushSync(() => setAnswers(c.row, clean));
    const slot = openAnswer(itemsRef.current, c.row) ?? nextOpenSlot(itemsRef.current);
    show(slot ? { t: 'kind', slot, branch: branchFor(slot) } : { t: 'done' });
  };

  const pick = (c: Extract<Card, { t: 'pick' }>, to: ItemId) => {
    flushSync(() => linkSlot(c.slot, to));
    pathEnded(c.branch);
  };

  /** Opens the List with the cursor on this step's Type box. */
  const changeInList = (id: ItemId) => {
    const n = itemsRef.current.findIndex((it) => it.id === id) + 1;
    flushSync(() => setScreen('list'));
    const select = document.querySelector<HTMLSelectElement>(`select[aria-label="Type of item ${n}"]`);
    if (select) { select.focus(); select.scrollIntoView({ block: 'center' }); }
  };

  const onEnter = (go: () => void) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); go(); }
  };

  // — what each card says —

  const slotTitle = (c: { slot: Slot; note?: string }): ReactNode => {
    const slot = c.slot;
    const it = byId(slot.id);
    if (slot.kind === 'answer') {
      const r = it?.routes.find((x) => x.id === slot.routeId);
      const a = <em>{r?.label.trim() || 'this answer'}</em>;
      return c.note
        ? <>Now back to <em>{words(it)}</em> If the answer is {a}, what happens next?</>
        : <>If the answer to <em>{words(it)}</em> is {a}, what happens next?</>;
    }
    const i = items.findIndex((x) => x.id === c.slot.id);
    if (i === 0 && it?.type === 'terminator') return 'What happens first?';
    return <>After <em>{words(it)}</em>, what happens next?</>;
  };

  /** When two of a question's answers share a name, which one this card is about (fresh look 7.2). */
  const repeatNote = (slot: Slot): ReactNode => {
    if (slot.kind !== 'answer') return null;
    const it = byId(slot.id);
    if (!it) return null;
    const note = cardRepeatNote(it.routes.map((r) => r.label), it.routes.findIndex((r) => r.id === slot.routeId));
    return note ? <div className="wiz-context">{note}</div> : null;
  };

  const slotContext = (slot: Slot): string => {
    const it = byId(slot.id);
    if (slot.kind === 'answer') {
      const r = it?.routes.find((x) => x.id === slot.routeId);
      return `If the answer is ${r?.label.trim() || 'this answer'}`;
    }
    const i = items.findIndex((x) => x.id === slot.id);
    return i === 0 && it?.type === 'terminator' ? 'The first step' : `After ${words(it)}`;
  };

  // The chart drawn beside the card (or in Peek) includes what's being typed on
  // this card, before Next saves it, so it's never a step behind (John).
  const preview = ((): Item[] => {
    if (card.t === 'text' && text.trim()) {
      const type = TYPE[card.kind];
      if (card.row && byId(card.row)) return withType(withText(items, card.row, text), card.row, type);
      return withStep(items, card.slot, '__draft__', type, text.trim());
    }
    if (card.t === 'answers') return withAnswers(items, card.row, labels.map((l) => l.trim()));
    return items;
  })();

  const count = `${items.length} step${items.length === 1 ? '' : 's'} so far`;
  const kicker = <div className="wiz-kicker">Step by step · {chart.name.trim() || 'Untitled'}</div>;
  const canBack = history.length > 1;

  const foot = (primary?: { label: string; go: () => void }) => (
    // On a phone, Back and the main button share the first line, with the
    // quieter links beneath (fresh look 2.4); on a computer it's all one line.
    <div className="wiz-foot">
      <span className="wiz-count">{count}</span>
      <div className="wiz-foot-links">
        {isNarrow && items.length > 0 && (
          <button className="btn btn-ghost wiz-quiet" onClick={() => setPeek(true)}>Peek at the chart</button>
        )}
        <button className="btn btn-ghost wiz-quiet" onClick={() => setScreen('list')}>Switch to building in List mode</button>
      </div>
      <div className="wiz-foot-main">
        {canBack && <button className="btn btn-ghost wiz-quiet" onClick={back}>Back</button>}
        {primary && <button className="btn btn-primary" onClick={primary.go}>{primary.label}</button>}
      </div>
    </div>
  );

  let body: ReactNode;
  if (card.t === 'choose') {
    body = (
      <>
        <div className="wiz-kicker">New chart</div>
        <h2>How would you like to make it?</h2>
        <p>You can switch to the other way at any time.</p>
        <div className="wiz-big">
          <button className="wiz-choice" onClick={startStepByStep}>
            <ShapeIcon type="decision" />
            <span>Step by step<small>Answer a few questions and the chart builds itself. Good for a first go.</small></span>
          </button>
          <button className="wiz-choice" onClick={startBlankList}>
            <ShapeIcon type="process" />
            <span>Start with a blank list<small>Type the steps in yourself, one row at a time.</small></span>
          </button>
        </div>
      </>
    );
  } else if (card.t === 'name') {
    body = (
      <>
        <div className="wiz-kicker">Step by step</div>
        <h2>What's this flowchart about?</h2>
        <p>Give it a short name. You can change it later.</p>
        <input
          ref={inputRef} data-wiz-input className="wiz-field" value={text} maxLength={MAX_NAME}
          placeholder="e.g. Backup newsreader" aria-label="Flowchart name"
          onChange={(e) => setText(e.target.value)} onKeyDown={onEnter(nameNext)}
        />
        {error && <div className="wiz-error">{error}</div>}
        {foot({ label: 'Next', go: nameNext })}
      </>
    );
  } else if (card.t === 'kind') {
    const c = card;
    const made = c.made ? byId(c.made) : undefined;
    // A question whose answers already lead to steps can only be reworded here:
    // turning it into another kind would leave those steps stranded out of
    // sight, so that's done in the List, where they show (fresh look 2.3).
    const ledTo = made && made.type === 'decision'
      ? new Set(made.routes.map((r) => r.to).filter((to) => to && items.some((it) => it.id === to))).size
      : 0;
    const locked = ledTo > 0;
    body = (
      <>
        {kicker}
        {/* Read first: the path just finished, then the question that comes back. */}
        {c.note && <div className="wiz-context">{c.note}</div>}
        <h2>{slotTitle(c)}</h2>
        {repeatNote(c.slot)}
        {made && !locked && <p>You chose <strong>{words(made)}</strong> here. Pick again to change it.</p>}
        {made && locked && (
          <div className="wiz-locked">
            <p>
              <strong>{words(made)}</strong> already has answers leading to {ledTo} step{ledTo === 1 ? '' : 's'}. To reword
              the question or change its answers, choose <strong>We ask a question</strong> below. To make it a different
              kind of step, change it in List mode, where you can decide what happens to its answers.
            </p>
            <button className="btn btn-secondary" onClick={() => changeInList(made.id)}>Change it in List mode</button>
          </div>
        )}
        <div className="wiz-choices">
          {MAIN.map((m) => (
            <button
              key={m.kind} className={`wiz-choice${locked && m.kind === 'question' ? ' wiz-choice-open' : ''}`}
              onClick={() => chooseKind(c, m.kind)} disabled={locked && m.kind !== 'question'}
            >
              <ShapeIcon type={m.type} />{m.label}
            </button>
          ))}
        </div>
        <div className="wiz-more-label">More</div>
        <div className="wiz-more">
          {MORE.map((m) => (
            <button key={m.kind} className="wiz-pill" onClick={() => chooseKind(c, m.kind)} disabled={locked}>
              <ShapeIcon type={m.type} small />{m.label}
            </button>
          ))}
          {/* Not on the very first step: there's nothing earlier to go back to (fresh look 2.1). */}
          {backTargets(c.slot).length > 0 && (
            <button
              className="wiz-pill" onClick={() => chooseKind(c, 'back')} disabled={!!made}
              title={made ? `To remove “${words(made)}”, use List mode` : undefined}
            >
              <ShapeIcon type="back" small />It goes back to an earlier step
            </button>
          )}
        </div>
        {/* Phones don't show hover text, so say why it's greyed out (fresh look 2.5). */}
        {made && !locked && backTargets(c.slot).length > 0 && (
          <p className="wiz-note">
            “It goes back to an earlier step” isn't available here, because <strong>{words(made)}</strong> has already been
            added. To remove it, use List mode.
          </p>
        )}
        {foot()}
      </>
    );
  } else if (card.t === 'text') {
    const c = card;
    const pr = PROMPT[c.kind];
    body = (
      <>
        {kicker}
        <div className="wiz-context">{slotContext(c.slot)}</div>
        {repeatNote(c.slot)}
        <h2>{pr.title}</h2>
        {pr.help && <p>{pr.help}</p>}
        <input
          ref={inputRef} data-wiz-input className="wiz-field" value={text} maxLength={MAX_ITEM_TEXT}
          aria-label={pr.title} onChange={(e) => setText(e.target.value)} onKeyDown={onEnter(() => textNext(c))}
        />
        <div className="wiz-hint">e.g. <em>{pr.example}</em></div>
        {error && <div className="wiz-error">{error}</div>}
        {foot({ label: 'Next', go: () => textNext(c) })}
      </>
    );
  } else if (card.t === 'answers') {
    const c = card;
    const q = byId(c.row);
    body = (
      <>
        {kicker}
        <h2>What are the possible answers to <em>{words(q)}</em></h2>
        <p>Change the words if you need to. Most questions just need Yes and No.</p>
        <div className="wiz-answers">
          {labels.map((l, i) => (
            <div key={i} className="wiz-answer">
              <span className="wiz-n">{i + 1}</span>
              <input
                ref={i === 0 ? inputRef : undefined} value={l} maxLength={MAX_LABEL} aria-label={`Answer ${i + 1}`}
                onChange={(e) => setLabels((ls) => ls.map((x, j) => (j === i ? e.target.value : x)))}
                onKeyDown={onEnter(() => answersNext(c))}
              />
              {labels.length > MIN_ROUTES && (
                <button className="btn btn-ghost wiz-quiet" aria-label={`Remove answer ${i + 1}`}
                  onClick={() => setLabels((ls) => ls.filter((_, j) => j !== i))}>Remove</button>
              )}
            </div>
          ))}
        </div>
        {labels.length < MAX_ROUTES && (
          <button className="btn btn-ghost" style={{ color: 'var(--color-accent-700)', paddingLeft: 0, marginTop: 6 }}
            onClick={() => setLabels((ls) => [...ls, ''])}>+ Add another answer</button>
        )}
        {repeatedNameNotes(labels).map((n) => <p key={n} className="wiz-note">{n}</p>)}
        {error && <div className="wiz-error">{error}</div>}
        {foot({ label: 'Next', go: () => answersNext(c) })}
      </>
    );
  } else if (card.t === 'pick') {
    const c = card;
    body = (
      <>
        {kicker}
        <div className="wiz-context">{slotContext(c.slot)}</div>
        {repeatNote(c.slot)}
        <h2>Which step does it go back to?</h2>
        <p>Choose the step it loops back to, or joins up with.</p>
        <div className="wiz-picks">
          {backTargets(c.slot).map((it) => (
            <button key={it.id} className="wiz-pill" onClick={() => pick(c, it.id)}>{itemLabel(items, items.indexOf(it))}</button>
          ))}
        </div>
        {foot()}
      </>
    );
  } else {
    body = (
      <>
        {kicker}
        <h2>That's every path covered.</h2>
        <p>
          Your flowchart has {items.length} step{items.length === 1 ? '' : 's'}. You can change anything in the List,
          and see it drawn on the Chart.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={() => setScreen('chart')}>See your chart</button>
          <button className="btn btn-secondary" style={{ padding: '10px 20px' }} onClick={() => setScreen('list')}>Go to the List</button>
        </div>
        {canBack && <div className="wiz-foot"><span className="wiz-count">{count}</span><button className="btn btn-ghost wiz-quiet" onClick={back}>Back</button></div>}
      </>
    );
  }

  return (
    <div className="wiz-wrap">
      <div className="wiz-card" key={cardKey}>{body}</div>
      {!isNarrow && items.length > 0 && (
        <div className="wiz-side">
          <h3>Your chart so far</h3>
          <LiveChart items={preview} title={chart.name} />
        </div>
      )}
      {/* On a phone the chart opens over the whole screen: below the card it was
          out of sight, so "Peek" seemed to do nothing (John, on his iPhone). */}
      {isNarrow && peek && items.length > 0 && (
        <div className="wiz-peek" role="dialog" aria-label="Your chart so far">
          <div className="wiz-peek-head">
            <h3>Your chart so far</h3>
            <button className="btn btn-primary" onClick={() => setPeek(false)}>Back to the questions</button>
          </div>
          <LiveChart items={preview} title={chart.name} />
        </div>
      )}
    </div>
  );
}

/** Where the cards start: a brand-new chart asks how to make it; an empty one
 *  asks its name; otherwise they pick up at the first loose end. */
function firstCard(items: Item[], name: string): Card {
  if (items.length === 0) return name === 'New chart' ? { t: 'choose' } : { t: 'name' };
  const slot = nextOpenSlot(items);
  if (!slot) return { t: 'done' };
  if (slot.kind !== 'answer') return { t: 'kind', slot, branch: null };
  const q = items.find((it) => it.id === slot.id);
  const r = q?.routes.find((x) => x.id === slot.routeId);
  return { t: 'kind', slot, branch: { q: words(q), a: r?.label.trim() ?? '' } };
}
