import {
  ShieldCheck,
  Car,
  Wrench,
  Clock,
  AlertTriangle,
  ShieldAlert,
  CircleOff,
  ShieldX,
  CircleDashed,
} from 'lucide-react';

export interface VehicleStatusConfig {
  key: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: any;
  description: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning';
}

export const vehicleStatusConfig: Record<string, VehicleStatusConfig> = {
  available: {
    key: 'available',
    name: 'متاحة',
    color: '#22c55e',
    bgColor: 'hsl(142 76% 36%)',
    textColor: 'hsl(0 0% 100%)',
    borderColor: 'hsl(142 76% 36%)',
    icon: ShieldCheck,
    description: 'مركبات جاهزة للتأجير',
    variant: 'success'
  },
  rented: {
    key: 'rented',
    name: 'مؤجرة',
    color: '#3b82f6',
    bgColor: 'hsl(221 83% 53%)',
    textColor: 'hsl(0 0% 100%)',
    borderColor: 'hsl(221 83% 53%)',
    icon: Car,
    description: 'مركبات حالياً مع العملاء',
    variant: 'default'
  },
  reserved: {
    key: 'reserved',
    name: 'محجوزة',
    color: '#8b5cf6',
    bgColor: 'hsl(258 90% 66%)',
    textColor: 'hsl(0 0% 100%)',
    borderColor: 'hsl(258 90% 66%)',
    icon: Clock,
    description: 'مركبات محجوزة للعملاء',
    variant: 'secondary'
  },
  maintenance: {
    key: 'maintenance',
    name: 'تحت الصيانة',
    color: '#f59e0b',
    bgColor: 'hsl(43 96% 56%)',
    textColor: 'hsl(0 0% 0%)',
    borderColor: 'hsl(43 96% 56%)',
    icon: Wrench,
    description: 'مركبات قيد الإصلاح أو الخدمة',
    variant: 'warning'
  },
  police_station: {
    key: 'police_station',
    name: 'في المرور',
    color: '#64748b',
    bgColor: 'hsl(215 20% 65%)',
    textColor: 'hsl(0 0% 100%)',
    borderColor: 'hsl(215 20% 65%)',
    icon: ShieldAlert,
    description: 'مركبات محتجزة لدى الشرطة',
    variant: 'outline'
  },
  accident: {
    key: 'accident',
    name: 'حادث',
    color: '#ef4444',
    bgColor: 'hsl(0 84% 60%)',
    textColor: 'hsl(0 0% 100%)',
    borderColor: 'hsl(0 84% 60%)',
    icon: CircleOff,
    description: 'مركبات تعرضت لحوادث',
    variant: 'destructive'
  },
  stolen: {
    key: 'stolen',
    name: 'مسروقة',
    color: '#dc2626',
    bgColor: 'hsl(0 84% 60%)',
    textColor: 'hsl(0 0% 100%)',
    borderColor: 'hsl(0 84% 60%)',
    icon: ShieldX,
    description: 'مركبات مبلغ عن سرقتها',
    variant: 'destructive'
  },
  retired: {
    key: 'retired',
    name: 'متقاعدة',
    color: '#6b7280',
    bgColor: 'hsl(220 9% 46%)',
    textColor: 'hsl(0 0% 100%)',
    borderColor: 'hsl(220 9% 46%)',
    icon: CircleDashed,
    description: 'مركبات متقاعدة',
    variant: 'outline'
  }
};

export const getVehicleStatusConfig = (status: string) => {
  return vehicleStatusConfig[status] || vehicleStatusConfig.available;
};