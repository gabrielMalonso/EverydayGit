import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/ui';
import { Input } from '@/ui';
import { cn } from '@/lib/utils';

interface RenameTabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRename: (newTitle: string) => void;
    currentTitle: string;
}

export const RenameTabModal: React.FC<RenameTabModalProps> = ({
    isOpen,
    onClose,
    onRename,
    currentTitle,
}) => {
    const [title, setTitle] = useState(currentTitle);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Log mount/unmount
    useEffect(() => {
        console.log('[RenameTabModal] MOUNTED');
        return () => {
            console.log('[RenameTabModal] UNMOUNTED');
        };
    }, []);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            console.log('[RenameTabModal] Modal opened, currentTitle:', currentTitle);
            setTitle(currentTitle);
            setError(null);
            // Focus and select text on next render
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 0);
        }
    }, [isOpen, currentTitle]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = title.trim();
        if (!trimmed) {
            setError('O nome da aba não pode ficar vazio');
            return;
        }

        if (trimmed === currentTitle) {
            onClose(); // No change, just close
            return;
        }

        onRename(trimmed);
        onClose();
    }, [title, currentTitle, onClose, onRename]);

    const handleCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            ariaLabelledBy="rename-tab-title"
        >
            <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <h2 id="rename-tab-title" className="text-lg font-semibold text-text1">
                        Renomear aba
                    </h2>
                </div>

                {/* Content */}
                <div className="px-6 pb-4">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => {
                            console.log('[RenameTabModal] Input changed:', e.target.value);
                            setTitle(e.target.value);
                            setError(null);
                        }}
                        placeholder="Nome da aba"
                        error={error ?? undefined}
                        maxLength={50}
                        autoFocus
                    />
                    <p className="mt-2 text-sm text-text3">
                        Digite um nome para identificar esta aba.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-surface3/30 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-text2 hover:text-text1 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!title.trim()}
                        className={cn(
                            'px-4 py-2 text-sm font-medium rounded transition-all',
                            'bg-primary text-primaryContrast',
                            'hover:bg-highlight disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                    >
                        Renomear
                    </button>
                </div>
            </form>
        </Modal>
    );
};
