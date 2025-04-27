
import { Database } from '@/types/database.types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

type TypedSupabaseClient = SupabaseClient<Database>;

interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

export function useTypedSupabase() {
  const supabase = useSupabaseClient<Database>();

  return supabase as TypedSupabaseClient;
}

export type { TypedSupabaseClient, QueryResult };
