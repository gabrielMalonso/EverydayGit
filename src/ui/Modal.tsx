import React, { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  contentClassName?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  ariaLabel?: string;
  closeLabel?: string;
}

const getPortalRoots = () => {
  if (typeof document === 'undefined') return [] as HTMLElement[];
  return Array.from(document.querySelectorAll<HTMLElement>('[data-modal-portal="true"]'));
};

const isFocusAllowed = (root: HTMLElement | null, portalRoots: HTMLElement[], target: EventTarget | null) => {
  if (!root || !target || !(target instanceof Node)) return false;
  if (root.contains(target)) return true;
  return portalRoots.some((portal) => portal.contains(target));
};

const getFocusableElements = (root: HTMLElement | null, portalRoots: HTMLElement[]) => {
  if (!root || typeof document === 'undefined') return [] as HTMLElement[];
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)).filter((el) => {
    if (el.hasAttribute('aria-hidden') || el.hasAttribute('disabled')) return false;
    if (root.contains(el)) return true;
    return portalRoots.some((portal) => portal.contains(el));
  });
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  panelClassName,
  contentClassName,
  ariaLabelledBy,
  ariaDescribedBy,
  ariaLabel,
  closeLabel,
}) => {
  const { t } = useTranslation('common');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const restoreFocus = useCallback(() => {
    const prev = previouslyFocusedRef.current;
    if (prev && typeof prev.focus === 'function') {
      prev.focus();
    }
    previouslyFocusedRef.current = null;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const portalRoots = getPortalRoots();
      const focusable = getFocusableElements(panelRef.current, portalRoots);
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const activeIsFocusable = active ? focusable.includes(active) : false;

      if (event.shiftKey) {
        if (active === first || !activeIsFocusable) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [isOpen, onClose],
  );

  const handleFocusIn = useCallback((event: FocusEvent) => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    const portalRoots = getPortalRoots();
    if (isFocusAllowed(panel, portalRoots, event.target)) {
      return;
    }

    const focusable = getFocusableElements(panel, portalRoots);
    const target = focusable[0] || panel;
    target.focus();
  }, [isOpen]);



  useEffect(() => {
    if (!isOpen) {
      restoreFocus();
      return undefined;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const focusable = getFocusableElements(panelRef.current, getPortalRoots());
    const target = focusable[0] || panelRef.current;
    target?.focus();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [handleFocusIn, handleKeyDown, isOpen, restoreFocus]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-overlay/70 backdrop-blur-sm p-4"
          onMouseDown={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={`relative w-full max-w-lg overflow-hidden rounded-modal bg-surface1 border border-border1 shadow-modal ${panelClassName ?? ''}`}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            aria-label={ariaLabel}
            tabIndex={-1}
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-avatar p-2 text-text3 transition-colors hover:text-text1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-surface-1))]"
              aria-label={closeLabel ?? t('actions.close')}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className={`w-full ${contentClassName ?? 'max-h-[calc(100vh-6rem)] overflow-y-auto'}`}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
