
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Car, Fuel, Calendar, Tag } from 'lucide-react';

interface VehicleType {
  id?: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  color?: string;
  fuel_type?: string;
  vin?: string;
  status?: string;
  mileage?: number;
  registration_number?: string;
  registration_expiry?: string | Date;
}

export interface VehicleInformationCardProps {
  vehicle: VehicleType;
}

export function VehicleInformationCard({ vehicle }: VehicleInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Information</CardTitle>
        <CardDescription>Details about the rented vehicle</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 rounded-full p-2">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{vehicle?.make || 'Unknown'} {vehicle?.model || ''}</p>
                <p className="text-sm text-muted-foreground">
                  {vehicle?.year || ''} {vehicle?.color || ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span>License Plate: {vehicle?.license_plate || 'N/A'}</span>
            </div>
            
            {vehicle?.fuel_type && (
              <div className="flex items-center space-x-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <span>Fuel Type: {vehicle.fuel_type}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium">VIN</p>
              <p>{vehicle?.vin || 'Not provided'}</p>
            </div>
            
            <div>
              <p className="font-medium">Registration</p>
              <p>{vehicle?.registration_number || 'Not provided'}</p>
            </div>
            
            {vehicle?.registration_expiry && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Expires: {
                    vehicle.registration_expiry instanceof Date 
                      ? vehicle.registration_expiry.toLocaleDateString() 
                      : new Date(vehicle.registration_expiry).toLocaleDateString()
                  }
                </span>
              </div>
            )}
          </div>
        </div>
        
        {vehicle?.id && (
          <div className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link to={`/vehicles/${vehicle.id}`}>View Vehicle Details</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
