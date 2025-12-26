import React from 'react';
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

const steps = [
  {
    title: 'Instale o Homebrew',
    description: 'Se ainda nao tiver o Homebrew instalado, execute:',
    command: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
  },
  {
    title: 'Instale Git e GitHub CLI',
    description: 'Instale as ferramentas essenciais:',
    command: 'brew install git gh',
  },
  {
    title: 'Autentique no GitHub',
    description: 'Abra o fluxo OAuth no browser:',
    command: 'gh auth login --web',
  },
  {
    title: 'Volte e re-verifique',
    description: 'Depois de concluir, clique em Re-verificar aqui.',
  },
];

export const ManualSetup: React.FC<ManualSetupProps> = ({ isChecking, onRecheck }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text2">Siga os comandos no Terminal e retorne quando concluir.</p>
          <p className="text-xs text-text3">Se ja tiver tudo instalado, apenas re-verifique.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRecheck} isLoading={isChecking}>
          Re-verificar
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
            key={step.title}
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
