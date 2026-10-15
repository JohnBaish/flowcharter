import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/store.tsx';
import { summary } from '../lib/chartOps.ts';
import { MAX_NAME } from '../data/charts.ts';
import { copyChartImage, slug } from '../lib/exportImage.ts';
import { printScreen } from '../lib/print.ts';
import { IconPrint } from '../lib/icons.tsx';

/** Header for the List and Chart screens — two views of the same chart, as List
 *  and Clock are in Clockmaker: the chart's name, a count of its items, a switch
 *  between the two views, and Print / Copy image / Done at the top right, as in
 *  Clockmaker. (Adding and clearing rows is in the List's own strip below.) */
export function EditorHeader({ mode }: { mode: 'list' | 'chart' }) {
  const { chart, renameChart, setScreen } = useApp();
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
      <div className="seg view-toggle" role="radiogroup" aria-label="View">
        {(['list', 'chart'] as const).map((v) => (
          <label key={v} className="seg-opt">
            <input type="radio" name="editor-view" value={v} checked={mode === v} onChange={() => setScreen(v)} />
            {v === 'list' ? 'List' : 'Chart'}
          </label>
        ))}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={() => printScreen(mode === 'chart')} style={{ color: 'var(--color-accent-700)' }}>
          <IconPrint size={15} />Print
        </button>
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
        <button onClick={() => setScreen('lib')} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>Done</button>
      </div>
    </div>
  );
}
