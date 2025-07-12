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

// Create context with null for proper checking
const AuthContext = createContext<AuthContextType | null>(null);

export const SafeAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isInitialMount = useRef(true);
  const hasToasted = useRef(false);
  const isMounted = useRef(true);

  const handleAuthError = (error: unknown, action: string) => {
    if (!isMounted.current) return;
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`${action} error:`, error);
    toast.error(`${action} failed: ${errorMessage}`);
    throw error;
  };

  useEffect(() => {
    isMounted.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted.current) return;

        console.log('Auth state change:', event, newSession?.user?.id);

        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Only set loading to false after we've processed the state change
        setTimeout(() => {
          if (isMounted.current) {
            setLoading(false);
          }
        }, 100);

        if (!isInitialMount.current && isMounted.current) {
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
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session initialization error:', error);
          return;
        }

        if (!isMounted.current) return;

        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        isInitialMount.current = false;
        
        if (existingSession) {
          hasToasted.current = true;
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Wait a bit for auth state to update before navigating
      setTimeout(() => {
        if (isMounted.current) {
          navigate('/dashboard');
        }
      }, 500);
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
      
      // Wait a bit for auth state to update before navigating
      setTimeout(() => {
        if (isMounted.current) {
          navigate('/auth/login');
        }
      }, 200);
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

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSafeAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === null) {
    // Return safe fallback instead of throwing error
    console.warn('useSafeAuth called outside SafeAuthProvider, using fallback values');
    return {
      user: null,
      session: null,
      loading: true,
      signIn: async () => { console.warn('signIn called outside SafeAuthProvider'); },
      signUp: async () => { console.warn('signUp called outside SafeAuthProvider'); },
      signOut: async () => { console.warn('signOut called outside SafeAuthProvider'); },
      resetPassword: async () => { console.warn('resetPassword called outside SafeAuthProvider'); },
      updateUserData: async () => { console.warn('updateUserData called outside SafeAuthProvider'); },
    };
  }
  
  return context;
}; 