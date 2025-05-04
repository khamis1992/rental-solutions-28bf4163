
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
  async findAll(): Promise<ServiceResult<TableRow<T>[]>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findAll();
      if (response.error) {
        throw new Error(`Failed to fetch ${this.repository.tableName}: ${response.error.message}`);
      }
      return response.data;
    });
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<ServiceResult<TableRow<T>>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findById(id);
      if (response.error) {
        throw new Error(`Failed to fetch ${this.repository.tableName} with ID ${id}: ${response.error.message}`);
      }
      
      if (!response.data) {
        throw new Error(`${this.repository.tableName} with ID ${id} not found`);
      }
      
      return response.data;
    });
  }

  /**
   * Create a new entity
   * @param data Data to create entity with
   */
  async create(data: TableInsert<T>): Promise<ServiceResult<TableRow<T>>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.create(data);
      if (response.error) {
        throw new Error(`Failed to create ${this.repository.tableName}: ${response.error.message}`);
      }
      return response.data;
    });
  }

  /**
   * Update an existing entity
   * @param id Entity ID
   * @param data Data to update entity with
   */
  async update(id: string, data: TableUpdate<T>): Promise<ServiceResult<TableRow<T>>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.update(id, data);
      if (response.error) {
        throw new Error(`Failed to update ${this.repository.tableName} with ID ${id}: ${response.error.message}`);
      }
      return response.data;
    });
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.delete(id);
      if (response.error) {
        throw new Error(`Failed to delete ${this.repository.tableName} with ID ${id}: ${response.error.message}`);
      }
    });
  }
  
  /**
   * Find entities by status
   * @param status Status to filter by
   */
  async findByStatus(status: string): Promise<ServiceResult<TableRow<T>[]>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findByStatus(status);
      if (response.error) {
        throw new Error(`Failed to fetch ${this.repository.tableName} with status ${status}: ${response.error.message}`);
      }
      return response.data;
    });
  }
}

/**
 * Service result interface to standardize service responses
 */
export interface ServiceResult<T> {
  data?: T;
  error?: Error | string;
  success: boolean;
  meta?: Record<string, any>; // Optional metadata for additional context
}

/**
 * Helper function to create a successful service result
 */
export function successResult<T>(data: T, meta?: Record<string, any>): ServiceResult<T> {
  return {
    data,
    success: true,
    meta
  };
}

/**
 * Helper function to create an error service result
 */
export function errorResult<T>(error: Error | string, meta?: Record<string, any>): ServiceResult<T> {
  return {
    error: typeof error === 'string' ? new Error(error) : error,
    success: false,
    meta
  };
}

/**
 * Helper function to enhance an error with additional context
 */
export function enhanceError(error: Error, context: string): Error {
  const enhanced = new Error(`${context}: ${error.message}`);
  enhanced.stack = error.stack;
  return enhanced;
}

/**
 * Wrapper function to handle service operations with standardized error handling
 */
export async function handleServiceOperation<T>(
  operation: () => Promise<T>,
  operationContext?: string
): Promise<ServiceResult<T>> {
  try {
    const data = await operation();
    return successResult(data);
  } catch (error) {
    console.error(`Service operation ${operationContext ? `(${operationContext})` : ''} error:`, error);
    
    let enhancedError: Error;
    if (error instanceof Error) {
      enhancedError = operationContext ? enhanceError(error, operationContext) : error;
    } else {
      enhancedError = new Error(String(error));
      if (operationContext) {
        enhancedError = enhanceError(enhancedError, operationContext);
      }
    }
    
    return errorResult<T>(enhancedError);
  }
}
