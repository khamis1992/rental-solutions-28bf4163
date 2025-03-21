
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FleetReport from '@/components/reports/FleetReport';
import FinancialReport from '@/components/reports/FinancialReport';
import CustomerReport from '@/components/reports/CustomerReport';
import MaintenanceReport from '@/components/reports/MaintenanceReport';
import ReportDownloadOptions from '@/components/reports/ReportDownloadOptions';

const Reports = () => {
  const [selectedTab, setSelectedTab] = useState('fleet');

  return (
    <PageContainer title="Reports & Analytics" description="Comprehensive reports and analytics for your rental business">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>
            Select a report type to view detailed analytics and insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="fleet">Fleet Report</TabsTrigger>
              <TabsTrigger value="financial">Financial Report</TabsTrigger>
              <TabsTrigger value="customers">Customer Report</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance Report</TabsTrigger>
            </TabsList>
            
            <div className="mb-6">
              <ReportDownloadOptions reportType={selectedTab} />
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
    </PageContainer>
  );
};

export default Reports;
