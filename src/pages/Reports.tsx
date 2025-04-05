
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVehicles } from '@/hooks/use-vehicles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { usePayments } from '@/hooks/use-payments';
import { useAgreements } from '@/hooks/use-agreements';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

import FinancialReport from '@/components/reports/FinancialReport';
import VehicleReport from '@/components/reports/VehicleReport';
import CustomerReport from '@/components/reports/CustomerReport';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  agreement_id?: string;
  lease_id?: string;
}

const Reports = () => {
  const [activeTab, setActiveTab] = useState('financial');
  const { useList } = useVehicles();
  const { data: vehicleList = [], isLoading: isVehiclesLoading } = useList();
  const { agreements, isLoading: isAgreementsLoading } = useAgreements();
  const { payments, isLoadingPayments } = usePayments();

  // Create helper methods for payments
  const getPaymentsForAgreement = (agreementId: string): Payment[] => {
    return payments.filter(p => p.lease_id === agreementId || p.agreement_id === agreementId);
  };
  
  const getTotalBalanceForAgreement = (agreementId: string): number => {
    const agreementPayments = getPaymentsForAgreement(agreementId);
    return agreementPayments.reduce((total, payment) => total + payment.amount, 0);
  };

  // Overall revenue stats
  const totalRevenue = agreements.reduce((acc, agreement) => {
    return acc + (agreement.total_amount || 0);
  }, 0);

  const totalVehicles = vehicleList.length;
  
  const generateCSV = () => {
    const headers = ['ID', 'Customer', 'Vehicle', 'Start Date', 'End Date', 'Amount'];
    let csvContent = headers.join(',') + '\n';
    
    agreements.forEach(agreement => {
      const row = [
        agreement.id,
        agreement.customer?.full_name || 'Unknown',
        agreement.vehicle?.make + ' ' + agreement.vehicle?.model || 'Unknown',
        new Date(agreement.start_date).toLocaleDateString(),
        new Date(agreement.end_date).toLocaleDateString(),
        agreement.total_amount
      ];
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'agreements_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer
      title="Reports"
      description="View and generate reports about your business"
      actions={
        <Button onClick={generateCSV} variant="outline" disabled={isAgreementsLoading}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      }
    >
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="financial" className="mt-6">
          {isAgreementsLoading || isLoadingPayments ? (
            <Skeleton className="h-[600px] w-full" />
          ) : (
            <FinancialReport />
          )}
        </TabsContent>
        
        <TabsContent value="vehicles" className="mt-6">
          {isVehiclesLoading ? (
            <Skeleton className="h-[600px] w-full" />
          ) : (
            <VehicleReport />
          )}
        </TabsContent>
        
        <TabsContent value="customers" className="mt-6">
          <CustomerReport />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Reports;
