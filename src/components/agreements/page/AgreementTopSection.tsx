
import React from 'react';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { AgreementAnalytics } from '@/components/agreements/AgreementAnalytics';

export const AgreementTopSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Stats Overview */}
      <div className="xl:col-span-2">
        <AgreementStats className="h-full" />
      </div>
      
      {/* Analytics Preview */}
      <div className="xl:col-span-1">
        <AgreementAnalytics />
      </div>
    </div>
  );
};
