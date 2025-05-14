/**
 * Integration tests for StandardizedPaymentService
 * 
 * These tests validate the functionality of the payment service methods
 * including proper validation, error handling, and database interactions.
 */
import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { paymentService } from '@/services/StandardizedPaymentService';
import { validateData } from '@/utils/validation';
import { Payment, PaymentInsert } from '@/types/payment.types';

// Mock the supabase client
vi.mock('@/lib/supabase', () => {
  const mockSelect = vi.fn(() => mockFrom);
  const mockInsert = vi.fn(() => mockFrom);
  const mockUpdate = vi.fn(() => mockFrom);
  const mockDelete = vi.fn(() => mockFrom);
  const mockFrom = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: vi.fn(() => mockFrom),
    in: vi.fn(() => mockFrom),
    gte: vi.fn(() => mockFrom),
    lte: vi.fn(() => mockFrom),
    is: vi.fn(() => mockFrom),
    not: vi.fn(() => mockFrom),
    or: vi.fn(() => mockFrom),
    order: vi.fn(() => mockFrom),
    limit: vi.fn(() => mockFrom),
    offset: vi.fn(() => mockFrom),
    single: vi.fn(() => mockFrom),
    match: vi.fn(() => mockFrom),
    like: vi.fn(() => mockFrom),
    ilike: vi.fn(() => mockFrom),
    range: vi.fn(() => mockFrom),
    contains: vi.fn(() => mockFrom),
  };

  return {
    supabase: {
      from: vi.fn(() => mockFrom),
      rpc: vi.fn(() => ({
        data: null,
        error: null
      })),
    },
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete
  };
});

// Mock validation
vi.mock('@/utils/validation', () => ({
  validateData: vi.fn((schema, data) => ({ success: true, data }))
}));

describe('StandardizedPaymentService', () => {
  let mockValidateData: MockedFunction<typeof validateData>;
  
  beforeEach(() => {
    mockValidateData = validateData as MockedFunction<typeof validateData>;
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('createPayment', () => {
    it('should validate input data', async () => {
      const paymentData: PaymentInsert = {
        lease_id: 'lease-123',
        amount: 1000,
        status: 'completed',
        payment_date: new Date().toISOString()
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: paymentData });
      
      await paymentService.createPayment(paymentData);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), paymentData);
    });
    
    it('should return error when validation fails', async () => {
      const paymentData = {
        lease_id: 'lease-123',
        amount: -100, // Invalid amount
        status: 'completed'
      };
      
      mockValidateData.mockReturnValueOnce({ 
        success: false, 
        error: 'Amount must be a positive number' 
      });
      
      const result = await paymentService.createPayment(paymentData as any);
      
      expect(result).toBeNull();
      expect(mockValidateData).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('updatePayment', () => {
    it('should validate input data', async () => {
      const paymentId = 'payment-123';
      const updateData = {
        amount: 1500,
        status: 'completed' as const,
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: updateData });
      
      await paymentService.updatePayment(paymentId, updateData);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), updateData);
    });
    
    it('should return error when validation fails', async () => {
      const paymentId = 'payment-123';
      const updateData = {
        amount: -500, // Invalid amount
        status: 'invalid-status' as any
      };
      
      mockValidateData.mockReturnValueOnce({ 
        success: false, 
        error: 'Invalid payment data' 
      });
      
      const result = await paymentService.updatePayment(paymentId, updateData);
      
      expect(result).toBeNull();
      expect(mockValidateData).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('processSpecialPayment', () => {
    it('should validate special payment options', async () => {
      const agreementId = 'agreement-123';
      const amount = 1200;
      const paymentDate = new Date();
      const options = {
        notes: 'Late payment with fee',
        includeLatePaymentFee: true,
        paymentMethod: 'cash'
      };
      
      // Mock the validation for options
      mockValidateData.mockReturnValueOnce({ success: true, data: options });
      
      await paymentService.processSpecialPayment(agreementId, amount, paymentDate, options);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), options);
    });
    
    it('should calculate late fee when includeLatePaymentFee is true', async () => {
      // Implementation details will depend on how late fees are calculated
      // This is a placeholder test that should be expanded
    });
  });
  
  describe('getPayments', () => {
    it('should apply filters correctly', async () => {
      // Test that filters are correctly applied to the query
      // This requires more detailed mocking of the supabase client
    });
    
    it('should handle pagination correctly', async () => {
      // Test that limit and offset are correctly applied
    });
  });
});
