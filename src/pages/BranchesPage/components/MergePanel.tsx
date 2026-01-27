import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Panel } from '@/components/Panel';
import { CommitsList } from '@/components/CommitsList';
import { Button, SelectMenu, Spinner } from '@/ui';
import type { BranchComparison } from '@/types';
import { ArrowRight, Bot, CheckCircle2, GitMerge } from 'lucide-react';

const fadeSlideVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const fadeSlideTransition = { duration: 0.16, ease: 'easeOut' as const };

type BranchOption = {
  value: string;
  label: string;
};

interface MergeCompletedInfo {
  source: string;
  target: string;
}

interface MergePanelProps {
  sourceBranch: string | null;
  targetBranch: string | null;
  branchOptions: BranchOption[];
  localBranchOptions: BranchOption[];
  comparison: BranchComparison | null;
  isSameBranch: boolean;
  isTargetNotCurrent: boolean;
  hasNoCommits: boolean;
  hasConflicts: boolean;
  aheadLabel: number | string;
  behindLabel: number | string;
  filesChangedLabel: string;
  insertionsLabel: string;
  deletionsLabel: string;
  conflictsLabel: string;
  mergeDisabled: boolean;
  isMergeInProgress?: boolean;
  mergeCompleted?: MergeCompletedInfo | null;
  onAnalyzeMerge: () => void;
  mergeAnalysis: string | null;
  isAnalyzing: boolean;
  onSourceBranchChange: (value: string) => void;
  onTargetBranchChange: (value: string) => void;
  onMergeNow: () => void;
  onDismissMergeCompleted?: () => void;
}

export const MergePanel: React.FC<MergePanelProps> = ({
  sourceBranch,
  targetBranch,
  branchOptions,
  localBranchOptions,
  comparison,
  isSameBranch,
  isTargetNotCurrent,
  hasNoCommits,
  hasConflicts,
  aheadLabel,
  behindLabel,
  filesChangedLabel,
  insertionsLabel,
  deletionsLabel,
  conflictsLabel,
  mergeDisabled,
  isMergeInProgress,
  mergeCompleted,
  onAnalyzeMerge,
  mergeAnalysis,
  isAnalyzing,
  onSourceBranchChange,
  onTargetBranchChange,
  onMergeNow,
  onDismissMergeCompleted,
}) => {
  const { t } = useTranslation('branches');

  return (
    <Panel
      title={t('merge.title')}
      className="col-span-2"
      actions={
        !mergeCompleted && (
          <Button
            size="sm"
            variant="primary"
            onClick={onMergeNow}
            disabled={mergeDisabled || isMergeInProgress}
            title={isMergeInProgress ? t('merge.mergeBlockedInProgress') : undefined}
          >
            {t('merge.execute')}
          </Button>
        )
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {mergeCompleted ? (
          <motion.div
            key="merge-completed"
            variants={fadeSlideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeSlideTransition}
            className="flex h-full flex-col items-center justify-center gap-6 p-8"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text1">{t('merge.completed')}</h3>
              <p className="mt-2 text-sm text-text2">
                {t('merge.completedDescription', {
                  source: mergeCompleted.source,
                  target: mergeCompleted.target,
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-card-inner border border-border1 bg-surface2 px-4 py-2">
              <span className="font-mono text-sm text-text2">{mergeCompleted.source}</span>
              <GitMerge className="h-4 w-4 text-success" />
              <span className="font-mono text-sm text-text2">{mergeCompleted.target}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onDismissMergeCompleted}>
              {t('merge.startNewMerge')}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="merge-form"
            variants={fadeSlideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeSlideTransition}
            className="flex flex-col gap-4 p-4"
          >
        {isMergeInProgress && (
          <div className="rounded-card-inner border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            <span className="font-medium">{t('merge.mergeInProgress')}</span> {t('merge.resolveConflictsFirst')}
          </div>
        )}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-text3">{t('merge.title')}</div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-text3" htmlFor="merge-source">
                {t('merge.from')}
              </label>
              <SelectMenu
                id="merge-source"
                value={sourceBranch ?? ''}
                options={branchOptions}
                onChange={(value) => onSourceBranchChange(value as string)}
                placeholder={t('merge.source')}
                disabled={isMergeInProgress}
              />
            </div>
            <ArrowRight className="mt-5 text-text3" size={20} />
            <div className="flex-1">
              <label className="mb-1 block text-xs text-text3" htmlFor="merge-target">
                {t('merge.to')}
              </label>
              <SelectMenu
                id="merge-target"
                value={targetBranch ?? ''}
                options={localBranchOptions}
                onChange={(value) => onTargetBranchChange(value as string)}
                placeholder={t('merge.target')}
                disabled={isMergeInProgress}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 text-xs">
            {isSameBranch && (
              <div className="text-warning">{t('merge.sameBranch')}</div>
            )}
            {isTargetNotCurrent && targetBranch && (
              <div className="text-warning">{t('merge.checkoutRequired', { branch: targetBranch })}</div>
            )}
            {hasNoCommits && <div className="text-text3">{t('merge.alreadySynced')}</div>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm lg:grid-cols-6">
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">{t('merge.ahead')}</div>
            <div className="text-xl font-semibold text-text1">{aheadLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">{t('merge.behind')}</div>
            <div className="text-xl font-semibold text-text1">{behindLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">{t('merge.files')}</div>
            <div className="text-xl font-semibold text-text1">{filesChangedLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">{t('merge.insertions')}</div>
            <div className="text-xl font-semibold text-success">{insertionsLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">{t('merge.deletions')}</div>
            <div className="text-xl font-semibold text-danger">{deletionsLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">{t('merge.conflicts')}</div>
            <div className={`text-xl font-semibold ${hasConflicts ? 'text-danger' : 'text-text1'}`}>
              {conflictsLabel}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border1 bg-surface2 px-3 py-3 text-sm">
          <div className="text-xs uppercase text-text3">{t('merge.commits')}</div>
          <CommitsList
            commits={comparison?.commits ?? []}
            maxHeight="max-h-36"
            emptyMessage={t('merge.noCommitsToMerge')}
            tooltipPosition="left"
            className="mt-2"
          />
        </div>

        {hasConflicts && (
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3 text-sm">
            {!mergeAnalysis ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onAnalyzeMerge}
                disabled={isAnalyzing}
                className="w-full justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Spinner className="h-4 w-4" label={t('merge.analyzing')} />
                    {t('merge.analyzing')}
                  </>
                ) : (
                  <>
                    <Bot size={16} />
                    {t('merge.analyzeWithAI')}
                  </>
                )}
              </Button>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-xs uppercase text-text3">
                  <Bot size={14} />
                  {t('merge.aiAnalysis')}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-text2">{mergeAnalysis}</div>
              </div>
            )}
          </div>
        )}
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
};
