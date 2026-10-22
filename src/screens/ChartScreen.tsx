import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { useApp } from '../state/store.tsx';
import { MAX_ITEM_TEXT, MAX_LABEL, type Direction, type Item } from '../data/charts.ts';
import { SHAPES } from '../data/shapes.ts';
import { chooseDirection, layoutChart, type ChartLayout } from '../lib/layout.ts';
import { FONT_SIZE, LABEL_FONT, LABEL_FONT_SIZE, TEXT_FONT } from '../lib/shapes.ts';
import { canvasMeasure, fontsReady } from '../lib/textWrap.ts';
import { useIsNarrow } from '../lib/responsive.ts';
import { isTouch } from '../lib/focus.ts';
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
/** The box or answer whose words are being changed: `id` is the drawn shape or
 *  line (a step's id, or `<question id>::route<n>`). */
type Edit = { id: string; itemId: string; routeId: string | null; words: string };
type Drawn = { items: unknown; layouts: Layouts } | { items: unknown; error: true };

export function ChartScreen() {
  const {
    chart, setDirection, setScreen, setChartWide, chartFull: full, setChartFull: setFull, setItemWords, setRouteLabel,
  } = useApp();
  const items = chart?.items ?? NO_ITEMS;
  const hasItems = items.length > 0;
  const isNarrow = useIsNarrow(NARROW);
  const [drawn, setDrawn] = useState<Drawn | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  const [space, setSpace] = useState({ width: 1000, height: 640 });
  // Full screen on a phone or tablet (fresh look 5.2): the whole chart shrunk to fit the
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
  // Too wide to fit, so it scrolls sideways: offer Full screen on a phone, and on
  // any touch screen (an iPad, or an iPhone Duo opened sideways, gets the
  // computer layout but has no mouse to scroll with; John, 2026-10-22).
  const wide = (isNarrow || isTouch()) && items.length > 0 && !!layout && layout.width * scale > space.width + 1;
  useEffect(() => { setChartWide(wide); }, [wide, setChartWide]);

  // — Changing a box's words (John, 2026-10-20): only the words, never the shape. —
  const [edit, setEdit] = useState<Edit | null>(null);
  const editBox = useRef<HTMLDivElement | null>(null);
  const panelBox = useRef<HTMLTextAreaElement | null>(null);
  const [panelText, setPanelText] = useState('');
  const finished = useRef(false);

  /** Opens the editor, rendering it at once so its box can be focused inside
   *  the tap — the only way a phone opens its keyboard. */
  const open = (next: Edit) => {
    finished.current = false;
    flushSync(() => { setEdit(next); setPanelText(next.words); });
    if (isNarrow) {
      const ta = panelBox.current;
      if (ta) { ta.focus(); ta.select(); }
      // Keep the box being changed in sight below the panel.
      const panel = document.querySelector('.chart-edit-panel');
      const shape = document.querySelector('.fc-active');
      if (panel && shape) {
        const gap = shape.getBoundingClientRect().top - panel.getBoundingClientRect().bottom - 16;
        if (gap < 0) window.scrollBy(0, gap);
      }
    } else {
      const el = editBox.current;
      if (el) {
        el.textContent = next.words;
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };
  const onNode = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (it) open({ id, itemId: id, routeId: null, words: it.text });
  };
  const onLabel = (edgeId: string) => {
    const at = edgeId.indexOf('::route');
    const it = items.find((x) => x.id === edgeId.slice(0, at));
    const r = it?.routes[Number(edgeId.slice(at + '::route'.length))];
    if (it && r) open({ id: edgeId, itemId: it.id, routeId: r.id, words: r.label });
  };
  /** Saves the words (or keeps the old ones, if left empty) and closes the editor. */
  const finish = (save: boolean, typed: string) => {
    if (finished.current || !edit) return;
    finished.current = true;
    const words = typed.replace(/\s+/g, ' ').trim();
    if (save && words && words !== edit.words.trim()) {
      if (edit.routeId) setRouteLabel(edit.itemId, edit.routeId, words.slice(0, MAX_LABEL));
      else setItemWords(edit.itemId, words.slice(0, MAX_ITEM_TEXT));
    }
    setEdit(null);
  };
  const onEditKey = (e: KeyboardEvent<HTMLElement>, typed: () => string) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') { e.preventDefault(); finish(true, typed()); }
    if (e.key === 'Escape') { e.preventDefault(); finish(false, ''); }
  };

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
        <span className="chart-hint" data-noprint="1">{isTouch() ? 'Tap' : 'Click'} a box to change its words.</span>
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
          <div className="chart-stage" style={{ width: Math.floor(layout.width * scale) }}>
            <FlowChart layout={layout} scale={scale} title={chart.name} edit={{ onNode, onLabel, active: edit?.id ?? null }} />
            {edit && !isNarrow && <EditBox layout={layout} scale={scale} room={space.width} edit={edit} boxRef={editBox} onKey={onEditKey} onDone={finish} />}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-neutral-700)', padding: 'var(--space-6)' }}>Drawing…</p>
        )}
      </div>
      <ShapeKey types={usedTypes} />
      {edit && isNarrow && (
        <div className="chart-edit-panel" role="dialog" aria-label="Change the words">
          <h3>Change the words</h3>
          <textarea
            ref={panelBox} rows={2} value={panelText} maxLength={edit.routeId ? MAX_LABEL : MAX_ITEM_TEXT}
            aria-label={edit.routeId ? 'The answer' : 'The words in the box'}
            onChange={(e) => setPanelText(e.target.value)} onKeyDown={(e) => onEditKey(e, () => panelText)}
          />
          <div className="chart-edit-panel-actions">
            <button className="btn btn-ghost" onClick={() => finish(false, '')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => finish(true, panelText)}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** On a computer: the box (or answer) itself becomes the place to type — same
 *  place, size and colour, outlined in orange — with a short hint beside it. */
function EditBox({ layout, scale, room, edit, boxRef, onKey, onDone }: {
  layout: ChartLayout; scale: number; room: number; edit: Edit;
  boxRef: RefObject<HTMLDivElement | null>;
  onKey: (e: KeyboardEvent<HTMLElement>, typed: () => string) => void;
  onDone: (save: boolean, typed: string) => void;
}) {
  const node = layout.nodes.find((n) => n.id === edit.id);
  const label = layout.edges.find((e) => e.id === edit.id)?.label;
  const box = node ?? label;
  if (!box) return null;
  const pad = label ? 6 : 0;
  const x = box.x * scale - pad, y = box.y * scale - pad;
  const w = box.w * scale + 2 * pad, h = box.h * scale + 2 * pad;
  const stageWidth = layout.width * scale;
  const typed = () => boxRef.current?.textContent ?? '';
  // The hint sits to the right of the box, or under it where there's no room
  // (the chart is centred in a frame `room` wide).
  const beside = x + w + 14 + 200 <= (room + stageWidth) / 2;
  return (
    <>
      <div
        ref={boxRef} className={`chart-edit-box${label ? ' is-answer' : ''}`} data-noprint="1"
        contentEditable suppressContentEditableWarning role="textbox"
        aria-label={label ? 'The answer' : 'The words in the box'}
        style={{
          left: x, top: y, width: w, height: h,
          background: node && node.type !== 'stub' ? SHAPES[node.type].fill : '#fffdf8',
          fontSize: Math.max(12, (label ? LABEL_FONT_SIZE : FONT_SIZE) * scale),
        }}
        onKeyDown={(e) => onKey(e, typed)}
        onBlur={() => onDone(true, typed())}
      />
      <div
        className="chart-edit-hint" data-noprint="1"
        style={beside ? { left: x + w + 14, top: y + h / 2 - 12 } : { left: Math.max(0, x + w / 2 - 95), top: y + h + 6 }}
      >
        Enter to save · Esc to cancel
      </div>
    </>
  );
}
