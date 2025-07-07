
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardStats from './DashboardStats';
import { EnhancedVehicleStatusChart } from './vehicle-status/EnhancedVehicleStatusChart';
import { RealTimeStatsWidget } from './RealTimeStatsWidget';
import { SmartAnalyticsDashboard } from '../analytics/smart/SmartAnalyticsDashboard';
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
    <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* 1. المؤشرات الرئيسية */}
      <section className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-right text-foreground">المؤشرات الرئيسية</h2>
              <p className="text-sm text-muted-foreground text-right">إحصائيات شاملة للأداء</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 hover:bg-accent/50"
            onClick={() => onToggleSection('kpis')}
          >
            {collapsedSections['kpis'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsedSections['kpis'] && <DashboardStats stats={stats} loading={isLoading} />}
      </section>

      {/* 2. الإجراءات السريعة */}
      <section className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
              <ChevronDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-right text-foreground">العمليات السريعة</h2>
              <p className="text-sm text-muted-foreground text-right">أدوات الإدارة المباشرة</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 hover:bg-accent/50"
            onClick={() => onToggleSection('quickActions')}
          >
            {collapsedSections['quickActions'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsedSections['quickActions'] && <QuickActions />}
      </section>

      {/* 3. تحليلات النظام */}
      <section className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-right text-foreground">تحليلات متقدمة</h2>
              <p className="text-sm text-muted-foreground text-right">رؤى تفصيلية للأداء</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 hover:bg-accent/50"
            onClick={() => onToggleSection('analytics')}
          >
            {collapsedSections['analytics'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsedSections['analytics'] && <SmartAnalyticsDashboard />}
      </section>
      
      {/* 4. حالة الأسطول */}
      <section className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <ChevronDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-right text-foreground">حالة الأسطول</h2>
              <p className="text-sm text-muted-foreground text-right">
                {isLoading ? 'جاري التحميل...' : `${stats?.vehicleStats?.total || 0} مركبة`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background/50 border-border/50">
              {isLoading ? 'محاطة بالتحديث' : 'مُحدثة الآن'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 hover:bg-accent/50"
              onClick={() => onToggleSection('fleet')}
            >
              {collapsedSections['fleet'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
          {!collapsedSections['fleet'] && (
            <EnhancedVehicleStatusChart 
              data={stats?.vehicleStats} 
              loading={isLoading}
            />
          )}
      </section>

      {/* 5. الإحصائيات المباشرة */}
      <section className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-right text-foreground">الإحصائيات المباشرة</h2>
              <p className="text-sm text-muted-foreground text-right">بيانات آنية ومؤشرات</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 hover:bg-accent/50"
            onClick={() => onToggleSection('realtime')}
          >
            {collapsedSections['realtime'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsedSections['realtime'] && <RealTimeStatsWidget />}
      </section>

    </div>
  );
};
