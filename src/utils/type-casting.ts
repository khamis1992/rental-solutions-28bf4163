
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;
type RowType<T extends TableNames> = Tables[T]['Row'];

export function asTableId<T extends TableNames>(table: T, id: string): RowType<T>['id'] {
  return id as RowType<T>['id'];
}

export function asTableStatus<T extends TableNames>(table: T, status: string): RowType<T>['status'] {
  return status as RowType<T>['status'];
}
