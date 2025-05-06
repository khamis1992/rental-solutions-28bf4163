
/**
 * Standard response type for service operations
 */
export interface ServiceResult<T> {
  success: boolean;
  data: T | null;
  error?: Error | null;
  message?: string;
}

/**
 * Helper function to standardize service operation error handling
 * @param operation - Function that performs the database operation
 * @returns Standardized service result with success/failure information
 */
export async function handleServiceOperation<T>(
  operation: () => Promise<T>
): Promise<ServiceResult<T>> {
  try {
    const data = await operation();
    return {
      success: true,
      data,
      error: null
    };
  } catch (error: any) {
    console.error("Service operation error:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(error?.message || 'Unknown error')
    };
  }
}

/**
 * Base service class with common CRUD operations
 * @template T - Database table name
 */
export abstract class BaseService<T extends string> {
  constructor(protected repository: any) {}

  /**
   * Retrieves all records
   * @returns Promise with all entities of type T
   */
  async findAll(): Promise<ServiceResult<any[]>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findAll();
      if (response.error) {
        throw new Error(`Failed to retrieve all items: ${response.error.message}`);
      }
      return response.data || [];
    });
  }

  /**
   * Finds a single record by ID
   * @param id - Entity identifier
   * @returns Promise with entity of type T
   */
  async findById(id: string): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.findById(id);
      if (response.error) {
        throw new Error(`Failed to find item with ID ${id}: ${response.error.message}`);
      }
      if (!response.data) {
        throw new Error(`Item with ID ${id} not found`);
      }
      return response.data;
    });
  }

  /**
   * Creates a new record
   * @param data - Entity data
   * @returns Promise with created entity
   */
  async create(data: any): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.create(data);
      if (response.error) {
        throw new Error(`Failed to create item: ${response.error.message}`);
      }
      return response.data;
    });
  }

  /**
   * Updates an existing record
   * @param id - Entity identifier
   * @param data - Updated entity data
   * @returns Promise with updated entity
   */
  async update(id: string, data: any): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.update(id, data);
      if (response.error) {
        throw new Error(`Failed to update item with ID ${id}: ${response.error.message}`);
      }
      return response.data;
    });
  }

  /**
   * Removes a record by ID
   * @param id - Entity identifier
   * @returns Promise indicating operation success
   */
  async delete(id: string): Promise<ServiceResult<boolean>> {
    return handleServiceOperation(async () => {
      const response = await this.repository.delete(id);
      if (response.error) {
        throw new Error(`Failed to delete item with ID ${id}: ${response.error.message}`);
      }
      return true;
    });
  }
}
