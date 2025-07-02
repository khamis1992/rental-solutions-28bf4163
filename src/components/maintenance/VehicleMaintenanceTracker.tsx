import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Fuel,
  Activity,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Settings
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

import { toast } from 'sonner';

interface VehicleMaintenanceStatus {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  currentMileage: number;
  status: 'available' | 'rented' | 'maintenance' | 'out-of-service';
  maintenanceHealth: {
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  };
  lastMaintenance: {
    date: Date;
    type: string;
    mileage: number;
    cost: number;
  };
  nextMaintenance: {
    type: string;
    dueDate: Date;
    dueMileage: number;
    estimatedCost: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  maintenanceSchedule: Array<{
    id: string;
    type: string;
    scheduledDate: Date;
    status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'urgent' | 'info';
    message: string;
    messageEn: string;
  }>;
  location: {
    current: string;
    lastUpdate: Date;
  };
  fuel: {
    level: number;
    lastRefill: Date;
  };
  performance: {
    efficiency: number;
    reliability: number;
    customerSatisfaction: number;
  };
}

export const VehicleMaintenanceTracker = () => {
  const { language } = useLanguage();
  const [vehicles, setVehicles] = useState<VehicleMaintenanceStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nextMaintenance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Simulate vehicle data
  useEffect(() => {
    const mockVehicles: VehicleMaintenanceStatus[] = [
      {
        vehicleId: 'v1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'أ ب ج 123',
        currentMileage: 57000,
        status: 'rented',
        maintenanceHealth: {
          score: 85,
          level: 'good'
        },
        lastMaintenance: {
          date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          type: 'oil_change',
          mileage: 55000,
          cost: 150
        },
        nextMaintenance: {
          type: 'routine_inspection',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          dueMileage: 60000,
          estimatedCost: 200,
          priority: 'medium'
        },
        maintenanceSchedule: [
          {
            id: 'm1',
            type: 'routine_inspection',
            scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            status: 'scheduled'
          }
        ],
        alerts: [
          {
            id: 'a1',
            type: 'info',
            message: 'الفحص الدوري قريباً',
            messageEn: 'Routine inspection due soon'
          }
        ],
        location: {
          current: 'مع العميل - الدوحة',
          lastUpdate: new Date()
        },
        fuel: {
          level: 75,
          lastRefill: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        performance: {
          efficiency: 88,
          reliability: 92,
          customerSatisfaction: 95
        }
      },
      {
        vehicleId: 'v2',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        licensePlate: 'د هـ و 456',
        currentMileage: 32000,
        status: 'maintenance',
        maintenanceHealth: {
          score: 65,
          level: 'fair'
        },
        lastMaintenance: {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          type: 'brake_service',
          mileage: 31500,
          cost: 350
        },
        nextMaintenance: {
          type: 'transmission_service',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          dueMileage: 35000,
          estimatedCost: 500,
          priority: 'high'
        },
        maintenanceSchedule: [
          {
            id: 'm2',
            type: 'brake_service',
            scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            status: 'in-progress'
          }
        ],
        alerts: [
          {
            id: 'a2',
            type: 'warning',
            message: 'صيانة في الورشة',
            messageEn: 'Vehicle in maintenance'
          }
        ],
        location: {
          current: 'ورشة الصيانة الرئيسية',
          lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000)
        },
        fuel: {
          level: 45,
          lastRefill: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
        },
        performance: {
          efficiency: 75,
          reliability: 80,
          customerSatisfaction: 88
        }
      },
      {
        vehicleId: 'v3',
        make: 'Nissan',
        model: 'Altima',
        year: 2020,
        licensePlate: 'ز ح ط 789',
        currentMileage: 89000,
        status: 'available',
        maintenanceHealth: {
          score: 45,
          level: 'poor'
        },
        lastMaintenance: {
          date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          type: 'engine_repair',
          mileage: 85000,
          cost: 1200
        },
        nextMaintenance: {
          type: 'major_service',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          dueMileage: 90000,
          estimatedCost: 800,
          priority: 'urgent'
        },
        maintenanceSchedule: [
          {
            id: 'm3',
            type: 'major_service',
            scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            status: 'overdue'
          }
        ],
        alerts: [
          {
            id: 'a3',
            type: 'urgent',
            message: 'صيانة متأخرة - خطر',
            messageEn: 'Overdue maintenance - risk'
          },
          {
            id: 'a4',
            type: 'warning',
            message: 'مستوى الأداء منخفض',
            messageEn: 'Low performance level'
          }
        ],
        location: {
          current: 'موقف المركبات - الرئيسي',
          lastUpdate: new Date(Date.now() - 30 * 60 * 1000)
        },
        fuel: {
          level: 20,
          lastRefill: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        },
        performance: {
          efficiency: 60,
          reliability: 55,
          customerSatisfaction: 70
        }
      }
    ];

    setVehicles(mockVehicles);
  }, []);

  const getHealthColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'rented': return 'text-blue-600 bg-blue-100';
      case 'maintenance': return 'text-orange-600 bg-orange-100';
      case 'out-of-service': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      available: language === 'ar' ? 'متاحة' : 'Available',
      rented: language === 'ar' ? 'مؤجرة' : 'Rented',
      maintenance: language === 'ar' ? 'صيانة' : 'Maintenance',
      'out-of-service': language === 'ar' ? 'خارج الخدمة' : 'Out of Service'
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.licensePlate.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const matchesHealth = healthFilter === 'all' || vehicle.maintenanceHealth.level === healthFilter;
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  const handleScheduleMaintenance = (vehicleId: string) => {
    toast.success(language === 'ar' ? 'فتح نافذة جدولة الصيانة' : 'Opening maintenance scheduling');
  };

  const handleViewDetails = (vehicleId: string) => {
    toast.info(language === 'ar' ? 'عرض تفاصيل المركبة' : 'Viewing vehicle details');
  };

  return (
    <Card className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={cn(
          "flex items-center gap-2",
          language === 'ar' ? 'flex-row-reverse text-right' : ''
        )}>
          <Activity className="h-5 w-5 text-blue-500" />
          <span>{language === 'ar' ? 'تتبع حالة المركبات' : 'Vehicle Status Tracker'}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters and Search */}
        <div className={cn(
          "flex gap-4 flex-wrap",
          language === 'ar' ? 'flex-row-reverse' : ''
        )}>
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className={cn(
                "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
                language === 'ar' ? 'right-3' : 'left-3'
              )} />
              <Input
                placeholder={language === 'ar' ? 'بحث في المركبات...' : 'Search vehicles...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(language === 'ar' ? 'pr-10 text-right' : 'pl-10')}
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
              <SelectItem value="available">{language === 'ar' ? 'متاحة' : 'Available'}</SelectItem>
              <SelectItem value="rented">{language === 'ar' ? 'مؤجرة' : 'Rented'}</SelectItem>
              <SelectItem value="maintenance">{language === 'ar' ? 'صيانة' : 'Maintenance'}</SelectItem>
              <SelectItem value="out-of-service">{language === 'ar' ? 'خارج الخدمة' : 'Out of Service'}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع المستويات' : 'All Levels'}</SelectItem>
              <SelectItem value="excellent">{language === 'ar' ? 'ممتازة' : 'Excellent'}</SelectItem>
              <SelectItem value="good">{language === 'ar' ? 'جيدة' : 'Good'}</SelectItem>
              <SelectItem value="fair">{language === 'ar' ? 'مقبولة' : 'Fair'}</SelectItem>
              <SelectItem value="poor">{language === 'ar' ? 'ضعيفة' : 'Poor'}</SelectItem>
              <SelectItem value="critical">{language === 'ar' ? 'حرجة' : 'Critical'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.vehicleId} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className={cn(
                  "flex items-center justify-between",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}>
                  <div className={cn(
                    "flex items-center gap-2",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <Car className="h-5 w-5 text-blue-500" />
                    <div className={language === 'ar' ? 'text-right' : ''}>
                      <h4 className="font-semibold text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </h4>
                      <p className="text-sm text-gray-600">{vehicle.licensePlate}</p>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(vehicle.status)}>
                    {getStatusLabel(vehicle.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Health Score */}
                <div>
                  <div className={cn(
                    "flex justify-between text-sm mb-2",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <span>{language === 'ar' ? 'صحة المركبة:' : 'Vehicle Health:'}</span>
                    <Badge className={getHealthColor(vehicle.maintenanceHealth.level)}>
                      {vehicle.maintenanceHealth.score}%
                    </Badge>
                  </div>
                  <Progress value={vehicle.maintenanceHealth.score} className="h-2" />
                </div>

                {/* Current Status */}
                <div className={cn(
                  "flex items-center gap-2 text-sm text-gray-600",
                  language === 'ar' ? 'flex-row-reverse text-right' : ''
                )}>
                  <MapPin className="h-4 w-4" />
                  <span>{vehicle.location.current}</span>
                </div>

                {/* Mileage */}
                <div className={cn(
                  "flex justify-between text-sm",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}>
                  <span>{language === 'ar' ? 'المسافة المقطوعة:' : 'Mileage:'}</span>
                  <span className="font-medium">
                    {vehicle.currentMileage.toLocaleString()} {language === 'ar' ? 'كم' : 'km'}
                  </span>
                </div>

                {/* Fuel Level */}
                <div>
                  <div className={cn(
                    "flex justify-between text-sm mb-2",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <div className={cn(
                      "flex items-center gap-1",
                      language === 'ar' ? 'flex-row-reverse' : ''
                    )}>
                      <Fuel className="h-4 w-4" />
                      <span>{language === 'ar' ? 'الوقود:' : 'Fuel:'}</span>
                    </div>
                    <span className="font-medium">{vehicle.fuel.level}%</span>
                  </div>
                  <Progress value={vehicle.fuel.level} className="h-2" />
                </div>

                {/* Next Maintenance */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className={cn(
                    "flex items-center gap-2 mb-2",
                    language === 'ar' ? 'flex-row-reverse text-right' : ''
                  )}>
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">
                      {language === 'ar' ? 'الصيانة القادمة:' : 'Next Maintenance:'}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "text-sm text-gray-700",
                    language === 'ar' ? 'text-right' : ''
                  )}>
                    <p className="mb-1">{vehicle.nextMaintenance.type.replace('_', ' ')}</p>
                    <div className={cn(
                      "flex justify-between",
                      language === 'ar' ? 'flex-row-reverse' : ''
                    )}>
                      <span>{vehicle.nextMaintenance.dueDate.toLocaleDateString()}</span>
                      <span className={getPriorityColor(vehicle.nextMaintenance.priority)}>
                        {vehicle.nextMaintenance.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                {vehicle.alerts.length > 0 && (
                  <div className="space-y-1">
                    {vehicle.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-2 rounded text-xs border-l-4",
                          alert.type === 'urgent' && 'border-red-500 bg-red-50 text-red-800',
                          alert.type === 'warning' && 'border-orange-500 bg-orange-50 text-orange-800',
                          alert.type === 'info' && 'border-blue-500 bg-blue-50 text-blue-800',
                          language === 'ar' && 'border-l-0 border-r-4 text-right'
                        )}
                      >
                        {language === 'ar' ? alert.message : alert.messageEn}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className={cn(
                  "flex gap-2 pt-2",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleMaintenance(vehicle.vehicleId)}
                    className="flex-1"
                  >
                    <Wrench className="h-3 w-3 mr-1" />
                    {language === 'ar' ? 'جدولة صيانة' : 'Schedule'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(vehicle.vehicleId)}
                  >
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <Car className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'ar' ? 'لا توجد مركبات' : 'No Vehicles Found'}
            </h3>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'لا توجد مركبات تطابق معايير البحث المحددة'
                : 'No vehicles match the selected search criteria'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
