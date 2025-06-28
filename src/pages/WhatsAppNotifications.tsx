import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import WhatsAppReminders from '@/components/notifications/WhatsAppReminders';
import { MessageCircle } from 'lucide-react';

const WhatsAppNotifications: React.FC = () => {
  return (
    <PageContainer 
      title="تذكيرات الواتساب"
      subtitle="إدارة رسائل التذكير والإشعارات عبر واتساب"
      icon={<MessageCircle className="h-8 w-8" />}
    >
      <WhatsAppReminders />
    </PageContainer>
  );
};

export default WhatsAppNotifications;
