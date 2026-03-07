/**
 * Sonner Toast Component
 *
 * Wrapper around Sonner toast library
 *
 * This provides the Toaster component that should be included in the root layout
 */

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
    />
  );
}
