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
            <p className="font-medium text-sm">Vehicle</p>
            <p className="text-sm">
              {agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year ?? 'N/A'})
            </p>
          </div>

          <div>
            <p className="font-medium text-sm">License Plate</p>
            <p className="text-sm">{agreement.vehicles?.license_plate ?? 'N/A'}</p>
          </div>

          <div>
            <p className="font-medium text-sm">Color</p>
            <p className="text-sm">{agreement.vehicles?.color ?? 'N/A'}</p>
          </div>

          <div>
            <p className="font-medium text-sm">VIN</p>
            <p className="text-sm">{agreement.vehicles?.vin ?? 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}