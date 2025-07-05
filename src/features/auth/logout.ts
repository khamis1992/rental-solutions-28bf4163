
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface LogoutResult {
  success: boolean;
  error?: string;
}

export const logoutUser = async (): Promise<LogoutResult> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }

    toast.success('Logged out successfully');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    console.error('Logout error:', error);
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const clearUserSession = () => {
  // Clear any local storage or session storage
  localStorage.removeItem('user-preferences');
  sessionStorage.clear();
};

export const performFullLogout = async (): Promise<LogoutResult> => {
  const result = await logoutUser();
  if (result.success) {
    clearUserSession();
  }
  return result;
};
