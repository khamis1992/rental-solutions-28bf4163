
import { useState, useEffect } from 'react';
import { AgreementService } from '@/services/AgreementService';
import { Agreement } from '@/types/agreement';
import { AgreementFilters } from '@/types/filters';
import { adaptToValidationAgreement } from '@/utils/agreement-type-adapter';

export const useAgreementService = (filters?: AgreementFilters) => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const agreementService = new AgreementService();

  const fetchAgreements = async () => {
    try {
      setIsLoading(true);
      const data = await agreementService.findAgreements(filters);
      setAgreements(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching agreements:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching agreements'));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAgreement = async (id: string) => {
    try {
      setIsLoading(true);
      await agreementService.delete(id);
      setAgreements(prevAgreements => prevAgreements.filter(a => a.id !== id));
      setError(null);
      return true;
    } catch (err) {
      console.error('Error deleting agreement:', err);
      setError(err instanceof Error ? err : new Error('Unknown error deleting agreement'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAgreement = async (agreement: Agreement) => {
    try {
      setIsLoading(true);
      // Use the adapter to convert to validation schema format
      const validationAgreement = adaptToValidationAgreement(agreement);
      const result = await agreementService.save(validationAgreement);
      
      if (result.success) {
        setAgreements(prevAgreements => 
          prevAgreements.map(a => a.id === agreement.id ? agreement : a)
        );
      }
      
      setError(null);
      return result;
    } catch (err) {
      console.error('Error updating agreement:', err);
      setError(err instanceof Error ? err : new Error('Unknown error updating agreement'));
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  const createAgreement = async (agreement: Agreement) => {
    try {
      setIsLoading(true);
      // Use the adapter to convert to validation schema format
      const validationAgreement = adaptToValidationAgreement(agreement);
      const result = await agreementService.save(validationAgreement);
      
      if (result.success && result.data) {
        setAgreements(prevAgreements => [...prevAgreements, result.data as Agreement]);
      }
      
      setError(null);
      return result;
    } catch (err) {
      console.error('Error creating agreement:', err);
      setError(err instanceof Error ? err : new Error('Unknown error creating agreement'));
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  // Expose both function-based and property-based APIs for backward compatibility
  useEffect(() => {
    fetchAgreements();
  }, [filters]);

  return {
    // Function-based API
    getAgreements: agreementService.findAgreements,
    getAgreementById: agreementService.findById,
    updateAgreement,
    deleteAgreement,
    createAgreement,
    calculateRemainingAmount: agreementService.calculateRemainingAmount,
    // Property-based API
    agreements,
    isLoading,
    error,
    // Refresh utility
    fetchAgreements
  };
};
