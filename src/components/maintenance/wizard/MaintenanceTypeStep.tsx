
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MaintenanceType } from '@/lib/validation-schemas/maintenance';

interface MaintenanceTypeStepProps {
  maintenanceType: string;
  description: string;
  onMaintenanceTypeChange: (value: string) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function MaintenanceTypeStep({
  maintenanceType,
  description,
  onMaintenanceTypeChange,
  onDescriptionChange
}: MaintenanceTypeStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Maintenance Type</Label>
        <Select
          value={maintenanceType}
          onValueChange={onMaintenanceTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select maintenance type" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(MaintenanceType).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={onDescriptionChange}
          placeholder="Describe the maintenance work needed"
        />
      </div>
    </div>
  );
}
