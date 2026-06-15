"use client";

import { useCallback, useRef } from "react";

const DEFAULT_DELAY_MS = 500;

/** Touch long-press; desktop falls back to context menu. */
export function useLongPress(
  onLongPress: () => void,
  { delay = DEFAULT_DELAY_MS, disabled = false } = {}
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (disabled) return;
    movedRef.current = false;
    clear();
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) onLongPress();
    }, delay);
  }, [clear, delay, disabled, onLongPress]);

  const move = useCallback(() => {
    movedRef.current = true;
    clear();
  }, [clear]);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchCancel: clear,
    onTouchMove: move,
    onContextMenu: (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      onLongPress();
    },
  };
}
