
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

const Reports = () => {
  const [selectedTab, setSelectedTab] = useState('fleet');

  return (
    <PageContainer title="Reports & Analytics" description="Comprehensive reports and analytics for your rental business">
      <div className="flex items-center mb-6">
        <img 
          src="/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png" 
          alt="Alaraf Car Rental" 
          className="h-12 mr-4" 
        />
        <SectionHeader 
          title="Generate Reports" 
          description="Select a report type to view detailed analytics and insights"
          icon={FileText}
        />
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
      
      <div className="mt-8 text-center">
        <img 
          src="/lovable-uploads/f81bdd9a-0bfe-4a23-9690-2b9104df3642.png" 
          alt="Alaraf Car Rental Footer" 
          className="h-8 mx-auto"
        />
      </div>
    </PageContainer>
  );
};

export default Reports;
