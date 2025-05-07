
import React from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { DataTable } from '@/components/ui/data-table';
import { 
  ColumnDef, 
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { Agreement } from '@/types/agreement';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileCheck, FileClock, FileX } from 'lucide-react';
import { SimpleAgreement } from '@/hooks/use-agreements';

interface AgreementTableProps {
  compact?: boolean;
}

export default function AgreementTable({ compact = false }: AgreementTableProps) {
  const {
    agreements,
    isLoading,
    error,
  } = useAgreementTable();
  
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Convert string dates to Date objects
  const typedAgreements = agreements?.map((agreement: SimpleAgreement) => ({
    ...agreement,
    payment_frequency: 'monthly', // Default value for type compatibility
    payment_day: 1, // Default value for type compatibility
    customers: {
      full_name: agreement.customers?.full_name || agreement.customer_name || 'N/A',
      id: agreement.customers?.id || agreement.customer_id
    },
    start_date: agreement.start_date ? new Date(agreement.start_date) : new Date(),
    end_date: agreement.end_date ? new Date(agreement.end_date) : new Date(),
    created_at: agreement.created_at ? new Date(agreement.created_at) : undefined,
    updated_at: agreement.updated_at ? new Date(agreement.updated_at) : undefined
  })) as Agreement[];

  const columns: ColumnDef<Agreement>[] = React.useMemo(() => [
    {
      id: 'agreement_number',
      header: 'Agreement',
      cell: ({ row }) => (
        <Link 
          to={`/agreements/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.agreement_number || `AG-${row.original.id?.substring(0, 8)}`}
        </Link>
      ),
    },
    {
      id: 'customers.full_name',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex items-center max-w-[180px]">
          {row.original.customers?.id ? (
            <Link
              to={`/customers/${row.original.customers.id}`}
              className="hover:underline truncate"
            >
              {row.original.customers.full_name || 'N/A'}
            </Link>
          ) : (
            <span className="truncate">{row.original.customer_name || 'N/A'}</span>
          )}
        </div>
      ),
    },
    {
      id: 'vehicles',
      header: 'Vehicle',
      cell: ({ row }) => {
        const vehicle = row.original.vehicles;
        return (
          <div className="flex items-center max-w-[180px]">
            {vehicle?.id ? (
              <Link
                to={`/vehicles/${vehicle.id}`}
                className="hover:underline truncate"
              >
                {vehicle.make && vehicle.model ? (
                  <span className="truncate">{vehicle.make} {vehicle.model} ({vehicle.license_plate})</span>
                ) : (
                  <span className="truncate">{vehicle.license_plate || 'N/A'}</span>
                )}
              </Link>
            ) : (
              <span className="text-muted-foreground">No vehicle</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'start_date',
      header: 'Start Date',
      cell: ({ row }) => (
        <span>{row.original.start_date ? format(row.original.start_date, 'MMM d, yyyy') : 'N/A'}</span>
      ),
    },
    {
      id: 'end_date',
      header: 'End Date',
      cell: ({ row }) => (
        <span>{row.original.end_date ? format(row.original.end_date, 'MMM d, yyyy') : 'N/A'}</span>
      ),
    },
    {
      id: 'rent_amount',
      header: 'Rent Amount',
      cell: ({ row }) => formatCurrency(row.original.rent_amount || 0),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeVariant:
          | 'default'
          | 'secondary'
          | 'destructive'
          | 'outline'
          | null
          | undefined;
        let icon = null;

        switch (status) {
          case 'active':
            badgeVariant = 'default';
            icon = <FileCheck className="h-3 w-3 mr-1" />;
            break;
          case 'pending':
          case 'pending_payment':
          case 'pending_deposit':
            badgeVariant = 'secondary';
            icon = <FileClock className="h-3 w-3 mr-1" />;
            break;
          case 'cancelled':
          case 'terminated':
            badgeVariant = 'destructive';
            icon = <FileX className="h-3 w-3 mr-1" />;
            break;
          default:
            badgeVariant = 'outline';
        }

        return (
          <Badge variant={badgeVariant} className="capitalize flex items-center w-fit">
            {icon}
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end space-x-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 px-2 text-xs"
            asChild
          >
            <Link to={`/agreements/${row.original.id}`}>View</Link>
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 px-2 text-xs"
            asChild
          >
            <Link to={`/agreements/edit/${row.original.id}`}>Edit</Link>
          </Button>
        </div>
      ),
    },
  ], []);

  // Use a subset of columns for compact view
  const compactColumns = compact ? columns.filter(col => 
    ['agreement_number', 'customers.full_name', 'rent_amount', 'status', 'actions'].includes(col.id as string)
  ) : columns;

  const table = useReactTable({
    data: typedAgreements || [],
    columns: compactColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading agreements...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={compactColumns.length} className="h-24 text-center">
                No agreements found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} agreements
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 px-4"
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 px-4"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
