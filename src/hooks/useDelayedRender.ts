import { useState, useEffect, useRef } from 'react';

/**
 * Keeps an element mounted for `delay` ms after `open` goes false,
 * so CSS exit animations can play before unmount.
 *
 * Returns [shouldRender, isExiting]
 * - shouldRender: true while the element should be in the DOM
 * - isExiting: true during the delay window (play exit animation here)
 */
export function useDelayedRender(open: boolean, delay = 200): [boolean, boolean] {
  const [shouldRender, setShouldRender] = useState(open);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (open) {
      setShouldRender(true);
      setIsExiting(false);
    } else {
      setIsExiting(true);
      timerRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
        timerRef.current = null;
      }, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, delay]);

  return [shouldRender, isExiting];
}
