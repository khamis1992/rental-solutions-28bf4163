
import React from 'react';
import { format } from 'date-fns';
import { Vehicle } from '@/types/vehicle';
import { CardContent } from "@/components/ui/card";
import { formatCurrency } from '@/lib/utils';
import { Car, CalendarDays, Info, Wrench, Gauge, FileText } from 'lucide-react';

interface VehicleOverviewProps {
  vehicle: Vehicle;
}

const VehicleOverview = ({ vehicle }: VehicleOverviewProps) => {
  // Extract vehicle data
  const { 
    make, model, year, vin, license_plate, color, mileage, 
    location, vehicleType, image_url, created_at,
    insurance_company, insurance_expiry, status
  } = vehicle;

  // Format vehicle name for display
  const vehicleName = `${make} ${model} (${year})`;
  
  return (
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span className="text-muted-foreground w-28">Make:</span>
              <span className="font-medium">{make}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground w-28">Model:</span>
              <span className="font-medium">{model}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground w-28">Year:</span>
              <span className="font-medium">{year}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground w-28">VIN:</span>
              <span className="font-medium font-mono text-sm">{vin}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground w-28">License Plate:</span>
              <span className="font-medium">{license_plate}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground w-28">Color:</span>
              <span className="font-medium">{color || 'N/A'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground w-28">Mileage:</span>
              <span className="font-medium">{mileage ? `${mileage.toLocaleString()} km` : 'N/A'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground w-28">Location:</span>
              <span className="font-medium">{location || 'N/A'}</span>
            </li>
            {vehicleType && (
              <li className="flex justify-between">
                <span className="text-muted-foreground w-28">Daily Rate:</span>
                <span className="font-medium">{formatCurrency(vehicleType.daily_rate || 0)}</span>
              </li>
            )}
          </ul>
        </div>
        
        <div>
          <div className="rounded-md border overflow-hidden aspect-video mb-4">
            {image_url ? (
              <img 
                src={image_url} 
                alt={vehicleName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Car className="h-12 w-12 text-muted-foreground opacity-50" />
                <span className="text-muted-foreground ml-2">No image available</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">
                Added on {format(new Date(created_at), 'dd MMMM yyyy')}
              </span>
            </div>
            
            {status === 'rented' && (
              <div className="flex items-center text-amber-600">
                <Info className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  Currently rented out
                </span>
              </div>
            )}
            
            {status === 'maintenance' && (
              <div className="flex items-center text-orange-600">
                <Wrench className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  Under maintenance
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Additional Details Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Gauge className="h-8 w-8 mb-2 text-blue-500" />
                <span className="text-sm text-muted-foreground">Mileage</span>
                <span className="text-2xl font-bold">{vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A'}</span>
                <span className="text-sm text-muted-foreground">kilometers</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <FileText className="h-8 w-8 mb-2 text-green-500" />
                <span className="text-sm text-muted-foreground">Insurance</span>
                <span className="text-lg font-bold">{vehicle.insurance_company || 'N/A'}</span>
                <span className="text-sm text-muted-foreground">
                  {vehicle.insurance_expiry 
                    ? `Expires: ${format(new Date(vehicle.insurance_expiry), 'dd/MM/yyyy')}` 
                    : 'No expiry date'}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Clock className="h-8 w-8 mb-2 text-purple-500" />
                <span className="text-sm text-muted-foreground">Rental History</span>
                <span className="text-2xl font-bold">-</span>
                <span className="text-sm text-muted-foreground">total rentals</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CardContent>
  );
};

import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default VehicleOverview;
