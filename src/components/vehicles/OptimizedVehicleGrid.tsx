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
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30" dir="rtl">
      <CardContent className="p-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                موديل {vehicle.year}
              </p>
            </div>
            <Badge 
              variant="secondary" 
              className={cn("text-white text-xs px-3 py-1 font-medium", status.color)}
            >
              {status.label}
            </Badge>
          </div>

          {/* License Plate */}
          <div className="bg-gradient-to-r from-muted/70 to-muted/50 rounded-xl p-4 text-center border">
            <p className="font-mono text-xl font-bold text-foreground">
              {vehicle.license_plate || 'غير محدد'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">رقم اللوحة</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {vehicle.location && (
              <div className="flex items-center gap-2 p-2 bg-card-foreground/5 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="truncate font-medium">{vehicle.location}</span>
              </div>
            )}
            
            {vehicle.mileage && (
              <div className="flex items-center gap-2 p-2 bg-card-foreground/5 rounded-lg">
                <Gauge className="h-4 w-4 text-primary" />
                <span className="font-medium">{vehicle.mileage?.toLocaleString()} كم</span>
              </div>
            )}

            <div className="flex items-center gap-2 p-2 bg-card-foreground/5 rounded-lg">
              <Car className="h-4 w-4 text-primary" />
              <span className="truncate text-xs font-mono">{vehicle.vin || 'غير محدد'}</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-card-foreground/5 rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">{new Date(vehicle.created_at).getFullYear()}</span>
            </div>
          </div>

          {/* Actions */}
          <Button 
            onClick={() => onSelect(vehicle.id)}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            size="sm"
          >
            <Eye className="h-4 w-4 ml-2" />
            عرض التفاصيل
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
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/30 border-border/50" dir="rtl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-1">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-foreground">
                  {vehicle.make} {vehicle.model} 
                </h3>
                <span className="text-sm text-muted-foreground font-medium">
                  ({vehicle.year})
                </span>
                <Badge 
                  variant="secondary" 
                  className={cn("text-white text-xs px-2 py-1 font-medium", status.color)}
                >
                  {status.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-lg">
                  <span className="font-mono font-bold text-foreground">
                    {vehicle.license_plate || 'غير محدد'}
                  </span>
                </div>
                
                {vehicle.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{vehicle.location}</span>
                  </div>
                )}
                
                {vehicle.mileage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="h-4 w-4 text-primary" />
                    <span className="font-medium">{vehicle.mileage.toLocaleString()} كم</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => onSelect(vehicle.id)}
            size="sm"
            className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <Eye className="h-4 w-4 ml-2" />
            عرض
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