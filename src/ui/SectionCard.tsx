import React from 'react';

type IconComponent = React.ComponentType<{ className?: string }>;

export interface SectionCardProps {
  title: React.ReactNode;
  Icon?: IconComponent;
  action?: React.ReactNode;
  children: React.ReactNode;
  titleClassName?: string;
  className?: string;
  headerMarginClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  Icon,
  action,
  children,
  titleClassName,
  className,
  headerMarginClassName,
}) => {
  return (
    <div
      className={`bg-surface1 rounded-card shadow-card p-6 border border-border1 transition-all duration-200 hover:shadow-elevated hover:border-border2 ${className ?? ''}`}
    >
      <div className={`flex items-center justify-between gap-4 ${headerMarginClassName ?? 'mb-4'}`}>
        <div className="flex-1 min-w-0">
          <h2 className={`${titleClassName ?? 'text-lg'} font-semibold text-text1 flex items-center whitespace-nowrap`}>
            {Icon && <Icon className="mr-3 h-5 w-5 text-primarySoft" />}
            <span className="truncate">{title}</span>
          </h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SectionCard;
