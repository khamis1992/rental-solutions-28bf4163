import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  SortingState,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  RowSelectionState
} from "@tanstack/react-table";
import { 
  MoreHorizontal, 
  FileText, 
  FileCheck, 
  FileX, 
  FileClock, 
  FileEdit,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  ArrowUpDown,
  Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgreements, SimpleAgreement } from '@/hooks/use-agreements';
import { useVehicles } from '@/hooks/use-vehicles';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Skeleton } from '@/components/ui/skeleton';
import { Car } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface BasicAgreementRow {
  id: string;
  agreement_number?: string;
  customer_id?: string;
  vehicle_id?: string;
  status?: string;
  total_amount?: number;
  created_at?: string;
  start_date?: string;
  end_date?: string;
  customers?: any;
  vehicles?: any;
  [key: string]: any;
}

interface AgreementListProps {
  refreshTrigger?: number;
  searchQuery?: string;
}

export function AgreementList({ refreshTrigger = 0, searchQuery = '' }: AgreementListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const queryClient = useQueryClient();
  
  const { 
    agreements, 
    isLoading, 
    error,
    searchParams, 
    setSearchParams,
    deleteAgreement 
  } = useAgreements({ query: searchQuery, status: statusFilter });
  
  useEffect(() => {
    setSearchParams(prev => ({ ...prev, query: searchQuery }));
  }, [searchQuery, setSearchParams]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    }
  }, [refreshTrigger, queryClient]);
  
  const { useRealtimeUpdates: useVehicleRealtimeUpdates } = useVehicles();
  useVehicleRealtimeUpdates();
  
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);
  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setRowSelection({});
    setPagination({
      pageIndex: 0,
      pageSize: 10,
    });
  }, [agreements, statusFilter, searchQuery]);

  const handleBulkDelete = async () => {
    if (!agreements) return;
    
    setIsDeleting(true);
    
    const selectedIds = Object.keys(rowSelection).map(
      index => agreements[parseInt(index)].id as string
    );
    
    console.log("Selected IDs for deletion:", selectedIds);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const id of selectedIds) {
      try {
        console.log(`Starting deletion process for agreement ${id}`);
        
        const { error: overduePaymentsDeleteError } = await supabase
          .from('overdue_payments')
          .delete()
          .eq('agreement_id', id);
          
        if (overduePaymentsDeleteError) {
          console.error(`Failed to delete related overdue payments for ${id}:`, overduePaymentsDeleteError);
        } else {
          console.log(`Successfully deleted related overdue payments for ${id}`);
        }
        
        const { error: paymentDeleteError } = await supabase
          .from('unified_payments')
          .delete()
          .eq('lease_id', id);
          
        if (paymentDeleteError) {
          console.error(`Failed to delete related payments for ${id}:`, paymentDeleteError);
        } else {
          console.log(`Successfully deleted related payments for ${id}`);
        }
        
        const { data: relatedReverts } = await supabase
          .from('agreement_import_reverts')
          .select('id')
          .eq('import_id', id);
          
        if (relatedReverts && relatedReverts.length > 0) {
          const { error: revertDeleteError } = await supabase
            .from('agreement_import_reverts')
            .delete()
            .eq('import_id', id);
            
          if (revertDeleteError) {
            console.error(`Failed to delete related revert records for ${id}:`, revertDeleteError);
          } else {
            console.log(`Successfully deleted related revert records for ${id}`);
          }
        }
        
        const { data: trafficFines, error: trafficFinesError } = await supabase
          .from('traffic_fines')
          .select('id')
          .eq('agreement_id', id);
          
        if (trafficFinesError) {
          console.error(`Error checking traffic fines for ${id}:`, trafficFinesError);
        } else if (trafficFines && trafficFines.length > 0) {
          const { error: finesDeleteError } = await supabase
            .from('traffic_fines')
            .delete()
            .eq('agreement_id', id);
            
          if (finesDeleteError) {
            console.error(`Failed to delete related traffic fines for ${id}:`, finesDeleteError);
          } else {
            console.log(`Successfully deleted related traffic fines for ${id}`);
          }
        }
        
        const { error } = await supabase
          .from('leases')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error(`Failed to delete agreement ${id}:`, error);
          toast.error(`Failed to delete agreement: ${error.message}`);
          errorCount++;
        } else {
          console.log(`Successfully deleted agreement ${id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to delete agreement ${id}:`, error);
        errorCount++;
      }
    }
    
    if (errorCount === 0) {
      toast.success(`Successfully deleted ${successCount} agreement${successCount !== 1 ? 's' : ''}`);
    } else if (successCount === 0) {
      toast.error(`Failed to delete any agreements`);
    } else {
      toast.warning(`Deleted ${successCount} agreement${successCount !== 1 ? 's' : ''}, but failed to delete ${errorCount}`);
    }
    
    setRowSelection({});
    setBulkDeleteDialogOpen(false);
    setIsDeleting(false);
    
    queryClient.invalidateQueries({ queryKey: ['agreements'] });
  };

  const columns: ColumnDef<BasicAgreementRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "agreement_number",
      header: "Agreement #",
      cell: ({ row }) => (
        <div className="font-medium">
          <Link 
            to={`/agreements/${row.original.id}`}
            className="font-medium text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              console.log("Navigating to agreement detail:", row.original.id);
              navigate(`/agreements/${row.original.id}`);
            }}
          >
            {row.getValue("agreement_number")}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "customers.full_name",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original.customers;
        return (
          <div>
            {customer && customer.id ? (
              <Link 
                to={`/customers/${customer.id}`}
                className="hover:underline"
              >
                {customer.full_name || 'N/A'}
              </Link>
            ) : (
              'N/A'
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "vehicles",
      header: "Vehicle",
      cell: ({ row }) => {
        const vehicle = row.original.vehicles;
        return (
          <div>
            {vehicle && vehicle.id ? (
              <Link 
                to={`/vehicles/${vehicle.id}`}
                className="hover:underline"
              >
                {vehicle.make && vehicle.model ? (
                  <div className="flex items-center">
                    <Car className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <span>
                      {vehicle.make} {vehicle.model} 
                      <span className="font-semibold text-primary ml-1">({vehicle.license_plate})</span>
                    </span>
                  </div>
                ) : vehicle.license_plate ? (
                  <div className="flex items-center">
                    <Car className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <span>Vehicle: <span className="font-semibold text-primary">{vehicle.license_plate}</span></span>
                  </div>
                ) : 'N/A'}
              </Link>
            ) : row.original.vehicle_id ? (
              <Link 
                to={`/vehicles/${row.original.vehicle_id}`}
                className="hover:underline text-amber-600"
              >
                Vehicle ID: {row.original.vehicle_id}
              </Link>
            ) : (
              'N/A'
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "start_date",
      header: "Rental Period",
      cell: ({ row }) => {
        const startDate = row.original.start_date;
        const endDate = row.original.end_date;
        return (
          <div className="whitespace-nowrap">
            {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
          </div>
        );
      },
    },
    {
      accessorKey: "total_amount",
      header: "Amount",
      cell: ({ row }) => {
        return (
          <div className="font-medium">
            {formatCurrency(row.original.total_amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge 
            variant={
              status === AgreementStatus.ACTIVE ? "success" : 
              status === AgreementStatus.DRAFT ? "secondary" : 
              status === AgreementStatus.PENDING ? "warning" :
              status === AgreementStatus.EXPIRED ? "outline" :
              "destructive"
            }
            className="capitalize"
          >
            {status === AgreementStatus.ACTIVE ? (
              <FileCheck className="h-3 w-3 mr-1" />
            ) : status === AgreementStatus.DRAFT ? (
              <FileEdit className="h-3 w-3 mr-1" />
            ) : status === AgreementStatus.PENDING ? (
              <FileClock className="h-3 w-3 mr-1" />
            ) : status === AgreementStatus.EXPIRED ? (
              <FileText className="h-3 w-3 mr-1" />
            ) : (
              <FileX className="h-3 w-3 mr-1" />
            )}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="px-0 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const createdAt = row.original.created_at;
        return (
          <div className="whitespace-nowrap">
            {createdAt ? format(new Date(createdAt), 'MMM d, yyyy') : 'N/A'}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const agreement = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/agreements/${agreement.id}`}>
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/agreements/edit/${agreement.id}`}>
                  Edit agreement
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete agreement ${agreement.agreement_number}?`)) {
                    deleteAgreement.mutate(agreement.id as string);
                  }
                }}
              >
                Delete agreement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const tableData = (agreements || []) as BasicAgreementRow[];
  
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFiltersState,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
    manualPagination: true,
    pageCount: Math.ceil((agreements?.length || 0) / pagination.pageSize),
  });

  const handleStatusFilterChange = (value: string) => {
    if (value !== statusFilter) {
      setStatusFilter(value);
      setSearchParams(prev => ({ ...prev, status: value === 'all' ? undefined : value }));
    }
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center w-full sm:w-auto space-x-2">
          <Select
            value={statusFilter}
            onValueChange={handleStatusFilterChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={AgreementStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={AgreementStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={AgreementStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={AgreementStatus.EXPIRED}>Expired</SelectItem>
              <SelectItem value={AgreementStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          {selectedCount > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedCount})
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : String(error)}</AlertDescription>
        </Alert>
      )}
      
      {(searchQuery || statusFilter !== 'all') && (
        <div className="flex items-center text-sm text-muted-foreground mb-1">
          <span>Filtering by:</span>
          {searchQuery && (
            <Badge variant="outline" className="ml-2 gap-1">
              Search: {searchQuery}
              <button onClick={() => setSearchParams(prev => ({ ...prev, query: undefined }))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="outline" className="ml-2 gap-1">
              Status: {statusFilter}
              <button onClick={() => handleStatusFilterChange('all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: columns.length }).map((_, j) => (
                    <TableCell key={`skeleton-cell-${i}-${j}`}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <p>
                      {searchParams.status && searchParams.status !== 'all' ? 
                        'No agreements found with the selected status.' : 
                        'Add your first agreement using the button above.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {agreements && agreements.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="default"
                className="gap-1 pl-2.5"
                onClick={() => table.previousPage()} 
                disabled={!table.getCanPreviousPage() || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
            </PaginationItem>
            
            {Array.from({ length: table.getPageCount() }).map((_, index) => (
              <PaginationItem key={index}>
                <Button
                  variant={table.getState().pagination.pageIndex === index ? "outline" : "ghost"}
                  size="icon"
                  onClick={() => table.setPageIndex(index)}
                  disabled={isLoading}
                >
                  {index + 1}
                </Button>
              </PaginationItem>
            )).slice(
              Math.max(0, table.getState().pagination.pageIndex - 1),
              Math.min(table.getPageCount(), table.getState().pagination.pageIndex + 3)
            )}
            
            <PaginationItem>
              <Button
                variant="outline"
                size="default"
                className="gap-1 pr-2.5"
                onClick={() => table.nextPage()} 
                disabled={!table.getCanNextPage() || isLoading}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Agreements</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected agreements? 
              This action cannot be undone and will permanently remove the selected agreements from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Agreements'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
