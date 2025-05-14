/**
 * Legal Case Service Migration Adapter
 * 
 * This adapter provides backward compatibility with the old legal case hooks
 * while using the new standardized service implementation internally.
 * This ensures components can be migrated gradually without breaking existing functionality.
 */

import { useCallback } from 'react';
import { useLegalCaseQuery } from '@/hooks/use-legal-case-query';
import { LegalCase, LegalCaseStatus } from '@/types/legal-case.types';

/**
 * Adapter hook that emulates the legacy useLegalCases hook interface
 * but uses the standardized useLegalCaseQuery hook internally
 */
export const useLegalCasesAdapter = (options?: { 
  customerId?: string;
  agreementId?: string;
  status?: string; 
}) => {
  const {
    getLegalCases,
    getLegalCaseById,
    createLegalCase: createQuery,
    updateLegalCase: updateQuery,
    deleteLegalCase: deleteQuery,
    updateLegalCaseStatus: updateStatusQuery
  } = useLegalCaseQuery();

  // Use the appropriate query based on provided parameters
  const queryOptions = {} as any;
  if (options?.customerId) queryOptions.customerId = options.customerId;
  if (options?.agreementId) queryOptions.agreementId = options.agreementId;
  if (options?.status) queryOptions.status = options.status;

  const { 
    data: legalCases, 
    isLoading, 
    isError, 
    error 
  } = getLegalCases(queryOptions);

  // Legacy methods reimplemented using the new service
  const createLegalCase = useCallback(async (caseData: Partial<LegalCase>) => {
    try {
      const { mutateAsync } = createQuery();
      const result = await mutateAsync(caseData as any);
      return result;
    } catch (err) {
      console.error('Error creating legal case:', err);
      return null;
    }
  }, [createQuery]);

  const updateLegalCase = useCallback(async (id: string, updates: Partial<LegalCase>) => {
    try {
      const { mutateAsync } = updateQuery();
      const result = await mutateAsync({ id, data: updates });
      return result;
    } catch (err) {
      console.error('Error updating legal case:', err);
      return null;
    }
  }, [updateQuery]);

  const deleteLegalCase = useCallback(async (id: string) => {
    try {
      const { mutateAsync } = deleteQuery();
      const result = await mutateAsync(id);
      return result;
    } catch (err) {
      console.error('Error deleting legal case:', err);
      return null;
    }
  }, [deleteQuery]);

  const updateCaseStatus = useCallback(async (id: string, status: LegalCaseStatus) => {
    try {
      const { mutateAsync } = updateStatusQuery();
      const result = await mutateAsync({ id, status });
      return result;
    } catch (err) {
      console.error('Error updating legal case status:', err);
      return null;
    }
  }, [updateStatusQuery]);

  const fetchCaseById = useCallback(async (id: string) => {
    try {
      const { data, error } = await getLegalCaseById(id);
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching legal case by ID:', err);
      return null;
    }
  }, [getLegalCaseById]);

  return {
    legalCases: legalCases || [],
    isLoading,
    error: error instanceof Error ? error : isError ? new Error('An error occurred') : null,
    createLegalCase,
    updateLegalCase,
    deleteLegalCase,
    updateCaseStatus,
    fetchCaseById
  };
};

/**
 * Combined legal case hook adapter that provides both legacy and new functionality
 */
export const useLegalCaseAdapter = (options?: { 
  customerId?: string;
  agreementId?: string;
  status?: string; 
}) => {
  const legacyHookResult = useLegalCasesAdapter(options);
  const newHookResult = useLegalCaseQuery();
  
  // Return both the legacy interface and the new interface
  return {
    ...legacyHookResult,
    query: newHookResult
  };
};
