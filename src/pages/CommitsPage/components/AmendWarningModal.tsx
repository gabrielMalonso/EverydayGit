import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@/ui';

interface AmendWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AmendWarningModal: React.FC<AmendWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation('commits');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="amend-warning-title"
      ariaDescribedBy="amend-warning-description"
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-start gap-3">
          <div>
            <h2 id="amend-warning-title" className="text-xl font-semibold text-text1">
              {t('amendWarning.title')}
            </h2>
            <p id="amend-warning-description" className="text-sm text-text3">
              {t('amendWarning.description')}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} type="button">
            {t('amendWarning.cancel')}
          </Button>
          <Button size="sm" variant="primary" onClick={onConfirm}>
            {t('amendWarning.confirmButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AmendWarningModal;
