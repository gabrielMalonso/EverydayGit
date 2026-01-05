import { useTranslation } from 'react-i18next';
import { FolderOpen, GitBranch, Clock } from 'lucide-react';
import logoMark from '@/assets/logo-mark.png';
import { Button } from '@/ui';
import { RecentReposList } from '@/components/RecentReposList';
import { CloneRepoModal } from '@/components/CloneRepoModal';
import { useTabRepo } from '@/hooks/useTabRepo';
import { useRecentReposStore } from '@/stores/recentReposStore';
import { isTauriRuntime } from '@/demo/demoMode';
import { open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';

export const WelcomePage: React.FC = () => {
    const { t } = useTranslation('setup');
    const { setRepository } = useTabRepo();
    const { addRepo } = useRecentReposStore();
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

    const handleSelectFolder = async () => {
        if (!isTauriRuntime()) return;

        const selected = await open({
            directory: true,
            multiple: false,
            title: t('welcome.selectFolder'),
        });

        if (selected && typeof selected === 'string') {
            addRepo(selected);
            await setRepository(selected);
        }
    };

    const handleOpenRecent = async (path: string) => {
        addRepo(path);
        await setRepository(path);
    };

    return (
        <div className="flex h-full flex-col items-center justify-center px-8">
            {/* Logo and Title */}
            <div className="mb-10 flex flex-col items-center">
                <img
                    src={logoMark}
                    alt="EverydayGit Logo"
                    className="mb-4 h-20 w-20 object-contain"
                />
                <h1 className="text-2xl font-semibold text-text1">{t('welcome.title')}</h1>
                <p className="mt-2 text-sm text-text3">
                    {t('welcome.subtitle')}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="mb-8 flex gap-4">
                <Button
                    onClick={handleSelectFolder}
                    size="lg"
                    className="flex items-center gap-2 px-6"
                >
                    <FolderOpen className="h-5 w-5" />
                    {t('welcome.selectFolder')}
                </Button>
                <Button
                    onClick={() => setIsCloneModalOpen(true)}
                    variant="secondary"
                    size="lg"
                    className="flex items-center gap-2 px-6"
                >
                    <GitBranch className="h-5 w-5" />
                    {t('welcome.cloneRepository')}
                </Button>
            </div>

            {/* Recent Repos Section */}
            <div className="w-full max-w-md">
                <div className="mb-3 flex items-center gap-2 text-sm text-text3">
                    <Clock className="h-4 w-4" />
                    <span>{t('welcome.recentRepos')}</span>
                </div>
                <RecentReposList onSelect={handleOpenRecent} limit={3} />
            </div>

            {/* Clone Modal */}
            <CloneRepoModal
                isOpen={isCloneModalOpen}
                onClose={() => setIsCloneModalOpen(false)}
            />
        </div>
    );
};
