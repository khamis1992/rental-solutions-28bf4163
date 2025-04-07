import React, { useState, useMemo } from 'react';
import { 
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnFiltersState,
  SortingState,
  ColumnDef
} from "@tanstack/react-table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertTriangle, 
  CheckCircle, 
  MoreVertical, 
  Plus, 
  Search, 
  X,
  UserCheck,
  Filter,
  Loader2
} from 'lucide-react';
import { useTrafficFines, TrafficFine } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';
import { StatCard } from '@/components/ui/stat-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TrafficFinesTableProps {
  onAddFine?: () => void;
  isAutoAssigning?: boolean;
}

const TrafficFinesTable = ({ onAddFine, isAutoAssigning = false }: TrafficFinesTableProps) => {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  
  // Data state
  const { trafficFines, isLoading, error, payTrafficFine, disputeTrafficFine, assignToCustomer } = useTrafficFines();
  const [assigningFines, setAssigningFines] = useState(false);
  
  // Column definitions
  const columns = useMemo<ColumnDef<TrafficFine>[]>(() => [
    {
      accessorKey: "violationNumber",
      header: "Violation #",
      cell: ({ row }) => (
        <div className="flex items-center">
          <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
          {row.getValue("violationNumber")}
        </div>
      ),
    },
    {
      accessorKey: "licensePlate",
      header: "License Plate",
    },
    {
      accessorKey: "violationDate",
      header: "Violation Date",
      cell: ({ row }) => formatDate(row.getValue("violationDate")),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => row.getValue("location") || "N/A",
    },
    {
      accessorKey: "fineAmount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.getValue("fineAmount")),
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("paymentStatus") as string;
        switch (status) {
          case 'paid':
            return <Badge className="bg-green-500 text-white border-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
          case 'disputed':
            return <Badge className="bg-amber-500 text-white border-amber-600"><AlertTriangle className="mr-1 h-3 w-3" /> Disputed</Badge>;
          case 'pending':
          default:
            return <Badge className="bg-red-500 text-white border-red-600"><X className="mr-1 h-3 w-3" /> Pending</Badge>;
        }
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => {
        const fine = row.original;
        if (fine.customerId) {
          return (
            <div>
              <Badge className="bg-blue-500 text-white border-blue-600">
                <UserCheck className="mr-1 h-3 w-3" /> Assigned
              </Badge>
              {fine.customerName && (
                <div className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
                  {fine.customerName}
                </div>
              )}
            </div>
          );
        }
        return <Badge variant="outline">Unassigned</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const fine = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handlePayFine(fine.id)}
                disabled={fine.paymentStatus === 'paid'}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Pay Fine
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDisputeFine(fine.id)}
                disabled={fine.paymentStatus === 'disputed'}
              >
                <X className="mr-2 h-4 w-4" /> Dispute Fine
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleAssignToCustomer(fine.id)}
                disabled={!!fine.customerId}
              >
                <UserCheck className="mr-2 h-4 w-4" /> Assign to Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  // Filter traffic fines based on status and assignment filters
  const filteredFines = useMemo(() => {
    if (!trafficFines) return [];
    
    return trafficFines.filter(fine => {
      // Apply status filter
      if (statusFilter !== 'all' && fine.paymentStatus !== statusFilter) {
        return false;
      }
      
      // Apply assignment filter
      if (assignmentFilter === 'assigned' && !fine.customerId) {
        return false;
      }
      if (assignmentFilter === 'unassigned' && fine.customerId) {
        return false;
      }
      
      return true;
    });
  }, [trafficFines, statusFilter, assignmentFilter]);
  
  // Stats calculations
  const assignedFines = filteredFines.filter(fine => fine.customerId);
  const unassignedFines = filteredFines.filter(fine => !fine.customerId);
  const assignedFinesAmount = assignedFines.reduce((total, fine) => total + fine.fineAmount, 0);
  const unassignedFinesAmount = unassignedFines.reduce((total, fine) => total + fine.fineAmount, 0);
  
  // Create table instance
  const table = useReactTable({
    data: filteredFines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  // Event handlers
  const handlePayFine = async (id: string) => {
    try {
      await payTrafficFine.mutateAsync({ id } as any);
      toast.success("Fine marked as paid successfully");
    } catch (error) {
      console.error("Error paying fine:", error);
      toast.error("Failed to pay fine", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  const handleDisputeFine = async (id: string) => {
    try {
      await disputeTrafficFine.mutateAsync({ id } as any);
      toast.success("Fine marked as disputed successfully");
    } catch (error) {
      console.error("Error disputing fine:", error);
      toast.error("Failed to dispute fine", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };
  
  const handleAssignToCustomer = async (id: string) => {
    try {
      await assignToCustomer.mutateAsync({ id } as any);
    } catch (error) {
      console.error("Error assigning fine:", error);
    }
  };

  const handleAutoAssignFines = async () => {
    try {
      setAssigningFines(true);
      toast.info("Auto-assigning fines", {
        description: "Please wait while fines are assigned to customers..."
      });

      let assignedCount = 0;
      let failedCount = 0;
      const pendingFines = unassignedFines;

      if (pendingFines.length === 0) {
        toast.info("No unassigned fines to process");
        setAssigningFines(false);
        return;
      }

      console.log(`Attempting to auto-assign ${pendingFines.length} fines`);

      for (const fine of pendingFines) {
        if (!fine.licensePlate) {
          console.log(`Skipping fine ${fine.id} - missing license plate`);
          continue;
        }

        try {
          console.log(`Assigning fine ${fine.id} with license plate ${fine.licensePlate}`);
          await assignToCustomer.mutateAsync({ id: fine.id } as any);
          assignedCount++;
        } catch (error) {
          console.error(`Failed to assign fine ${fine.id}:`, error);
          failedCount++;
        }
      }

      if (assignedCount > 0) {
        toast.success(`Successfully assigned ${assignedCount} out of ${pendingFines.length} fines to customers`);
      } else {
        toast.warning("No fines could be assigned to customers");
      }

      if (failedCount > 0) {
        toast.error(`Failed to assign ${failedCount} fines`);
      }
    } catch (error: any) {
      console.error("Auto-assignment error:", error);
      toast.error("There was an error assigning fines to customers: " + (error.message || "Unknown error"));
    } finally {
      setAssigningFines(false);
    }
  };

  // Error handling
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading traffic fines</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load traffic fines data"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Traffic Fines"
          value={filteredFines.length.toString()}
          description="Total number of traffic fines in the system"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <StatCard 
          title="Assigned Fines"
          value={assignedFines.length.toString()}
          description={`Total amount: ${formatCurrency(assignedFinesAmount)}`}
          icon={UserCheck}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Unassigned Fines"
          value={unassignedFines.length.toString()}
          description={`Total amount: ${formatCurrency(unassignedFinesAmount)}`}
          icon={UserCheck}
          iconColor="text-red-500"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Traffic Fines</CardTitle>
              <CardDescription>
                Manage and track traffic fines for your vehicles
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                className="w-full md:w-auto"
                onClick={handleAutoAssignFines}
                disabled={assigningFines || isAutoAssigning}
                variant="secondary"
              >
                {(assigningFines || isAutoAssigning) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" /> 
                    Auto-Assign
                  </>
                )}
              </Button>
              <Button 
                className="w-full md:w-auto"
                onClick={onAddFine}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Fine
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by violation number, license plate, or charge..."
                className="pl-8"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="w-full md:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto">
                <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <UserCheck className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All fines</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {isLoading || isAutoAssigning ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                {isAutoAssigning ? "Auto-assigning traffic fines..." : "Loading traffic fines..."}
              </span>
            </div>
          ) : (
            <>
              <DataTable table={table} />
              <div className="mt-4">
                <DataTablePagination table={table} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFinesTable;
