import React from 'react';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  contentClassName?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  className = '',
  actions,
  contentClassName = '',
}) => {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-card border border-border1 bg-surface1 shadow-card ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-border1 px-5 py-3">
          <h3 className="text-sm font-semibold text-text1">{title}</h3>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className={`flex-1 overflow-auto ${contentClassName}`}>{children}</div>
    </div>
  );
};
