import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage modal/sheet state with browser history
 * This allows the mobile back button to close modals sequentially
 * 
 * Usage:
 * const { isOpen, open, close } = useModalHistory('modal-name');
 */
export function useModalHistory(modalId: string) {
  const isOpenRef = useRef(false);
  
  const pushState = useCallback(() => {
    window.history.pushState({ modal: modalId }, '', window.location.href);
  }, [modalId]);
  
  const handlePopState = useCallback((event: PopStateEvent) => {
    // If this modal was open, it means we should close it
    if (isOpenRef.current) {
      isOpenRef.current = false;
      // Dispatch a custom event that components can listen to
      window.dispatchEvent(new CustomEvent('modal-close', { detail: { modalId } }));
    }
  }, [modalId]);
  
  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState]);
  
  const open = useCallback(() => {
    isOpenRef.current = true;
    pushState();
  }, [pushState]);
  
  const close = useCallback(() => {
    if (isOpenRef.current) {
      isOpenRef.current = false;
      // Go back in history to remove the modal state
      window.history.back();
    }
  }, []);
  
  const closeWithoutHistory = useCallback(() => {
    isOpenRef.current = false;
  }, []);
  
  return { open, close, closeWithoutHistory };
}

/**
 * Hook to listen for modal close events triggered by back navigation
 */
export function useModalCloseListener(modalId: string, onClose: () => void) {
  useEffect(() => {
    const handleModalClose = (event: CustomEvent<{ modalId: string }>) => {
      if (event.detail.modalId === modalId) {
        onClose();
      }
    };
    
    window.addEventListener('modal-close', handleModalClose as EventListener);
    return () => {
      window.removeEventListener('modal-close', handleModalClose as EventListener);
    };
  }, [modalId, onClose]);
}
