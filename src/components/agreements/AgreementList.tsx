
import { asTableId } from '@/utils/type-casting';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
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
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { generateAgreementReport } from '@/utils/agreement-report-utils';
import { jsPDF } from 'jspdf';
import {
  ColumnDef,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender
} from '@tanstack/react-table';

const fetchOverduePayments = async (agreementId: string) => {
  try {
    const { data, error } = await supabase
      .from('overdue_payments')
      .select('*')
      .eq('agreement_id', asTableId('overdue_payments', agreementId));
    
    if (error) {
      console.error("Error fetching overdue payments:", error);
    } else {
      console.log("Overdue payments fetched:", data);
    }
  } catch (err) {
    console.error("Error fetching overdue payments:", err);
  }
};

const fetchPayments = async (agreementId: string) => {
  try {
    const { data, error } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', asTableId('unified_payments', agreementId));
    
    if (error) {
      console.error("Error fetching payments:", error);
    } else {
      console.log("Payments fetched:", data);
    }
  } catch (err) {
    console.error("Error fetching payments:", err);
  }
};

const fetchImportReverts = async (importId: string) => {
  try {
    const { data, error } = await supabase
      .from('agreement_import_reverts')
      .select('*')
      .eq('import_id', asTableId('agreement_import_reverts', importId));
    
    if (error) {
      console.error("Error fetching import reverts:", error);
    } else {
      console.log("Import reverts fetched:", data);
    }
  } catch (err) {
    console.error("Error fetching import reverts:", err);
  }
};

const fetchTrafficFines = async (agreementId: string) => {
  try {
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('agreement_id', asTableId('traffic_fines', agreementId));
    
    if (error) {
      console.error("Error fetching traffic fines:", error);
    } else {
      console.log("Traffic fines fetched:", data);
    }
  } catch (err) {
    console.error("Error fetching traffic fines:", err);
  }
};

const fetchTrafficFinesByAgreementId = async (agreementId: string) => {
  try {
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('agreement_id', asTableId('traffic_fines', agreementId));
    
    if (error) {
      console.error("Error fetching traffic fines by agreement ID:", error);
    } else {
      console.log("Traffic fines by agreement ID fetched:", data);
    }
  } catch (err) {
    console.error("Error fetching traffic fines by agreement ID:", err);
  }
};

