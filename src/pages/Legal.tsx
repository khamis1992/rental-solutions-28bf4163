
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel, FileText, Scale, Languages } from 'lucide-react';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';
import TrafficReportTab from '@/components/legal/TrafficReportTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Legal = () => {
  const [activeTab, setActiveTab] = useState("obligations");
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');

  const handleTabChange = (value: string) => {
    // This ensures we don't refresh the page when changing tabs
    console.log(`Tab changed to: ${value}`);
    setActiveTab(value);
  };

  return (
    <PageContainer
      title={language === 'arabic' ? "الإدارة القانونية" : "Legal Management"}
      description={language === 'arabic' 
        ? "إدارة المستندات القانونية ومتطلبات الامتثال والقضايا القانونية" 
        : "Manage legal documents, compliance requirements, and legal cases"}
    >
      <div className="flex items-center justify-between mb-4">
        <SectionHeader
          title={language === 'arabic' ? "الإدارة القانونية" : "Legal Management"}
          description={language === 'arabic' 
            ? "تتبع وإدارة جميع الجوانب القانونية لعمليات الأسطول" 
            : "Track and manage all legal aspects of your fleet operations"}
          icon={Gavel}
        />
        
        <div className="flex items-center space-x-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={language} 
            onValueChange={(value: 'english' | 'arabic') => {
              setLanguage(value);
            }}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="arabic">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="obligations" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="obligations">
            <FileText className="h-4 w-4 mr-2" />
            {language === 'arabic' ? "الالتزامات" : "Obligations"}
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Scale className="h-4 w-4 mr-2" />
            {language === 'arabic' ? "التقارير" : "Reports"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="obligations" className="space-y-4">
          <CustomerLegalObligations />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <TrafficReportTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Legal;
