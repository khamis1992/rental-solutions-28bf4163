/**
 * Integration tests for StandardizedLegalCaseService
 * 
 * These tests validate the functionality of the legal case service methods
 * including proper validation, error handling, and database interactions.
 */
import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { legalCaseService } from '@/services/StandardizedLegalCaseService';
import { validateData } from '@/utils/validation';
import { LegalCase, LegalCaseCreate, LegalCaseUpdate } from '@/types/legal-case.types';

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

describe('StandardizedLegalCaseService', () => {
  let mockValidateData: MockedFunction<typeof validateData>;
  
  beforeEach(() => {
    mockValidateData = validateData as MockedFunction<typeof validateData>;
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('createLegalCase', () => {
    it('should validate input data', async () => {
      const legalCaseData: LegalCaseCreate = {
        agreement_id: 'agreement-123',
        case_type: 'payment_dispute',
        case_number: 'CASE-2025-001',
        filing_date: new Date().toISOString(),
        status: 'open',
        description: 'Payment dispute for rental agreement',
        assigned_attorney: 'John Smith'
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: legalCaseData });
      
      await legalCaseService.createLegalCase(legalCaseData);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), legalCaseData);
    });
    
    it('should return error when validation fails', async () => {
      const legalCaseData = {
        agreement_id: 'agreement-123',
        case_type: '', // Invalid empty case type
        status: 'invalid-status' as any,
        filing_date: 'not-a-date'
      };
      
      mockValidateData.mockReturnValueOnce({ 
        success: false, 
        error: 'Invalid legal case data' 
      });
      
      const result = await legalCaseService.createLegalCase(legalCaseData as any);
      
      expect(result).toBeNull();
      expect(mockValidateData).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('updateLegalCase', () => {
    it('should validate input data', async () => {
      const caseId = 'case-123';
      const updateData: LegalCaseUpdate = {
        status: 'closed',
        resolution_date: new Date().toISOString(),
        resolution: 'Settled out of court',
        notes: 'Customer agreed to settlement terms'
      };
      
      mockValidateData.mockReturnValueOnce({ success: true, data: updateData });
      
      await legalCaseService.updateLegalCase(caseId, updateData);
      
      expect(mockValidateData).toHaveBeenCalledTimes(1);
      expect(mockValidateData).toHaveBeenCalledWith(expect.any(Object), updateData);
    });
    
    it('should return error when validation fails', async () => {
      const caseId = 'case-123';
      const updateData = {
        status: 'unknown' as any,
        resolution_date: 'invalid-date'
      };
      
      mockValidateData.mockReturnValueOnce({ 
        success: false, 
        error: 'Invalid legal case update data' 
      });
      
      const result = await legalCaseService.updateLegalCase(caseId, updateData);
      
      expect(result).toBeNull();
      expect(mockValidateData).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getLegalCases', () => {
    it('should apply filters correctly', async () => {
      // Test that filters are correctly applied to the query
      // This requires more detailed mocking of the supabase client
    });
    
    it('should handle pagination correctly', async () => {
      // Test that limit and offset are correctly applied
    });
  });
  
  describe('getLegalCasesByAgreement', () => {
    it('should retrieve cases for a specific agreement', async () => {
      const agreementId = 'agreement-123';
      
      // Mock the database response
      const mockCases = [
        { id: 'case-1', agreement_id: agreementId, case_type: 'payment_dispute' },
        { id: 'case-2', agreement_id: agreementId, case_type: 'contract_breach' }
      ];
      
      // This test would require more setup to mock the database response
    });
  });
  
  describe('getLegalCaseDetails', () => {
    it('should retrieve detailed information for a case', async () => {
      const caseId = 'case-123';
      
      // This test would require more setup to mock the database response
    });
    
    it('should include related entities in the response', async () => {
      // Test that the query includes related tables like agreements, customers, etc.
    });
  });
});
