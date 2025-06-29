import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: UserData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserData: (data: UserData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isInitialMount = useRef(true);
  const hasToasted = useRef(false);

  const handleAuthError = (error: unknown, action: string) => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    toast.error(`${action} failed: ${errorMessage}`);
    throw error;
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
        handleAuthError(error, 'Session initialization');
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      handleAuthError(error, 'Sign in');
    }
  };

  const signUp = async (email: string, password: string, userData?: UserData) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData,
        }
      });
      if (error) throw error;
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error) {
      handleAuthError(error, 'Registration');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      handleAuthError(error, 'Sign out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent');
    } catch (error) {
      handleAuthError(error, 'Password reset');
    }
  };

  const updateUserData = async (data: UserData) => {
    try {
      const { error } = await supabase.auth.updateUser({ data });
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      handleAuthError(error, 'Profile update');
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
