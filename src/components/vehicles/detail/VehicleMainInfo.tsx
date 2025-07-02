import React, { useState } from 'react';
import { formatDate } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { FileText, Car, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VehicleImageSection } from './VehicleImageSection';
import { VehicleDetailsSection } from './VehicleDetailsSection';
import type { VehicleData } from '@/types/vehicle.types';
import { VehicleStatusUpdateDialog } from '../VehicleStatusUpdateDialog';
import { useVehicleStatus } from '@/hooks/use-vehicle-status';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleMainInfoProps {
  vehicle: VehicleData;
  vehicleDetails: {
    label: string;
    value: string | number | React.ReactNode;
  }[];
}

export const VehicleMainInfo: React.FC<VehicleMainInfoProps> = ({ 
  vehicle, 
  vehicleDetails 
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { updateStatus } = useVehicleStatus(vehicle.id);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    targetStatus: 'available' | 'maintenance';
    title: string;
    description: string;
    confirmLabel: string;
  }>({
    isOpen: false,
    targetStatus: 'available',
    title: '',
    description: '',
    confirmLabel: '',
  });
  
  const isAvailable = vehicle.status === 'available';
  const isInMaintenance = vehicle.status === 'maintenance';

  const handleMarkAsAvailable = () => {
    setDialogConfig({
      isOpen: true,
      targetStatus: 'available',
      title: language === 'ar' ? 'تعيين كمتاحة' : 'Mark as Available',
      description: language === 'ar' ? 'سيتم تعيين المركبة كمتاحة للإيجار. هل تريد المتابعة؟' : 'This will mark the vehicle as available for rent. Continue?',
      confirmLabel: language === 'ar' ? 'تعيين كمتاحة' : 'Mark as Available',
    });
  };

  const handleMarkForMaintenance = () => {
    setDialogConfig({
      isOpen: true,
      targetStatus: 'maintenance',
      title: language === 'ar' ? 'تعيين للصيانة' : 'Mark for Maintenance',
      description: language === 'ar' ? 'سيتم تعيين المركبة قيد الصيانة وغير متاحة للإيجار. هل تريد المتابعة؟' : 'This will mark the vehicle as under maintenance and unavailable for rent. Continue?',
      confirmLabel: language === 'ar' ? 'تعيين للصيانة' : 'Mark for Maintenance',
    });
  };

  const handleDialogClose = (confirmed?: boolean) => {
    if (confirmed && dialogConfig.targetStatus) {
      // Execute status update with optimized hook
      updateStatus(dialogConfig.targetStatus);
    }
    
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Handler to update inspection_expiry
  const handleEditInspectionExpiry = async (date: string) => {
    const { error } = await supabase
      .from('vehicles')
      .update({ inspection_expiry: date })
      .eq('id', vehicle.id);
    if (error) {
      toast.error(language === 'ar' ? 'فشل في تحديث تاريخ انتهاء الفحص' : 'Failed to update inspection expiry');
    } else {
      toast.success(language === 'ar' ? 'تم تحديث تاريخ انتهاء الفحص' : 'Inspection expiry updated');
      window.location.reload(); // Quick way to refresh, or you can refetch data via state
    }
  };

  return (
    <Card className="md:col-span-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'تفاصيل المركبة' : 'Vehicle Details'}
        </CardTitle>
        <CardDescription className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'معلومات كاملة عن هذه المركبة' : 'Complete information about this vehicle'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <VehicleImageSection 
          imageUrl={vehicle.image_url} 
          make={vehicle.make} 
          model={vehicle.model} 
        />
        
        <VehicleDetailsSection 
          details={vehicleDetails}
          inspection_expiry={vehicle.inspection_expiry}
          onEditInspectionExpiry={handleEditInspectionExpiry}
        />
      </CardContent>
      <CardFooter className={`flex justify-between border-t pt-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={`space-y-1 ${language === 'ar' ? 'text-right' : ''}`}>
          <p className="text-sm font-medium text-muted-foreground">
            {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
          </p>
          <p className="text-sm">{formatDate(vehicle.updated_at || vehicle.created_at)}</p>
        </div>
        <div className={`space-x-2 ${language === 'ar' ? 'space-x-reverse flex-row-reverse' : ''} flex`}>
          {isAvailable && (
            <Button onClick={() => navigate(`/agreements/new?vehicle_id=${vehicle.id}`)}>
              <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'إنشاء اتفاقية' : 'Create Agreement'}
            </Button>
          )}
          {isInMaintenance && (
            <Button onClick={handleMarkAsAvailable}>
              <Car className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'تعيين كمتاحة' : 'Mark as Available'}
            </Button>
          )}
          {!isInMaintenance && (
            <Button variant="outline" onClick={handleMarkForMaintenance}>
              <Wrench className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'تعيين للصيانة' : 'Mark for Maintenance'}
            </Button>
          )}
        </div>
      </CardFooter>

      <VehicleStatusUpdateDialog
        isOpen={dialogConfig.isOpen}
        onClose={handleDialogClose}
        vehicleId={vehicle.id}
        targetStatus={dialogConfig.targetStatus}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
      />
    </Card>
  );
};
