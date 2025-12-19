import React from 'react';

interface ListItemProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  active = false,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`
        px-4 py-2 cursor-pointer transition-colors
        ${active ? 'bg-accent/10 text-accent' : 'text-text-primary hover:bg-bg-elevated'}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
