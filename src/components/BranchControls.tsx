import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings } from 'lucide-react';
import { Button, SelectMenu, SelectOption } from '../ui';
import { Badge } from './Badge';
import { PublishRepoModal } from './PublishRepoModal';
import { BranchInUseModal, parseBranchInUseError } from './BranchInUseModal';
import { useSettingsStore } from '../stores/settingsStore';
import { useTabGit } from '@/hooks/useTabGit';
import { useTabRepo } from '@/hooks/useTabRepo';
import { useContextKey } from '@/hooks/useTabId';
import { Tooltip } from '@/ui';
import { cn } from '@/lib/utils';

const isTauriRuntime = () => {
    if (typeof window === 'undefined') return false;
    const w = window as any;
    return Boolean(w.__TAURI__ || w.__TAURI_METADATA__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
};

export const BranchControls: React.FC = () => {
    const { repoPath, repoState } = useTabRepo();
    const { status, branches, worktrees, refreshWorktrees, checkoutBranch, checkoutRemoteBranch, removeWorktree, openWorktreeInNewTab } = useTabGit();
    const { setSettingsOpen } = useSettingsStore();
    const isTauri = isTauriRuntime();
    const contextKey = useContextKey();
    const [originUrl, setOriginUrl] = React.useState<string | null | undefined>(undefined);
    const [isPublishOpen, setIsPublishOpen] = React.useState(false);
    const [branchInUseError, setBranchInUseError] = React.useState<{ branchName: string; worktreePath: string } | null>(null);

    const refreshOrigin = React.useCallback(async () => {
        if (!repoPath || repoState !== 'git' || !isTauri) {
            setOriginUrl(undefined);
            return;
        }
        try {
            const origin = await invoke<string | null>('get_remote_origin_url_cmd', { contextKey });
            setOriginUrl(origin);
        } catch (error) {
            console.error('Failed to get remote origin:', error);
            setOriginUrl(null);
        }
    }, [repoPath, repoState, isTauri, contextKey]);

    React.useEffect(() => {
        refreshOrigin();
    }, [refreshOrigin]);

    type BranchOption = SelectOption & {
        kind?: 'local' | 'remote';
        remoteName?: string;
        inWorktree?: boolean;
    };

    const branchOptions: BranchOption[] = React.useMemo(() => {
        const nonMainWorktreeBranches = new Set(worktrees.filter(w => !w.is_main).map(w => w.branch));

        const normalizeName = (name: string) => name.replace(/^\+ /, '');

        const localBranches = branches.filter((b) => !b.remote);
        const remoteBranches = branches.filter((b) => b.remote);

        const localNameSet = new Set(localBranches.map((b) => normalizeName(b.name)));

        const getLocalName = (remoteName: string) => remoteName.replace(/^[^/]+\//, '');

        const orphanRemotes = remoteBranches.filter((b) => {
            const localEquiv = getLocalName(b.name);
            return !localNameSet.has(localEquiv) && !nonMainWorktreeBranches.has(localEquiv);
        });

        const localOptions: BranchOption[] = localBranches.map((branch) => ({
            value: normalizeName(branch.name),
            label: normalizeName(branch.name),
            disabled: branch.current,
            key: `local-${branch.name}`,
            kind: 'local' as const,
            inWorktree: nonMainWorktreeBranches.has(normalizeName(branch.name)),
        }));

        const remoteOptions: BranchOption[] = orphanRemotes.map((branch) => ({
            value: branch.name,
            label: getLocalName(branch.name),
            disabled: false,
            key: `remote-${branch.name}`,
            kind: 'remote' as const,
            remoteName: branch.name,
        }));

        const result: BranchOption[] = [];

        if (localOptions.length) {
            result.push(...localOptions);
        }

        if (remoteOptions.length) {
            if (result.length) {
                result.push({ type: 'divider', value: '__divider1__', label: 'divider', key: 'divider1' });
            }
            result.push(...remoteOptions);
        }

        return result;
    }, [branches, worktrees]);

    if (!status) return null;

    return (
        <>
            <div className="flex items-center gap-2 overflow-hidden">
                <SelectMenu
                    id="branch-selector-header"
                    value={status.current_branch}
                    options={branchOptions}
                    onChange={async (value, option) => {
                        const opt = option as BranchOption;
                        if (opt.kind === 'remote' && opt.remoteName) {
                            try {
                                await checkoutRemoteBranch(opt.remoteName);
                            } catch (error) {
                                const errorStr = String(error);
                                const parsed = parseBranchInUseError(errorStr);
                                if (parsed) {
                                    setBranchInUseError(parsed);
                                }
                            }
                        } else {
                            try {
                                await checkoutBranch(String(value));
                            } catch (error) {
                                const errorStr = String(error);
                                const parsed = parseBranchInUseError(errorStr);
                                if (parsed) {
                                    setBranchInUseError(parsed);
                                }
                            }
                        }
                    }}
                    align="right"
                    menuWidthClass="min-w-[180px]"
                    buttonClassName="flex items-center gap-2 rounded border border-border1 bg-surface3/80 px-2 py-[3px] text-xs text-text1 ring-1 ring-black/10 leading-none"
                    buttonContentClassName="flex min-w-0 max-w-[120px] items-center gap-1.5 truncate leading-none"
                    renderTriggerValue={(option) => (
                        <span className="truncate text-text1">{option?.label ?? status.current_branch}</span>
                    )}
                    renderOptionLabel={(option, { isSelected }) => {
                        const opt = option as BranchOption;
                        return (
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate">{option.label}</span>
                                <div className="flex items-center gap-1">
                                    {opt.inWorktree && <Badge variant="default">em worktree</Badge>}
                                    {opt.kind === 'remote' ? (
                                        <Badge variant="warning">remote</Badge>
                                    ) : (
                                        isSelected && <Badge variant="info">current</Badge>
                                    )}
                                </div>
                            </div>
                        );
                    }}
                />

                {originUrl === null && isTauri && (
                    <Button onClick={() => setIsPublishOpen(true)} variant="secondary" size="sm">
                        Publicar
                    </Button>
                )}

                {status.behind > 0 && <Badge variant="warning">↓ {status.behind}</Badge>}

                <Tooltip content="Settings" position="bottom">
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className={cn(
                            'flex h-7 w-7 items-center justify-center rounded transition-colors',
                            'text-text2 hover:bg-surface3 hover:text-text1',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        )}
                        aria-label="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </Tooltip>
            </div>

            <PublishRepoModal
                isOpen={isPublishOpen}
                onClose={() => setIsPublishOpen(false)}
                repoPath={repoPath}
                defaultName={repoPath ? repoPath.split(/[\\/]/).pop() || repoPath : ''}
                onPublished={() => refreshOrigin()}
            />

            {branchInUseError && (
                <BranchInUseModal
                    isOpen={true}
                    branchName={branchInUseError.branchName}
                    worktreePath={branchInUseError.worktreePath}
                    onClose={() => setBranchInUseError(null)}
                    onOpenWorktree={async () => {
                        try {
                            await openWorktreeInNewTab(branchInUseError.worktreePath, branchInUseError.branchName);
                        } catch (error) {
                            console.error('Failed to open worktree:', error);
                        }
                    }}
                    onRemoveWorktree={async () => {
                        try {
                            await removeWorktree(branchInUseError.worktreePath);
                            await refreshWorktrees();
                            await checkoutBranch(branchInUseError.branchName);
                            setBranchInUseError(null);
                        } catch (error) {
                            console.error('Failed to remove worktree:', error);
                        }
                    }}
                />
            )}
        </>
    );
};
