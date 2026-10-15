/** Focuses (and selects) a list row's text box. Rows mark their box with
 *  data-item-input, so the header's "+ Add item" and the list itself can both
 *  do this without sharing refs. Call it inside the same tap/keypress that
 *  added the row (after flushSync) — a phone only opens its keyboard for focus
 *  that happens during a tap (HOUSE-STYLE §6). */
export function focusItemText(itemId: string): void {
  const el = document.querySelector<HTMLInputElement>(`[data-item-input="${CSS.escape(itemId)}"]`);
  if (el) { el.focus(); el.select(); }
}
