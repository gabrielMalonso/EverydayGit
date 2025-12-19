import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
}

const TRANSITION_MS = 150;

const POSITION_CLASSES: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
}) => {
  const tooltipId = useId();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const showTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const clearShowTimer = useCallback(() => {
    if (showTimeoutRef.current === null) return;
    window.clearTimeout(showTimeoutRef.current);
    showTimeoutRef.current = null;
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimeoutRef.current === null) return;
    window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = null;
  }, []);

  const hide = useCallback(() => {
    clearShowTimer();
    clearHideTimer();
    setIsOpen(false);
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsMounted(false);
      hideTimeoutRef.current = null;
    }, TRANSITION_MS);
  }, [clearHideTimer, clearShowTimer]);

  const show = useCallback(() => {
    clearShowTimer();
    clearHideTimer();
    showTimeoutRef.current = window.setTimeout(() => {
      setIsMounted(true);
      showTimeoutRef.current = null;
      window.requestAnimationFrame(() => setIsOpen(true));
    }, delay);
  }, [clearHideTimer, clearShowTimer, delay]);

  useEffect(() => {
    return () => {
      clearShowTimer();
      clearHideTimer();
    };
  }, [clearHideTimer, clearShowTimer]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      hide();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [hide, isOpen]);

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      aria-describedby={isOpen ? tooltipId : undefined}
    >
      {children}

      {isMounted && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute ${POSITION_CLASSES[position]} z-50 transition-[opacity,transform] duration-150 ease-out ${
            isOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-1'
          }`}
          style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        >
          <div className="bg-surface3/95 backdrop-blur-xl border border-border1 rounded-card shadow-popover p-3">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
