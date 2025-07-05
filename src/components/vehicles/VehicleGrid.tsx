import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { VehicleCard } from '@/components/ui/vehicle-card';
import { VehicleStatus } from '@/types/vehicle';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8" dir="rtl">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!vehicles.length) {
    return (
      <div className="text-center p-12 border-2 border-dashed border-border/50 rounded-lg text-right bg-muted/20" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">🚗</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              لا توجد مركبات
            </h3>
            <p className="text-muted-foreground">
              لم يتم العثور على مركبات تطابق معاييرك
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8" dir="rtl">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          id={vehicle.id}
          make={vehicle.make}
          model={vehicle.model}
          year={vehicle.year}
          licensePlate={vehicle.license_plate || vehicle.licensePlate || 'غير محدد'}
          status={vehicle.status as VehicleStatus}
          location={vehicle.location}
          fuelLevel={vehicle.fuel_level || vehicle.fuelLevel}
          mileage={vehicle.mileage}
          onSelect={onVehicleClick}
          className="transition-all duration-200 hover:scale-[1.02]"
        />
      ))}
    </div>
  );
};

export default VehicleGrid;
