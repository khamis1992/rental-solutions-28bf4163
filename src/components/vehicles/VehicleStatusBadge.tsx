

import { useLanguage } from '@/contexts/LanguageContext';

type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'inactive' | 'reserved' | 'police_station' | 'accident' | 'stolen' | 'retired' | string;

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

export const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({ status, className = '' }) => {
  const { language } = useLanguage();
  
  // Map status to appropriate badge variant
  const getVariant = () => {
    switch (status) {
      case 'available':
        return 'success';
      case 'rented':
        return 'secondary';
      case 'reserved':
        return 'default';
      case 'maintenance':
        return 'warning';
      case 'police_station':
        return 'destructive';
      case 'accident':
        return 'destructive';
      case 'stolen':
        return 'destructive';
      case 'retired':
        return 'outline';
      case 'sold':
        return 'default';
      case 'inactive':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Get Arabic translation for status
  const getStatusText = () => {
    if (language === 'ar') {
      switch (status) {
        case 'available':
          return 'متاحة';
        case 'rented':
          return 'مؤجرة';
        case 'reserved':
          return 'محجوزة';
        case 'maintenance':
          return 'قيد الصيانة';
        case 'police_station':
          return 'في المركز';
        case 'accident':
          return 'حادث';
        case 'stolen':
          return 'مسروقة';
        case 'retired':
          return 'متقاعدة';
        case 'sold':
          return 'مباعة';
        case 'inactive':
          return 'غير نشطة';
        default:
          return status;
      }
    } else {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Badge variant={getVariant()} className={`${className} ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {getStatusText()}
    </Badge>
  );
};
