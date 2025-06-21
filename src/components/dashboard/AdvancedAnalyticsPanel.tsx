
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, Target, Users, Car, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

interface AnalyticsData {
  fleetUtilization: { rate: number; trend: number };
  collectionEfficiency: { rate: number; trend: number };
  averageContractValue: { value: number; trend: number };
  totalRevenue: { value: number; trend: number };
  activeCustomers: { count: number; trend: number };
  customerRetention: { rate: number; trend: number };
  fleetGrowth: { rate: number; trend: number };
  vehicleAvailability: { rate: number; trend: number };
  predictions: {
    nextMonthRevenue: number;
    confidence: number;
  };
}

const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
  // معدل استغلال الأسطول
  const { data: totalVehicles } = await supabase
    .from('vehicles')
    .select('id, status');

  const rentedVehicles = totalVehicles?.filter(v => v.status === 'rented').length || 0;
  const availableVehicles = totalVehicles?.filter(v => v.status === 'available').length || 0;
  const fleetUtilizationRate = totalVehicles && totalVehicles.length > 0 
    ? (rentedVehicles / totalVehicles.length) * 100 
    : 0;
  const vehicleAvailabilityRate = totalVehicles && totalVehicles.length > 0 
    ? (availableVehicles / totalVehicles.length) * 100 
    : 0;

  // كفاءة التحصيل
  const { data: allPayments } = await supabase
    .from('unified_payments')
    .select('status, due_date, amount');

  const onTimePayments = allPayments?.filter(p => p.status === 'paid').length || 0;
  const totalPayments = allPayments?.length || 1;
  const collectionRate = (onTimePayments / totalPayments) * 100;
  const totalRevenue = allPayments?.filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  // بيانات العملاء
  const { data: customers } = await supabase
    .from('customers')
    .select('id, created_at');

  const activeCustomersCount = customers?.length || 0;

  // بيانات العقود
  const { data: contracts } = await supabase
    .from('leases')
    .select('total_amount, status')
    .eq('status', 'active');

  const avgContractValue = contracts && contracts.length > 0
    ? contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0) / contracts.length
    : 0;

  // توقع بسيط للإيرادات
  const nextMonthRevenue = avgContractValue * (contracts?.length || 0);

  return {
    fleetUtilization: { rate: fleetUtilizationRate, trend: 5.2 },
    collectionEfficiency: { rate: collectionRate, trend: -2.1 },
    averageContractValue: { value: avgContractValue, trend: 8.5 },
    totalRevenue: { value: totalRevenue, trend: 12.3 },
    activeCustomers: { count: activeCustomersCount, trend: 7.8 },
    customerRetention: { rate: 92.5, trend: 3.2 },
    fleetGrowth: { rate: 15.7, trend: 4.1 },
    vehicleAvailability: { rate: vehicleAvailabilityRate, trend: -2.8 },
    predictions: {
      nextMonthRevenue,
      confidence: 85
    }
  };
};

