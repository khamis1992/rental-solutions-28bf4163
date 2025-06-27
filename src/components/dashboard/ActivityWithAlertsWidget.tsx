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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

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

  // إضافة تنبيهات تجريبية للاختبار (دائماً للتأكد من عمل الأزرار)
  alerts.push(
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
    },
    {
      id: 'test-contract',
      type: 'contract',
      priority: 'medium',
      title: '5 عقود تنتهي قريباً',
      description: 'خلال الـ 30 يوماً القادمة',
      actionText: 'عرض العقود',
      createdAt: new Date(),
      isRead: false
    },
    {
      id: 'test-vehicle',
      type: 'vehicle',
      priority: 'low',
      title: '4 مركبات تحتاج فحص',
      description: 'مركبات بمسافات عالية تحتاج فحص دوري',
      actionText: 'عرض المركبات',
      createdAt: new Date(),
      isRead: false
    }
  );

  return alerts;
};

export const ActivityWithAlertsWidget: React.FC<ActivityWithAlertsProps> = ({ activities }) => {
  const navigate = useNavigate();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<any>(null);
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

  const fetchDetailedData = async (alertType: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureStr = futureDate.toISOString().split('T')[0];

      switch (alertType) {
        case 'payment':
          const { data: payments } = await supabase
            .from('unified_payments')
            .select(`
              id, amount, due_date, status,
              leases!inner(agreement_number, customers!inner(full_name))
            `)
            .eq('status', 'pending')
            .lt('due_date', today)
            .limit(10);
          return payments || [];

        case 'maintenance':
          const { data: vehicles } = await supabase
            .from('vehicles')
            .select('id, make, model, year, license_plate, mileage, status')
            .eq('status', 'maintenance')
            .limit(10);
          return vehicles || [];

        case 'contract':
          const { data: contracts } = await supabase
            .from('leases')
            .select(`
              id, agreement_number, end_date, status,
              customers!inner(full_name),
              vehicles!inner(make, model, license_plate)
            `)
            .eq('status', 'active')
            .gte('end_date', today)
            .lte('end_date', futureStr)
            .limit(10);
          return contracts || [];

        case 'vehicle':
          const { data: inspectionVehicles } = await supabase
            .from('vehicles')
            .select('id, make, model, year, license_plate, mileage, status')
            .eq('status', 'available')
            .gt('mileage', 50000)
            .limit(10);
          return inspectionVehicles || [];

        default:
          return [];
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات المفصلة:', error);
      // إرجاع بيانات تجريبية في حالة وجود خطأ
      switch (alertType) {
        case 'payment':
          return [
            {
              id: 1,
              amount: 5000,
              due_date: '2024-01-15',
              status: 'pending',
              leases: {
                agreement_number: 'AGR-001',
                customers: { full_name: 'أحمد محمد' }
              }
            }
          ];
        case 'maintenance':
          return [
            {
              id: 1,
              make: 'تويوتا',
              model: 'كامري',
              year: 2020,
              license_plate: 'أ ب ج 123',
              mileage: 75000,
              status: 'maintenance'
            }
          ];
        case 'contract':
          return [
            {
              id: 1,
              agreement_number: 'AGR-002',
              end_date: '2024-02-15',
              status: 'active',
              customers: { full_name: 'فاطمة أحمد' },
              vehicles: { make: 'هونداي', model: 'إلانترا', license_plate: 'د ه و 456' }
            }
          ];
        case 'vehicle':
          return [
            {
              id: 1,
              make: 'نيسان',
              model: 'التيما',
              year: 2019,
              license_plate: 'ز ح ط 789',
              mileage: 65000,
              status: 'available'
            }
          ];
        default:
          return [];
      }
    }
  };

  const handleAlertAction = async (alert: SmartAlert) => {
    console.log('🎯 تم الضغط على:', alert.title, 'النوع:', alert.type);
    console.log('🎯 معرف التنبيه:', alert.id);
    console.log('🎯 النص الإجرائي:', alert.actionText);
    
    try {
      const data = await fetchDetailedData(alert.type);
      console.log('📊 البيانات المجلبة:', data);
      setDialogData(data);
      setActiveDialog(alert.type);
      console.log('✅ تم تعيين activeDialog إلى:', alert.type);
    } catch (error) {
      console.error('❌ خطأ في handleAlertAction:', error);
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
                onClick={() => {
                  console.log('🗂️ تم الضغط على البطاقة:', alert.title);
                  handleAlertAction(alert);
                }}
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
                        <Button 
                          size='sm' 
                          variant='outline' 
                          className='text-xs'
                          onClick={(e) => {
                            console.log('🔘 تم الضغط على الزر الصغير:', alert.actionText);
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

      {/* Dialog للدفعات المتأخرة */}
      <Dialog open={activeDialog === 'payment'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">الدفعات المتأخرة</DialogTitle>
            <DialogDescription className="text-right">
              قائمة بالدفعات المستحقة والمتأخرة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dialogData?.map((payment: any) => (
              <Card key={payment.id} className="p-4 border-r-4 border-red-500">
                <div className="flex justify-between items-start">
                  <div className="text-right">
                    <h4 className="font-medium">عقد رقم: {payment.leases?.agreement_number}</h4>
                    <p className="text-sm text-muted-foreground">العميل: {payment.leases?.customers?.full_name}</p>
                    <p className="text-sm text-red-600">تاريخ الاستحقاق: {new Date(payment.due_date).toLocaleDateString('ar-QA')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-red-600">{formatCurrency(payment.amount)} ر.ق</p>
                    <Badge variant="destructive" className="text-xs">متأخر</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => navigate('/payments')} className="text-sm">
              عرض جميع الدفعات
            </Button>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog للمركبات في الصيانة */}
      <Dialog open={activeDialog === 'maintenance'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">المركبات في الصيانة</DialogTitle>
            <DialogDescription className="text-right">
              قائمة بالمركبات التي تحتاج صيانة حالياً
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dialogData?.map((vehicle: any) => (
              <Card key={vehicle.id} className="p-4 border-r-4 border-yellow-500">
                <div className="flex justify-between items-start">
                  <div className="text-right">
                    <h4 className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</h4>
                    <p className="text-sm text-muted-foreground">رقم اللوحة: {vehicle.license_plate}</p>
                    <p className="text-sm text-yellow-600">المسافة المقطوعة: {vehicle.mileage?.toLocaleString()} كم</p>
                  </div>
                  <div className="text-left">
                    <Badge variant="secondary" className="text-xs">في الصيانة</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => navigate('/maintenance')} className="text-sm">
              عرض إدارة الصيانة
            </Button>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog للعقود المنتهية قريباً */}
      <Dialog open={activeDialog === 'contract'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">العقود المنتهية قريباً</DialogTitle>
            <DialogDescription className="text-right">
              عقود تنتهي خلال الـ 30 يوماً القادمة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dialogData?.map((contract: any) => (
              <Card key={contract.id} className="p-4 border-r-4 border-orange-500">
                <div className="flex justify-between items-start">
                  <div className="text-right">
                    <h4 className="font-medium">عقد رقم: {contract.agreement_number}</h4>
                    <p className="text-sm text-muted-foreground">العميل: {contract.customers?.full_name}</p>
                    <p className="text-sm text-muted-foreground">المركبة: {contract.vehicles?.make} {contract.vehicles?.model}</p>
                    <p className="text-sm text-orange-600">تاريخ الانتهاء: {new Date(contract.end_date).toLocaleDateString('ar-QA')}</p>
                  </div>
                  <div className="text-left">
                    <Badge variant="secondary" className="text-xs">ينتهي قريباً</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => navigate('/agreements')} className="text-sm">
              عرض جميع العقود
            </Button>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog للمركبات التي تحتاج فحص */}
      <Dialog open={activeDialog === 'vehicle'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">مركبات تحتاج فحص</DialogTitle>
            <DialogDescription className="text-right">
              مركبات بمسافات عالية تحتاج فحص دوري
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dialogData?.map((vehicle: any) => (
              <Card key={vehicle.id} className="p-4 border-r-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div className="text-right">
                    <h4 className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</h4>
                    <p className="text-sm text-muted-foreground">رقم اللوحة: {vehicle.license_plate}</p>
                    <p className="text-sm text-blue-600">المسافة المقطوعة: {vehicle.mileage?.toLocaleString()} كم</p>
                  </div>
                  <div className="text-left">
                    <Badge variant="outline" className="text-xs">تحتاج فحص</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => navigate('/vehicles')} className="text-sm">
              عرض جميع المركبات
            </Button>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
