import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Item } from '../data/charts.ts';
import { layoutChart, type ChartLayout } from '../lib/layout.ts';
import { LABEL_FONT, TEXT_FONT } from '../lib/shapes.ts';
import { canvasMeasure, fontsReady } from '../lib/textWrap.ts';
import { FlowChart } from './FlowChart.tsx';

// Below this the chart's words get too small to read; a wider chart scrolls
// sideways inside its frame instead.
const MIN_SCALE = 0.45;

/** The chart so far, drawn top to bottom and shrunk to fit its column — beside
 *  the step-by-step cards on a computer, under them ("Peek") on a phone. */
export function LiveChart({ items, title }: { items: Item[]; title: string }) {
  const [layout, setLayout] = useState<ChartLayout | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(480);

  useEffect(() => {
    if (!items.length) return;
    let current = true;
    (async () => {
      try {
        await fontsReady([TEXT_FONT, LABEL_FONT]);
        const l = await layoutChart(items, 'down', canvasMeasure());
        if (current) setLayout(l);
      } catch (err) {
        console.error('Flowcharter could not lay out this chart', err);
      }
    })();
    return () => { current = false; };
  }, [items]);

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = layout ? Math.max(MIN_SCALE, Math.min(1, width / layout.width)) : 1;
  return (
    <div ref={frame} className="chart-frame wiz-chart">
      {items.length > 0 && layout && <FlowChart layout={layout} scale={scale} title={title} />}
    </div>
  );
}
