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
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/95 border-2 border-border/60 hover:border-primary/40 hover:shadow-xl transition-all duration-500 hover:-translate-y-1" dir="rtl">
      {/* Status Indicator Line */}
      <div className={cn("absolute top-0 right-0 left-0 h-1", status.color)} />
      
      <CardContent className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                  {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-sm text-muted-foreground/80 font-medium">
                  موديل {vehicle.year}
                </p>
              </div>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={cn("text-xs px-3 py-1.5 font-semibold border-2 shadow-sm", status.color)}
          >
            {status.label}
          </Badge>
        </div>

        {/* License Plate - Professional Design */}
        <div className="relative">
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 border-2 border-slate-200 dark:border-slate-700 shadow-inner">
            <div className="text-center space-y-1">
              <p className="font-mono text-2xl font-black text-foreground tracking-wider">
                {vehicle.license_plate || '--- ----'}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                رقم اللوحة
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-xl p-4 space-y-2 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">الموقع</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {vehicle.location || 'غير محدد'}
            </p>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 space-y-2 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">المسافة</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} كم` : 'غير محدد'}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">رقم الهيكل</span>
            <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded font-semibold">
              {vehicle.vin ? vehicle.vin.slice(-8) : 'غير محدد'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">تاريخ الإضافة</span>
            <span className="font-semibold text-foreground">
              {new Date(vehicle.created_at).getFullYear()}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => onSelect(vehicle.id)}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          size="lg"
        >
          <Eye className="h-4 w-4 ml-2" />
          عرض التفاصيل الكاملة
        </Button>
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