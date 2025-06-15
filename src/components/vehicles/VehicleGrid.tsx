import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VehicleStatusBadge } from '@/components/vehicles/VehicleStatusBadge';
import { formatCurrency } from '@/lib/formatters';

import { Car, Calendar, MapPin, Tag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleGridProps {
  vehicles: any[];
  isLoading?: boolean;
  onVehicleClick: (id: string) => void;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({
  vehicles = [],
  isLoading = false,
  onVehicleClick,
}) => {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" dir="rtl">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <div className="flex justify-between mb-2 flex-row-reverse">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!vehicles.length) {
    return (
      <div className="text-center p-8 border rounded-lg text-right" dir="rtl">
        <p className="text-muted-foreground">
          لم يتم العثور على مركبات تطابق معاييرك.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" dir="rtl">
      {vehicles.map((vehicle) => (
        <Card
          key={vehicle.id}
          className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
          onClick={() => onVehicleClick(vehicle.id)}
        >
          <div className="aspect-[16/9] relative overflow-hidden bg-muted">
            {vehicle.image_url ? (
              <img
                src={vehicle.image_url}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                <Car className="h-16 w-16 text-secondary/50" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <VehicleStatusBadge status={vehicle.status} />
            </div>
          </div>
          <CardContent className="p-4" dir="rtl">
            <h3 className="text-lg font-semibold line-clamp-1 text-right">
              {vehicle.make} {vehicle.model}
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground text-right">
              <div className="flex items-center gap-1 flex-row-reverse justify-end">
                <span>{vehicle.year}</span>
                <Calendar className="h-3.5 w-3.5" />
              </div>
              
              <div className="flex items-center gap-1 flex-row-reverse justify-end">
                <span>{vehicle.license_plate || 'بلا لوحة'}</span>
                <Tag className="h-3.5 w-3.5" />
              </div>
              
              {vehicle.location && (
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span className="line-clamp-1">{vehicle.location}</span>
                  <MapPin className="h-3.5 w-3.5" />
                </div>
              )}
              
              {vehicle.daily_rate && (
                <div className="flex items-center gap-1 font-medium text-foreground flex-row-reverse justify-end">
                  <span>
                    {formatCurrency(vehicle.daily_rate, true)}/يوم
                  </span>
                </div>
              )}
              
              {!vehicle.daily_rate && vehicle.rent_amount && (
                <div className="flex items-center gap-1 font-medium text-foreground flex-row-reverse justify-end">
                  <span>
                    {formatCurrency(vehicle.rent_amount, true)}/يوم
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VehicleGrid;
