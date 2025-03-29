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
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
  X,
  Car,
  Filter
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SearchParams {
  query?: string;
  status?: string;
}

export function AgreementList() {
  const { 
    agreements, 
    isLoading, 
    error,
    searchParams, 
    setSearchParams,
    deleteAgreement 
  } = useAgreements();
  
  const { useRealtimeUpdates: useVehicleRealtimeUpdates } = useVehicles();
  useVehicleRealtimeUpdates();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>([]);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.query || '');
  const [searchTip, setSearchTip] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== searchParams.query) {
        setIsSearching(true);
        setSearchParams({...searchParams, query: searchQuery});
      }
    }, 300);
    
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  useEffect(() => {
    if (isSearching && !isLoading) {
      setIsSearching(false);
    }
  }, [isLoading, agreements]);
  
  useEffect(() => {
    const isNumericSearch = /^\d{2,}$/.test(searchQuery);
    const shouldShowTip = isNumericSearch && (!agreements || agreements.length === 0) && !isLoading;
    setSearchTip(shouldShowTip);
    
    if (shouldShowTip) {
      console.log(`Showing search tip for numeric search: ${searchQuery}`);
    }
  }, [searchQuery, agreements, isLoading]);
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({...searchParams, query: ''});
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
    onColumnFiltersChange: setColumnFiltersState,
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    manualPagination: false,
    pageCount: Math.ceil((agreements?.length || 0) / 10),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center w-full sm:w-auto space-x-2">
          <div className="relative w-full sm:w-[250px] md:w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Input
                      placeholder="Search by agreement #, customer, or vehicle..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      className="h-9 pl-9 pr-8 w-full"
                    />
                    {searchQuery && (
                      <button 
                        onClick={handleClearSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                      </button>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs p-4">
                  <p className="font-semibold">Search Examples:</p>
                  <ul className="list-disc pl-4 mt-2 space-y-1.5">
                    <li><strong>Agreement numbers:</strong> "MR202462", "AGR-202502"</li>
                    <li><strong>Vehicle numbers:</strong> Just type the numeric part (e.g., "7042", "704")</li>
                    <li><strong>License plates:</strong> Full plate with or without formatting</li>
                    <li><strong>Customer names, vehicle make/model</strong></li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">Tip: For partial vehicle numbers, try entering just 2-4 digits (e.g., "70" instead of full "7042")</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={searchParams.status || 'all'}
            onValueChange={(value) => setSearchParams({...searchParams, status: value})}
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
          <AlertDescription>{error instanceof Error ? error.message : String(error)}</AlertDescription>
        </Alert>
      )}
      
      {searchTip && (
        <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800">Search Tip</AlertTitle>
          <AlertDescription className="text-amber-700">
            When searching for vehicle number "{searchQuery}", try these formats:
            <ul className="list-disc pl-5 mt-2">
              <li>Fewer digits (e.g., use "70" instead of "7042")</li>
              <li>Just the ending digits (e.g., "42" to match plates ending with those digits)</li>
              <li>Complete license plate if you know it</li>
            </ul>
            <div className="mt-2 text-sm flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearSearch}
                className="bg-white hover:bg-white/90"
              >
                <X className="h-3.5 w-3.5 mr-1.5" /> Clear Search
              </Button>
              
              {searchQuery.length > 2 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Try with fewer digits
                    const shorterQuery = searchQuery.substring(0, Math.ceil(searchQuery.length/2));
                    setSearchQuery(shorterQuery);
                  }}
                  className="bg-white hover:bg-white/90"
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" /> Try with "{searchQuery.substring(0, Math.ceil(searchQuery.length/2))}"
                </Button>
              )}
            </div>
          </AlertDescription>
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
            {isLoading || isSearching ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={`skeleton-cell-${i}-${j}`}>
                      <div className="h-8 w-full animate-pulse rounded bg-muted"></div>
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
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <p>No agreements found. {searchQuery || (searchParams.status && searchParams.status !== 'all') ? 
                      'Try adjusting your filters or search terms.' : 
                      'Add your first agreement using the button above.'}</p>
                    {searchQuery && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleClearSearch}
                        >
                          <X className="h-3.5 w-3.5 mr-1.5" /> Clear Search
                        </Button>
                        
                        {searchQuery.length > 2 && /^\d+$/.test(searchQuery) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Try with fewer digits
                              const shorterQuery = searchQuery.substring(0, Math.ceil(searchQuery.length/2));
                              setSearchQuery(shorterQuery);
                            }}
                          >
                            <Filter className="h-3.5 w-3.5 mr-1.5" /> Try fewer digits
                          </Button>
                        )}
                      </div>
                    )}
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
    </div>
  );
}
