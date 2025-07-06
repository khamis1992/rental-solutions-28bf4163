import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVehicleStatusConfig } from '@/lib/vehicle-status-config';

type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'inactive' | 'reserved' | 'police_station' | 'accident' | 'stolen' | 'retired' | string;

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

export const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({ status, className = '' }) => {
  const { language } = useLanguage();
  const statusConfig = getVehicleStatusConfig(status);
  
  const statusStyle = {
    backgroundColor: statusConfig.bgColor,
    color: statusConfig.textColor,
    borderColor: statusConfig.borderColor
  };

  return (
    <Badge 
      variant={statusConfig.variant} 
      className={`${className} ${language === 'ar' ? 'text-right' : 'text-left'} border`} 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={statusStyle}
    >
      {statusConfig.name}
    </Badge>
  );
};
