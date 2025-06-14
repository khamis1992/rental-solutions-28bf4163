import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, Car, Clock, Settings, Wrench, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  status?: string;
  image_url?: string;
  maintenance?: any[];
}

interface VehicleMaintenanceCardsProps {
  vehicles: Vehicle[];
  isLoading?: boolean;
  onVehicleCardClick?: (vehicle: Vehicle) => void;
}

const VehicleMaintenanceCards = ({ vehicles, isLoading = false, onVehicleCardClick }: VehicleMaintenanceCardsProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleVehicleClick = (vehicle: Vehicle) => {
    if (onVehicleCardClick && (!vehicle.maintenance || vehicle.maintenance.length === 0)) {
      onVehicleCardClick(vehicle);
    } else {
      navigate(`/maintenance/job/${vehicle.id}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'maintenance':
        return <Wrench className="h-5 w-5 text-orange-500" />;
      case 'accident':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Settings className="h-5 w-5 text-blue-500" />;
    }
  };

  const getMaintenanceStatusBadge = (record: any) => {
    if (!record) return null;
    switch(record.status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          {language === 'ar' ? 'مجدولة' : 'Scheduled'}
        </Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
          {language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
        </Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          {language === 'ar' ? 'مكتملة' : 'Completed'}
        </Badge>;
      default:
        return <Badge>{language === 'ar' ? 'غير معروف' : record.status || 'Unknown'}</Badge>;
    }
  };

  const getMaintenanceTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'oil change':
        return <Wrench className="h-4 w-4 mr-1" />;
      default:
        return <Wrench className="h-4 w-4 mr-1" />;
    }
  };

  const getVehicleStatusText = (status: string) => {
    switch(status) {
      case 'maintenance':
        return language === 'ar' ? 'قيد الصيانة' : 'In Maintenance';
      case 'accident':
        return language === 'ar' ? 'حادث' : 'Accident';
      default:
        return language === 'ar' ? 'غير معروف' : 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-48 animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-8">
        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'لا توجد مركبات قيد الصيانة' : 'No vehicles in maintenance'}
        </h3>
        <p className="text-gray-500">
          {language === 'ar' ? 'جميع المركبات في حالة جيدة حاليًا' : 'All vehicles are currently in good condition'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {vehicles.map((vehicle) => (
        <Card 
          key={vehicle.id}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleVehicleClick(vehicle)}
        >
          <CardHeader className="pb-3">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                {getStatusIcon(vehicle.status || 'maintenance')}
                <CardTitle className={`text-lg ${language === 'ar' ? 'text-right' : ''}`}>
                  {vehicle.make} {vehicle.model}
                </CardTitle>
              </div>
              <Badge variant="outline" className={`${language === 'ar' ? 'text-right' : ''}`}>
                {getVehicleStatusText(vehicle.status || 'maintenance')}
              </Badge>
            </div>
            <CardDescription className={`text-sm text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'لوحة الترخيص:' : 'License Plate:'} {vehicle.license_plate}
              {vehicle.year && (
                <span className={`${language === 'ar' ? 'mr-3' : 'ml-3'}`}>
                  {language === 'ar' ? 'السنة:' : 'Year:'} {vehicle.year}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {vehicle.maintenance && vehicle.maintenance.length > 0 ? (
              <div className="space-y-3">
                <h4 className={`text-sm font-medium flex items-center ${language === 'ar' ? 'text-right flex-row-reverse' : ''}`}>
                  <Calendar className={`h-4 w-4 text-blue-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'الصيانة الحالية' : 'Current Maintenance'}
                </h4>
                {vehicle.maintenance.slice(0, 2).map((record, index) => (
                  <div key={index} className={`flex items-center justify-between p-2 bg-gray-50 rounded ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      {getMaintenanceTypeIcon(record.maintenance_type)}
                      <span className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                        {record.maintenance_type?.replace(/_/g, ' ') || language === 'ar' ? 'غير محدد' : 'Unspecified'}
                      </span>
                    </div>
                    {getMaintenanceStatusBadge(record)}
                  </div>
                ))}
                {vehicle.maintenance.length > 2 && (
                  <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
                    {language === 'ar' 
                      ? `و ${vehicle.maintenance.length - 2} عنصر آخر...` 
                      : `And ${vehicle.maintenance.length - 2} more...`}
                  </p>
                )}
              </div>
            ) : (
              <div className={`text-center py-4 ${language === 'ar' ? 'text-right' : ''}`}>
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'لا توجد سجلات صيانة' : 'No maintenance records'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VehicleMaintenanceCards;
