
import { useState, useEffect, createContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import React from 'react';

export interface AuthUser {
  id: string;
  email: string | undefined;
  full_name?: string | null;
  role?: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    if (error) throw error;
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updatePassword,
  };
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    data: {
      session: Session | null;
      user: User | null;
    };
    error: any;
  }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{
    data: {
      session: Session | null;
      user: User | null;
    };
    error: any;
  }>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}>({
  user: null,
  loading: true,
  signIn: async () => ({ data: { session: null, user: null }, error: null }),
  signUp: async () => ({ data: { session: null, user: null }, error: null }),
  signOut: async () => {},
  updatePassword: async () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
