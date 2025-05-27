
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MinimalAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    // Simulate auth check - replace with actual auth logic later
    const checkAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async operation
        setIsAuthenticated(false); // Default to not authenticated for now
        setUser(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth check failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    error,
    user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useMinimalAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useMinimalAuth must be used within MinimalAuthProvider');
  }
  return context;
};
