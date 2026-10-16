import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useApp } from '../state/store.tsx';
import { focusItemText } from '../lib/focus.ts';
import { nextOpenSlot, summary } from '../lib/chartOps.ts';
import { MAX_NAME } from '../data/charts.ts';
import { copyChartImage, slug } from '../lib/exportImage.ts';
import { printScreen } from '../lib/print.ts';
import { IconPlus, IconPrint } from '../lib/icons.tsx';

/** Header for the List and Chart screens — two views of the same chart: the
 *  chart's name and a count of its items on the left, the List | Chart switch in
 *  the middle (the only way between the two), and the screen's actions on the
 *  right in one line, as in Backtimer (List: Print, Add item, Clear; Chart:
 *  Print, Copy image). The Library is reached from the nav. */
export function EditorHeader({ mode }: { mode: 'list' | 'chart' }) {
  const { chart, renameChart, setScreen, addItem, clearItems } = useApp();
  const nameInput = useRef<HTMLTextAreaElement | null>(null);
  const [imageStatus, setImageStatus] = useState<'idle' | 'copied' | 'downloaded' | 'failed'>('idle');

  // The name is a textarea so a long one wraps; keep it exactly as tall as its text.
  useEffect(() => {
    const el = nameInput.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [chart?.name]);

  if (!chart) return null;

  // Adds a row and focuses it inside the same tap, so a phone opens its keyboard.
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

  // Copies the chart as a picture (name, chart and key) — or downloads it if the
  // browser won't put images on the clipboard.
  const copyImage = async () => {
    const svg = document.querySelector<SVGSVGElement>('.chart-frame svg[role="img"]');
    if (!svg) return;
    try {
      const types = [...new Set(chart.items.map((it) => it.type))];
      setImageStatus(await copyChartImage(svg, chart.name, types, `${slug(chart.name)}.png`));
      setTimeout(() => setImageStatus('idle'), 1500);
    } catch (err) {
      console.error('Flowcharter could not make the image', err);
      setImageStatus('failed');
      setTimeout(() => setImageStatus('idle'), 3000);
    }
  };

  return (
    <div data-noprint="1" className="editor-header">
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
        <span className="tag tag-neutral mono" style={{ marginTop: 6, display: 'inline-block' }}>{summary(chart.items)}</span>
      </div>
      <div className="seg view-toggle" role="radiogroup" aria-label="View">
        {(['list', 'chart'] as const).map((v) => (
          <label key={v} className="seg-opt">
            <input type="radio" name="editor-view" value={v} checked={mode === v} onChange={() => setScreen(v)} />
            {v === 'list' ? 'List' : 'Chart'}
          </label>
        ))}
      </div>
      <div className="editor-actions">
        <button className="btn btn-ghost" onClick={() => printScreen(mode === 'chart')} style={{ color: 'var(--color-accent-700)' }}>
          <IconPrint size={15} />Print
        </button>
        {mode === 'list' && (
          <>
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
            {/* Only while there's a loose end for the cards to ask about — on a
                finished chart they'd have nothing to do (John, 2026-10-16). */}
            {(chart.items.length === 0 || nextOpenSlot(chart.items) !== null) && (
              <button className="btn btn-ghost" onClick={() => setScreen('steps')} style={{ color: 'var(--color-accent-700)' }}>
                Step by step
              </button>
            )}
          </>
        )}
        {mode === 'chart' && (
          <button
            onClick={copyImage}
            disabled={chart.items.length === 0}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}
          >
            {imageStatus === 'copied' ? 'Copied!' : imageStatus === 'downloaded' ? 'Downloaded' : imageStatus === 'failed' ? "Couldn't copy" : 'Copy image'}
          </button>
        )}
      </div>
    </div>
  );
}
