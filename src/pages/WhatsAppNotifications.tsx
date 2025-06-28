
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import WhatsAppReminders from '@/components/notifications/WhatsAppReminders';
import WhatsAppServiceStatus from '@/components/notifications/WhatsAppServiceStatus';
import WhatsAppSetupGuide from '@/components/notifications/WhatsAppSetupGuide';
import { MessageCircle, Settings, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const WhatsAppNotifications: React.FC = () => {
  return (
    <PageContainer 
      title="تذكيرات الواتساب"
      subtitle="إدارة رسائل التذكير والإشعارات عبر واتساب"
      icon={<MessageCircle className="h-8 w-8" />}
    >
      <Tabs defaultValue="reminders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            التذكيرات
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            حالة الخدمة
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            دليل الإعداد
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reminders" className="mt-6">
          <WhatsAppReminders />
        </TabsContent>
        
        <TabsContent value="status" className="mt-6">
          <WhatsAppServiceStatus />
        </TabsContent>
        
        <TabsContent value="setup" className="mt-6">
          <WhatsAppSetupGuide />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default WhatsAppNotifications;
