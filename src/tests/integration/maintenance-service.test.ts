/**
 * Integration tests for StandardizedMaintenanceService
 * 
 * These tests validate the functionality of the maintenance service methods
 * including proper validation, error handling, and database interactions.
 */
import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { maintenanceService } from '@/services/StandardizedMaintenanceService';
import { validateData } from '@/utils/validation';
import { Maintenance, MaintenanceCreate, MaintenanceStatus } from '@/types/maintenance.types';

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

describe('StandardizedMaintenanceService', () => {
  let mockValidateData: MockedFunction<typeof validateData>;
  
  beforeEach(() => {
    mockValidateData = validateData as MockedFunction<typeof validateData>;
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('createMaintenance', () => {
    it('should validate input data', async () => {
      const maintenanceData: MaintenanceCreate = {
        vehicle_id: 'vehicle-123',
        maintenance_type: 'repair',
        status: 'scheduled',
        description: 'Engine repair',
        scheduled_date: new Date().toISOString(),
        cost_estimate: 500
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: maintenanceData });
      
      await maintenanceService.createMaintenance(maintenanceData);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), maintenanceData);
    });
    
    it('should return error when validation fails', async () => {
      const maintenanceData = {
        vehicle_id: 'vehicle-123',
        maintenance_type: '', // Invalid empty type
        status: 'invalid-status' as any,
        cost_estimate: -100 // Invalid negative cost
      };
      
      mockValidateData.mockReturnValueOnce({ 
        success: false, 
        error: 'Invalid maintenance data' 
      });
      
      const result = await maintenanceService.createMaintenance(maintenanceData as any);
      
      expect(result).toBeNull();
      expect(mockValidateData).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('updateMaintenance', () => {
    it('should validate input data', async () => {
      const maintenanceId = 'maintenance-123';
      const updateData = {
        status: 'completed' as MaintenanceStatus,
        completion_date: new Date().toISOString(),
        actual_cost: 550,
        notes: 'Completed earlier than expected'
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: updateData });
      
      await maintenanceService.updateMaintenance(maintenanceId, updateData);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), updateData);
    });
    
    it('should return error when validation fails', async () => {
      const maintenanceId = 'maintenance-123';
      const updateData = {
        status: 'unknown' as any,
        actual_cost: -200 // Invalid negative cost
      };
      
      mockValidateData.mockReturnValueOnce({ 
        success: false, 
        error: 'Invalid maintenance update data' 
      });
      
      const result = await maintenanceService.updateMaintenance(maintenanceId, updateData);
      
      expect(result).toBeNull();
      expect(mockValidateData).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('scheduleRoutineMaintenance', () => {
    it('should validate scheduling parameters', async () => {
      const vehicleId = 'vehicle-123';
      const schedulingData = {
        maintenance_type: 'oil_change',
        scheduled_date: new Date().toISOString(),
        cost_estimate: 150,
        notes: 'Regular scheduled maintenance'
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: schedulingData });
      
      await maintenanceService.scheduleRoutineMaintenance(vehicleId, schedulingData);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), {
        vehicle_id: vehicleId,
        ...schedulingData,
        status: 'scheduled'
      });
    });
    
    it('should set default values for missing fields', async () => {
      // Test that default values are correctly applied
      // This depends on the implementation details
    });
  });
  
  describe('getMaintenanceHistory', () => {
    it('should retrieve maintenance history for a vehicle', async () => {
      // Test retrieval of maintenance history
      // Requires detailed mocking of the database response
    });
    
    it('should apply date range filters correctly', async () => {
      // Test that date range filters are correctly applied
    });
  });
});
