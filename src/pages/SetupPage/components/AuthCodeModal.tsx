import React from 'react';
import { Button, Modal } from '@/ui';
import { useToastStore } from '@/stores/toastStore';

interface AuthCodeModalProps {
  code: string | null;
  onClose: () => void;
  onRecheck: () => void;
}

export const AuthCodeModal: React.FC<AuthCodeModalProps> = ({ code, onClose, onRecheck }) => {
  const { showToast } = useToastStore();

  if (!code) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Codigo copiado!', 'success');
    } catch (error) {
      console.error('Failed to copy auth code:', error);
      showToast('Falha ao copiar codigo', 'error');
    }
  };

  const handleRecheck = () => {
    onClose();
    onRecheck();
  };

  return (
    <Modal isOpen={Boolean(code)} onClose={onClose} ariaLabel="Autenticacao GitHub">
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-text1 mb-4">Autenticacao GitHub</h2>

        <p className="text-text2 mb-4">O browser foi aberto. Cole este codigo na pagina do GitHub:</p>

        <div className="bg-surface1 border border-border1 rounded-card p-4 mb-4">
          <code className="text-2xl font-mono text-primary tracking-wider">{code}</code>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={handleCopy}>
            Copiar codigo
          </Button>
          <Button variant="primary" onClick={handleRecheck}>
            Ja autorizei, verificar
          </Button>
        </div>

        <p className="text-xs text-text3 mt-4">
          Apos autorizar no browser, clique em &quot;Ja autorizei&quot; para verificar.
        </p>
      </div>
    </Modal>
  );
};

