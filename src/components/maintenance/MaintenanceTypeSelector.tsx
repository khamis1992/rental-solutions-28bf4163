
import React from 'react';
import { RadioGroup } from '@/components/ui/radio-group';
import { MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { maintenanceTypes } from '@/config/maintenance-types';
import MaintenanceTypeCard from './MaintenanceTypeCard';

interface MaintenanceTypeSelectorProps {
  selectedType: keyof typeof MaintenanceType;
  onChange: (type: keyof typeof MaintenanceType) => void;
}

const MaintenanceTypeSelector: React.FC<MaintenanceTypeSelectorProps> = ({
  selectedType,
  onChange
}) => {
  return (
    <RadioGroup 
      value={selectedType} 
      onValueChange={(value) => onChange(value as keyof typeof MaintenanceType)}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {maintenanceTypes.map(type => (
        <MaintenanceTypeCard
          key={type.value}
          id={`type-${type.value}`}
          {...type}
        />
      ))}
    </RadioGroup>
  );
};

export default MaintenanceTypeSelector;
