import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/** Drag-to-reorder built on Pointer Events (not the browser's native
 *  drag-and-drop, which only ever responds to a mouse — it has no touch
 *  support on any touchscreen device, by design of that API, not a bug).
 *  One implementation shared by mouse, touch and pen, and by both the
 *  desktop table and the mobile card layout. The drag only starts from
 *  whatever element calls `onPointerDown` — callers wire that to a grip
 *  handle specifically, not the whole row, so tapping into a text field
 *  to edit it can never be mistaken for a reorder gesture. */
export function useDragReorder(itemCount: number, onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => { itemRefs.current[index] = el; },
    [],
  );

  const findIndexAtY = (y: number): number | null => {
    for (let i = 0; i < itemCount; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) return i;
    }
    return null;
  };

  const onPointerDown = (index: number) => (e: ReactPointerEvent) => {
    // Capturing the pointer on the handle means move/up events keep firing
    // on it even once the finger/cursor has moved off it — essential for a
    // drag gesture, since the pointer will spend almost the whole gesture
    // over OTHER rows, not the handle it started on.
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIndex(index);
    setOverIndex(index);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (dragIndex === null) return;
    const idx = findIndexAtY(e.clientY);
    if (idx !== null) setOverIndex(idx);
  };

  const endDrag = () => {
    setDragIndex((from) => {
      setOverIndex((to) => {
        if (from !== null && to !== null && from !== to) onReorder(from, to);
        return null;
      });
      return null;
    });
  };

  const onPointerUp = () => endDrag();
  const onPointerCancel = () => endDrag();

  return { dragIndex, overIndex, setItemRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
