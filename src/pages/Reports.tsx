
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportGenerator from '@/components/ReportGenerator';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/TranslationContext';

const Reports = () => {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('fleet');

  // Common function to handle date filtering
  const filterByDateRange = (query: any, dateRange: DateRange | undefined) => {
    if (dateRange?.from) {
      query = query.gte('created_at', dateRange.from.toISOString());
    }
    if (dateRange?.to) {
      query = query.lte('created_at', dateRange.to.toISOString());
    }
    return query;
  };

  // Fleet report data
  const fetchFleetData = async (reportType: string, dateRange: DateRange | undefined) => {
    try {
      let query = supabase.from('vehicles').select('*');
      
      // Apply date range filtering if provided
      if (dateRange) {
        query = filterByDateRange(query, dateRange);
      }
      
      // Apply specific report type filtering
      if (reportType === 'available') {
        query = query.eq('status', 'available');
      } else if (reportType === 'rented') {
        query = query.eq('status', 'rented');
      } else if (reportType === 'maintenance') {
        query = query.eq('status', 'maintenance');
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching fleet report data:', error);
      toast.error(t('reports.downloadFailed'));
      return [];
    }
  };

  // Financial report data
  const fetchFinancialData = async (reportType: string, dateRange: DateRange | undefined) => {
    try {
      let query = supabase.from('unified_payments').select('*');
      
      // Apply date range filtering if provided
      if (dateRange) {
        query = filterByDateRange(query, dateRange);
      }
      
      // Apply specific report type filtering
      if (reportType === 'revenue') {
        query = query.eq('type', 'Income');
      } else if (reportType === 'expenses') {
        query = query.eq('type', 'Expense');
      } else if (reportType === 'overdue') {
        query = query.gt('days_overdue', 0);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching financial report data:', error);
      toast.error(t('reports.downloadFailed'));
      return [];
    }
  };

  // Customer report data
  const fetchCustomerData = async (reportType: string, dateRange: DateRange | undefined) => {
    try {
      let query = supabase.from('profiles').select('*');
      
      // Apply date range filtering if provided
      if (dateRange) {
        query = filterByDateRange(query, dateRange);
      }
      
      // Apply specific report type filtering
      if (reportType === 'active') {
        query = query.eq('status', 'active');
      } else if (reportType === 'inactive') {
        query = query.eq('status', 'inactive');
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching customer report data:', error);
      toast.error(t('reports.downloadFailed'));
      return [];
    }
  };

  return (
    <PageContainer
      title={t('reports.title')}
      description={t('reports.description')}
      className={isRTL ? 'rtl' : ''}
    >
      <Tabs
        defaultValue="fleet"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <TabsList className={`grid w-full grid-cols-3 ${isRTL ? 'rtl' : ''}`}>
          <TabsTrigger value="fleet">{t('reports.fleetReport')}</TabsTrigger>
          <TabsTrigger value="financial">{t('reports.financialReport')}</TabsTrigger>
          <TabsTrigger value="customer">{t('reports.customerReport')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fleet" className="space-y-6">
          <ReportGenerator
            title={t('reports.fleetReport')}
            reportTypes={[
              { value: 'all', label: 'common.all' },
              { value: 'available', label: 'common.available' },
              { value: 'rented', label: 'common.rented' },
              { value: 'maintenance', label: 'vehicles.status.maintenance' }
            ]}
            fetchReportData={fetchFleetData}
            columns={[
              { field: 'license_plate', header: 'common.licensePlate' },
              { field: 'make', header: 'common.make' },
              { field: 'model', header: 'common.model' },
              { field: 'year', header: 'common.year' },
              { field: 'status', header: 'common.status' },
              { field: 'mileage', header: 'common.mileage' },
            ]}
          />
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-6">
          <ReportGenerator
            title={t('reports.financialReport')}
            reportTypes={[
              { value: 'all', label: 'common.all' },
              { value: 'revenue', label: 'financials.revenue' },
              { value: 'expenses', label: 'financials.expenses' },
              { value: 'overdue', label: 'financials.pending' }
            ]}
            fetchReportData={fetchFinancialData}
            columns={[
              { field: 'transaction_id', header: 'common.transactionId' },
              { field: 'amount', header: 'common.amount' },
              { field: 'payment_date', header: 'common.date' },
              { field: 'type', header: 'common.type' },
              { field: 'status', header: 'common.status' },
              { field: 'description', header: 'common.description' },
            ]}
          />
        </TabsContent>
        
        <TabsContent value="customer" className="space-y-6">
          <ReportGenerator
            title={t('reports.customerReport')}
            reportTypes={[
              { value: 'all', label: 'common.all' },
              { value: 'active', label: 'common.active' },
              { value: 'inactive', label: 'common.inactive' }
            ]}
            fetchReportData={fetchCustomerData}
            columns={[
              { field: 'full_name', header: 'common.name' },
              { field: 'email', header: 'common.email' },
              { field: 'phone_number', header: 'common.phone' },
              { field: 'nationality', header: 'common.nationality' },
              { field: 'status', header: 'common.status' },
            ]}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Reports;
