import { AppProvider, useApp } from './state/store.tsx';
import { Nav } from './components/Nav.tsx';
import { EditorHeader } from './components/EditorHeader.tsx';
import { LibraryScreen } from './screens/LibraryScreen.tsx';
import { ListScreen } from './screens/ListScreen.tsx';
import { ChartScreen } from './screens/ChartScreen.tsx';
import { GuideScreen } from './screens/GuideScreen.tsx';
import { StepsScreen } from './screens/StepsScreen.tsx';
import { useBackLayer } from './lib/backLayers.ts';

function Shell() {
  const { screen, chart, setScreen } = useApp();
  // List and Chart show the open chart; with none (everything deleted) there's
  // nothing to show, so say so rather than render a broken screen.
  const needsChart = (screen === 'list' || screen === 'chart' || screen === 'steps') && !chart;
  // A chart (List, Chart or cards) adds one step to the browser's history, so
  // the phone's Back returns to the Library instead of leaving (fresh look 6.1).
  useBackLayer((screen === 'list' || screen === 'chart' || screen === 'steps') && !!chart, 'chart', () => setScreen('lib'));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav screen={screen} onNavigate={setScreen} />
      <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
        {needsChart && (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-neutral-700)' }}>
            No flowchart is open. Pick one in the Library, or start a new one with New chart.
          </div>
        )}
        {screen === 'lib' && <LibraryScreen />}
        {screen === 'guide' && <GuideScreen />}
        {screen === 'list' && chart && <><EditorHeader mode="list" /><ListScreen /></>}
        {screen === 'chart' && chart && <><EditorHeader mode="chart" /><ChartScreen /></>}
        {/* Keyed by chart, so opening another chart starts its cards afresh. */}
        {screen === 'steps' && chart && <StepsScreen key={chart.id} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
