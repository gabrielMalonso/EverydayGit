import React from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Button, Input, Modal, SelectMenu } from '@/ui';
import { toast } from 'sonner';
import type { PublishRepoOptions, PublishRepoResult } from '@/types';
import type { SelectOption } from '@/ui/SelectMenu';

interface PublishRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string | null;
  defaultName: string;
  onPublished?: (url: string | null) => void;
}

export const PublishRepoModal: React.FC<PublishRepoModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  defaultName,
  onPublished,
}) => {
  const { t } = useTranslation('common');

  const visibilityOptions: SelectOption[] = [
    { value: 'public', label: t('publish.public') },
    { value: 'private', label: t('publish.private') },
  ];

  const [name, setName] = React.useState(defaultName);
  const [visibility, setVisibility] = React.useState<'public' | 'private'>('public');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setName(defaultName);
    setVisibility('public');
    setNameError(null);
    setFormError(null);
    setIsSubmitting(false);
  }, [isOpen, defaultName]);

  const getErrorMessage = (value: unknown) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') {
      return value.message;
    }
    return String(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!repoPath) {
      setFormError(t('publish.selectRepoFirst'));
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t('publish.enterRepoName'));
      return;
    }

    setNameError(null);
    setFormError(null);
    setIsSubmitting(true);

    const payload: PublishRepoOptions = {
      path: repoPath,
      name: trimmedName,
      visibility,
      description: null,
    };

    try {
      const result = await invoke<PublishRepoResult>('publish_github_repo_cmd', { options: payload });
      toast.success(result.url ? `${t('publish.success')}: ${result.url}` : t('publish.success'));
      onPublished?.(result.url ?? null);
      onClose();
    } catch (error) {
      console.error('Failed to publish repository:', error);
      setFormError(getErrorMessage(error) || t('publish.publishFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="publish-repo-title"
      ariaDescribedBy="publish-repo-description"
    >
      <form className="flex flex-col gap-6 p-6" onSubmit={handleSubmit}>
        <div>
          <h2 id="publish-repo-title" className="text-xl font-semibold text-text1">
            {t('publish.title')}
          </h2>
          <p id="publish-repo-description" className="text-sm text-text3">
            {t('publish.description')}
          </p>
        </div>

        <div className="space-y-4">
          <Input
            id="publish-repo-name"
            label={t('publish.repoName')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="meu-projeto"
            error={nameError ?? undefined}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-text2">{t('publish.visibility')}</label>
            <SelectMenu
              id="publish-repo-visibility"
              value={visibility}
              options={visibilityOptions}
              onChange={(value) => setVisibility(value as 'public' | 'private')}
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
            {t('actions.cancel')}
          </Button>
          <Button size="sm" variant="primary" type="submit" isLoading={isSubmitting}>
            {t('publish.publishButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PublishRepoModal;