export const AgreementList = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
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
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    setRowSelection({});
    setPagination({
      pageIndex: 0,
      pageSize: 10,
    });
  }, [agreements, statusFilter]);

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
          .eq('agreement_id', asTableId('overdue_payments', id));
        
        if (overduePaymentsDeleteError) {
          console.error(`Failed to delete related overdue payments for ${id}:`, overduePaymentsDeleteError);
        } else {
          console.log(`Successfully deleted related overdue payments for ${id}`);
        }
        
        const { error: paymentDeleteError } = await supabase
          .from('unified_payments')
          .delete()
          .eq('lease_id', asTableId('unified_payments', id));
        
        if (paymentDeleteError) {
          console.error(`Failed to delete related payments for ${id}:`, paymentDeleteError);
        } else {
          console.log(`Successfully deleted related payments for ${id}`);
        }
        
        const { data: relatedReverts } = await supabase
          .from('agreement_import_reverts')
          .select('id')
          .eq('import_id', asTableId('agreement_import_reverts', id));
        
        if (relatedReverts && relatedReverts.length > 0) {
          const { error: revertDeleteError } = await supabase
            .from('agreement_import_reverts')
            .delete()
            .eq('import_id', asTableId('agreement_import_reverts', id));
          
          if (revertDeleteError) {
            console.error(`Failed to delete related revert records for ${id}:`, revertDeleteError);
          } else {
            console.log(`Successfully deleted related revert records for ${id}`);
          }
        }
        
        const { data: trafficFines, error: trafficFinesError } = await supabase
          .from('traffic_fines')
          .select('id')
          .eq('agreement_id', asTableId('traffic_fines', id));
        
        if (trafficFinesError) {
          console.error(`Error checking traffic fines for ${id}:`, trafficFinesError);
        } else if (trafficFines && trafficFines.length > 0) {
          const { error: finesDeleteError } = await supabase
            .from('traffic_fines')
            .delete()
            .eq('agreement_id', asTableId('traffic_fines', id));
          
          if (finesDeleteError) {
            console.error(`Failed to delete related traffic fines for ${id}:`, finesDeleteError);
          } else {
            console.log(`Successfully deleted related traffic fines for ${id}`);
          }
        }
        
        const { error } = await supabase
          .from('leases')
          .delete()
          .eq('id', asTableId('leases', id));
        
        if (error) {
          console.error(`Failed to delete agreement ${id}:`, error);
          toast.error(`Failed to delete agreement: ${error.message}`);
          errorCount++;
        } else {
          console.log(`Successfully deleted agreement ${id}`);
          successCount++;
        }
      } catch (err) {
        console.error('Error deleting:', err);
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

  const handleGenerateReport = async (agreement: any) => {
    try {
      toast.info(`Generating report for agreement ${agreement.agreement_number}`);
      setIsGeneratingReport(true);
      
      const agreementForReport: Agreement = {
        ...agreement,
        start_date: new Date(agreement.start_date),
        end_date: new Date(agreement.end_date),
        id: agreement.id,
        status: agreement.status as AgreementStatus,
        agreement_number: agreement.agreement_number || '',
        customer_id: agreement.customer_id || '',
        vehicle_id: agreement.vehicle_id || '',
        created_at: new Date(agreement.created_at),
        updated_at: new Date(agreement.updated_at)
      };
      
      const { data: payments } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', asTableId('unified_payments', agreementForReport.id as string));
      
      const doc = generateAgreementReport(
        agreementForReport, 
        agreement.rent_amount || 0, 
        agreement.total_amount || 0,
        payments || []
      );
      
      doc.save(`agreement-report-${agreement.agreement_number}.pdf`);
      
      toast.success(`Report generated for agreement ${agreement.agreement_number}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate agreement report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleBulkGenerateReports = async () => {
    if (!agreements) return;
    
    const selectedIds = Object.keys(rowSelection).map(
      index => agreements[parseInt(index)].id as string
    );
    
    if (selectedIds.length === 0) {
      toast.error('Please select at least one agreement');
      return;
    }
    
    setIsGeneratingReport(true);
    toast.info(`Generating reports for ${selectedIds.length} agreements...`);
    
    try {
      const mergedPdf = new jsPDF();
      let currentPage = 1;
      
      mergedPdf.setFontSize(22);
      mergedPdf.setFont('helvetica', 'bold');
      mergedPdf.setTextColor(0, 0, 0);
      mergedPdf.text('AGREEMENTS SUMMARY REPORT', mergedPdf.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      
      mergedPdf.setFontSize(12);
      mergedPdf.setFont('helvetica', 'normal');
      mergedPdf.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, mergedPdf.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
      mergedPdf.text(`Total Agreements: ${selectedIds.length}`, mergedPdf.internal.pageSize.getWidth() / 2, 55, { align: 'center' });
      
      mergedPdf.setFont('helvetica', 'bold');
      mergedPdf.text('Agreements Included:', 20, 75);
      
      mergedPdf.setFont('helvetica', 'normal');
      mergedPdf.setFontSize(10);
      
      let yPosition = 85;
      const selectedAgreements = agreements.filter((_, index) => rowSelection[index]);
      
      for (let i = 0; i < selectedAgreements.length; i++) {
        const agreement = selectedAgreements[i];
        if (yPosition > mergedPdf.internal.pageSize.getHeight() - 20) {
          mergedPdf.addPage();
          yPosition = 20;
        }
        
        mergedPdf.text(`${i + 1}. Agreement ${agreement.agreement_number} - ${agreement.customers?.full_name || 'N/A'}`, 25, yPosition);
        yPosition += 8;
      }
      
      for (const agreementId of selectedIds) {
        const agreement = agreements.find(a => a.id === agreementId);
        if (!agreement) continue;
        
        const { data: payments } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', asTableId('unified_payments', agreementId));
        
        const agreementForReport: Agreement = {
          ...agreement,
          start_date: new Date(agreement.start_date),
          end_date: new Date(agreement.end_date),
          id: agreement.id,
          status: agreement.status as AgreementStatus,
          agreement_number: agreement.agreement_number || '',
          customer_id: agreement.customer_id || '',
          vehicle_id: agreement.vehicle_id || '',
          created_at: new Date(agreement.created_at),
          updated_at: new Date(agreement.updated_at)
        };
        
        const doc = generateAgreementReport(
          agreementForReport, 
          agreement.rent_amount || 0, 
          agreement.total_amount || 0,
          payments || []
        );
        
        const pdfBytes = doc.output('arraybuffer');
        const pdfUint8Array = new Uint8Array(pdfBytes);
        
        mergedPdf.addPage();
        mergedPdf.addImage(pdfUint8Array, 'PDF', 0, 0, mergedPdf.internal.pageSize.getWidth(), mergedPdf.internal.pageSize.getHeight());
        
        currentPage++;
      }
      
      mergedPdf.save(`agreements-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast.success(`Reports generated for ${selectedIds.length} agreements`);
    } catch (error) {
      console.error('Error generating bulk reports:', error);
      toast.error('Failed to generate agreement reports');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const columns: ColumnDef<any>[] = [
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
      accessorKey: "rent_amount",
      header: "Monthly Rent",
      cell: ({ row }) => {
        return (
          <div className="font-medium">
            {formatCurrency(row.original.rent_amount || 0)}
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
              <DropdownMenuItem
                onClick={() => handleGenerateReport(agreement)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate Report
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

  const table = useReactTable({
    data: agreements || [],
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
    pageCount: Math.ceil((agreements?.length || 0) / 10),
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
        
        <div className="flex gap-2">
          {selectedCount > 0 && (
            <>
              <Button 
                variant="outline"
                onClick={handleBulkGenerateReports}
                className="flex items-center gap-1"
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <FileText className="h-4 w-4 mr-1" />
                )}
                {isGeneratingReport ? "Generating..." : `Report (${selectedCount})`}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete ({selectedCount})
              </Button>
            </>
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
                      {statusFilter !== 'all' ? 
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
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
            </PaginationItem>
            
            {Array.from({ length: table.getPageCount() }).map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={table.getState().pagination.pageIndex === index}
                  onClick={() => table.setPageIndex(index)}
                >
                  {index + 1}
                </PaginationLink>
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
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
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
