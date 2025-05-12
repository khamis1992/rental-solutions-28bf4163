
import { useQuery, useMutation } from '@tanstack/react-query';
import { createQuery } from '@/utils/query-factory';
import { createMutation } from '@/utils/mutation-factory';
import { handleApiError, handleApiSuccess } from '@/lib/api/enhanced-error-handlers';

/**
 * Creates a set of CRUD API hooks for a resource
 * 
 * @param {Object} config - Configuration for the CRUD hooks
 * @param {string} config.resourceName - Name of the resource for query keys and messages
 * @param {Object} config.api - API functions for the resource
 * @param {Function} config.api.getAll - Function to get all resources
 * @param {Function} config.api.getById - Function to get a resource by ID
 * @param {Function} config.api.create - Function to create a resource
 * @param {Function} config.api.update - Function to update a resource
 * @param {Function} config.api.delete - Function to delete a resource
 */
export function useCrudApi<T, CreateDto, UpdateDto>({
  resourceName,
  api
}: {
  resourceName: string;
  api: {
    getAll: () => Promise<T[]>;
    getById: (id: string) => Promise<T>;
    create: (data: CreateDto) => Promise<T>;
    update: (id: string, data: UpdateDto) => Promise<T>;
    delete: (id: string) => Promise<any>;
  }
}) {
  // UseQuery hook for getting all resources
  const useGetAll = (options?: any) => {
    return createQuery(
      [`${resourceName}s`],
      api.getAll,
      {
        ...options,
        errorContext: `Fetching ${resourceName}s`
      }
    );
  };

  // UseQuery hook for getting a resource by ID
  const useGetById = (id: string | undefined, options?: any) => {
    return createQuery(
      [`${resourceName}`, id],
      () => {
        if (!id) throw new Error(`${resourceName} ID is required`);
        return api.getById(id);
      },
      {
        enabled: !!id,
        ...options,
        errorContext: `Fetching ${resourceName}`
      }
    );
  };

  // UseMutation hook for creating a resource
  const useCreate = (options?: any) => {
    return createMutation(
      (data: CreateDto) => api.create(data),
      {
        successMessage: `${resourceName} created successfully`,
        invalidateQueries: [[`${resourceName}s`]],
        errorContext: `Creating ${resourceName}`,
        ...options
      }
    );
  };

  // UseMutation hook for updating a resource
  const useUpdate = (options?: any) => {
    return createMutation(
      ({ id, data }: { id: string; data: UpdateDto }) => api.update(id, data),
      {
        successMessage: `${resourceName} updated successfully`,
        invalidateQueries: [[`${resourceName}s`], [`${resourceName}`]],
        errorContext: `Updating ${resourceName}`,
        ...options
      }
    );
  };

  // UseMutation hook for deleting a resource
  const useDelete = (options?: any) => {
    return createMutation(
      (id: string) => api.delete(id),
      {
        successMessage: `${resourceName} deleted successfully`,
        invalidateQueries: [[`${resourceName}s`]],
        errorContext: `Deleting ${resourceName}`,
        ...options
      }
    );
  };

  return {
    useGetAll,
    useGetById,
    useCreate,
    useUpdate,
    useDelete
  };
}
