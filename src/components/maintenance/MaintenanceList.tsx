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

export const MaintenanceList = () => {
  const { 
    getAll,
    remove,
    getAllRecords
  } = useMaintenance();
  const { useList: useVehicleList } = useVehicles();
  const { data: vehicles } = useVehicleList();
  const navigate = useNavigate();
  
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
        setMaintenanceRecords(records || []);
      } catch (err) {
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
  
  const handleSearch = async (searchTerm) => {
    try {
      setIsLoading(true);
      const records = await getAllRecords();
      
      const filteredRecords = records.filter(record => 
        record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.maintenance_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setMaintenanceRecords(filteredRecords);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = async () => {
    try {
      setIsLoading(true);
      const records = await getAllRecords();
      
      let filteredRecords = records;
      
      if (searchTerm) {
        filteredRecords = filteredRecords.filter(record => 
          record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.maintenance_type?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter && statusFilter !== 'all-statuses') {
        filteredRecords = filteredRecords.filter(record => record.status === statusFilter);
      }
      
      if (vehicleFilter && vehicleFilter !== 'all-vehicles') {
        filteredRecords = filteredRecords.filter(record => record.vehicle_id === vehicleFilter);
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
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case MaintenanceStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case MaintenanceStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case MaintenanceStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case MaintenanceStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getVehicleName = (vehicleId) => {
    if (!vehicles) return 'Loading...';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : 'Unknown Vehicle';
  };
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load maintenance records'}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search maintenance..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">All Statuses</SelectItem>
              <SelectItem value={MaintenanceStatus.SCHEDULED}>Scheduled</SelectItem>
              <SelectItem value={MaintenanceStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={MaintenanceStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={MaintenanceStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-vehicles">All Vehicles</SelectItem>
              {vehicles?.map(vehicle => (
                vehicle.id ? (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                  </SelectItem>
                ) : (
                  <SelectItem key="unknown-vehicle" value="unknown-vehicle">
                    Unknown Vehicle
                  </SelectItem>
                )
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={applyFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedRecords.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedRecords.length})
            </Button>
          )}
          
          <Button onClick={() => navigate('/maintenance/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Records</CardTitle>
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
              <h3 className="text-lg font-medium mb-2">No Maintenance Records</h3>
              <p>No maintenance records found. Add your first maintenance record to get started.</p>
              <Button className="mt-4" onClick={() => navigate('/maintenance/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Maintenance
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
                    <TableHead>Type</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedRecords.includes(record.id)}
                          onCheckedChange={() => handleSelectRecord(record.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMaintenanceType(record.maintenance_type)}
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
                          {format(new Date(record.scheduled_date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(record.status)}>
                          {record.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the maintenance record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {remove.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
