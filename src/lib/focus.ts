// Phone/tablet keyboards only open when focus happens during a tap.
export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

// On phones the tap that focused the box would otherwise put the cursor back
// where the finger landed, undoing the selection — so there it's deferred.
// (From clockwheel's src/lib/timeInput.ts.)
export const selectAllSoon = (el: HTMLInputElement) => {
  if (!isTouch()) { el.select(); return; }
  setTimeout(() => el.setSelectionRange(0, el.value.length), 0);
};

/** Focuses (and selects) a list row's text box. Rows mark their box with
 *  data-item-input, so the header's "+ Add item" and the list itself can both
 *  do this without sharing refs. Call it inside the same tap/keypress that
 *  added the row (after flushSync) — a phone only opens its keyboard for focus
 *  that happens during a tap (HOUSE-STYLE §6). */
export function focusItemText(itemId: string): void {
  const el = document.querySelector<HTMLInputElement>(`[data-item-input="${CSS.escape(itemId)}"]`);
  if (el) { el.focus(); el.select(); }
}
