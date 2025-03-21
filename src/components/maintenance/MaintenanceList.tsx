
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMaintenance } from '@/hooks/use-maintenance';
import { 
  Maintenance, 
  MaintenanceStatus, 
  MaintenanceType,
  MaintenanceFilters
} from '@/lib/validation-schemas/maintenance';
import { SectionHeader } from '@/components/ui/section-header';
import { CustomButton } from '@/components/ui/custom-button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Wrench,
  RefreshCw,
  CheckCircle,
  XCircle, 
  Calendar
} from 'lucide-react';

export const MaintenanceList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<MaintenanceFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Get maintenance records
  const { useList, useDelete } = useMaintenance();
  const { data: maintenanceRecords, isLoading, error } = useList(filters);
  const { mutate: deleteMaintenance, isPending: isDeleting } = useDelete();

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, query: searchQuery }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Update filters
  const handleFilterChange = (key: keyof MaintenanceFilters, value: any) => {
    setFilters(prev => {
      if (value === 'all') {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  // Format maintenance type for display
  const formatMaintenanceType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case MaintenanceStatus.SCHEDULED:
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Scheduled</Badge>;
      case MaintenanceStatus.IN_PROGRESS:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">In Progress</Badge>;
      case MaintenanceStatus.COMPLETED:
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Completed</Badge>;
      case MaintenanceStatus.CANCELLED:
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SectionHeader 
          title="Vehicle Maintenance" 
          description="Track and manage vehicle maintenance records" 
          icon={Wrench}
          actions={
            <CustomButton disabled>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Record
            </CustomButton>
          }
        />
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <SectionHeader 
          title="Vehicle Maintenance" 
          description="Track and manage vehicle maintenance records" 
          icon={Wrench}
        />
        
        <Card>
          <CardContent className="p-6">
            <div className="bg-destructive/10 p-4 rounded-md text-destructive">
              <h3 className="text-lg font-medium">Error Loading Maintenance Records</h3>
              <p>
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader 
        title="Vehicle Maintenance" 
        description="Track and manage vehicle maintenance records" 
        icon={Wrench}
        actions={
          <CustomButton onClick={() => navigate('/maintenance/add')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Record
          </CustomButton>
        }
      />
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Input
                  placeholder="Search maintenance records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Filter button */}
              <div className="flex items-center gap-2">
                <CustomButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {Object.keys(filters).length > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {Object.keys(filters).length}
                    </Badge>
                  )}
                </CustomButton>
                
                {Object.keys(filters).length > 0 && (
                  <CustomButton 
                    variant="ghost" 
                    size="sm"
                    onClick={resetFilters}
                  >
                    Clear
                  </CustomButton>
                )}
              </div>
            </div>
            
            {/* Filter options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/40 rounded-md">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Status
                  </label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value={MaintenanceStatus.SCHEDULED}>Scheduled</SelectItem>
                      <SelectItem value={MaintenanceStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={MaintenanceStatus.COMPLETED}>Completed</SelectItem>
                      <SelectItem value={MaintenanceStatus.CANCELLED}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Maintenance Type
                  </label>
                  <Select
                    value={filters.maintenance_type || 'all'}
                    onValueChange={(value) => handleFilterChange('maintenance_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value={MaintenanceType.OIL_CHANGE}>Oil Change</SelectItem>
                      <SelectItem value={MaintenanceType.TIRE_REPLACEMENT}>Tire Replacement</SelectItem>
                      <SelectItem value={MaintenanceType.BRAKE_SERVICE}>Brake Service</SelectItem>
                      <SelectItem value={MaintenanceType.REGULAR_INSPECTION}>Regular Inspection</SelectItem>
                      <SelectItem value={MaintenanceType.ENGINE_REPAIR}>Engine Repair</SelectItem>
                      <SelectItem value={MaintenanceType.TRANSMISSION_SERVICE}>Transmission Service</SelectItem>
                      <SelectItem value={MaintenanceType.ELECTRICAL_REPAIR}>Electrical Repair</SelectItem>
                      <SelectItem value={MaintenanceType.AIR_CONDITIONING}>Air Conditioning</SelectItem>
                      <SelectItem value={MaintenanceType.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* Maintenance Records Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Service Provider</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords && maintenanceRecords.length > 0 ? (
                    maintenanceRecords.map((record: Maintenance) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.vehicles ? (
                            <Link to={`/vehicles/${record.vehicle_id}`} className="hover:underline">
                              {`${record.vehicles.make} ${record.vehicles.model} (${record.vehicles.license_plate})`}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Unknown Vehicle</span>
                          )}
                        </TableCell>
                        <TableCell>{formatMaintenanceType(record.maintenance_type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(record.scheduled_date), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>${record.cost?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>{record.service_provider || '-'}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <DropdownMenu>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenuTrigger asChild>
                                    <CustomButton 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      disabled={isDeleting}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">Actions</span>
                                    </CustomButton>
                                  </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Actions</p>
                                </TooltipContent>
                              </Tooltip>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(`/maintenance/${record.id}`)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/maintenance/edit/${record.id}`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Record
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
                                      deleteMaintenance(record.id as string);
                                    }
                                  }}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Record
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Wrench className="h-8 w-8 mb-2" />
                          <p className="mb-2 font-medium">No maintenance records found</p>
                          <p className="text-sm">
                            {Object.keys(filters).length > 0 
                              ? 'Try changing your filters or add a new maintenance record'
                              : 'Add your first maintenance record to get started'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
