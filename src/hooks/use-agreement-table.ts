
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgreementService } from './services/useAgreementService';
import { SortingState } from '@tanstack/react-table';
import { toast } from 'sonner';

export function useAgreementTable() {
  const queryClient = useQueryClient();
  const {
    agreements,
    isLoading,
    error,
    updateAgreement: updateAgreementService,
    deleteAgreements,
    searchParams,
    setSearchParams,
  } = useAgreementService();

  // Table states
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Update agreement
  const updateAgreement = async (id: string, data: Record<string, any>) => {
    try {
      await updateAgreementService({ id, data });
      toast.success('Agreement updated successfully');
      return true;
    } catch (err: any) {
      toast.error(`Failed to update agreement: ${err.message || 'Unknown error'}`);
      return false;
    }
  };

  const handleBulkDelete = async () => {
    if (Object.keys(rowSelection).length === 0) return;
    
    try {
      setIsDeleting(true);
      const selectedIds = Object.keys(rowSelection);
      await deleteAgreements(selectedIds);
      setRowSelection({});
      toast.success('Selected agreements deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    } catch (err: any) {
      toast.error(`Failed to delete agreements: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterChange = (filters: any) => {
    setSearchParams(prev => ({ ...prev, ...filters }));
  };

  return {
    agreements,
    isLoading,
    error,
    updateAgreement,
    pagination,
    setPagination,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    searchParams,
    handleFilterChange,
    rowSelection,
    setRowSelection,
    isDeleting,
    handleBulkDelete,
  };
}
