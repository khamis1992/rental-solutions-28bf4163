
import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart2, FileText, Search } from "lucide-react";
import TrafficFinesTable from "@/components/fines/TrafficFinesTable";
import TrafficFineEntry from "@/components/fines/TrafficFineEntry";
import TrafficFineAnalytics from "@/components/fines/TrafficFineAnalytics";
import { Button } from "@/components/ui/button";

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
      <div className="flex justify-between items-start mb-6">
        <SectionHeader
          title="Traffic Fines Management"
          description="Record, track, and manage traffic violations"
          icon={AlertTriangle}
        />
        
        <Button 
          variant="outline" 
          asChild
          className="mt-2"
        >
          <Link to="/fines-validation">
            <Search className="mr-2 h-4 w-4" />
            Fines Validation
          </Link>
        </Button>
      </div>
      
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
          <TrafficFinesTable onAddFine={handleAddFine} />
        </TabsContent>
        
        <TabsContent value="add" className="space-y-6">
          <TrafficFineEntry onFineSaved={handleFineSaved} />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <TrafficFineAnalytics />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default TrafficFines;
