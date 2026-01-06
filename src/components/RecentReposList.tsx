import { useTranslation } from 'react-i18next';
import { Folder, X } from 'lucide-react';
import { useRecentReposStore, useRecentRepos } from '@/stores/recentReposStore';

interface RecentReposListProps {
    onSelect: (path: string) => void;
    limit?: number;
}

export const RecentReposList: React.FC<RecentReposListProps> = ({
    onSelect,
    limit = 3,
}) => {
    const { t } = useTranslation('common');
    const recentRepos = useRecentRepos();
    const { removeRepo } = useRecentReposStore();

    const displayedRepos = recentRepos.slice(0, limit);

    if (displayedRepos.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-bgSide px-4 py-8 text-center">
                <p className="text-sm text-text3">
                    {t('repository.noRecentRepos')}
                </p>
            </div>
        );
    }

    const abbreviatePath = (path: string) => {
        const home = path.replace(/^\/Users\/[^/]+/, '~');
        const parts = home.split('/');
        if (parts.length > 3) {
            return `${parts[0]}/.../${parts.slice(-2).join('/')}`;
        }
        return home;
    };

    return (
        <div className="flex flex-col gap-2">
            {displayedRepos.map((repo) => (
                <div
                    key={repo.path}
                    onClick={() => onSelect(repo.path)}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-bgSide px-4 py-3 text-left transition-colors hover:border-accent hover:bg-bgSide/80 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect(repo.path);
                        }
                    }}
                >
                    <Folder className="h-5 w-5 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-text1">{repo.name}</p>
                        <p className="truncate text-xs text-text3">
                            {abbreviatePath(repo.path)}
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeRepo(repo.path);
                        }}
                        className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-bgHover group-hover:opacity-100"
                        aria-label={t('repository.removeFromHistory')}
                    >
                        <X className="h-4 w-4 text-text3" />
                    </button>
                </div>
            ))}
        </div>
    );
};
