
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];

export function asTableId<T extends keyof Tables>(
  tableName: T,
  id: string
): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

export function asTableStatus<T extends keyof Tables>(
  tableName: T,
  status: string
): Tables[T]['Row']['status'] {
  return status as Tables[T]['Row']['status'];
}
