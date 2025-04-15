import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
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
  FilePlus,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
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
import { useVehicles } from '@/hooks/use-vehicles';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink
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

interface AgreementListProps {
  customerNameSearch?: string;
}

export const AgreementList = ({ customerNameSearch = '' }: AgreementListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { 
    agreements, 
    isLoading, 
    error,
    searchParams, 
    setSearchParams,
    deleteAgreement 
  } = useAgreements({ status: statusFilter });
  
  const { useRealtimeUpdates: useVehicleRealtimeUpdates } = useVehicles();
  useVehicleRealtimeUpdates();
  
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);
  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    setRowSelection({});
    setPagination({
      pageIndex: 0,
      pageSize: 10,
    });
  }, [agreements, statusFilter]);

  const filteredAgreements = React.useMemo(() => {
    if (!agreements) return [];
    
    if (!customerNameSearch || customerNameSearch.trim() === '') {
      return agreements;
    }
    
    const searchLower = customerNameSearch.toLowerCase().trim();
    return agreements.filter(agreement => {
      const customerName = agreement.customers?.full_name || '';
      return customerName.toLowerCase().includes(searchLower);
    });
  }, [agreements, customerNameSearch]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'agreement_number',
      header: 'Agreement #',
      cell: ({ row }) => (
        <Link 
          to={`/agreements/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.agreement_number}
        </Link>
      )
    },
    {
      accessorKey: 'customers',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original.customers;
        return (
          <Link 
            to={`/customers/${customer.id}`}
            className="hover:underline"
          >
            {customer.full_name || 'N/A'}
          </Link>
        );
      }
    },
    {
      accessorKey: 'vehicles',
      header: 'Vehicle',
      cell: ({ row }) => {
        const vehicle = row.original.vehicles;
        return (
          <Link 
            to={`/vehicles/${vehicle.id}`}
            className="hover:underline"
          >
            {vehicle.make && vehicle.model ? (
              <span>
                {vehicle.make} {vehicle.model} 
                <span className="font-semibold text-primary ml-1">({vehicle.license_plate})</span>
              </span>
            ) : vehicle.license_plate ? (
              <span>Vehicle: <span className="font-semibold text-primary">{vehicle.license_plate}</span></span>
            ) : 'N/A'}
          </Link>
        );
      }
    },
    {
      accessorKey: 'start_date',
      header: 'Rental Period',
      cell: ({ row }) => {
        const startDate = row.original.start_date;
        const endDate = row.original.end_date;
        return (
          <span>
            {startDate && endDate && (
              <span>
                {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
              </span>
            )}
          </span>
        );
      }
    },
    {
      accessorKey: 'rent_amount',
      header: 'Monthly Rent',
      cell: ({ row }) => formatCurrency(row.original.rent_amount || 0)
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge 
          variant={
            row.original.status === AgreementStatus.ACTIVE ? "success" : 
            row.original.status === AgreementStatus.DRAFT ? "secondary" : 
            row.original.status === AgreementStatus.PENDING ? "warning" :
            row.original.status === AgreementStatus.EXPIRED ? "outline" :
            "destructive"
          }
          className="capitalize"
        >
          {row.original.status === AgreementStatus.ACTIVE ? (
            <FileCheck className="h-3 w-3 mr-1" />
          ) : row.original.status === AgreementStatus.DRAFT ? (
            <FileEdit className="h-3 w-3 mr-1" />
          ) : row.original.status === AgreementStatus.PENDING ? (
            <FileClock className="h-3 w-3 mr-1" />
          ) : row.original.status === AgreementStatus.EXPIRED ? (
            <FileText className="h-3 w-3 mr-1" />
          ) : (
            <FileX className="h-3 w-3 mr-1" />
          )}
          {row.original.status}
        </Badge>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
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
              <Link to={`/agreements/${row.original.id}`}>
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/agreements/edit/${row.original.id}`}>
                Edit agreement
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete agreement ${row.original.agreement_number}?`)) {
                  deleteAgreement.mutate(row.original.id);
                }
              }}
            >
              Delete agreement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const table = useReactTable({
    data: filteredAgreements || [],
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
    manualPagination: false,
    pageCount: Math.ceil((filteredAgreements?.length || 0) / 10),
  });

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setSearchParams(prev => ({ ...prev, status: value }));
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center w-full sm:w-auto space-x-2">
          <Select
            value={statusFilter}
            onValueChange={handleStatusFilterChange}
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
        
        {customerNameSearch && (
          <div className="text-sm text-muted-foreground">
            Found {filteredAgreements.length} {filteredAgreements.length === 1 ? 'result' : 'results'} for "{customerNameSearch}"
          </div>
        )}
        
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
          <Button asChild>
            <Link to="/agreements/add">
              <FilePlus className="h-4 w-4 mr-2" />
              New Agreement
            </Link>
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : String(error)}</AlertDescription>
        </Alert>
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
                      {customerNameSearch ? 
                        'No agreements found matching your search.' : 
                        statusFilter !== 'all' ? 
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
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              onClick={() => setPagination(prev => ({ ...prev, pageIndex: 0 }))} 
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() => setPagination(prev => ({ ...prev, pageIndex: pagination.pageIndex - 1 }))} 
              disabled={pagination.pageIndex === 0}
            >
              <ArrowUpDown className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() => setPagination(prev => ({ ...prev, pageIndex: pagination.pageIndex + 1 }))} 
              disabled={pagination.pageIndex === pagination.pageCount - 1}
            >
              <ArrowUpDown className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() => setPagination(prev => ({ ...prev, pageIndex: pagination.pageCount - 1 }))} 
              disabled={pagination.pageIndex === pagination.pageCount - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} agreement(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedCount} agreement(s)?`)) {
                  deleteAgreement.mutate(Object.keys(rowSelection).map(Number));
                  setBulkDeleteDialogOpen(false);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
