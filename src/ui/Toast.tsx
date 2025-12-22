import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type: ToastType;
  show: boolean;
  onClose: () => void;
  durationMs?: number;
}

export const DEFAULT_TOAST_DURATION_MS = 3000;

const VARIANT_STYLES: Record<
  ToastType,
  {
    container: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    container: 'bg-successFg text-white',
    icon: (
      <span className="flex h-4 w-4 items-center justify-center rounded-avatar bg-white text-successFg" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none">
          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    ),
  },
  error: {
    container: 'bg-danger text-white',
    icon: (
      <span className="flex h-4 w-4 items-center justify-center rounded-avatar bg-white text-danger" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none">
          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    ),
  },
  info: {
    container: 'bg-infoFg text-white',
    icon: (
      <span className="flex h-4 w-4 items-center justify-center rounded-avatar bg-white text-infoFg" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none">
          <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" />
        </svg>
      </span>
    ),
  },
  warning: {
    container: 'bg-warningBg text-warningFg',
    icon: (
      <span className="flex h-4 w-4 items-center justify-center rounded-avatar bg-white/80 text-warningFg" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none">
          <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      </span>
    ),
  },
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  show,
  onClose,
  durationMs = DEFAULT_TOAST_DURATION_MS,
}) => {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onClose, show]);

  if (!show) return null;

  const variant = VARIANT_STYLES[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[3000] flex min-w-[340px] max-w-lg flex-col gap-1 rounded-card p-1 shadow-popover ${variant.container}`}
      style={{
        bottom: `calc(var(--safe-area-inset-bottom, 0px) + 1rem)`,
        right: `calc(var(--safe-area-inset-right, 0px) + 1.25rem)`,
      }}
      role="status"
    >
      <div className="flex items-center gap-2">
        {variant.icon}
        <p className="text-xs font-semibold leading-tight">{message}</p>
      </div>
    </div>
  );
};

export default Toast;
