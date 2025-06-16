import React from 'react';
import CollectionReportsPage from '@/components/financials/reports/CollectionReportsPage';

const CollectionReports: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pr-64" dir="rtl">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-right">
            تقارير التحصيل
          </h1>
          <p className="text-gray-600 mt-2 text-right">
            تقارير شاملة لعمليات التحصيل والأداء المالي
          </p>
        </div>
        
        <CollectionReportsPage />
      </div>
    </div>
  );
};

export default CollectionReports; 