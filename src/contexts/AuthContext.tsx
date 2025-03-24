
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isLoggedIn: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    // Check if there's an active session when the component mounts
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data && data.session) {
        setIsLoggedIn(true);
        setUser(data.session.user);
      }
    };

    checkSession();

    // Set up an auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true);
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUser(null);
      }
    });

    // Cleanup function to remove the listener
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    setIsLoggedIn(true);
    setUser(data.user);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
