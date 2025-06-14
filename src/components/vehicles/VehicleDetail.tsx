import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { VehicleData } from '@/types/vehicle.types';
import { VehicleMainInfo } from './detail/VehicleMainInfo';
import { VehicleStatusCard } from './detail/VehicleStatusCard';
import { VehicleQuickActions } from './detail/VehicleQuickActions';
import { VehicleTabContent } from './detail/VehicleTabContent';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleDetailProps {
  vehicle: VehicleData;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle }) => {
  const { language } = useLanguage();
  
  if (!vehicle) {
    return <div className={language === 'ar' ? 'text-right' : ''}>{language === 'ar' ? 'لا توجد بيانات للمركبة' : 'No vehicle data available'}</div>;
  }

  // Log the vehicle object to see what we're working with
  console.log("VehicleDetail component received vehicle:", JSON.stringify({
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    status: vehicle.status,
    rent_amount: vehicle.rent_amount
  }));

  // Safe access to nested properties with fallbacks
  const vehicleTypeName = (language === 'ar' ? 'قياسي' : 'Standard');
  const dailyRate = vehicle.rent_amount || 0;

  // Format vehicle details for display with defensive coding
  const vehicleDetails = [
    { label: language === 'ar' ? "الماركة" : "Make", value: vehicle.make },
    { label: language === 'ar' ? "الموديل" : "Model", value: vehicle.model },
    { label: language === 'ar' ? "السنة" : "Year", value: vehicle.year },
    { label: language === 'ar' ? "اللون" : "Color", value: vehicle.color || (language === 'ar' ? 'غير محدد' : 'Not specified') },
    { label: language === 'ar' ? "لوحة الترخيص" : "License Plate", value: vehicle.license_plate || (language === 'ar' ? 'غير محدد' : 'Not specified') },
    { label: language === 'ar' ? "رقم الهيكل" : "VIN", value: vehicle.vin || (language === 'ar' ? 'غير محدد' : 'Not specified') },
    { label: language === 'ar' ? "عداد المسافة" : "Mileage", value: vehicle.mileage ? `${vehicle.mileage} ${language === 'ar' ? 'كم' : 'km'}` : (language === 'ar' ? "غير مسجل" : "Not recorded") },
    { label: language === 'ar' ? "السعر اليومي" : "Daily Rate", value: dailyRate ? `${formatCurrency(dailyRate)} ${language === 'ar' ? 'ر.ق' : ''}` : (language === 'ar' ? "غير محدد" : "Not set") },
    { label: language === 'ar' ? "النوع" : "Type", value: vehicleTypeName },
    { label: language === 'ar' ? "الوصف" : "Description", value: (language === 'ar' ? "لا يوجد وصف متاح" : "No description available") },
  ];

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${language === 'ar' ? 'md:grid-flow-col-dense' : ''}`}>
        <VehicleMainInfo vehicle={vehicle} vehicleDetails={vehicleDetails} />

        <div className="space-y-6">
          <VehicleStatusCard vehicle={vehicle} />
          <VehicleQuickActions vehicle={vehicle} />
        </div>
      </div>

      <VehicleTabContent vehicleId={vehicle.id} />
    </div>
  );
};

export default VehicleDetail;
