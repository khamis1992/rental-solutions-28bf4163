import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle,
  Car,
  Settings,
  Calendar,
  TrendingUp,
  Zap,
  Activity
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

import { toast } from 'sonner';

interface SmartAlert {
  id: string;
  type: 'overdue' | 'upcoming' | 'urgent' | 'recommendation' | 'completed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  vehicleInfo: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    mileage: number;
  };
  maintenanceInfo: {
    type: string;
    dueDate: Date;
    lastService?: Date;
    estimatedCost?: number;
  };
  actions: Array<{
    id: string;
    label: string;
    labelEn: string;
    action: string;
    primary?: boolean;
  }>;
  isRead: boolean;
  isActive: boolean;
  createdAt: Date;
}

interface AlertSettings {
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  reminderDays: number;
  onlyUrgent: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export const SmartMaintenanceAlerts = () => {
  const { language } = useLanguage();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>({
    enableNotifications: true,
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    reminderDays: 7,
    onlyUrgent: false,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    }
  });
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Simulate smart alerts generation
  useEffect(() => {
    const generateSmartAlerts = () => {
      const mockAlerts: SmartAlert[] = [
        {
          id: '1',
          type: 'overdue',
          severity: 'critical',
          title: 'صيانة متأخرة بشكل حرج',
          titleEn: 'Critical Overdue Maintenance',
          message: 'تغيير زيت المحرك متأخر بـ 2000 كم، قد يتسبب في أضرار جسيمة',
          messageEn: 'Engine oil change overdue by 2000km, may cause severe engine damage',
          vehicleInfo: {
            id: 'v1',
            make: 'Toyota',
            model: 'Camry',
            licensePlate: 'أ ب ج 123',
            mileage: 57000
          },
          maintenanceInfo: {
            type: 'oil_change',
            dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            lastService: new Date(Date.now() - 125 * 24 * 60 * 60 * 1000),
            estimatedCost: 150
          },
          actions: [
            { id: 'schedule', label: 'جدولة فورية', labelEn: 'Schedule Now', action: 'schedule', primary: true },
            { id: 'view', label: 'عرض التفاصيل', labelEn: 'View Details', action: 'view' }
          ],
          isRead: false,
          isActive: true,
          createdAt: new Date(Date.now() - 60 * 60 * 1000)
        },
        {
          id: '2',
          type: 'upcoming',
          severity: 'medium',
          title: 'صيانة مجدولة قريباً',
          titleEn: 'Upcoming Scheduled Maintenance',
          message: 'فحص دوري مجدول خلال 3 أيام',
          messageEn: 'Routine inspection scheduled in 3 days',
          vehicleInfo: {
            id: 'v2',
            make: 'Honda',
            model: 'Civic',
            licensePlate: 'د هـ و 456',
            mileage: 32000
          },
          maintenanceInfo: {
            type: 'routine_inspection',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            lastService: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            estimatedCost: 200
          },
          actions: [
            { id: 'confirm', label: 'تأكيد الموعد', labelEn: 'Confirm Appointment', action: 'confirm', primary: true },
            { id: 'reschedule', label: 'إعادة جدولة', labelEn: 'Reschedule', action: 'reschedule' }
          ],
          isRead: true,
          isActive: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: '3',
          type: 'recommendation',
          severity: 'medium',
          title: 'توصية ذكية للصيانة',
          titleEn: 'Smart Maintenance Recommendation',
          message: 'بناءً على تحليل البيانات، ننصح بفحص الفرامل قريباً',
          messageEn: 'Based on data analysis, we recommend brake inspection soon',
          vehicleInfo: {
            id: 'v3',
            make: 'Nissan',
            model: 'Altima',
            licensePlate: 'ز ح ط 789',
            mileage: 45000
          },
          maintenanceInfo: {
            type: 'brake_service',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            estimatedCost: 300
          },
          actions: [
            { id: 'schedule', label: 'جدولة الفحص', labelEn: 'Schedule Inspection', action: 'schedule', primary: true },
            { id: 'dismiss', label: 'تجاهل', labelEn: 'Dismiss', action: 'dismiss' }
          ],
          isRead: false,
          isActive: true,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        {
          id: '4',
          type: 'urgent',
          severity: 'high',
          title: 'مشكلة عاجلة تحتاج انتباه',
          titleEn: 'Urgent Issue Requires Attention',
          message: 'مستوى سائل الفرامل منخفض - خطر على السلامة',
          messageEn: 'Low brake fluid level - safety risk detected',
          vehicleInfo: {
            id: 'v4',
            make: 'Toyota',
            model: 'Corolla',
            licensePlate: 'ك ل م 321',
            mileage: 28000
          },
          maintenanceInfo: {
            type: 'brake_fluid',
            dueDate: new Date(),
            estimatedCost: 80
          },
          actions: [
            { id: 'immediate', label: 'إصلاح فوري', labelEn: 'Immediate Repair', action: 'immediate', primary: true },
            { id: 'vehicle_stop', label: 'إيقاف المركبة', labelEn: 'Stop Vehicle', action: 'stop' }
          ],
          isRead: false,
          isActive: true,
          createdAt: new Date(Date.now() - 30 * 60 * 1000)
        }
      ];

      setAlerts(mockAlerts);
    };

    generateSmartAlerts();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-600 bg-red-50 text-red-800';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-gray-500 bg-gray-50 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'overdue': return AlertTriangle;
      case 'upcoming': return Clock;
      case 'urgent': return Zap;
      case 'recommendation': return TrendingUp;
      case 'completed': return CheckCircle;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'overdue': return 'text-red-600';
      case 'upcoming': return 'text-blue-600';
      case 'urgent': return 'text-orange-600';
      case 'recommendation': return 'text-purple-600';
      case 'completed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleAction = (alertId: string, actionId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    switch (actionId) {
      case 'schedule':
        toast.success(language === 'ar' ? 'تم فتح نافذة الجدولة' : 'Schedule dialog opened');
        break;
      case 'confirm':
        toast.success(language === 'ar' ? 'تم تأكيد الموعد' : 'Appointment confirmed');
        break;
      case 'dismiss':
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        toast.info(language === 'ar' ? 'تم تجاهل التنبيه' : 'Alert dismissed');
        break;
      case 'immediate':
        toast.error(language === 'ar' ? 'تم تفعيل الصيانة الطارئة' : 'Emergency maintenance activated');
        break;
      default:
        console.log('Action:', actionId, 'for alert:', alertId);
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const filteredAlerts = selectedSeverity === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.severity === selectedSeverity);

  const severityStats = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    unread: alerts.filter(a => !a.isRead).length
  };

  return (
    <Card className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={cn(
          "flex items-center gap-2",
          language === 'ar' ? 'flex-row-reverse text-right' : ''
        )}>
          <Bell className="h-5 w-5 text-orange-500 animate-pulse" />
          <span>{language === 'ar' ? 'التنبيهات الذكية للصيانة' : 'Smart Maintenance Alerts'}</span>
          <Badge variant="destructive" className="animate-bounce">
            {severityStats.unread}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alert Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-xl font-bold text-red-600">{severityStats.critical}</div>
            <div className="text-xs text-red-700">{language === 'ar' ? 'حرجة' : 'Critical'}</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-xl font-bold text-orange-600">{severityStats.high}</div>
            <div className="text-xs text-orange-700">{language === 'ar' ? 'عالية' : 'High'}</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-xl font-bold text-yellow-600">{severityStats.medium}</div>
            <div className="text-xs text-yellow-700">{language === 'ar' ? 'متوسطة' : 'Medium'}</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xl font-bold text-blue-600">{severityStats.low}</div>
            <div className="text-xs text-blue-700">{language === 'ar' ? 'منخفضة' : 'Low'}</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xl font-bold text-gray-600">{severityStats.unread}</div>
            <div className="text-xs text-gray-700">{language === 'ar' ? 'غير مقروءة' : 'Unread'}</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className={cn(
          "flex gap-2 flex-wrap",
          language === 'ar' ? 'flex-row-reverse' : ''
        )}>
          {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
            <Button
              key={severity}
              variant={selectedSeverity === severity ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSeverity(severity)}
              className="text-xs"
            >
              {severity === 'all' 
                ? (language === 'ar' ? 'الكل' : 'All')
                : severity === 'critical'
                ? (language === 'ar' ? 'حرجة' : 'Critical')
                : severity === 'high'
                ? (language === 'ar' ? 'عالية' : 'High')
                : severity === 'medium'
                ? (language === 'ar' ? 'متوسطة' : 'Medium')
                : (language === 'ar' ? 'منخفضة' : 'Low')
              }
            </Button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredAlerts.map((alert) => {
            const TypeIcon = getTypeIcon(alert.type);
            
            return (
              <Alert
                key={alert.id}
                className={cn(
                  "border-l-4 cursor-pointer transition-all hover:shadow-md",
                  getSeverityColor(alert.severity),
                  !alert.isRead && "ring-2 ring-blue-200",
                  language === 'ar' && 'border-l-0 border-r-4'
                )}
                onClick={() => markAsRead(alert.id)}
              >
                <div className={cn(
                  "flex items-start gap-4",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}>
                  <div className={cn("flex-shrink-0 mt-1", getTypeColor(alert.type))}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  
                  <div className={cn("flex-1", language === 'ar' ? 'text-right' : '')}>
                    <div className={cn(
                      "flex items-center justify-between mb-2",
                      language === 'ar' ? 'flex-row-reverse' : ''
                    )}>
                      <h4 className="font-semibold">
                        {language === 'ar' ? alert.title : alert.titleEn}
                      </h4>
                      
                      <div className={cn(
                        "flex items-center gap-2",
                        language === 'ar' ? 'flex-row-reverse' : ''
                      )}>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                        {!alert.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <AlertDescription className={cn(
                      "mb-3",
                      language === 'ar' ? 'text-right' : ''
                    )}>
                      {language === 'ar' ? alert.message : alert.messageEn}
                    </AlertDescription>
                    
                    <div className={cn(
                      "flex items-center gap-2 text-sm text-gray-600 mb-3",
                      language === 'ar' ? 'flex-row-reverse text-right' : ''
                    )}>
                      <Car className="h-4 w-4" />
                      <span>
                        {alert.vehicleInfo.make} {alert.vehicleInfo.model} - {alert.vehicleInfo.licensePlate}
                      </span>
                      <span className="text-xs">
                        ({alert.vehicleInfo.mileage.toLocaleString()} {language === 'ar' ? 'كم' : 'km'})
                      </span>
                    </div>
                    
                    {alert.maintenanceInfo.estimatedCost && (
                      <div className={cn(
                        "flex items-center gap-2 text-sm text-gray-600 mb-3",
                        language === 'ar' ? 'flex-row-reverse text-right' : ''
                      )}>
                        <span>{language === 'ar' ? 'التكلفة المقدرة:' : 'Estimated Cost:'}</span>
                        <span className="font-medium">
                          {alert.maintenanceInfo.estimatedCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex gap-2",
                      language === 'ar' ? 'flex-row-reverse' : ''
                    )}>
                      {alert.actions.map((action) => (
                        <Button
                          key={action.id}
                          size="sm"
                          variant={action.primary ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(alert.id, action.id);
                          }}
                        >
                          {language === 'ar' ? action.label : action.labelEn}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })}
        </div>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle className={cn(
              "text-sm flex items-center gap-2",
              language === 'ar' ? 'flex-row-reverse text-right' : ''
            )}>
              <Settings className="h-4 w-4" />
              {language === 'ar' ? 'إعدادات التنبيهات' : 'Alert Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              "flex items-center justify-between",
              language === 'ar' ? 'flex-row-reverse' : ''
            )}>
              <span className="text-sm">
                {language === 'ar' ? 'تفعيل التنبيهات' : 'Enable Notifications'}
              </span>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enableNotifications: checked }))
                }
              />
            </div>
            
            <div className={cn(
              "flex items-center justify-between",
              language === 'ar' ? 'flex-row-reverse' : ''
            )}>
              <span className="text-sm">
                {language === 'ar' ? 'تنبيهات البريد الإلكتروني' : 'Email Alerts'}
              </span>
              <Switch
                checked={settings.enableEmailAlerts}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enableEmailAlerts: checked }))
                }
              />
            </div>
            
            <div className={cn(
              "flex items-center justify-between",
              language === 'ar' ? 'flex-row-reverse' : ''
            )}>
              <span className="text-sm">
                {language === 'ar' ? 'العاجل فقط' : 'Urgent Only'}
              </span>
              <Switch
                checked={settings.onlyUrgent}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, onlyUrgent: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
