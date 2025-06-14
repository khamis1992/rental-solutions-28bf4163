import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart2, FileText, Search } from "lucide-react";
import TrafficFinesList from "@/components/fines/TrafficFinesList";
import TrafficFineEntry from "@/components/fines/TrafficFineEntry";
import TrafficFineAnalytics from "@/components/fines/TrafficFineAnalytics";
import TrafficFineValidation from "@/components/fines/TrafficFineValidation";
import { useLanguage } from '@/contexts/LanguageContext';

const TrafficFines = () => {
  const [activeTab, setActiveTab] = useState("list");
  const { language } = useLanguage();
  
  const handleAddFine = () => {
    setActiveTab("add");
  };
  
  const handleFineSaved = () => {
    setActiveTab("list");
  };

  return (
    <PageContainer>
      <SectionHeader
        title={language === 'ar' ? 'إدارة المخالفات المرورية' : 'Traffic Fines Management'}
        description={language === 'ar' ? 'تسجيل وتتبع والتحقق من وإدارة المخالفات المرورية' : 'Record, track, validate, and manage traffic violations'}
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full">
          <TabsTrigger value="list" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'قائمة المخالفات' : 'Fines List'}
          </TabsTrigger>
          <TabsTrigger value="add" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <AlertTriangle className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'تسجيل مخالفة جديدة' : 'Record New Fine'}
          </TabsTrigger>
          <TabsTrigger value="validate" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Search className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'التحقق من المخالفات' : 'Fines Validation'}
          </TabsTrigger>
          <TabsTrigger value="reports" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <BarChart2 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'تحليلات المخالفات' : 'Fine Analytics'}
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
          <TrafficFineAnalytics />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default TrafficFines;
