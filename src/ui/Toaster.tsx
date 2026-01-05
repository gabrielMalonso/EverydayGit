import { Toaster as SonnerToaster } from 'sonner';

/**
 * Componente Toaster usando Sonner (shadcn/ui).
 * Posicionado no bottom-right com tema dark para compatibilidade com o design system.
 */
export function Toaster() {
  return <SonnerToaster position="bottom-right" theme="dark" duration={3000} />;
}
