import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, api } from './api';
import { toast } from 'sonner';

export interface User {
  id: string;
  username: string;
  email: string;
  country: string;
  role: 'contributor' | 'verifier' | 'admin';
  points: number;
  badges: Array<{ name: string; icon: string; earnedAt: string }>;
  joinDate: string;
  isActive: boolean;
}


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string, country: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      if (api.isAuthenticated()) {
        try {
          const response = await authApi.getMe();
          setUser(response.user);
        } catch (error) {
          // Token invalid, clear auth
          api.clearAuth();
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);


  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(username, password);
      
      if (response.success) {
        setUser(response.user);
        toast.success('Login successful!');
        return true;
      }
      
      toast.error('Invalid credentials');
      return false;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      api.clearAuth();
      setUser(null);
      toast.success('Logged out successfully');
    }
  };


  const register = async (username: string, email: string, password: string, country: string): Promise<boolean> => {
    try {
      const response = await authApi.register(username, email, password, country);
      
      if (response.success) {
        setUser(response.user);
        toast.success('Registration successful!');
        return true;
      }
      
      toast.error('Registration failed');
      return false;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      return false;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        if (updates.email || updates.country) {
          const response = await authApi.updateProfile(
            updates.email || user.email,
            updates.country || user.country
          );
          
          if (response.success) {
            setUser(response.user);
            toast.success('Profile updated successfully');
          }
        } else {
          // For other updates like points, badges (from backend events)
          const updatedUser = { ...user, ...updates };
          setUser(updatedUser);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Update failed');
      }
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
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
