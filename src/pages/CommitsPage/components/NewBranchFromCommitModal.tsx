import React from 'react';
import { Button, Input, Modal, ToggleSwitch } from '@/ui';
import type { CommitInfo } from '@/types';
import { useGit } from '@/hooks/useGit';

interface NewBranchFromCommitModalProps {
    isOpen: boolean;
    onClose: () => void;
    commit: CommitInfo;
}

export const NewBranchFromCommitModal: React.FC<NewBranchFromCommitModalProps> = ({
    isOpen,
    onClose,
    commit,
}) => {
    const [name, setName] = React.useState('');
    const [pushToRemote, setPushToRemote] = React.useState(false);
    const [nameError, setNameError] = React.useState<string | null>(null);
    const [formError, setFormError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { createBranch, refreshAll } = useGit();

    const shortHash = commit.hash.substring(0, 7);

    // Get subject (first line of commit message)
    const getSubject = (message: string) => {
        const normalized = message.replace(/\r\n/g, '\n');
        const firstLine = normalized.split('\n')[0] ?? '';
        return firstLine.trimEnd() || message;
    };

    const subject = getSubject(commit.message);
    const truncatedSubject = subject.length > 50 ? `${subject.substring(0, 50)}...` : subject;

    React.useEffect(() => {
        if (!isOpen) return;
        setName('');
        setPushToRemote(false);
        setNameError(null);
        setFormError(null);
        setIsSubmitting(false);
    }, [isOpen]);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value.replace(/\s+/g, '-');
        setName(nextValue);
        if (nameError) setNameError(null);
        if (formError) setFormError(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedName = name.trim().replace(/\s+/g, '-');

        if (!trimmedName) {
            setNameError('Informe um nome para a branch.');
            return;
        }

        console.log('[Action] Starting New Branch from Commit', {
            branchName: trimmedName,
            fromHash: commit.hash,
            pushToRemote
        });

        setNameError(null);
        setFormError(null);
        setIsSubmitting(true);

        try {
            // checkout: false - don't switch to the new branch (avoids local changes conflict)
            await createBranch(trimmedName, commit.hash, pushToRemote, false);
            console.log('[Action] New Branch from Commit completed successfully', {
                branchName: trimmedName
            });
            await refreshAll();
            onClose();
        } catch (submitError) {
            console.error('[Action] New Branch from Commit failed', { error: submitError });
            const message = submitError instanceof Error ? submitError.message : String(submitError);
            setFormError(message || 'Falha ao criar branch.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Criar branch a partir do commit"
        >
            <form className="flex flex-col gap-6 p-6" onSubmit={handleSubmit}>
                <div>
                    <h2 className="text-xl font-semibold text-text1">
                        Nova Branch
                    </h2>
                    <p className="text-sm text-text3 mt-1">
                        Criar branch a partir do commit:
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
                            id="new-branch-name"
                            label="Nome da nova branch"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="feature/minha-branch"
                            error={nameError ?? undefined}
                            autoFocus
                        />
                        <div className="mt-2 text-xs text-text3">Espaços são convertidos para "-".</div>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-md border border-border1 bg-surface2 px-3 py-3">
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-text2">Publicar no remoto</div>
                            <div className="text-xs text-text3">Faz push da branch para origin</div>
                        </div>
                        <ToggleSwitch
                            checked={pushToRemote}
                            onToggle={() => setPushToRemote((prev) => !prev)}
                            label="Publicar no remoto"
                            disabled={isSubmitting}
                        />
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
                        Criar branch
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
