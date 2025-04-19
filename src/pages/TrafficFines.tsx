import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart2, FileText, Search } from "lucide-react";
import TrafficFinesList from "@/components/fines/TrafficFinesList";
import TrafficFineEntry from "@/components/fines/TrafficFineEntry";
import TrafficFineAnalytics from "@/components/fines/TrafficFineAnalytics";
import TrafficFineValidation from "@/components/fines/TrafficFineValidation";
import { useParams } from "react-router-dom";
import AgreementTrafficFines from "@/components/agreements/AgreementTrafficFines";
import { useAgreements } from "@/hooks/useAgreements";

const TrafficFines = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("list");
  const { agreement } = useAgreements();
  
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
          {id && (
            <AgreementTrafficFines 
              agreementId={id}
              startDate={agreement?.start_date}
              endDate={agreement?.end_date}
            />
          )}
          <TrafficFinesList onAddFine={handleAddFine} />
        </TabsContent>
        
        <TabsContent value="add" className="space-y-6">
          <TrafficFineEntry onFineSaved={handleFineSaved} />
        </TabsContent>
        
        <TabsContent value="validate" className="space-y-6">
          <TrafficFineValidation />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <TrafficFineAnalytics />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default TrafficFines;
