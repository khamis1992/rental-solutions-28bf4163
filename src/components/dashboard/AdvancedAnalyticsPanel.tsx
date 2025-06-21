import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, Target, Users, Car, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

  const MetricCard = ({ 
    title, 
    value, 
    trend, 
    suffix = '', 
    icon: Icon,
    target,
    color = 'blue'
  }: {
    title: string;
    value: number;
    trend: number;
    suffix?: string;
    icon: any;
    target?: number;
    color?: string;
  }) => (
    <Card className='p-4 hover:shadow-lg transition-shadow'>
      <div className='flex items-center justify-between' dir='rtl'>
        <div className='flex items-center space-x-2 space-x-reverse'>
          <div className={cn('rounded-full p-2', {
            'bg-blue-100': color === 'blue',
            'bg-green-100': color === 'green',
            'bg-purple-100': color === 'purple',
            'bg-orange-100': color === 'orange'
          })}>
            <Icon className={cn('h-4 w-4', {
              'text-blue-600': color === 'blue',
              'text-green-600': color === 'green', 
              'text-purple-600': color === 'purple',
              'text-orange-600': color === 'orange'
            })} />
          </div>
          <div className='flex items-center space-x-1 space-x-reverse'>
            {trend > 0 ? (
              <TrendingUp className='h-3 w-3 text-green-500' />
            ) : (
              <TrendingDown className='h-3 w-3 text-red-500' />
            )}
            <span className={cn(
              'text-xs font-medium',
              trend > 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className='text-right'>
          <p className='text-sm font-medium text-muted-foreground text-right'>
            {title}
          </p>
          <p className='text-2xl font-bold text-right'>
            {value.toLocaleString()}{suffix}
          </p>
          {target && (
            <p className='text-xs text-muted-foreground text-right'>
              الهدف: {target.toLocaleString()}{suffix}
            </p>
          )}
        </div>
      </div>
    </Card>
  );

  const renderAnalyticsByType = () => {
    if (!analytics) return null;

    switch (selectedMetric) {
      case 'revenue':
        return (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6' dir='rtl'>
            <MetricCard
              title='إجمالي الإيرادات'
              value={analytics.totalRevenue.value}
              trend={analytics.totalRevenue.trend}
              suffix=' ر.ق'
              icon={DollarSign}
              color='green'
            />
            <MetricCard
              title='كفاءة التحصيل'
              value={analytics.collectionEfficiency.rate}
              trend={analytics.collectionEfficiency.trend}
              suffix='%'
              icon={Target}
              target={95}
              color='blue'
            />
            <MetricCard
              title='متوسط قيمة العقد'
              value={analytics.averageContractValue.value}
              trend={analytics.averageContractValue.trend}
              suffix=' ر.ق'
              icon={TrendingUp}
              color='purple'
            />
          </div>
        );

      case 'customers':
        return (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6' dir='rtl'>
            <MetricCard
              title='العملاء النشطون'
              value={analytics.activeCustomers.count}
              trend={analytics.activeCustomers.trend}
              suffix=''
              icon={Users}
              color='blue'
            />
            <MetricCard
              title='معدل الاحتفاظ بالعملاء'
              value={analytics.customerRetention.rate}
              trend={analytics.customerRetention.trend}
              suffix='%'
              icon={Target}
              target={95}
              color='green'
            />
            <MetricCard
              title='متوسط قيمة العميل'
              value={analytics.averageContractValue.value}
              trend={analytics.averageContractValue.trend}
              suffix=' ر.ق'
              icon={DollarSign}
              color='purple'
            />
          </div>
        );

      case 'fleet':
        return (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6' dir='rtl'>
            <MetricCard
              title='معدل استغلال الأسطول'
              value={analytics.fleetUtilization.rate}
              trend={analytics.fleetUtilization.trend}
              suffix='%'
              icon={BarChart3}
              target={80}
              color='orange'
            />
            <MetricCard
              title='نمو الأسطول'
              value={analytics.fleetGrowth.rate}
              trend={analytics.fleetGrowth.trend}
              suffix='%'
              icon={TrendingUp}
              color='green'
            />
            <MetricCard
              title='المركبات المتاحة'
              value={analytics.vehicleAvailability.rate}
              trend={analytics.vehicleAvailability.trend}
              suffix='%'
              icon={Car}
              target={30}
              color='blue'
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className='animate-pulse bg-gray-200 h-64 rounded'></div>;
  }

  if (!analytics) {
    return <div>خطأ في تحميل البيانات</div>;
  }

  return (
    <Card className={cn('border-0 shadow-md', className)}>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between' dir='rtl'>
          <div className='flex items-center space-x-2 space-x-reverse'>
            <Button
              variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedMetric('revenue')}
            >
              الإيرادات
            </Button>
            <Button
              variant={selectedMetric === 'customers' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedMetric('customers')}
            >
              العملاء
            </Button>
            <Button
              variant={selectedMetric === 'fleet' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedMetric('fleet')}
            >
              الأسطول
            </Button>
          </div>
          <div className='text-right'>
            <CardTitle className='text-lg font-medium text-right'>التحليلات المتقدمة</CardTitle>
            <p className='text-sm text-muted-foreground text-right mt-1'>
              {selectedMetric === 'revenue' && 'تحليل الإيرادات والمالية'}
              {selectedMetric === 'customers' && 'تحليل العملاء والاحتفاظ'}
              {selectedMetric === 'fleet' && 'تحليل الأسطول والاستغلال'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='pt-2'>
        {renderAnalyticsByType()}

        <Card className='p-4 bg-gradient-to-r from-blue-50 to-indigo-50'>
          <div className='text-right' dir='rtl'>
            <h4 className='font-medium mb-2 text-right'>
              {selectedMetric === 'revenue' && 'توقعات الإيرادات'}
              {selectedMetric === 'customers' && 'توقعات العملاء'}
              {selectedMetric === 'fleet' && 'توقعات الأسطول'}
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='text-right'>
                <p className='text-sm text-muted-foreground text-right'>
                  {selectedMetric === 'revenue' && 'الإيرادات المتوقعة'}
                  {selectedMetric === 'customers' && 'عملاء جدد متوقعون'}
                  {selectedMetric === 'fleet' && 'استغلال متوقع'}
                </p>
                <p className='text-xl font-bold text-right'>
                  {selectedMetric === 'revenue' && analytics.predictions.nextMonthRevenue.toLocaleString() + ' ر.ق'}
                  {selectedMetric === 'customers' && Math.round(analytics.activeCustomers.count * 0.1).toLocaleString() + ' عميل'}
                  {selectedMetric === 'fleet' && (analytics.fleetUtilization.rate + 5).toFixed(1) + '%'}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm text-muted-foreground text-right'>مستوى الثقة</p>
                <div className='flex items-center space-x-2 space-x-reverse'>
                  <Badge variant='outline'>
                    {analytics.predictions.confidence}%
                  </Badge>
                  <p className='text-xl font-bold text-right'>عالي</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};
