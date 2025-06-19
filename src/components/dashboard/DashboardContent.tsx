import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardStats from './DashboardStats';
import RevenueChart from './RevenueChart';
import VehicleStatusChart from './VehicleStatusChart';
import RecentActivity from './RecentActivity';
import { QuickReportsWidget } from './QuickReportsWidget';
import { RealTimeAnalytics } from './RealTimeAnalytics';
import { LegalIntegrationSection } from './LegalIntegrationSection';
import { WorkflowIntegrationWidget } from './WorkflowIntegrationWidget';
import { DashboardStats as DashboardStatsType, RecentActivity as RecentActivityType } from '@/hooks/use-dashboard';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardContentProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  stats?: DashboardStatsType;
  revenue: { name: string; revenue: number; }[];
  activity: RecentActivityType[];
  collapsedSections: {[key: string]: boolean};
  onToggleSection: (section: string) => void;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  isLoading,
  isError,
  error,
  stats,
  revenue,
  activity,
  collapsedSections,
  onToggleSection
}) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-right" dir="rtl">
        فشل في تحميل بيانات لوحة التحكم
        {error && <p className="text-sm mt-1">{error.toString()}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* مسارات العمل الموحدة */}
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('workflows')}
          >
            {collapsedSections['workflows'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">مسارات العمل الموحدة</h2>
        </div>
        {!collapsedSections['workflows'] && (
          isLoading ? <Skeleton className="h-[400px] w-full rounded-lg" /> : <WorkflowIntegrationWidget />
        )}
      </div>

      {/* التحليلات السريعة والمباشرة */}
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('quick-analytics')}
          >
            {collapsedSections['quick-analytics'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">التحليلات السريعة والتقارير</h2>
        </div>
        {!collapsedSections['quick-analytics'] && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              <>
                <Skeleton className="h-[400px] w-full rounded-lg" />
                <Skeleton className="h-[400px] w-full rounded-lg" />
              </>
            ) : (
              <>
                <QuickReportsWidget />
                <RealTimeAnalytics />
              </>
            )}
          </div>
        )}
      </div>

      {/* التكامل القانوني والتنبيهات */}
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('legal-integration')}
          >
            {collapsedSections['legal-integration'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">التكامل القانوني والقضايا</h2>
        </div>
        {!collapsedSections['legal-integration'] && (
          isLoading ? <Skeleton className="h-[400px] w-full rounded-lg" /> : <LegalIntegrationSection />
        )}
      </div>

      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('kpis')}
          >
            {collapsedSections['kpis'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">المؤشرات الرئيسية</h2>
        </div>
        {!collapsedSections['kpis'] && <DashboardStats stats={stats} loading={isLoading} />}
      </div>
      
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <div className="flex items-center gap-2 space-x-reverse">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => onToggleSection('fleet')}
            >
              {collapsedSections['fleet'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Badge variant="outline" className="bg-background">
              {isLoading ? 'جاري التحميل...' : `إجمالي المركبات: ${stats?.vehicleStats.total || 0}`}
            </Badge>
          </div>
          <h2 className="text-lg font-semibold text-right">حالة الأسطول</h2>
        </div>
        {!collapsedSections['fleet'] && (
          isLoading ? <Skeleton className="h-[300px] w-full rounded-lg" /> : <VehicleStatusChart data={stats?.vehicleStats} />
        )}
      </div>
      
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('revenue')}
          >
            {collapsedSections['revenue'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">تحليل الإيرادات</h2>
        </div>
        {!collapsedSections['revenue'] && (
          isLoading ? <Skeleton className="h-[300px] w-full rounded-lg" /> : <RevenueChart data={revenue} />
        )}
      </div>
      
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('activity')}
          >
            {collapsedSections['activity'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">النشاط الأخير</h2>
        </div>
        {!collapsedSections['activity'] && (
          isLoading ? <Skeleton className="h-[200px] w-full rounded-lg" /> : <RecentActivity activities={activity} />
        )}
      </div>
    </div>
  );
};
