import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@/ui';
import { toast } from 'sonner';

interface AuthCodeModalProps {
  code: string | null;
  onClose: () => void;
  onRecheck: () => void;
}

export const AuthCodeModal: React.FC<AuthCodeModalProps> = ({ code, onClose, onRecheck }) => {
  const { t } = useTranslation('setup');

  if (!code) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('setup.authentication.copied'));
    } catch (error) {
      console.error('Failed to copy auth code:', error);
      toast.error(t('setup.authentication.copyFailed'));
    }
  };

  const handleRecheck = () => {
    onClose();
    onRecheck();
  };

  return (
    <Modal isOpen={Boolean(code)} onClose={onClose} ariaLabel={t('setup.authentication.title')}>
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-text1 mb-4">{t('setup.authentication.title')}</h2>

        <p className="text-text2 mb-4">{t('setup.authentication.browserOpened')}</p>

        <div className="bg-surface1 border border-border1 rounded-card p-4 mb-4">
          <code className="text-2xl font-mono text-primary tracking-wider">{code}</code>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={handleCopy}>
            {t('setup.authentication.copyCode')}
          </Button>
          <Button variant="primary" onClick={handleRecheck}>
            {t('setup.authentication.alreadyAuthorized')}
          </Button>
        </div>

        <p className="text-xs text-text3 mt-4">
          {t('setup.authentication.waitingAuthHint')}
        </p>
      </div>
    </Modal>
  );
};
