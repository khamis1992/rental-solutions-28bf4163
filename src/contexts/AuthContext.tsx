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
      console.log('🔐 Attempting to sign in with Supabase...');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Anon Key configured:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('❌ Supabase auth error:', error);
        console.error('Error code:', error.message);
        console.error('Error details:', error);
        
        // Development bypass for auth issues
        if (error.message.includes('Invalid API key') && import.meta.env.DEV) {
          console.warn('🔄 Using development bypass for authentication...');
          
          // Create a mock user session for development
          const mockUser = {
            id: 'dev-user-' + Date.now(),
            email: email,
            user_metadata: {
              firstName: 'Developer',
              lastName: 'User',
              role: 'admin'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: {},
            aud: 'authenticated',
            role: 'authenticated'
          } as User;
          
          const mockSession = {
            access_token: 'mock-token-' + Date.now(),
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            refresh_token: 'mock-refresh-token',
            user: mockUser
          } as Session;
          
          setUser(mockUser);
          setSession(mockSession);
          
          toast.warning('Development Mode', {
            description: 'Using development authentication bypass. Some features may be limited.',
            duration: 5000,
          });
          
          navigate('/dashboard');
          return;
        }
        
        // Provide more specific error messages for production
        if (error.message.includes('Invalid API key')) {
          throw new Error('Authentication service unavailable. Please check your connection and try again.');
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before signing in.');
        } else {
          throw error;
        }
      }
      
      console.log('✅ Sign in successful');
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
