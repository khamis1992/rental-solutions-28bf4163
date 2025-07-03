
import React, { memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardStats from './DashboardStats';
import VehicleStatusChart from './VehicleStatusChart';
import { RealTimeStatsWidget } from './RealTimeStatsWidget';
import { AdvancedAnalyticsPanel } from './AdvancedAnalyticsPanel';
import { QuickActions } from './QuickActions';
import { SmartAlertsWidget } from './SmartAlertsWidget';
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

// Memoized section header component
const SectionHeader = memo(({ 
  title, 
  sectionKey, 
  isCollapsed, 
  onToggle, 
  badge 
}: {
  title: string;
  sectionKey: string;
  isCollapsed: boolean;
  onToggle: (section: string) => void;
  badge?: string;
}) => {
  const handleToggle = useCallback(() => {
    onToggle(sectionKey);
  }, [onToggle, sectionKey]);

  return (
    <div className="flex items-center justify-between mb-4 flex-row-reverse">
      <div className="flex items-center gap-2 space-x-reverse">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleToggle}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
        {badge && (
          <Badge variant="outline" className="bg-background">
            {badge}
          </Badge>
        )}
      </div>
      <h2 className="text-lg font-semibold text-right">{title}</h2>
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';

export const DashboardContent: React.FC<DashboardContentProps> = memo(({
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

  // Memoized direction and style calculations
  const direction = useMemo(() => language === 'ar' ? 'rtl' : 'ltr', [language]);
  
  // Memoized badge text
  const fleetBadgeText = useMemo(() => 
    isLoading ? 'جاري التحميل...' : 'إجمالي المركبات',
    [isLoading]
  );
  
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-right" dir="rtl">
        فشل في تحميل بيانات لوحة التحكم
        {error && <p className="text-sm mt-1">{error.toString()}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={direction}>
      {/* 1. المؤشرات الرئيسية */}
      <div className="dashboard-section animate-fade-in">
        <SectionHeader
          title="المؤشرات الرئيسية"
          sectionKey="kpis"
          isCollapsed={collapsedSections['kpis']}
          onToggle={onToggleSection}
        />
        {!collapsedSections['kpis'] && <DashboardStats stats={stats} loading={isLoading} />}
      </div>

      {/* 2. الإجراءات السريعة */}
      <div className="dashboard-section animate-fade-in">
        <SectionHeader
          title="الإجراءات السريعة"
          sectionKey="quickActions"
          isCollapsed={collapsedSections['quickActions']}
          onToggle={onToggleSection}
        />
        {!collapsedSections['quickActions'] && <QuickActions />}
      </div>

      {/* 3. تحليلات النظام */}
      <div className="dashboard-section animate-fade-in">
        <SectionHeader
          title="تحليلات النظام"
          sectionKey="analytics"
          isCollapsed={collapsedSections['analytics']}
          onToggle={onToggleSection}
        />
        {!collapsedSections['analytics'] && <AdvancedAnalyticsPanel />}
      </div>
      
      {/* 4. حالة الأسطول */}
      <div className="dashboard-section animate-fade-in">
        <SectionHeader
          title="حالة الأسطول"
          sectionKey="fleet"
          isCollapsed={collapsedSections['fleet']}
          onToggle={onToggleSection}
          badge={fleetBadgeText}
        />
        {!collapsedSections['fleet'] && (
          isLoading ? <Skeleton className="h-[300px] w-full rounded-lg" /> : <VehicleStatusChart data={stats?.vehicleStats} />
        )}
      </div>

      {/* 5. الإحصائيات */}
      <div className="dashboard-section animate-fade-in">
        <SectionHeader
          title="الإحصائيات"
          sectionKey="realtime"
          isCollapsed={collapsedSections['realtime']}
          onToggle={onToggleSection}
        />
        {!collapsedSections['realtime'] && <RealTimeStatsWidget />}
      </div>

      {/* 6. التنبيهات */}
      <div className="dashboard-section animate-fade-in">
        <SectionHeader
          title="التنبيهات"
          sectionKey="alerts"
          isCollapsed={collapsedSections['alerts']}
          onToggle={onToggleSection}
        />
        {!collapsedSections['alerts'] && <SmartAlertsWidget />}
      </div>
    </div>
  );
});
