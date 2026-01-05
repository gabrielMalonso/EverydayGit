import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/ui';

interface ManualSetupProps {
  isChecking: boolean;
  onRecheck: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const commands = [
  '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
  'brew install git gh',
  'gh auth login --web',
  null,
];

export const ManualSetup: React.FC<ManualSetupProps> = ({ isChecking, onRecheck }) => {
  const { t } = useTranslation('setup');

  const steps = [
    {
      title: t('setup.manual.step1Title'),
      description: t('setup.manual.step1Desc'),
      command: commands[0],
    },
    {
      title: t('setup.manual.step2Title'),
      description: t('setup.manual.step2Desc'),
      command: commands[1],
    },
    {
      title: t('setup.manual.step3Title'),
      description: t('setup.manual.step3Desc'),
      command: commands[2],
    },
    {
      title: t('setup.manual.step4Title'),
      description: t('setup.manual.step4Desc'),
      command: commands[3],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text2">{t('setup.manual.title')}</p>
          <p className="text-xs text-text3">{t('setup.manual.subtitle')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRecheck} isLoading={isChecking}>
          {t('setup.manual.recheck')}
        </Button>
      </div>

      <motion.ol
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4"
      >
        {steps.map((step, index) => (
          <motion.li
            key={index}
            variants={itemVariants}
            className="rounded-card border border-border1 bg-surface1 p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text3">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-base font-semibold text-text1">{step.title}</h3>
            </div>
            <p className="mt-2 text-sm text-text2">{step.description}</p>
            {step.command && (
              <div className="mt-3 rounded-card border border-border2 bg-surface2 p-3 font-mono text-xs text-text1">
                {step.command}
              </div>
            )}
          </motion.li>
        ))}
      </motion.ol>
    </div>
  );
};

export default ManualSetup;
