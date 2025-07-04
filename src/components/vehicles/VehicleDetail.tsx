
import React from 'react';
import { VehicleData } from '@/types/vehicle.types';
import { VehicleTabContent } from './detail/VehicleTabContent';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleDetailProps {
  vehicle: VehicleData;
  onMarkForMaintenance?: () => void;
  onMarkAsAvailable?: () => void;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ 
  vehicle, 
  onMarkForMaintenance,
  onMarkAsAvailable 
}) => {
  const { language } = useLanguage();
  
  if (!vehicle) {
    return (
      <div className={`text-center py-12 ${language === 'ar' ? 'text-right' : ''}`}>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'لا توجد بيانات للمركبة' : 'No vehicle data available'}
        </p>
      </div>
    );
  }


  return (
    <div className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <VehicleTabContent 
        vehicleId={vehicle.id} 
        vehicle={vehicle}
        onMarkForMaintenance={onMarkForMaintenance}
        onMarkAsAvailable={onMarkAsAvailable}
      />
    </div>
  );
};

export default VehicleDetail;
