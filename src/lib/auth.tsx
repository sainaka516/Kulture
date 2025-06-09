import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshUser = async () => {
    try {
      const user = await api.getCurrentUser();
      setUser(user);
      setError(null);
    } catch (error) {
      setError(error as Error);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Call your sign in API endpoint
      await api.signIn(email, password);
      await refreshUser();
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Call your sign out API endpoint
      await api.signOut();
      setUser(null);
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 