import { toast } from 'sonner';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

/**
 * Toast hook for showing notifications
 *
 * Uses sonner for toast notifications instead of alert()
 * Follows RED LIST rule: NO alert() - use Shadcn Dialog/Toast
 */
export function useToast() {
  const showToast = ({ title, description, variant = 'default' }: ToastOptions) => {
    // Log to console for debugging
    console.log(`[${variant === 'destructive' ? '❌' : '✅'}] ${title}${description ? ': ' + description : ''}`);

    // Use sonner toast
    if (variant === 'destructive') {
      toast.error(title, {
        description,
      });
    } else {
      toast.success(title, {
        description,
      });
    }
  };

  return {
    toast: showToast,
  };
}
