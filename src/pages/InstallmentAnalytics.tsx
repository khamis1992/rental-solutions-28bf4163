import React from 'react';
import InstallmentAnalyticsDashboard from '@/components/financials/analytics/InstallmentAnalyticsDashboard';

const InstallmentAnalytics: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pr-64" dir="rtl">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-right">
            تحليلات الأقساط
          </h1>
          <p className="text-gray-600 mt-2 text-right">
            تحليل شامل لأداء محفظة الأقساط والمقاييس المالية
          </p>
        </div>
        
        <InstallmentAnalyticsDashboard />
      </div>
    </div>
  );
};

export default InstallmentAnalytics; 