import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { newChart, uid, MAX_NAME, type Chart, type Direction, type ItemId, type Next } from '../data/charts.ts';
import type { ShapeType } from '../data/shapes.ts';
import * as ops from '../lib/chartOps.ts';
import { exportJson, sanitiseLibrary, savedCopyDiffers, type Library } from '../lib/exchange.ts';

// 'steps' is the step-by-step cards (Stage 5), a third way of working on the open chart.
export type Screen = 'lib' | 'list' | 'chart' | 'guide' | 'steps';
const SCREENS: Screen[] = ['lib', 'list', 'chart', 'guide', 'steps'];

// Saved in the browser (localStorage) under this key. NEVER rename it once the
// site is live: every visitor's saved flowcharts would silently disappear
// (HOUSE-STYLE §8). If the saved shape ever has to change in a breaking way,
// add a migration that reads this key rather than switching to a new one.
const STORAGE_KEY = 'flowcharter-state-v1';

interface PersistedState extends Library {
  screen: Screen;
  /** Last time anything was edited (not navigation) — the nav's "saved … ago". */
  lastEditedAt: number;
}

// A truly first-ever visit (nothing saved yet) starts with an empty Library and
// lands on the Guide, so someone new reads it before diving in. Once they
// navigate anywhere, `screen` is saved like everything else, so this happens
// once. (Also used if the saved copy is damaged beyond repair.)
function firstVisit(): PersistedState {
  return { screen: 'guide', charts: {}, chartOrder: [], openChartId: null, lastEditedAt: Date.now() };
}

// The screens that work on the open chart.
const EDITING: Screen[] = ['list', 'chart', 'steps'];

/** A chart made with New chart and then left untouched: still called "New
 *  chart" and with no rows. Nothing would be lost by removing it. */
const isAbandoned = (c: Chart | undefined) => !!c && c.items.length === 0 && c.name === 'New chart';

/** Removes abandoned charts other than `keep`, so leaving New chart without
 *  doing anything doesn't leave an empty card in the Library (fresh look 3.1). */
function withoutAbandoned(s: PersistedState, keep: string | null): PersistedState {
  const gone = s.chartOrder.filter((id) => id !== keep && isAbandoned(s.charts[id]));
  if (!gone.length) return s;
  const charts = { ...s.charts };
  gone.forEach((id) => { delete charts[id]; });
  const chartOrder = s.chartOrder.filter((id) => !gone.includes(id));
  const openChartId = s.openChartId && charts[s.openChartId] ? s.openChartId : (chartOrder[0] ?? null);
  return { ...s, charts, chartOrder, openChartId };
}

function loadInitial(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return firstVisit();
    const saved = JSON.parse(raw) as Record<string, unknown>;
    const library = sanitiseLibrary(saved);
    if (!library) return firstVisit();
    const loaded: PersistedState = {
      ...library,
      screen: SCREENS.includes(saved.screen as Screen) ? (saved.screen as Screen) : 'lib',
      lastEditedAt: typeof saved.lastEditedAt === 'number' ? saved.lastEditedAt : Date.now(),
    };
    // Also tidies away any left over from before this rule existed.
    return withoutAbandoned(loaded, EDITING.includes(loaded.screen) ? loaded.openChartId : null);
  } catch {
    return firstVisit();
  }
}

interface AppContextValue extends PersistedState {
  /** The chart the List and Chart screens show, or null if the library is empty. */
  chart: Chart | null;
  setScreen: (screen: Screen) => void;
  openChart: (id: string) => void;
  /** Makes a new chart and opens it on `screen` (the List unless told otherwise). */
  createChart: (screen?: Screen) => string;
  /** Copies a chart into a new one, placed after it, and returns the new id. */
  duplicateChart: (id: string) => string;
  removeChart: (id: string) => void;
  renameChart: (id: string, name: string) => void;
  /** Automatic, Down or Across — saved with the chart. */
  setDirection: (id: string, direction: Direction) => void;

