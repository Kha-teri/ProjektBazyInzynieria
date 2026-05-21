import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getToken, setToken, removeToken } from '../api/client';

interface AuthUser {
  id: number;
  email: string;
  level: number;
  points: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());

  useEffect(() => {
    const stored = localStorage.getItem('brainshelf_user');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // corrupted data
      }
    }
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    localStorage.setItem('brainshelf_user', JSON.stringify(newUser));
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
    localStorage.removeItem('brainshelf_user');
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('brainshelf_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
