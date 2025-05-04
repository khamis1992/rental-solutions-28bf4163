
import { useState, useEffect } from 'react';
import { useAgreements } from './use-agreements';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { SortingState } from '@tanstack/react-table';
import { LeaseStatus } from '@/types/database-common';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useAgreementTable = () => {
  const {
    agreements,
    isLoading,
    error,
    deleteAgreements,
    setSearchParams,
    searchParams
  } = useAgreements();

  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalItems, setTotalItems] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState<{
    total: number;
    active: number;
    pending: number;
    expired: number;
    cancelled: number;
  }>({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
    cancelled: 0
  });

  // Get total count of agreements
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const { count } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true });
          
        setTotalItems(count || 0);
      } catch (error) {
        console.error('Error fetching total count:', error);
      }
    };

    const fetchStatusCounts = async () => {
      try {
        // Get active agreements count
        const { count: activeCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get pending agreements count (combine pending_payment, pending_deposit, pending)
        const { count: pendingCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .or('status.eq.pending_payment,status.eq.pending_deposit,status.eq.pending');

        // Get expired agreements count
        const { count: expiredCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .or('status.eq.expired,status.eq.archived');

        // Get cancelled agreements count
        const { count: cancelledCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .or('status.eq.cancelled,status.eq.terminated');

        setStatusCounts({
          total: totalItems,
          active: activeCount || 0,
          pending: pendingCount || 0,
          expired: expiredCount || 0,
          cancelled: cancelledCount || 0
        });
      } catch (error) {
        console.error('Error fetching status counts:', error);
      }
    };
    
    fetchTotalCount();
    if (totalItems > 0) {
      fetchStatusCounts();
    }
  }, [totalItems]);

  const handleBulkDelete = async (id: string) => {
    if (!id) return;
    
    try {
      await deleteAgreements([id]);
      toast.success('Agreement deleted successfully');
      
      // Refresh counts
      setTotalItems(prevTotal => Math.max(0, prevTotal - 1));
    } catch (error) {
      console.error('Error deleting agreement:', error);
      toast.error('Failed to delete agreement');
    }
  };

  const formatAgreementForDisplay = (agreement: any) => {
    const {
      customer_name,
      customers,
      start_date,
      end_date,
      vehicles,
      rent_amount = 0
    } = agreement;

    const formattedCustomerName = customers?.full_name || customer_name || 'N/A';
    
    let formattedVehicle = 'N/A';
    if (vehicles) {
      if (vehicles.make && vehicles.model) {
        formattedVehicle = `${vehicles.make} ${vehicles.model}`;
        if (vehicles.license_plate) {
          formattedVehicle += ` (${vehicles.license_plate})`;
        }
      } else if (vehicles.license_plate) {
        formattedVehicle = vehicles.license_plate;
      }
    }

    let rentalPeriod = 'Not specified';
    if (start_date && end_date) {
      rentalPeriod = `${format(new Date(start_date), 'MMM d, yyyy')} - ${format(new Date(end_date), 'MMM d, yyyy')}`;
    }

    const formattedRent = formatCurrency(rent_amount);

    return {
      ...agreement,
      formattedCustomerName,
      formattedVehicle,
      rentalPeriod,
      formattedRent
    };
  };

  const displayableAgreements = agreements.map(formatAgreementForDisplay);

  // Filter agreements based on the global filter
  const filteredAgreements = displayableAgreements.filter(agreement => {
    if (!globalFilter) return true;
    
    const searchTerms = globalFilter.toLowerCase().split(' ');
    
    return searchTerms.every(term => 
      agreement.agreement_number?.toLowerCase().includes(term) ||
      agreement.formattedCustomerName?.toLowerCase().includes(term) ||
      agreement.formattedVehicle?.toLowerCase().includes(term) ||
      agreement.status?.toLowerCase().includes(term)
    );
  });

  // Apply pagination
  const paginatedAgreements = filteredAgreements.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize
  );

  return {
    agreements: paginatedAgreements,
    isLoading,
    error,
    rowSelection,
    setRowSelection,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    handleBulkDelete,
    pagination,
    setPagination,
    totalItems,
    statusCounts
  };
};
