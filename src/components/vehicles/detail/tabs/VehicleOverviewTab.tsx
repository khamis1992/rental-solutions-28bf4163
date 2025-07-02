// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Car, Calendar, DollarSign, FileText, MapPin, Wrench, Settings, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { VehicleData } from '@/types/vehicle.types';
import { useNavigate } from 'react-router-dom';
import { updateVehicleStatus } from '@/utils/vehicle-update';
import { toast } from 'sonner';

interface VehicleOverviewTabProps {
  vehicle: VehicleData;
  onMarkForMaintenance: () => void;
  onMarkAsAvailable: () => void;
}

export const VehicleOverviewTab: React.FC<VehicleOverviewTabProps> = ({
  vehicle,
  onMarkForMaintenance,
  onMarkAsAvailable
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(vehicle.status);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isAvailable = vehicle.status === 'available';
  const isInMaintenance = vehicle.status === 'maintenance';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'reserved': return 'bg-purple-100 text-purple-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'police_station': return 'bg-orange-100 text-orange-800';
      case 'accident': return 'bg-red-100 text-red-800';
      case 'stolen': return 'bg-red-200 text-red-900';
      case 'retired': return 'bg-gray-200 text-gray-700';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'ar') {
      switch (status) {
        case 'available': return 'متاحة';
        case 'rented': return 'مؤجرة';
        case 'reserved': return 'محجوزة';
        case 'maintenance': return 'قيد الصيانة';
        case 'police_station': return 'في المركز';
        case 'accident': return 'حادث';
        case 'stolen': return 'مسروقة';
        case 'retired': return 'متقاعدة';
        case 'out_of_service': return 'خارج الخدمة';
        default: return status;
      }
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleStatusUpdate = async () => {
    if (newStatus === vehicle.status) {
      toast.info('لا توجد تغييرات لحفظها');
      return;
    }

    setIsUpdating(true);
    try {
      console.log(`تحديث حالة المركبة ${vehicle.id} من ${vehicle.status} إلى ${newStatus}`);
      
      const result = await updateVehicleStatus(vehicle.id, newStatus as any);
      
      if (result.success) {
        toast.success(`تم تحديث حالة المركبة إلى "${getStatusText(newStatus)}" بنجاح`);
        setIsStatusDialogOpen(false);
        
        // إعادة تحميل الصفحة للتأكد من عرض الحالة الجديدة
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(`فشل في تحديث الحالة: ${result.message}`);
      }
    } catch (error: any) {
      console.error('خطأ في تحديث حالة المركبة:', error);
      toast.error(`خطأ في تحديث الحالة: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const availableStatuses = [
    { value: 'available', label: 'متاحة' },
    { value: 'rented', label: 'مؤجرة' },
    { value: 'reserved', label: 'محجوزة' },
    { value: 'maintenance', label: 'قيد الصيانة' },
    { value: 'police_station', label: 'في المركز' },
    { value: 'accident', label: 'حادث' },
    { value: 'stolen', label: 'مسروقة' },
    { value: 'retired', label: 'متقاعدة' },
    { value: 'out_of_service', label: 'خارج الخدمة' }
  ];

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Status and Quick Actions */}
      <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className={language === 'ar' ? 'text-left' : ''}>
              <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-left' : ''}`}>
                <Car className="w-5 h-5" />
                {language === 'ar' ? 'حالة المركبة' : 'Vehicle Status'}
              </CardTitle>
              <CardDescription className={`mt-1 ${language === 'ar' ? 'text-left' : ''}`}>
                {language === 'ar' ? 'الحالة الحالية وإجراءات سريعة' : 'Current status and quick actions'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${language === 'ar' ? 'text-right' : ''}`}>
            <div className="mb-4">
              <div className={`flex items-center justify-between mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <h4 className={`text-sm font-medium text-muted-foreground ${language === 'ar' ? 'text-left' : ''}`}>
                  {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                </h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setNewStatus(vehicle.status);
                    setIsStatusDialogOpen(true);
                  }}
                  className={`${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <Settings className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                  {language === 'ar' ? 'تغيير الحالة' : 'Change Status'}
                </Button>
              </div>
              <Badge className={`${getStatusColor(vehicle.status)} px-3 py-1 text-sm font-medium`}>
                {getStatusText(vehicle.status)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {isAvailable && (
                <Button 
                  onClick={() => navigate(`/agreements/new?vehicle_id=${vehicle.id}`)}
                  className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'إنشاء اتفاقية' : 'Create Agreement'}
                </Button>
              )}
              {isInMaintenance && (
                <Button 
                  onClick={onMarkAsAvailable}
                  className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <Car className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'تعيين كمتاحة' : 'Mark as Available'}
                </Button>
              )}
              {!isInMaintenance && (
                <Button 
                  variant="outline" 
                  onClick={onMarkForMaintenance}
                  className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <Wrench className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'تعيين للصيانة' : 'Mark for Maintenance'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className={language === 'ar' ? 'text-left' : ''}>
              <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-left' : ''}`}>
                <DollarSign className="w-5 h-5" />
                {language === 'ar' ? 'معلومات الإيجار' : 'Rental Information'}
              </CardTitle>
              <CardDescription className={`mt-1 ${language === 'ar' ? 'text-left' : ''}`}>
                {language === 'ar' ? 'تفاصيل الأسعار والإيجار' : 'Pricing and rental details'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${language === 'ar' ? 'text-right' : ''}`}>
            <div>
              <h4 className={`text-sm font-medium text-muted-foreground mb-2 ${language === 'ar' ? 'text-left' : ''}`}>
                {language === 'ar' ? 'السعر اليومي' : 'Daily Rate'}
              </h4>
              <p className="text-lg font-semibold">
                {vehicle.rent_amount ? `${formatCurrency(vehicle.rent_amount)} ${language === 'ar' ? 'ر.ق' : 'QAR'}` : (language === 'ar' ? 'غير محدد' : 'Not set')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'معلومات المركبة' : 'Vehicle Information'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'التفاصيل الأساسية للمركبة' : 'Basic vehicle details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'الماركة' : 'Make'}</p>
              <p className="text-base font-semibold">{vehicle.make || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'الموديل' : 'Model'}</p>
              <p className="text-base font-semibold">{vehicle.model || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'السنة' : 'Year'}</p>
              <p className="text-base font-semibold">{vehicle.year || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'اللون' : 'Color'}</p>
              <p className="text-base font-semibold">{vehicle.color || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'لوحة الترخيص' : 'License Plate'}</p>
              <p className="text-base font-semibold">{vehicle.license_plate || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'رقم الهيكل' : 'VIN'}</p>
              <p className="text-base font-semibold">{vehicle.vin || (language === 'ar' ? 'غير محدد' : 'Not specified')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className={language === 'ar' ? 'text-left' : ''}>
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-left' : ''}`}>
                  <MapPin className="w-5 h-5" />
                  {language === 'ar' ? 'معلومات إضافية' : 'Additional Information'}
                </CardTitle>
                <CardDescription className={`mt-1 ${language === 'ar' ? 'text-left' : ''}`}>
                  {language === 'ar' ? 'بيانات تشغيل وصيانة المركبة' : 'Vehicle operation and maintenance data'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${language === 'ar' ? 'text-right' : ''}`}>
              <div className="space-y-3">
                <div>
                  <h4 className={`text-sm font-medium text-muted-foreground mb-1 ${language === 'ar' ? 'text-left' : ''}`}>
                    {language === 'ar' ? 'عداد المسافة' : 'Mileage'}
                  </h4>
                  <p className="font-medium">
                    {vehicle.mileage ? `${vehicle.mileage} ${language === 'ar' ? 'كم' : 'km'}` : (language === 'ar' ? 'غير مسجل' : 'Not recorded')}
                  </p>
                </div>
                {vehicle.inspection_expiry && (
                  <div>
                    <h4 className={`text-sm font-medium text-muted-foreground mb-1 ${language === 'ar' ? 'text-left' : ''}`}>
                      {language === 'ar' ? 'انتهاء الفحص' : 'Inspection Expiry'}
                    </h4>
                    <p className="font-medium">{formatDate(vehicle.inspection_expiry)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className={language === 'ar' ? 'text-left' : ''}>
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-left' : ''}`}>
                  <Calendar className="w-5 h-5" />
                  {language === 'ar' ? 'تواريخ مهمة' : 'Important Dates'}
                </CardTitle>
                <CardDescription className={`mt-1 ${language === 'ar' ? 'text-left' : ''}`}>
                  {language === 'ar' ? 'تواريخ الإنشاء والتحديث' : 'Creation and update timestamps'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${language === 'ar' ? 'text-right' : ''}`}>
              <div className="space-y-3">
                <div>
                  <h4 className={`text-sm font-medium text-muted-foreground mb-1 ${language === 'ar' ? 'text-left' : ''}`}>
                    {language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}
                  </h4>
                  <p className="font-medium">{formatDate(vehicle.created_at)}</p>
                </div>
                {vehicle.updated_at && (
                  <div>
                    <h4 className={`text-sm font-medium text-muted-foreground mb-1 ${language === 'ar' ? 'text-left' : ''}`}>
                      {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                    </h4>
                    <p className="font-medium">{formatDate(vehicle.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* حوار تغيير حالة المركبة */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'تغيير حالة المركبة' : 'Change Vehicle Status'}
            </DialogTitle>
            <DialogDescription className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' 
                ? 'اختر الحالة الجديدة للمركبة. سيتم تحديث النظام فوراً.' 
                : 'Select the new status for the vehicle. The system will be updated immediately.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="status-select" className="text-sm font-medium">
                {language === 'ar' ? 'الحالة الجديدة' : 'New Status'}
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={language === 'ar' ? 'اختر الحالة' : 'Select status'} />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Badge 
                          className={`${getStatusColor(status.value)} mr-2 ${language === 'ar' ? 'ml-2 mr-0' : ''}`}
                          variant="outline"
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newStatus !== vehicle.status && (
              <div className={`p-3 bg-blue-50 border border-blue-200 rounded-md ${language === 'ar' ? 'text-right' : ''}`}>
                <p className="text-sm text-blue-800">
                  {language === 'ar' 
                    ? `سيتم تغيير حالة المركبة من "${getStatusText(vehicle.status)}" إلى "${getStatusText(newStatus)}"`
                    : `Vehicle status will change from "${getStatusText(vehicle.status)}" to "${getStatusText(newStatus)}"`}
                </p>
              </div>
            )}

            <div className={`flex gap-2 pt-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdating || newStatus === vehicle.status}
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className={`h-4 w-4 animate-spin ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                  </>
                ) : (
                  language === 'ar' ? 'تحديث الحالة' : 'Update Status'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
                disabled={isUpdating}
                className="flex-1"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
