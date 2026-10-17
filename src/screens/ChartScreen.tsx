import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../state/store.tsx';
import type { Direction, Item } from '../data/charts.ts';
import { chooseDirection, layoutChart, type ChartLayout } from '../lib/layout.ts';
import { LABEL_FONT, TEXT_FONT } from '../lib/shapes.ts';
import { canvasMeasure, fontsReady } from '../lib/textWrap.ts';
import { useIsNarrow } from '../lib/responsive.ts';
import { FlowChart, ShapeKey } from '../components/FlowChart.tsx';
import { useBackLayer } from '../lib/backLayers.ts';

const NARROW = 720;
// Never shrink the chart below this, or its text gets too small to read — a
// wider chart scrolls sideways inside its frame instead (the page itself never
// does). Phones get a larger minimum: their screens are small already.
const MIN_SCALE = 0.6;
const MIN_SCALE_PHONE = 0.75;
// …but a chart only a little too wide for a phone may shrink as far as this to
// fit completely, rather than scroll a few boxes out of sight (fresh look 5.1).
const FIT_SCALE_PHONE = 0.65;

const NAMES = { down: 'Down', across: 'Across' } as const;

const NO_ITEMS: Item[] = [];

type Layouts = { down: ChartLayout; across: ChartLayout };
type Drawn = { items: unknown; layouts: Layouts } | { items: unknown; error: true };

export function ChartScreen() {
  const { chart, setDirection, setScreen, setChartWide, chartFull: full, setChartFull: setFull } = useApp();
  const items = chart?.items ?? NO_ITEMS;
  const hasItems = items.length > 0;
  const isNarrow = useIsNarrow(NARROW);
  const [drawn, setDrawn] = useState<Drawn | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  const [space, setSpace] = useState({ width: 1000, height: 640 });
  // Full screen on a phone (fresh look 5.2): the whole chart shrunk to fit the
  // screen, to see it all at once and pinch to zoom in. The header's Full screen
  // button opens it; it's offered only while the chart is too wide to fit.
  const [screenSize, setScreenSize] = useState({ width: 390, height: 844 });
  useEffect(() => {
    if (!full) return;
    const measure = () => setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [full]);
  // Back closes Full screen, as people expect on a phone (fresh look 6.1).
  useBackLayer(full, 'full', () => setFull(false));
  // Closed again on leaving the Chart.
  useEffect(() => () => { setFull(false); setChartWide(false); }, [setFull, setChartWide]);

  // Lay the chart out both ways whenever the list changes. Both are needed for
  // "Automatic", and each takes a few milliseconds, so it's simplest to always
  // have both ready. Results for a list that has since changed are ignored.
  useEffect(() => {
    if (!items.length) return;
    let current = true;
    (async () => {
      try {
        await fontsReady([TEXT_FONT, LABEL_FONT]);
        const measure = canvasMeasure();
        const [down, across] = await Promise.all([layoutChart(items, 'down', measure), layoutChart(items, 'across', measure)]);
        if (current) setDrawn({ items, layouts: { down, across } });
      } catch (err) {
        console.error('Flowcharter could not lay out this chart', err);
        if (current) setDrawn({ items, error: true });
      }
    })();
    return () => { current = false; };
  }, [items]);

  // The space the chart has to fit: the frame's width, and the window's height
  // below the frame's top (so "fits" means fits on screen without scrolling).
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      setSpace({ width: el.clientWidth, height: Math.max(320, window.innerHeight - Math.min(top, 260) - 24) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [hasItems]);

  const layouts = drawn && 'layouts' in drawn ? drawn.layouts : null;
  // What Automatic picks for this chart in this space — shown on its button
  // whichever direction is selected, so it's clear what choosing it would do.
  const automatic = layouts ? chooseDirection(layouts.down, layouts.across, space.width, space.height) : null;
  const layout = layouts && chart
    ? chart.direction === 'down' ? layouts.down
      : chart.direction === 'across' ? layouts.across
        : automatic
    : null;
  const minScale = isNarrow ? MIN_SCALE_PHONE : MIN_SCALE;
  const fit = layout ? space.width / layout.width : 1;
  const scale = Math.min(1, isNarrow && fit >= FIT_SCALE_PHONE ? fit : Math.max(minScale, fit));
  // Too wide to fit a phone screen, so it scrolls sideways: offer Full screen.
  const wide = isNarrow && items.length > 0 && !!layout && layout.width * scale > space.width + 1;
  useEffect(() => { setChartWide(wide); }, [wide, setChartWide]);

  if (!chart) return null;

  if (!items.length) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-neutral-700)' }}>
        <p style={{ margin: '0 0 var(--space-3)' }}>There's nothing to draw yet — add some items on the List.</p>
        <button className="btn btn-primary" onClick={() => setScreen('list')} style={{ padding: '8px 18px', fontSize: '13.5px' }}>Go to the List</button>
      </div>
    );
  }

  const failed = drawn && 'error' in drawn && drawn.items === items;
  // Two choices (John, 2026-10-15): Automatic, which names the direction it
  // picks, and the other direction. Choosing the direction Automatic already
  // picks would look the same, so it isn't offered; a chart saved with that
  // direction forced (from before, or on another screen size) shows as Automatic.
  const other: Direction | null = automatic ? (automatic.direction === 'down' ? 'across' : 'down') : null;
  const options: { value: Direction; label: string }[] = automatic && other
    ? [{ value: 'auto', label: `Automatic · ${NAMES[automatic.direction]}` }, { value: other, label: NAMES[other] }]
    : [{ value: 'auto', label: 'Automatic' }];
  const selected = chart.direction === other ? other : 'auto';
  const usedTypes = [...new Set(items.map((it) => it.type))];

  return (
    <div style={{ padding: '0 var(--space-4) var(--space-6)' }}>
      <div className="print-only print-title">{chart.name}</div>
      <div className="chart-toolbar" data-noprint="1">
        <span className="chart-toolbar-label" id="direction-label">Direction:</span>
        <div className="seg" role="radiogroup" aria-labelledby="direction-label">
          {options.map((o) => (
            <label
              key={o.value} className="seg-opt"
              title={o.value === 'auto' ? 'Top to bottom or left to right, whichever fits this chart better on this screen' : undefined}
            >
              <input
                type="radio" name="chart-direction" value={o.value}
                checked={selected === o.value}
                onChange={() => setDirection(chart.id, o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>
      {full && layout && (
        <div className="chart-full" role="dialog" aria-label={`${chart.name} — full screen`} data-noprint="1">
          <div className="chart-full-head">
            <h3>{chart.name.trim() || 'Untitled'}</h3>
            <button className="btn btn-primary" onClick={() => setFull(false)}>Close</button>
          </div>
          <FlowChart
            layout={layout}
            // Fits both ways, below the heading (about 76px), with a small margin.
            scale={Math.min(1, (screenSize.width - 24) / layout.width, (screenSize.height - 100) / layout.height)}
            title={chart.name}
          />
        </div>
      )}
      <div ref={frame} className="chart-frame">
        {failed ? (
          <p style={{ textAlign: 'center', color: 'var(--color-neutral-700)', padding: 'var(--space-6)' }}>
            Sorry — this chart couldn't be drawn. Your list is safe; try changing it slightly, or tell workshop@baish.net.
          </p>
        ) : layout ? (
          <FlowChart layout={layout} scale={scale} title={chart.name} />
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-neutral-700)', padding: 'var(--space-6)' }}>Drawing…</p>
        )}
      </div>
      <ShapeKey types={usedTypes} />
    </div>
  );
}
