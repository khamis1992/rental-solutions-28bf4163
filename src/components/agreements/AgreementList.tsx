
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { useAgreements } from '@/hooks/use-agreements';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Download,
  FileText,
  MoreHorizontal,
  PlusCircle,
  Upload,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AgreementList = () => {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [search, setSearch] = React.useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    agreements,
    isLoading: isLoadingAgreements,
    error: agreementsError,
    deleteAgreement
  } = useAgreements();

  const columns: ColumnDef<SimpleAgreement>[] = React.useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
      },
      {
        accessorKey: 'customer_id',
        header: 'Customer ID',
      },
      {
        accessorKey: 'vehicle_id',
        header: 'Vehicle ID',
      },
      {
        accessorKey: 'start_date',
        header: 'Start Date',
        cell: ({ row }) => {
          const date = row.getValue('start_date');
          return date ? format(new Date(date as string), 'PPP') : 'N/A';
        },
      },
      {
        accessorKey: 'end_date',
        header: 'End Date',
        cell: ({ row }) => {
          const date = row.getValue('end_date');
          return date ? format(new Date(date as string), 'PPP') : 'N/A';
        },
      },
      {
        accessorKey: 'rent_amount',
        header: 'Rental Rate',
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        id: 'actions',
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
                <DropdownMenuItem
                  onClick={() => navigate(`/agreements/${agreement.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`/agreements/edit/${agreement.id}`)}
                >
                  Edit Agreement
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (agreement.id) {
                      deleteAgreement.mutate(agreement.id);
                    }
                  }}
                >
                  Delete Agreement
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [navigate, deleteAgreement]
  );

  const table = useReactTable({
    data: agreements || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Agreements</h2>
        <div>
          <Input
            placeholder="Search agreements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md mr-4"
          />
          <Button onClick={() => navigate('/agreements/add')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Agreement
          </Button>
        </div>
      </div>

      {/* Custom Data Table */}
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
            {isLoadingAgreements ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  No agreements found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
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
  );
};

export default AgreementList;
