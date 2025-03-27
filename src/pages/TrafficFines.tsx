
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart2, FileText } from "lucide-react";
import TrafficFinesList from "@/components/fines/TrafficFinesList";
import TrafficFineEntry from "@/components/fines/TrafficFineEntry";

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
        description="Record, track, and manage traffic violations"
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full">
          <TabsTrigger value="list" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Fines List
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Record New Fine
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
        
        <TabsContent value="reports" className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-6 flex flex-col items-center justify-center space-y-4">
            <BarChart2 className="h-12 w-12 text-amber-500" />
            <h3 className="text-lg font-medium text-amber-800">Traffic Fine Analytics Coming Soon</h3>
            <p className="text-amber-700 text-center max-w-md">
              Advanced analytics and reporting features for traffic fines are under development and will be available in the next update.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default TrafficFines;
