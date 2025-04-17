
import React, { useState } from 'react';
import { useCustomers } from '@/hooks/use-customers';
import { Link } from 'react-router-dom';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Loader2,
  Eye,
  Pencil,
  MoreVertical,
  Users,
  UserX,
  AlertTriangle,
  UserCheck,
  UserClock
} from "lucide-react";
import { CustomerInfo, CustomerStatus } from '@/types/customer';
import { SelectFilter } from '@/components/ui/select-filter';

export function CustomerList() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const { customers, isLoading, error } = useCustomers();

  const getStatusBadge = (status?: CustomerStatus) => {
    if (!status) return <Badge>Unknown</Badge>;
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending_review':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending Review</Badge>;
      case 'blacklisted':
        return <Badge variant="destructive">Blacklisted</Badge>;
      case 'pending_payment':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Pending Payment</Badge>;
      case 'blocked':
        return <Badge className="bg-red-500 hover:bg-red-600">Blocked</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (selectedTab === "all") return true;
    return customer.status === selectedTab;
  });

  // Extract unique statuses for the filter
  const uniqueStatuses = Array.from(
    new Set(customers.map(c => c.status))
  ).filter(Boolean) as CustomerStatus[];

  const columns: ColumnDef<CustomerInfo>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("full_name")}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.email || "No email provided"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone_number",
      header: "Phone",
      cell: ({ row }) => row.original.phone || row.original.phone_number || "N/A",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "driver_license",
      header: "License",
      cell: ({ row }) => row.original.driver_license || "N/A",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/customers/${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/customers/edit/${row.original.id}`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredCustomers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">
              All <Badge className="ml-2 bg-primary/10 text-primary border-0">{customers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              <UserCheck className="h-4 w-4 mr-1" /> Active
              <Badge className="ml-2 bg-green-500/10 text-green-500 border-0">
                {customers.filter(c => c.status === 'active').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending_review">
              <UserClock className="h-4 w-4 mr-1" /> Pending
              <Badge className="ml-2 bg-amber-500/10 text-amber-500 border-0">
                {customers.filter(c => c.status === 'pending_review').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="blacklisted">
              <UserX className="h-4 w-4 mr-1" /> Blacklisted
              <Badge className="ml-2 bg-destructive/10 text-destructive border-0">
                {customers.filter(c => c.status === 'blacklisted').length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <CustomerTable table={table} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <CustomerTable table={table} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="pending_review" className="space-y-4">
          <CustomerTable table={table} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="blacklisted" className="space-y-4">
          <CustomerTable table={table} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="pending_payment" className="space-y-4">
          <CustomerTable table={table} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="blocked" className="space-y-4">
          <CustomerTable table={table} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CustomerTableProps {
  table: any;
  isLoading: boolean;
}

function CustomerTable({ table, isLoading }: CustomerTableProps) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-full relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone..."
                className="pl-8 w-full md:w-[300px]"
                value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("full_name")?.setFilterValue(event.target.value)
                }
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup: any) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => (
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
                <TableRow>
                  <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: any) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell: any) => (
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
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} customers
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
        </div>
      </CardFooter>
    </Card>
  );
}
