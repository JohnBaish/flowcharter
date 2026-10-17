import { useRef, useState, type ChangeEvent } from 'react';
import { useApp } from '../state/store.tsx';
import { SHAPES, SHAPE_ORDER } from '../data/shapes.ts';
import type { Chart } from '../data/charts.ts';
import { summary } from '../lib/chartOps.ts';
import { exportFilename, parseImport } from '../lib/exchange.ts';
import { relativeTime, useNow } from '../lib/time.ts';

/** A strip showing the mix of shape types in a chart, in their own colours. */
function TypeMix({ chart }: { chart: Chart }) {
  const counts = SHAPE_ORDER.map((t) => ({ t, n: chart.items.filter((it) => it.type === t).length })).filter((c) => c.n > 0);
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden',
        background: 'var(--color-neutral-200)', boxShadow: 'inset 0 0 0 1px rgba(32,30,29,.10)',
      }}
    >
      {counts.map((c) => <div key={c.t} style={{ flex: c.n, background: SHAPES[c.t].fill }} />)}
    </div>
  );
}

export function LibraryScreen() {
  const { charts, chartOrder, openChart, duplicateChart, removeChart, exportState, replaceLibrary } = useApp();
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const now = useNow();

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This can't be undone.`)) removeChart(id);
  };
  // A chart whose name has been deleted still needs a title to click.
  const title = (c: Chart) => c.name.trim() || 'Untitled';

  const handleExport = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = parseImport(await file.text());
    if ('error' in result) { setError(result.error); return; }
    const incoming = Object.keys(result.library.charts).length;
    const current = chartOrder.length;
    // Importing replaces the whole library with no undo — say so before doing it.
    if (current > 0 && !window.confirm(
      `This will replace the ${current} flowchart${current === 1 ? '' : 's'} in your Library with the ${incoming} in this file. `
      + `It can't be undone. (Use Export first if you want to keep your current ones.)\n\nReplace them?`,
    )) return;
    setError(null);
    replaceLibrary(result.library);
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ flex: 'none' }}>
          <div className="card-kicker" style={{ margin: 0 }}>Saved flowcharts</div>
          <h2 style={{ margin: '1px 0 0', lineHeight: 1.05 }}>Library</h2>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0, flexWrap: 'wrap' }}>
          <span className="tag tag-neutral mono">{chartOrder.length} chart{chartOrder.length === 1 ? '' : 's'}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flex: 'none' }}>
          <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: 'none' }} />
          <button className="btn btn-secondary" onClick={() => fileInput.current?.click()} style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
            Import
          </button>
          <button className="btn btn-secondary" onClick={handleExport} style={{ padding: '8px 16px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
            Export
          </button>
        </div>
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-accent-100)', color: 'var(--color-accent-800)', borderRadius: 'var(--radius-md)', padding: '10px 14px', margin: '0 var(--space-4) var(--space-3)', fontSize: 13.5 }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn btn-ghost" onClick={() => setError(null)} style={{ color: 'var(--color-accent-700)', padding: '2px 8px' }}>Dismiss</button>
        </div>
      )}
      {chartOrder.length === 0 ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-neutral-700)' }}>
          No flowcharts yet — start with New chart in the nav bar.
        </div>
      ) : (
        <div style={{ padding: '0 var(--space-4) var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 'var(--space-4)' }}>
          {chartOrder.map((id) => {
            const c = charts[id];
            return (
              <div key={id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                <div style={{ minWidth: 0 }}>
                  {/* A real button, so it can be reached with Tab like Open (fresh look 3.2). */}
                  <button className="library-chart-title" onClick={() => openChart(id)}>
                    {title(c)}
                  </button>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 3 }}>{summary(c.items)}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>Last changed {relativeTime(c.lastEditedAt, now)}</div>
                </div>
                <TypeMix chart={c} />
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 2 }}>
                  <button className="btn btn-ghost" onClick={() => openChart(id)} style={{ padding: '6px 14px', fontSize: '12.5px', flex: 1, color: 'var(--color-accent-700)', borderColor: 'var(--color-divider)' }}>Open</button>
                  <button className="btn btn-secondary" onClick={() => duplicateChart(id)} style={{ padding: '6px 14px', fontSize: '12.5px' }}>Duplicate</button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(id, title(c))} style={{ padding: '6px 14px', fontSize: '12.5px', color: 'var(--color-neutral-700)' }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div
        data-noprint="1"
        style={{
          margin: '64px var(--space-4) 0', paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-6)',
          borderTop: '1px solid var(--color-divider)',
          fontSize: 12, lineHeight: 1.6, color: 'var(--color-neutral-700)', textAlign: 'center',
        }}
      >
        <p style={{ margin: 0 }}>
          Your flowcharts are saved automatically, but only in this browser, on this device. Use Export to keep a backup or
          move them to another device.
        </p>
        <p style={{ margin: 'var(--space-2) 0 0' }}>
          Flowcharter is a free-to-use personal project by John Baish. The flowcharts you make here are not collected;
          they’re only saved in your browser. We collect anonymous visit statistics (no cookies, no personal data) to see
          how the site is used. Contact: workshop@baish.net
        </p>
      </div>
    </>
  );
}
