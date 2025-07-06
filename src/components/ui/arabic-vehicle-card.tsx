import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Edit, Eye } from 'lucide-react';
import { VehicleStatus } from '@/types/vehicle';

interface ArabicVehicleCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleNumber: string;
  type: string;
  dailyRate: number;
  mileage: number;
  status: VehicleStatus;
  className?: string;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

const ArabicVehicleCard = ({
  id,
  make,
  model,
  year,
  color,
  licensePlate,
  vehicleNumber,
  type,
  dailyRate,
  mileage,
  status,
  className,
  onEdit,
  onView,
}: ArabicVehicleCardProps) => {
  
  const statusConfig = {
    available: { 
      label: 'متاحة', 
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    rented: { 
      label: 'مؤجرة', 
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    reserved: { 
      label: 'محجوزة', 
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    maintenance: { 
      label: 'صيانة', 
      className: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    police_station: { 
      label: 'في المرور', 
      className: 'bg-slate-100 text-slate-800 border-slate-200'
    },
    accident: { 
      label: 'حادث', 
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    stolen: { 
      label: 'مسروقة', 
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    retired: { 
      label: 'متقاعدة', 
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.available;
  
  return (
    <Card 
      className={cn(
        "w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden",
        className
      )} 
      dir="rtl"
    >
      <CardContent className="p-6 space-y-4">
        {/* Header with car icon and vehicle info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {make} {model}
              </h3>
              <p className="text-sm text-gray-500">
                {year} • {color}
              </p>
            </div>
          </div>
          
          <Badge 
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full border",
              currentStatus.className
            )}
          >
            {currentStatus.label}
          </Badge>
        </div>

        {/* Vehicle details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">رقم المركبة:</span>
            <span className="font-medium text-gray-900">{vehicleNumber}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">رقم اللوحة:</span>
            <span className="font-medium text-gray-900">{licensePlate}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">النوع:</span>
            <span className="font-medium text-gray-900">{type}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">السعر اليومي:</span>
            <span className="font-medium text-gray-900">{dailyRate.toLocaleString()} ريال</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">عداد المسافة:</span>
            <span className="font-medium text-gray-900">{mileage.toLocaleString()} كم</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-0">
        <div className="flex gap-3 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-10 bg-gray-50 hover:bg-gray-100 border-gray-200"
            onClick={() => onEdit && onEdit(id)}
          >
            <Edit className="w-4 h-4 ml-2" />
            تعديل
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-10 bg-gray-50 hover:bg-gray-100 border-gray-200"
            onClick={() => onView && onView(id)}
          >
            <Eye className="w-4 h-4 ml-2" />
            عرض
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export { ArabicVehicleCard };