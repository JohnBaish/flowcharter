import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { newChart, seedChart, uid, MAX_NAME, type Chart, type ItemId, type Next } from '../data/charts.ts';
import type { ShapeType } from '../data/shapes.ts';
import * as ops from '../lib/chartOps.ts';
import { exportJson, sanitiseLibrary, type Library } from '../lib/exchange.ts';

export type Screen = 'lib' | 'list' | 'chart' | 'guide';
const SCREENS: Screen[] = ['lib', 'list', 'chart', 'guide'];

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

function firstVisit(): PersistedState {
  const chart = seedChart();
  return { screen: 'lib', charts: { [chart.id]: chart }, chartOrder: [chart.id], openChartId: chart.id, lastEditedAt: Date.now() };
}

function loadInitial(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return firstVisit();
    const saved = JSON.parse(raw) as Record<string, unknown>;
    const library = sanitiseLibrary(saved);
    if (!library) return firstVisit();
    return {
      ...library,
      screen: SCREENS.includes(saved.screen as Screen) ? (saved.screen as Screen) : 'lib',
      lastEditedAt: typeof saved.lastEditedAt === 'number' ? saved.lastEditedAt : Date.now(),
    };
  } catch {
    return firstVisit();
  }
}

interface AppContextValue extends PersistedState {
  /** The chart the List and Chart screens show, or null if the library is empty. */
  chart: Chart | null;
  setScreen: (screen: Screen) => void;
  openChart: (id: string) => void;
  createChart: () => string;
  /** Copies a chart into a new one, placed after it, and returns the new id. */
  duplicateChart: (id: string) => string;
  removeChart: (id: string) => void;
  renameChart: (id: string, name: string) => void;

  /** Adds a blank row after `afterId` (or at the end) and returns its id. */
  addItem: (afterId?: ItemId | null) => ItemId;
  removeItem: (itemId: ItemId) => void;
  /** Removes every row of the open chart (its name and settings stay). */
  clearItems: () => void;
  reorderItems: (from: number, to: number) => void;
  setItemText: (itemId: ItemId, text: string) => void;
  setItemType: (itemId: ItemId, type: ShapeType) => void;
  setItemThen: (itemId: ItemId, then: Next) => void;
  setRouteCount: (itemId: ItemId, count: number) => void;
  setRouteLabel: (itemId: ItemId, routeId: string, label: string) => void;
  setRouteTo: (itemId: ItemId, routeId: string, to: ItemId | null) => void;

  exportState: () => string;
  /** Replaces the whole library with an already-checked one (see parseImport). */
  replaceLibrary: (library: Library) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private browsing, quota) — the app still
      // works for the session, it just won't survive a refresh.
    }
  }, [state]);

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
    setScreen: (screen) => setState((s) => ({ ...s, screen })),
    openChart: (id) => setState((s) => (s.charts[id] ? { ...s, openChartId: id, screen: 'list' } : s)),
    createChart: () => {
      const chart = newChart();
      setEdited((s) => ({
        ...s, screen: 'list', openChartId: chart.id,
        charts: { ...s.charts, [chart.id]: chart }, chartOrder: [...s.chartOrder, chart.id],
      }));
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

    addItem: (afterId = null) => {
      const id = uid();
      editItems((items) => ops.addItem(items, id, afterId));
      return id;
    },
    removeItem: (itemId) => editItems((items) => ops.removeItem(items, itemId)),
    clearItems: () => editItems(() => []),
    reorderItems: (from, to) => editItems((items) => ops.reorderItems(items, from, to)),
    setItemText: (itemId, text) => editItems((items) => ops.setText(items, itemId, text)),
    setItemType: (itemId, type) => editItems((items) => ops.setType(items, itemId, type)),
    setItemThen: (itemId, then) => editItems((items) => ops.setThen(items, itemId, then)),
    setRouteCount: (itemId, count) => editItems((items) => ops.setRouteCount(items, itemId, count)),
    setRouteLabel: (itemId, routeId, label) => editItems((items) => ops.setRouteLabel(items, itemId, routeId, label)),
    setRouteTo: (itemId, routeId, to) => editItems((items) => ops.setRouteTo(items, itemId, routeId, to)),

    exportState: () => exportJson({ charts: state.charts, chartOrder: state.chartOrder, openChartId: state.openChartId }),
    replaceLibrary: (library) => setEdited((s) => ({ ...s, ...library, screen: 'lib' })),
  }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
