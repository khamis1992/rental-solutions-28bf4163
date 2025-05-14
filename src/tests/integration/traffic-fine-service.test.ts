/**
 * Integration tests for StandardizedTrafficFineService
 * 
 * These tests validate the functionality of the traffic fine service methods
 * including proper validation, error handling, and database interactions.
 */
import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { trafficFineService } from '@/services/StandardizedTrafficFineService';
import { validateData } from '@/utils/validation';
import { TrafficFine, TrafficFineCreate, TrafficFineUpdate } from '@/types/traffic-fine.types';

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

describe('StandardizedTrafficFineService', () => {
  let mockValidateData: MockedFunction<typeof validateData>;
  
  beforeEach(() => {
    mockValidateData = validateData as MockedFunction<typeof validateData>;
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('createTrafficFine', () => {
    it('should validate input data', async () => {
      const trafficFineData: TrafficFineCreate = {
        vehicle_id: 'vehicle-123',
        violation_date: new Date().toISOString(),
        violation_type: 'speeding',
        fine_amount: 500,
        license_plate: 'ABC123',
        location: 'Main Street',
        payment_status: 'unpaid'
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: trafficFineData });
      
      await trafficFineService.createTrafficFine(trafficFineData);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), trafficFineData);
    });
    
    it('should return error when validation fails', async () => {
      const trafficFineData = {
        vehicle_id: 'vehicle-123',
        violation_date: 'invalid-date', // Invalid date format
        fine_amount: -100, // Invalid negative amount
        payment_status: 'invalid-status' as any
      };
      
      mockValidateData.mockReturnValueOnce({ 
        success: false, 
        error: 'Invalid traffic fine data' 
      });
      
      const result = await trafficFineService.createTrafficFine(trafficFineData as any);
      
      expect(result).toBeNull();
      expect(mockValidateData).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('updateTrafficFine', () => {
    it('should validate input data', async () => {
      const fineId = 'fine-123';
      const updateData: TrafficFineUpdate = {
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        notes: 'Paid in full'
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: updateData });
      
      await trafficFineService.updateTrafficFine(fineId, updateData);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), updateData);
    });
    
    it('should return error when validation fails', async () => {
      const fineId = 'fine-123';
      const updateData = {
        payment_status: 'unknown' as any,
        fine_amount: -200 // Invalid negative amount
      };
      
      mockValidateData.mockReturnValueOnce({ 
        success: false, 
        error: 'Invalid traffic fine update data' 
      });
      
      const result = await trafficFineService.updateTrafficFine(fineId, updateData);
      
      expect(result).toBeNull();
      expect(mockValidateData).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('updateTrafficFineStatus', () => {
    it('should validate status update', async () => {
      const fineId = 'fine-123';
      const statusUpdate = {
        status: 'paid' as const,
        payment_date: new Date().toISOString(),
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: statusUpdate });
      
      await trafficFineService.updateTrafficFineStatus(fineId, statusUpdate.status, statusUpdate.payment_date);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), {
        payment_status: statusUpdate.status,
        payment_date: statusUpdate.payment_date
      });
    });
    
    it('should return error when validation fails', async () => {
      const fineId = 'fine-123';
      const statusUpdate = {
        status: 'invalid-status' as any,
        payment_date: 'not-a-date'
      };
      
      mockValidateData.mockReturnValueOnce({ 
        success: false, 
        error: 'Invalid status update data' 
      });
      
      const result = await trafficFineService.updateTrafficFineStatus(
        fineId, 
        statusUpdate.status, 
        statusUpdate.payment_date
      );
      
      expect(result).toBeNull();
      expect(mockValidateData).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getTrafficFines', () => {
    it('should apply filters correctly', async () => {
      // Test that filters are correctly applied to the query
      // This requires more detailed mocking of the supabase client
    });
    
    it('should handle pagination correctly', async () => {
      // Test that limit and offset are correctly applied
    });
  });
});
