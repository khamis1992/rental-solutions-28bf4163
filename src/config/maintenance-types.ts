
import { MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { 
  OilDrop,  // Change from Oil to OilDrop, which is the correct icon name
  Wrench,
  Gauge,
  Settings,
  Cog,
  Zap,
  Car,
  Fan,
  RotateCcw
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface MaintenanceTypeConfig {
  value: keyof typeof MaintenanceType;
  label: string;
  description: string;
  icon: LucideIcon;
  recommendedInterval: string;
}

export const maintenanceTypes: MaintenanceTypeConfig[] = [
  {
    value: MaintenanceType.OIL_CHANGE,
    label: 'Oil Change',
    description: 'Replace engine oil and oil filter',
    icon: OilDrop,  // Updated to use OilDrop
    recommendedInterval: '5,000 - 10,000 km'
  },
  {
    value: MaintenanceType.TIRE_REPLACEMENT,
    label: 'Tire Replacement',
    description: 'Replace or rotate vehicle tires',
    icon: RotateCcw,
    recommendedInterval: '50,000 km or as needed'
  },
  {
    value: MaintenanceType.BRAKE_SERVICE,
    label: 'Brake Service',
    description: 'Inspect and service brake system components',
    icon: Wrench,
    recommendedInterval: '20,000 - 30,000 km'
  },
  {
    value: MaintenanceType.REGULAR_INSPECTION,
    label: 'Regular Inspection',
    description: 'General vehicle check and preventive maintenance',
    icon: Gauge,
    recommendedInterval: 'Every 10,000 km'
  },
  {
    value: MaintenanceType.ENGINE_REPAIR,
    label: 'Engine Repair',
    description: 'Diagnose and fix engine-related issues',
    icon: Cog,
    recommendedInterval: 'As needed'
  },
  {
    value: MaintenanceType.TRANSMISSION_SERVICE,
    label: 'Transmission Service',
    description: 'Fluid change and transmission system maintenance',
    icon: Settings,
    recommendedInterval: '60,000 - 100,000 km'
  },
  {
    value: MaintenanceType.ELECTRICAL_REPAIR,
    label: 'Electrical Repair',
    description: 'Fix electrical systems and components',
    icon: Zap,
    recommendedInterval: 'As needed'
  },
  {
    value: MaintenanceType.BODY_REPAIR,
    label: 'Body Repair',
    description: 'Repair vehicle body damage',
    icon: Car,
    recommendedInterval: 'As needed'
  },
  {
    value: MaintenanceType.AIR_CONDITIONING,
    label: 'Air Conditioning',
    description: 'Service or repair AC system',
    icon: Fan,
    recommendedInterval: 'Every 2 years or as needed'
  },
  {
    value: MaintenanceType.OTHER,
    label: 'Other',
    description: 'Other maintenance or repair services',
    icon: Wrench,
    recommendedInterval: 'Varies'
  }
];
