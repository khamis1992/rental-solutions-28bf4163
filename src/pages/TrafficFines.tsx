
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart2, FileText, Search, ShieldCheck } from "lucide-react";
import TrafficFinesList from "@/components/fines/TrafficFinesList";
import TrafficFineEntry from "@/components/fines/TrafficFineEntry";
import TrafficFineAnalytics from "@/components/fines/TrafficFineAnalytics";
import TrafficFineValidation from "@/components/fines/TrafficFineValidation";
import TrafficFineDataQuality from "@/components/reports/TrafficFineDataQuality";

const TrafficFines = () => {
  const [activeTab, setActiveTab] = useState("list");
  
  const handleAddFine = () => {
    setActiveTab("add");
  };
  
  const handleFineSaved = () => {
    setActiveTab("list");
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Traffic Fines Management"
        description="Record, track, validate, and manage traffic violations"
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-5 w-full">
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
          <TabsTrigger value="dataQuality" className="flex items-center">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Data Quality
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
        
        <TabsContent value="dataQuality" className="space-y-6">
          <TrafficFineDataQuality />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <TrafficFineAnalytics />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default TrafficFines;
