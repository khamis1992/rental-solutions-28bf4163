
import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrafficFine, TrafficFineStatusType } from '@/hooks/use-traffic-fines';
import { Check, Clock, X, AlertCircle, RefreshCcw, FileCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTrafficFinesValidation } from '@/hooks/use-traffic-fines-validation';

interface TrafficFineTableProps {
  fines: TrafficFine[];
  onPayFine: (id: string) => void;
  onDisputeFine: (id: string) => void;
  onAssignToCustomer: (id: string) => void;
  isLoading: boolean;
}

export function TrafficFinesTable({
  fines,
  onPayFine,
  onDisputeFine,
  onAssignToCustomer,
  isLoading,
}: TrafficFineTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedFine, setSelectedFine] = useState<TrafficFine | null>(null);
  const [openDialog, setOpenDialog] = useState<'pay' | 'dispute' | 'validate' | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { validateTrafficFine, updateFineValidationStatus, isValidating } = useTrafficFinesValidation();

  const handleValidateFine = async () => {
    if (!selectedFine) return;

    try {
      const result = await validateTrafficFine.mutateAsync(selectedFine.licensePlate || '');
      
      setValidationResult(result);
      
      if (result) {
        await updateFineValidationStatus.mutateAsync({
          fineId: selectedFine.id,
          validationResult: result,
          newStatus: result.hasFine ? 'validated' : 'invalid'
        });
      }
    } catch (error) {
      console.error('Error validating fine:', error);
    }
  };

  const columns: ColumnDef<TrafficFine>[] = [
    {
      accessorKey: 'violationNumber',
      header: 'Violation #',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('violationNumber')}</div>
      ),
    },
    {
      accessorKey: 'licensePlate',
      header: 'License Plate',
      cell: ({ row }) => <div>{row.getValue('licensePlate')}</div>,
    },
    {
      accessorKey: 'violationDate',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.getValue<Date>('violationDate');
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      accessorKey: 'fineAmount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('fineAmount'));
        return <div className="font-medium">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: 'violationCharge',
      header: 'Violation',
      cell: ({ row }) => <div>{row.getValue('violationCharge')}</div>,
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue<TrafficFineStatusType>('paymentStatus');
        return (
          <div>
            {status === 'paid' && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <Check className="mr-1 h-3 w-3" /> Paid
              </Badge>
            )}
            {status === 'disputed' && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                <AlertCircle className="mr-1 h-3 w-3" /> Disputed
              </Badge>
            )}
            {status === 'pending' && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                <Clock className="mr-1 h-3 w-3" /> Pending
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const fine = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedFine(fine);
                    setOpenDialog('pay');
                  }}
                  disabled={fine.paymentStatus === 'paid'}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Paid
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedFine(fine);
                    setOpenDialog('dispute');
                  }}
                  disabled={fine.paymentStatus === 'disputed'}
                >
                  <X className="mr-2 h-4 w-4" />
                  Mark as Disputed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onAssignToCustomer(fine.id);
                  }}
                  disabled={!!fine.customerId}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Assign to Customer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedFine(fine);
                    setOpenDialog('validate');
                  }}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Validate with MOI
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: fines,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const handleConfirmAction = () => {
    if (!selectedFine) return;

    if (openDialog === 'pay') {
      onPayFine(selectedFine.id);
    } else if (openDialog === 'dispute') {
      onDisputeFine(selectedFine.id);
    } else if (openDialog === 'validate') {
      handleValidateFine();
      return; // Don't close dialog yet
    }

    setOpenDialog(null);
    setSelectedFine(null);
    setValidationResult(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter by license plate..."
          value={(table.getColumn('licensePlate')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('licensePlate')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
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
                  No traffic fines found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} traffic fine(s)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Pay Fine Dialog */}
      <Dialog open={openDialog === 'pay'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Fine as Paid</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this fine as paid? This will update the record and can impact financial reports.
            </DialogDescription>
          </DialogHeader>
          <div>
            {selectedFine && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium">Violation #:</span>
                    <p>{selectedFine.violationNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">License Plate:</span>
                    <p>{selectedFine.licensePlate}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Date:</span>
                    <p>{formatDate(selectedFine.violationDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Amount:</span>
                    <p>{formatCurrency(selectedFine.fineAmount)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Fine Dialog */}
      <Dialog open={openDialog === 'dispute'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Fine as Disputed</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this fine as disputed? This indicates that the fine is under review.
            </DialogDescription>
          </DialogHeader>
          <div>
            {selectedFine && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium">Violation #:</span>
                    <p>{selectedFine.violationNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">License Plate:</span>
                    <p>{selectedFine.licensePlate}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Date:</span>
                    <p>{formatDate(selectedFine.violationDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Amount:</span>
                    <p>{formatCurrency(selectedFine.fineAmount)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validate Fine Dialog */}
      <Dialog open={openDialog === 'validate'} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate Fine with MOI</DialogTitle>
            <DialogDescription>
              This will check the Ministry of Interior system to validate if this fine exists.
            </DialogDescription>
          </DialogHeader>
          <div>
            {selectedFine && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium">License Plate:</span>
                    <p>{selectedFine.licensePlate}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Violation #:</span>
                    <p>{selectedFine.violationNumber}</p>
                  </div>
                </div>

                {validationResult && (
                  <Alert
                    variant={validationResult.success ? (validationResult.hasFine ? 'default' : 'destructive') : 'destructive'}
                    className={
                      validationResult.success
                        ? validationResult.hasFine
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-green-50 border-green-200 text-green-800'
                        : ''
                    }
                  >
                    <AlertTitle>
                      {validationResult.success
                        ? validationResult.hasFine
                          ? 'Fine Validated'
                          : 'No Fine Found'
                        : 'Validation Error'}
                    </AlertTitle>
                    <AlertDescription>
                      {validationResult.success
                        ? validationResult.hasFine
                          ? `A fine was found in the MOI system for license plate ${validationResult.licensePlate}.`
                          : `No fine was found in the MOI system for license plate ${validationResult.licensePlate}.`
                        : validationResult.error || 'An error occurred during validation.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              Close
            </Button>
            {!validationResult && (
              <Button onClick={handleConfirmAction} disabled={isValidating}>
                {isValidating ? 'Validating...' : 'Validate Fine'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
