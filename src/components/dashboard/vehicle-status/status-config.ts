import { StatusConfig } from './types';
import { vehicleStatusConfig } from '@/lib/vehicle-status-config';

export const statusConfig: StatusConfig[] = [
  { 
    key: 'available', 
    name: vehicleStatusConfig.available.name, 
    color: vehicleStatusConfig.available.color, 
    icon: vehicleStatusConfig.available.icon,
    description: vehicleStatusConfig.available.description,
    filterValue: 'available'
  },
  { 
    key: 'rented', 
    name: vehicleStatusConfig.rented.name, 
    color: vehicleStatusConfig.rented.color, 
    icon: vehicleStatusConfig.rented.icon,
    description: vehicleStatusConfig.rented.description,
    filterValue: 'rented'
  },
  { 
    key: 'maintenance', 
    name: vehicleStatusConfig.maintenance.name, 
    color: vehicleStatusConfig.maintenance.color, 
    icon: vehicleStatusConfig.maintenance.icon,
    description: vehicleStatusConfig.maintenance.description,
    filterValue: 'maintenance'
  },
  { 
    key: 'reserved', 
    name: vehicleStatusConfig.reserved.name, 
    color: vehicleStatusConfig.reserved.color, 
    icon: vehicleStatusConfig.reserved.icon,
    description: vehicleStatusConfig.reserved.description,
    filterValue: 'reserved'
  },
  { 
    key: 'police_station', 
    name: vehicleStatusConfig.police_station.name, 
    color: vehicleStatusConfig.police_station.color, 
    icon: vehicleStatusConfig.police_station.icon,
    description: vehicleStatusConfig.police_station.description,
    filterValue: 'police_station'
  },
  { 
    key: 'accident', 
    name: vehicleStatusConfig.accident.name, 
    color: vehicleStatusConfig.accident.color, 
    icon: vehicleStatusConfig.accident.icon,
    description: vehicleStatusConfig.accident.description,
    filterValue: 'accident'
  },
  { 
    key: 'stolen', 
    name: vehicleStatusConfig.stolen.name, 
    color: vehicleStatusConfig.stolen.color, 
    icon: vehicleStatusConfig.stolen.icon,
    description: vehicleStatusConfig.stolen.description,
    filterValue: 'stolen'
  },
  { 
    key: 'retired', 
    name: vehicleStatusConfig.retired.name, 
    color: vehicleStatusConfig.retired.color, 
    icon: vehicleStatusConfig.retired.icon,
    description: vehicleStatusConfig.retired.description,
    filterValue: 'retired'
  }
];
