import React, { useState } from 'react';

type IconComponent = React.ComponentType<{ className?: string }>;

const sanitizeEditableFontSizeClassName = (className?: string) => {
  if (!className) return '';

  return String(className)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => {
      if (token.includes('placeholder:') && token.includes('text-')) return true;

      const segments = token.split(':');
      const last = segments[segments.length - 1] || '';
      const base = last.startsWith('!') ? last.slice(1) : last;

      if (/^text-(xs|sm)(?:\/.+)?$/.test(base)) return false;

      const arbitrary = base.match(/^text-\[(.+)\](?:\/.+)?$/);
      if (!arbitrary) return true;

      const raw = arbitrary[1].trim();
      const pxMatch = raw.match(/^(\d+(?:\.\d+)?)px$/);
      if (pxMatch) return Number(pxMatch[1]) >= 16;

      const remMatch = raw.match(/^(\d+(?:\.\d+)?)rem$/);
      if (remMatch) return Number(remMatch[1]) * 16 >= 16;

      return true;
    })
    .join(' ');
};

export interface FloatingLabelInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'value' | 'onChange'> {
  floatingLabel: React.ReactNode;
  type?: React.HTMLInputTypeAttribute;
  value?: string | number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  Icon?: IconComponent;
  error?: string;
  wrapperClassName?: string;
  inputClassName?: string;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  id,
  floatingLabel,
  name,
  type = 'text',
  value,
  onChange,
  onClick,
  required = false,
  autoComplete,
  Icon,
  disabled = false,
  readOnly = false,
  className = '',
  inputClassName = '',
  wrapperClassName = '',
  error,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = value !== undefined && String(value).length > 0;
  const isNativeDateLike = type === 'date' || type === 'datetime-local' || type === 'month' || type === 'time';
  const isFloating = isNativeDateLike || isFocused || hasValue;

  const baseBorderClasses = 'border transition-colors duration-200';
  const errorBorderClasses = 'border-danger focus:ring-danger focus:border-danger';
  const defaultBorderClasses = 'border-border1 focus:ring-[rgb(var(--focus-ring))] focus:border-[rgb(var(--focus-ring))]';

  const labelClasses = `
    absolute ${Icon ? 'left-10' : 'left-3'} pointer-events-none transition-all duration-200 ease-out
    ${isFloating ? 'top-1.5 text-[10px] ' + (isFocused ? 'text-primarySoft' : 'text-text3') : 'top-1/2 -translate-y-1/2 text-sm text-text3'}
  `.trim();

  const mergedClassName = [className, inputClassName].filter(Boolean).join(' ');
  const safeClassName = sanitizeEditableFontSizeClassName(mergedClassName);

  return (
    <div className={wrapperClassName}>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className={`h-5 w-5 ${error ? 'text-danger' : 'text-text3'}`} />
          </span>
        )}

        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 pt-5 pb-1.5 text-base bg-surface2 rounded-input text-text1 focus:outline-none focus:ring-1 ${baseBorderClasses} ${error ? errorBorderClasses : defaultBorderClasses} disabled:bg-surface1 disabled:text-text3 disabled:cursor-not-allowed ${type === 'date' ? 'appearance-none [appearance:none] [-webkit-appearance:none]' : ''} ${safeClassName}`}
          value={value}
          onChange={onChange}
          onClick={onClick}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          readOnly={readOnly}
          {...rest}
        />

        <label htmlFor={id} className={labelClasses}>
          {floatingLabel}
        </label>
      </div>

      {error && (
        <div className="mt-2 flex items-center text-sm text-danger">
          <span className="mr-2 inline-block h-3 w-3 rounded-full bg-danger" aria-hidden />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FloatingLabelInput;
