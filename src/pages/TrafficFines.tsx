
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart2, FileText } from "lucide-react";
import TrafficFinesList from "@/components/fines/TrafficFinesList";
import TrafficFineEntry from "@/components/fines/TrafficFineEntry";
import TrafficFineAnalytics from "@/components/fines/TrafficFineAnalytics";
import { useTranslation } from "react-i18next";
import { useTranslation as useAppTranslation } from "@/contexts/TranslationContext";

const TrafficFines = () => {
  const [activeTab, setActiveTab] = useState("list");
  const { t } = useTranslation();
  const { isRTL } = useAppTranslation();
  
  const handleAddFine = () => {
    setActiveTab("add");
  };
  
  const handleFineSaved = () => {
    setActiveTab("list");
  };

  return (
    <PageContainer>
      <SectionHeader
        title={t("trafficFines.title", "Traffic Fines")}
        description={t("trafficFines.description", "Record, track, and manage traffic violations")}
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full">
          <TabsTrigger value="list" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''}`}>
            <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t("trafficFines.list", "Fines List")}
          </TabsTrigger>
          <TabsTrigger value="add" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''}`}>
            <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t("trafficFines.recordNew", "Record New Fine")}
          </TabsTrigger>
          <TabsTrigger value="reports" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''}`}>
            <BarChart2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t("trafficFines.analytics", "Fine Analytics")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-6">
          <TrafficFinesList onAddFine={handleAddFine} />
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
