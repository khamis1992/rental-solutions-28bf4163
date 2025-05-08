
import React from 'react';
import { formatCurrency } from '@/lib/formatters';

interface MaintenanceConfirmationStepProps {
  maintenanceType: string;
  scheduledDate: string;
  estimatedCost: string;
  assignedTo: string;
  description?: string;
  notes?: string;
}

export function MaintenanceConfirmationStep({
  maintenanceType,
  scheduledDate,
  estimatedCost,
  assignedTo,
  description,
  notes
}: MaintenanceConfirmationStepProps) {
  const cost = parseFloat(estimatedCost || '0');

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-3">Maintenance Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Type:</span>
            <span>{maintenanceType.replace(/_/g, ' ')}</span>
          </div>
          
          {description && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500">Description:</span>
              <span>{description}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Scheduled Date:</span>
            <span>{new Date(scheduledDate).toLocaleString()}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Estimated Cost:</span>
            <span>{formatCurrency(cost)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Assigned To:</span>
            <span>{assignedTo || 'Not assigned'}</span>
          </div>
          
          {notes && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500">Notes:</span>
              <span>{notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
