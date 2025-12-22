import React, { useEffect, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type: ToastType;
  show: boolean;
  onClose: () => void;
  durationMs?: number;
}

export const DEFAULT_TOAST_DURATION_MS = 3000;
const TOAST_ANIMATION_MS = 300;

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
      <span className="flex h-5 w-5 items-center justify-center rounded-avatar bg-white text-successFg" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    ),
  },
  error: {
    container: 'bg-danger text-white',
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-avatar bg-white text-danger" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    ),
  },
  info: {
    container: 'bg-infoFg text-white',
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-avatar bg-white text-infoFg" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
          <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" />
        </svg>
      </span>
    ),
  },
  warning: {
    container: 'bg-warningBg text-warningFg',
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-avatar bg-white/80 text-warningFg" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
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
  const [render, setRender] = useState(show);
  const [visible, setVisible] = useState(show);
  const exitTimeoutRef = useRef<number | null>(null);
  const enterRafRef = useRef<number | null>(null);
  const enterRaf2Ref = useRef<number | null>(null);

  useEffect(() => {
    if (enterRafRef.current) cancelAnimationFrame(enterRafRef.current);
    if (enterRaf2Ref.current) cancelAnimationFrame(enterRaf2Ref.current);

    if (show) {
      if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current);
      setRender(true);

      enterRafRef.current = requestAnimationFrame(() => {
        enterRaf2Ref.current = requestAnimationFrame(() => setVisible(true));
      });

      return () => {
        if (enterRafRef.current) cancelAnimationFrame(enterRafRef.current);
        if (enterRaf2Ref.current) cancelAnimationFrame(enterRaf2Ref.current);
      };
    }

    setVisible(false);

    if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current);
    exitTimeoutRef.current = window.setTimeout(() => {
      setRender(false);
      exitTimeoutRef.current = null;
    }, TOAST_ANIMATION_MS);

    return () => {
      if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current);
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onClose, show]);

  if (!render) return null;

  const variant = VARIANT_STYLES[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[3000] flex min-w-[340px] max-w-lg flex-col gap-2 rounded-card p-2 shadow-popover transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        visible
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-3 scale-95 opacity-0'
      } ${variant.container}`}
      style={{
        bottom: `calc(var(--safe-area-inset-bottom, 0px) + 1rem)`,
        right: `calc(var(--safe-area-inset-right, 0px) + 1.25rem)`,
        willChange: 'opacity, transform',
      }}
      role="status"
    >
      <div className="flex items-center gap-3">
        {variant.icon}
        <p className="text-sm font-semibold leading-tight">{message}</p>
      </div>
    </div>
  );
};

export default Toast;
