import { useState } from 'react';
import { flushSync } from 'react-dom';
import { useApp, type Screen } from '../state/store.tsx';
import { relativeTime, useNow } from '../lib/time.ts';
import { IconClose, IconMenu } from '../lib/icons.tsx';

// List and Chart aren't here: the List | Chart switch in a chart's own header is
// the one way between them (John, 2026-10-15), and a chart is opened from the Library.
const LINKS: { screen: Screen; label: string }[] = [
  { screen: 'lib', label: 'Library' },
  { screen: 'guide', label: 'Guide' },
];

export function Nav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const { lastEditedAt, createChart } = useApp();

  const now = useNow();

  // Below the narrow-screen breakpoint (see global.css), the links and the
  // saved-tag collapse behind this toggle; on a wide screen .nav-panel is CSS
  // `display: contents`, so this state is irrelevant there.
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (s: Screen) => { onNavigate(s); setMenuOpen(false); };

  // A new chart opens on the List with its name box ready to type over. Focus
  // happens here, inside the tap, so a phone's keyboard opens too.
  const handleNewChart = () => {
    flushSync(() => { createChart(); });
    setMenuOpen(false);
    const name = document.getElementById('chart-name-input') as HTMLTextAreaElement | null;
    if (name) { name.focus(); name.select(); }
  };

  return (
    <div className="nav" style={{ padding: 'var(--space-3) var(--space-6)', background: 'var(--color-surface)', flexWrap: 'wrap' }}>
      <span className="nav-brand">Flowcharter</span>
      <button
        className="nav-menu-toggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        data-noprint="1"
      >
        {menuOpen ? <IconClose size={19} /> : <IconMenu size={19} />}
      </button>
      <button
        className="btn btn-primary"
        onClick={handleNewChart}
        style={{ padding: '7px 16px', fontSize: '13.5px', whiteSpace: 'nowrap', marginLeft: 'auto' }}
      >
        New chart
      </button>
      <div className={`nav-panel${menuOpen ? ' open' : ''}`}>
        {LINKS.map((l) => (
          <a
            key={l.screen}
            href={`#${l.screen}`}
            onClick={(e) => { e.preventDefault(); navigate(l.screen); }}
            aria-current={screen === l.screen ? 'page' : undefined}
          >
            {l.label}
          </a>
        ))}
        <span className="tag tag-neutral mono" data-noprint="1">saved {relativeTime(lastEditedAt, now)}</span>
      </div>
    </div>
  );
}
