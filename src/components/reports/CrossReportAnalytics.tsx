// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
  // Fetch vehicles directly using React Query
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { agreements, isLoading: isLoadingAgreements } = useAgreements();
  
  // Fetch maintenance data
  const { data: maintenanceData = [], isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch financial transactions
  const { data: transactions = [], isLoading: isLoadingFinancials } = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });
  
  const [error, setError] = useState<Error | null>(null);
  
  const isLoading = isLoadingVehicles || isLoadingAgreements || isLoadingMaintenance || isLoadingFinancials;
  
  if (isLoading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="text-right">
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
      <Alert variant="destructive" dir="rtl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-right">
          فشل في تحميل بيانات التحليلات متعددة المجالات. يرجى المحاولة مرة أخرى لاحقاً.
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
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="text-right">التحليلات متعددة المجالات</CardTitle>
        <CardDescription className="text-right">
          تحليل العلاقات بين الجوانب المختلفة لأعمال التأجير الخاصة بك
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vehicle-performance" dir="rtl">
          <TabsList className="mb-4">
            <TabsTrigger value="vehicle-performance">أداء المركبات</TabsTrigger>
            <TabsTrigger value="financial-trends">الاتجاهات المالية</TabsTrigger>
            <TabsTrigger value="vehicle-types">تحليل أنواع المركبات</TabsTrigger>
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
