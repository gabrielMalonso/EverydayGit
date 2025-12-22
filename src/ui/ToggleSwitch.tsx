import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

export interface ToggleSwitchProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  label?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onToggle,
  disabled = false,
  loading = false,
  ariaLabel,
  label,
  className = '',
}) => {
  const isInteractive = !(disabled || loading);

  const resolvedAriaLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    if (label) return `${checked ? 'Desativar' : 'Ativar'} ${label}`;
    return checked ? 'Desativar' : 'Ativar';
  }, [ariaLabel, label, checked]);

  const handleToggle = useCallback(() => {
    if (!isInteractive || !onToggle) return;
    onToggle();
  }, [isInteractive, onToggle]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isInteractive) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle?.();
      }
    },
    [isInteractive, onToggle]
  );

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={resolvedAriaLabel}
      disabled={!isInteractive}
      aria-disabled={!isInteractive}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`relative flex h-7 w-12 flex-shrink-0 items-center rounded-avatar p-[2px] transition-colors duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-bg))] focus-visible:shadow-focus ${
        isInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
      } ${checked ? 'bg-primary' : 'bg-border1/60'} ${className}`}
    >
      <span className="sr-only">{resolvedAriaLabel}</span>
      <motion.div
        className="absolute left-[2px] top-[2px] h-[24px] w-[24px] rounded-avatar bg-white"
        style={{ willChange: 'transform' }}
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
      />
    </motion.button>
  );
};

export default ToggleSwitch;
