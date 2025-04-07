import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MoreVertical, Edit, Copy, Trash2, FileInput, Loader2, ArrowLeft, Search, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverArrow,
  PopoverClose,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAgreements } from '@/hooks/use-agreements';
import { Agreement, AgreementStatus } from '@/types/agreement';
import { useProfiles } from '@/hooks/use-profiles';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAgreementImport } from '@/hooks/use-agreement-import';
import { supabase } from '@/lib/supabase';
import { CustomButton } from '@/components/ui/custom-button';
import { formatDate } from '@/lib/date-utils';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  CommandDialog,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter, DataTableViewOptions } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  HoverCard,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import {
  Separator,
} from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Skeleton,
} from "@/components/ui/skeleton";
import {
  Switch,
} from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Slider,
} from "@/components/ui/slider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  Filter,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Share2,
  Trash,
  Upload,
  UserRoundPlus,
} from "lucide-react";
import * as XLSX from 'xlsx';

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
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Agreement #" />
      ),
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
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Customer Name" />
      ),
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
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="License Plate" />
      ),
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
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Start Date" />
      ),
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
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="End Date" />
      ),
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
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="w-[80px]">
            <Badge 
              className={cn(
                "capitalize",
                status === AgreementStatus.ACTIVE && "bg-green-500",
                status === AgreementStatus.PENDING && "bg-yellow-500",
                status === AgreementStatus.CANCELLED && "bg-red-500",
                status === AgreementStatus.EXPIRED && "bg-gray-500",
                status === AgreementStatus.CLOSED && "bg-blue-500",
                status === AgreementStatus.DRAFT && "bg-purple-500",
              )}
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
              <DropdownMenuItem onClick={() => navigate(`/agreements/edit/${agreement.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Agreement
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setAgreementToDelete(agreement.id)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
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
      await agreements?.deleteAgreement.mutateAsync(agreementToDelete);
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
