import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT = 768;

export function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );

  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return width;
}

export function useIsMobileViewport(breakpoint = MOBILE_BREAKPOINT) {
  const width = useWindowWidth();
  return width < breakpoint;
}
