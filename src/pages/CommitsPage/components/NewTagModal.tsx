import React from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('commits');
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
            setNameError(t('newTag.nameRequired'));
            return;
        }

        // Validate tag name format (no spaces, follows git tag rules)
        if (!/^[a-zA-Z0-9._\-/]+$/.test(trimmedName)) {
            setNameError(t('newTag.nameInvalid'));
            return;
        }

        setNameError(null);
        setFormError(null);
        setIsSubmitting(true);

        try {
            await createTag(trimmedName, commit.hash, message || undefined);
            onClose();
        } catch (submitError) {
            console.error('[Action] New Tag failed', { error: submitError });
            const errorMessage = submitError instanceof Error ? submitError.message : String(submitError);
            setFormError(errorMessage || t('newTag.createFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel={t('newTag.title')}
        >
            <form className="flex flex-col gap-6 p-6" onSubmit={handleSubmit}>
                <div>
                    <h2 className="text-xl font-semibold text-text1">
                        {t('newTag.title')}
                    </h2>
                    <p className="text-sm text-text3 mt-1">
                        {t('newTag.createOn')}
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
                            label={t('newTag.tagName')}
                            value={name}
                            onChange={handleNameChange}
                            placeholder={t('newTag.namePlaceholder')}
                            error={nameError ?? undefined}
                            autoFocus
                        />
                        <div className="mt-2 text-xs text-text3">{t('newTag.nameHint')}</div>
                    </div>

                    <div>
                        <Input
                            id="new-tag-message"
                            label={t('newTag.message')}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('newTag.messagePlaceholder')}
                        />
                        <div className="mt-2 text-xs text-text3">{t('newTag.messageHint')}</div>
                    </div>

                    {formError && (
                        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger whitespace-pre-wrap break-words">
                            {formError}
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button size="sm" variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>
                        {t('newTag.cancel')}
                    </Button>
                    <Button size="sm" variant="primary" type="submit" isLoading={isSubmitting}>
                        {t('newTag.createButton')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
