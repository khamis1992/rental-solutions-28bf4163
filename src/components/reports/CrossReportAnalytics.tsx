
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { useFinancials } from '@/hooks/use-financials';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

import InteractiveChart from './charts/InteractiveChart';

const CrossReportAnalytics = () => {
  const { allVehicles: vehicles, isLoading: isLoadingVehicles } = useVehicles();
  const { agreements, isLoading: isLoadingAgreements } = useAgreements();
  const { getAllRecords: getAllMaintenance, loading: isLoadingMaintenance } = useMaintenance();
  const { transactions, isLoadingTransactions: isLoadingFinancials } = useFinancials();
  
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllMaintenance();
        setMaintenanceData(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };
    
    fetchData();
  }, [getAllMaintenance]);
  
  useEffect(() => {
    setIsLoading(
      isLoadingVehicles || 
      isLoadingAgreements || 
      isLoadingMaintenance || 
      isLoadingFinancials
    );
  }, [isLoadingVehicles, isLoadingAgreements, isLoadingMaintenance, isLoadingFinancials]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-64" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load cross-report analytics data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Ensure vehicles is an array
  const vehiclesList = Array.isArray(vehicles) ? vehicles : [];
  
  const vehicleUtilizationData = vehiclesList.map(vehicle => {
    const vehicleAgreements = agreements.filter(a => a.vehicle_id === vehicle.id);
    const totalRentDays = vehicleAgreements.reduce((sum, agreement) => {
      const startDate = new Date(agreement.start_date);
      const endDate = agreement.end_date ? new Date(agreement.end_date) : new Date();
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    const maintenanceCosts = maintenanceData
      .filter(record => record.vehicle_id === vehicle.id)
      .reduce((sum, record) => sum + (record.cost || 0), 0);
    
    const revenue = vehicleAgreements.reduce((sum, agreement) => 
      sum + (agreement.total_amount || 0), 0);
    
    return {
      id: vehicle.id,
      name: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      totalRentDays,
      maintenanceCosts,
      revenue,
      profit: revenue - maintenanceCosts,
      utilization: totalRentDays > 0 ? (totalRentDays / 365 * 100).toFixed(2) : 0,
      agreementCount: vehicleAgreements.length,
      maintenanceCount: maintenanceData.filter(record => record.vehicle_id === vehicle.id).length,
      vehicleType: vehicle.vehicle_type || 'Unknown',
      status: vehicle.status
    };
  });
  
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      monthKey: `${date.getFullYear()}-${date.getMonth() + 1}`,
      revenue: 0,
      maintenanceCosts: 0,
      profit: 0,
      agreementCount: 0,
      maintenanceCount: 0
    };
  }).reverse();
  
  agreements.forEach(agreement => {
    const startDate = new Date(agreement.start_date);
    const monthKey = `${startDate.getFullYear()}-${startDate.getMonth() + 1}`;
    const monthData = last12Months.find(m => m.monthKey === monthKey);
    if (monthData) {
      monthData.revenue += agreement.total_amount || 0;
      monthData.agreementCount += 1;
      monthData.profit = monthData.revenue - monthData.maintenanceCosts;
    }
  });
  
  maintenanceData.forEach(record => {
    if (!record.completed_date) return;
    
    const completionDate = new Date(record.completed_date);
    const monthKey = `${completionDate.getFullYear()}-${completionDate.getMonth() + 1}`;
    const monthData = last12Months.find(m => m.monthKey === monthKey);
    if (monthData) {
      monthData.maintenanceCosts += record.cost || 0;
      monthData.maintenanceCount += 1;
      monthData.profit = monthData.revenue - monthData.maintenanceCosts;
    }
  });
  
  const vehicleTypeData = Object.entries(
    vehicleUtilizationData.reduce((acc, vehicle) => {
      const type = vehicle.vehicleType;
      if (!acc[type]) {
        acc[type] = {
          vehicleType: type,
          count: 0,
          totalRevenue: 0,
          totalMaintenance: 0,
          totalProfit: 0,
          averageUtilization: 0
        };
      }
      
      acc[type].count += 1;
      acc[type].totalRevenue += vehicle.revenue;
      acc[type].totalMaintenance += vehicle.maintenanceCosts;
      acc[type].totalProfit += vehicle.profit;
      acc[type].averageUtilization += parseFloat(vehicle.utilization as string);
      
      return acc;
    }, {} as Record<string, any>)
  ).map(([_, data]) => ({
    ...data,
    averageUtilization: (data as any).averageUtilization / (data as any).count
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-Domain Analytics</CardTitle>
        <CardDescription>
          Analyze relationships between different aspects of your rental business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vehicle-performance">
          <TabsList className="mb-4">
            <TabsTrigger value="vehicle-performance">Vehicle Performance</TabsTrigger>
            <TabsTrigger value="financial-trends">Financial Trends</TabsTrigger>
            <TabsTrigger value="vehicle-types">Vehicle Type Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vehicle-performance">
            <InteractiveChart
              title="Vehicle Performance Analysis"
              description="Compare revenue, maintenance costs, and utilization across vehicles"
              data={vehicleUtilizationData}
              defaultChartType="bar"
              allowedChartTypes={['bar', 'line']}
              xAxisKey="name"
              series={[
                { key: 'revenue', name: 'Revenue', color: '#22c55e' },
                { key: 'maintenanceCosts', name: 'Maintenance Costs', color: '#ef4444' },
                { key: 'profit', name: 'Profit', color: '#3b82f6' },
              ]}
              formatters={{
                revenue: formatCurrency,
                maintenanceCosts: formatCurrency,
                profit: formatCurrency
              }}
              showDataTable={true}
              filters={[
                {
                  key: 'status',
                  name: 'Vehicle Status',
                  options: [
                    { label: 'Available', value: 'available' },
                    { label: 'Rented', value: 'rented' },
                    { label: 'Maintenance', value: 'maintenance' },
                    { label: 'Out of Service', value: 'out_of_service' }
                  ]
                },
                {
                  key: 'vehicleType',
                  name: 'Vehicle Type',
                  options: [
                    ...new Set(vehicleUtilizationData.map(v => v.vehicleType))
                  ].filter(Boolean).map(type => ({ label: String(type), value: String(type) }))
                }
              ]}
            />
          </TabsContent>
          
          <TabsContent value="financial-trends">
            <InteractiveChart
              title="Revenue vs. Maintenance Costs"
              description="Monthly comparison of revenue and maintenance costs"
              data={last12Months}
              defaultChartType="line"
              allowedChartTypes={['bar', 'line', 'area']}
              xAxisKey="month"
              series={[
                { key: 'revenue', name: 'Revenue', color: '#22c55e' },
                { key: 'maintenanceCosts', name: 'Maintenance Costs', color: '#ef4444' },
                { key: 'profit', name: 'Profit', color: '#3b82f6' },
              ]}
              formatters={{
                revenue: formatCurrency,
                maintenanceCosts: formatCurrency,
                profit: formatCurrency
              }}
              showDataTable={true}
            />
          </TabsContent>
          
          <TabsContent value="vehicle-types">
            <InteractiveChart
              title="Vehicle Type Performance"
              description="Compare performance metrics across different vehicle types"
              data={vehicleTypeData}
              defaultChartType="bar"
              allowedChartTypes={['bar', 'pie']}
              xAxisKey="vehicleType"
              series={[
                { key: 'totalRevenue', name: 'Total Revenue', color: '#22c55e' },
                { key: 'totalMaintenance', name: 'Total Maintenance', color: '#ef4444' },
                { key: 'totalProfit', name: 'Total Profit', color: '#3b82f6' },
                { key: 'averageUtilization', name: 'Avg. Utilization %', color: '#f59e0b' }
              ]}
              formatters={{
                totalRevenue: formatCurrency,
                totalMaintenance: formatCurrency,
                totalProfit: formatCurrency,
                averageUtilization: (value) => `${value.toFixed(2)}%`
              }}
              showDataTable={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CrossReportAnalytics;
