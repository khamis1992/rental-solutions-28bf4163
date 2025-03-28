import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { CustomButton } from '@/components/ui/custom-button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus, 
  Calendar, 
  Wrench,
  Filter,
  X,
  Trash2
} from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useMaintenance } from '@/hooks/use-maintenance';
import { MaintenanceStatus, MaintenanceType, type MaintenanceFilters, type MaintenanceStatusType } from '@/lib/validation-schemas/maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formatMaintenanceType = (type: string | null | undefined) => {
  if (!type) return "Unknown";
  
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getStatusBadge = (status: string) => {
  const statusLower = status?.toLowerCase();
  
  switch (statusLower) {
    case 'scheduled':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300">Scheduled</Badge>;
    case 'in_progress':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300">In Progress</Badge>;
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300">Completed</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-300">Cancelled</Badge>;
    default:
      return <Badge>{status || 'Unknown'}</Badge>;
  }
};

export const MaintenanceList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatusType | undefined>(undefined);
  const [vehicleFilter, setVehicleFilter] = useState<string | undefined>(undefined);
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const itemsPerPage = 10;

  const { useList, deleteAllRecords } = useMaintenance();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const vehicleId = params.get('vehicleId');
    if (vehicleId) {
      setVehicleFilter(vehicleId);
    }
  }, [location.search]);

  const filters: MaintenanceFilters = {
    query: searchQuery,
    status: statusFilter,
    vehicle_id: vehicleFilter,
    maintenance_type: maintenanceTypeFilter,
    date_from: dateRange?.from,
    date_to: dateRange?.to,
  };

  const { data: maintenanceRecords, isLoading, error, refetch } = useList(filters);

  useEffect(() => {
    if (error) {
      console.error("Maintenance list error:", error);
      toast({
        title: "Error loading maintenance records",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const totalItems = maintenanceRecords?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleRowClick = (id: string) => {
    navigate(`/maintenance/${id}`);
  };

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedRecords = maintenanceRecords?.slice(startIndex, endIndex) || [];

  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(undefined);
    setVehicleFilter(undefined);
    setMaintenanceTypeFilter(undefined);
    setDateRange(undefined);
  };

  const handleDeleteAllRecords = async () => {
    const success = await deleteAllRecords();
    if (success) {
      refetch();
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Maintenance Records</CardTitle>
              <CardDescription>
                View and manage vehicle maintenance records.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <CustomButton 
                variant="destructive" 
                onClick={() => setDeleteDialogOpen(true)}
                className="mr-2"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Records
              </CustomButton>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
            <div className="col-span-1 md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search records..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <CustomButton variant="outline" className="h-9 ml-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Filters</span>
                </CustomButton>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium leading-none mb-2">Status</h4>
                    <Select 
                      onValueChange={(value) => {
                        if (value === "") {
                          setStatusFilter(undefined);
                        } else {
                          setStatusFilter(value as MaintenanceStatusType);
                        }
                      }} 
                      value={statusFilter || ""}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MaintenanceStatus.SCHEDULED}>Scheduled</SelectItem>
                        <SelectItem value={MaintenanceStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={MaintenanceStatus.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={MaintenanceStatus.CANCELLED}>Cancelled</SelectItem>
                        <SelectItem value="">Clear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium leading-none mb-2">Maintenance Type</h4>
                    <Select onValueChange={setMaintenanceTypeFilter} defaultValue={maintenanceTypeFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MaintenanceType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatMaintenanceType(type)}
                          </SelectItem>
                        ))}
                        <SelectItem value={undefined}>Clear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium leading-none mb-2">Date Range</h4>
                    <Popover>
                      <PopoverTrigger asChild>
                        <CustomButton
                          variant={"outline"}
                          className={
                            "w-full justify-start text-left font-normal" +
                            (dateRange?.from
                              ? "pl-3"
                              : "text-muted-foreground")
                          }
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            format(dateRange.from, "yyyy-MM-dd") +
                            " - " +
                            format(dateRange.to || dateRange.from, "yyyy-MM-dd")
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </CustomButton>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <CustomButton variant="secondary" className="w-full" onClick={clearFilters}>
                    Clear All Filters
                    <X className="ml-2 h-4 w-4" />
                  </CustomButton>
                </div>
              </PopoverContent>
            </Popover>

            <CustomButton onClick={() => navigate('/maintenance/add')} className="col-span-1 md:col-span-1">
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </CustomButton>
          </div>

          {isLoading ? (
            <div className="mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 py-2">
                  <Skeleton className="h-4 col-span-1" />
                  <Skeleton className="h-4 col-span-1" />
                  <Skeleton className="h-4 col-span-1" />
                  <Skeleton className="h-4 col-span-1" />
                  <Skeleton className="h-4 col-span-1" />
                  <Skeleton className="h-4 col-span-1" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-red-500 mt-4">Error: {error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          ) : displayedRecords.length === 0 && !isLoading ? (
            <div className="mt-4 p-8 border rounded-md text-center">
              <p className="text-muted-foreground mb-4">No maintenance records found.</p>
              <CustomButton onClick={() => navigate('/maintenance/add')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Maintenance Record
              </CustomButton>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Service Provider</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRecords.map((record) => (
                    <TableRow key={record.id} onClick={() => handleRowClick(record.id)} className="cursor-pointer hover:bg-muted">
                      <TableCell>{formatMaintenanceType(record.maintenance_type)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{formatDate(new Date(record.scheduled_date))}</TableCell>
                      <TableCell>{record.service_provider || 'N/A'}</TableCell>
                      <TableCell>${record.cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right">
                        <CustomButton size="sm" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/maintenance/edit/${record.id}`);
                        }}>
                          <Wrench className="mr-2 h-4 w-4" />
                          Edit
                        </CustomButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalItems > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} records
              </p>
              <div className="flex items-center space-x-2">
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </CustomButton>
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </CustomButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Maintenance Records</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all maintenance records from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllRecords} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
