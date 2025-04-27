
import { useSupabaseClient, useSession, useUser } from '@supabase/auth-helpers-react';

export function useAuth() {
  const supabaseClient = useSupabaseClient();
  const session = useSession();
  const user = useUser();

  return {
    supabaseClient,
    session,
    user,
    isAuthenticated: !!session
  };
}
