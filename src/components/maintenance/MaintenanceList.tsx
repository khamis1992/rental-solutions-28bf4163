
import React, { useState, useEffect } from 'react';
import { useMaintenance } from '@/hooks/use-maintenance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Plus, Search, Filter, Calendar, Car, Wrench, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicles } from '@/hooks/use-vehicles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation as useI18nTranslation } from 'react-i18next';

export const MaintenanceList = () => {
  const { 
    getAll,
    remove,
    getAllRecords
  } = useMaintenance();
  const { useList: useVehicleList } = useVehicles();
  const { data: vehicles } = useVehicleList();
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all-statuses');
  const [vehicleFilter, setVehicleFilter] = useState('all-vehicles');
  
  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        setIsLoading(true);
        const records = await getAllRecords();
        console.log("Fetched maintenance records:", records);
        setMaintenanceRecords(records || []);
      } catch (err) {
        console.error("Error fetching maintenance records:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaintenance();
  }, []);
  
  const handleSelectRecord = (id) => {
    if (selectedRecords.includes(id)) {
      setSelectedRecords(selectedRecords.filter(recordId => recordId !== id));
    } else {
      setSelectedRecords([...selectedRecords, id]);
    }
  };
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRecords(maintenanceRecords.map(record => record.id));
    } else {
      setSelectedRecords([]);
    }
  };
  
  const handleDelete = (id) => {
    setRecordToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (recordToDelete) {
      remove.mutate(recordToDelete, {
        onSuccess: () => {
          setMaintenanceRecords(maintenanceRecords.filter(record => record.id !== recordToDelete));
          setSelectedRecords(selectedRecords.filter(id => id !== recordToDelete));
        }
      });
    }
    setIsDeleteDialogOpen(false);
    setRecordToDelete(null);
  };
  
  const handleBulkDelete = () => {
    console.log("Bulk delete functionality is not implemented");
  };
  
  const applyFilters = async () => {
    try {
      setIsLoading(true);
      const records = await getAllRecords();
      
      let filteredRecords = records;
      
      if (searchTerm) {
        filteredRecords = filteredRecords.filter(record => 
          record?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record?.maintenance_type?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter && statusFilter !== 'all-statuses') {
        filteredRecords = filteredRecords.filter(record => record?.status === statusFilter);
      }
      
      if (vehicleFilter && vehicleFilter !== 'all-vehicles') {
        filteredRecords = filteredRecords.filter(record => record?.vehicle_id === vehicleFilter);
      }
      
      setMaintenanceRecords(filteredRecords);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearFilters = async () => {
    setSearchTerm('');
    setStatusFilter('all-statuses');
    setVehicleFilter('all-vehicles');
    
    try {
      setIsLoading(true);
      const records = await getAllRecords();
      setMaintenanceRecords(records || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatMaintenanceType = (type) => {
    if (!type) return t('common.notProvided');
    const key = `maintenance.types.${type.toLowerCase()}`;
    return t(key);
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "scheduled":
        return 'bg-blue-100 text-blue-800';
      case "in_progress":
        return 'bg-yellow-100 text-yellow-800';
      case "completed":
        return 'bg-green-100 text-green-800';
      case "cancelled":
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getVehicleName = (vehicleId) => {
    if (!vehicles) return t('common.loading');
    const vehicle = vehicles.find(v => v?.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : t('common.notProvided');
  };
  
  const getValidVehicleOptions = () => {
    if (!vehicles || !Array.isArray(vehicles)) return [];
    
    return vehicles.filter(vehicle => 
      vehicle && 
      vehicle.id &&
      vehicle.make && 
      vehicle.model && 
      vehicle.license_plate
    );
  };
  
  const getStatusTranslation = (status) => {
    if (!status) return t('common.notProvided');
    return t(`maintenance.status.${status.replace('_', '')}`);
  };
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('common.error')}</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : t('common.error')}
        </AlertDescription>
      </Alert>
    );
  }

  const validVehicleOptions = getValidVehicleOptions();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.search')}
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('maintenance.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">{t('maintenance.status.allStatuses')}</SelectItem>
              <SelectItem value="scheduled">{t('maintenance.status.scheduled')}</SelectItem>
              <SelectItem value="in_progress">{t('maintenance.status.inProgress')}</SelectItem>
              <SelectItem value="completed">{t('maintenance.status.completed')}</SelectItem>
              <SelectItem value="cancelled">{t('maintenance.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t('maintenance.filters.vehicle')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-vehicles">{t('vehicles.allModels')}</SelectItem>
              {validVehicleOptions.map(vehicle => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={applyFilters}>
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filter')}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t('common.cancel')}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedRecords.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')} ({selectedRecords.length})
            </Button>
          )}
          
          <Button onClick={() => navigate('/maintenance/add')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('maintenance.add')}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('maintenance.records')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : maintenanceRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium mb-2">{t('maintenance.noRecords')}</h3>
              <p>{t('maintenance.noRecordsDesc')}</p>
              <Button className="mt-4" onClick={() => navigate('/maintenance/add')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('maintenance.add')}
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        onCheckedChange={handleSelectAll}
                        checked={selectedRecords.length === maintenanceRecords.length && maintenanceRecords.length > 0}
                      />
                    </TableHead>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead>{t('common.vehicle')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.price')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords.map(record => {
                    if (!record || !record.id) return null;
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedRecords.includes(record.id)}
                            onCheckedChange={() => handleSelectRecord(record.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatMaintenanceType(record.maintenance_type || 'unknown')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                            {getVehicleName(record.vehicle_id)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {record.scheduled_date ? format(new Date(record.scheduled_date), 'MMM d, yyyy') : t('common.notProvided')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(record.status)}>
                            {getStatusTranslation(record.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>${record.cost?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/maintenance/${record.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {remove.isPending ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
