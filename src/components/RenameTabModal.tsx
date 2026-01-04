import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/ui';
import { Input } from '@/ui';
import { cn } from '@/lib/utils';
import { useRenameModalStore } from '@/stores/renameModalStore';
import { useTabStore } from '@/stores/tabStore';

/**
 * Modal para renomear abas.
 * 
 * Este componente consome o renameModalStore diretamente, eliminando a necessidade
 * de passar props do App. Re-renders são esperados quando o store muda - isso é
 * comportamento padrão do Zustand e aceitável para este caso de uso.
 */
export const RenameTabModal = () => {
    const { isOpen, tabId, currentTitle, closeModal } = useRenameModalStore();
    const setTabTitle = useTabStore((s) => s.setTabTitle);

    const [title, setTitle] = useState(currentTitle);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
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
            closeModal(); // No change, just close
            return;
        }

        if (tabId) {
            setTabTitle(tabId, trimmed);
        }
        closeModal();
    }, [title, currentTitle, tabId, setTabTitle, closeModal]);

    const handleCancel = useCallback(() => {
        closeModal();
    }, [closeModal]);

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