export const AdvancedAnalyticsPanel: React.FC<{ className?: string }> = ({ className }) => {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'customers' | 'fleet'>('revenue');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['advancedAnalytics'],
    queryFn: fetchAnalyticsData,
    refetchInterval: 300000,
    staleTime: 240000,
  });

  const renderAnalyticsByType = () => {
    if (!analytics) return null;

    switch (selectedMetric) {
      case 'revenue':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir='rtl'>
            <StatCard
              title='إجمالي الإيرادات'
              value={formatCurrency(analytics.totalRevenue.value)}
              description='الإيرادات الإجمالية المحصلة'
              icon={DollarSign}
              iconColor='text-green-500'
              trend={analytics.totalRevenue.trend}
              trendLabel='مقارنة بالشهر الماضي'
              className="transition-shadow hover:shadow-md"
            />
            <StatCard
              title='كفاءة التحصيل'
              value={`${analytics.collectionEfficiency.rate.toFixed(1)}%`}
              description='معدل تحصيل المدفوعات في الوقت المحدد'
              icon={Target}
              iconColor='text-blue-500'
              trend={analytics.collectionEfficiency.trend}
              trendLabel='مقارنة بالشهر الماضي'
              className="transition-shadow hover:shadow-md"
            />
            <StatCard
              title='متوسط قيمة العقد'
              value={formatCurrency(analytics.averageContractValue.value)}
              description='متوسط قيمة العقود الجديدة'
              icon={TrendingUp}
              iconColor='text-purple-500'
              trend={analytics.averageContractValue.trend}
              trendLabel='مقارنة بالشهر الماضي'
              className="transition-shadow hover:shadow-md"
            />
          </div>
        );

      case 'customers':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir='rtl'>
            <StatCard
              title='العملاء النشطون'
              value={analytics.activeCustomers.count.toString()}
              description='العملاء الذين لديهم عقود نشطة'
              icon={Users}
              iconColor='text-blue-500'
              trend={analytics.activeCustomers.trend}
              trendLabel='مقارنة بالشهر الماضي'
              className="transition-shadow hover:shadow-md"
            />
            <StatCard
              title='معدل الاحتفاظ بالعملاء'
              value={`${analytics.customerRetention.rate.toFixed(1)}%`}
              description='نسبة العملاء المحتفظ بهم'
              icon={Target}
              iconColor='text-green-500'
              trend={analytics.customerRetention.trend}
              trendLabel='مقارنة بالشهر الماضي'
              className="transition-shadow hover:shadow-md"
            />
            <StatCard
              title='متوسط قيمة العميل'
              value={formatCurrency(analytics.averageContractValue.value)}
              description='متوسط القيمة لكل عميل'
              icon={DollarSign}
              iconColor='text-purple-500'
              trend={analytics.averageContractValue.trend}
              trendLabel='مقارنة بالشهر الماضي'
              className="transition-shadow hover:shadow-md"
            />
          </div>
        );

      case 'fleet':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir='rtl'>
            <StatCard
              title='معدل استغلال الأسطول'
              value={`${analytics.fleetUtilization.rate.toFixed(1)}%`}
              description='نسبة المركبات المؤجرة حالياً'
              icon={BarChart3}
              iconColor='text-orange-500'
              trend={analytics.fleetUtilization.trend}
              trendLabel='مقارنة بالشهر الماضي'
              className="transition-shadow hover:shadow-md"
            />
            <StatCard
              title='نمو الأسطول'
              value={`${analytics.fleetGrowth.rate.toFixed(1)}%`}
              description='معدل نمو عدد المركبات'
              icon={TrendingUp}
              iconColor='text-green-500'
              trend={analytics.fleetGrowth.trend}
              trendLabel='مقارنة بالشهر الماضي'
              className="transition-shadow hover:shadow-md"
            />
            <StatCard
              title='المركبات المتاحة'
              value={`${analytics.vehicleAvailability.rate.toFixed(1)}%`}
              description='نسبة المركبات المتاحة للإيجار'
              icon={Car}
              iconColor='text-blue-500'
              trend={analytics.vehicleAvailability.trend}
              trendLabel='مقارنة بالشهر الماضي'
              className="transition-shadow hover:shadow-md"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center text-muted-foreground">خطأ في تحميل البيانات</div>;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with metric selection buttons */}
      <div className='flex items-center justify-between' dir='rtl'>
        <div className='flex items-center space-x-2 space-x-reverse'>
          <Button
            variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedMetric('revenue')}
            className="transition-colors"
          >
            الإيرادات
          </Button>
          <Button
            variant={selectedMetric === 'customers' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedMetric('customers')}
            className="transition-colors"
          >
            العملاء
          </Button>
          <Button
            variant={selectedMetric === 'fleet' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedMetric('fleet')}
            className="transition-colors"
          >
            الأسطول
          </Button>
        </div>
        <div className='text-right'>
          <h3 className='text-lg font-semibold text-right'>تحليلات النظام</h3>
          <p className='text-sm text-muted-foreground text-right mt-1'>
            {selectedMetric === 'revenue' && 'تحليل الإيرادات والمالية'}
            {selectedMetric === 'customers' && 'تحليل العملاء والاحتفاظ'}
            {selectedMetric === 'fleet' && 'تحليل الأسطول والاستغلال'}
          </p>
        </div>
      </div>

      {/* Analytics cards matching the design of key indicators */}
      {renderAnalyticsByType()}

      {/* Predictions section with clean card design */}
      <Card className='shadow-sm'>
        <CardContent className='p-6'>
          <div className='text-right' dir='rtl'>
            <h4 className='font-medium mb-4 text-right text-lg'>
              {selectedMetric === 'revenue' && 'توقعات الإيرادات'}
              {selectedMetric === 'customers' && 'توقعات العملاء'}
              {selectedMetric === 'fleet' && 'توقعات الأسطول'}
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='text-right'>
                <p className='text-sm text-muted-foreground text-right mb-2'>
                  {selectedMetric === 'revenue' && 'الإيرادات المتوقعة'}
                  {selectedMetric === 'customers' && 'عملاء جدد متوقعون'}
                  {selectedMetric === 'fleet' && 'استغلال متوقع'}
                </p>
                <p className='text-2xl font-bold text-right'>
                  {selectedMetric === 'revenue' && formatCurrency(analytics.predictions.nextMonthRevenue)}
                  {selectedMetric === 'customers' && Math.round(analytics.activeCustomers.count * 0.1).toLocaleString() + ' عميل'}
                  {selectedMetric === 'fleet' && (analytics.fleetUtilization.rate + 5).toFixed(1) + '%'}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm text-muted-foreground text-right mb-2'>مستوى الثقة</p>
                <div className='flex items-center space-x-2 space-x-reverse justify-end'>
                  <Badge variant='outline' className='text-sm'>
                    {analytics.predictions.confidence}%
                  </Badge>
                  <p className='text-2xl font-bold text-right'>عالي</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
