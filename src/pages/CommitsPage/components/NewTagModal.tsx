import React from 'react';
import { Button, Input, Modal } from '@/ui';
import type { CommitInfo } from '@/types';
import { useTabGit } from '@/hooks/useTabGit';

interface NewTagModalProps {
    isOpen: boolean;
    onClose: () => void;
    commit: CommitInfo;
}

export const NewTagModal: React.FC<NewTagModalProps> = ({
    isOpen,
    onClose,
    commit,
}) => {
    const [name, setName] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [nameError, setNameError] = React.useState<string | null>(null);
    const [formError, setFormError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { createTag } = useTabGit();

    const shortHash = commit.hash.substring(0, 7);

    // Get subject (first line of commit message)
    const getSubject = (msg: string) => {
        const normalized = msg.replace(/\r\n/g, '\n');
        const firstLine = normalized.split('\n')[0] ?? '';
        return firstLine.trimEnd() || msg;
    };

    const subject = getSubject(commit.message);
    const truncatedSubject = subject.length > 50 ? `${subject.substring(0, 50)}...` : subject;

    React.useEffect(() => {
        if (!isOpen) return;
        setName('');
        setMessage('');
        setNameError(null);
        setFormError(null);
        setIsSubmitting(false);
    }, [isOpen]);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value.replace(/\s+/g, '');
        setName(nextValue);
        if (nameError) setNameError(null);
        if (formError) setFormError(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedName = name.trim();

        if (!trimmedName) {
            setNameError('Informe um nome para a tag.');
            return;
        }

        // Validate tag name format (no spaces, follows git tag rules)
        if (!/^[a-zA-Z0-9._\-/]+$/.test(trimmedName)) {
            setNameError('Nome inválido. Use apenas letras, números, ., _, - e /.');
            return;
        }

        if (import.meta.env.DEV) {
            console.log('[Action] Starting New Tag', {
                tagName: trimmedName,
                onHash: commit.hash,
                message: message || undefined
            });
        }

        setNameError(null);
        setFormError(null);
        setIsSubmitting(true);

        try {
            await createTag(trimmedName, commit.hash, message || undefined);
            if (import.meta.env.DEV) {
                console.log('[Action] New Tag completed successfully', {
                    tagName: trimmedName
                });
            }
            onClose();
        } catch (submitError) {
            console.error('[Action] New Tag failed', { error: submitError });
            const errorMessage = submitError instanceof Error ? submitError.message : String(submitError);
            setFormError(errorMessage || 'Falha ao criar tag.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Criar tag no commit"
        >
            <form className="flex flex-col gap-6 p-6" onSubmit={handleSubmit}>
                <div>
                    <h2 className="text-xl font-semibold text-text1">
                        Nova Tag
                    </h2>
                    <p className="text-sm text-text3 mt-1">
                        Criar tag no commit:
                    </p>
                    <div className="mt-2 p-2 bg-surface2 border border-border1 rounded-md">
                        <p className="text-sm font-mono">
                            <span className="text-highlight">{shortHash}</span>
                            <span className="text-text3"> - {truncatedSubject}</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Input
                            id="new-tag-name"
                            label="Nome da tag"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="v1.0.0"
                            error={nameError ?? undefined}
                            autoFocus
                        />
                        <div className="mt-2 text-xs text-text3">Ex: v1.0.0, release-2024, feature/test</div>
                    </div>

                    <div>
                        <Input
                            id="new-tag-message"
                            label="Mensagem (opcional)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Descrição da tag"
                        />
                        <div className="mt-2 text-xs text-text3">Se preenchido, cria uma annotated tag.</div>
                    </div>

                    {formError && (
                        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger whitespace-pre-wrap break-words">
                            {formError}
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button size="sm" variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button size="sm" variant="primary" type="submit" isLoading={isSubmitting}>
                        Criar tag
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
