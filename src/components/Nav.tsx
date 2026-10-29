import { useApp, type Screen } from '../state/store.tsx';
import { relativeTime, useNow } from '../lib/time.ts';
import { ThemeSwitch } from './ThemeSwitch.tsx';

// List and Chart aren't here: the List | Chart switch in a chart's own header is
// the one way between them (John, 2026-10-15), and a chart is opened from the Library.
const LINKS: { screen: Screen; label: string }[] = [
  { screen: 'lib', label: 'Library' },
  { screen: 'guide', label: 'Guide' },
];

export function Nav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const { lastEditedAt, createChart } = useApp();

  const now = useNow();

  // A new chart opens on the step-by-step cards, whose first card asks whether
  // to go step by step or start with a blank list (John, 2026-10-16).
  const handleNewChart = () => createChart('steps');

  // With only two links, the phone shows them directly rather than behind a
  // menu button (fresh look 6.2); the "saved" tag is left out there for room.
  return (
    <div className="nav nav-main" style={{ flexWrap: 'wrap' }}>
      <span className="nav-brand">Flowcharter</span>
      <button
        className="btn btn-primary nav-new"
        onClick={handleNewChart}
        style={{ fontSize: '13.5px', whiteSpace: 'nowrap', marginLeft: 'auto' }}
      >
        New chart
      </button>
      {LINKS.map((l) => (
        <a
          key={l.screen}
          href={`#${l.screen}`}
          onClick={(e) => { e.preventDefault(); onNavigate(l.screen); }}
          aria-current={screen === l.screen ? 'page' : undefined}
        >
          {l.label}
        </a>
      ))}
      <span className="tag tag-neutral mono nav-saved" data-noprint="1">saved {relativeTime(lastEditedAt, now)}</span>
      {/* Last on a computer; on a phone beside the name, with the rest on the row beneath (global.css). */}
      <ThemeSwitch />
      <span className="nav-break" aria-hidden="true" />
    </div>
  );
}
