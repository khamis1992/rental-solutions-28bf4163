import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AuthResult } from '@/types/response.types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('Login error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }

    if (data?.user) {
      toast.success('Login successful');
      return { 
        success: true, 
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        },
        message: 'Login successful'
      };
    }

    return { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    console.error('Login error:', error);
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const validateLoginForm = (credentials: LoginCredentials): string[] => {
  const errors: string[] = [];

  if (!credentials.email) {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
    errors.push('Email is invalid');
  }

  if (!credentials.password) {
    errors.push('Password is required');
  } else if (credentials.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return errors;
};
