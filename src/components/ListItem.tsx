import React, { useCallback } from 'react';

interface ListItemProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  active = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      aria-pressed={onClick ? active : undefined}
      className={`
        px-4 py-2 cursor-pointer transition-colors rounded-input
        ${active ? 'bg-primary/10 text-primary' : 'text-text1 hover:bg-surface2/60'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]
        ${className}
      `}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {children}
    </div>
  );
};
