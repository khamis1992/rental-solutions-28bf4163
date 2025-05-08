
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MaintenanceDetailsStepProps {
  scheduledDate: string;
  estimatedCost: string;
  assignedTo: string;
  notes: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function MaintenanceDetailsStep({
  scheduledDate,
  estimatedCost,
  assignedTo,
  notes,
  onInputChange
}: MaintenanceDetailsStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scheduled_date">Scheduled Date</Label>
        <Input
          type="datetime-local"
          id="scheduled_date"
          name="scheduled_date"
          value={scheduledDate}
          onChange={onInputChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="estimated_cost">Estimated Cost</Label>
        <Input
          type="number"
          id="estimated_cost"
          name="estimated_cost"
          value={estimatedCost}
          onChange={onInputChange}
          placeholder="0.00"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assigned_to">Assigned To</Label>
        <Input
          id="assigned_to"
          name="assigned_to"
          value={assignedTo}
          onChange={onInputChange}
          placeholder="Technician name or ID"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={onInputChange}
          placeholder="Any additional notes or instructions"
        />
      </div>
    </div>
  );
}
