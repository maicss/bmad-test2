import { useState, useCallback } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
    // Using browser alert as fallback
    const message = description ? `${title}: ${description}` : title;
    const alertType = variant === 'destructive' ? '❌' : '✅';
    
    // Log to console for debugging
    console.log(`${alertType} ${message}`);
    
    // Show alert
    alert(message);
    
    // Add to state (for future UI integration)
    setToasts((prev) => [...prev, { title, description, variant }]);
  }, []);

  return { toast, toasts };
}
