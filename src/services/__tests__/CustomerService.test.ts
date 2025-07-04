import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockCustomer } from '@/__tests__/setup';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

describe('CustomerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCustomers', () => {
    it('should fetch customers successfully', async () => {
      const mockCustomers = [
        createMockCustomer(),
        createMockCustomer({ id: 'test-customer-2', full_name: 'عميل آخر' })
      ];

      mockSupabaseClient.from().select().eq().order().then.mockResolvedValue({
        data: mockCustomers,
        error: null
      });

      // Dynamic import to avoid module loading issues
      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.fetchCustomers();

      expect(result.data).toEqual(mockCustomers);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    });

    it('should handle fetch customers error', async () => {
      const mockError = { message: 'Database connection failed' };
      
      mockSupabaseClient.from().select().eq().order().then.mockResolvedValue({
        data: null,
        error: mockError
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.fetchCustomers();

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('createCustomer', () => {
    it('should create customer successfully', async () => {
      const newCustomer = createMockCustomer();
      
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: newCustomer,
        error: null
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.createCustomer(newCustomer);

      expect(result.data).toEqual(newCustomer);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    });

    it('should handle create customer error', async () => {
      const mockError = { message: 'Validation failed' };
      const newCustomer = createMockCustomer();
      
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: mockError
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.createCustomer(newCustomer);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const customerId = 'test-customer-id';
      const updateData = { full_name: 'اسم محدث' };
      const updatedCustomer = createMockCustomer(updateData);
      
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
        data: updatedCustomer,
        error: null
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.updateCustomer(customerId, updateData);

      expect(result.data).toEqual(updatedCustomer);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer successfully', async () => {
      const customerId = 'test-customer-id';
      
      mockSupabaseClient.from().delete().eq().mockResolvedValue({
        data: null,
        error: null
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.deleteCustomer(customerId);

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    });

    it('should handle delete customer error', async () => {
      const customerId = 'test-customer-id';
      const mockError = { message: 'Customer has active agreements' };
      
      mockSupabaseClient.from().delete().eq().mockResolvedValue({
        data: null,
        error: mockError
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.deleteCustomer(customerId);

      expect(result.error).toEqual(mockError);
    });
  });

  describe('searchCustomers', () => {
    it('should search customers by name', async () => {
      const searchTerm = 'عميل';
      const mockResults = [createMockCustomer()];
      
      mockSupabaseClient.from().select().ilike().order().then.mockResolvedValue({
        data: mockResults,
        error: null
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.searchCustomers(searchTerm);

      expect(result.data).toEqual(mockResults);
      expect(result.error).toBeNull();
    });

    it('should return empty array for no matches', async () => {
      const searchTerm = 'غير موجود';
      
      mockSupabaseClient.from().select().ilike().order().then.mockResolvedValue({
        data: [],
        error: null
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.searchCustomers(searchTerm);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });
});    