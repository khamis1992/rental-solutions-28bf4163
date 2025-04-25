
import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MaintenanceTypeConfig } from '@/config/maintenance-types';
import { RadioGroupItem } from '@/components/ui/radio-group';

interface MaintenanceTypeCardProps extends MaintenanceTypeConfig {
  id: string;
}

const MaintenanceTypeCard: React.FC<MaintenanceTypeCardProps> = ({
  value,
  label,
  description,
  icon: Icon,
  recommendedInterval,
  id
}) => {
  return (
    <div className="relative">
      <RadioGroupItem
        value={value}
        id={id}
        className="sr-only peer"
      />
      <Label
        htmlFor={id}
        className={cn(
          "flex h-full border rounded-md p-4 cursor-pointer",
          "hover:bg-accent hover:text-accent-foreground",
          "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
          "transition-colors"
        )}
      >
        <div className="mr-4">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex-1">
          <div className="font-medium">{label}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
          <div className="text-xs mt-1 text-primary">
            Recommended: {recommendedInterval}
          </div>
        </div>
      </Label>
    </div>
  );
};

export default MaintenanceTypeCard;
