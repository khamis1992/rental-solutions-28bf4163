
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardStats from './DashboardStats';
import VehicleStatusChart from './VehicleStatusChart';
import { RealTimeStatsWidget } from './RealTimeStatsWidget';
import { AdvancedAnalyticsPanel } from './AdvancedAnalyticsPanel';
import { ActivityWithAlertsWidget } from './ActivityWithAlertsWidget';
import { QuickActions } from './QuickActions';
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
      {/* 1. المؤشرات الرئيسية */}
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

      {/* 2. الإجراءات السريعة */}
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('quickActions')}
          >
            {collapsedSections['quickActions'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">الإجراءات السريعة</h2>
        </div>
        {!collapsedSections['quickActions'] && <QuickActions />}
      </div>

      {/* 3. تحليلات النظام - now with white background matching Quick Actions */}
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('analytics')}
          >
            {collapsedSections['analytics'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">تحليلات النظام</h2>
        </div>
        {!collapsedSections['analytics'] && <AdvancedAnalyticsPanel />}
      </div>
      
      {/* 4. حالة الأسطول */}
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
              {isLoading ? 'جاري التحميل...' : 'إجمالي المركبات'}
            </Badge>
          </div>
          <h2 className="text-lg font-semibold text-right">حالة الأسطول</h2>
        </div>
        {!collapsedSections['fleet'] && (
          isLoading ? <Skeleton className="h-[300px] w-full rounded-lg" /> : <VehicleStatusChart data={stats?.vehicleStats} />
        )}
      </div>

      {/* 5. الإحصائيات - now with white background matching other sections */}
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('realtime')}
          >
            {collapsedSections['realtime'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">الإحصائيات</h2>
        </div>
        {!collapsedSections['realtime'] && <RealTimeStatsWidget />}
      </div>
      
      {/* 6. النشاط والتنبيهات */}
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
          <h2 className="text-lg font-semibold text-right">النشاط والتنبيهات</h2>
        </div>
        {!collapsedSections['activity'] && (
          isLoading ? <Skeleton className="h-[200px] w-full rounded-lg" /> : <ActivityWithAlertsWidget activities={activity} />
        )}
      </div>
    </div>
  );
};
