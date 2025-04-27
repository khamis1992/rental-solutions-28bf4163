
import { useAgreementStore } from '@/store/useAgreementStore';
import { useErrorStore } from '@/store/useErrorStore';
import { useMemo } from 'react';

/**
 * Custom hook to provide centralized access to all Zustand stores
 * This makes it easier to access multiple stores at once and
 * keeps component imports cleaner
 */
export function useStore() {
  const {
    agreements,
    currentAgreement,
    isLoading: agreementsLoading,
    error: agreementsError,
    searchParams,
    setSearchParams,
    fetchAgreements,
    getAgreement,
    deleteAgreement,
    updateAgreement
  } = useAgreementStore();

  const {
    errors,
    lastError,
    addError,
    markErrorAsHandled,
    clearErrors
  } = useErrorStore();

  const agreementStore = useMemo(() => ({
    agreements,
    currentAgreement,
    isLoading: agreementsLoading,
    error: agreementsError,
    searchParams,
    setSearchParams,
    fetchAgreements,
    getAgreement,
    deleteAgreement,
    updateAgreement
  }), [
    agreements,
    currentAgreement,
    agreementsLoading,
    agreementsError,
    searchParams,
    setSearchParams,
    fetchAgreements,
    getAgreement,
    deleteAgreement,
    updateAgreement
  ]);

  const errorStore = useMemo(() => ({
    errors,
    lastError,
    addError,
    markErrorAsHandled,
    clearErrors
  }), [errors, lastError, addError, markErrorAsHandled, clearErrors]);

  return {
    agreement: agreementStore,
    error: errorStore
  };
}
