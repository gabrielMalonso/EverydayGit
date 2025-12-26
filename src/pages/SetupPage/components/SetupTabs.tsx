import React from 'react';
import { Tabs } from '@/ui';
import type { SetupMode } from '@/stores/setupStore';

interface SetupTabsProps {
  value: SetupMode;
  onChange: (value: SetupMode) => void;
}

export const SetupTabs: React.FC<SetupTabsProps> = ({ value, onChange }) => {
  return (
    <Tabs
      value={value}
      onChange={(next) => onChange(next as SetupMode)}
      options={[
        { value: 'assisted', label: 'Assistido' },
        { value: 'manual', label: 'Manual' },
      ]}
    />
  );
};

export default SetupTabs;
