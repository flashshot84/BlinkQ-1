import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  checkingAdmin: boolean;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    loading: true,
    checkingAdmin: false,
  });

  useEffect(() => {
    // Get initial session
    supabase?.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setState(prev => ({ ...prev, user, loading: false }));
      
      if (user) {
        checkAdminStatus(user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        setState(prev => ({ ...prev, user, loading: false }));
        
        if (user) {
          checkAdminStatus(user.id);
        } else {
          setState(prev => ({ ...prev, isAdmin: false }));
        }
      }
    ) ?? { data: { subscription: { unsubscribe: () => {} } } };

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    if (!supabase) return;

    setState(prev => ({ ...prev, checkingAdmin: true }));
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        setState(prev => ({ ...prev, isAdmin: false, checkingAdmin: false }));
        return;
      }

      setState(prev => ({ 
        ...prev, 
        isAdmin: data?.is_admin || false, 
        checkingAdmin: false 
      }));
    } catch (error) {
      console.error('Error checking admin status:', error);
      setState(prev => ({ ...prev, isAdmin: false, checkingAdmin: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...state,
    signIn,
    signOut,
    refreshAdminStatus: () => state.user && checkAdminStatus(state.user.id),
  };
}