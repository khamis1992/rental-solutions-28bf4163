
import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a reducer for more predictable state management
function authReducer(state, action) {
  switch (action.type) {
    case 'SIGNED_IN':
      return { ...state, user: action.payload, isLoading: false };
    case 'SIGNED_OUT':
      return { ...state, user: null, isLoading: false };
    case 'LOADING':
      return { ...state, isLoading: true };
    case 'ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    error: null
  });
  const navigate = useNavigate();
  const hasToasted = useRef(false);

  // Use useCallback to memoize functions
  const signIn = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      dispatch({ type: 'SIGNED_IN', payload: data.user });
      navigate('/dashboard');
      return data;
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      toast.error(`Sign in failed: ${error.message}`);
      throw error;
    }
  }, [supabase, navigate]);

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    dispatch({ type: 'LOADING' });
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
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      toast.error(`Registration failed: ${error.message}`);
      throw error;
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch({ type: 'SIGNED_OUT' });
      navigate('/');
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      toast.error(`Sign out failed: ${error.message}`);
      throw error;
    }
  }, [supabase, navigate]);

  const resetPassword = useCallback(async (email: string) => {
    dispatch({ type: 'LOADING' });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent');
    } catch (error: any) {
      dispatch({ type: 'ERROR', payload: error.message });
      toast.error(`Password reset failed: ${error.message}`);
      throw error;
    }
  }, [supabase]);

  // Setup auth state listener efficiently
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        dispatch({ type: 'SIGNED_IN', payload: session.user });
        if (!hasToasted.current) {
          toast.success('Signed in successfully');
          hasToasted.current = true; // Prevent duplicate toasts
        }
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SIGNED_OUT' });
        toast.info('Signed out');
        hasToasted.current = false; // Reset for next sign in
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        dispatch({ type: 'SIGNED_IN', payload: session.user });
        hasToasted.current = true; // Prevent duplicate toasts
      } else {
        dispatch({ type: 'SIGNED_OUT' });
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  // Memoize the context value
  const value = useMemo(() => ({
    user: state.user,
    session: state.session,
    loading: state.isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }), [state.user, state.session, state.isLoading, signIn, signUp, signOut, resetPassword]);

  return (
    <AuthContext.Provider value={value}>
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
