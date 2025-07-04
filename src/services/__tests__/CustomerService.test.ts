import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCustomer } from '@/__tests__/setup';
import { mockSupabaseClient, configureMockReturn } from '@/__tests__/mock-supabase';

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

      configureMockReturn({
        data: mockCustomers,
        error: null
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.fetchCustomers();

      expect(result.data).toEqual(mockCustomers);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    });

    it('should handle fetch customers error', async () => {
      const mockError = { message: 'Database connection failed' };
      
      configureMockReturn({
        data: null,
        error: mockError
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.fetchCustomers();

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        code: 'DATABASE_ERROR',
        message: 'CustomerService: Failed to fetch customers',
        severity: 'high',
        retryable: true
      });
    });
  });

  describe('createCustomer', () => {
    it('should create customer successfully', async () => {
      const newCustomer = createMockCustomer();
      
      configureMockReturn({
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
      
      configureMockReturn({
        data: null,
        error: mockError
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.createCustomer(newCustomer);

      expect(result.data).toBeNull();
      expect(result.error).toMatchObject({
        code: 'DATABASE_ERROR',
        message: 'CustomerService: Failed to create customer',
        severity: 'high',
        retryable: true
      });
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const customerId = 'test-customer-id';
      const updateData = { full_name: 'اسم محدث' };
      const updatedCustomer = createMockCustomer(updateData);
      
      configureMockReturn({
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
      
      configureMockReturn({
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
      
      configureMockReturn({
        data: null,
        error: mockError
      });

      const { customerService } = await import('@/services/CustomerService');
      const result = await customerService.deleteCustomer(customerId);

      expect(result.error).toMatchObject({
        code: 'DATABASE_ERROR',
        message: 'CustomerService: Failed to delete customer',
        severity: 'high',
        retryable: true
      });
    });
  });

  describe('searchCustomers', () => {
    it('should search customers by name', async () => {
      const searchTerm = 'عميل';
      const mockResults = [createMockCustomer()];
      
      configureMockReturn({
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
      
      configureMockReturn({
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