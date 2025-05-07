
import React from 'react';
import { ColumnDef } from "@tanstack/react-table";
import { Agreement } from '@/types/agreement';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileCheck, FileClock, FileX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const getAgreementColumns = (compact = false): ColumnDef<Agreement>[] => {
  const allColumns: ColumnDef<Agreement>[] = [
    {
      id: 'agreement_number',
      header: 'Agreement',
      cell: ({ row }) => (
        <Link 
          to={`/agreements/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.agreement_number || `AG-${row.original.id?.substring(0, 8)}`}
        </Link>
      ),
    },
    {
      id: 'customers.full_name',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex items-center max-w-[180px]">
          {row.original.customers?.id ? (
            <Link
              to={`/customers/${row.original.customers.id}`}
              className="hover:underline truncate"
            >
              {row.original.customers.full_name || 'N/A'}
            </Link>
          ) : (
            <span className="truncate">{row.original.customer_name || 'N/A'}</span>
          )}
        </div>
      ),
    },
    {
      id: 'vehicles',
      header: 'Vehicle',
      cell: ({ row }) => {
        const vehicle = row.original.vehicles;
        return (
          <div className="flex items-center max-w-[180px]">
            {vehicle?.id ? (
              <Link
                to={`/vehicles/${vehicle.id}`}
                className="hover:underline truncate"
              >
                {vehicle.make && vehicle.model ? (
                  <span className="truncate">{vehicle.make} {vehicle.model} ({vehicle.license_plate})</span>
                ) : (
                  <span className="truncate">{vehicle.license_plate || 'N/A'}</span>
                )}
              </Link>
            ) : (
              <span className="text-muted-foreground">No vehicle</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'start_date',
      header: 'Start Date',
      cell: ({ row }) => (
        <span>{row.original.start_date ? format(row.original.start_date, 'MMM d, yyyy') : 'N/A'}</span>
      ),
    },
    {
      id: 'end_date',
      header: 'End Date',
      cell: ({ row }) => (
        <span>{row.original.end_date ? format(row.original.end_date, 'MMM d, yyyy') : 'N/A'}</span>
      ),
    },
    {
      id: 'rent_amount',
      header: 'Rent Amount',
      cell: ({ row }) => formatCurrency(row.original.rent_amount || 0),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeVariant:
          | 'default'
          | 'secondary'
          | 'destructive'
          | 'outline'
          | null
          | undefined;
        let icon = null;

        switch (status) {
          case 'active':
            badgeVariant = 'default';
            icon = <FileCheck className="h-3 w-3 mr-1" />;
            break;
          case 'pending':
          case 'pending_payment':
          case 'pending_deposit':
            badgeVariant = 'secondary';
            icon = <FileClock className="h-3 w-3 mr-1" />;
            break;
          case 'cancelled':
          case 'terminated':
            badgeVariant = 'destructive';
            icon = <FileX className="h-3 w-3 mr-1" />;
            break;
          default:
            badgeVariant = 'outline';
        }

        return (
          <Badge variant={badgeVariant} className="capitalize flex items-center w-fit">
            {icon}
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end space-x-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 px-2 text-xs"
            asChild
          >
            <Link to={`/agreements/${row.original.id}`}>View</Link>
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 px-2 text-xs"
            asChild
          >
            <Link to={`/agreements/edit/${row.original.id}`}>Edit</Link>
          </Button>
        </div>
      ),
    },
  ];
  
  // Return all columns or a subset for compact view
  if (compact) {
    return allColumns.filter(col => 
      ['agreement_number', 'customers.full_name', 'rent_amount', 'status', 'actions'].includes(col.id as string)
    );
  }
  
  return allColumns;
};
