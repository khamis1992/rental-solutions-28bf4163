import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Payment } from '@/types/payment.types';
import { toast } from 'sonner';

interface PaymentWithDetails extends Payment {
  customer_name?: string;
  customer_phone?: string;
  agreement_id?: string;
  agreement_number?: string;
  vehicle_info?: string;
}

interface PaymentFilters {
  status?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

export const useAllPayments = (filters?: PaymentFilters) => {
  const queryClient = useQueryClient();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);

  // Create a stable key for the query that changes when filters change
  const queryKey = useMemo(() => [
    'all-payments', 
    filters?.status || 'all',
    filters?.searchQuery || '',
    filters?.startDate || '',
    filters?.endDate || ''
  ], [filters?.status, filters?.searchQuery, filters?.startDate, filters?.endDate]);

  const { data, isLoading, error, refetch } = useQuery<PaymentWithDetails[]>({
    queryKey,
    queryFn: async () => {
      console.log('🔍 Fetching payments with filters:', filters);
      
      // First, get payments data
      let paymentsQuery = supabase
        .from('unified_payments')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter at database level
      if (filters?.status && filters.status !== 'all') {
        console.log('📊 Applying status filter:', filters.status);
        paymentsQuery = paymentsQuery.eq('status', filters.status);
      }

      // Apply date range filter
      if (filters?.startDate) {
        paymentsQuery = paymentsQuery.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        paymentsQuery = paymentsQuery.lte('created_at', filters.endDate);
      }

      const { data: paymentsData, error: paymentsError } = await paymentsQuery;

      if (paymentsError) {
        console.error('❌ Error fetching payments:', paymentsError);
        throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
      }

      if (!paymentsData || paymentsData.length === 0) {
        console.log('📭 No payments found for current filters');
        return [];
      }

      console.log(`💰 Found ${paymentsData.length} payments`);

      // Get unique lease IDs to fetch related data
      const leaseIds = [...new Set(paymentsData.map(p => p.lease_id).filter(Boolean))];
      
      let leaseData: any[] = [];
      if (leaseIds.length > 0) {
        console.log(`🔗 Fetching ${leaseIds.length} related leases`);
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select('id, agreement_number, customer_id, vehicle_id')
          .in('id', leaseIds);

        if (leasesError) {
          console.warn('⚠️ Error fetching leases:', leasesError);
        } else {
          leaseData = leases || [];
          console.log(`✅ Fetched ${leaseData.length} leases`);
        }
      }

      // Get customer data
      const customerIds = [...new Set(leaseData.map(l => l.customer_id).filter(Boolean))];
      let customerData: any[] = [];
      if (customerIds.length > 0) {
        console.log(`👥 Fetching ${customerIds.length} customers`);
        const { data: customers, error: customersError } = await supabase
          .from('profiles')
          .select('id, full_name, phone_number')
          .in('id', customerIds);

        if (customersError) {
          console.warn('⚠️ Error fetching customers:', customersError);
        } else {
          customerData = customers || [];
          console.log(`✅ Fetched ${customerData.length} customers`);
        }
      }

      // Get vehicle data
      const vehicleIds = [...new Set(leaseData.map(l => l.vehicle_id).filter(Boolean))];
      let vehicleData: any[] = [];
      if (vehicleIds.length > 0) {
        console.log(`🚗 Fetching ${vehicleIds.length} vehicles`);
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, make, model, year, license_plate')
          .in('id', vehicleIds);

        if (vehiclesError) {
          console.warn('⚠️ Error fetching vehicles:', vehiclesError);
        } else {
          vehicleData = vehicles || [];
          console.log(`✅ Fetched ${vehicleData.length} vehicles`);
        }
      }

      // Transform data to include customer and vehicle details
      const transformedData = paymentsData.map(payment => {
        const lease = leaseData.find(l => l.id === payment.lease_id);
        const customer = customerData.find(c => c.id === lease?.customer_id);
        const vehicle = vehicleData.find(v => v.id === lease?.vehicle_id);

        return {
          ...payment,
          customer_name: customer?.full_name || 'غير محدد',
          customer_phone: customer?.phone_number || '',
          agreement_id: lease?.id || '',
          agreement_number: lease?.agreement_number || 'غير محدد',
          vehicle_info: vehicle 
            ? `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.year || ''} - ${vehicle.license_plate || ''}`.trim()
            : 'غير محدد'
        };
      });

      // Apply search filter on client side
      let filteredData = transformedData;
      if (filters?.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        console.log('🔍 Applying search filter:', query);
        
        filteredData = transformedData.filter(payment => 
          payment.customer_name?.toLowerCase().includes(query) ||
          payment.agreement_number?.toLowerCase().includes(query) ||
          payment.customer_phone?.includes(query) ||
          payment.vehicle_info?.toLowerCase().includes(query) ||
          payment.description?.toLowerCase().includes(query)
        );
        
        console.log(`📝 Search filtered to ${filteredData.length} results`);
      }

      console.log('✅ Final result:', filteredData.length, 'payments');
      return filteredData;
    },
    staleTime: 10 * // 1000 - removed unused variable// 10 seconds - shorter for better responsiveness
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  useEffect(() => {
    if (data) {
      setPayments(data);
    }
  }, [data]);

  const recordPayment = useCallback(async (paymentData: Partial<Payment>) => {
    const { data, error } = await supabase
      .from('unified_payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) {
      console.error('Error recording payment:', error);
      throw new Error(`Failed to record payment: ${error.message}`);
    }

    return data;
  }, []);

  const updatePayment = useCallback(async ({ id, data: updateData }: { id: string; data: Partial<Payment> }) => {
    const { data, error } = await supabase
      .from('unified_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      throw new Error(`Failed to update payment: ${error.message}`);
    }

    return data;
  }, []);

  const deletePayment = useCallback(async (paymentId: string) => {
    const { error } = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('Error deleting payment:', error);
      throw new Error(`Failed to delete payment: ${error.message}`);
    }
  }, []);

  const recordPaymentMutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      toast.success('تم تسجيل الدفعة بنجاح');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تسجيل الدفعة';
      toast.error(errorMessage);
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: updatePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      toast.success('تم تحديث الدفعة بنجاح');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديث الدفعة';
      toast.error(errorMessage);
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      toast.success('تم حذف الدفعة بنجاح');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'فشل في حذف الدفعة';
      toast.error(errorMessage);
    }
  });

  // Calculate statistics
  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
    totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  return {
    payments,
    isLoading,
    error,
    stats,
    refetch,
    recordPayment: recordPaymentMutation.mutateAsync,
    updatePayment: updatePaymentMutation.mutateAsync,
    deletePayment: deletePaymentMutation.mutateAsync,
    isPending: {
      record: recordPaymentMutation.isPending,
      update: updatePaymentMutation.isPending,
      delete: deletePaymentMutation.isPending
    }
  };
}; 