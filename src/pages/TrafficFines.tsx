
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart2, FileText } from "lucide-react";
import TrafficFinesList from "@/components/fines/TrafficFinesList";
import TrafficFineEntry from "@/components/fines/TrafficFineEntry";
import TrafficFineAnalytics from "@/components/fines/TrafficFineAnalytics";
import { useTranslation as useI18nTranslation } from "react-i18next";
import { useTranslation } from "@/contexts/TranslationContext";
import { getDirectionalClasses } from "@/utils/rtl-utils";

const TrafficFines = () => {
  const [activeTab, setActiveTab] = useState("list");
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
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
        description={t("trafficFines.description", "Record, track and manage traffic violations")}
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid grid-cols-1 md:grid-cols-3 w-full ${isRTL ? 'rtl-tabs' : ''}`}>
          <TabsTrigger value="list" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t("trafficFines.list", "Fines List")}
          </TabsTrigger>
          <TabsTrigger value="add" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t("trafficFines.recordNew", "Record New Fine")}
          </TabsTrigger>
          <TabsTrigger value="reports" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
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
