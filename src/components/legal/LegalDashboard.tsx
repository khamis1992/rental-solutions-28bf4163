
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gavel, 
  FileText, 
  AlertTriangle, 
  Calendar, 
  BarChart4, 
  ShieldAlert 
} from 'lucide-react';
import LegalDocuments from './LegalDocuments';
import LegalCaseManagement from './LegalCaseManagement';
import ComplianceCalendar from './ComplianceCalendar';
import LegalRiskAssessment from './LegalRiskAssessment';
import ComplianceReporting from './ComplianceReporting';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { useDirectionalClasses } from '@/utils/rtl-utils';

const LegalDashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const { t } = useI18nTranslation();
  const { direction, isRTL } = useTranslation();
  
  const tabsClasses = useDirectionalClasses(
    "grid grid-cols-1 md:grid-cols-5 gap-4",
    "",
    ""
  );
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">{t('legal.dashboard')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="documents" 
            className="space-y-4"
            value={activeTab}
            onValueChange={setActiveTab}
            dir={direction}
          >
            <TabsList className={tabsClasses}>
              <TabsTrigger value="documents" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <FileText className="h-4 w-4" />
                <span>{t('legal.documents')}</span>
              </TabsTrigger>
              <TabsTrigger value="cases" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <Gavel className="h-4 w-4" />
                <span>{t('legal.caseManagement')}</span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <Calendar className="h-4 w-4" />
                <span>{t('legal.complianceCalendar')}</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <ShieldAlert className="h-4 w-4" />
                <span>{t('legal.riskAssessment')}</span>
              </TabsTrigger>
              <TabsTrigger value="reporting" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <BarChart4 className="h-4 w-4" />
                <span>{t('legal.complianceReporting')}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents" className="space-y-4">
              <LegalDocuments />
            </TabsContent>
            
            <TabsContent value="cases" className="space-y-4">
              <LegalCaseManagement />
            </TabsContent>
            
            <TabsContent value="compliance" className="space-y-4">
              <ComplianceCalendar />
            </TabsContent>
            
            <TabsContent value="risk" className="space-y-4">
              <LegalRiskAssessment />
            </TabsContent>
            
            <TabsContent value="reporting" className="space-y-4">
              <ComplianceReporting />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalDashboard;
