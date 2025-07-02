
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VehicleStatusBadge } from '@/components/vehicles/VehicleStatusBadge';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { ExtendedVehicle } from '@/types/vehicle';
import { useLanguage } from '@/contexts/LanguageContext';
import { Car, Calendar, MapPin } from 'lucide-react';

interface VehicleTableProps {
  vehicles: any[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
}

const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles = [],
  isLoading,
  onRowClick,
}) => {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Mobile loading state */}
        <div className="block md:hidden space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        
        {/* Desktop loading state */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-8">
        <Car className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {language === 'ar' ? 'لا توجد مركبات' : 'No vehicles found'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {language === 'ar' ? 'لم يتم العثور على أي مركبات.' : 'No vehicles were found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {vehicles.map((vehicle) => (
          <div 
            key={vehicle.id} 
            className="border rounded-lg p-4 space-y-3 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow touch-friendly"
            onClick={() => onRowClick(vehicle.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Car className="h-5 w-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">
                  {vehicle.make} {vehicle.model}
                </h3>
              </div>
              <VehicleStatusBadge status={vehicle.status} />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {language === 'ar' ? 'رقم اللوحة:' : 'License Plate:'}
                </span>
                <span className="font-medium text-primary">
                  {vehicle.license_plate || (language === 'ar' ? 'غير متوفر' : 'N/A')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {language === 'ar' ? 'السنة:' : 'Year:'}
                </span>
                <span className="font-medium">
                  {vehicle.year || (language === 'ar' ? 'غير متوفر' : 'N/A')}
                </span>
              </div>
              
              {vehicle.color && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {language === 'ar' ? 'اللون:' : 'Color:'}
                  </span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
              )}
              
              {vehicle.daily_rate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {language === 'ar' ? 'الأجرة اليومية:' : 'Daily Rate:'}
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(vehicle.daily_rate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View - Enhanced for mobile */}
      <div className="hidden md:block">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch border rounded-lg">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">
                  {language === 'ar' ? 'المركبة' : 'Vehicle'}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {language === 'ar' ? 'اللوحة' : 'License Plate'}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {language === 'ar' ? 'السنة' : 'Year'}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {language === 'ar' ? 'الأجرة اليومية' : 'Daily Rate'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow 
                  key={vehicle.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onRowClick(vehicle.id)}
                >
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Car className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                        {vehicle.color && (
                          <div className="text-sm text-gray-500">{vehicle.color}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {vehicle.license_plate || (language === 'ar' ? 'غير متوفر' : 'N/A')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {vehicle.year || (language === 'ar' ? 'غير متوفر' : 'N/A')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <VehicleStatusBadge status={vehicle.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {vehicle.daily_rate ? formatCurrency(vehicle.daily_rate) : (language === 'ar' ? 'غير متوفر' : 'N/A')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default VehicleTable;
