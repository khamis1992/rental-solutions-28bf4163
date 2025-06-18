import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserCog, Sliders, Settings as SettingsIcon, Smartphone } from "lucide-react";
const UserSettings = React.lazy(() => import("./UserSettings"));
const SystemSettings = React.lazy(() => import("./SystemSettings"));
const PWASettings = React.lazy(() => import("@/components/settings/PWASettings"));

const Settings: React.FC = () => {
  const { language } = useLanguage();
  const [tab, setTab] = React.useState("user");
  
  return (
    <PageContainer>
      <PageHeader
        title="الإعدادات"
        subtitle="إدارة إعدادات المستخدم والنظام"
        icon={<SettingsIcon className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      
      <div className="mt-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className={language === 'ar' ? 'flex-row-reverse' : ''}>
            <TabsTrigger value="user" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <UserCog className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'إعدادات المستخدم' : 'User Settings'}
            </TabsTrigger>
            <TabsTrigger value="system" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Sliders className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
            </TabsTrigger>
            <TabsTrigger value="pwa" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Smartphone className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'إعدادات التطبيق' : 'App Settings'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="user" className="mt-4">
            <React.Suspense fallback={
              <div className={`text-center py-8 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'جاري تحميل إعدادات المستخدم...' : 'Loading User Settings...'}
              </div>
            }>
              <UserSettings />
            </React.Suspense>
          </TabsContent>
          
          <TabsContent value="system" className="mt-4">
            <React.Suspense fallback={
              <div className={`text-center py-8 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'جاري تحميل إعدادات النظام...' : 'Loading System Settings...'}
              </div>
            }>
              <SystemSettings />
            </React.Suspense>
          </TabsContent>
          
          <TabsContent value="pwa" className="mt-4">
            <React.Suspense fallback={
              <div className={`text-center py-8 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'جاري تحميل إعدادات التطبيق...' : 'Loading App Settings...'}
              </div>
            }>
              <PWASettings />
            </React.Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default Settings; 