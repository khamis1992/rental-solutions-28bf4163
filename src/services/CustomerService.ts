import { ApiClient } from './ApiClient';
import { TableRow } from '@/lib/database/types';

export type Customer = TableRow<'profiles'>;

export interface CustomerFilters {
  status?: string;
  searchTerm?: string;
  [key: string]: any;
}

/**
 * CustomerService provides methods to interact with customer-related API endpoints
 * using the centralized ApiClient. All methods are fully typed and documented.
 */
export class CustomerService {
  private api: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.api = apiClient || new ApiClient({
      baseURL: '/api',
      getAuthToken: () => localStorage.getItem('token') || '',
    });
  }

  /**
   * Retrieves customers with optional filters and pagination.
   * Handles network, HTTP, and application errors with retries.
   * @param filters - Filtering criteria
   * @param pagination - Pagination options
   * @returns Promise with filtered customer records and count
   */
  async findCustomers(filters?: CustomerFilters, pagination?: { page: number; pageSize: number }): Promise<{ data: Customer[]; count: number }> {
    const params: any = { ...filters };
    if (pagination) {
      params.page = pagination.page;
      params.pageSize = pagination.pageSize;
    }
    // GET /customers?status=...&searchTerm=...&page=...&pageSize=...
    const result = await this.api.get<{ data: Customer[]; count: number }>('/customers', params, true);
    return result;
  }

  /**
   * Batch update customers by IDs.
   * @param ids - Array of customer IDs
   * @param updates - Partial customer object with updated fields
   * @returns Number of updated records
   */
  async batchUpdate(ids: string[], updates: Partial<Customer>): Promise<number> {
    // PUT /customers/batch-update
    const result = await this.api.put<{ count: number }>('/customers/batch-update', { ids, updates });
    return result.count;
  }

  /**
   * Batch delete customers by IDs.
   * @param ids - Array of customer IDs
   * @returns Number of deleted records
   */
  async batchDelete(ids: string[]): Promise<number> {
    // DELETE /customers/batch-delete
    const result = await this.api.delete<{ count: number }>('/customers/batch-delete', { ids });
    return result.count;
  }

  /**
   * Fetches detailed customer information including rental history.
   * @param id - Customer ID
   * @returns Customer details and associated agreements
   */
  async getCustomerDetails(id: string): Promise<Customer & { agreements: any[] }> {
    // GET /customers/:id/details
    const result = await this.api.get<Customer & { agreements: any[] }>(`/customers/${id}/details`);
    return result;
  }

  /**
   * Updates customer status while maintaining audit trail
   * @param id - Customer ID to update
   * @param status - New status to apply
   * @returns Promise with updated customer record
   */
  async updateStatus(id: string, status: string): Promise<Customer> {
    // PATCH /customers/:id/status
    // Note: PATCH method added to ApiClient below
    const result = await this.api.patch<Customer>(`/customers/${id}/status`, { status });
    return result;
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

export const customerService = new CustomerService();
