import React from 'react';
import { Panel } from '@/components/Panel';
import { CommitsList } from '@/components/CommitsList';
import { Button, SelectMenu, Spinner } from '@/ui';
import type { BranchComparison } from '@/types';
import { ArrowRight, Bot } from 'lucide-react';

type BranchOption = {
  value: string;
  label: string;
};

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
  onAnalyzeMerge: () => void;
  mergeAnalysis: string | null;
  isAnalyzing: boolean;
  onSourceBranchChange: (value: string) => void;
  onTargetBranchChange: (value: string) => void;
  onMergeNow: () => void;
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
  onAnalyzeMerge,
  mergeAnalysis,
  isAnalyzing,
  onSourceBranchChange,
  onTargetBranchChange,
  onMergeNow,
}) => {
  return (
    <Panel
      title="Merge"
      className="col-span-2"
      actions={
        <Button
          size="sm"
          variant="primary"
          onClick={onMergeNow}
          disabled={mergeDisabled || isMergeInProgress}
          title={isMergeInProgress ? 'Merge bloqueado: já há um merge em andamento' : undefined}
        >
          Executar merge
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        {isMergeInProgress && (
          <div className="rounded-card-inner border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            <span className="font-medium">Merge já em andamento.</span> Resolva os conflitos antes de iniciar outro merge.
          </div>
        )}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-text3">Merge</div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-text3" htmlFor="merge-source">
                De
              </label>
              <SelectMenu
                id="merge-source"
                value={sourceBranch ?? ''}
                options={branchOptions}
                onChange={(value) => onSourceBranchChange(value as string)}
                placeholder="Origem"
                disabled={isMergeInProgress}
              />
            </div>
            <ArrowRight className="mt-5 text-text3" size={20} />
            <div className="flex-1">
              <label className="mb-1 block text-xs text-text3" htmlFor="merge-target">
                Para
              </label>
              <SelectMenu
                id="merge-target"
                value={targetBranch ?? ''}
                options={localBranchOptions}
                onChange={(value) => onTargetBranchChange(value as string)}
                placeholder="Destino"
                disabled={isMergeInProgress}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 text-xs">
            {isSameBranch && (
              <div className="text-warning">Origem e destino iguais. Ajuste para continuar.</div>
            )}
            {isTargetNotCurrent && targetBranch && (
              <div className="text-warning">Checkout sera feito para {targetBranch} antes do merge.</div>
            )}
            {hasNoCommits && <div className="text-text3">Branches ja sincronizadas.</div>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm lg:grid-cols-6">
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">Ahead</div>
            <div className="text-xl font-semibold text-text1">{aheadLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">Behind</div>
            <div className="text-xl font-semibold text-text1">{behindLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">Arquivos</div>
            <div className="text-xl font-semibold text-text1">{filesChangedLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">Insercoes</div>
            <div className="text-xl font-semibold text-success">{insertionsLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">Remocoes</div>
            <div className="text-xl font-semibold text-danger">{deletionsLabel}</div>
          </div>
          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="text-xs uppercase text-text3">Conflitos</div>
            <div className={`text-xl font-semibold ${hasConflicts ? 'text-danger' : 'text-text1'}`}>
              {conflictsLabel}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border1 bg-surface2 px-3 py-3 text-sm">
          <div className="text-xs uppercase text-text3">Commits</div>
          <CommitsList
            commits={comparison?.commits ?? []}
            maxHeight="max-h-36"
            emptyMessage="Sem commits para merge"
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
                    <Spinner className="h-4 w-4" label="Analyzing" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Bot size={16} />
                    Analisar merge com IA
                  </>
                )}
              </Button>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-xs uppercase text-text3">
                  <Bot size={14} />
                  Análise de IA
                </div>
                <div className="mt-2 whitespace-pre-wrap text-text2">{mergeAnalysis}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
};
