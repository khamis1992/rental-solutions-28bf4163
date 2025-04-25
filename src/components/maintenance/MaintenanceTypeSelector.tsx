import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { cn } from '@/lib/utils';
import { 
  OilIcon,
  Wrench,
  Gauge,
  Settings,
  Cog,
  Zap,
  Car,
  Fan,
  RotateCcw
} from 'lucide-react';

interface MaintenanceTypeSelectorProps {
  selectedType: keyof typeof MaintenanceType;
  onChange: (type: keyof typeof MaintenanceType) => void;
}

const MaintenanceTypeSelector: React.FC<MaintenanceTypeSelectorProps> = ({
  selectedType,
  onChange
}) => {
  const maintenanceTypes = [
    {
      value: MaintenanceType.OIL_CHANGE,
      label: 'Oil Change',
      description: 'Replace engine oil and oil filter',
      icon: OilIcon,
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
      icon: Tool,
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

  return (
    <RadioGroup 
      value={selectedType} 
      onValueChange={(value) => onChange(value as keyof typeof MaintenanceType)}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {maintenanceTypes.map(type => (
        <div key={type.value} className="relative">
          <RadioGroupItem
            value={type.value}
            id={`type-${type.value}`}
            className="sr-only peer"
          />
          <Label
            htmlFor={`type-${type.value}`}
            className={cn(
              "flex h-full border rounded-md p-4 cursor-pointer",
              "hover:bg-accent hover:text-accent-foreground",
              "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
              "transition-colors"
            )}
          >
            <div className="mr-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                {React.createElement(type.icon, { className: "h-5 w-5 text-primary" })}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-medium">{type.label}</div>
              <div className="text-sm text-muted-foreground">{type.description}</div>
              <div className="text-xs mt-1 text-primary">
                Recommended: {type.recommendedInterval}
              </div>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

export default MaintenanceTypeSelector;
