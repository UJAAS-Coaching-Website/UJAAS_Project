import { useEffect } from 'react';

let activeLocks = 0;
let originalOverflow = '';
let originalPaddingRight = '';

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const body = document.body;
    const root = document.documentElement;

    if (activeLocks === 0) {
      originalOverflow = body.style.overflow;
      originalPaddingRight = body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - root.clientWidth;
      body.style.overflow = 'hidden';

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);

      if (activeLocks === 0) {
        body.style.overflow = originalOverflow;
        body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [locked]);
}
