
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { toast } from 'sonner';

export const useAgreementTable = (initialFilters?: any) => {
  const navigate = useNavigate();
  const {
    agreements,
    isLoading,
    error,
    deleteAgreements,
    pagination,
  } = useAgreements(initialFilters);
  
  const [selectedAgreements, setSelectedAgreements] = useState<string[]>([]);
  
  const handleBulkDelete = async (ids: string | string[]) => {
    const agreementIds = Array.isArray(ids) ? ids : [ids];
    
    try {
      await deleteAgreements(agreementIds);
      
      // Clear selected agreements after successful deletion
      setSelectedAgreements([]);
      
      toast.success(
        agreementIds.length > 1
          ? `${agreementIds.length} agreements deleted successfully`
          : 'Agreement deleted successfully'
      );
    } catch (error) {
      console.error('Error deleting agreements:', error);
      toast.error('Failed to delete agreements');
    }
  };
  
  const handleEditAgreement = (id: string) => {
    navigate(`/agreements/edit/${id}`);
  };
  
  const handleViewAgreement = (id: string) => {
    navigate(`/agreements/${id}`);
  };
  
  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedAgreements(prev => 
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };
  
  const selectAll = (agreementIds: string[]) => {
    setSelectedAgreements(agreementIds);
  };
  
  const clearSelection = () => {
    setSelectedAgreements([]);
  };
  
  return {
    agreements,
    isLoading,
    error,
    selectedAgreements,
    handleBulkDelete,
    handleEditAgreement,
    handleViewAgreement,
    toggleSelection,
    selectAll,
    clearSelection,
    pagination, // Expose pagination from useAgreements
  };
};
