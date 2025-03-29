
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UtilizationData {
  date: string;
  utilization: number;
}

interface RevenueData {
  date: string;
  actual: number;
  forecast: number;
}

interface VehiclePerformance {
  name: string;
  value: number;
  color: string;
}

interface RentalMetrics {
  utilizationData: UtilizationData[];
  revenueData: RevenueData[];
  customerMetrics: any[];
  vehiclePerformance: VehiclePerformance[];
  maintenanceCosts: any[];
}

export const useRentalMetrics = () => {
  const [metrics, setMetrics] = useState<RentalMetrics>({
    utilizationData: [],
    revenueData: [],
    customerMetrics: [],
    vehiclePerformance: [],
    maintenanceCosts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch utilization metrics - using type assertion to avoid type errors
        const { data: utilization, error: utilizationError } = await supabase
          .from('leases' as any)
          .select('start_date, end_date, vehicle_id')
          .order('start_date', { ascending: true });

        if (utilizationError) throw utilizationError;

        // Fetch revenue data - using type assertion to avoid type errors
        const { data: revenue, error: revenueError } = await supabase
          .from('unified_payments' as any)
          .select('amount, created_at')
          .order('created_at', { ascending: true });

        if (revenueError) throw revenueError;

        // Fetch vehicle performance - using type assertion to avoid type errors
        const { data: performance, error: performanceError } = await supabase
          .from('vehicles' as any)
          .select('status, maintenance_history');

        if (performanceError) throw performanceError;

        // Process and transform the data
        const processedMetrics = {
          utilizationData: processUtilizationData(utilization),
          revenueData: processRevenueData(revenue),
          customerMetrics: [], // Process customer behavior data
          vehiclePerformance: processVehiclePerformance(performance),
          maintenanceCosts: [] // Process maintenance cost data
        };

        setMetrics(processedMetrics);
      } catch (error) {
        console.error('Error fetching rental metrics:', error);
        setError('Failed to fetch rental metrics data');
        toast.error('Failed to load rental metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, isLoading, error };
};

// Helper functions to process data
function processUtilizationData(data: any[] | null): UtilizationData[] {
  // Transform utilization data for visualization
  return data?.map(item => ({
    date: new Date(item.start_date).toLocaleDateString(),
    utilization: calculateUtilization(item)
  })) || [];
}

function processRevenueData(data: any[] | null): RevenueData[] {
  // Transform revenue data and add forecasting
  return data?.map(item => ({
    date: new Date(item.created_at).toLocaleDateString(),
    actual: item.amount,
    forecast: calculateForecast(item)
  })) || [];
}

function processVehiclePerformance(data: any[] | null): VehiclePerformance[] {
  // Transform vehicle performance data
  return data?.map(item => ({
    name: item.status,
    value: calculatePerformanceMetric(item),
    color: getStatusColor(item.status)
  })) || [];
}

// Additional helper functions
function calculateUtilization(item: any): number {
  // Calculate utilization percentage
  return Math.random() * 100; // Replace with actual calculation
}

function calculateForecast(item: any): number {
  // Implement forecasting logic
  return item.amount * 1.1; // Simple example
}

function calculatePerformanceMetric(item: any): number {
  // Calculate performance metric
  return Math.random() * 100; // Replace with actual calculation
}

function getStatusColor(status: string): string {
  const colors = {
    active: '#22c55e',
    maintenance: '#f59e0b',
    inactive: '#ef4444'
  };
  return colors[status as keyof typeof colors] || '#cbd5e1';
}
