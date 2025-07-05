
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, ArrowLeft, AlertCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleDetail from '@/components/vehicles/VehicleDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicleDetail } from '@/hooks/use-vehicle-detail';
import { Button } from "@/components/ui/button";
import { VehicleStatusUpdateDialog } from '@/components/vehicles/VehicleStatusUpdateDialog';
import { useVehicleStatus } from '@/hooks/use-vehicle-status';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { updateStatus } = useVehicleStatus(id);
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
  
  const {
    vehicle,
    isLoading,
    error
  } = useVehicleDetail(id);

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
      updateStatus(dialogConfig.targetStatus);
    }
    
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className={`text-center py-12 ${language === 'ar' ? 'text-right' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'خطأ في تحميل تفاصيل المركبة' : 'Error loading vehicle details'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'ar' ? 'حدث خطأ أثناء تحميل معلومات المركبة.' : 'There was an error loading the vehicle information.'}
          </p>
          <Button 
            onClick={() => navigate('/vehicles')}
            variant="outline"
            className={language === 'ar' ? 'flex-row-reverse' : ''}
          >
            <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'العودة إلى المركبات' : 'Back to Vehicles'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!vehicle) {
    return (
      <PageContainer>
        <div className={`text-center py-12 ${language === 'ar' ? 'text-right' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'المركبة غير موجودة' : 'Vehicle not found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'ar' ? 'المركبة المطلوبة غير موجودة أو تم حذفها.' : 'The requested vehicle could not be found or has been deleted.'}
          </p>
          <Button 
            onClick={() => navigate('/vehicles')}
            variant="outline"
            className={language === 'ar' ? 'flex-row-reverse' : ''}
          >
            <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'العودة إلى المركبات' : 'Back to Vehicles'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title={`${vehicle.make} ${vehicle.model}`}
        description={`${vehicle.year} • ${vehicle.license_plate}`}
        icon={Car}
        actions={
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
            className={language === 'ar' ? 'flex-row-reverse' : ''}
          >
            <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'العودة إلى المركبات' : 'Back to Vehicles'}
          </Button>
        }
      />
      
      <div className="section-transition mt-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <VehicleDetail 
          vehicle={vehicle}
          onMarkForMaintenance={handleMarkForMaintenance}
          onMarkAsAvailable={handleMarkAsAvailable}
          key={`vehicle-detail-${vehicle.id}`} 
        />
      </div>

      <VehicleStatusUpdateDialog
        isOpen={dialogConfig.isOpen}
        onClose={handleDialogClose}
        vehicleId={vehicle.id}
        targetStatus={dialogConfig.targetStatus}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
      />
    </PageContainer>
  );
};

export default VehicleDetailPage;
