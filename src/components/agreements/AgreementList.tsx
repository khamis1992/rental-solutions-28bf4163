
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Search, X, Filter, Plus, MoreHorizontal, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from '@/lib/date-utils';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Agreement, AgreementStatus, useAgreements } from '@/hooks/use-agreements';

const AgreementList = ({ searchQuery }: { searchQuery: string }) => {
  const navigate = useNavigate();
  const { agreements, isLoading, error, setSearchParams } = useAgreements();
  const [agreementToDelete, setAgreementToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<Agreement>[] = [
    {
      accessorKey: "agreement_number",
      header: "Agreement #",
      cell: ({ row }) => (
        <div className="w-[80px]">
          {row.getValue("agreement_number")}
        </div>
      ),
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "customers.full_name",
      header: "Customer Name",
      cell: ({ row }) => {
        const customerName = row.original.customers?.full_name || 'N/A';
        return (
          <div className="w-[150px]">
            {customerName}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "vehicles.license_plate",
      header: "License Plate",
      cell: ({ row }) => {
        const licensePlate = row.original.vehicles?.license_plate || 'N/A';
        return (
          <div className="w-[100px]">
            {licensePlate}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => {
        const startDate = row.original.start_date ? formatDate(row.original.start_date) : 'N/A';
        return (
          <div className="w-[100px]">
            {startDate}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => {
        const endDate = row.original.end_date ? formatDate(row.original.end_date) : 'N/A';
        return (
          <div className="w-[100px]">
            {endDate}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="w-[80px]">
            <Badge 
              className={
                status === AgreementStatus.ACTIVE ? "bg-green-500" :
                status === AgreementStatus.PENDING ? "bg-yellow-500" :
                status === AgreementStatus.CANCELLED ? "bg-red-500" :
                status === AgreementStatus.EXPIRED ? "bg-gray-500" :
                status === AgreementStatus.CLOSED ? "bg-blue-500" :
                status === AgreementStatus.DRAFT ? "bg-purple-500" :
                ""
              }
            >
              {status?.toLowerCase()}
            </Badge>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
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
              <DropdownMenuItem onClick={() => navigate(`/agreements/${agreement.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setAgreementToDelete(agreement.id)}
                className="text-destructive"
              >
                Delete Agreement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ query: searchQuery });
    } else {
      setSearchParams(prev => ({ ...prev, query: '' }));
    }
  }, [searchQuery, setSearchParams]);

  const handleDeleteAgreement = async () => {
    if (!agreementToDelete) return;
    
    try {
      await deleteAgreement.mutateAsync(agreementToDelete);
      setAgreementToDelete(null);
      toast({
        title: "Agreement deleted",
        description: "The agreement has been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to delete agreement:", error);
      toast({
        title: "Error",
        description: "Failed to delete the agreement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Active", value: AgreementStatus.ACTIVE },
    { label: "Pending", value: AgreementStatus.PENDING },
    { label: "Expired", value: AgreementStatus.EXPIRED },
    { label: "Cancelled", value: AgreementStatus.CANCELLED },
    { label: "Closed", value: AgreementStatus.CLOSED },
    { label: "Draft", value: AgreementStatus.DRAFT },
  ];

  const table = useReactTable({
    data: agreements || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading agreements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
          <h3 className="font-medium text-destructive">Error loading agreements</h3>
        </div>
        <p className="text-sm text-destructive mt-1">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Agreements</h2>
          <p className="text-sm text-muted-foreground">
            {agreements?.length || 0} agreements found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchParams({ status: "all" });
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
          <Button
            onClick={() => navigate("/agreements/add")}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Agreement
          </Button>
        </div>
      </div>
      
      <div className="flex items-center py-4 space-x-4">
        <Select
          onValueChange={(value) => {
            setSearchParams({ status: value });
          }}
          defaultValue="all"
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <DataTable table={table} />
      
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
      
      <AlertDialog open={!!agreementToDelete} onOpenChange={(open) => !open && setAgreementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              agreement and all related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgreement}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export { AgreementList };
