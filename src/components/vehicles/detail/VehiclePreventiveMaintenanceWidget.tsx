import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  Gauge, 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VehicleData } from '@/types/vehicle.types';

interface MaintenanceRule {
  id: string;
  type: 'oil_change' | 'tire_rotation' | 'brake_inspection' | 'general_service';
  intervalKm: number;
  intervalDays: number;
  lastServiceKm?: number;
  lastServiceDate?: string;
  nextDueKm: number;
  nextDueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface VehiclePreventiveMaintenanceWidgetProps {
  vehicle: VehicleData;
  onScheduleService?: (ruleId: string) => void;
}

export const VehiclePreventiveMaintenanceWidget: React.FC<VehiclePreventiveMaintenanceWidgetProps> = ({
  vehicle,
  onScheduleService
}) => {
  const { language } = useLanguage();
  const [maintenanceRules, setMaintenanceRules] = useState<MaintenanceRule[]>([]);

  useEffect(() => {
    generateMaintenanceRules();
  }, [vehicle]);

  const generateMaintenanceRules = () => {
    const currentMileage = vehicle.mileage || 0;
    const rules: MaintenanceRule[] = [
      {
        id: 'oil_change',
        type: 'oil_change',
        intervalKm: 10000,
        intervalDays: 180,
        lastServiceKm: currentMileage - 8500, // آخر تغيير زيت
        lastServiceDate: '2024-01-15',
        nextDueKm: currentMileage + 1500,
        nextDueDate: '2024-07-15',
        priority: currentMileage >= (currentMileage - 8500 + 9000) ? 'high' : 'medium'
      },
      {
        id: 'tire_rotation',
        type: 'tire_rotation',
        intervalKm: 8000,
        intervalDays: 120,
        lastServiceKm: currentMileage - 6000,
        lastServiceDate: '2024-02-01',
        nextDueKm: currentMileage + 2000,
        nextDueDate: '2024-06-01',
        priority: 'medium'
      },
      {
        id: 'brake_inspection',
        type: 'brake_inspection',
        intervalKm: 15000,
        intervalDays: 365,
        lastServiceKm: currentMileage - 12000,
        lastServiceDate: '2023-12-01',
        nextDueKm: currentMileage + 3000,
        nextDueDate: '2024-12-01',
        priority: 'low'
      },
      {
        id: 'general_service',
        type: 'general_service',
        intervalKm: 20000,
        intervalDays: 365,
        lastServiceKm: currentMileage - 19500,
        lastServiceDate: '2023-06-01',
        nextDueKm: currentMileage + 500,
        nextDueDate: '2024-06-01',
        priority: 'critical'
      }
    ];

    setMaintenanceRules(rules);
  };

  const getServiceTypeLabel = (type: string) => {
    const labels = language === 'ar' ? {
      'oil_change': 'تغيير الزيت',
      'tire_rotation': 'دوران الإطارات',
      'brake_inspection': 'فحص الفرامل',
      'general_service': 'خدمة عامة'
    } : {
      'oil_change': 'Oil Change',
      'tire_rotation': 'Tire Rotation',
      'brake_inspection': 'Brake Inspection',
      'general_service': 'General Service'
    };

    return labels[type as keyof typeof labels] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels = language === 'ar' ? {
      'critical': 'حرجة',
      'high': 'عالية',
      'medium': 'متوسطة',
      'low': 'منخفضة'
    } : {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };

    return labels[priority as keyof typeof labels] || priority;
  };

  const getProgressPercentage = (rule: MaintenanceRule) => {
    const currentMileage = vehicle.mileage || 0;
    const kmSinceLastService = currentMileage - (rule.lastServiceKm || 0);
    const progress = (kmSinceLastService / rule.intervalKm) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const sortedRules = maintenanceRules.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
          <Wrench className="h-5 w-5 text-blue-600" />
          {language === 'ar' ? 'الصيانة الوقائية' : 'Preventive Maintenance'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedRules.map((rule) => {
          const progress = getProgressPercentage(rule);
          const isOverdue = progress >= 100;
          
          return (
            <div key={rule.id} className={`p-4 rounded-lg border ${getPriorityColor(rule.priority)}`}>
              <div className={`flex items-center justify-between mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <h4 className="font-medium">{getServiceTypeLabel(rule.type)}</h4>
                  {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
                <Badge className={getPriorityColor(rule.priority)}>
                  {getPriorityLabel(rule.priority)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className={`flex justify-between text-sm ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span>{language === 'ar' ? 'التقدم:' : 'Progress:'}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className={`h-2 ${isOverdue ? 'bg-red-100' : ''}`}
                />
                
                <div className={`grid grid-cols-2 gap-4 text-xs text-gray-600 ${language === 'ar' ? 'text-right' : ''}`}>
                  <div>
                    <p className="font-medium">{language === 'ar' ? 'الاستحقاق القادم:' : 'Next Due:'}</p>
                    <p className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Gauge className="h-3 w-3" />
                      {rule.nextDueKm.toLocaleString()} {language === 'ar' ? 'كم' : 'km'}
                    </p>
                    <p className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Calendar className="h-3 w-3" />
                      {new Date(rule.nextDueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">{language === 'ar' ? 'آخر خدمة:' : 'Last Service:'}</p>
                    <p>{rule.lastServiceKm?.toLocaleString()} {language === 'ar' ? 'كم' : 'km'}</p>
                    <p>{rule.lastServiceDate ? new Date(rule.lastServiceDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
                  </div>
                </div>

                {(isOverdue || rule.priority === 'critical' || rule.priority === 'high') && (
                  <Button 
                    size="sm" 
                    variant={isOverdue ? 'destructive' : 'default'}
                    className={`w-full mt-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                    onClick={() => onScheduleService?.(rule.id)}
                  >
                    <Calendar className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'جدولة الآن' : 'Schedule Now'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* ملخص سريع */}
        <div className={`mt-4 p-3 bg-gray-50 rounded-lg ${language === 'ar' ? 'text-right' : ''}`}>
          <div className={`flex items-center justify-between text-sm ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span className="font-medium">{language === 'ar' ? 'الملخص:' : 'Summary:'}</span>
            <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <span className="text-red-600">
                {maintenanceRules.filter(r => r.priority === 'critical').length} {language === 'ar' ? 'حرجة' : 'critical'}
              </span>
              <span className="text-orange-600">
                {maintenanceRules.filter(r => r.priority === 'high').length} {language === 'ar' ? 'عالية' : 'high'}
              </span>
              <span className="text-green-600">
                {maintenanceRules.filter(r => getProgressPercentage(r) < 80).length} {language === 'ar' ? 'جيدة' : 'good'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 