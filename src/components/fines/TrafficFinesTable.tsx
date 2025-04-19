
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Eye, Filter, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
} from '@tanstack/react-table';

export type TrafficFineStatusType = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'cancelled';

export interface TrafficFine {
  id: string;
  violationNumber: string;
  licensePlate: string;
  violationDate: Date;
  fineAmount: number;
  violationCharge: string;
  paymentStatus: TrafficFineStatusType;
  location: string;
  leaseId?: string;
  validationStatus?: string;
  serialNumber?: string;
  customerName: string;
}

export function TrafficFinesTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState({
    status: '',
    searchTerm: '',
  });

  // Fetch traffic fines data
  const { data: fines, isLoading, error } = useQuery({
    queryKey: ['trafficFines', filters],
    queryFn: async () => {
      // This is a mock implementation
      // In a real app, you would fetch data from a backend API or database
      
      // Sample data generation (for demo purposes only)
      const demoFines: TrafficFine[] = [
        {
          id: '1',
          violationNumber: 'TF-2025-00123',
          licensePlate: 'ABC123',
          violationDate: new Date('2025-03-15'),
          fineAmount: 500,
          violationCharge: 'Speeding',
          paymentStatus: 'pending',
          location: 'Corniche Road',
          leaseId: 'lease-001',
          validationStatus: 'verified',
          serialNumber: '123456',
          customerName: 'Ahmed Mohammed'
        },
        {
          id: '2',
          violationNumber: 'TF-2025-00124',
          licensePlate: 'XYZ789',
          violationDate: new Date('2025-03-16'),
          fineAmount: 300,
          violationCharge: 'Red light violation',
          paymentStatus: 'completed',
          location: 'Al Waab Street',
          leaseId: 'lease-002',
          validationStatus: 'verified',
          serialNumber: '234567',
          customerName: 'Sarah Al Ali'
        },
        {
          id: '3',
          violationNumber: 'TF-2025-00125',
          licensePlate: 'QTR555',
          violationDate: new Date('2025-03-20'),
          fineAmount: 200,
          violationCharge: 'Illegal parking',
          paymentStatus: 'pending',
          location: 'West Bay',
          leaseId: 'lease-003',
          validationStatus: 'verified',
          serialNumber: '345678',
          customerName: 'Mohammed Al Thani'
        }
      ];
      
      return demoFines;
    },
  });

  const columns: ColumnDef<TrafficFine>[] = [
    {
      accessorKey: 'violationNumber',
      header: 'Violation #',
    },
    {
      accessorKey: 'licensePlate',
      header: 'License Plate',
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
    },
    {
      accessorKey: 'violationDate',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.original.violationDate;
        return date ? date.toLocaleDateString() : 'N/A';
      },
    },
    {
      accessorKey: 'violationCharge',
      header: 'Violation',
    },
    {
      accessorKey: 'fineAmount',
      header: 'Amount',
      cell: ({ row }) => {
        return formatCurrency(row.original.fineAmount);
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.paymentStatus;
        return (
          <Badge
            variant={
              status === 'completed'
                ? 'success'
                : status === 'processing'
                ? 'default'
                : status === 'cancelled'
                ? 'destructive'
                : 'outline'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const fine = row.original;
        
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
                {fine.paymentStatus === 'pending' && (
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" /> Process Payment
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: fines || [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load traffic fines data.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fines</CardTitle>
        <CardDescription>
          View and manage traffic fines recorded in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search fines..."
              className="max-w-sm"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <Button variant="outline">Export</Button>
          </div>
        </div>
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No traffic fines found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {fines?.length || 0} fines
        </div>
        <div className="flex items-center space-x-2">
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
      </CardFooter>
    </Card>
  );
}
