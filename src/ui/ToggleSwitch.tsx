import React, { useMemo } from 'react';

export interface ToggleSwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'onClick'> {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  label?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onToggle,
  disabled = false,
  loading = false,
  ariaLabel,
  label,
  className = '',
  ...rest
}) => {
  const isInteractive = !(disabled || loading);

  const resolvedAriaLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    if (label) return `${checked ? 'Desativar' : 'Ativar'} ${label}`;
    return checked ? 'Desativar' : 'Ativar';
  }, [ariaLabel, label, checked]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={resolvedAriaLabel}
      disabled={!isInteractive}
      aria-disabled={!isInteractive}
      onClick={() => {
        if (!isInteractive) return;
        onToggle();
      }}
      onKeyDown={(event) => {
        if (!isInteractive) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`relative flex h-7 w-12 items-center rounded-avatar p-[2px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-bg))] ${
        isInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
      } ${checked ? 'bg-primary' : 'bg-border1/70'} ${className}`}
      {...rest}
    >
      <span className="sr-only">{resolvedAriaLabel}</span>
      <span
        className="absolute left-[2px] top-[2px] h-[22px] w-[22px] rounded-avatar bg-white shadow-subtle transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0px)' }}
      />
    </button>
  );
};

export default ToggleSwitch;
