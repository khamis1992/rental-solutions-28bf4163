import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { updateVehicleStatus } from '@/utils/vehicle-update';
import { VehicleData } from '@/types/vehicle.types';

interface VehicleStatusQuickUpdateProps {
  vehicle: VehicleData;
  onStatusUpdate?: () => void;
}

export const VehicleStatusQuickUpdate: React.FC<VehicleStatusQuickUpdateProps> = ({
  vehicle,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState(vehicle.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'available', label: 'متاحة', color: 'bg-green-100 text-green-800' },
    { value: 'rented', label: 'مؤجرة', color: 'bg-blue-100 text-blue-800' },
    { value: 'reserved', label: 'محجوزة', color: 'bg-purple-100 text-purple-800' },
    { value: 'maintenance', label: 'قيد الصيانة', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'police_station', label: 'في المركز', color: 'bg-orange-100 text-orange-800' },
    { value: 'accident', label: 'حادث', color: 'bg-red-100 text-red-800' },
    { value: 'stolen', label: 'مسروقة', color: 'bg-red-200 text-red-900' },
    { value: 'retired', label: 'متقاعدة', color: 'bg-gray-200 text-gray-700' },
    { value: 'out_of_service', label: 'خارج الخدمة', color: 'bg-red-100 text-red-800' }
  ];

  const getCurrentStatusInfo = () => {
    return statusOptions.find(option => option.value === vehicle.status) || 
           { value: vehicle.status, label: vehicle.status, color: 'bg-gray-100 text-gray-800' };
  };

  const getSelectedStatusInfo = () => {
    return statusOptions.find(option => option.value === selectedStatus) || 
           { value: selectedStatus, label: selectedStatus, color: 'bg-gray-100 text-gray-800' };
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus === vehicle.status) {
      toast.info('الحالة المختارة هي نفس الحالة الحالية');
      return;
    }

    setIsUpdating(true);
    try {
      console.log(`تحديث سريع لحالة المركبة ${vehicle.id}: ${vehicle.status} → ${selectedStatus}`);
      
      const result = await updateVehicleStatus(vehicle.id, selectedStatus as any);
      
      if (result.success) {
        const newStatusInfo = getSelectedStatusInfo();
        toast.success(`تم تحديث الحالة بنجاح`, {
          description: `تم تغيير حالة المركبة إلى "${newStatusInfo.label}"`,
          duration: 4000,
        });
        
        if (onStatusUpdate) {
          onStatusUpdate();
        }
        
        // إعادة تحميل بعد تأخير قصير
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('فشل في تحديث الحالة', {
          description: result.message || 'حدث خطأ غير متوقع',
        });
      }
    } catch (error: any) {
      console.error('خطأ في التحديث السريع:', error);
      toast.error('خطأ في تحديث الحالة', {
        description: error.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = selectedStatus !== vehicle.status;

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Settings className="h-5 w-5" />
          تحديث سريع لحالة المركبة
        </CardTitle>
        <CardDescription className="text-right">
          تغيير حالة المركبة بسرعة وسهولة
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* الحالة الحالية */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-right">الحالة الحالية</Label>
          <div className="flex items-center gap-2 justify-end">
            <Badge className={getCurrentStatusInfo().color}>
              {getCurrentStatusInfo().label}
            </Badge>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
        </div>

        {/* اختيار الحالة الجديدة */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-right">الحالة الجديدة</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر الحالة الجديدة" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2 w-full">
                    <Badge className={option.color} variant="outline">
                      {option.label}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* معاينة التغيير */}
        {hasChanges && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-blue-800 text-right">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">معاينة التغيير</span>
            </div>
            <div className="mt-2 text-sm text-blue-700 text-right">
              من: <Badge className={getCurrentStatusInfo().color + ' mx-1'}>
                {getCurrentStatusInfo().label}
              </Badge>
              إلى: <Badge className={getSelectedStatusInfo().color + ' mx-1'}>
                {getSelectedStatusInfo().label}
              </Badge>
            </div>
          </div>
        )}

        {/* زر التحديث */}
        <div className="pt-2">
          <Button
            onClick={handleStatusUpdate}
            disabled={isUpdating || !hasChanges}
            className="w-full"
            size="lg"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري التحديث...
              </>
            ) : hasChanges ? (
              <>
                <CheckCircle className="h-4 w-4 ml-2" />
                تحديث الحالة
              </>
            ) : (
              'لا توجد تغييرات'
            )}
          </Button>
        </div>

        {/* معلومات إضافية */}
        <div className="text-xs text-muted-foreground text-right space-y-1">
          <p>• سيتم حفظ التغيير فوراً في قاعدة البيانات</p>
          <p>• ستتم إعادة تحميل الصفحة لعرض الحالة الجديدة</p>
          <p>• يمكنك التراجع عن التغيير في أي وقت</p>
        </div>
      </CardContent>
    </Card>
  );
}; 