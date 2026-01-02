import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AnimatedTabsItem {
  key: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface AnimatedTabsProps {
  items: AnimatedTabsItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  containerClassName?: string;
  tabClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
  indicatorClassName?: string;
  transition?: { type: 'spring'; stiffness: number; damping: number };
}

const defaultTransition = { type: 'spring' as const, stiffness: 500, damping: 36 };

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  items,
  value,
  onChange,
  ariaLabel = 'Animated tabs',
  containerClassName = '',
  tabClassName = '',
  activeTextClassName = '',
  inactiveTextClassName = '',
  indicatorClassName = '',
  transition = defaultTransition,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRefs = React.useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const [indicator, setIndicator] = React.useState<{ x: number; y: number; width: number; height: number } | null>(
    null,
  );

  const updateIndicator = React.useCallback(() => {
    const container = containerRef.current;
    const activeButton = buttonRefs.current.get(value);
    if (!container || !activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicator({
      x: buttonRect.left - containerRect.left,
      y: buttonRect.top - containerRect.top,
      width: buttonRect.width,
      height: buttonRect.height,
    });
  }, [value]);

  React.useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, items]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => updateIndicator());
    observer.observe(container);

    const activeButton = buttonRefs.current.get(value);
    if (activeButton) observer.observe(activeButton);

    return () => observer.disconnect();
  }, [value, updateIndicator]);

  React.useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.ready) return;
    document.fonts.ready.then(updateIndicator).catch(() => undefined);
  }, [updateIndicator]);

  const motionTransition = prefersReducedMotion ? { duration: 0 } : transition;

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center gap-1 ${containerClassName}`}
    >
      {indicator && (
        <motion.div
          className={`pointer-events-none absolute left-0 top-0 ${indicatorClassName}`}
          initial={false}
          animate={{
            x: indicator.x,
            y: indicator.y,
            width: indicator.width,
            height: indicator.height,
          }}
          transition={motionTransition}
        />
      )}

      {items.map((item) => {
        const isActive = item.key === value;
        return (
          <button
            key={item.key}
            ref={(node) => {
              buttonRefs.current.set(item.key, node);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${item.key}-tab-panel`}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) onChange(item.key);
            }}
            className={`relative z-10 ${tabClassName} ${
              isActive ? activeTextClassName : inactiveTextClassName
            } ${item.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default AnimatedTabs;
