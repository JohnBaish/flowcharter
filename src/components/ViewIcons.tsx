/** The List | Chart tabs' pictures (John chose tabs with icons, 2026-10-20):
 *  a list of rows, and a small flowchart. Drawn in the text colour. */
export function IconListView() {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="2.5" cy="3" r="1.1" fill="currentColor" stroke="none" /><path d="M6.5 3H16" />
      <circle cx="2.5" cy="8" r="1.1" fill="currentColor" stroke="none" /><path d="M6.5 8H16" />
      <circle cx="2.5" cy="13" r="1.1" fill="currentColor" stroke="none" /><path d="M6.5 13H16" />
    </svg>
  );
}
export function IconChartView() {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="1" y="1" width="8" height="4" rx="1" /><path d="M5 5V7.5" />
      <path d="M5 7.5L9 11L5 14.5L1 11Z" /><path d="M9 11H12.5" /><rect x="12.5" y="9" width="4.5" height="4" rx="1" />
    </svg>
  );
}
