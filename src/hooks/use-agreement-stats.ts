
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hasData } from '@/utils/database-type-helpers';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';

export interface AgreementStats {
  totalAgreements: number;
  activeAgreements: number;
  totalRevenue: number;
  averageMonthlyRevenue: number;
  statusCounts: Record<string, number>;
}

export function useAgreementStats() {
  const fetchAgreementStats = async (): Promise<AgreementStats> => {
    try {
      // Fetch total agreements count
      const { count: totalAgreements, error: countError } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Error fetching total agreements: ${countError.message}`);
      }

      // Fetch active agreements count
      const { count: activeAgreements, error: activeError } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeError) {
        throw new Error(`Error fetching active agreements: ${activeError.message}`);
      }

      // Fetch revenue data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('amount_paid')
        .eq('status', 'paid');

      if (paymentsError) {
        throw new Error(`Error fetching payments data: ${paymentsError.message}`);
      }

      // Calculate total revenue
      const totalRevenue = paymentsData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);

      // Get current month's revenue
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const { data: monthlyPayments, error: monthlyError } = await supabase
        .from('unified_payments')
        .select('amount_paid')
        .eq('status', 'paid')
        .gte('payment_date', firstDay.toISOString())
        .lte('payment_date', lastDay.toISOString());

      if (monthlyError) {
        throw new Error(`Error fetching monthly payments data: ${monthlyError.message}`);
      }

      const currentMonthRevenue = monthlyPayments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);

      // Get counts by status
      const { data: statusData, error: statusError } = await supabase
        .from('leases')
        .select('status');

      if (statusError) {
        throw new Error(`Error fetching status data: ${statusError.message}`);
      }

      // Calculate status counts
      const statusCounts: Record<string, number> = {};
      statusData.forEach(item => {
        const status = item.status as string;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      return {
        totalAgreements: totalAgreements || 0,
        activeAgreements: activeAgreements || 0,
        totalRevenue,
        averageMonthlyRevenue: currentMonthRevenue,
        statusCounts,
      };
    } catch (error) {
      console.error('Error fetching agreement stats:', error);
      toast.error('Failed to load agreement statistics');
      return {
        totalAgreements: 0,
        activeAgreements: 0,
        totalRevenue: 0,
        averageMonthlyRevenue: 0,
        statusCounts: {},
      };
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['agreementStats'],
    queryFn: fetchAgreementStats,
    staleTime: 300000, // 5 minutes
  });

  return {
    stats: data || {
      totalAgreements: 0,
      activeAgreements: 0,
      totalRevenue: 0,
      averageMonthlyRevenue: 0,
      statusCounts: {},
    },
    isLoading,
    error,
  };
}
