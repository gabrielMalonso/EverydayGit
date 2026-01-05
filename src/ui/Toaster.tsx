import { Toaster as SonnerToaster } from 'sonner';

/**
 * Componente Toaster usando Sonner (shadcn/ui).
 * Posicionado no bottom-right com richColors para cores vibrantes.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={3000}
      theme="light"
      richColors
    />
  );
}
