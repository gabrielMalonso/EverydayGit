import React from 'react';
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
              Commit ja enviado
            </h2>
            <p id="amend-warning-description" className="text-sm text-text3">
              O ultimo commit ja foi enviado ao remoto. Fazer amend vai reescrever a historia e
              exigir force push. Isso pode causar problemas se outras pessoas trabalham nesta
              branch.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button size="sm" variant="primary" onClick={onConfirm}>
            Continuar mesmo assim
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AmendWarningModal;
