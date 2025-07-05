import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Calendar, MapPin, Fuel, Activity, Settings, AlertTriangle } from 'lucide-react';
import { CustomButton } from './custom-button';
import { VehicleStatus } from '@/types/vehicle';

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  imageUrl?: string; // Optional now since we're not using images
  location?: string;
  fuelLevel?: number;
  mileage?: number | null;
  className?: string;
  onSelect?: (id: string) => void;
}

const VehicleCard = ({
  id,
  make,
  model,
  year,
  licensePlate,
  status,
  location,
  fuelLevel,
  mileage,
  className,
  onSelect,
}: VehicleCardProps) => {
  
  const statusConfig = {
    available: { 
      label: 'متاحة', 
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      accentColor: '#22c55e'
    },
    rented: { 
      label: 'مؤجرة', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      accentColor: '#3b82f6'
    },
    reserved: { 
      label: 'محجوزة', 
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      accentColor: '#8b5cf6'
    },
    maintenance: { 
      label: 'صيانة', 
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      accentColor: '#f59e0b'
    },
    police_station: { 
      label: 'في المرور', 
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-600',
      accentColor: '#64748b'
    },
    accident: { 
      label: 'حادث', 
      color: 'bg-red-100 text-red-800 border-red-200',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      accentColor: '#ef4444'
    },
    stolen: { 
      label: 'مسروقة', 
      color: 'bg-red-100 text-red-800 border-red-200',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      accentColor: '#dc2626'
    },
    critical: { 
      label: 'حرجة', 
      color: 'bg-red-100 text-red-800 border-red-200',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      accentColor: '#b91c1c'
    },
    retired: { 
      label: 'متقاعدة', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
      accentColor: '#6b7280'
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.available;
  
  // تحديد الأيقونة حسب الحالة
  const getStatusIcon = () => {
    switch (status) {
      case 'maintenance':
        return Settings;
      case 'accident':
      case 'stolen':
        return AlertTriangle;
      default:
        return Car;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <Card 
      className={cn(
        "overflow-hidden border border-border/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5", 
        "hover:border-primary/20 hover:scale-[1.02]",
        "card-transition bg-card relative", 
        className
      )} 
      dir="rtl"
      style={{ 
        borderColor: currentStatus.accentColor + '30',
        backgroundColor: currentStatus.accentColor + '03'
      }}
    >
      
      {/* شريط جانبي لإبراز لون الحالة */}
      <div 
        className="absolute right-0 top-0 w-1 h-full"
        style={{ backgroundColor: currentStatus.accentColor }}
      />
      
      {/* Header Section - بديل منطقة الصورة */}
      <div 
        className={cn(
          "relative p-6 border-b border-border/30",
          currentStatus.bgColor
        )}
        style={{ 
          backgroundColor: currentStatus.accentColor + '08',
          borderBottomColor: currentStatus.accentColor + '20'
        }}
      >
        <div className="flex items-start justify-between">
          {/* معلومات أساسية */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl border-2",
                currentStatus.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 bg-')
              )}>
                <StatusIcon 
                  className="h-6 w-6"
                  style={{ color: currentStatus.accentColor }}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-card-foreground">
                  {make} {model}
                </h3>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge 
            className={cn("text-sm font-medium", currentStatus.color)}
            style={{ 
              backgroundColor: currentStatus.accentColor + '20',
              color: currentStatus.accentColor,
              borderColor: currentStatus.accentColor + '40'
            }}
          >
            {currentStatus.label}
          </Badge>
        </div>

        {/* لوحة الأرقام والسنة */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="bg-card/80 px-4 py-2 rounded-lg border-2"
              style={{ borderColor: currentStatus.accentColor + '40' }}
            >
              <span 
                className="text-lg font-bold"
                style={{ color: currentStatus.accentColor }}
              >
                {licensePlate}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">{year}</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* شبكة المعلومات التفصيلية */}
        <div className="grid grid-cols-2 gap-4">
          {location && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الموقع</p>
                <p className="text-sm font-medium truncate">{location}</p>
              </div>
            </div>
          )}
          
          {fuelLevel !== undefined && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <div className={cn(
                "p-2 rounded-lg",
                fuelLevel > 50 ? "bg-green-100" : fuelLevel > 25 ? "bg-yellow-100" : "bg-red-100"
              )}>
                <Fuel className={cn(
                  "h-4 w-4",
                  fuelLevel > 50 ? "text-green-600" : fuelLevel > 25 ? "text-yellow-600" : "text-red-600"
                )} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الوقود</p>
                <p className="text-sm font-medium">{fuelLevel}%</p>
              </div>
            </div>
          )}
          
          {mileage !== undefined && mileage !== null && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg col-span-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">عداد المسافة</p>
                <p className="text-sm font-medium">{mileage.toLocaleString()} كم</p>
              </div>
            </div>
          )}
          
          {/* إذا لم تكن هناك معلومات إضافية، اعرض معلومة افتراضية */}
          {!location && fuelLevel === undefined && (mileage === undefined || mileage === null) && (
            <div className="col-span-2 flex items-center justify-center p-4 bg-muted/20 rounded-lg border-2 border-dashed border-border/50">
              <p className="text-sm text-muted-foreground">لا توجد معلومات إضافية متاحة</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-0">
        <CustomButton 
          className="w-full h-11 font-medium border-2 hover:shadow-lg transition-all duration-300" 
          glossy={true}
          onClick={() => onSelect && onSelect(id)}
          style={{ 
            backgroundColor: currentStatus.accentColor + '10',
            borderColor: currentStatus.accentColor + '30',
            color: currentStatus.accentColor
          }}
        >
          <Car className="h-4 w-4 mr-2" />
          عرض التفاصيل
        </CustomButton>
      </CardFooter>
    </Card>
  );
};

export { VehicleCard };
