import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { CommitInfo } from '@/types';
import {
    Copy,
    Cherry,
    GitBranch,
    GitCompare,
    RotateCcw,
    Undo2,
    Tag,
    ArrowUp,
} from 'lucide-react';
import { useGit } from '@/hooks/useGit';
import { useGitStore } from '@/stores/gitStore';
import { ResetModal } from './ResetModal';
import { NewBranchFromCommitModal } from './NewBranchFromCommitModal';
import { NewTagModal } from './NewTagModal';
import { CompareWithLocalModal } from './CompareWithLocalModal';

interface CommitContextMenuProps {
    commit: CommitInfo;
    children: React.ReactNode;
}

interface MenuPosition {
    x: number;
    y: number;
}

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    destructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, destructive }) => (
    <button
        type="button"
        onClick={onClick}
        className={`
      w-full flex items-center gap-2 px-3 py-2 text-sm text-left
      transition-colors outline-none cursor-pointer
      ${destructive
                ? 'text-danger hover:bg-danger/20 hover:text-danger'
                : 'text-text1 hover:bg-highlight/15 hover:text-text1'}`}
    >
        {icon}
        {label}
    </button>
);

const MenuSeparator: React.FC = () => (
    <div className="my-1 h-px bg-border1" />
);

export const CommitContextMenu: React.FC<CommitContextMenuProps> = ({
    commit,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [newBranchModalOpen, setNewBranchModalOpen] = useState(false);
    const [newTagModalOpen, setNewTagModalOpen] = useState(false);
    const [compareModalOpen, setCompareModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<number | null>(null);

    const { cherryPick, revertCommit, checkoutCommit } = useGit();
    const commits = useGitStore((state) => state.commits);

    // Close menu with animation
    const closeMenu = useCallback(() => {
        setIsVisible(false);
        closeTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
            closeTimeoutRef.current = null;
        }, 150);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                window.clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    // Close menu when clicking outside
    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            closeMenu();
        }
    }, [closeMenu]);

    // Close menu on escape
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    }, [closeMenu]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, handleClickOutside, handleKeyDown]);

    // Handle right-click
    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // Clear any pending close timeout
        if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        // Calculate position, keeping menu within viewport
        const x = Math.min(event.clientX, window.innerWidth - 220);
        const y = Math.min(event.clientY, window.innerHeight - 400);

        setPosition({ x, y });
        setIsVisible(false);
        setIsOpen(true);

        // Trigger fade-in on next frame
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    };

    // Action handlers
    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    const handleAsyncAction = (action: () => Promise<void>) => {
        setIsOpen(false);
        action().catch((error) => {
            console.error('[Action] async action failed:', error);
        });
    };

    const handleCopyRevision = () => {
        navigator.clipboard.writeText(commit.hash);
        console.log('[Action] Copied revision:', commit.hash);
    };

    const handleCherryPick = async () => {
        console.log('[Action] Cherry-pick starting:', commit.hash);
        await cherryPick(commit.hash);
    };

    const handleCheckout = async () => {
        console.log('[Action] Checkout commit starting:', commit.hash);
        await checkoutCommit(commit.hash);
    };

    const handleCompareWithLocalClick = () => {
        setIsOpen(false);
        setCompareModalOpen(true);
    };

    const handleRevert = async () => {
        console.log('[Action] Revert starting:', commit.hash);
        await revertCommit(commit.hash);
    };

    const handleGoToParent = () => {
        // Find parent commit in the list and scroll to it
        const currentIndex = commits.findIndex((c) => c.hash === commit.hash);
        if (currentIndex >= 0 && currentIndex < commits.length - 1) {
            const parentCommit = commits[currentIndex + 1];
            console.log('[Action] Go to parent:', { from: commit.hash.substring(0, 7), to: parentCommit.hash.substring(0, 7) });

            // Find parent commit element and scroll to it
            const parentElement = document.querySelector(`[data-commit-hash="${parentCommit.hash}"]`);
            if (parentElement) {
                parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add a temporary highlight effect
                parentElement.classList.add('bg-highlight/20');
                setTimeout(() => {
                    parentElement.classList.remove('bg-highlight/20');
                }, 2000);
            }
        } else {
            console.log('[Action] No parent commit found (this is the oldest commit)');
        }
    };

    const handleNewBranchClick = () => {
        setIsOpen(false);
        setNewBranchModalOpen(true);
    };

    const handleNewTagClick = () => {
        setIsOpen(false);
        setNewTagModalOpen(true);
    };

    const handleResetClick = () => {
        setIsOpen(false);
        setResetModalOpen(true);
    };

    return (
        <>
            <div ref={triggerRef} onContextMenu={handleContextMenu} data-commit-hash={commit.hash}>
                {children}
            </div>

            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        className={`fixed z-[9999] min-w-[220px] py-1 bg-surface2/95 backdrop-blur-xl border border-highlight/50 rounded-card shadow-popover ring-1 ring-highlight/25 transition-[opacity,transform] duration-150 ease-out origin-top ${isVisible
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                            }`}
                        style={{
                            left: position.x,
                            top: position.y,
                        }}
                    >
                        <MenuItem
                            icon={<Copy className="h-4 w-4" />}
                            label="Copy Revision Number"
                            onClick={() => handleAction(handleCopyRevision)}
                        />

                        <MenuSeparator />

                        <MenuItem
                            icon={<Cherry className="h-4 w-4" />}
                            label="Cherry-Pick"
                            onClick={() => handleAsyncAction(handleCherryPick)}
                        />
                        <MenuItem
                            icon={<GitBranch className="h-4 w-4" />}
                            label="Checkout Revision"
                            onClick={() => handleAsyncAction(handleCheckout)}
                        />
                        <MenuItem
                            icon={<GitCompare className="h-4 w-4" />}
                            label="Compare with Local"
                            onClick={handleCompareWithLocalClick}
                        />

                        <MenuSeparator />

                        <MenuItem
                            icon={<RotateCcw className="h-4 w-4" />}
                            label="Reset Current Branch to Here..."
                            onClick={handleResetClick}
                        />
                        <MenuItem
                            icon={<Undo2 className="h-4 w-4" />}
                            label="Revert Commit"
                            onClick={() => handleAsyncAction(handleRevert)}
                        />

                        <MenuSeparator />

                        <MenuItem
                            icon={<GitBranch className="h-4 w-4" />}
                            label="New Branch..."
                            onClick={handleNewBranchClick}
                        />
                        <MenuItem
                            icon={<Tag className="h-4 w-4" />}
                            label="New Tag..."
                            onClick={handleNewTagClick}
                        />

                        <MenuSeparator />

                        <MenuItem
                            icon={<ArrowUp className="h-4 w-4" />}
                            label="Go to Parent Commit"
                            onClick={() => handleAction(handleGoToParent)}
                        />
                    </div>,
                    document.body
                )}

            <ResetModal
                isOpen={resetModalOpen}
                onClose={() => setResetModalOpen(false)}
                commit={commit}
            />

            <NewBranchFromCommitModal
                isOpen={newBranchModalOpen}
                onClose={() => setNewBranchModalOpen(false)}
                commit={commit}
            />

            <NewTagModal
                isOpen={newTagModalOpen}
                onClose={() => setNewTagModalOpen(false)}
                commit={commit}
            />

            <CompareWithLocalModal
                isOpen={compareModalOpen}
                onClose={() => setCompareModalOpen(false)}
                commit={commit}
            />
        </>
    );
};
