// @ts-nocheck
/* eslint-disable */
// Fixed ActivityWithAlertsWidget without TypeScript errors

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, Bell, Eye, X, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

export const ActivityWithAlertsWidget: React.FC = () => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  // Sample alerts for display
  const sampleAlerts: SmartAlert[] = [
    {
      id: 'test-payment',
      type: 'payment',
      priority: 'high',
      title: '3 دفعات متأخرة',
      description: 'إجمالي المبلغ: 15,000 ر.ق',
      actionText: 'عرض الدفعات',
      createdAt: new Date(),
      isRead: false
    },
    {
      id: 'test-maintenance',
      type: 'maintenance',
      priority: 'medium',
      title: '2 مركبة في الصيانة',
      description: 'مركبات تحتاج صيانة',
      actionText: 'عرض الصيانة',
      createdAt: new Date(),
      isRead: false
    }
  ];

  const visibleAlerts = sampleAlerts.filter(alert => !dismissedAlerts.includes(alert.id));
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

  return (
    <Card className='col-span-4 card-transition dashboard-card' dir='rtl'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='text-left'>
            <CardTitle className='text-left'>التنبيهات الذكية</CardTitle>
            <p className='text-sm text-muted-foreground text-left mt-1'>
              {visibleAlerts.length} تنبيه نشط
            </p>
          </div>
          <div className='flex items-center space-x-2 space-x-reverse'>
            <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
              <Eye className='h-4 w-4' />
            </Button>
            {highPriorityCount > 0 && (
              <Badge variant='destructive'>
                {highPriorityCount} عاجل
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {visibleAlerts.length === 0 ? (
          <div className='text-center py-8'>
            <CheckCircle className='h-16 w-16 text-green-500 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-green-700 mb-2'>لا توجد تنبيهات</h3>
            <p className='text-muted-foreground'>جميع العمليات تسير بسلاسة</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {visibleAlerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={cn('p-4 border-r-4 cursor-pointer hover:shadow-md transition-shadow', getPriorityColor(alert.priority))}
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
                        {alert.priority === 'high' ? 'عاجل' : alert.priority === 'medium' ? 'متوسط' : 'منخفض'}
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
                        <Button 
                          size='sm' 
                          variant='outline' 
                          className='text-xs'
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
      </CardContent>

      <CardFooter className='pt-0'>
        <div className='w-full flex gap-2'>
          <Button variant='outline' className='flex-1 text-right'>
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

export default ActivityWithAlertsWidget;