import React, { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { toast } from 'sonner';
import { Car, Settings, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface VehicleStatusManagerProps {
  vehicles: any[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const VehicleStatusManager: React.FC<VehicleStatusManagerProps> = ({
  vehicles,
  isLoading = false,
  onRefresh
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  // دالة للحصول على معلومات الحالة
  const getStatusInfo = (status: string) => {
    const statusConfig = {
      available: { 
        label: 'متاحة', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        description: 'المركبة متاحة للإيجار'
      },
      rented: { 
        label: 'مؤجرة', 
        color: 'bg-blue-100 text-blue-800',
        icon: Car,
        description: 'المركبة مؤجرة حالياً'
      },
      maintenance: { 
        label: 'صيانة', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: Settings,
        description: 'المركبة تحت الصيانة'
      },
      accident: { 
        label: 'حادث', 
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle,
        description: 'المركبة في حادث'
      },
      reserved: { 
        label: 'محجوزة', 
        color: 'bg-purple-100 text-purple-800',
        icon: Clock,
        description: 'المركبة محجوزة'
      },
      retired: { 
        label: 'متقاعدة', 
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle,
        description: 'المركبة متقاعدة'
      }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
  };

  // دالة تحديث حالة المركبة
  const handleStatusUpdate = async () => {
    if (!selectedVehicle || !newStatus) {
      toast.error('يرجى تحديد الحالة الجديدة');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedVehicle.id);

      if (error) {
        throw error;
      }

      // إنعاش الكاش
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });

      const statusInfo = getStatusInfo(newStatus);
      toast.success(`تم تحديث حالة المركبة بنجاح`, {
        description: `${selectedVehicle.make} ${selectedVehicle.model} الآن ${statusInfo.label}`
      });

      // إغلاق النافذة وإعادة تعيين القيم
      setIsDialogOpen(false);
      setSelectedVehicle(null);
      setNewStatus('');
      
      // تحديث البيانات
      onRefresh?.();

    } catch (error) {
      console.error('خطأ في تحديث حالة المركبة:', error);
      toast.error('فشل في تحديث حالة المركبة');
    } finally {
      setIsUpdating(false);
    }
  };

  // فتح نافذة التحديث
  const openUpdateDialog = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setNewStatus(vehicle.status);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Settings className="h-4 w-4 animate-spin" />
            <span>جاري تحميل المركبات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-right">إدارة حالات المركبات</h3>
        <Badge variant="outline" className="text-right">
          {vehicles.length} مركبة
        </Badge>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد مركبات في الصيانة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {vehicles.map((vehicle) => {
            const statusInfo = getStatusInfo(vehicle.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <StatusIcon className="h-5 w-5" />
                      <div className="text-right">
                        <h4 className="font-medium">
                          {vehicle.make} {vehicle.model}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.license_plate} • {vehicle.year}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUpdateDialog(vehicle)}
                      >
                        تغيير الحالة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* نافذة تحديث الحالة */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تحديث حالة المركبة</DialogTitle>
            <DialogDescription className="text-right">
              {selectedVehicle && 
                `تحديث حالة ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.license_plate})`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-right block mb-2">الحالة الحالية:</Label>
              {selectedVehicle && (
                <Badge className={getStatusInfo(selectedVehicle.status).color}>
                  {getStatusInfo(selectedVehicle.status).label}
                </Badge>
              )}
            </div>

            <div>
              <Label className="text-right block mb-2">الحالة الجديدة:</Label>
              <Select value={newStatus} onValueChange={setNewStatus} dir="rtl">
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الحالة الجديدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available" className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>متاحة</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance" className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <Settings className="h-4 w-4 text-yellow-600" />
                      <span>صيانة</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="accident" className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>حادث</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="reserved" className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span>محجوزة</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="retired" className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <XCircle className="h-4 w-4 text-gray-600" />
                      <span>متقاعدة</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 text-right">
                  {getStatusInfo(newStatus).description}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 flex-row-reverse">
            <Button 
              onClick={handleStatusUpdate} 
              disabled={isUpdating || !newStatus || newStatus === selectedVehicle?.status}
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 animate-spin" />
                  <span>جاري التحديث...</span>
                </div>
              ) : (
                'تحديث الحالة'
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
