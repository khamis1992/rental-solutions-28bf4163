
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

export const resetUserPassword = async (
  request: ResetPasswordRequest
): Promise<ResetPasswordResult> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: request.password,
    });

    if (error) {
      console.error('Password reset error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }

    toast.success('Password updated successfully!');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
    console.error('Password reset error:', error);
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const validateResetPasswordForm = (request: ResetPasswordRequest): string[] => {
  const errors: string[] = [];

  if (!request.password) {
    errors.push('Password is required');
  } else if (request.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!request.confirmPassword) {
    errors.push('Password confirmation is required');
  } else if (request.password !== request.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return errors;
};
