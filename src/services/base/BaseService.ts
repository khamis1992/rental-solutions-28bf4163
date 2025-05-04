import { Repository } from '@/lib/database/repository';
import { DbListResponse, DbSingleResponse, TableRow, TableInsert, TableUpdate } from '@/lib/database/types';

/**
 * Base service class that provides common functionality for all services
 */
export abstract class BaseService<T extends string> {
  protected repository: Repository<T>;

  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  /**
   * Find all entities
   */
  async findAll(): Promise<TableRow<T>[]> {
    const response = await this.repository.findAll();
    if (response.error) {
      console.error(`Error finding all ${this.repository.tableName}:`, response.error);
      throw new Error(`Failed to fetch ${this.repository.tableName}`);
    }
    return response.data;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<TableRow<T>> {
    const response = await this.repository.findById(id);
    if (response.error) {
      console.error(`Error finding ${this.repository.tableName} by ID:`, response.error);
      throw new Error(`Failed to fetch ${this.repository.tableName} with ID ${id}`);
    }
    return response.data;
  }

  /**
   * Create a new entity
   * @param data Data to create entity with
   */
  async create(data: TableInsert<T>): Promise<TableRow<T>> {
    const response = await this.repository.create(data);
    if (response.error) {
      console.error(`Error creating ${this.repository.tableName}:`, response.error);
      throw new Error(`Failed to create ${this.repository.tableName}`);
    }
    return response.data;
  }

  /**
   * Update an existing entity
   * @param id Entity ID
   * @param data Data to update entity with
   */
  async update(id: string, data: TableUpdate<T>): Promise<TableRow<T>> {
    const response = await this.repository.update(id, data);
    if (response.error) {
      console.error(`Error updating ${this.repository.tableName}:`, response.error);
      throw new Error(`Failed to update ${this.repository.tableName} with ID ${id}`);
    }
    return response.data;
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<void> {
    const response = await this.repository.delete(id);
    if (response.error) {
      console.error(`Error deleting ${this.repository.tableName}:`, response.error);
      throw new Error(`Failed to delete ${this.repository.tableName} with ID ${id}`);
    }
  }
}

/**
 * Service result interface to standardize service responses
 */
export interface ServiceResult<T> {
  data?: T;
  error?: Error | string;
  success: boolean;
}

/**
 * Helper function to create a successful service result
 */
export function successResult<T>(data: T): ServiceResult<T> {
  return {
    data,
    success: true
  };
}

/**
 * Helper function to create an error service result
 */
export function errorResult<T>(error: Error | string): ServiceResult<T> {
  return {
    error: typeof error === 'string' ? new Error(error) : error,
    success: false
  };
}

/**
 * Wrapper function to handle service operations with standardized error handling
 */
export async function handleServiceOperation<T>(
  operation: () => Promise<T>
): Promise<ServiceResult<T>> {
  try {
    const data = await operation();
    return successResult(data);
  } catch (error) {
    console.error('Service operation error:', error);
    return errorResult<T>(error instanceof Error ? error : new Error(String(error)));
  }
}
