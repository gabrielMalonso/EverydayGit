import React from 'react';

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

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'value' | 'onChange'> {
  label?: React.ReactNode;
  type?: React.HTMLInputTypeAttribute;
  value?: string | number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  Icon?: IconComponent;
  RightIcon?: IconComponent;
  rightIcon?: React.ReactNode;
  error?: string;
  inputClassName?: string;
  wrapperClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  onClick,
  placeholder,
  required = false,
  autoComplete,
  Icon,
  RightIcon,
  rightIcon,
  disabled = false,
  readOnly = false,
  className = '',
  inputClassName = '',
  wrapperClassName = '',
  error,
  ...rest
}) => {
  const baseBorderClasses = 'border transition-colors duration-200';
  const errorBorderClasses = 'border-danger focus:ring-danger focus:border-danger';
  const defaultBorderClasses = 'border-border1 focus:ring-[rgb(var(--focus-ring))] focus:border-[rgb(var(--focus-ring))]';
  const mergedClassName = [className, inputClassName].filter(Boolean).join(' ');
  const safeClassName = sanitizeEditableFontSizeClassName(mergedClassName);
  const hasRightIcon = Boolean(rightIcon || RightIcon);

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text2">
          {label}
        </label>
      )}
      <div className="relative mt-2">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className={`h-5 w-5 ${error ? 'text-danger' : 'text-text3'}`} />
          </span>
        )}
        {hasRightIcon && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            {rightIcon ?? (RightIcon ? <RightIcon className={`h-5 w-5 ${error ? 'text-danger' : 'text-text3'}`} /> : null)}
          </span>
        )}
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${hasRightIcon ? 'pr-10' : 'pr-4'} h-10 text-sm bg-surface2 rounded-input text-text1 placeholder:text-text3 focus:outline-none focus:ring-2 ${baseBorderClasses} ${error ? errorBorderClasses : defaultBorderClasses} disabled:bg-surface1 disabled:text-text3 disabled:cursor-not-allowed ${type === 'date' ? 'appearance-none [appearance:none] [-webkit-appearance:none]' : ''} ${safeClassName}`}
          value={value}
          onChange={onChange}
          onClick={onClick}
          disabled={disabled}
          readOnly={readOnly}
          {...rest}
        />
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

export default Input;
