import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  MapPin, 
  Calendar, 
  Gauge,
  Fuel,
  Eye
} from 'lucide-react';
import { Vehicle, VehicleStatus } from '@/types/vehicle';
import { cn } from '@/lib/utils';

interface OptimizedVehicleGridProps {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
  viewMode: 'grid' | 'list';
}

const statusConfig: Record<VehicleStatus, { color: string; label: string }> = {
  available: { color: 'bg-success', label: 'متاحة' },
  rented: { color: 'bg-warning', label: 'مؤجرة' },
  reserved: { color: 'bg-info', label: 'محجوزة' },
  maintenance: { color: 'bg-muted', label: 'صيانة' },
  police_station: { color: 'bg-destructive', label: 'في المركز' },
  accident: { color: 'bg-destructive', label: 'حادث' },
  stolen: { color: 'bg-destructive', label: 'مسروقة' },
  retired: { color: 'bg-muted', label: 'متقاعدة' },
  out_of_service: { color: 'bg-muted', label: 'خارج الخدمة' }
};

const VehicleCard = memo(({ 
  vehicle, 
  onSelect 
}: { 
  vehicle: Vehicle; 
  onSelect: (id: string) => void;
}) => {
  const status = statusConfig[vehicle.status] || statusConfig.available;

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:scale-[1.02]" dir="rtl">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-muted-foreground">
                {vehicle.year}
              </p>
            </div>
            <Badge 
              variant="secondary" 
              className={cn("text-white", status.color)}
            >
              {status.label}
            </Badge>
          </div>

          {/* License Plate */}
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="font-mono text-lg font-bold">
              {vehicle.license_plate || 'غير محدد'}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {vehicle.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{vehicle.location}</span>
              </div>
            )}
            
            {vehicle.mileage && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span>{vehicle.mileage?.toLocaleString()} كم</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>{vehicle.vin || 'غير محدد'}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(vehicle.created_at).getFullYear()}</span>
            </div>
          </div>

          {/* Actions */}
          <Button 
            onClick={() => onSelect(vehicle.id)}
            className="w-full"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

VehicleCard.displayName = 'VehicleCard';

const VehicleListItem = memo(({ 
  vehicle, 
  onSelect 
}: { 
  vehicle: Vehicle; 
  onSelect: (id: string) => void;
}) => {
  const status = statusConfig[vehicle.status] || statusConfig.available;

  return (
    <Card className="hover:shadow-sm transition-shadow" dir="rtl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </h3>
                <Badge 
                  variant="secondary" 
                  className={cn("text-white text-xs", status.color)}
                >
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-mono">{vehicle.license_plate || 'غير محدد'}</span>
                {vehicle.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {vehicle.location}
                  </span>
                )}
                {vehicle.mileage && (
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {vehicle.mileage.toLocaleString()} كم
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => onSelect(vehicle.id)}
            size="sm"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

VehicleListItem.displayName = 'VehicleListItem';

export const OptimizedVehicleGrid = memo<OptimizedVehicleGridProps>(({ 
  vehicles, 
  onSelectVehicle, 
  viewMode 
}) => {
  if (!vehicles.length) {
    return (
      <div className="text-center p-12 border-2 border-dashed border-border/50 rounded-lg bg-muted/20" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Car className="h-8 w-8 text-muted-foreground" />
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

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {vehicles.map((vehicle) => (
          <VehicleListItem
            key={vehicle.id}
            vehicle={vehicle}
            onSelect={onSelectVehicle}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onSelect={onSelectVehicle}
        />
      ))}
    </div>
  );
});

OptimizedVehicleGrid.displayName = 'OptimizedVehicleGrid';