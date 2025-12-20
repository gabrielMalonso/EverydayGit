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

const TOAST_KEYFRAME_ID = 'toast-shrink-keyframes';
const toastKeyframes = `
  @keyframes toast-shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

const ensureKeyframesInjected = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (!document.getElementById(TOAST_KEYFRAME_ID)) {
    const styleElement = document.createElement('style');
    styleElement.id = TOAST_KEYFRAME_ID;
    styleElement.textContent = toastKeyframes;
    document.head.appendChild(styleElement);
  }
};

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
      <span className="flex h-7 w-7 items-center justify-center rounded-avatar bg-white text-successFg" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    ),
  },
  error: {
    container: 'bg-danger text-white',
    icon: (
      <span className="flex h-7 w-7 items-center justify-center rounded-avatar bg-white text-danger" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    ),
  },
  info: {
    container: 'bg-infoFg text-white',
    icon: (
      <span className="flex h-7 w-7 items-center justify-center rounded-avatar bg-white text-infoFg" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" />
        </svg>
      </span>
    ),
  },
  warning: {
    container: 'bg-warningBg text-warningFg',
    icon: (
      <span className="flex h-7 w-7 items-center justify-center rounded-avatar bg-white/80 text-warningFg" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
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
    ensureKeyframesInjected();
  }, []);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onClose, show]);

  if (!show) return null;

  const variant = VARIANT_STYLES[type];

  return (
    <div
      className={`fixed right-6 top-6 z-[3000] flex min-w-[260px] max-w-sm flex-col gap-3 rounded-card p-4 shadow-popover ${variant.container}`}
      style={{
        top: `calc(var(--safe-area-inset-top-ui, var(--safe-area-inset-top, 0px)) + 1rem)`,
        right: `calc(var(--safe-area-inset-right, 0px) + 1.25rem)`,
      }}
      role="status"
    >
      <div className="flex items-center gap-3">
        {variant.icon}
        <p className="font-semibold leading-tight">{message}</p>
      </div>
      <div
        className="absolute bottom-0 left-0 h-1 bg-white/40"
        style={{ animation: `toast-shrink ${durationMs}ms linear forwards` }}
        aria-hidden
      />
    </div>
  );
};

export default Toast;
