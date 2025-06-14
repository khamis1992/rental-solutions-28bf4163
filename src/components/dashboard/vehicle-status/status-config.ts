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
import { StatusConfig } from './types';

export const statusConfig: StatusConfig[] = [
  { 
    key: 'available', 
    name: 'متاحة', 
    color: '#22c55e', 
    icon: ShieldCheck,
    description: 'مركبات جاهزة للتأجير',
    filterValue: 'available'
  },
  { 
    key: 'rented', 
    name: 'مؤجرة', 
    color: '#3b82f6', 
    icon: Car,
    description: 'مركبات حالياً مع العملاء',
    filterValue: 'rented'
  },
  { 
    key: 'maintenance', 
    name: 'تحت الصيانة', 
    color: '#f59e0b', 
    icon: Wrench,
    description: 'مركبات قيد الإصلاح أو الخدمة',
    filterValue: 'maintenance'
  },
  { 
    key: 'reserved', 
    name: 'محجوزة', 
    color: '#8b5cf6', 
    icon: Clock,
    description: 'مركبات محجوزة للعملاء',
    filterValue: 'reserved'
  },
  { 
    key: 'attention', 
    name: 'تحتاج انتباه', 
    color: '#ec4899', 
    icon: AlertTriangle,
    description: 'مركبات تحتاج متابعة أو فحص',
    filterValue: 'maintenance'
  },
  { 
    key: 'police_station', 
    name: 'في المرور', 
    color: '#64748b', 
    icon: ShieldAlert,
    description: 'مركبات محتجزة لدى الشرطة',
    filterValue: 'police_station'
  },
  { 
    key: 'accident', 
    name: 'حادث', 
    color: '#ef4444', 
    icon: CircleOff,
    description: 'مركبات تعرضت لحوادث',
    filterValue: 'accident'
  },
  { 
    key: 'stolen', 
    name: 'مسروقة', 
    color: '#dc2626', 
    icon: ShieldX,
    description: 'مركبات مبلغ عن سرقتها',
    filterValue: 'stolen'
  },
  { 
    key: 'critical', 
    name: 'حرجة', 
    color: '#b91c1c', 
    icon: CircleDashed,
    description: 'مركبات في حالة حرجة تحتاج تدخل فوري',
    filterValue: 'maintenance'
  }
];
