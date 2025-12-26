import React from 'react';
import type { RequirementStatus } from '@/types';

type StepState = 'success' | 'pending' | 'error';

interface StepIndicatorProps {
  steps: Array<{
    label: string;
    status?: RequirementStatus | null;
    stateOverride?: StepState;
  }>;
}

const getStateFromStatus = (status?: RequirementStatus | null): StepState => {
  if (!status) return 'pending';
  if (status.installed) return 'success';
  if (status.error) return 'error';
  return 'pending';
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-text2">
      {steps.map((step, index) => {
        const state = step.stateOverride ?? getStateFromStatus(step.status);
        const dotClass =
          state === 'success'
            ? 'bg-successFg shadow-[0_0_0_4px_rgba(var(--status-success-fg),0.15)]'
            : state === 'error'
              ? 'bg-dangerFg shadow-[0_0_0_4px_rgba(var(--status-danger-fg),0.12)]'
              : 'bg-border2';

        return (
          <div key={step.label} className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
            <span className="text-text2">{step.label}</span>
            {index < steps.length - 1 && <span className="h-px w-8 bg-border2" />}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
