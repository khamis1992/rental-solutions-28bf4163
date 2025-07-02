
import React from 'react';
import { Label } from '@/components/ui/label';

interface ReassignmentDetailsProps {
  agreementNumber: string | null;
  customerName: string | null;
  currentVehicle: {
    make: string | null;
    model: string | null;
    license_plate: string | null;
  };
}

export function ReassignmentDetails({ 
  agreementNumber, 
  customerName, 
  currentVehicle 
}: ReassignmentDetailsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Agreement Number</Label>
        <p>{agreementNumber}</p>
      </div>
      <div className="space-y-2">
        <Label>Customer Name</Label>
        <p>{customerName}</p>
      </div>
      <div className="space-y-2">
        <Label>Current Vehicle</Label>
        <p>
          {currentVehicle.make} {currentVehicle.model} ({currentVehicle.license_plate})
        </p>
      </div>
    </>
  );
}
