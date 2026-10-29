import { useSyncExternalStore } from 'react';
import { isDark, onThemeChange, setDark, switchMarkup } from '../lib/theme.ts';

// The dark mode switch at the top right of the nav bar (as Hindcaster's, HOUSE-STYLE §2): a sun in
// light mode, a moon in dark. On a phone the "Dark" label is dropped to fit; the switch keeps its
// name for screen readers.
export function ThemeSwitch() {
  const dark = useSyncExternalStore(onThemeChange, isDark);
  return (
    <button
      type="button" className="theme-switch" role="switch" aria-checked={dark} aria-label="Dark mode"
      data-noprint="1" onClick={() => setDark(!dark)}
      dangerouslySetInnerHTML={{ __html: switchMarkup(dark) }}
    />
  );
}
