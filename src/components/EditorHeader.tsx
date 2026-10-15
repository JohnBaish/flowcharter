import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useApp } from '../state/store.tsx';
import { summary } from '../lib/chartOps.ts';
import { focusItemText } from '../lib/focus.ts';
import { MAX_NAME } from '../data/charts.ts';
import { IconPlus } from '../lib/icons.tsx';

/** Header for the List screen (the Chart screen gets its own in Stage 2): the
 *  chart's name, a count of its items, and the screen's actions. */
export function EditorHeader() {
  const { chart, renameChart, duplicateChart, openChart, setScreen, addItem, clearItems } = useApp();
  const nameInput = useRef<HTMLTextAreaElement | null>(null);

  // The name is a textarea so a long one wraps; keep it exactly as tall as its text.
  useEffect(() => {
    const el = nameInput.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [chart?.name]);

  if (!chart) return null;

  const addAndFocus = () => {
    let id = '';
    flushSync(() => { id = addItem(null); });
    focusItemText(id);
  };

  // Clearing has no undo, so it asks first and says exactly what will go.
  const handleClear = () => {
    const n = chart.items.length;
    const what = n === 1 ? 'the 1 item' : `all ${n} items`;
    const name = chart.name.trim() || 'this flowchart';
    if (window.confirm(`Clear ${what} from "${name}"? This can't be undone.`)) clearItems();
  };

  return (
    <div data-noprint="1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
      <div style={{ maxWidth: 420, minWidth: 0 }}>
        <div className="card-kicker" style={{ margin: 0 }}>Flowchart</div>
        <textarea
          id="chart-name-input"
          ref={nameInput}
          className="plain-input"
          rows={1}
          maxLength={MAX_NAME}
          value={chart.name}
          aria-label="Flowchart name"
          onChange={(e) => renameChart(chart.id, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
          style={{
            font: '400 32px var(--font-heading)', lineHeight: 1.05, margin: '1px 0 0', padding: '0 6px',
            display: 'block', resize: 'none', overflow: 'hidden', wordBreak: 'break-word', width: '100%',
          }}
        />
      </div>
      <span className="tag tag-neutral mono">{summary(chart.items)}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={addAndFocus} style={{ color: 'var(--color-accent-700)' }}>
          <IconPlus size={15} />Add item
        </button>
        <button
          className="btn btn-ghost"
          onClick={handleClear}
          disabled={chart.items.length === 0}
          title={chart.items.length === 0 ? 'The list is already empty' : 'Remove every item from this list'}
          style={{ color: 'var(--color-neutral-700)' }}
        >
          Clear
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => openChart(duplicateChart(chart.id))}
          style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}
        >
          Duplicate
        </button>
        <button onClick={() => setScreen('lib')} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>Done</button>
      </div>
    </div>
  );
}
