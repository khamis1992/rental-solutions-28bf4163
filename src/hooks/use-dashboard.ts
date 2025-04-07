// Fix type errors related to property access

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const useDashboard = () => {
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);
  const thirtyDaysAgo = subMonths(today, 1);

  const { data: customerCount, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['dashboard', 'customer-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching customer count:', error);
        throw error;
      }

      return count || 0;
    }
  });

  const { data: vehicleCount, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['dashboard', 'vehicle-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching vehicle count:', error);
        throw error;
      }

      return count || 0;
    }
  });

  const { data: agreementCount, isLoading: isLoadingAgreementsCount } = useQuery({
    queryKey: ['dashboard', 'agreement-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching agreement count:', error);
        throw error;
      }

      return count || 0;
    }
  });

  const { data: monthlyRevenue, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['dashboard', 'monthly-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', format(firstDayOfMonth, 'yyyy-MM-dd'))
        .lte('payment_date', format(lastDayOfMonth, 'yyyy-MM-dd'));

      if (error) {
        console.error('Error fetching monthly revenue:', error);
        throw error;
      }

      const totalRevenue = data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      return totalRevenue;
    }
  });

  const { data: lastMonthRevenue, isLoading: isLoadingLastMonthRevenue } = useQuery({
    queryKey: ['dashboard', 'last-month-revenue'],
    queryFn: async () => {
      const lastMonthStart = subMonths(firstDayOfMonth, 1);
      const lastMonthEnd = subMonths(lastDayOfMonth, 1);

      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', format(lastMonthStart, 'yyyy-MM-dd'))
        .lte('payment_date', format(lastMonthEnd, 'yyyy-MM-dd'));

      if (error) {
        console.error('Error fetching last month revenue:', error);
        throw error;
      }

      const totalRevenue = data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      return totalRevenue;
    }
  });

  const { data: overduePayments, isLoading: isLoadingOverduePayments } = useQuery({
    queryKey: ['dashboard', 'overdue-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases_missing_payments')
        .select('*')
        .lte('due_date', format(today, 'yyyy-MM-dd'));

      if (error) {
        console.error('Error fetching overdue payments:', error);
        throw error;
      }

      return data?.length || 0;
    }
  });

  const { data: recentAgreements, isLoading: isLoadingAgreements } = useQuery({
    queryKey: ['dashboard', 'recent-agreements'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('leases')
          .select(`
            *,
            profiles:customer_id (
              id,
              full_name,
              email,
              phone_number
            ),
            vehicles:vehicle_id (
              id,
              make,
              model,
              license_plate,
              year
            )
          `)
          .order('created_at', { ascending: false })
          .limit(8);
        
        if (error) {
          console.error('Error fetching recent agreements:', error);
          throw error;
        }
        
        return data.map((agreement: any) => ({
          id: agreement.id,
          agreement_number: agreement.agreement_number,
          status: agreement.status,
          start_date: new Date(agreement.start_date),
          end_date: new Date(agreement.end_date),
          rent_amount: agreement.rent_amount,
          customer: agreement.profiles ? {
            id: agreement.profiles.id,
            name: agreement.profiles.full_name,
            email: agreement.profiles.email
          } : {
            id: "",
            name: "Unknown Customer",
            email: ""
          },
          vehicle: agreement.vehicles ? {
            id: agreement.vehicles.id,
            make: agreement.vehicles.make, 
            model: agreement.vehicles.model,
            license_plate: agreement.vehicles.license_plate
          } : {
            id: "",
            make: "Unknown",
            model: "Vehicle", 
            license_plate: "N/A"
          }
        }));
      } catch (error) {
        console.error('Error in recent agreements data:', error);
        return [];
      }
    }
  });

  const { data: recentPayments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['dashboard', 'recent-payments'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            leases (
              agreement_number,
              customer_id
            ),
            profiles (
              full_name
            ),
            vehicles (
              make,
              model,
              license_plate
            )
          `)
          .order('payment_date', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching recent payments:', error);
          throw error;
        }

        return data.map((payment: any) => ({
          id: payment.id,
          payment_date: new Date(payment.payment_date),
          amount: payment.amount,
          agreement_number: payment.leases?.agreement_number,
          customer_name: payment.profiles?.full_name,
          vehicle: payment.vehicles ? {
            id: payment.vehicles.id,
            make: payment.vehicles.make,
            model: payment.vehicles.model,
            license_plate: payment.vehicles.license_plate
          } : {
            id: "",
            make: "Unknown", 
            model: "Vehicle", 
            license_plate: "N/A"
          }
          
        }));
      } catch (error) {
        console.error('Error in recent payments data:', error);
        return [];
      }
    }
  });

  return {
    customerCount,
    vehicleCount,
    agreementCount,
    monthlyRevenue,
    lastMonthRevenue,
    overduePayments,
    recentAgreements,
    recentPayments,
    isLoadingCustomers,
    isLoadingVehicles,
    isLoadingAgreementsCount,
    isLoadingRevenue,
    isLoadingLastMonthRevenue,
    isLoadingOverduePayments,
    isLoadingAgreements,
    isLoadingPayments
  };
};
