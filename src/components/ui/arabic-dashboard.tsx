import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LayoutDashboard, 
  RefreshCw, 
  Settings, 
  Car, 
  DollarSign, 
  Users, 
  FileText,
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatQatarRiyal } from '@/utils/arabic-rtl-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ArabicDashboardProps {
  stats?: {
    vehicleStats: {
      total: number;
      available: number;
      rented: number;
      maintenance: number;
    };
    financialStats: {
      currentMonthRevenue: number;
      revenueGrowth: number;
    };
    customerStats: {
      active: number;
      total: number;
      growth: number;
    };
    agreementStats: {
      active: number;
      growth: number;
    };
  };
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * Enhanced Arabic RTL Dashboard Component
 * Provides a truly native Arabic experience with proper visual alignment
 */
export const ArabicDashboard: React.FC<ArabicDashboardProps> = ({
  stats,
  isLoading = false,
  onRefresh,
  isRefreshing = false
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  
  // Get current date in Arabic format
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => ({ 
      ...prev, 
      [section]: !prev[section] 
    }));
  }, []);

  // Arabic dashboard statistics configuration
  const dashboardStats = [
    {
      id: 'vehicles',
      title: 'إجمالي المركبات',
      value: isLoading ? '—' : stats?.vehicleStats.total.toString() || '0',
      description: isLoading ? 'جاري التحميل...' : `متاحة: ${stats?.vehicleStats.available || 0}`,
      icon: Car,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      trend: stats?.vehicleStats.available && stats?.vehicleStats.total > 0 
        ? Math.round((stats.vehicleStats.available / stats.vehicleStats.total) * 100) 
        : 0,
      trendLabel: 'معدل التوفر',
      onClick: () => navigate('/vehicles'),
      category: 'fleet'
    },
    {
      id: 'revenue',
      title: 'الإيرادات',
      value: isLoading ? '—' : formatQatarRiyal(stats?.financialStats.currentMonthRevenue || 0),
      description: isLoading ? 'جاري التحميل...' : 'هذا الشهر',
      icon: DollarSign,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      trend: stats?.financialStats.revenueGrowth || 0,
      trendLabel: 'مقارنة بالشهر الماضي',
      onClick: () => navigate('/financials'),
      category: 'financial'
    },
    {
      id: 'customers',
      title: 'العملاء النشطون',
      value: isLoading ? '—' : stats?.customerStats.active.toString() || '0',
      description: isLoading ? 'جاري التحميل...' : `الإجمالي: ${stats?.customerStats.total || 0}`,
      icon: Users,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-50',
      trend: stats?.customerStats.growth || 0,
      trendLabel: 'مقارنة بالشهر الماضي',
      onClick: () => navigate('/customers'),
      category: 'customers'
    },
    {
      id: 'agreements',
      title: 'العقود',
      value: isLoading ? '—' : stats?.agreementStats.active.toString() || '0',
      description: isLoading ? 'جاري التحميل...' : 'العقود النشطة',
      icon: FileText,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
      trend: stats?.agreementStats.growth || 0,
      trendLabel: 'مقارنة بالشهر الماضي',
      onClick: () => navigate('/agreements'),
      category: 'agreements'
    }
  ];

  // Quick actions for Arabic dashboard
  const quickActions = [
    {
      title: 'إضافة عميل جديد',
      description: 'تسجيل عميل جديد في النظام',
      icon: Users,
      color: 'bg-green-500',
      onClick: () => navigate('/customers/add')
    },
    {
      title: 'إضافة عقد جديد',
      description: 'إنشاء عقد تأجير جديد',
      icon: FileText,
      color: 'bg-violet-500',
      onClick: () => navigate('/agreements/add')
    },
    {
      title: 'إضافة مركبة',
      description: 'تسجيل مركبة جديدة في الأسطول',
      icon: Car,
      color: 'bg-blue-500',
      onClick: () => navigate('/vehicles/add')
    },
    {
      title: 'التقارير السريعة',
      description: 'الوصول إلى التقارير والإحصائيات',
      icon: Activity,
      color: 'bg-amber-500',
      onClick: () => navigate('/reports/quick')
    }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:flex-row-reverse">
        <div className="text-right">
          <div className="flex items-center gap-3 flex-row-reverse mb-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          </div>
          <p className="text-muted-foreground text-right">
            نظرة شاملة على عمليات التأجير • {currentDate}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-row-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-row-reverse"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/system-settings')}
            className="flex-row-reverse"
          >
            <Settings className="h-4 w-4 ml-2" />
            الإعدادات
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-right">
            الإجراءات السريعة
          </CardTitle>
          <p className="text-sm text-muted-foreground text-right">
            الوصول السريع للمهام الأساسية
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto py-4 justify-start flex flex-col items-center text-center hover:bg-accent/5"
                onClick={action.onClick}
              >
                <div className={`rounded-full p-2 ${action.color} bg-opacity-10 mb-2`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-center">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-row-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => toggleSection('kpis')}
          >
            {collapsedSections['kpis'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-right">المؤشرات الرئيسية</h2>
        </div>
        
        {!collapsedSections['kpis'] && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat) => (
              <Card 
                key={stat.id}
                className={cn(
                  "overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer hover:bg-accent/10",
                  stat.bgColor
                )}
                onClick={stat.onClick}
              >
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <div className="flex justify-between items-start flex-row-reverse">
                      <div className="p-3 rounded-full shrink-0 mr-3 transition-transform duration-300 hover:scale-110 bg-primary/10">
                        <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-medium text-muted-foreground text-right">
                          {stat.title}
                        </p>
                        <h3 className="text-2xl font-bold mt-2 tracking-tight truncate text-right arabic-numbers">
                          {stat.value}
                        </h3>
                        {stat.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate text-right">
                            {stat.description}
                          </p>
                        )}
                        
                        {stat.trend !== undefined && (
                          <div className="flex items-center mt-2 flex-row-reverse justify-end">
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full transition-colors flex items-center gap-1",
                              stat.trend > 0 ? "bg-green-100 text-green-700" : 
                              stat.trend < 0 ? "bg-red-100 text-red-700" : 
                              "bg-gray-100 text-gray-700"
                            )}>
                              {stat.trend > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : stat.trend < 0 ? (
                                <TrendingDown className="h-3 w-3" />
                              ) : null}
                              {stat.trend > 0 ? '+' : ''}{stat.trend}%
                            </span>
                            {stat.trendLabel && (
                              <span className="text-xs text-muted-foreground mr-2">
                                {stat.trendLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-right">ملخص الأداء</CardTitle>
          <p className="text-sm text-muted-foreground text-right">
            نظرة سريعة على أداء العمليات
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 arabic-numbers">
                {stats?.vehicleStats.available || 0}
              </div>
              <div className="text-sm text-blue-600 mt-1">مركبات متاحة</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 arabic-numbers">
                {formatQatarRiyal(stats?.financialStats.currentMonthRevenue || 0)}
              </div>
              <div className="text-sm text-green-600 mt-1">إيرادات الشهر</div>
            </div>
            <div className="text-center p-4 bg-violet-50 rounded-lg">
              <div className="text-2xl font-bold text-violet-600 arabic-numbers">
                {stats?.customerStats.active || 0}
              </div>
              <div className="text-sm text-violet-600 mt-1">عملاء نشطون</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 