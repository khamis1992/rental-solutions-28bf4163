
import React, { useState, useMemo } from "react";
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

  // Memoize tab classes to avoid recalculation on each render
  const tabClasses = useMemo(() => ({
    tabs: `space-y-6 ${isRTL ? 'rtl-tabs' : ''}`,
    tabsList: `grid grid-cols-1 md:grid-cols-3 w-full ${isRTL ? 'rtl-mode' : ''}`,
    tabTrigger: `flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`,
    iconClass: `h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`
  }), [isRTL]);

  return (
    <PageContainer>
      <SectionHeader
        title={t("trafficFines.title")}
        description={t("trafficFines.description")}
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className={tabClasses.tabs}>
        <TabsList className={tabClasses.tabsList}>
          <TabsTrigger value="list" className={tabClasses.tabTrigger}>
            <FileText className={tabClasses.iconClass} />
            {t("trafficFines.list")}
          </TabsTrigger>
          <TabsTrigger value="add" className={tabClasses.tabTrigger}>
            <AlertTriangle className={tabClasses.iconClass} />
            {t("trafficFines.recordNew")}
          </TabsTrigger>
          <TabsTrigger value="reports" className={tabClasses.tabTrigger}>
            <BarChart2 className={tabClasses.iconClass} />
            {t("trafficFines.analytics")}
          </TabsTrigger>
        </TabsList>
        
        {/* Conditionally render only the active tab content for better performance */}
        <TabsContent value="list" className="space-y-6">
          {activeTab === "list" && <TrafficFinesList onAddFine={handleAddFine} />}
        </TabsContent>
        
        <TabsContent value="add" className="space-y-6">
          {activeTab === "add" && <TrafficFineEntry onFineSaved={handleFineSaved} />}
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          {activeTab === "reports" && <TrafficFineAnalytics />}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default React.memo(TrafficFines);
