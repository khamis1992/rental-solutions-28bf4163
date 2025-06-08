
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VehicleDetailsSectionProps {
  vehicle: any;
}

export const VehicleDetailsSection: React.FC<VehicleDetailsSectionProps> = ({
  vehicle
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Make:</strong> {vehicle?.make || 'N/A'}</p>
          <p><strong>Model:</strong> {vehicle?.model || 'N/A'}</p>
          <p><strong>Year:</strong> {vehicle?.year || 'N/A'}</p>
          <p><strong>License Plate:</strong> {vehicle?.license_plate || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
};
