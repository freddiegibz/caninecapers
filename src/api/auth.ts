import { supabase } from '../lib/supabaseClient'

export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { name: fullName } : {}
    }
  });
  if (error) throw error;

  // Log the metadata after signup for debugging
  if (data.user) {
    console.log('Signup successful. User metadata:', data.user.user_metadata);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
