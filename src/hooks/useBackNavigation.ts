import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to handle back navigation in PWA
 * - Prevents app from closing on back button when on home
 * - Integrates with modal history system
 */
export function useBackNavigation() {
  const location = useLocation();
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once when on home page
    if (location.pathname === '/' && !initializedRef.current) {
      initializedRef.current = true;
      // Push initial state to have something to go back to
      window.history.pushState({ home: true }, '', '/');
    }
  }, [location.pathname]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we're on home and there's no modal state, prevent exit by pushing state again
      if (location.pathname === '/' && !event.state?.modal) {
        window.history.pushState({ home: true }, '', '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname]);
}
