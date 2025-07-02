import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AuthResult } from '@/types/response.types';

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export const registerUser = async (credentials: RegisterCredentials): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
        },
      },
    });

    if (error) {
      console.error('Registration error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }

    if (data?.user) {
      toast.success('Registration successful! Please check your email for verification.');
      return { 
        success: true, 
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        },
        message: 'Registration successful! Please check your email for verification.'
      };
    }

    return { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    console.error('Registration error:', error);
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const validateRegistrationForm = (credentials: RegisterCredentials): string[] => {
  const errors: string[] = [];

  if (!credentials.email) {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
    errors.push('Email is invalid');
  }

  if (!credentials.fullName) {
    errors.push('Full name is required');
  } else if (credentials.fullName.length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  if (!credentials.password) {
    errors.push('Password is required');
  } else if (credentials.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!credentials.confirmPassword) {
    errors.push('Password confirmation is required');
  } else if (credentials.password !== credentials.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return errors;
};
