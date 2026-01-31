import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to handle back navigation in PWA
 * - If there's history, go back
 * - If at the first page, navigate to home
 * - Prevents app from closing on back button
 */
export function useBackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackNavigation = useCallback(() => {
    // If we're already on home, do nothing (or could minimize app)
    if (location.pathname === '/') {
      return;
    }
    
    // Check if we have history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // No history, go to home
      navigate('/', { replace: true });
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    // Handle the popstate event (browser back button)
    const handlePopState = (event: PopStateEvent) => {
      // Prevent default back behavior
      event.preventDefault();
      
      // If we're on home page, push a new state to prevent exit
      if (location.pathname === '/') {
        window.history.pushState(null, '', '/');
        return;
      }
    };

    // Push initial state to prevent immediate exit
    if (location.pathname === '/') {
      window.history.pushState(null, '', '/');
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname]);

  return { handleBackNavigation };
}
