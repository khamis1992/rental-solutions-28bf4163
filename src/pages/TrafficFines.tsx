
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
        title={t("trafficFines.title")}
        description={t("trafficFines.description")}
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className={`space-y-6 ${isRTL ? 'rtl-tabs' : ''}`}>
        <TabsList className={`grid grid-cols-1 md:grid-cols-3 w-full ${isRTL ? 'rtl-mode' : ''}`}>
          <TabsTrigger value="list" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
            <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t("trafficFines.list")}
          </TabsTrigger>
          <TabsTrigger value="add" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
            <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t("trafficFines.recordNew")}
          </TabsTrigger>
          <TabsTrigger value="reports" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
            <BarChart2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t("trafficFines.analytics")}
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
