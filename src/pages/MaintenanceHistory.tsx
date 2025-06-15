import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { useMaintenance } from '@/hooks/use-maintenance';
import PageHeader from '@/components/ui/PageHeader';
import { 
  History, 
  Car, 
  Wrench, 
  Search,
  CheckCircle,
  Calendar as CalendarIcon,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  status: string;
}

interface MaintenanceHistoryItem {
  id: string;
  vehicle_id: string;
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
  maintenance_type: string;
  scheduled_date: string;
  completed_date: string;
  description: string;
  cost: number;
  service_provider?: string;
  performed_by?: string;
  notes?: string;
}

const MaintenanceHistory = () => {
  const { language } = useLanguage();
  const { getAllVehicles } = useVehicleService();
  const { getAllRecords } = useMaintenance();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [historyItems, setHistoryItems] = useState<MaintenanceHistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MaintenanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [vehicleData, maintenanceData] = await Promise.all([
          getAllVehicles(),
          getAllRecords()
        ]);
        
        setVehicles(vehicleData);
        
        // Transform completed maintenance records to history items
        const historyData = maintenanceData
          .filter((record: any) => record.status === 'completed')
          .map((record: any) => {
            const vehicle = vehicleData.find((v: Vehicle) => v.id === record.vehicle_id);
            return {
              id: record.id,
              vehicle_id: record.vehicle_id,
              vehicle_make: vehicle?.make || '',
              vehicle_model: vehicle?.model || '',
              license_plate: vehicle?.license_plate || '',
              maintenance_type: record.service_type || record.maintenance_type || '',
              scheduled_date: record.scheduled_date || record.date_scheduled || '',
              completed_date: record.completed_date || record.date_completed || record.updated_at || '',
              description: record.description || '',
              cost: record.cost || 0,
              service_provider: record.service_provider || '',
              performed_by: record.performed_by || '',
              notes: record.notes || ''
            };
          })
          .sort((a: any, b: any) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime());
        
        setHistoryItems(historyData);
        setFilteredItems(historyData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [getAllVehicles, getAllRecords]);

  // Apply filters
  useEffect(() => {
    let filtered = [...historyItems];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.vehicle_make.toLowerCase().includes(search) ||
        item.vehicle_model.toLowerCase().includes(search) ||
        item.license_plate.toLowerCase().includes(search) ||
        item.maintenance_type.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        (item.service_provider && item.service_provider.toLowerCase().includes(search)) ||
        (item.performed_by && item.performed_by.toLowerCase().includes(search))
      );
    }
    
    if (vehicleFilter !== 'all') {
      filtered = filtered.filter(item => item.vehicle_id === vehicleFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.maintenance_type === typeFilter);
    }
    
    setFilteredItems(filtered);
  }, [searchTerm, vehicleFilter, typeFilter, historyItems]);

  // Get unique maintenance types for filter
  const maintenanceTypes = Array.from(new Set(historyItems.map(item => item.maintenance_type)));

  return (
    <PageContainer systemDate={new Date()}>
      <PageHeader
        title={language === 'ar' ? 'تاريخ الصيانة' : 'Maintenance History'}
        subtitle={language === 'ar' ? 'عرض سجل الصيانة المكتملة للمركبات' : 'View completed maintenance records for all vehicles'}
        icon={<History className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />

      {/* Filters */}
      <div className={cn(
        "flex flex-col md:flex-row gap-4 mb-6",
        language === 'ar' ? 'md:flex-row-reverse' : ''
      )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <Search className={cn(
              "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
              language === 'ar' ? 'right-3' : 'left-3'
            )} />
            <Input
              placeholder={language === 'ar' ? 'البحث في السجل...' : 'Search history...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                language === 'ar' ? 'pr-10 text-right' : 'pl-10'
              )}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-48" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={language === 'ar' ? 'المركبة' : 'Vehicle'} />
            </SelectTrigger>
            <SelectContent align={language === 'ar' ? 'start' : 'end'}>
              <SelectItem value="all">{language === 'ar' ? 'جميع المركبات' : 'All Vehicles'}</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {`${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={language === 'ar' ? 'النوع' : 'Type'} />
            </SelectTrigger>
            <SelectContent align={language === 'ar' ? 'start' : 'end'}>
              <SelectItem value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
              {maintenanceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History Items */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-8 text-center">
            <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'لا يوجد تاريخ صيانة' : 'No maintenance history'}
            </h3>
            <p className="text-gray-500">
              {language === 'ar' ? 'لم يتم العثور على أي سجلات صيانة مكتملة.' : 'No completed maintenance records found.'}
            </p>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className={cn(
                "flex items-start justify-between",
                language === 'ar' ? 'flex-row-reverse' : 'flex-row'
              )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex-1">
                  <div className={cn(
                    "flex items-center gap-3 mb-2",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}>
                    {language === 'ar' && <Car className="h-5 w-5 text-blue-500" />}
                    <h3 className={cn(
                      "font-semibold text-lg",
                      language === 'ar' ? 'text-right' : 'text-left'
                    )}>
                      {item.vehicle_make} {item.vehicle_model}
                    </h3>
                    {language !== 'ar' && <Car className="h-5 w-5 text-blue-500" />}
                    <Badge variant="outline">{item.license_plate}</Badge>
                    <Badge variant="default" className={cn(
                      "flex items-center gap-1",
                      language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      {language === 'ar' && <CheckCircle className="w-3 h-3" />}
                      {language === 'ar' ? 'مكتمل' : 'Completed'}
                      {language !== 'ar' && <CheckCircle className="w-3 h-3" />}
                    </Badge>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-4 mb-3 text-sm text-gray-600",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}>
                    <div className={cn(
                      "flex items-center gap-1",
                      language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      {language === 'ar' && <Wrench className="h-4 w-4" />}
                      <span>{item.maintenance_type}</span>
                      {language !== 'ar' && <Wrench className="h-4 w-4" />}
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1",
                      language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      {language === 'ar' && <CalendarIcon className="h-4 w-4" />}
                      <span>
                        {language === 'ar' ? 'اكتمل في: ' : 'Completed on: '}
                        {format(new Date(item.completed_date), 'PPP', { 
                          locale: language === 'ar' ? ar : undefined 
                        })}
                      </span>
                      {language !== 'ar' && <CalendarIcon className="h-4 w-4" />}
                    </div>
                  </div>
                  
                  <p className={cn(
                    "text-gray-700 mb-3",
                    language === 'ar' ? 'text-right' : 'text-left'
                  )}>
                    {item.description}
                  </p>
                  
                  <div className={cn(
                    "flex items-center gap-4 mb-2",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}>
                    <div className={cn(
                      "flex items-center gap-1 text-lg font-semibold text-green-600",
                      language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      {language === 'ar' && <DollarSign className="h-4 w-4" />}
                      <span>{item.cost} {language === 'ar' ? 'ريال' : 'QAR'}</span>
                      {language !== 'ar' && <DollarSign className="h-4 w-4" />}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                    {item.service_provider && (
                      <p className={language === 'ar' ? 'text-right' : 'text-left'}>
                        {language === 'ar' ? 'مقدم الخدمة: ' : 'Service Provider: '}
                        <span className="font-medium">{item.service_provider}</span>
                      </p>
                    )}
                    
                    {item.performed_by && (
                      <p className={language === 'ar' ? 'text-right' : 'text-left'}>
                        {language === 'ar' ? 'المنفذ: ' : 'Performed by: '}
                        <span className="font-medium">{item.performed_by}</span>
                      </p>
                    )}
                  </div>
                  
                  {item.notes && (
                    <p className={cn(
                      "text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded",
                      language === 'ar' ? 'text-right' : 'text-left'
                    )}>
                      <strong>{language === 'ar' ? 'ملاحظات: ' : 'Notes: '}</strong>
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
};

export default MaintenanceHistory;