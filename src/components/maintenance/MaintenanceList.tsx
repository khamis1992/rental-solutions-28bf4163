
import React, { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useVehicles } from '@/hooks/use-vehicles';
import { formatCurrency } from '@/lib/utils';

// Define the MaintenanceItem type
interface MaintenanceItem {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  cost: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  assigned_to?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Define the Vehicle type for proper type checking
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  license_plate: string;
  [key: string]: any; // For other vehicle properties
}

export function MaintenanceList() {
  const { maintenanceRecords, isLoading } = useMaintenance();
  const { vehicles } = useVehicles();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('');
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Utility function to get vehicle details by ID
  const getVehicleById = useCallback((vehicleId: string) => {
    if (!vehicles || !Array.isArray(vehicles)) return null;
    return vehicles.find(vehicle => vehicle.id === vehicleId);
  }, [vehicles]);
  
  // Formatted records with vehicle details
  const formattedRecords = React.useMemo(() => {
    if (!maintenanceRecords) return [];
    
    return Array.isArray(maintenanceRecords) ? maintenanceRecords
      .filter(record => {
        // Apply all filters
        const matchesSearch = searchTerm === '' || 
          record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (record.assigned_to && record.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()));
          
        const matchesVehicle = vehicleFilter === '' || record.vehicle_id === vehicleFilter;
        const matchesType = maintenanceTypeFilter === '' || record.maintenance_type === maintenanceTypeFilter;
        const matchesStatus = statusFilter === '' || record.status === statusFilter;
        
        return matchesSearch && matchesVehicle && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        // Sort by scheduled date (most recent first)
        const dateA = new Date(a.scheduled_date).getTime();
        const dateB = new Date(b.scheduled_date).getTime();
        return dateB - dateA;
      }) : [];
  }, [maintenanceRecords, searchTerm, vehicleFilter, maintenanceTypeFilter, statusFilter]);
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'outline';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search maintenance records..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Vehicles</SelectItem>
            {vehicles && Array.isArray(vehicles) && vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={maintenanceTypeFilter} onValueChange={setMaintenanceTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="REGULAR_INSPECTION">Regular Inspection</SelectItem>
            <SelectItem value="OIL_CHANGE">Oil Change</SelectItem>
            <SelectItem value="TIRE_REPLACEMENT">Tire Replacement</SelectItem>
            <SelectItem value="BRAKE_SERVICE">Brake Service</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedRecords.length > 0 ? (
              formattedRecords.map((record) => {
                const vehicle = getVehicleById(record.vehicle_id);
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      {vehicle ? (
                        <span>
                          {vehicle.make} {vehicle.model} <br />
                          <span className="text-xs text-muted-foreground">
                            {vehicle.license_plate}
                          </span>
                        </span>
                      ) : (
                        "Unknown Vehicle"
                      )}
                    </TableCell>
                    <TableCell>
                      {record.maintenance_type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.description}
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.scheduled_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{formatCurrency(record.cost)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/maintenance/${record.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No maintenance records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default MaintenanceList;
