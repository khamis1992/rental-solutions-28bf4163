
import { 
  ShieldCheck, Car, WrenchIcon, Clock, AlertTriangle, 
  ShieldAlert, CircleOff, ShieldX, CircleDashed 
} from 'lucide-react';
import { StatusConfig } from './types';

export const statusConfig: StatusConfig[] = [
  { 
    key: 'available', 
    name: 'Available', 
    color: '#22c55e', 
    icon: ShieldCheck,
    description: 'Ready for rental',
    filterValue: 'available'
  },
  { 
    key: 'rented', 
    name: 'Rented Out', 
    color: '#3b82f6', 
    icon: Car,
    description: 'Currently with customer',
    filterValue: 'rented'
  },
  { 
    key: 'maintenance', 
    name: 'In Maintenance', 
    color: '#f59e0b', 
    icon: WrenchIcon,
    description: 'Undergoing service or repair',
    filterValue: 'maintenance'
  },
  { 
    key: 'reserved', 
    name: 'Reserved', 
    color: '#8b5cf6', 
    icon: Clock,
    description: 'Reserved for future rental',
    filterValue: 'reserved'
  },
  { 
    key: 'attention', 
    name: 'Needs Attention', 
    color: '#ec4899', 
    icon: AlertTriangle,
    description: 'Requires review',
    filterValue: 'maintenance'
  },
  { 
    key: 'police_station', 
    name: 'At Police Station', 
    color: '#64748b', 
    icon: ShieldAlert,
    description: 'Held at police station',
    filterValue: 'police_station'
  },
  { 
    key: 'accident', 
    name: 'In Accident', 
    color: '#ef4444', 
    icon: CircleOff,
    description: 'Involved in accident',
    filterValue: 'accident'
  },
  { 
    key: 'stolen', 
    name: 'Reported Stolen', 
    color: '#dc2626', 
    icon: ShieldX,
    description: 'Vehicle reported stolen',
    filterValue: 'stolen'
  },
  { 
    key: 'critical', 
    name: 'Critical Issues', 
    color: '#b91c1c', 
    icon: CircleDashed,
    description: 'Critical issues pending',
    filterValue: 'maintenance'
  }
];
