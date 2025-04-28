
import { useApiQuery } from './use-api-query';
import { useApiMutation } from './use-api-mutation';

export function useCrudApi<TData, TInsert, TUpdate = Partial<TInsert>>(
  resourceName: string,
  endpoint: {
    getAll: () => Promise<TData[]>;
    getById: (id: string) => Promise<TData>;
    create: (data: TInsert) => Promise<TData>;
    update: (id: string, data: TUpdate) => Promise<TData>;
    delete: (id: string) => Promise<void>;
  }
) {
  const getAll = useApiQuery<TData[]>([resourceName], endpoint.getAll);
  
  const getById = (id: string) => useApiQuery<TData>(
    [resourceName, id],
    () => endpoint.getById(id)
  );
  
  const create = useApiMutation<TData, TInsert>(
    (data) => endpoint.create(data),
    { successMessage: `${resourceName} created successfully` }
  );
  
  const update = useApiMutation<TData, { id: string; data: TUpdate }>(
    ({ id, data }) => endpoint.update(id, data),
    { successMessage: `${resourceName} updated successfully` }
  );
  
  const remove = useApiMutation<void, string>(
    (id) => endpoint.delete(id),
    { successMessage: `${resourceName} deleted successfully` }
  );
  
  return {
    getAll,
    getById,
    create,
    update,
    remove,
    // Add these aliases for compatibility with existing code
    useList: getAll,
    useOne: getById,
    useCreate: create,
    useUpdate: update,
    useDelete: remove
  };
}
