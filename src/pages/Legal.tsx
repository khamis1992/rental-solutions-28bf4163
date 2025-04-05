
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel, FileText, Scale, ClipboardList, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LegalDashboard from '@/components/legal/LegalDashboard';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';
import LegalDocuments from '@/components/legal/LegalDocuments';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

const Legal = () => {
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  const handleTabChange = (value: string) => {
    // This ensures we don't refresh the page when changing tabs
    console.log(`Tab changed to: ${value}`);
  };
  
  const handleExportReport = () => {
    toast.success(t('legal.reportGenerating'));
  };
  
  // Add a default customerId for demo purposes
  const defaultCustomerId = "default-customer-id";
  
  return (
    <PageContainer 
      title={t('legal.title')} 
      description={t('legal.description')} 
      actions={
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleExportReport} 
            className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>{t('legal.exportReport')}</span>
          </Button>
          <Button 
            onClick={() => navigate('/legal/cases/new')} 
            className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{t('legal.newCase')}</span>
          </Button>
        </div>
      }
    >
      <SectionHeader 
        title={t('legal.title')} 
        description={t('legal.trackAndManage')} 
        icon={Gavel} 
      />
      
      <Tabs defaultValue="dashboard" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full">
          <TabsTrigger value="dashboard" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
            <Scale className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('legal.dashboard')}
          </TabsTrigger>
          
          <TabsTrigger value="obligations" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
            <Gavel className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('legal.customerObligations')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <LegalDashboard />
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <LegalDocuments />
        </TabsContent>
        
        <TabsContent value="obligations" className="space-y-4">
          <CustomerLegalObligations customerId={defaultCustomerId} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Legal;
