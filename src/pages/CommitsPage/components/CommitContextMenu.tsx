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
import { ResetModal } from './ResetModal';

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
                : 'text-text1 hover:bg-highlight/15 hover:text-text1'}
    `}
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
    const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    // Close menu on escape
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    }, []);

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

        // Calculate position, keeping menu within viewport
        const x = Math.min(event.clientX, window.innerWidth - 220);
        const y = Math.min(event.clientY, window.innerHeight - 400);

        setPosition({ x, y });
        setIsOpen(true);
    };

    // Action handlers
    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    const handleCopyRevision = () => {
        navigator.clipboard.writeText(commit.hash);
        console.log('Copied revision:', commit.hash);
    };

    const handleCherryPick = () => console.log('Cherry-pick:', commit.hash);
    const handleCheckout = () => console.log('Checkout:', commit.hash);
    const handleCompareWithLocal = () => console.log('Compare with local:', commit.hash);
    const handleRevert = () => console.log('Revert:', commit.hash);
    const handleNewBranch = () => console.log('New branch from:', commit.hash);
    const handleNewTag = () => console.log('New tag at:', commit.hash);
    const handleGoToParent = () => console.log('Go to parent of:', commit.hash);

    const handleResetClick = () => {
        setIsOpen(false);
        setResetModalOpen(true);
    };

    return (
        <>
            <div ref={triggerRef} onContextMenu={handleContextMenu}>
                {children}
            </div>

            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-[9999] min-w-[220px] py-1 bg-surface2/95 backdrop-blur-xl border border-highlight/50 rounded-card shadow-popover ring-1 ring-highlight/25"
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
                            onClick={() => handleAction(handleCherryPick)}
                        />
                        <MenuItem
                            icon={<GitBranch className="h-4 w-4" />}
                            label="Checkout Revision"
                            onClick={() => handleAction(handleCheckout)}
                        />
                        <MenuItem
                            icon={<GitCompare className="h-4 w-4" />}
                            label="Compare with Local"
                            onClick={() => handleAction(handleCompareWithLocal)}
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
                            onClick={() => handleAction(handleRevert)}
                        />

                        <MenuSeparator />

                        <MenuItem
                            icon={<GitBranch className="h-4 w-4" />}
                            label="New Branch..."
                            onClick={() => handleAction(handleNewBranch)}
                        />
                        <MenuItem
                            icon={<Tag className="h-4 w-4" />}
                            label="New Tag..."
                            onClick={() => handleAction(handleNewTag)}
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
        </>
    );
};
