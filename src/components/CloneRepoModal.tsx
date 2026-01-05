import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, GitBranch, Loader2 } from 'lucide-react';
import { Button, Input } from '@/ui';
import { useTabRepo } from '@/hooks/useTabRepo';
import { useRecentReposStore } from '@/stores/recentReposStore';
import { toast } from 'sonner';
import { isTauriRuntime } from '@/demo/demoMode';

interface CloneRepoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CloneRepoModal: React.FC<CloneRepoModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation('setup');
    const { t: tCommon } = useTranslation('common');
    const [url, setUrl] = useState('');
    const [destination, setDestination] = useState('');
    const [isCloning, setIsCloning] = useState(false);
    const { setRepository } = useTabRepo();
    const { addRepo } = useRecentReposStore();

    const handleSelectDestination = async () => {
        if (!isTauriRuntime()) return;

        const selected = await open({
            directory: true,
            multiple: false,
            title: t('cloneRepo.destination'),
        });

        if (selected && typeof selected === 'string') {
            // Extract repo name from URL and append to destination
            const repoName = extractRepoName(url) || 'repo';
            setDestination(`${selected}/${repoName}`);
        }
    };

    const extractRepoName = (gitUrl: string): string => {
        // Handle various URL formats
        const match = gitUrl.match(/\/([^/]+?)(\.git)?$/);
        return match?.[1] || '';
    };

    const handleClone = async () => {
        if (!url.trim() || !destination.trim()) {
            toast.error(t('cloneRepo.cloneFailed'));
            return;
        }

        setIsCloning(true);
        try {
            await invoke('clone_repository_cmd', {
                url: url.trim(),
                destination: destination.trim(),
            });

            addRepo(destination.trim());
            await setRepository(destination.trim());
            toast.success(t('cloneRepo.cloneSuccess'));
            onClose();
            resetForm();
        } catch (error) {
            console.error('Clone failed:', error);
            toast.error(t('cloneRepo.cloneFailed'));
        } finally {
            setIsCloning(false);
        }
    };

    const resetForm = () => {
        setUrl('');
        setDestination('');
    };

    const handleClose = () => {
        if (!isCloning) {
            resetForm();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-bg p-6 shadow-xl">
                <div className="mb-6 flex items-center gap-3">
                    <GitBranch className="h-6 w-6 text-accent" />
                    <h2 className="text-lg font-semibold text-text1">
                        {t('cloneRepo.title')}
                    </h2>
                </div>

                <div className="mb-4">
                    <label className="mb-1.5 block text-sm font-medium text-text2">
                        {t('cloneRepo.urlLabel')}
                    </label>
                    <Input
                        type="text"
                        placeholder="https://github.com/user/repo.git"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isCloning}
                    />
                    <p className="mt-1 text-xs text-text3">
                        {t('cloneRepo.urlHint')}
                    </p>
                </div>

                <div className="mb-6">
                    <label className="mb-1.5 block text-sm font-medium text-text2">
                        {t('cloneRepo.destinationLabel')}
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="/Users/você/projetos/repo"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            disabled={isCloning}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSelectDestination}
                            variant="secondary"
                            disabled={isCloning}
                            className="shrink-0"
                        >
                            <FolderOpen className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={handleClose} disabled={isCloning}>
                        {tCommon('actions.cancel')}
                    </Button>
                    <Button
                        onClick={handleClone}
                        disabled={isCloning || !url.trim() || !destination.trim()}
                    >
                        {isCloning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('cloneRepo.cloning')}
                            </>
                        ) : (
                            t('cloneRepo.cloneButton')
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
