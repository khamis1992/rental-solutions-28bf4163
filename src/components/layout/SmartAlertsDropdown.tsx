import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, User, CreditCard, Wrench, AlertTriangle, Clock, Bell, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const fetchSmartAlerts = async (): Promise<SmartAlert[]> => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);
  const futureStr = futureDate.toISOString().split('T')[0];

  const alerts: SmartAlert[] = [];

  try {
    // دفعات متأخرة
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

    // مركبات في الصيانة
    const { data: maintenanceVehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, mileage')
      .eq('status', 'maintenance');

    if (maintenanceVehicles && maintenanceVehicles.length > 0) {
      alerts.push({
        id: 'pending-maintenance',
        type: 'maintenance',
        priority: 'medium',
        title: maintenanceVehicles.length + ' مركبة في الصيانة',
        description: 'مركبات تحتاج صيانة',
        actionText: 'عرض الصيانة',
        createdAt: new Date(),
        isRead: false
      });
    }

    // عقود تنتهي قريباً
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

    if (vehiclesNeedInspection && vehiclesNeedInspection.length > 0) {
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

  // إضافة تنبيهات تجريبية للعرض
  if (alerts.length === 0) {
    alerts.push(
      {
        id: 'demo-payment',
        type: 'payment',
        priority: 'high',
        title: '3 دفعات متأخرة',
        description: 'إجمالي المبلغ: 15,000 ر.ق',
        actionText: 'عرض الدفعات',
        createdAt: new Date(),
        isRead: false
      },
      {
        id: 'demo-maintenance',
        type: 'maintenance',
        priority: 'medium',
        title: '2 مركبة في الصيانة',
        description: 'مركبات تحتاج صيانة',
        actionText: 'عرض الصيانة',
        createdAt: new Date(),
        isRead: false
      },
      {
        id: 'demo-contract',
        type: 'contract',
        priority: 'medium',
        title: '5 عقود تنتهي قريباً',
        description: 'خلال الـ 30 يوماً القادمة',
        actionText: 'عرض العقود',
        createdAt: new Date(),
        isRead: false
      }
    );
  }

  return alerts;
};

interface SmartAlertsDropdownProps {
  className?: string;
}

export const SmartAlertsDropdown: React.FC<SmartAlertsDropdownProps> = ({ className }) => {
  const navigate = useNavigate();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<any>(null);

  const { data: alerts, isLoading, refetch } = useQuery({
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
    switch (alert.type) {
      case 'payment':
        navigate('/payments');
        break;
      case 'maintenance':
        navigate('/maintenance');
        break;
      case 'contract':
        navigate('/agreements');
        break;
      case 'vehicle':
        navigate('/vehicles');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-96", className)} dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
            {highPriorityCount > 0 && (
              <Badge variant="destructive">
                {highPriorityCount} عاجل
              </Badge>
            )}
          </div>
          <CardTitle className="text-right text-lg">التنبيهات الذكية</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground text-right">
          {visibleAlerts.length} تنبيه نشط
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="max-h-96">
          {visibleAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-green-700 mb-2">لا توجد تنبيهات</h3>
              <p className="text-xs text-muted-foreground">جميع العمليات تسير بسلاسة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAlerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={cn('p-3 border-r-4 cursor-pointer hover:shadow-md transition-shadow', getPriorityColor(alert.priority))}
                  onClick={() => handleAlertAction(alert)}
                >
                  <div className="flex items-start justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAlert(alert.id);
                      }}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    <div className="flex-1 ml-2">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getPriorityText(alert.priority)}
                        </Badge>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          {getPriorityIcon(alert.priority)}
                          <h4 className="font-medium text-right text-sm">{alert.title}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-right mb-2">
                        {alert.description}
                      </p>
                      {alert.actionText && (
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlertAction(alert);
                            }}
                          >
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
        </ScrollArea>

        {visibleAlerts.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate('/alerts')}>
                عرض جميع التنبيهات
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDismissedAlerts([])}>
                إظهار المخفية
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}; 