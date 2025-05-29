
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVehicles } from '@/hooks/use-vehicles';
import { useFinancials } from '@/hooks/use-financials';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

import VehiclePerformanceChart from './charts/VehiclePerformanceChart';
import FinancialTrendsChart from './charts/FinancialTrendsChart';
import VehicleTypeChart from './charts/VehicleTypeChart';
import {
  processVehicleUtilizationData,
  processMonthlyTrendData,
  processVehicleTypeData
} from '@/utils/cross-report-data-processors';

const CrossReportAnalytics = () => {
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
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

  // Process data using utility functions - ensure we have valid arrays
  const vehiclesList = Array.isArray(vehicles) ? vehicles : [];
  const agreementsList = Array.isArray(agreements) ? agreements : [];
  const maintenanceList = Array.isArray(maintenanceData) ? maintenanceData : [];

  const vehicleUtilizationData = processVehicleUtilizationData(
    vehiclesList,
    agreementsList,
    maintenanceList
  );
  
  const monthlyTrendData = processMonthlyTrendData(
    agreementsList,
    maintenanceList
  );
  
  const vehicleTypeData = processVehicleTypeData(vehicleUtilizationData);
  
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
            <VehiclePerformanceChart data={vehicleUtilizationData} />
          </TabsContent>
          
          <TabsContent value="financial-trends">
            <FinancialTrendsChart data={monthlyTrendData} />
          </TabsContent>
          
          <TabsContent value="vehicle-types">
            <VehicleTypeChart data={vehicleTypeData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CrossReportAnalytics;
