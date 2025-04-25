
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MaintenanceNotesProps {
  description: string;
  notes: string;
  onDescriptionChange: (description: string) => void;
  onNotesChange: (notes: string) => void;
}

const MaintenanceNotes: React.FC<MaintenanceNotesProps> = ({
  description,
  notes,
  onDescriptionChange,
  onNotesChange
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="Describe the maintenance work required or performed" 
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Provide a detailed description of the maintenance work
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea 
          id="notes" 
          placeholder="Add any additional information or notes" 
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Include any relevant details, observations, or follow-up actions needed
        </p>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Maintenance Documentation Tips</h4>
        <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>Include specific parts that were replaced or repaired</li>
          <li>Note any unusual observations or recurring issues</li>
          <li>Document any manufacturer recommendations followed</li>
          <li>Record any warranty information for replaced parts</li>
          <li>Mention any preventive maintenance performed</li>
        </ul>
      </div>
    </div>
  );
};

export default MaintenanceNotes;
