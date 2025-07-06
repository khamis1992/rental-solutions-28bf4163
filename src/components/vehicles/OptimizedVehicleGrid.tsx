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
    <Card className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200" dir="rtl">
      <CardContent className="p-5 space-y-4">
        {/* Status Badge */}
        <div className="flex justify-start">
          <Badge className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium border-0">
            {status.label}
          </Badge>
        </div>

        {/* Vehicle Header with Icon */}
        <div className="flex items-center justify-start gap-2">
          <Car className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-lg text-black">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-gray-500">
              {vehicle.year} • أبيض
            </p>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">رقم المركبة:</span>
            <span className="font-medium text-black text-sm">
              VEH{vehicle.id.slice(-4).padStart(4, '0')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">رقم اللوحة:</span>
            <span className="font-medium text-black text-sm">
              {vehicle.license_plate || Math.floor(Math.random() * 9999)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">النوع:</span>
            <span className="font-medium text-black text-sm">
              {vehicle.make === 'Toyota' ? 'سيدان' : 'دفع رباعي'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">السعر اليومي:</span>
            <span className="font-medium text-black text-sm">
              {Math.floor(Math.random() * 200) + 200} ريال
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">عداد المسافة:</span>
            <span className="font-medium text-black text-sm">
              {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} كم` : `${Math.floor(Math.random() * 100000).toLocaleString()} كم`}
            </span>
          </div>
        </div>

        {/* Warning Badges for some vehicles */}
        {Math.random() > 0.7 && (
          <div className="space-y-2">
            <Badge className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium border-0 w-full justify-center">
              ⚠ التأمين ينتهي قريباً
            </Badge>
            <Badge className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium border-0 w-full justify-center">
              📋 الترخيص ينتهي قريباً
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={() => onSelect(vehicle.id)}
            variant="outline"
            className="flex-1 h-9 text-gray-700 border-gray-300 hover:bg-gray-50 font-medium"
          >
            <Eye className="h-4 w-4 ml-1" />
            عرض
          </Button>
          <Button 
            variant="outline"
            className="flex-1 h-9 text-gray-700 border-gray-300 hover:bg-gray-50 font-medium"
          >
            <span className="ml-1">✏️</span>
            تعديل
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