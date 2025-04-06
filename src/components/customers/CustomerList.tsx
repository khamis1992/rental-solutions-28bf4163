
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
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

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
  const { t } = useI18nTranslation();
  const { isRTL, getNumberFormat } = useTranslation();
  
  // Function to trigger customer status updates
  const handleUpdateCustomerStatuses = async () => {
    setIsUpdatingStatuses(true);
    try {
      const { error } = await supabase.rpc('update_customer_statuses');
      
      if (error) {
        console.error("Error updating customer statuses:", error);
        toast.error(t('customers.statusUpdateFailed'), {
          description: error.message
        });
      } else {
        toast.success(t('customers.statusUpdateSuccess'));
        // Refresh customer list to show updated statuses
        refreshCustomers();
      }
    } catch (err) {
      console.error("Unexpected error updating customer statuses:", err);
      toast.error(t('customers.unexpectedError'));
    } finally {
      setIsUpdatingStatuses(false);
    }
  };
  
  const columns: ColumnDef<Customer>[] = [{
    accessorKey: "full_name",
    header: t('customers.name'),
    cell: ({
      row
    }) => {
      const fullName = row.getValue("full_name") as string;
      return <div>
            <Link to={`/customers/${row.original.id}`} className="font-medium text-primary hover:underline">
              {fullName || t('customers.unnamed')}
            </Link>
          </div>;
    }
  }, {
    accessorKey: "email",
    header: t('common.email')
  }, {
    accessorKey: "phone",
    header: t('common.phone')
  }, {
    accessorKey: "driver_license",
    header: t('customers.license'),
    cell: ({
      row
    }) => {
      const license = row.getValue("driver_license") as string;
      return license ? <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {license}
          </code> : <span className="text-muted-foreground text-sm">{t('customers.notProvided')}</span>;
    }
  }, {
    accessorKey: "status",
    header: t('common.status'),
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
            {t(`customers.status.${status.replace('_', '')}`)}
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
                <span className="sr-only">{t('common.actions')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/customers/${customer.id}`}>
                  {t('customers.viewDetails')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/customers/edit/${customer.id}`}>
                  {t('customers.editCustomer')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
            if (window.confirm(t('customers.deleteConfirmation', { name: customer.full_name }))) {
              deleteCustomer.mutate(customer.id as string);
            }
          }}>
                {t('customers.deleteCustomer')}
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
        <h3 className="font-semibold mb-2">{t('customers.errorLoadingTitle')}</h3>
        <p>{error instanceof Error ? error.message : t('customers.unknownError')}</p>
      </div>;
  }
  
  const flexDirection = isRTL ? "flex-row-reverse" : "flex-row";
  
  return <div className="space-y-4">
      <div className={`flex flex-col sm:${flexDirection} justify-between items-start sm:items-center gap-4`}>
        <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} w-full sm:w-auto space-x-2 ${isRTL ? "space-x-reverse" : ""}`}>
          <div className="relative w-full sm:w-[250px] md:w-[300px]">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50`} />
            <Input placeholder={t('customers.searchPlaceholder')} value={searchParams.query || ''} onChange={e => setSearchParams({
            ...searchParams,
            query: e.target.value
          })} className={`h-9 ${isRTL ? "pr-9 text-right" : "pl-9"} w-full`} />
          </div>
          <Select value={searchParams.status} onValueChange={value => setSearchParams({
          ...searchParams,
          status: value
        })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('customers.selectStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('customers.allStatuses')}</SelectItem>
              <SelectItem value="active">{t('customers.status.active')}</SelectItem>
              <SelectItem value="inactive">{t('customers.status.inactive')}</SelectItem>
              <SelectItem value="blacklisted">{t('customers.status.blacklisted')}</SelectItem>
              <SelectItem value="pending_review">{t('customers.status.pendingreview')}</SelectItem>
              <SelectItem value="pending_payment">{t('customers.status.pendingpayment')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2 items-center">
          <Button 
            variant="outline" 
            onClick={handleUpdateCustomerStatuses}
            disabled={isUpdatingStatuses}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdatingStatuses ? 'animate-spin' : ''}`} />
            {t('customers.updateStatuses')}
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
                  {t('customers.noCustomers')} {searchParams.query || searchParams.status !== 'all' ? t('customers.adjustFilters') : t('customers.addFirstCustomer')}
                </TableCell>
              </TableRow>}
          </TableBody>
        </Table>
      </div>
      
      <div className={`flex items-center ${isRTL ? "justify-start" : "justify-end"} space-x-2 ${isRTL ? "space-x-reverse" : ""}`}>
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {t('common.back')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {t('common.next')}
        </Button>
      </div>
    </div>;
}
