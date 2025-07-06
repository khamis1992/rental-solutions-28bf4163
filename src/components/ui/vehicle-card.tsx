import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Edit, Eye } from 'lucide-react';
import { VehicleStatus } from '@/types/vehicle';
import { getVehicleStatusConfig } from '@/lib/vehicle-status-config';

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  color?: string;
  vehicleNumber?: string;
  type?: string;
  dailyRate?: number;
  location?: string;
  fuelLevel?: number;
  mileage?: number | null;
  className?: string;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

const VehicleCard = ({
  id,
  make,
  model,
  year,
  licensePlate,
  status,
  color,
  vehicleNumber,
  type,
  dailyRate,
  location,
  fuelLevel,
  mileage,
  className,
  onSelect,
  onEdit,
  onView,
}: VehicleCardProps) => {
  
  const statusConfig = getVehicleStatusConfig(status);
  const currentStatus = {
    label: statusConfig.name,
    className: `border`,
    style: {
      backgroundColor: statusConfig.bgColor,
      color: statusConfig.textColor,
      borderColor: statusConfig.borderColor
    }
  };
  
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
                {year} • {color || 'أبيض'}
              </p>
            </div>
          </div>
          
          <Badge 
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full border",
              currentStatus.className
            )}
            style={currentStatus.style}
          >
            {currentStatus.label}
          </Badge>
        </div>

        {/* Vehicle details */}
        <div className="space-y-3">
          {vehicleNumber && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">رقم المركبة:</span>
              <span className="font-medium text-gray-900">{vehicleNumber}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">رقم اللوحة:</span>
            <span className="font-medium text-gray-900">{licensePlate}</span>
          </div>
          
          {type && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">النوع:</span>
              <span className="font-medium text-gray-900">{type}</span>
            </div>
          )}
          
          {dailyRate && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">السعر اليومي:</span>
              <span className="font-medium text-gray-900">{dailyRate.toLocaleString()} ريال</span>
            </div>
          )}
          
          {mileage !== undefined && mileage !== null && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">عداد المسافة:</span>
              <span className="font-medium text-gray-900">{mileage.toLocaleString()} كم</span>
            </div>
          )}
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
            onClick={() => onView ? onView(id) : onSelect && onSelect(id)}
          >
            <Eye className="w-4 h-4 ml-2" />
            عرض
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export { VehicleCard };
