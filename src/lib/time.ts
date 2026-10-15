import { useEffect, useState } from 'react';

/** "just now", "5 min ago", "3 hr ago", then a date — for "saved …" and "Last changed". */
export function relativeTime(fromMs: number, nowMs: number): string {
  const seconds = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(fromMs).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** The current time, refreshed every `everyMs` — "5 min ago" goes stale just
 *  from time passing, so anything showing it re-renders on this tick. */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
