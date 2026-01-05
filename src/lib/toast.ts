import { toast } from 'sonner';

/**
 * Helper de compatibilidade para migração do Toast customizado para Sonner.
 *
 * Mantém a mesma assinatura do showToast original para facilitar a migração.
 *
 * @example
 * ```ts
 * import { showToast } from '@/lib/toast';
 * showToast('Branch criada', 'success');
 * ```
 *
 * Recomendado após migração: usar diretamente `toast` do sonner:
 * ```ts
 * import { toast } from 'sonner';
 * toast.success('Branch criada');
 * ```
 */
export const showToast = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info'
): string | number => {
  switch (type) {
    case 'success':
      return toast.success(message);
    case 'error':
      return toast.error(message);
    case 'warning':
      return toast.warning(message);
    case 'info':
      return toast.info(message);
  }
};

// Re-export do toast do Sonner para uso direto
export { toast };
