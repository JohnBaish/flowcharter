import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useApp } from '../state/store.tsx';
import { SHAPES, SHAPE_ORDER, type ShapeType } from '../data/shapes.ts';
import { MAX_ITEM_TEXT, MAX_LABEL, MAX_ROUTES, MIN_ROUTES, type Item, type Next, type Route } from '../data/charts.ts';
import { countReferences, itemLabel, leadsTo, routeLetter } from '../lib/chartOps.ts';
import { focusItemText, selectAllSoon } from '../lib/focus.ts';
import { useDragReorder } from '../lib/useDragReorder.ts';
import { useIsNarrow } from '../lib/responsive.ts';
import { IconGrip, IconPlus, IconTrash } from '../lib/icons.tsx';

const NARROW = 720;

export function ListScreen() {
  const {
    chart, addItem, removeItem, reorderItems, setItemText, setItemType, setItemThen,
    setRouteCount, setRouteLabel, setRouteTo, clearItems,
  } = useApp();
  const items = chart?.items ?? [];
  const isNarrow = useIsNarrow(NARROW);
  // The route-count box can be empty or half-typed; it only commits once it's a valid number.
  const [countDrafts, setCountDrafts] = useState<Record<string, string>>({});
  const drag = useDragReorder(items.length, reorderItems);

  // Adds a row and focuses its text box inside the same tap or keypress, so a
  // phone opens its keyboard (it won't for focus that happens afterwards).
  const addAndFocus = (afterId: string | null) => {
    let id = '';
    flushSync(() => { id = addItem(afterId); });
    focusItemText(id);
  };

  const handleDelete = (item: Item, index: number) => {
    const n = countReferences(items, item.id);
    if (n > 0) {
      const label = item.text.trim() ? ` "${item.text.trim()}"` : '';
      const message = `Item ${index + 1}${label} is where ${n} other ${n === 1 ? 'route leads' : 'routes lead'}. `
        + `If you delete it, ${n === 1 ? 'that route' : 'those routes'} will need a new destination.\n\nDelete it?`;
      if (!window.confirm(message)) return;
    }
    removeItem(item.id);
  };

  // Clearing has no undo, so it asks first and says exactly what will go.
  const handleClear = () => {
    if (!chart) return;
    const n = items.length;
    const what = n === 1 ? 'the 1 item' : `all ${n} items`;
    const name = chart.name.trim() || 'this flowchart';
    if (window.confirm(`Clear ${what} from "${name}"? This can't be undone.`)) clearItems();
  };

  // The strip above the list, as Clockmaker's ("18 segments · drag to reorder"
  // on the left, "+ Add segment" on the right).
  const toolbar = (
    <div data-noprint="1" className="list-toolbar">
      <span className="list-toolbar-note">Drag to reorder</span>
      <button className="btn btn-ghost" onClick={() => addAndFocus(null)} style={{ marginLeft: 'auto', color: 'var(--color-accent-700)' }}>
        <IconPlus size={15} />Add item
      </button>
      <button
        className="btn btn-ghost"
        onClick={handleClear}
        disabled={items.length === 0}
        title={items.length === 0 ? 'The list is already empty' : 'Remove every item from this list'}
        style={{ color: 'var(--color-neutral-700)' }}
      >
        Clear
      </button>
    </div>
  );

  // Enter adds the next row; Up/Down move between rows' text boxes.
  const itemKeyDown = (item: Item, index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    // (Not while an accented-letter or other input-method keyboard is still composing.)
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      addAndFocus(item.id);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const target = items[index + (e.key === 'ArrowUp' ? -1 : 1)];
      if (target) { e.preventDefault(); focusItemText(target.id); }
    }
  };

  // — pieces shared by the computer table and the phone cards —

  // A text box can't wrap long wording and would cut it off on paper, so a
  // printout shows the wording as plain text instead (the box is hidden then).
  const itemInput = (item: Item, index: number, extraStyle?: object) => (
    <>
      <input
        data-item-input={item.id}
        className="plain-input list-text-input"
        style={{ fontWeight: 600, ...extraStyle }}
        value={item.text}
        maxLength={MAX_ITEM_TEXT}
        aria-label={`Item ${index + 1}`}
        onChange={(e) => setItemText(item.id, e.target.value)}
        onKeyDown={itemKeyDown(item, index)}
      />
      <span className="print-only" style={{ fontWeight: 600 }}>{item.text}</span>
    </>
  );

  const typeSelect = (item: Item, index: number) => (
    <span className="list-type">
      <span className="list-swatch" style={{ background: SHAPES[item.type].fill }} />
      <select
        className="input"
        value={item.type}
        aria-label={`Type of item ${index + 1}`}
        onChange={(e) => setItemType(item.id, e.target.value as ShapeType)}
      >
        {SHAPE_ORDER.map((t) => <option key={t} value={t}>{SHAPES[t].name}</option>)}
      </select>
    </span>
  );

  const loopTag = (text: string) => <span className="tag tag-accent" style={{ fontSize: 11 }}>{text}</span>;

  /** "then → next / ends here / a chosen item", for any row that isn't a decision. */
  const thenSelect = (item: Item, index: number) => {
    // "next" with nothing after it can only mean the chart stops here — show it that way.
    const thenTo = item.then.kind === 'item' ? item.then.to : null;
    const shown = thenTo !== null ? `item:${thenTo}` : leadsTo(items, index) === null ? 'end' : 'next';
    const change = (value: string) => {
      const then: Next = value === 'next' ? { kind: 'next' } : value === 'end' ? { kind: 'end' } : { kind: 'item', to: value.slice(5) };
      setItemThen(item.id, then);
    };
    const target = thenTo !== null ? items.findIndex((it) => it.id === thenTo) : -1;
    return (
      <span className="list-then">
        <span className="list-muted list-small">then</span>
        <select className="input" value={shown} aria-label={`Where item ${index + 1} leads next`} onChange={(e) => change(e.target.value)}>
          <option value="next">next</option>
          <option value="end">ends here</option>
          {items.map((it, i) => i !== index && <option key={it.id} value={`item:${it.id}`}>{itemLabel(items, i)}</option>)}
        </select>
        {target >= 0 && target <= index && loopTag('loops back')}
      </span>
    );
  };

  /** How many answers a decision has. */
  const countBox = (item: Item) => {
    const draft = countDrafts[item.id];
    const clear = () => setCountDrafts((d) => { const next = { ...d }; delete next[item.id]; return next; });
    const commit = (text: string) => {
      const n = parseInt(text, 10);
      if (Number.isFinite(n)) setRouteCount(item.id, n);
      clear();
    };
    return (
      <span className="list-then">
        <input
          className="plain-input outlined-input mono list-routes-input"
          inputMode="numeric"
          aria-label={`Number of routes from ${item.text.trim() || 'this decision'}`}
          value={draft ?? String(item.routes.length)}
          onFocus={(e) => selectAllSoon(e.currentTarget)}
          onChange={(e) => {
            // One digit (2–6). Keep the one just typed, so typing "3" over a "2"
            // works even if the old number wasn't selected.
            const text = e.target.value.replace(/\D/g, '').slice(-1);
            setCountDrafts((d) => ({ ...d, [item.id]: text }));
            const n = parseInt(text, 10);
            if (n >= MIN_ROUTES && n <= MAX_ROUTES) setRouteCount(item.id, n);
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
        <span className="list-muted list-small">routes</span>
      </span>
    );
  };

  const routesControl = (item: Item, index: number) => (item.type === 'decision' ? countBox(item) : thenSelect(item, index));

  const goesToSelect = (item: Item, route: Route, label: string) => (
    <select
      className="input"
      value={route.to ?? ''}
      aria-label={`Where answer ${label} goes`}
      onChange={(e) => setRouteTo(item.id, route.id, e.target.value || null)}
    >
      <option value="">Choose…</option>
      {items.map((it, i) => <option key={it.id} value={it.id}>{itemLabel(items, i)}</option>)}
    </select>
  );

  /** The note beside an answer's destination: a loop, or still undecided. */
  const answerNote = (route: Route, index: number): ReactNode => {
    if (route.to === null) return loopTag('needs a destination');
    const target = items.findIndex((it) => it.id === route.to);
    return target >= 0 && target <= index ? loopTag('loops back') : null;
  };

  const answerInput = (item: Item, route: Route, label: string, style?: object) => (
    <>
      <input
        className="plain-input outlined-input list-text-input"
        style={style}
        value={route.label}
        maxLength={MAX_LABEL}
        placeholder="Answer"
        aria-label={`Answer ${label}`}
        onChange={(e) => setRouteLabel(item.id, route.id, e.target.value)}
      />
      <span className="print-only">{route.label}</span>
    </>
  );

  const emptyMessage = 'No items yet — add the first one above.';

  // — computer: a table, one <tbody> per item so an item and its answers are one draggable block —

  if (!isNarrow) {
    return (
      <div className="screen" style={{ padding: '0 var(--space-6) var(--space-6)' }}>
        <div className="print-only print-title">{chart?.name}</div>
        {toolbar}
        <table className="table">
          <thead>
            <tr>
              <th data-noprint="1" style={{ width: 26 }}></th>
              <th style={{ width: 44 }}>#</th>
              <th style={{ width: 400 }}>Item</th>
              <th style={{ width: 220 }}>Type</th>
              <th style={{ width: 200 }}>Routes</th>
              <th data-noprint="1" style={{ width: 30 }}></th>
            </tr>
          </thead>
          {items.length === 0 && (
            <tbody>
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-700)' }}>{emptyMessage}</td></tr>
            </tbody>
          )}
          {items.map((item, i) => (
            <tbody
              key={item.id}
              ref={drag.setItemRef(i)}
              className={drag.overIndex === i && drag.dragIndex !== null && drag.dragIndex !== i ? 'list-drop-target' : undefined}
              style={{ opacity: drag.dragIndex === i ? 0.4 : 1 }}
            >
              <tr>
                <td
                  data-noprint="1"
                  onPointerDown={drag.onPointerDown(i)}
                  onPointerMove={drag.onPointerMove}
                  onPointerUp={drag.onPointerUp}
                  onPointerCancel={drag.onPointerCancel}
                  style={{ paddingRight: 0, color: 'var(--color-neutral-600)', cursor: 'grab', touchAction: 'none' }}
                  title="Drag to reorder"
                >
                  <IconGrip size={14} />
                </td>
                <td className="list-num mono">{i + 1}</td>
                <td>{itemInput(item, i)}</td>
                <td>{typeSelect(item, i)}</td>
                <td>{routesControl(item, i)}</td>
                <td data-noprint="1">
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleDelete(item, i)}
                    title="Remove item"
                    aria-label={`Remove item ${i + 1}`}
                    style={{ padding: '4px 6px', color: 'var(--color-neutral-600)' }}
                  >
                    <IconTrash size={14} />
                  </button>
                </td>
              </tr>
              {item.type === 'decision' && item.routes.map((route, j) => {
                const label = `${i + 1}${routeLetter(j)}`;
                return (
                  <tr key={route.id} className="list-answer">
                    <td></td>
                    <td className="list-num mono">↳ {label}</td>
                    <td>{answerInput(item, route, label, { width: 160 })}</td>
                    <td colSpan={2}>
                      <span className="list-goes">
                        <span className="list-muted list-small">goes to</span>
                        {goesToSelect(item, route, label)}
                        {answerNote(route, i)}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
        <p className="list-muted" style={{ marginTop: 'var(--space-3)', fontSize: 12.5 }} data-noprint="1">
          Each row leads on to the next one unless you choose otherwise. A decision's answers appear underneath it; pick
          where each one goes. Choosing an earlier item makes a loop.
        </p>
      </div>
    );
  }

  // — phone: one card per item, with a decision's answers inside its card —

  return (
    <div className="screen" style={{ padding: '0 var(--space-4) var(--space-6)' }}>
      <div className="print-only print-title">{chart?.name}</div>
      {toolbar}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-700)' }}>{emptyMessage}</div>
      )}
      <div className="list-cards">
        {items.map((item, i) => (
          <div
            key={item.id}
            ref={drag.setItemRef(i)}
            className="list-card"
            style={{
              opacity: drag.dragIndex === i ? 0.4 : 1,
              outline: drag.overIndex === i && drag.dragIndex !== null && drag.dragIndex !== i ? '2px solid var(--color-accent)' : undefined,
            }}
          >
            <div className="list-card-row">
              <span
                className="list-card-grip"
                onPointerDown={drag.onPointerDown(i)}
                onPointerMove={drag.onPointerMove}
                onPointerUp={drag.onPointerUp}
                onPointerCancel={drag.onPointerCancel}
                title="Drag to reorder"
              >
                <IconGrip size={16} />
              </span>
              <span className="list-num mono">{i + 1}</span>
              {itemInput(item, i, { flex: 1 })}
              <button
                className="btn btn-ghost"
                onClick={() => handleDelete(item, i)}
                title="Remove item"
                aria-label={`Remove item ${i + 1}`}
                style={{ padding: '4px 6px', color: 'var(--color-neutral-600)', flex: 'none', minHeight: 44, minWidth: 44 }}
              >
                <IconTrash size={14} />
              </button>
            </div>
            <div className="list-card-row" style={{ marginTop: 6, paddingLeft: 24 }}>
              {typeSelect(item, i)}
              {item.type === 'decision' && <span style={{ marginLeft: 'auto', flex: 'none' }}>{countBox(item)}</span>}
            </div>
            {/* The type box and a "then" box can't share a 390px-wide line, so it gets its own. */}
            {item.type !== 'decision' && (
              <div className="list-card-row" style={{ marginTop: 6, paddingLeft: 24 }}>{thenSelect(item, i)}</div>
            )}
            {item.type === 'decision' && item.routes.map((route, j) => {
              const label = `${i + 1}${routeLetter(j)}`;
              return (
                <div key={route.id}>
                  <div className="list-card-answer">
                    <span className="list-num mono">{label}</span>
                    {answerInput(item, route, label)}
                    <span className="list-muted list-small">→</span>
                    {goesToSelect(item, route, label)}
                  </div>
                  {answerNote(route, i) && <div className="list-card-note">{answerNote(route, i)}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Phones have no Enter-to-add-a-row habit, so offer it as a button. */}
      <button
        className="btn btn-secondary"
        data-noprint="1"
        onClick={() => addAndFocus(items.length ? items[items.length - 1].id : null)}
        style={{ width: '100%', marginTop: 'var(--space-2)', color: 'var(--color-accent-700)', minHeight: 44 }}
      >
        <IconPlus size={15} />Add item
      </button>
    </div>
  );
}
