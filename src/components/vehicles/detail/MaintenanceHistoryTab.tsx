import React from 'react';
import { useVehicleMaintenanceHistory } from '@/hooks/use-vehicle-maintenance';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MaintenanceHistoryTabProps {
  vehicleId?: string;
}

export const MaintenanceHistoryTab: React.FC<MaintenanceHistoryTabProps> = ({ vehicleId }) => {
  const { maintenanceRecords, isLoading, error } = useVehicleMaintenanceHistory(vehicleId);
  const { language } = useLanguage();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className={`text-center text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
            <p>{language === 'ar' ? `خطأ في تحميل تاريخ الصيانة: ${(error as Error).message}` : `Error loading maintenance history: ${(error as Error).message}`}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!maintenanceRecords || maintenanceRecords.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className={`text-center text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
            <p>{language === 'ar' ? 'لا توجد سجلات صيانة لهذه المركبة.' : 'No maintenance records found for this vehicle.'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getStatusBadge = (status: string) => {
    const statusLabels = language === 'ar' ? {
      'scheduled': 'مجدولة',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتملة',
      'cancelled': 'ملغاة'
    } : {
      'scheduled': 'Scheduled',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };

    const label = statusLabels[status as keyof typeof statusLabels] || status;

    switch(status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{label}</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">{label}</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{label}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{label}</Badge>;
      default:
        return <Badge variant="outline">{label}</Badge>;
    }
  };

  const getMaintenanceTypeLabel = (type: string) => {
    const typeLabels = language === 'ar' ? {
      'oil_change': 'تغيير الزيت',
      'tire_replacement': 'استبدال الإطارات',
      'brake_service': 'خدمة الفرامل',
      'routine_inspection': 'فحص دوري',
      'engine_repair': 'إصلاح المحرك',
      'air_conditioning': 'تكييف الهواء',
      'transmission': 'ناقل الحركة',
      'battery_replacement': 'استبدال البطارية',
      'electrical_repair': 'إصلاح كهربائي'
    } : {
      'oil_change': 'Oil Change',
      'tire_replacement': 'Tire Replacement',
      'brake_service': 'Brake Service',
      'routine_inspection': 'Routine Inspection',
      'engine_repair': 'Engine Repair',
      'air_conditioning': 'Air Conditioning',
      'transmission': 'Transmission',
      'battery_replacement': 'Battery Replacement',
      'electrical_repair': 'Electrical Repair'
    };

    return typeLabels[type as keyof typeof typeLabels] || type.replace(/_/g, ' ');
  };
  
  return (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {maintenanceRecords.map((record) => (
        <Card key={record.id} className="overflow-hidden">
          <div className={`bg-muted p-4 flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Wrench className={`h-5 w-5 text-primary ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              <div className={language === 'ar' ? 'text-right' : ''}>
                <h3 className="font-medium">
                  {getMaintenanceTypeLabel(record.maintenance_type || record.service_type || 'maintenance')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {record.performed_by || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                </p>
              </div>
            </div>
            {getStatusBadge(record.status || 'unknown')}
          </div>
          <CardContent className="p-4">
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ${language === 'ar' ? 'text-right' : ''}`}>
              <div>
                <p className="font-medium text-muted-foreground">
                  {language === 'ar' ? 'تاريخ الجدولة' : 'Scheduled Date'}
                </p>
                <p>{formatDate(record.scheduled_date)}</p>
              </div>
              {record.completed_date && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    {language === 'ar' ? 'تاريخ الإنجاز' : 'Completed Date'}
                  </p>
                  <p>{formatDate(record.completed_date)}</p>
                </div>
              )}
              {record.cost && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    {language === 'ar' ? 'التكلفة' : 'Cost'}
                  </p>
                  <p>{formatCurrency(record.cost)} {language === 'ar' ? 'ر.ق' : ''}</p>
                </div>
              )}
            </div>
            
            {record.description && (
              <div className={`mt-4 ${language === 'ar' ? 'text-right' : ''}`}>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </p>
                <p className="text-sm text-gray-600">{record.description}</p>
              </div>
            )}
            
            {record.notes && (
              <div className={`mt-3 ${language === 'ar' ? 'text-right' : ''}`}>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </p>
                <p className="text-sm text-gray-600">{record.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-600';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-700 border-blue-600';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-600';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border-red-600';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-600';
    }
  };

  return (
    <Badge className={`${getStatusColor()} rounded-full px-3 py-1 font-medium text-xs`}>
      {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
