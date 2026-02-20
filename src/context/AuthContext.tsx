import { supabase } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  deleteAccount: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
       throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Stale / invalid token — clear it and treat user as signed out
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Token refresh failed — sign out to clear the invalid token
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (username: string, email: string, password: string) => {
    return supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username,
        }
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  const resetPassword = async (email: string) => {
      return supabase.auth.resetPasswordForEmail(email);
  };

  const deleteAccount = async () => {
    try {
      // Delete avatar files via Storage API (SQL can't do this)
      const userId = user?.id;
      if (userId) {
        const { data: files } = await supabase.storage.from('avatars').list(userId);
        if (files && files.length > 0) {
          const filePaths = files.map(f => `${userId}/${f.name}`);
          await supabase.storage.from('avatars').remove(filePaths);
        }
      }

      // Call server-side function to delete games, profile, and auth user
      const { error } = await supabase.rpc('delete_own_account');
      if (error) return { error };

      await supabase.auth.signOut();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, resetPassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
