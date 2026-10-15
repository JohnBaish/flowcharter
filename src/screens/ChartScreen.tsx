import { useApp } from '../state/store.tsx';

/** Placeholder until Stage 2, which draws the chart (PLAN.md). */
export function ChartScreen() {
  const { chart, setScreen } = useApp();
  return (
    <div style={{ padding: 'var(--space-4) var(--space-6) var(--space-6)' }}>
      <div className="card" style={{ padding: 'var(--space-6)', maxWidth: 560 }}>
        <div className="card-kicker">Coming next</div>
        <h3 className="card-title" style={{ margin: '4px 0 var(--space-2)' }}>The chart</h3>
        <p className="card-body" style={{ opacity: 1 }}>
          This is where “{chart?.name}” will be drawn as a flowchart. For now, build and check your list on the List screen.
        </p>
        <button className="btn btn-primary" onClick={() => setScreen('list')} style={{ marginTop: 'var(--space-3)', padding: '8px 18px', fontSize: '13.5px' }}>
          Back to the List
        </button>
      </div>
    </div>
  );
}
