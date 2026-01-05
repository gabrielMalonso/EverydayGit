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
 *
 * Customizações:
 * - Botão de ação posicionado na parte inferior do toast
 */
export function Toaster() {
  return (
    <>
      <style>
        {`
          /* Toast de erro com botão de ação: força layout vertical */
          [data-sonner-toast][data-type="error"]:has([data-button]) {
            flex-direction: column !important;
            align-items: flex-start !important;
            flex-wrap: nowrap !important;
          }

          /* Conteúdo ocupa largura total */
          [data-sonner-toast][data-type="error"]:has([data-button]) [data-content] {
            width: 100% !important;
            flex: none !important;
          }

          /* Botão de ação na parte inferior */
          [data-sonner-toast][data-type="error"]:has([data-button]) [data-button] {
            margin-top: 12px !important;
            flex: none !important;
          }
        `}
      </style>
      <SonnerToaster
        position="bottom-right"
        duration={3000}
        theme="light"
        richColors
        closeButton
      />
    </>

  );
}
