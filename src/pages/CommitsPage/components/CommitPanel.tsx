import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '@/components/Panel';
import { Button, Spinner, ToggleSwitch, Tooltip } from '@/ui';
import { Textarea } from '@/components/Textarea';
import { useTabGit } from '@/hooks/useTabGit';
import { useTabAi } from '@/hooks/useTabAi';
import { useTabMerge } from '@/hooks/useTabMerge';
import { useTabRepo } from '@/hooks/useTabRepo';
import { useCurrentTabId } from '@/contexts/TabContext';
import { useTabStore } from '@/stores/tabStore';
import { AmendWarningModal } from './AmendWarningModal';

interface CommitPanelProps {
  className?: string;
}

export const CommitPanel: React.FC<CommitPanelProps> = ({ className = '' }) => {
  const { t } = useTranslation('commits');
  const tabId = useCurrentTabId();
  const { status, commit, amendCommit, getAllDiff, pull, push, stageAll, refreshCommits, refreshAll, isLastCommitPushed } = useTabGit();
  const { commitMessageDraft, setCommitMessageDraft, isGenerating, generateCommitMessage } = useTabAi();
  const { isMergeInProgress } = useTabMerge();
  const { repoPath, repoState } = useTabRepo();
  const [isPushing, setIsPushing] = React.useState(false);
  const [isPulling, setIsPulling] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isAmend, setIsAmend] = React.useState(false);
  const [isPreparingAmend, setIsPreparingAmend] = React.useState(false);
  const [showAmendWarning, setShowAmendWarning] = React.useState(false);
  const previousDraftRef = React.useRef<string>('');

  const stagedCount = useMemo(() => status?.files.filter((file) => file.staged).length ?? 0, [status]);
  const unstagedCount = useMemo(() => status?.files.filter((file) => !file.staged).length ?? 0, [status]);

  const handleCommit = async () => {
    if (!commitMessageDraft.trim()) return;

    try {
      if (isAmend) {
        await amendCommit(commitMessageDraft);
        setIsAmend(false);
        previousDraftRef.current = '';
      } else {
        await commit(commitMessageDraft);
      }
      setCommitMessageDraft('');
    } catch {
      // Toast já exibe o erro
    }
  };

  const proceedWithAmend = async () => {
    previousDraftRef.current = commitMessageDraft;
    setIsAmend(true);

    try {
      if ((useTabStore.getState().getTab(tabId)?.git?.commits?.length ?? 0) === 0) {
        await refreshCommits(1);
      }

      const latest = useTabStore.getState().getTab(tabId)?.git?.commits?.[0];
      if (!latest) {
        toast.error(t('amend.noCommitToAmend'));
        setIsAmend(false);
        setCommitMessageDraft(previousDraftRef.current);
        previousDraftRef.current = '';
        return;
      }

      await stageAll();
      setCommitMessageDraft(latest.message);
    } catch (error) {
      console.error('Failed to prepare amend:', error);
      toast.error(t('amend.failedToPrepare'));
      setIsAmend(false);
      setCommitMessageDraft(previousDraftRef.current);
      previousDraftRef.current = '';
    } finally {
      setIsPreparingAmend(false);
    }
  };

  const handleToggleAmend = async () => {
    if (isPreparingAmend) return;
    if (isMergeInProgress) {
      toast.warning(t('amend.notAllowedDuringMerge'));
      return;
    }

    if (isAmend) {
      setIsAmend(false);
      setCommitMessageDraft(previousDraftRef.current);
      previousDraftRef.current = '';
      return;
    }

    setIsPreparingAmend(true);
    const pushed = await isLastCommitPushed();
    if (pushed) {
      setIsPreparingAmend(false);
      setShowAmendWarning(true);
      return;
    }

    await proceedWithAmend();
  };

  const handleAmendWarningConfirm = async () => {
    if (isPreparingAmend) return;
    setShowAmendWarning(false);
    setIsPreparingAmend(true);
    await proceedWithAmend();
  };

  const handlePush = async () => {
    if (isPushing || isPulling) return;
    try {
      setIsPushing(true);
      await push();
    } catch {
      // Toast já exibe o erro
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    if (isPushing || isPulling) return;
    try {
      setIsPulling(true);
      await pull();
    } catch {
      // Toast já exibe o erro
    } finally {
      setIsPulling(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing || isPushing || isPulling) return;
    if (!repoPath || repoState !== 'git') return;
    try {
      setIsRefreshing(true);
      await refreshAll(50);
      toast.info(t('panel.updated'));
    } catch {
      toast.error(t('panel.updateFailed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStageAll = async () => {
    try {
      await stageAll();
    } catch {
      // Toast exibe erro se necessário
    }
  };

  const handleGenerateCommit = async () => {
    try {
      const diff = await getAllDiff(true);
      if (!diff || diff.trim() === '') return;
      const suggestion = await generateCommitMessage(diff);
      if (suggestion) setCommitMessageDraft(suggestion);
    } catch {
      // Toast já exibe o erro
    }
  };

  return (
    <>
      <Panel
        title={t('panel.title')}
        className={className}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-text3">
              {stagedCount > 0 ? t('panel.stagedCount', { count: stagedCount }) : t('panel.noStagedChanges')}
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="secondary"
                size="sm"
                className="w-9 !px-0"
                disabled={!repoPath || repoState !== 'git' || isRefreshing || isPushing || isPulling}
                aria-label={t('actions.refresh')}
                title={t('panel.refreshTitle')}
              >
                {isRefreshing ? (
                  <Spinner className="h-4 w-4" label={t('panel.refreshing')} />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden />
                )}
              </Button>
              <Button
                onClick={handlePush}
                variant="secondary"
                size="sm"
                className="!px-2.5"
                disabled={!status || status.ahead === 0 || isRefreshing || isPushing || isPulling || isMergeInProgress}
                aria-label={status?.ahead ? `${t('actions.push')} (${status.ahead})` : t('actions.push')}
                title={isMergeInProgress ? t('actions.pushBlocked') : status?.ahead ? `${t('actions.push')} (${status.ahead})` : t('actions.push')}
              >
                {isPushing ? <Spinner className="h-4 w-4" label={t('panel.pushing')} /> : <ArrowUp className="h-4 w-4" aria-hidden />}
                {status?.ahead ? <span className="text-xs font-semibold tabular-nums">[{status.ahead}]</span> : null}
              </Button>
              <Button
                onClick={handlePull}
                variant="secondary"
                size="sm"
                className="!px-2.5"
                disabled={isRefreshing || isPushing || isPulling || isMergeInProgress}
                aria-label={status?.behind ? `${t('actions.pull')} (${status.behind})` : t('actions.pull')}
                title={isMergeInProgress ? t('actions.pullBlocked') : status?.behind ? `${t('actions.pull')} (${status.behind})` : t('actions.pull')}
              >
                {isPulling ? <Spinner className="h-4 w-4" label={t('panel.pulling')} /> : <ArrowDown className="h-4 w-4" aria-hidden />}
                {status?.behind ? <span className="text-xs font-semibold tabular-nums">[{status.behind}]</span> : null}
              </Button>
              <Button
                onClick={handleStageAll}
                variant="secondary"
                size="sm"
                className="w-9 !px-0"
                disabled={unstagedCount === 0 || isMergeInProgress}
                aria-label={t('actions.stageAll')}
                title={isMergeInProgress ? t('actions.stageBlocked') : t('actions.stageAll')}
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                onClick={handleGenerateCommit}
                size="sm"
                variant="secondary"
                isLoading={isGenerating}
                disabled={stagedCount === 0 || isPreparingAmend}
              >
                {t('panel.generate')}
              </Button>
              <Button
                onClick={handleCommit}
                size="sm"
                disabled={
                  !commitMessageDraft.trim() ||
                  isGenerating ||
                  isPreparingAmend ||
                  (!isAmend && stagedCount === 0) ||
                  isMergeInProgress
                }
                title={isMergeInProgress ? t('actions.commitBlocked') : undefined}
              >
                {isAmend ? t('amend.label') : t('panel.title')}
              </Button>
            </div>
          </div>
        }
        contentClassName="p-4"
      >
        <div>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Tooltip
                content={isAmend ? t('amend.disable') : t('amend.enable')}
                position="right"
              >
                <div>
                  <ToggleSwitch
                    checked={isAmend}
                    onToggle={handleToggleAmend}
                    loading={isPreparingAmend}
                    disabled={isGenerating || isPushing || isPulling || isMergeInProgress}
                    label={t('amend.label')}
                  />
                </div>
              </Tooltip>
              <div className="leading-tight">
                <div className="text-sm font-medium text-text2">{t('amend.label')}</div>
                <div className="text-xs text-text3">{t('amend.description')}</div>
              </div>
            </div>
          </div>
          <Textarea
            value={commitMessageDraft}
            onChange={(e) => setCommitMessageDraft(e.target.value)}
            placeholder={t('panel.messagePlaceholder')}
            rows={5}
          />
        </div>
      </Panel>
      <AmendWarningModal
        isOpen={showAmendWarning}
        onClose={() => setShowAmendWarning(false)}
        onConfirm={handleAmendWarningConfirm}
      />
    </>
  );
};
