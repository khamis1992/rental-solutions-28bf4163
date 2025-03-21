
import React, { useEffect, useState } from "react";
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
  FileText, 
  MoreHorizontal, 
  Pencil, 
  Phone, 
  Star, 
  Trash2, 
  User, 
  UserPlus 
} from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

interface CustomerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  customer_type: string;
  status: string;
  created_at: string;
}

const CustomerList = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*");
      
      if (error) throw error;
      
      setCustomers(data || []);
    } catch (error: any) {
      console.error("Error fetching customers:", error.message);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);
      
      if (error) throw error;
      
      setCustomers(customers.filter(customer => customer.id !== customerId));
      toast.success("Customer deleted successfully");
    } catch (error: any) {
      console.error("Error deleting customer:", error.message);
      toast.error("Failed to delete customer");
    }
  };

  const columns: ColumnDef<CustomerData>[] = [
    {
      accessorKey: "first_name",
      header: "First Name",
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return (
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{phone}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "customer_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("customer_type") as string;
        return (
          <Badge 
            variant={type === "corporate" ? "secondary" : "outline"}
            className={type === "corporate" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
          >
            {type === "corporate" ? (
              <Star className="h-3 w-3 mr-1" />
            ) : (
              <User className="h-3 w-3 mr-1" />
            )}
            <span className="capitalize">{type}</span>
          </Badge>
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
              status === "active" ? "default" : 
              status === "pending" ? "secondary" : 
              "destructive"
            }
            className={
              status === "active" ? "bg-green-500 hover:bg-green-600" : 
              status === "pending" ? "bg-yellow-500 hover:bg-yellow-600" : 
              ""
            }
          >
            <span className="capitalize">{status.replace('_', ' ')}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        return new Date(row.getValue("created_at")).toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original;
        
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
              <DropdownMenuItem
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/customers/edit/${customer.id}`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this customer?")) {
                    handleDeleteCustomer(customer.id);
                  }
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Customers</h2>
          <p className="text-muted-foreground">Manage your customer base</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => navigate("/customers/add")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
          <Button variant="outline" onClick={fetchCustomers} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("first_name")?.getFilterValue() as string) || ""}
          onChange={(e) => table.getColumn("first_name")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="border rounded-md">
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
                  className="cursor-pointer"
                  onClick={() => navigate(`/customers/${row.original.id}`)}
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
                  {loading ? "Loading..." : "No customers found."}
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

export default CustomerList;
