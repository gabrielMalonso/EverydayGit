import React, { useCallback, useEffect, useRef } from 'react';
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

const getFocusableElements = (root: HTMLElement | null) => {
  if (!root) return [] as HTMLElement[];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)).filter(
    (el) => !el.hasAttribute('aria-hidden') && !el.hasAttribute('disabled'),
  );
};

export interface SideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  widthClassName?: string;
  panelClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  closeLabel?: string;
}

export const SideSheet: React.FC<SideSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  widthClassName = 'w-[380px] max-w-[90vw]',
  panelClassName,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
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
      className="fixed inset-0 z-[1950] flex"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      <div className="absolute inset-0 bg-overlay/60 backdrop-blur-sm" aria-hidden />
      <div
        ref={panelRef}
        className={`relative ml-auto flex h-full flex-col bg-surface1 border-l border-border1 shadow-sheet transition-transform duration-200 ${widthClassName} ${panelClassName ?? ''}`}
        onMouseDown={(event) => event.stopPropagation()}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border1 px-5 py-4">
          <div className="space-y-1">
            {title && <h3 className="text-base font-semibold text-text1" id={ariaLabelledBy}>{title}</h3>}
            {description && (
              <p className="text-sm text-text3" id={ariaDescribedBy}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-avatar p-2 text-text3 transition-colors hover:text-text1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-surface-1))]"
            aria-label={closeLabel ?? t('actions.close')}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

export default SideSheet;
