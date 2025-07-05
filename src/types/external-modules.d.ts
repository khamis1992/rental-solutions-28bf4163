declare module 'sonner';
declare module 'jspdf';
declare module 'date-fns';
declare module 'raf';
declare module 'trusted-types';
declare module 'uuid';
declare module 'ws';

import { Database } from './database.types';

declare module '@supabase/supabase-js' {
  export interface PostgrestError {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  }

  export interface PostgrestResponse<T> {
    data: T[] | null;
    error: PostgrestError | null;
    count?: number | null;
  }

  export interface PostgrestSingleResponse<T> {
    data: T | null;
    error: PostgrestError | null;
    count?: number | null;
  }

  export type SupabaseClient = SupabaseClient<Database>;
  export type PostgrestFilterBuilder = PostgrestFilterBuilder<Database['public']['Tables']>;
}

declare module '@supabase/postgrest-js' {
  export type PostgrestFilterBuilder = PostgrestFilterBuilder<Database['public']['Tables']>;
}
