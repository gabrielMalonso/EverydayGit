import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentRepo {
    path: string;
    name: string;
    lastOpened: number;
}

interface RecentReposState {
    recentRepos: RecentRepo[];
    addRepo: (path: string) => void;
    removeRepo: (path: string) => void;
    clearHistory: () => void;
}

const MAX_RECENT_REPOS = 10;

export const useRecentReposStore = create<RecentReposState>()(
    persist(
        (set) => ({
            recentRepos: [],

            addRepo: (path: string) => {
                const name = path.split(/[\\/]/).pop() || path;
                const newRepo: RecentRepo = {
                    path,
                    name,
                    lastOpened: Date.now(),
                };

                set((state) => {
                    // Remove if already exists
                    const filtered = state.recentRepos.filter((r) => r.path !== path);
                    // Add to beginning and limit
                    const updated = [newRepo, ...filtered].slice(0, MAX_RECENT_REPOS);
                    return { recentRepos: updated };
                });
            },

            removeRepo: (path: string) => {
                set((state) => ({
                    recentRepos: state.recentRepos.filter((r) => r.path !== path),
                }));
            },

            clearHistory: () => {
                set({ recentRepos: [] });
            },
        }),
        {
            name: 'everydaygit-recent-repos',
        }
    )
);

export const useRecentRepos = () =>
    useRecentReposStore((state) => state.recentRepos);
