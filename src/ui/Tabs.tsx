import React from 'react';

export interface TabsOption {
  value: string;
  label: React.ReactNode;
}

export interface TabsProps {
  options: TabsOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ options, value, onChange, className = '' }) => {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-button border border-border1 bg-surface2 p-1 ${className}`}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`rounded-button px-4 py-2 text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-surface1 text-text1 shadow-subtle'
                : 'text-text2 hover:bg-surface1/60 hover:text-text1'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
