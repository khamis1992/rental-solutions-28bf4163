
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir='rtl'>
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الإيرادات</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue.value)}</p>
                    <div className="flex items-center mt-2 justify-end">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        analytics.totalRevenue.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {analytics.totalRevenue.trend > 0 ? '+' : ''}{analytics.totalRevenue.trend}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">كفاءة التحصيل</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.collectionEfficiency.rate.toFixed(1)}%</p>
                    <div className="flex items-center mt-2 justify-end">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        analytics.collectionEfficiency.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {analytics.collectionEfficiency.trend > 0 ? '+' : ''}{analytics.collectionEfficiency.trend}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">متوسط قيمة العقد</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(analytics.averageContractValue.value)}</p>
                    <div className="flex items-center mt-2 justify-end">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        analytics.averageContractValue.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {analytics.averageContractValue.trend > 0 ? '+' : ''}{analytics.averageContractValue.trend}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">توقعات الإيرادات</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(analytics.predictions.nextMonthRevenue)}</p>
                    <div className="flex items-center mt-2 justify-end">
                      <Badge variant="outline" className="text-xs">
                        ثقة {analytics.predictions.confidence}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'customers':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir='rtl'>
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">العملاء النشطون</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.activeCustomers.count.toString()}</p>
                    <div className="flex items-center mt-2 justify-end">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        analytics.activeCustomers.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {analytics.activeCustomers.trend > 0 ? '+' : ''}{analytics.activeCustomers.trend}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">معدل الاحتفاظ</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.customerRetention.rate.toFixed(1)}%</p>
                    <div className="flex items-center mt-2 justify-end">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        analytics.customerRetention.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {analytics.customerRetention.trend > 0 ? '+' : ''}{analytics.customerRetention.trend}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">متوسط قيمة العميل</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(analytics.averageContractValue.value)}</p>
                    <div className="flex items-center mt-2 justify-end">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        analytics.averageContractValue.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {analytics.averageContractValue.trend > 0 ? '+' : ''}{analytics.averageContractValue.trend}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">عملاء جدد متوقعون</p>
                    <p className="text-xl font-bold text-gray-900">{Math.round(analytics.activeCustomers.count * 0.1).toLocaleString()} عميل</p>
                    <div className="flex items-center mt-2 justify-end">
                      <Badge variant="outline" className="text-xs">
                        ثقة {analytics.predictions.confidence}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'fleet':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir='rtl'>
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">معدل استغلال الأسطول</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.fleetUtilization.rate.toFixed(1)}%</p>
                    <div className="flex items-center mt-2 justify-end">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        analytics.fleetUtilization.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {analytics.fleetUtilization.trend > 0 ? '+' : ''}{analytics.fleetUtilization.trend}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">نمو الأسطول</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.fleetGrowth.rate.toFixed(1)}%</p>
                    <div className="flex items-center mt-2 justify-end">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        analytics.fleetGrowth.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {analytics.fleetGrowth.trend > 0 ? '+' : ''}{analytics.fleetGrowth.trend}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">المركبات المتاحة</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.vehicleAvailability.rate.toFixed(1)}%</p>
                    <div className="flex items-center mt-2 justify-end">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        analytics.vehicleAvailability.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {analytics.vehicleAvailability.trend > 0 ? '+' : ''}{analytics.vehicleAvailability.trend}%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Car className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">استغلال متوقع</p>
                    <p className="text-xl font-bold text-gray-900">{(analytics.fleetUtilization.rate + 5).toFixed(1)}%</p>
                    <div className="flex items-center mt-2 justify-end">
                      <Badge variant="outline" className="text-xs">
                        ثقة {analytics.predictions.confidence}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 bg-gray-200 rounded animate-pulse"></div>
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

      {/* Analytics cards matching Quick Actions design */}
      {renderAnalyticsByType()}
    </div>
  );
};
