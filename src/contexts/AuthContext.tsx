import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'cashier';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('pos_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Query user from database
      const { data: users, error } = await (supabase as any)
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Database error:', error);
        // If table doesn't exist, show helpful error
        if (error.message?.includes('does not exist')) {
          alert('Authentication table not set up. Please run SETUP_AUTH.sql in Supabase SQL Editor first.');
        }
        return false;
      }

      if (!users || users.length === 0) {
        return false;
      }

      const dbUser = users[0];

      // Simple password check (plain text for demo - CHANGE IN PRODUCTION)
      if (dbUser.password_hash === password) {
        const userData: User = {
          id: dbUser.id,
          username: dbUser.username,
          full_name: dbUser.full_name,
          role: dbUser.role,
        };
        setUser(userData);
        localStorage.setItem('pos_user', JSON.stringify(userData));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pos_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
