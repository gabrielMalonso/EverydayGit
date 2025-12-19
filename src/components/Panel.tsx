import React from 'react';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  className = '',
  actions,
}) => {
  return (
    <div className={`bg-bg-secondary border border-border rounded-lg overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
