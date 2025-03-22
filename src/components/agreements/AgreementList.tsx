import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  SortingState,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnFiltersState,
  getFilteredRowModel
} from "@tanstack/react-table";
import { 
  MoreHorizontal, 
  FileText, 
  Search, 
  FileCheck, 
  FileX, 
  FileClock, 
  FileEdit,
  FilePlus,
  AlertTriangle 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAgreements } from '@/hooks/use-agreements';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AgreementList() {
  const { 
    agreements, 
    isLoading, 
    error,
    searchParams, 
    setSearchParams, 
    deleteAgreement 
  } = useAgreements();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.query || '');
  
  const handleSearch = () => {
    setSearchParams({...searchParams, query: searchTerm});
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleStatusChange = (value: string) => {
    setSearchParams({...searchParams, status: value});
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSearchParams({
      query: '',
      status: 'all'
    });
  };
  
  const columns: ColumnDef<Agreement>[] = [
    {
      accessorKey: "agreement_number",
      header: "Agreement #",
      cell: ({ row }) => (
        <div className="font-medium">
          <Link 
            to={`/agreements/${row.original.id}`}
            className="font-medium text-primary hover:underline"
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
                {vehicle.make && vehicle.model ? 
                  `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : 'N/A'}
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

  const table = useReactTable({
    data: agreements || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center w-full sm:w-auto space-x-2">
          <div className="relative w-full sm:w-[250px] md:w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
            <Input
              placeholder="Search agreements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 pl-9 w-full"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSearch}
          >
            Search
          </Button>
          <Select
            value={searchParams.status || 'all'}
            onValueChange={handleStatusChange}
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
          {(searchTerm || searchParams.status !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </div>
        <Button asChild>
          <Link to="/agreements/add">
            <FilePlus className="h-4 w-4 mr-2" />
            New Agreement
          </Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading && (
        <div className="py-2 text-center text-muted-foreground">
          Loading agreements...
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
            {table.getRowModel().rows?.length ? (
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
                  {isLoading ? (
                    "Loading..."
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p>No agreements found.</p>
                      <p className="text-sm text-muted-foreground">
                        {!error && "Try creating a new agreement or adjusting your filters."}
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2">
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
}
