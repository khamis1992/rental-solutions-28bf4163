
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResult {
  success: boolean;
  error?: string;
}

export const sendPasswordResetEmail = async (
  request: ForgotPasswordRequest
): Promise<ForgotPasswordResult> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }

    toast.success('Password reset email sent! Please check your inbox.');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
    console.error('Password reset error:', error);
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const validateForgotPasswordForm = (request: ForgotPasswordRequest): string[] => {
  const errors: string[] = [];

  if (!request.email) {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(request.email)) {
    errors.push('Email is invalid');
  }

  return errors;
};
