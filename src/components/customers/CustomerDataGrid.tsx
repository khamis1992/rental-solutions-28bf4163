
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { Customer } from '@/types/customer.types';
import { MoreHorizontal, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CustomerDataGridProps {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onCustomerSelect?: (customer: Customer) => void;
  isLoading?: boolean;
}

export function CustomerDataGrid({ 
  customers, 
  onEdit, 
  onDelete,
  onCustomerSelect,
  isLoading = false 
}: CustomerDataGridProps) {
  if (isLoading) {
    return <div>Loading customers...</div>;
  }

  const handleRowClick = (customer: Customer) => {
    onCustomerSelect?.(customer);
  };

  return (
    <div className="rounded-md border">
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
          {customers.map((customer) => (
            <TableRow 
              key={customer.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(customer)}
            >
              <TableCell className="font-medium">
                {customer.full_name || customer.name || 'N/A'}
              </TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone_number || customer.phone || 'N/A'}</TableCell>
              <TableCell>
                <CustomerStatusBadge status={customer.status || 'active'} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(customer)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(customer.id)}
                      className="text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
