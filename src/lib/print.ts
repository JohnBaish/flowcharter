// Printing (SPEC §6). The page's own print rules (global.css) hide the nav and
// buttons and show the chart's name. Two things can't be fixed in a stylesheet,
// because they depend on the chart: the paper's direction (landscape for a chart
// running across, portrait for one running down) and how tall the chart may be
// so it still fits one page with its name above and key below.

// A4 less 12mm margins all round, then less room for the name and the key.
const PORTRAIT_CHART_MAX_MM = 228;
const LANDSCAPE_CHART_MAX_MM = 140;

/** Prints the screen. `chart` is true for the Chart screen. */
export function printScreen(chart: boolean): void {
  const style = document.createElement('style');
  style.setAttribute('data-print-only', '1');
  if (chart) {
    const across = document.querySelector('.chart-frame svg')?.getAttribute('data-direction') === 'across';
    style.textContent =
      `@page { size: A4 ${across ? 'landscape' : 'portrait'}; margin: 12mm; }` +
      `@media print { .chart-frame svg { max-height: ${across ? LANDSCAPE_CHART_MAX_MM : PORTRAIT_CHART_MAX_MM}mm !important; } }`;
  }
  document.head.appendChild(style);
  const cleanUp = () => { style.remove(); window.removeEventListener('afterprint', cleanUp); };
  window.addEventListener('afterprint', cleanUp);
  // Some browsers don't fire afterprint reliably; don't leave the rule behind.
  setTimeout(cleanUp, 60_000);
  window.print();
}
