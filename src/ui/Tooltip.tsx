import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  contentClassName?: string;
  containerClassName?: string;
}

const TRANSITION_MS = 150;
const LEAVE_GRACE_MS = 100;
const OFFSET_PX = 8;
const VIEWPORT_PADDING_PX = 12;

const POSITION_TRANSFORMS: Record<TooltipPosition, string> = {
  top: '-translate-x-1/2 -translate-y-full',
  bottom: '-translate-x-1/2',
  left: '-translate-x-full -translate-y-1/2',
  right: '-translate-y-1/2',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  contentClassName,
  containerClassName,
}) => {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const showTimeoutRef = useRef<number | null>(null);
  const leaveTimeoutRef = useRef<number | null>(null);
  const unmountTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const clearShowTimer = useCallback(() => {
    if (showTimeoutRef.current === null) return;
    window.clearTimeout(showTimeoutRef.current);
    showTimeoutRef.current = null;
  }, []);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimeoutRef.current === null) return;
    window.clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = null;
  }, []);

  const clearUnmountTimer = useCallback(() => {
    if (unmountTimeoutRef.current === null) return;
    window.clearTimeout(unmountTimeoutRef.current);
    unmountTimeoutRef.current = null;
  }, []);

  const cancelRaf = useCallback(() => {
    if (rafRef.current === null) return;
    window.cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    switch (position) {
      case 'top':
        setCoords({ left: centerX, top: rect.top - OFFSET_PX });
        break;
      case 'bottom':
        setCoords({ left: centerX, top: rect.bottom + OFFSET_PX });
        break;
      case 'left':
        setCoords({ left: rect.left - OFFSET_PX, top: centerY });
        break;
      case 'right':
        setCoords({ left: rect.right + OFFSET_PX, top: centerY });
        break;
      default:
        setCoords({ left: centerX, top: rect.top - OFFSET_PX });
    }
  }, [position]);

  const clampIntoViewport = useCallback(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const rect = tooltip.getBoundingClientRect();
    const maxRight = window.innerWidth - VIEWPORT_PADDING_PX;
    const maxBottom = window.innerHeight - VIEWPORT_PADDING_PX;

    let deltaX = 0;
    if (rect.left < VIEWPORT_PADDING_PX) {
      deltaX = VIEWPORT_PADDING_PX - rect.left;
    } else if (rect.right > maxRight) {
      deltaX = maxRight - rect.right;
    }

    let deltaY = 0;
    if (rect.top < VIEWPORT_PADDING_PX) {
      deltaY = VIEWPORT_PADDING_PX - rect.top;
    } else if (rect.bottom > maxBottom) {
      deltaY = maxBottom - rect.bottom;
    }

    const roundedX = Math.round(deltaX);
    const roundedY = Math.round(deltaY);
    if (roundedX === 0 && roundedY === 0) return;

    setCoords((prev) => {
      if (!prev) return prev;
      return { left: prev.left + roundedX, top: prev.top + roundedY };
    });
  }, []);

  const schedulePositionUpdate = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updatePosition();
    });
  }, [updatePosition]);

  const hide = useCallback(() => {
    clearShowTimer();
    clearLeaveTimer();
    clearUnmountTimer();
    setIsOpen(false);
    unmountTimeoutRef.current = window.setTimeout(() => {
      setIsMounted(false);
      setCoords(null);
      unmountTimeoutRef.current = null;
    }, TRANSITION_MS);
  }, [clearLeaveTimer, clearShowTimer, clearUnmountTimer, setCoords]);

  const show = useCallback(() => {
    clearShowTimer();
    clearLeaveTimer();
    clearUnmountTimer();
    showTimeoutRef.current = window.setTimeout(() => {
      updatePosition();
      setIsMounted(true);
      showTimeoutRef.current = null;
      window.requestAnimationFrame(() => setIsOpen(true));
    }, delay);
  }, [clearLeaveTimer, clearShowTimer, clearUnmountTimer, delay, updatePosition]);

  const scheduleHide = useCallback(() => {
    clearLeaveTimer();
    leaveTimeoutRef.current = window.setTimeout(() => {
      leaveTimeoutRef.current = null;
      hide();
    }, LEAVE_GRACE_MS);
  }, [clearLeaveTimer, hide]);

  useEffect(() => {
    return () => {
      clearShowTimer();
      clearLeaveTimer();
      clearUnmountTimer();
      cancelRaf();
    };
  }, [cancelRaf, clearLeaveTimer, clearShowTimer, clearUnmountTimer]);

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

  useEffect(() => {
    if (!isMounted) return undefined;
    schedulePositionUpdate();
    const onViewportChange = () => schedulePositionUpdate();
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    return () => {
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [isMounted, schedulePositionUpdate]);

  useEffect(() => {
    if (!isMounted || !coords || !isOpen) return undefined;
    const rafId = window.requestAnimationFrame(() => clampIntoViewport());
    return () => window.cancelAnimationFrame(rafId);
  }, [clampIntoViewport, coords, isMounted, isOpen]);

  return (
    <div
      ref={anchorRef}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      aria-describedby={isOpen ? tooltipId : undefined}
    >
      {children}

      {isMounted &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            onMouseEnter={clearLeaveTimer}
            onMouseLeave={scheduleHide}
            className={`fixed z-[2500] ${POSITION_TRANSFORMS[position]} transition-[opacity,transform] ease-out ${
              isOpen ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-[0.98]'
            }`}
            style={{
              left: coords.left,
              top: coords.top,
              transitionDuration: `${TRANSITION_MS}ms`,
            }}
          >
            <div
              className={`bg-surface3/95 backdrop-blur-xl border border-border1 rounded-card shadow-popover ring-1 ring-black/20 ${
                contentClassName ?? 'p-3'
              } ${containerClassName ?? ''}`}
            >
              {content}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Tooltip;
