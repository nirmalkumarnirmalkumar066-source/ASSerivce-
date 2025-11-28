import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { useData } from './DataContext';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: 'admin' | 'worker') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { users } = useData();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const login = async (email: string, password: string, role: 'admin' | 'worker') => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    
    const user = users.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.role === role);
    
    if (!user) {
      throw new Error(`No ${role} account found with email: ${cleanEmail}`);
    }

    // Logic: For workers, the password MUST be their email
    if (role === 'worker') {
      if (cleanPassword !== cleanEmail) {
        throw new Error("Incorrect Password. For workers, your password is your email address.");
      }
    } else {
      // For admin, we allow 'password' or the email for simplicity in this demo
      if (cleanPassword !== 'password' && cleanPassword !== cleanEmail) {
        throw new Error("Invalid password");
      }
    }

    setAuthState({ user, isAuthenticated: true });
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};