import React, { useCallback, useEffect, useRef } from 'react';

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

const getFocusableElements = (root: HTMLElement | null) => {
  if (!root) return [] as HTMLElement[];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)).filter(
    (el) => !el.hasAttribute('aria-hidden') && !el.hasAttribute('disabled'),
  );
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
  closeLabel = 'Fechar',
}) => {
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

      const focusable = getFocusableElements(panelRef.current);
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panelRef.current?.contains(active)) {
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

    if (panel.contains(event.target as Node)) {
      return;
    }

    const focusable = getFocusableElements(panel);
    const target = focusable[0] || panel;
    target.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      restoreFocus();
      return undefined;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const focusable = getFocusableElements(panelRef.current);
    const target = focusable[0] || panelRef.current;
    target?.focus();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [handleFocusIn, handleKeyDown, isOpen, restoreFocus]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-overlay/70 backdrop-blur-sm p-4"
      onMouseDown={onClose}
    >
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-modal bg-surface1 border border-border1 shadow-modal transition-all duration-200 ${panelClassName ?? ''}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        tabIndex={-1}
        ref={panelRef}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-avatar p-2 text-text3 transition-colors hover:text-text1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-surface-1))]"
          aria-label={closeLabel}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className={`w-full ${contentClassName ?? 'max-h-[calc(100vh-6rem)] overflow-y-auto'}`}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
