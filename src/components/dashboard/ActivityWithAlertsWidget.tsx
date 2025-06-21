import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Car, User, CreditCard, Wrench, AlertTriangle, Clock, Filter, Bell, Eye, X } from 'lucide-react';
import { RecentActivity as RecentActivityType } from '@/hooks/use-dashboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface SmartAlert {
  id: string;
  type: 'maintenance' | 'payment' | 'contract' | 'vehicle';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionText?: string;
  createdAt: Date;
  isRead: boolean;
}

interface ActivityWithAlertsProps {
  activities: RecentActivityType[];
}

const fetchSmartAlerts = async (): Promise<SmartAlert[]> => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);
  const futureStr = futureDate.toISOString().split('T')[0];

  const alerts: SmartAlert[] = [];

  try {
    const { data: overduePayments } = await supabase
      .from('unified_payments')
      .select('id, amount, due_date')
      .eq('status', 'pending')
      .lt('due_date', todayStr);

    if (overduePayments && overduePayments.length > 0) {
      const totalAmount = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      alerts.push({
        id: 'overdue-payments',
        type: 'payment',
        priority: 'high',
        title: overduePayments.length + ' دفعة متأخرة',
        description: 'إجمالي المبلغ: ' + totalAmount.toLocaleString() + ' ر.ق',
        actionText: 'عرض الدفعات',
        createdAt: new Date(),
        isRead: false
      });
    }

    const { data: maintenanceVehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, mileage')
      .eq('status', 'maintenance');

    if (maintenanceVehicles && maintenanceVehicles.length > 5) {
      alerts.push({
        id: 'pending-maintenance',
        type: 'maintenance',
        priority: 'medium',
        title: maintenanceVehicles.length + ' مركبة في الصيانة',
        description: 'عدد كبير من المركبات تحتاج صيانة',
        actionText: 'عرض الصيانة',
        createdAt: new Date(),
        isRead: false
      });
    }

    const { data: expiringContracts } = await supabase
      .from('leases')
      .select('id, agreement_number, end_date')
      .eq('status', 'active')
      .gte('end_date', todayStr)
      .lte('end_date', futureStr);

    if (expiringContracts && expiringContracts.length > 0) {
      alerts.push({
        id: 'expiring-contracts',
        type: 'contract',
        priority: 'medium',
        title: expiringContracts.length + ' عقد ينتهي قريباً',
        description: 'خلال الـ 30 يوماً القادمة',
        actionText: 'عرض العقود',
        createdAt: new Date(),
        isRead: false
      });
    }

    // مركبات تحتاج فحص
    const { data: vehiclesNeedInspection } = await supabase
      .from('vehicles')
      .select('id, make, model, mileage')
      .eq('status', 'available')
      .gt('mileage', 50000);

    if (vehiclesNeedInspection && vehiclesNeedInspection.length > 3) {
      alerts.push({
        id: 'vehicles-need-inspection',
        type: 'vehicle',
        priority: 'low',
        title: vehiclesNeedInspection.length + ' مركبة تحتاج فحص',
        description: 'مركبات بمسافات عالية تحتاج فحص دوري',
        actionText: 'عرض المركبات',
        createdAt: new Date(),
        isRead: false
      });
    }
  } catch (error) {
    console.error('خطأ في جلب التنبيهات:', error);
  }

  return alerts;
};

export const ActivityWithAlertsWidget: React.FC<ActivityWithAlertsProps> = ({ activities }) => {
  const navigate = useNavigate();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const { t } = useTranslation();
  const { language } = useLanguage();

  const { data: alerts, isLoading: alertsLoading, refetch } = useQuery({
    queryKey: ['smartAlerts'],
    queryFn: fetchSmartAlerts,
    refetchInterval: 60000,
    staleTime: 50000,
  });

  const visibleAlerts = alerts?.filter(alert => !dismissedAlerts.includes(alert.id)) || [];
  const highPriorityCount = visibleAlerts.filter(a => a.priority === 'high').length;

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className='h-4 w-4 text-red-500' />;
      case 'medium': return <Clock className='h-4 w-4 text-yellow-500' />;
      case 'low': return <Bell className='h-4 w-4 text-blue-500' />;
      default: return <Bell className='h-4 w-4 text-gray-500' />;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'عاجل';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'عادي';
    }
  };

  const handleAlertAction = (alert: SmartAlert) => {
    if (alert.type === 'payment') {
      navigate('/financials');
    } else if (alert.type === 'maintenance') {
      navigate('/maintenance/');
    } else if (alert.type === 'contract') {
      navigate('/agreements/');
    } else if (alert.type === 'vehicle') {
      navigate('/vehicles');
    }
  };

  return (
    <Card className='col-span-4 card-transition dashboard-card' dir='rtl'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2 space-x-reverse'>
            {highPriorityCount > 0 && (
              <Badge variant='destructive'>
                {highPriorityCount} عاجل
              </Badge>
            )}
            <Button variant='ghost' size='sm' onClick={() => refetch()} className='h-8 w-8 p-0'>
              <Eye className='h-4 w-4' />
            </Button>
          </div>
          <div className='text-right'>
            <CardTitle className='text-right'>التنبيهات الذكية</CardTitle>
            <p className='text-sm text-muted-foreground text-right mt-1'>
              {visibleAlerts.length} تنبيه نشط
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {alertsLoading ? (
          <div className='flex items-center justify-center py-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
              <p className='text-sm text-muted-foreground'>جاري تحميل التنبيهات...</p>
            </div>
          </div>
        ) : visibleAlerts.length === 0 ? (
          <div className='text-center py-8'>
            <CheckCircle className='h-16 w-16 text-green-500 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-green-700 mb-2'>لا توجد تنبيهات</h3>
            <p className='text-muted-foreground'>جميع العمليات تسير بسلاسة</p>
            <p className='text-sm text-muted-foreground mt-1'>سيتم إشعارك عند ظهور أي مشاكل</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {visibleAlerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={cn('p-4 border-r-4 cursor-pointer hover:shadow-md transition-shadow', getPriorityColor(alert.priority))}
                onClick={() => handleAlertAction(alert)}
              >
                <div className='flex items-start justify-between'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissAlert(alert.id);
                    }}
                    className='h-6 w-6 p-0 flex-shrink-0'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                  <div className='flex-1 text-right mr-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <Badge variant='outline' className='text-xs'>
                        {getPriorityText(alert.priority)}
                      </Badge>
                      <div className='flex items-center space-x-2 space-x-reverse'>
                        {getPriorityIcon(alert.priority)}
                        <h4 className='font-medium text-right'>{alert.title}</h4>
                      </div>
                    </div>
                    <p className='text-sm text-muted-foreground text-right mb-3'>
                      {alert.description}
                    </p>
                    {alert.actionText && (
                      <div className='flex justify-end'>
                        <Button size='sm' variant='outline' className='text-xs'>
                          {alert.actionText}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className='pt-0'>
        <div className='w-full flex gap-2'>
          <Button variant='outline' className='flex-1 text-right' onClick={() => navigate('/alerts')}>
            عرض جميع التنبيهات
          </Button>
          <Button variant='ghost' size='sm' onClick={() => setDismissedAlerts([])}>
            إظهار المخفية
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
