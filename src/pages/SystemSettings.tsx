
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import { CompanySettings } from '@/components/settings/CompanySettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { IdConverterTool } from '@/components/settings/IdConverterTool';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { ApiIntegrationGuide } from '@/components/settings/ApiIntegrationGuide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Bell, Globe, Tool, Code } from 'lucide-react';

const SystemSettings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('company');

  return (
    <PageContainer 
      title={t('settings.title')} 
      description={t('settings.description')}
    >
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8">
          <TabsTrigger value="company">
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">{t('settings.company')}</span>
            <span className="inline md:hidden">{t('settings.companyShort')}</span>
          </TabsTrigger>
          
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">{t('settings.notifications')}</span>
            <span className="inline md:hidden">{t('settings.notificationsShort')}</span>
          </TabsTrigger>
          
          <TabsTrigger value="language">
            <Globe className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">{t('settings.language')}</span>
            <span className="inline md:hidden">{t('settings.languageShort')}</span>
          </TabsTrigger>
          
          <TabsTrigger value="tools">
            <Tool className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">{t('settings.tools')}</span>
            <span className="inline md:hidden">{t('settings.toolsShort')}</span>
          </TabsTrigger>
          
          <TabsTrigger value="api">
            <Code className="h-4 w-4 mr-2" />
            <span>{t('settings.api')}</span>
            <Badge variant="outline" className="ml-2 text-xs">NEW</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="language">
          <LanguageSelector />
        </TabsContent>
        
        <TabsContent value="tools">
          <IdConverterTool />
        </TabsContent>
        
        <TabsContent value="api">
          <ApiIntegrationGuide />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default SystemSettings;