  /** Adds a blank row after `afterId` (or at the end) and returns its id. */
  addItem: (afterId?: ItemId | null) => ItemId;
  removeItem: (itemId: ItemId) => void;
  /** Removes every row of the open chart (its name and settings stay). */
  clearItems: () => void;
  /** Puts the open chart's rows back as they were (Undo after a delete). */
  restoreItems: (items: Chart['items']) => void;
  reorderItems: (from: number, to: number) => void;
  setItemText: (itemId: ItemId, text: string) => void;
  setItemType: (itemId: ItemId, type: ShapeType) => void;
  setItemThen: (itemId: ItemId, then: Next) => void;
  setRouteCount: (itemId: ItemId, count: number) => void;
  setRouteLabel: (itemId: ItemId, routeId: string, label: string) => void;
  setRouteTo: (itemId: ItemId, routeId: string, to: ItemId | null) => void;
  /** Adds a blank row at the end for this answer to lead to; returns its id. */
  addStepForAnswer: (itemId: ItemId, routeId: string) => ItemId;
  /** The step-by-step cards: add a step at a loose end, join a loose end to an
   *  existing step, and set a question's answers (see chartOps). */
  appendStep: (slot: ops.Slot, type: ShapeType, text: string) => ItemId;
  linkSlot: (slot: ops.Slot, to: ItemId) => void;
  setAnswers: (itemId: ItemId, labels: string[]) => void;

  /** Not saved: whether the Chart is wider than a phone screen (so the header
   *  offers Full screen), and whether Full screen is open (fresh look 5.2). */
  chartWide: boolean;
  setChartWide: (wide: boolean) => void;
  chartFull: boolean;
  setChartFull: (full: boolean) => void;
  /** Not saved: another tab has saved different charts since this one loaded.
   *  Saving from this tab is paused until it is reloaded (fresh look 7.1). */
  changedElsewhere: boolean;

