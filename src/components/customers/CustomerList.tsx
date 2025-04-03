import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, SortingState, getSortedRowModel, getPaginationRowModel, ColumnFiltersState, getFilteredRowModel } from "@tanstack/react-table";
import { MoreHorizontal, Search, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function CustomerList() {
  const {
    customers,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    deleteCustomer,
    refreshCustomers
  } = useCustomers();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isUpdatingStatuses, setIsUpdatingStatuses] = useState(false);
  
  console.log("CustomerList received customers:", customers);
  
  // Function to trigger customer status updates
  const handleUpdateCustomerStatuses = async () => {
    setIsUpdatingStatuses(true);
    try {
      const { error } = await supabase.rpc('update_customer_statuses');
      
      if (error) {
        console.error("Error updating customer statuses:", error);
        toast.error("Failed to update customer statuses", {
          description: error.message
        });
      } else {
        toast.success("Customer statuses updated successfully");
        // Refresh customer list to show updated statuses
        refreshCustomers();
      }
    } catch (err) {
      console.error("Unexpected error updating customer statuses:", err);
      toast.error("An unexpected error occurred while updating customer statuses");
    } finally {
      setIsUpdatingStatuses(false);
    }
  };
  
  const columns: ColumnDef<Customer>[] = [{
    accessorKey: "full_name",
    header: "Customer Name",
    cell: ({
      row
    }) => {
      const fullName = row.getValue("full_name") as string;
      return <div>
            <Link to={`/customers/${row.original.id}`} className="font-medium text-primary hover:underline">
              {fullName || 'Unnamed Customer'}
            </Link>
          </div>;
    }
  }, {
    accessorKey: "email",
    header: "Email"
  }, {
    accessorKey: "phone",
    header: "Phone"
  }, {
    accessorKey: "driver_license",
    header: "License",
    cell: ({
      row
    }) => {
      const license = row.getValue("driver_license") as string;
      return license ? <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {license}
          </code> : <span className="text-muted-foreground text-sm">Not provided</span>;
    }
  }, {
    accessorKey: "status",
    header: "Status",
    cell: ({
      row
    }) => {
      const status = row.getValue("status") as string || 'active';

      // Define badge styles based on status
      let badgeClass = "";
      let Icon = CheckCircle;
      switch (status) {
        case "active":
          badgeClass = "bg-green-500 text-white border-green-600";
          Icon = CheckCircle;
          break;
        case "inactive":
          badgeClass = "bg-gray-400 text-white border-gray-500";
          Icon = XCircle;
          break;
        case "blacklisted":
          badgeClass = "bg-red-500 text-white border-red-600";
          Icon = XCircle;
          break;
        case "pending_review":
          badgeClass = "bg-amber-500 text-white border-amber-600";
          Icon = AlertTriangle;
          break;
        case "pending_payment":
          badgeClass = "bg-blue-500 text-white border-blue-600";
          Icon = AlertTriangle;
          break;
        default:
          badgeClass = "bg-green-500 text-white border-green-600";
          Icon = CheckCircle;
      }
      return <Badge className={`capitalize ${badgeClass}`}>
            <Icon className="h-3 w-3 mr-1" />
            {status.replace('_', ' ')}
          </Badge>;
    }
  }, {
    id: "actions",
    cell: ({
      row
    }) => {
      const customer = row.original;
      return <DropdownMenu>
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
                <Link to={`/customers/${customer.id}`}>
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/customers/edit/${customer.id}`}>
                  Edit customer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
            if (window.confirm(`Are you sure you want to delete ${customer.full_name}?`)) {
              deleteCustomer.mutate(customer.id as string);
            }
          }}>
                Delete customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>;
    }
  }];
  const table = useReactTable({
    data: customers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters
    }
  });

  // Display an error message if there was an error fetching customers
  if (error) {
    return <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <h3 className="font-semibold mb-2">Error loading customers</h3>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
      </div>;
  }
  return <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center w-full sm:w-auto space-x-2">
          <div className="relative w-full sm:w-[250px] md:w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
            <Input placeholder="Search customers..." value={searchParams.query || ''} onChange={e => setSearchParams({
            ...searchParams,
            query: e.target.value
          })} className="h-9 pl-9 w-full" />
          </div>
          <Select value={searchParams.status} onValueChange={value => setSearchParams({
          ...searchParams,
          status: value
        })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="blacklisted">Blacklisted</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleUpdateCustomerStatuses}
            disabled={isUpdatingStatuses}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdatingStatuses ? 'animate-spin' : ''}`} />
            Update Statuses
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>)}
              </TableRow>)}
          </TableHeader>
          <TableBody>
            {isLoading ?
          // Show skeleton loaders when loading
          Array.from({
            length: 5
          }).map((_, i) => <TableRow key={`skeleton-${i}`}>
                  {Array.from({
              length: columns.length
            }).map((_, j) => <TableCell key={`skeleton-cell-${i}-${j}`}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>)}
                </TableRow>) : table.getRowModel().rows?.length ? table.getRowModel().rows.map(row => <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map(cell => <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>)}
                </TableRow>) : <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No customers found. {searchParams.query || searchParams.status !== 'all' ? 'Try adjusting your filters.' : 'Add your first customer using the button above.'}
                </TableCell>
              </TableRow>}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>;
}
