
import React from 'react';
import { formatCurrency } from '@/lib/formatters';

interface MaintenanceConfirmationStepProps {
  maintenanceType: string;
  scheduledDate: string;
  estimatedCost: string;
  assignedTo: string;
}

export function MaintenanceConfirmationStep({
  maintenanceType,
  scheduledDate,
  estimatedCost,
  assignedTo
}: MaintenanceConfirmationStepProps) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-3">Maintenance Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Type:</span>
            <span>{maintenanceType.replace(/_/g, ' ')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Scheduled Date:</span>
            <span>{new Date(scheduledDate).toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Estimated Cost:</span>
            <span>{formatCurrency(parseFloat(estimatedCost || '0'))}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Assigned To:</span>
            <span>{assignedTo || 'Not assigned'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
