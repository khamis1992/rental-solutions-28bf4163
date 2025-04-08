
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface RecentAgreement {
  id: string;
  agreement_number: string;
  customer_id: string;
  customer_name: string;
  vehicle_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_license_plate: string;
  rent_amount: number;
  status: string;
  created_at: string;
}

export interface RecentPayment {
  id: string;
  amount: number;
  payment_date: string;
  customer_name: string;
  status: string;
}

export function useDashboard() {
  const {
    data: customerCount,
    isLoading: isLoadingCustomers,
    error: customerError,
  } = useQuery({
    queryKey: ["customerCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "customer");

      if (error) throw error;
      return count;
    },
  });

  const {
    data: vehicleCount,
    isLoading: isLoadingVehicles,
    error: vehicleError,
  } = useQuery({
    queryKey: ["vehicleCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count;
    },
  });

  const {
    data: agreementCount,
    isLoading: isLoadingAgreementsCount,
    error: agreementError,
  } = useQuery({
    queryKey: ["agreementCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leases")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (error) throw error;
      return count;
    },
  });

  const {
    data: monthlyRevenue,
    isLoading: isLoadingRevenue,
    error: revenueError,
  } = useQuery({
    queryKey: ["monthlyRevenue"],
    queryFn: async () => {
      // Get current month's start and end dates
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("unified_payments")
        .select("amount")
        .gte("payment_date", firstDayOfMonth.toISOString())
        .lte("payment_date", lastDayOfMonth.toISOString())
        .eq("status", "completed");

      if (error) throw error;

      // Sum up the amounts
      const total = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      return total;
    },
  });

  const {
    data: overduePayments,
    isLoading: isLoadingOverduePayments,
    error: overdueError,
  } = useQuery({
    queryKey: ["overduePayments"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("unified_payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .lt("due_date", new Date().toISOString());

      if (error) throw error;
      return count;
    },
  });

  const {
    data: recentAgreements,
    isLoading: isLoadingAgreements,
    error: recentAgreementsError,
  } = useQuery({
    queryKey: ["recentAgreements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          id,
          agreement_number,
          customer_id,
          vehicle_id,
          status,
          rent_amount,
          created_at,
          profiles (
            full_name
          ),
          vehicles (
            make,
            model,
            license_plate
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map(agreement => {
        // Handle potentially missing joined data
        const customer = agreement.profiles || {};
        const vehicle = agreement.vehicles || {};

        return {
          id: agreement.id,
          agreement_number: agreement.agreement_number,
          customer_id: agreement.customer_id,
          customer_name: customer.full_name || 'Unknown Customer',
          vehicle_id: agreement.vehicle_id,
          vehicle_make: vehicle.make || 'Unknown',
          vehicle_model: vehicle.model || 'Vehicle',
          vehicle_license_plate: vehicle.license_plate || 'No Plate',
          rent_amount: agreement.rent_amount,
          status: agreement.status,
          created_at: agreement.created_at
        };
      });
    },
  });

  const {
    data: recentPayments,
    isLoading: isLoadingPayments,
    error: recentPaymentsError,
  } = useQuery({
    queryKey: ["recentPayments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unified_payments")
        .select(`
          id,
          amount,
          payment_date,
          status,
          lease_id,
          leases (
            profiles (
              full_name
            )
          )
        `)
        .order("payment_date", { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map(payment => {
        // Handle potentially missing joined data
        const customer = payment.leases?.profiles || {};

        return {
          id: payment.id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          status: payment.status,
          customer_name: customer.full_name || 'Unknown Customer'
        };
      });
    },
  });

  return {
    customerCount,
    vehicleCount,
    agreementCount,
    monthlyRevenue,
    overduePayments,
    recentAgreements,
    recentPayments,
    isLoadingCustomers,
    isLoadingVehicles,
    isLoadingAgreementsCount,
    isLoadingRevenue,
    isLoadingOverduePayments,
    isLoadingAgreements,
    isLoadingPayments,
    // Re-export components for direct import from Dashboard.tsx
    DashboardStats: require('@/components/dashboard/DashboardStats').DashboardStats,
    RecentActivity: require('@/components/dashboard/RecentActivity').RecentActivity,
  };
}
