import { useState, useEffect } from 'react';

/**
 * useWindowSize — Authoritative responsive hook for UNO Flip.
 * Tracks window resize, device orientation change, and visualViewport alterations.
 * Returns dynamic dimensions, responsive breakpoints, and device profile flags.
 */
export function useWindowSize() {
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isSmall: false,
        isShort: false,
        aspectRatio: 1.5,
      };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      width: w,
      height: h,
      isMobile: w < 768,
      isTablet: w >= 768 && w < 1024,
      isSmall: w < 480,
      isShort: h < 660,
      aspectRatio: w / (h || 1),
    };
  });

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setSize({
        width: w,
        height: h,
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1024,
        isSmall: w < 480,
        isShort: h < 660,
        aspectRatio: w / (h || 1),
      });
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return size;
}

export default useWindowSize;

