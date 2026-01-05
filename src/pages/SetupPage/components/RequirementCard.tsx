import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Button } from '@/ui';
import type { RequirementStatus } from '@/types';

type Tone = 'success' | 'pending' | 'error';

interface RequirementCardProps {
  title: string;
  description: string;
  status: RequirementStatus;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  isLoading?: boolean;
  helperText?: string;
}

const toneConfig: Record<Tone, { icon: React.ComponentType<{ className?: string }>; badge: string; text: string }> = {
  success: {
    icon: CheckCircle2,
    badge: 'bg-successBg text-successFg border-successFg/30',
    text: 'text-successFg',
  },
  pending: {
    icon: Circle,
    badge: 'bg-surface2 text-text2 border-border2',
    text: 'text-text2',
  },
  error: {
    icon: XCircle,
    badge: 'bg-dangerBg text-dangerFg border-dangerFg/30',
    text: 'text-dangerFg',
  },
};

export const RequirementCard: React.FC<RequirementCardProps> = ({
  title,
  description,
  status,
  tone,
  actionLabel,
  onAction,
  actionDisabled,
  isLoading,
  helperText,
}) => {
  const { t } = useTranslation('setup');
  const resolvedTone: Tone = tone ?? (status.installed ? 'success' : status.error ? 'error' : 'pending');
  const { icon: Icon, badge, text } = toneConfig[resolvedTone];
  const statusLabel = status.installed
    ? t('setup.requirements.statusReady')
    : resolvedTone === 'error'
      ? t('setup.requirements.statusAttention')
      : t('setup.requirements.statusPending');

  return (
    <div className="group rounded-card border border-border1 bg-surface1 p-5 shadow-card transition-all duration-200 hover:border-border2 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${text}`} />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-text1">{title}</h3>
              <p className="text-sm text-text2">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-badge border px-2 py-1 text-xs font-semibold uppercase tracking-widest ${badge}`}>
            {statusLabel}
          </span>
          {status.version && (
            <span className="text-xs text-text3">{status.version}</span>
          )}
        </div>
      </div>

      {(status.error || helperText) && (
        <div className={`mt-3 text-xs ${resolvedTone === 'error' ? 'text-dangerFg' : 'text-text3'}`}>
          {status.error || helperText}
        </div>
      )}

      {actionLabel && onAction && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onAction}
            disabled={actionDisabled}
            isLoading={isLoading}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RequirementCard;
