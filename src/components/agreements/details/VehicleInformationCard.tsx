
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Agreement } from '@/lib/validation-schemas/agreement';

interface VehicleInformationCardProps {
  agreement: Agreement;
}

export function VehicleInformationCard({ agreement }: VehicleInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Information</CardTitle>
        <CardDescription>Details about the rented vehicle</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Vehicle</p>
            <p>{agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year || 'N/A'})</p>
          </div>
          <div>
            <p className="font-medium">License Plate</p>
            <p>{agreement.vehicles?.license_plate}</p>
          </div>
          <div>
            <p className="font-medium">Color</p>
            <p>{agreement.vehicles?.color || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">VIN</p>
            <p>{agreement.vehicles?.vin || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

