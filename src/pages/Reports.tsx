
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import FleetReport from '@/components/reports/FleetReport';
import FinancialReport from '@/components/reports/FinancialReport';
import CustomerReport from '@/components/reports/CustomerReport';
import MaintenanceReport from '@/components/reports/MaintenanceReport';
import ReportDownloadOptions from '@/components/reports/ReportDownloadOptions';
import { SectionHeader } from '@/components/ui/section-header';
import { FileText } from 'lucide-react';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { useFinancials } from '@/hooks/use-financials';
import { useCustomers } from '@/hooks/use-customers';
import { useMaintenance } from '@/hooks/use-maintenance';

const Reports = () => {
  const [selectedTab, setSelectedTab] = useState('fleet');
  const { vehicles } = useFleetReport();
  const { transactions } = useFinancials();
  const { customers } = useCustomers();
  const { useList } = useMaintenance();
  const { data: maintenanceRecords = [] } = useList();
  
  const getReportData = () => {
    switch (selectedTab) {
      case 'fleet':
        return vehicles.map(v => ({
          make: v.make,
          model: v.model,
          year: v.year,
          license_plate: v.license_plate,
          status: v.status,
          daily_rate: v.dailyRate
        }));
      case 'financial':
        return transactions;
      case 'customers':
        return customers.map(customer => ({
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          status: customer.status,
          driver_license: customer.driver_license,
          created_at: customer.created_at
        }));
      case 'maintenance':
        return maintenanceRecords.map(record => ({
          id: record.id,
          vehicle: record.vehicles ? `${record.vehicles.make} ${record.vehicles.model} (${record.vehicles.license_plate})` : 'Unknown Vehicle',
          maintenance_type: record.maintenance_type || 'General Maintenance',
          scheduled_date: record.scheduled_date,
          status: record.status,
          cost: record.cost || 0,
          completion_date: record.completion_date
        }));
      default:
        return [];
    }
  };

  return <PageContainer title="Reports & Analytics" description="Comprehensive reports and analytics for your rental business">
      <div className="flex items-center mb-6">
        <SectionHeader title="Generate Reports" description="Select a report type to view detailed analytics and insights" icon={FileText} />
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="fleet">Fleet Report</TabsTrigger>
              <TabsTrigger value="financial">Financial Report</TabsTrigger>
              <TabsTrigger value="customers">Customer Report</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance Report</TabsTrigger>
            </TabsList>
            
            <div className="mb-6">
              <ReportDownloadOptions reportType={selectedTab} getReportData={getReportData} />
            </div>
            
            <TabsContent value="fleet" className="mt-0">
              <FleetReport />
            </TabsContent>
            
            <TabsContent value="financial" className="mt-0">
              <FinancialReport />
            </TabsContent>
            
            <TabsContent value="customers" className="mt-0">
              <CustomerReport />
            </TabsContent>
            
            <TabsContent value="maintenance" className="mt-0">
              <MaintenanceReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center">
      </div>
    </PageContainer>;
};

export default Reports;
