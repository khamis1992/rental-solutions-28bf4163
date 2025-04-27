
import { useCallback } from 'react';
import { toast } from 'sonner';
import { PostgrestError } from '@supabase/supabase-js';

export const useErrorHandler = () => {
  const handleError = useCallback((error: unknown, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);

    let message = 'An unexpected error occurred';

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if ((error as PostgrestError)?.message) {
      message = (error as PostgrestError).message;
    }

    toast.error(message);
  }, []);

  return handleError;
};
