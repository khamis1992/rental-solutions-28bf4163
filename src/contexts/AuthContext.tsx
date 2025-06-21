import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Use types from Supabase client
type User = NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']>;
type Session = NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>;

interface UserData {
  firstName?: string;
  lastName?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData?: UserData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserData: (data: UserData) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);
  const hasToasted = useRef(false);

  const handleAuthError = (error: unknown, action: string): string => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    toast.error(`${action} failed: ${errorMessage}`);
    return errorMessage;
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (!isInitialMount.current) {
          if (event === 'SIGNED_IN' && !hasToasted.current) {
            toast.success('Signed in successfully');
            hasToasted.current = true;
          } else if (event === 'SIGNED_OUT') {
            toast.info('Signed out');
            hasToasted.current = false;
          }
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        setLoading(false);
        isInitialMount.current = false;
        
        if (existingSession) {
          hasToasted.current = true;
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const errorMessage = handleAuthError(error, 'Sign in');
        return { success: false, error: errorMessage };
      }
      return { success: true };
    } catch (error) {
      const errorMessage = handleAuthError(error, 'Sign in');
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, userData?: UserData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData,
        }
      });
      if (error) {
        const errorMessage = handleAuthError(error, 'Registration');
        return { success: false, error: errorMessage };
      }
      toast.success('Registration successful! Please check your email for verification.');
      return { success: true };
    } catch (error) {
      const errorMessage = handleAuthError(error, 'Registration');
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        const errorMessage = handleAuthError(error, 'Sign out');
        return { success: false, error: errorMessage };
      }
      return { success: true };
    } catch (error) {
      const errorMessage = handleAuthError(error, 'Sign out');
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        const errorMessage = handleAuthError(error, 'Password reset');
        return { success: false, error: errorMessage };
      }
      toast.success('Password reset email sent');
      return { success: true };
    } catch (error) {
      const errorMessage = handleAuthError(error, 'Password reset');
      return { success: false, error: errorMessage };
    }
  };

  const updateUserData = async (data: UserData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ data });
      if (error) {
        const errorMessage = handleAuthError(error, 'Profile update');
        return { success: false, error: errorMessage };
      }
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = handleAuthError(error, 'Profile update');
      return { success: false, error: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
