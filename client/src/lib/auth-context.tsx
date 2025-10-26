import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getUser, saveUser, mockUsers } from './mock-data';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, country: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock authentication - check against mock users
    const foundUser = mockUsers.find(u => u.username === username);
    if (foundUser) {
      setUser(foundUser);
      saveUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    saveUser(null);
  };

  const register = async (username: string, email: string, country: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if username exists
    const exists = mockUsers.some(u => u.username === username);
    if (exists) {
      return false;
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      username,
      email,
      country,
      role: 'contributor',
      points: 0,
      badges: [],
      joinDate: new Date().toISOString().split('T')[0],
    };

    setUser(newUser);
    saveUser(newUser);
    mockUsers.push(newUser);
    return true;
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      saveUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser }}>
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