  exportState: () => string;
  /** Replaces the whole library with an already-checked one (see parseImport). */
  replaceLibrary: (library: Library) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitial);
  const [chartWide, setChartWide] = useState(false);
  const [chartFull, setChartFull] = useState(false);
  const [changedElsewhere, setChangedElsewhere] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    // Once another tab has saved different charts, saving here would overwrite
    // them (even just from moving between screens), so this tab stops until it
    // is reloaded and has the newer copy.
    if (changedElsewhere) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private browsing, quota) — the app still
      // works for the session, it just won't survive a refresh.
    }
  }, [state, changedElsewhere]);

  // The browser tells a tab when another tab changes the saved copy (never for
  // its own saves). Only different charts count, not which screen is open.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (savedCopyDiffers(e.newValue, stateRef.current)) setChangedElsewhere(true);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Content edits stamp lastEditedAt for the nav's "saved … ago" readout; pure
  // navigation (setScreen, openChart) doesn't count as an edit.
  const setEdited = (updater: (s: PersistedState) => PersistedState) =>
    setState((s) => ({ ...updater(s), lastEditedAt: Date.now() }));

  // List edits touch the open chart and its own lastEditedAt (its "Last changed"
  // in the Library).
  const editOpenChart = (change: (c: Chart) => Chart) =>
    setEdited((s) => {
      const chart = s.openChartId ? s.charts[s.openChartId] : undefined;
      if (!chart) return s;
      return { ...s, charts: { ...s.charts, [chart.id]: { ...change(chart), lastEditedAt: Date.now() } } };
    });
  const editItems = (change: (items: Chart['items']) => Chart['items']) =>
    editOpenChart((c) => ({ ...c, items: change(c.items) }));

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    chart: state.openChartId ? state.charts[state.openChartId] ?? null : null,
    setScreen: (screen) => setState((s) => withoutAbandoned({ ...s, screen }, EDITING.includes(screen) ? s.openChartId : null)),
    openChart: (id) => setState((s) => (s.charts[id] ? withoutAbandoned({ ...s, openChartId: id, screen: 'list' }, id) : s)),
    createChart: (screen = 'list') => {
      const chart = newChart();
      setEdited((prev) => {
        const s = withoutAbandoned(prev, null);
        return { ...s, screen, openChartId: chart.id, charts: { ...s.charts, [chart.id]: chart }, chartOrder: [...s.chartOrder, chart.id] };
      });
      return chart.id;
    },
    duplicateChart: (id) => {
      const copyId = uid();
      setEdited((s) => {
        const from = s.charts[id];
        if (!from) return s;
        // Item ids only need to be unique within a chart, so the copy keeps them
        // (which also keeps every route pointing at the right item).
        const copy: Chart = { ...structuredClone(from), id: copyId, name: `${from.name} copy`.slice(0, MAX_NAME), lastEditedAt: Date.now() };
        const at = s.chartOrder.indexOf(id);
        const order = [...s.chartOrder];
        order.splice(at + 1, 0, copyId);
        return { ...s, charts: { ...s.charts, [copyId]: copy }, chartOrder: order };
      });
      return copyId;
    },
    removeChart: (id) => setEdited((s) => {
      if (!s.charts[id]) return s;
      const charts = { ...s.charts };
      delete charts[id];
      const chartOrder = s.chartOrder.filter((c) => c !== id);
      const openChartId = s.openChartId === id ? (chartOrder[0] ?? null) : s.openChartId;
      return { ...s, charts, chartOrder, openChartId };
    }),
    renameChart: (id, name) => setEdited((s) => {
      const chart = s.charts[id];
      return chart ? { ...s, charts: { ...s.charts, [id]: { ...chart, name: name.slice(0, MAX_NAME), lastEditedAt: Date.now() } } } : s;
    }),
    setDirection: (id, direction) => setEdited((s) => {
      const chart = s.charts[id];
      return chart ? { ...s, charts: { ...s.charts, [id]: { ...chart, direction, lastEditedAt: Date.now() } } } : s;
    }),

    addItem: (afterId = null) => {
      const id = uid();
      editItems((items) => ops.addItem(items, id, afterId));
      return id;
    },
    removeItem: (itemId) => editItems((items) => ops.removeItem(items, itemId)),
    clearItems: () => editItems(() => []),
    restoreItems: (items) => editItems(() => items),
    reorderItems: (from, to) => editItems((items) => ops.reorderItems(items, from, to)),
    setItemText: (itemId, text) => editItems((items) => ops.setText(items, itemId, text)),
    setItemType: (itemId, type) => editItems((items) => ops.setType(items, itemId, type)),
    setItemThen: (itemId, then) => editItems((items) => ops.setThen(items, itemId, then)),
    setRouteCount: (itemId, count) => editItems((items) => ops.setRouteCount(items, itemId, count)),
    setRouteLabel: (itemId, routeId, label) => editItems((items) => ops.setRouteLabel(items, itemId, routeId, label)),
    setRouteTo: (itemId, routeId, to) => editItems((items) => ops.setRouteTo(items, itemId, routeId, to)),
    appendStep: (slot, type, text) => {
      const id = uid();
      editItems((items) => ops.appendStep(items, slot, id, type, text));
      return id;
    },
    linkSlot: (slot, to) => editItems((items) => ops.linkSlot(items, slot, to)),
    setAnswers: (itemId, labels) => editItems((items) => ops.setAnswers(items, itemId, labels)),
    addStepForAnswer: (itemId, routeId) => {
      const id = uid();
      editItems((items) => ops.addStepForAnswer(items, itemId, routeId, id));
      return id;
    },

    chartWide, setChartWide, chartFull, setChartFull, changedElsewhere,
    exportState: () => exportJson({ charts: state.charts, chartOrder: state.chartOrder, openChartId: state.openChartId }),
    replaceLibrary: (library) => setEdited((s) => ({ ...s, ...library, screen: 'lib' })),
  }), [state, chartWide, chartFull, changedElsewhere]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
