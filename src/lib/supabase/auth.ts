import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { User, UserRole } from '@/types';

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizationId?: string;
}

async function fetchProfile(userId: string): Promise<User> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as User;
}

export const Auth = {
  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return fetchProfile(data.user.id);
  },

  async signUp({ name, email, password, role, organizationId = 'org-1' }: SignUpInput): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, organizationId } },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Sign up did not return a user.');
    return fetchProfile(data.user.id);
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSessionUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) return null;
    return fetchProfile(data.session.user.id);
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
  },

  fetchProfile,
};
