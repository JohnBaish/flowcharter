// Light or dark mode (John, 29 October 2026; HOUSE-STYLE §2). The page follows the device's own
// setting until the visitor uses the switch. A switch set the same way as the device goes back to
// following the device, so only a choice that differs from it is kept ('light' or 'dark', in this
// browser only). The few lines in index.html work out the same
// before the page draws, so there's no flash of the wrong colours. Blocked storage just means
// following the device, and the switch still works for the visit. As Clockmaker's (clockwheel).
const KEY = 'flowcharter-theme';
const listeners = new Set<() => void>();
const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function deviceDark(): boolean {
  return media?.matches ?? false;
}

function storedChoice(): boolean | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'dark' ? true : value === 'light' ? false : null;
  } catch {
    return null;
  }
}

let chosen = storedChoice();
let dark = document.documentElement.dataset.theme === 'dark';

function apply(value: boolean) {
  dark = value;
  if (value) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  listeners.forEach((l) => l());
}

export function isDark(): boolean {
  return dark;
}

export function setDark(value: boolean) {
  chosen = value === deviceDark() ? null : value;
  try {
    if (chosen === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, chosen ? 'dark' : 'light');
  } catch {
    // Not kept; it still changes for this visit.
  }
  apply(value);
}

export function onThemeChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The device switching between light and dark (by hand, or automatically at dusk) carries the page
// with it, unless the visitor has chosen otherwise.
media?.addEventListener('change', () => {
  if (chosen === null) apply(deviceDark());
});

/** The switch's inner markup: a sun in light mode, a moon in dark. */
export function switchMarkup(on: boolean): string {
  const icon = on
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  return `<span class="theme-switch-label" aria-hidden="true">Dark</span><span class="theme-switch-track" aria-hidden="true"><span class="theme-switch-knob">${icon}</span></span>`;
}
