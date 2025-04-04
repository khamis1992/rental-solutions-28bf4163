import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, SortingState, getSortedRowModel } from "@tanstack/react-table";
import { MoreHorizontal, Search, CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCustomersList } from '@/hooks/use-customers-pagination';
import { CustomPaginationLink } from '@/components/ui/custom-pagination-link';

export function CustomerList() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdatingStatuses, setIsUpdatingStatuses] = useState(false);
  const { deleteCustomer, refreshCustomers } = useCustomers();
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  const isMobile = useIsMobile();
  
  const { 
    pagination, 
    setPage, 
    nextPage, 
    prevPage, 
    canNextPage, 
    canPrevPage, 
    totalPages 
  } = usePagination({ initialPage: 1, initialPageSize: 10 });
  
  const {
    data,
    isLoading,
    error
  } = useCustomersList({
    status: statusFilter,
    query: searchQuery,
    pagination
  });
  
  const customers = data?.data || [];
  const totalCount = data?.count || 0;
  
  const { loadMoreRef, isFetchingMore } = useInfiniteScroll({
    fetchMore: async () => {
      nextPage();
      return null;
    },
    isLoading,
    hasMore: canNextPage,
    enabled: isMobile
  });
  
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
        refreshCustomers();
      }
    } catch (err) {
      console.error("Unexpected error updating customer statuses:", err);
      toast.error(t('customers.unexpectedError'));
    } finally {
      setIsUpdatingStatuses(false);
    }
  };
  
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "full_name",
      header: t('customers.name'),
      cell: ({ row }) => {
        const fullName = row.getValue("full_name") as string;
        return (
          <div>
            <Link to={`/customers/${row.original.id}`} className="font-medium text-primary hover:underline">
              {fullName || t('customers.unnamed')}
            </Link>
          </div>
        );
      }
    },
    {
      accessorKey: "email",
      header: t('common.email')
    },
    {
      accessorKey: "phone",
      header: t('common.phone')
    },
    {
      accessorKey: "driver_license",
      header: t('customers.license'),
      cell: ({ row }) => {
        const license = row.getValue("driver_license") as string;
        return license ? (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {license}
          </code>
        ) : (
          <span className="text-muted-foreground text-sm">{t('customers.notProvided')}</span>
        );
      }
    },
    {
      accessorKey: "status",
      header: t('common.status'),
      cell: ({ row }) => {
        const status = row.getValue("status") as string || 'active';

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
        return (
          <Badge className={`capitalize ${badgeClass}`}>
            <Icon className="h-3 w-3 mr-1" />
            {t(`customers.status.${status.replace('_', '')}`)}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <DropdownMenu>
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
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive" 
                onClick={() => {
                  if (window.confirm(t('customers.deleteConfirmation', { name: customer.full_name }))) {
                    deleteCustomer.mutate(customer.id as string);
                  }
                }}
              >
                {t('customers.deleteCustomer')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    }
  });

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <h3 className="font-semibold mb-2">{t('customers.errorLoadingTitle')}</h3>
        <p>{error instanceof Error ? error.message : t('customers.unknownError')}</p>
      </div>
    );
  }
  
  const flexDirection = isRTL ? "flex-row-reverse" : "flex-row";
  
  return (
    <div className="space-y-4">
      <div className={`flex flex-col sm:${flexDirection} justify-between items-start sm:items-center gap-4`}>
        <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} w-full sm:w-auto space-x-2 ${isRTL ? "space-x-reverse" : ""}`}>
          <div className="relative w-full sm:w-[250px] md:w-[300px]">
            <Search className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50`} />
            <Input 
              placeholder={t('customers.searchPlaceholder')} 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className={isRTL ? 'pr-8 text-right' : 'pl-8'} 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && !isFetchingMore ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: columns.length }).map((_, j) => (
                    <TableCell key={`skeleton-cell-${i}-${j}`}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : customers.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.original.status === "inactive" ? "muted" : undefined}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('customers.noCustomers')} {searchQuery || statusFilter !== 'all' ? t('customers.adjustFilters') : t('customers.addFirstCustomer')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {!isMobile && customers.length > 0 && (
        <div className={`flex items-center ${isRTL ? "justify-start" : "justify-end"} space-x-2 ${isRTL ? "space-x-reverse" : ""}`}>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => prevPage()} 
                  className={!canPrevPage ? 'pointer-events-none opacity-50' : ''}
                  aria-disabled={!canPrevPage}
                />
              </PaginationItem>
              
              {pagination.page > 2 && (
                <PaginationItem>
                  <CustomPaginationLink onClick={() => setPage(1)}>
                    1
                  </CustomPaginationLink>
                </PaginationItem>
              )}
              
              {pagination.page > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {pagination.page > 1 && (
                <PaginationItem>
                  <CustomPaginationLink onClick={() => setPage(pagination.page - 1)}>
                    {pagination.page - 1}
                  </CustomPaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <CustomPaginationLink isActive onClick={() => setPage(pagination.page)}>
                  {pagination.page}
                </CustomPaginationLink>
              </PaginationItem>
              
              {pagination.page < totalPages && (
                <PaginationItem>
                  <CustomPaginationLink onClick={() => setPage(pagination.page + 1)}>
                    {pagination.page + 1}
                  </CustomPaginationLink>
                </PaginationItem>
              )}
              
              {pagination.page < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {pagination.page < totalPages - 1 && totalPages > 1 && (
                <PaginationItem>
                  <CustomPaginationLink onClick={() => setPage(totalPages)}>
                    {totalPages}
                  </CustomPaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => nextPage()} 
                  className={!canNextPage ? 'pointer-events-none opacity-50' : ''}
                  aria-disabled={!canNextPage}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {isMobile && (
        <div ref={loadMoreRef} className="py-4 text-center">
          {isFetchingMore && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">{t('common.loading')}</span>
            </div>
          )}
          {!canNextPage && customers.length > 0 && (
            <p className="text-muted-foreground text-sm py-4">{t('common.noMoreItems')}</p>
          )}
        </div>
      )}
    </div>
  );
}
