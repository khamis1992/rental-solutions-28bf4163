
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
import { FileText, Filter, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';

const Reports = () => {
  const [selectedTab, setSelectedTab] = useState('fleet');
  const [showFilters, setShowFilters] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Simulate report generation progress
  const handleGenerateReport = () => {
    setGeneratingReport(true);
    setGenerationProgress(0);
    
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        const newValue = prev + 10;
        if (newValue >= 100) {
          clearInterval(interval);
          setTimeout(() => setGeneratingReport(false), 500);
          return 100;
        }
        return newValue;
      });
    }, 300);
  };

  return (
    <PageContainer title="Reports & Analytics" description="Comprehensive reports and analytics for your rental business">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
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
          <div className="hidden md:flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date Range</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2 p-2">
                  <h4 className="font-medium">Select Date Range</h4>
                  <p className="text-muted-foreground text-sm">Filter reports by date range</p>
                  {/* Calendar content would go here */}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
            
            <Button 
              onClick={handleGenerateReport} 
              disabled={generatingReport}
              className="gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              <span>Generate Report</span>
            </Button>
          </div>
        </div>
        
        {generatingReport && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generating report...</span>
              <span>{generationProgress}%</span>
            </div>
            <Progress value={generationProgress} className="h-2" indicatorClassName={`${generationProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} />
          </div>
        )}
        
        {showFilters && (
          <div className="p-4 bg-white rounded-md mb-4 animate-fade-in shadow-sm">
            <h3 className="text-sm font-medium mb-2">Advanced Filters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Filter content would go here */}
              <div className="col-span-4 text-center text-sm text-muted-foreground">
                Filters can be customized per report type
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="p-0">
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab} 
            className="w-full"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
              <TabsList className="w-full grid grid-cols-4 bg-white/10 backdrop-blur-sm">
                <TabsTrigger value="fleet">Fleet Report</TabsTrigger>
                <TabsTrigger value="financial">Financial Report</TabsTrigger>
                <TabsTrigger value="customers">Customer Report</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance Report</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6 bg-white">
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
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center">
        <img 
          src="/lovable-uploads/f81bdd9a-0bfe-4a23-9690-2b9104df3642.png" 
          alt="Alaraf Car Rental Footer" 
          className="h-8 mx-auto"
        />
        <p className="text-xs text-muted-foreground mt-2">
          © 2024 Alaraf Car Rental. Generated reports are available for download in various formats.
        </p>
      </div>
    </PageContainer>
  );
};

export default Reports;
