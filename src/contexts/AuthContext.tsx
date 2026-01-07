import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getUser, createUser, loginUser, logoutUser, setUser as setStoredUser } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => User;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): boolean => {
    const loggedInUser = loginUser(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, password: string): User => {
    const newUser = createUser(name, email, password);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setStoredUser(updatedUser);
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
