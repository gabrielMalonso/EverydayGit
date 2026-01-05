import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@/ui';
import type { SetupMode } from '@/stores/setupStore';

interface SetupTabsProps {
  value: SetupMode;
  onChange: (value: SetupMode) => void;
}

export const SetupTabs: React.FC<SetupTabsProps> = ({ value, onChange }) => {
  const { t } = useTranslation('setup');

  return (
    <Tabs
      value={value}
      onChange={(next) => onChange(next as SetupMode)}
      options={[
        { value: 'assisted', label: t('setup.tabs.assisted') },
        { value: 'manual', label: t('setup.tabs.manual') },
      ]}
    />
  );
};

export default SetupTabs;
