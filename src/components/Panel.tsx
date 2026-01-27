import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PanelProps {
  title?: React.ReactNode;
  headerLeft?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  collapsible?: boolean;
  collapseKey?: string;
  defaultCollapsed?: boolean;
  footer?: React.ReactNode;
  footerClassName?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  headerLeft,
  children,
  className = '',
  actions,
  contentClassName = '',
  headerClassName = '',
  collapsible = false,
  collapseKey,
  defaultCollapsed = false,
  footer,
  footerClassName = '',
}) => {
  const { t } = useTranslation('common');
  const { storageKey, legacyStorageKey } = useMemo(() => {
    if (!collapsible || !collapseKey) return { storageKey: null, legacyStorageKey: null };
    return {
      storageKey: `everydaygit.panel.${collapseKey}.collapsed`,
      legacyStorageKey: `gitflow-ai.panel.${collapseKey}.collapsed`,
    };
  }, [collapsible, collapseKey]);

  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible) return false;
    if (!storageKey || typeof window === 'undefined') return defaultCollapsed;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) return raw === '1';

      if (legacyStorageKey) {
        const legacyRaw = window.localStorage.getItem(legacyStorageKey);
        if (legacyRaw !== null) {
          window.localStorage.setItem(storageKey, legacyRaw);
          return legacyRaw === '1';
        }
      }

      return defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, collapsed ? '1' : '0');
    } catch {
      // ignore storage failures (private mode, disabled storage, etc.)
    }
  }, [collapsed, storageKey]);

  const showHeader = Boolean(headerLeft) || Boolean(title) || Boolean(actions) || collapsible;

  return (
    <div
      data-collapsed={collapsible ? String(collapsed) : undefined}
      className={`flex flex-col overflow-hidden rounded-card border border-border1 bg-surface1 shadow-card transition-all duration-200 ease-out ${className} ${
        collapsible && collapsed ? 'flex-none h-auto' : ''
      }`}
    >
      {showHeader && (
        <div
          className={`flex items-center justify-between gap-3 border-b border-border1 px-5 py-1 ${headerClassName}`}
        >
          <div className="min-w-0">
            {headerLeft ? (
              headerLeft
            ) : (
              <h3 className="text-base font-semibold text-text1">
                <span className="block truncate">{title}</span>
              </h3>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {actions && <div className="flex items-center gap-2">{actions}</div>}

            {collapsible && (
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={collapsed ? t('panel.expand') : t('panel.collapse')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-button text-text2 transition-colors hover:bg-surface2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8l4 4 4-4" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className={`grid flex-1 min-h-0 transition-[grid-template-rows] duration-200 ease-out ${
          collapsible && collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
        }`}
      >
        <div className="min-h-0 min-w-0 flex flex-col">
          <div className={`flex-1 min-w-0 overflow-auto ${contentClassName}`}>{children}</div>
          {footer && (
            <div className={`shrink-0 border-t border-border1 ${footerClassName}`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
