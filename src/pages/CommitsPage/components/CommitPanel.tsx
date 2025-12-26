import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { Button, Spinner, ToggleSwitch, Tooltip } from '@/ui';
import { Textarea } from '@/components/Textarea';
import { useGitStore } from '@/stores/gitStore';
import { useAiStore } from '@/stores/aiStore';
import { useMergeStore } from '@/stores/mergeStore';
import { useToastStore } from '@/stores/toastStore';
import { useGit } from '@/hooks/useGit';
import { useAi } from '@/hooks/useAi';
import { AmendWarningModal } from './AmendWarningModal';

interface CommitPanelProps {
  className?: string;
}

export const CommitPanel: React.FC<CommitPanelProps> = ({ className = '' }) => {
  const { status } = useGitStore();
  const { commitMessageDraft, setCommitMessageDraft, isGenerating } = useAiStore();
  const { isMergeInProgress } = useMergeStore();
  const { showToast } = useToastStore();
  const { commit, amendCommit, getAllDiff, pull, push, stageAll, refreshCommits, isLastCommitPushed } = useGit();
  const { generateCommitMessage } = useAi();
  const [isPushing, setIsPushing] = React.useState(false);
  const [isPulling, setIsPulling] = React.useState(false);
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
      if (useGitStore.getState().commits.length === 0) {
        await refreshCommits(1);
      }

      const latest = useGitStore.getState().commits[0];
      if (!latest) {
        showToast('Nenhum commit para amend', 'error');
        setIsAmend(false);
        setCommitMessageDraft(previousDraftRef.current);
        previousDraftRef.current = '';
        return;
      }

      await stageAll();
      setCommitMessageDraft(latest.message);
    } catch (error) {
      console.error('Failed to prepare amend:', error);
      showToast('Falha ao preparar amend', 'error');
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
      showToast('Amend não permitido durante merge', 'warning');
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
        title="Commit"
        className={className}
        collapsible
        collapseKey="commit"
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-text3">
              {stagedCount > 0 ? `${stagedCount} staged` : 'No staged changes'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePush}
                variant="secondary"
                size="sm"
                className="!px-2.5"
                disabled={!status || status.ahead === 0 || isPushing || isPulling || isMergeInProgress}
                aria-label={status?.ahead ? `Push (${status.ahead} pending)` : 'Push'}
                title={isMergeInProgress ? 'Push bloqueado durante merge' : status?.ahead ? `Push (${status.ahead})` : 'Push'}
              >
                {isPushing ? <Spinner className="h-4 w-4" label="Pushing" /> : <ArrowUp className="h-4 w-4" aria-hidden />}
                {status?.ahead ? <span className="text-xs font-semibold tabular-nums">[{status.ahead}]</span> : null}
              </Button>
              <Button
                onClick={handlePull}
                variant="secondary"
                size="sm"
                className="!px-2.5"
                disabled={isPushing || isPulling || isMergeInProgress}
                aria-label={status?.behind ? `Pull (${status.behind} pending)` : 'Pull'}
                title={isMergeInProgress ? 'Pull bloqueado durante merge' : status?.behind ? `Pull (${status.behind})` : 'Pull'}
              >
                {isPulling ? <Spinner className="h-4 w-4" label="Pulling" /> : <ArrowDown className="h-4 w-4" aria-hidden />}
                {status?.behind ? <span className="text-xs font-semibold tabular-nums">[{status.behind}]</span> : null}
              </Button>
              <Button
                onClick={handleStageAll}
                variant="secondary"
                size="sm"
                className="w-9 !px-0"
                disabled={unstagedCount === 0 || isMergeInProgress}
                aria-label="Stage all"
                title={isMergeInProgress ? 'Stage bloqueado durante merge' : 'Stage all'}
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
                Gerar
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
                title={isMergeInProgress ? 'Commit bloqueado durante merge' : undefined}
              >
                {isAmend ? 'Amend' : 'Commit'}
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
                content={isAmend ? 'Desativar amend' : 'Amendar o último commit'}
                position="right"
              >
                <div>
                  <ToggleSwitch
                    checked={isAmend}
                    onToggle={handleToggleAmend}
                    loading={isPreparingAmend}
                    disabled={isGenerating || isPushing || isPulling || isMergeInProgress}
                    label="Amend"
                  />
                </div>
              </Tooltip>
              <div className="leading-tight">
                <div className="text-sm font-medium text-text2">Amend</div>
                <div className="text-xs text-text3">Inclui todas as mudanças no último commit (stage all)</div>
              </div>
            </div>
          </div>
          <Textarea
            value={commitMessageDraft}
            onChange={(e) => setCommitMessageDraft(e.target.value)}
            placeholder="Commit message..."
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
