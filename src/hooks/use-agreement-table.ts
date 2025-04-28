
import { useState } from 'react';
import { useAgreementService } from './services/useAgreementService';
import type { Agreement, TableFilters } from '@/types/agreement';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { asTableId } from '@/lib/database';

export function useAgreementTable() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [isDeleting, setIsDeleting] = useState(false);

  const { agreements, isLoading, error, deleteAgreement, setSearchParams } = useAgreementService();
  
  const handleBulkDelete = async () => {
    if (!agreements) return;
    
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection).map(index => agreements[parseInt(index)].id);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const id of selectedIds) {
      try {
        // Delete related records first
        await Promise.all([
          supabase.from('overdue_payments').delete().eq('agreement_id', asTableId('overdue_payments', id)),
          supabase.from('unified_payments').delete().eq('lease_id', asTableId('unified_payments', id)),
          supabase.from('traffic_fines').delete().eq('agreement_id', asTableId('traffic_fines', id))
        ]);

        await deleteAgreement(id);
        successCount++;
      } catch (err) {
        console.error('Error deleting:', err);
        errorCount++;
      }
    }
    
    if (errorCount === 0) {
      toast.success(`Successfully deleted ${successCount} agreement${successCount !== 1 ? 's' : ''}`);
    } else if (successCount === 0) {
      toast.error(`Failed to delete any agreements`);
    } else {
      toast.warning(`Deleted ${successCount} agreement${successCount !== 1 ? 's' : ''}, but failed to delete ${errorCount}`);
    }
    
    setRowSelection({});
    setIsDeleting(false);
  };

  const handleFilterChange = (filters: TableFilters) => {
    setSearchParams(prev => ({ ...prev, ...filters }));
  };

  return {
    agreements,
    isLoading,
    error,
    rowSelection,
    setRowSelection,
    pagination,
    setPagination,
    isDeleting,
    handleBulkDelete,
    handleFilterChange,
  };
}
