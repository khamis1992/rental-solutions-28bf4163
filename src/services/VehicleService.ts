import { ApiClient } from './ApiClient';
import { TableRow } from '@/lib/database/types';

export type Vehicle = TableRow<'vehicles'>;

export interface VehicleFilterParams {
  status?: string;
  statuses?: string[];
  make?: string;
  model?: string;
  year?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  location?: string;
  vehicle_type_id?: string;
  [key: string]: any;
}

/**
 * VehicleService provides methods to interact with vehicle-related API endpoints
 * using the centralized ApiClient. All methods are fully typed and documented.
 */
export class VehicleService {
  private api: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.api = apiClient || new ApiClient({
      baseURL: '/api',
      getAuthToken: () => localStorage.getItem('token') || '',
    });
  }

  /**
   * Finds vehicles based on specified filtering criteria
   * @param filters - Optional filtering parameters for vehicle search
   * @param pagination - Pagination options
   * @returns Promise with filtered vehicle records and count
   */
  async findVehicles(filters?: VehicleFilterParams, pagination?: { page: number; pageSize: number }): Promise<{ data: Vehicle[]; count: number }> {
    const params: any = { ...filters };
    if (pagination) {
      params.page = pagination.page;
      params.pageSize = pagination.pageSize;
    }
    // GET /vehicles?status=...&searchTerm=...&page=...&pageSize=...
    return this.api.get<{ data: Vehicle[]; count: number }>('/vehicles', params, true);
  }

  /**
   * Batch update vehicles by IDs
   * @param ids - Array of vehicle IDs
   * @param updates - Partial vehicle object with updated fields
   * @returns Number of updated records
   */
  async batchUpdate(ids: string[], updates: Partial<Vehicle>): Promise<number> {
    // PUT /vehicles/batch-update
    const result = await this.api.put<{ count: number }>('/vehicles/batch-update', { ids, updates });
    return result.count;
  }

  /**
   * Batch delete vehicles by IDs
   * @param ids - Array of vehicle IDs
   * @returns Number of deleted records
   */
  async batchDelete(ids: string[]): Promise<number> {
    // DELETE /vehicles/batch-delete
    const result = await this.api.delete<{ count: number }>('/vehicles/batch-delete', { ids });
    return result.count;
  }

  /**
   * Retrieves available vehicles ready for assignment
   * @returns List of available vehicles
   */
  async findAvailableVehicles(): Promise<Vehicle[]> {
    // GET /vehicles/available
    return this.api.get<Vehicle[]>('/vehicles/available');
  }

  /**
   * Retrieves detailed vehicle information including maintenance history
   * @param id - Vehicle identifier
   * @returns Vehicle details and associated maintenance records
   */
  async getVehicleDetails(id: string): Promise<Vehicle & { maintenance: any[] }> {
    // GET /vehicles/:id/details
    return this.api.get<Vehicle & { maintenance: any[] }>(`/vehicles/${id}/details`);
  }

  /**
   * Updates a single vehicle by ID
   * @param id - Vehicle identifier
   * @param updates - Partial vehicle object with updated fields
   * @returns The updated vehicle
   */
  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    // PATCH /vehicles/:id
    return this.api.patch<Vehicle>(`/vehicles/${id}`, updates);
  }

  /**
   * Updates vehicle operational status
   * @param id - Vehicle identifier
   * @param status - New vehicle status
   * @returns Updated vehicle record
   */
  async updateStatus(id: string, status: string): Promise<Vehicle> {
    // PATCH /vehicles/:id/status
    return this.api.patch<Vehicle>(`/vehicles/${id}/status`, { status });
  }

  /**
   * Gets vehicle types and categories
   * @returns List of vehicle types
   */
  async getVehicleTypes(): Promise<any[]> {
    // GET /vehicle-types
    return this.api.get<any[]>('/vehicle-types');
  }
}

// Add PATCH support to ApiClient prototype if not present
declare module './ApiClient' {
  interface ApiClient {
    patch<T>(url: string, data?: any): Promise<T>;
  }
}

if (!ApiClient.prototype.patch) {
  ApiClient.prototype.patch = function<T>(url: string, data?: any) {
    // @ts-ignore
    return this.request<T>({ method: 'PATCH', url, data });
  };
}

export const vehicleService = new VehicleService();
