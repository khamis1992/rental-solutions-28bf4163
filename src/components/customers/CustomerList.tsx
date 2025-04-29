
import React, { useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
// Using public asset as demonstration
const heroImg = '/og-image.png';
// import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import CustomerRow from './CustomerRow';
import StatusBadge from './StatusBadge';

import { useCustomers } from '@/hooks/use-customers';
import { Skeleton } from '@/components/ui/skeleton';
import type { Customer } from '@/lib/validation-schemas/customer';

interface CustomerListProps {
  searchParams: {
    query: string;
    status: string;
  };
}

const CustomerList: React.FC<CustomerListProps> = ({ searchParams }) => {
  const {
    customers,
    isLoading,
    error,
    deleteCustomer,
  } = useCustomers();

  const debouncedQuery = useDebounce(searchParams.query, 300);
  const memoizedCustomers = useMemo(() => {
    if (!customers) return [];
    let filtered = customers;
    if (debouncedQuery) {
      filtered = filtered.filter(cust =>
        cust.full_name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        cust.email?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        cust.phone?.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }
    if (searchParams?.status && searchParams.status !== 'all') {
      filtered = filtered.filter(cust => cust.status === searchParams.status);
    }
    return filtered;
  }, [customers, debouncedQuery, searchParams.status]);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
        <h3 className="font-semibold mb-2">Error loading customers</h3>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
      </div>
    );
  }

  return (
    <>
      <img src={heroImg} alt="Customers" style={{maxWidth: 200, marginBottom: 16}} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
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
          ) : (
            memoizedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              memoizedCustomers.map((customer) => (
                <CustomerRow customer={customer} key={customer.id} />
              ))
            )
          )}
        </TableBody>
      </Table>
    </>
  );
};

export default CustomerList;
