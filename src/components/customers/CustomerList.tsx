
import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Link } from 'react-router-dom';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useCustomers } from '@/hooks/use-customers';
import { Skeleton } from '@/components/ui/skeleton';
import type { Customer } from '@/lib/validation-schemas/customer';

interface CustomerListProps {
  searchParams: {
    query: string;
    status: string;
  };
}

export const CustomerList: React.FC<CustomerListProps> = React.memo(({ searchParams }) => {
  const {
    customers,
    isLoading,
    error,
    deleteCustomer,
  } = useCustomers();

  const memoizedCustomers = useMemo(() => {
    if (!customers) return [];
    let filtered = customers;
    if (searchParams?.query) {
      filtered = filtered.filter(cust =>
        cust.full_name.toLowerCase().includes(searchParams.query.toLowerCase()) ||
        cust.email?.toLowerCase().includes(searchParams.query.toLowerCase()) ||
        cust.phone?.toLowerCase().includes(searchParams.query.toLowerCase())
      );
    }
    if (searchParams?.status && searchParams.status !== 'all') {
      filtered = filtered.filter(cust => cust.status === searchParams.status);
    }
    return filtered;
  }, [customers, searchParams]);

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      active: { variant: "default", icon: CheckCircle },
      inactive: { variant: "secondary", icon: XCircle },
      blacklisted: { variant: "destructive", icon: XCircle },
      pending_review: { variant: "outline", icon: AlertTriangle },
      pending_payment: { variant: "outline", icon: AlertTriangle },
    };

    const { variant, icon: Icon } = variants[status] || variants.active;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  }, []);

  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const customer = memoizedCustomers[index];
    return (
      <TableRow style={style} key={customer.id} className="hover:bg-muted/50">
        <TableCell className="font-medium">
          <Link 
            to={`/customers/${customer.id}`}
            className="text-primary hover:underline"
          >
            {customer.full_name}
          </Link>
        </TableCell>
        <TableCell>{customer.email}</TableCell>
        <TableCell>{customer.phone}</TableCell>
        <TableCell>{getStatusBadge(customer.status)}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/customers/${customer.id}`}>View details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/customers/edit/${customer.id}`}>Edit customer</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${customer.full_name}?`)) {
                    deleteCustomer.mutate(customer.id);
                  }
                }}
              >
                Delete customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  }, [memoizedCustomers, getStatusBadge, deleteCustomer]);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
        <h3 className="font-semibold mb-2">Error loading customers</h3>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-6 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[50px]" /></TableCell>
                </TableRow>
              ))
            ) : memoizedCustomers.length ? (
              <TableRow>
                <TableCell colSpan={5} style={{ padding: 0, border: 0 }}>
                  <List
                    height={400}
                    itemCount={memoizedCustomers.length}
                    itemSize={56}
                    width={"100%"}
                  >
                    {Row}
                  </List>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No customers found. {searchParams?.query || searchParams?.status !== 'all' 
                    ? 'Try adjusting your filters.' 
                    : 'Add your first customer using the button above.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

export default CustomerList;
