import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
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
      <textarea
        className={`
          bg-surface2 text-text1 border border-border1 rounded-input px-3 py-2.5 text-sm
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:border-transparent
          placeholder:text-text3/80 resize-none
          ${error ? 'border-danger focus-visible:ring-danger' : ''}
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
