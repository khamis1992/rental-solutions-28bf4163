
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { MaintenanceFormData } from './schema';

interface MaintenanceTypeStepProps {
  maintenanceType: string;
  description: string;
  onMaintenanceTypeChange: (value: string) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  errors?: Partial<Record<keyof MaintenanceFormData, string>>;
}

export function MaintenanceTypeStep({
  maintenanceType,
  description,
  onMaintenanceTypeChange,
  onDescriptionChange,
  errors = {}
}: MaintenanceTypeStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className={errors.maintenance_type ? "text-red-500" : ""}>Maintenance Type</Label>
        <Select
          value={maintenanceType}
          onValueChange={onMaintenanceTypeChange}
        >
          <SelectTrigger className={errors.maintenance_type ? "border-red-500" : ""}>
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
        {errors.maintenance_type && (
          <p className="text-sm text-red-500 mt-1">{errors.maintenance_type}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className={errors.description ? "text-red-500" : ""}>Description</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={onDescriptionChange}
          placeholder="Describe the maintenance work needed"
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description}</p>
        )}
      </div>
    </div>
  );
}
