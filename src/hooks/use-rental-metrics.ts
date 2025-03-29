
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRentalMetrics = () => {
  const [metrics, setMetrics] = useState({
    utilizationData: [],
    revenueData: [],
    customerMetrics: [],
    vehiclePerformance: [],
    maintenanceCosts: []
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      // Fetch utilization metrics
      const { data: utilization } = await supabase
        .from('leases')
        .select('start_date, end_date, vehicle_id')
        .order('start_date', { ascending: true });

      // Fetch revenue data
      const { data: revenue } = await supabase
        .from('unified_payments')
        .select('amount, created_at')
        .order('created_at', { ascending: true });

      // Fetch vehicle performance
      const { data: performance } = await supabase
        .from('vehicles')
        .select('status, maintenance_history');

      // Process and transform the data
      const processedMetrics = {
        utilizationData: processUtilizationData(utilization),
        revenueData: processRevenueData(revenue),
        customerMetrics: [], // Process customer behavior data
        vehiclePerformance: processVehiclePerformance(performance),
        maintenanceCosts: [] // Process maintenance cost data
      };

      setMetrics(processedMetrics);
    };

    fetchMetrics();
  }, []);

  return metrics;
};

// Helper functions to process data
function processUtilizationData(data) {
  // Transform utilization data for visualization
  return data?.map(item => ({
    date: new Date(item.start_date).toLocaleDateString(),
    utilization: calculateUtilization(item)
  })) || [];
}

function processRevenueData(data) {
  // Transform revenue data and add forecasting
  return data?.map(item => ({
    date: new Date(item.created_at).toLocaleDateString(),
    actual: item.amount,
    forecast: calculateForecast(item)
  })) || [];
}

function processVehiclePerformance(data) {
  // Transform vehicle performance data
  return data?.map(item => ({
    name: item.status,
    value: calculatePerformanceMetric(item),
    color: getStatusColor(item.status)
  })) || [];
}

// Additional helper functions
function calculateUtilization(item) {
  // Calculate utilization percentage
  return Math.random() * 100; // Replace with actual calculation
}

function calculateForecast(item) {
  // Implement forecasting logic
  return item.amount * 1.1; // Simple example
}

function calculatePerformanceMetric(item) {
  // Calculate performance metric
  return Math.random() * 100; // Replace with actual calculation
}

function getStatusColor(status) {
  const colors = {
    active: '#22c55e',
    maintenance: '#f59e0b',
    inactive: '#ef4444'
  };
  return colors[status] || '#cbd5e1';
}
