
import { useState } from 'react';
import { useAgreements } from './use-agreements';

export function useAgreementTable() {
  const [selectedAgreements, setSelectedAgreements] = useState<string[]>([]);
  
  const {
    agreements,
    isLoading,
    error,
    deleteAgreements,
    pagination,
    setFilters,
    setSearchParams
  } = useAgreements();

  const handleSelectAgreement = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAgreements(prev => [...prev, id]);
    } else {
      setSelectedAgreements(prev => prev.filter(agreementId => agreementId !== id));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected && agreements) {
      const allIds = agreements.map(agreement => agreement.id);
      setSelectedAgreements(allIds);
    } else {
      setSelectedAgreements([]);
    }
  };

  const handleBulkDelete = async (id?: string) => {
    try {
      const ids = id ? [id] : selectedAgreements;
      if (ids.length > 0) {
        await deleteAgreements(ids);
        setSelectedAgreements([]);
      }
    } catch (error) {
      console.error('Failed to delete agreements:', error);
    }
  };

  return {
    agreements,
    isLoading,
    error,
    selectedAgreements,
    handleSelectAgreement,
    handleSelectAll,
    handleBulkDelete,
    pagination,
    setFilters,
    setSearchParams
  };
}
