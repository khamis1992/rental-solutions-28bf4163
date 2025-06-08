
// Utility functions for showing toast messages
import { toast } from 'sonner';

export const showErrorToast = (error: any, title: string = 'Error') => {
  const message = error?.message || 'An unexpected error occurred';
  toast.error(title, {
    description: message,
  });
};

export const showSuccessToast = (message: string, title: string = 'Success') => {
  toast.success(title, {
    description: message,
  });
};

export const showInfoToast = (message: string, title: string = 'Info') => {
  toast.info(title, {
    description: message,
  });
};
