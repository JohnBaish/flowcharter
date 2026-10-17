import { useEffect, useLayoutEffect, useRef } from 'react';

// The phone's back gesture (fresh look 6.1, agreed with John 2026-10-17).
// Flowcharter's screens aren't separate web addresses, so Back would leave the
// site. Instead, a few "layers" each add ONE step to the browser's history
// while they're open: a chart (List, Chart or cards — moving between them adds
// nothing), and on top of it Peek or Full screen. Back closes the top layer;
// closing a layer any other way takes its step back off, so steps never pile
// up. The address shown never changes.

type Layer = { id: string; onBack: () => void; leaving?: boolean };
const layers: Layer[] = [];
let ignorePops = 0;

/** The step the page was showing when it loaded (after a reload, a chart's). */
let startupStep: string | null = null;

if (typeof window !== 'undefined') {
  const state = window.history.state as { fc?: string } | null;
  if (!state?.fc) window.history.replaceState({ ...state, fc: 'base' }, '');
  // Peek and Full screen don't survive a reload, so their step becomes the chart's.
  else if (state.fc !== 'base' && state.fc !== 'chart') window.history.replaceState({ ...state, fc: 'chart' }, '');
  startupStep = (window.history.state as { fc: string }).fc;

  window.addEventListener('popstate', () => {
    if (ignorePops > 0) { ignorePops--; return; }
    const top = layers.pop();
    top?.onBack();
  });
}

/** While `open`, adds one step to the browser's history; Back calls `onBack`. */
export function useBackLayer(open: boolean, id: string, onBack: () => void) {
  const latest = useRef(onBack);
  useLayoutEffect(() => { latest.current = onBack; });

  useEffect(() => {
    if (!open) {
      if (startupStep === id) startupStep = null;
      return;
    }
    // React's development double-run unmounts and remounts at once: keep the step.
    let layer = layers.find((l) => l.id === id && l.leaving);
    if (layer) {
      layer.leaving = false;
    } else {
      layer = { id, onBack: () => latest.current() };
      // After a reload the browser is already on this layer's step.
      if (startupStep === id) startupStep = null;
      else window.history.pushState({ fc: id }, '');
      layers.push(layer);
    }
    const mine = layer;
    return () => {
      if (!layers.includes(mine)) return; // closed by Back: its step is already gone
      mine.leaving = true;
      queueMicrotask(() => {
        if (!mine.leaving) return;
        layers.splice(layers.indexOf(mine), 1);
        ignorePops++;
        window.history.back();
      });
    };
  }, [open, id]);
}
