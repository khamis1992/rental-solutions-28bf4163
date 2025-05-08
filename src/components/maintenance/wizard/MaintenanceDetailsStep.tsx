
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MaintenanceFormData } from './schema';

interface MaintenanceDetailsStepProps {
  scheduledDate: string;
  estimatedCost: string;
  assignedTo: string;
  notes: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  errors?: Partial<Record<keyof MaintenanceFormData, string>>;
}

export function MaintenanceDetailsStep({
  scheduledDate,
  estimatedCost,
  assignedTo,
  notes,
  onInputChange,
  errors = {}
}: MaintenanceDetailsStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scheduled_date" className={errors.scheduled_date ? "text-red-500" : ""}>Scheduled Date</Label>
        <Input
          type="datetime-local"
          id="scheduled_date"
          name="scheduled_date"
          value={scheduledDate}
          onChange={onInputChange}
          className={errors.scheduled_date ? "border-red-500" : ""}
        />
        {errors.scheduled_date && (
          <p className="text-sm text-red-500 mt-1">{errors.scheduled_date}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="estimated_cost" className={errors.estimated_cost ? "text-red-500" : ""}>Estimated Cost</Label>
        <Input
          type="number"
          id="estimated_cost"
          name="estimated_cost"
          value={estimatedCost}
          onChange={onInputChange}
          placeholder="0.00"
          min="0"
          step="0.01"
          className={errors.estimated_cost ? "border-red-500" : ""}
        />
        {errors.estimated_cost && (
          <p className="text-sm text-red-500 mt-1">{errors.estimated_cost}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assigned_to" className={errors.assigned_to ? "text-red-500" : ""}>Assigned To</Label>
        <Input
          id="assigned_to"
          name="assigned_to"
          value={assignedTo}
          onChange={onInputChange}
          placeholder="Technician name or ID"
          className={errors.assigned_to ? "border-red-500" : ""}
        />
        {errors.assigned_to && (
          <p className="text-sm text-red-500 mt-1">{errors.assigned_to}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes" className={errors.notes ? "text-red-500" : ""}>Additional Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={onInputChange}
          placeholder="Any additional notes or instructions"
          className={errors.notes ? "border-red-500" : ""}
        />
        {errors.notes && (
          <p className="text-sm text-red-500 mt-1">{errors.notes}</p>
        )}
      </div>
    </div>
  );
}
