import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const Loader: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="status"
    aria-label="Loading"
    className="h-4 w-4 animate-spin text-current"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses =
    'appearance-none inline-flex items-center justify-center gap-2 rounded-button font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-surface-1))] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'border border-transparent bg-primary text-primaryContrast hover:bg-primary/90',
    secondary: 'border border-border1 bg-surface2 text-text1 hover:bg-surface1',
    danger: 'border border-transparent bg-danger text-dangerContrast hover:bg-danger/90',
    ghost: 'border border-transparent bg-transparent text-text2 hover:bg-surface2/70',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-base',
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader /> : children}
    </button>
  );
};

export default Button;
