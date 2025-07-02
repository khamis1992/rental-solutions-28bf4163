import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AlertTriangle, Clock, CheckCircle, Bell, X, Eye } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

  // صيانة معلقة
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

  return alerts;
};

export const SmartAlertsWidget: React.FC<{ className?: string }> = ({ className }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

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
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Bell className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded"></div>;
  }

  return (
    <Card className={cn("border-0 shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between" dir="rtl">
          <div className="text-left">
            <CardTitle className="text-lg font-medium text-left">التنبيهات الذكية</CardTitle>
            <p className="text-sm text-muted-foreground text-left mt-1">
              {visibleAlerts.length} تنبيه نشط
            </p>
          </div>
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
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {visibleAlerts.length === 0 ? (
          <div className="text-center py-8" dir="rtl">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">لا توجد تنبيهات في الوقت الحالي</p>
            <p className="text-sm text-muted-foreground">جميع العمليات تسير بسلاسة</p>
          </div>
        ) : (
          <div className="space-y-3" dir="rtl">
            {visibleAlerts.map((alert) => (
              <Card key={alert.id} className={cn("p-4 border-l-4", getPriorityColor(alert.priority))}>
                <div className="flex items-start justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-right mr-3">
                    <div className="flex items-center space-x-2 space-x-reverse mb-1">
                      {getPriorityIcon(alert.priority)}
                      <h4 className="font-medium text-right">{alert.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground text-right mb-2">
                      {alert.description}
                    </p>
                    {alert.actionText && (
                      <Button size="sm" variant="outline" className="text-xs">
                        {alert.actionText}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
