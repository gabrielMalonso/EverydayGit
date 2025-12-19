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
        px-4 py-2 cursor-pointer transition-colors rounded-input
        ${active ? 'bg-primary/10 text-primary' : 'text-text1 hover:bg-surface2/60'}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
