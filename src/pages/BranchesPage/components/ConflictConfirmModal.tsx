import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Modal } from '@/ui';

interface ConflictConfirmModalProps {
  isOpen: boolean;
  conflicts: string[];
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const ConflictConfirmModal: React.FC<ConflictConfirmModalProps> = ({
  isOpen,
  conflicts,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="conflict-confirm-title"
      ariaDescribedBy="conflict-confirm-description"
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-warning/20 p-2 text-warning">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 id="conflict-confirm-title" className="text-xl font-semibold text-text1">
              Conflitos detectados
            </h2>
            <p id="conflict-confirm-description" className="text-sm text-text3">
              Este merge vai iniciar um fluxo de resolucao manual. Continuar?
            </p>
          </div>
        </div>

        <div className="rounded-md border border-border1 bg-surface2 px-4 py-3 text-sm text-text2">
          <div className="text-xs font-semibold uppercase text-text3">Arquivos em conflito</div>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto">
            {conflicts.map((file) => (
              <li key={file} className="truncate">
                {file}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button size="sm" variant="primary" onClick={onConfirm} isLoading={isSubmitting}>
            Continuar e resolver
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConflictConfirmModal;
