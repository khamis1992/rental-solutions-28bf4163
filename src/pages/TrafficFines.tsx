
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart2, FileText, Search } from "lucide-react";
import TrafficFinesList from "@/components/fines/TrafficFinesList";
import TrafficFineEntry from "@/components/fines/TrafficFineEntry";
import TrafficFineAnalytics from "@/components/fines/TrafficFineAnalytics";
import TrafficFineValidation from "@/components/fines/TrafficFineValidation";
import { Card, CardContent } from "@/components/ui/card";
import ReportDownloadOptions from "@/components/reports/ReportDownloadOptions";
import { useTrafficFines } from "@/hooks/use-traffic-fines";

const TrafficFines = () => {
  const [activeTab, setActiveTab] = useState("list");
  const { trafficFines } = useTrafficFines();
  
  const handleAddFine = () => {
    setActiveTab("add");
  };
  
  const handleFineSaved = () => {
    setActiveTab("list");
  };

  // Prepare formatted data for reports
  const getReportData = () => {
    if (!trafficFines) return [];
    
    return trafficFines.map(fine => ({
      violationNumber: fine.violationNumber || 'N/A',
      licensePlate: fine.licensePlate || 'Unknown',
      violationDate: fine.violationDate ? new Date(fine.violationDate) : new Date(),
      fineAmount: fine.fineAmount || 0,
      violationCharge: fine.violationCharge || 'Unknown violation',
      paymentStatus: fine.paymentStatus || 'pending',
      location: fine.location || 'Unknown',
      customerName: fine.customerName || 'Unassigned',
      paymentDate: fine.paymentDate ? new Date(fine.paymentDate) : undefined
    }));
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Traffic Fines Management"
        description="Record, track, validate, and manage traffic violations"
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full">
          <TabsTrigger value="list" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Fines List
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Record New Fine
          </TabsTrigger>
          <TabsTrigger value="validate" className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Fines Validation
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Fine Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-6">
          <TrafficFinesList onAddFine={handleAddFine} />
        </TabsContent>
        
        <TabsContent value="add" className="space-y-6">
          <TrafficFineEntry onFineSaved={handleFineSaved} />
        </TabsContent>
        
        <TabsContent value="validate" className="space-y-6">
          <TrafficFineValidation />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Traffic Fines Report</h3>
                <p className="text-muted-foreground mb-6">
                  Generate a detailed report of all traffic fines with customer and vehicle information.
                </p>
                
                <ReportDownloadOptions
                  reportType="traffic-fines"
                  getReportData={getReportData}
                />
              </CardContent>
            </Card>
            
            <TrafficFineAnalytics />
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default TrafficFines;
