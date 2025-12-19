import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-text-secondary font-medium">
          {label}
        </label>
      )}
      <input
        className={`
          bg-bg-elevated text-text-primary border border-border rounded px-3 py-2
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          placeholder:text-text-secondary/50
          ${error ? 'border-danger' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-sm text-danger">{error}</span>
      )}
    </div>
  );
};
