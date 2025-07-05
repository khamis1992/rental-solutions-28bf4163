import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import SmartPaymentSystemUpdater from '@/components/admin/SmartPaymentSystemUpdater';

export default function SmartSystemUpdaterPage() {
  return (
    <PageContainer
      title="النظام الذكي الشامل"
      subtitle="تحديث جميع العقود والدفعات تلقائياً"
    >
      <SmartPaymentSystemUpdater />
    </PageContainer>
  );
} 