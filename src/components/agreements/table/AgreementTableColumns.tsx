import React from 'react';
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { FileCheck, FileEdit, FileClock, FileText, FileX, MoreHorizontal, Car } from 'lucide-react';
import { Agreement } from '@/types/agreement';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const getAgreementColumns = (deleteAgreement: (id: string) => void): ColumnDef<Agreement>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "agreement_number",
    header: "Agreement #",
    cell: ({ row }) => (
      <Link 
        to={`/agreements/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.getValue("agreement_number")}
      </Link>
    ),
  },
  {
    accessorKey: "customers.full_name",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customers;
      return (
        <div>
          {customer && customer.id ? (
            <Link 
              to={`/customers/${customer.id}`}
              className="hover:underline"
            >
              {customer.full_name || 'N/A'}
            </Link>
          ) : (
            'N/A'
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "vehicles",
    header: "Vehicle",
    cell: ({ row }) => {
      const vehicle = row.original.vehicles;
      return (
        <div>
          {vehicle && vehicle.id ? (
            <Link 
              to={`/vehicles/${vehicle.id}`}
              className="hover:underline"
            >
              {vehicle.make && vehicle.model ? (
                <div className="flex items-center">
                  <Car className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <span>
                    {vehicle.make} {vehicle.model} 
                    <span className="font-semibold text-primary ml-1">({vehicle.license_plate})</span>
                  </span>
                </div>
              ) : vehicle.license_plate ? (
                <div className="flex items-center">
                  <Car className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <span>Vehicle: <span className="font-semibold text-primary">{vehicle.license_plate}</span></span>
                </div>
              ) : 'N/A'}
            </Link>
          ) : row.original.vehicle_id ? (
            <Link 
              to={`/vehicles/${row.original.vehicle_id}`}
              className="hover:underline text-amber-600"
            >
              Vehicle ID: {row.original.vehicle_id}
            </Link>
          ) : (
            'N/A'
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: "Rental Period",
    cell: ({ row }) => {
      const startDate = row.original.start_date;
      const endDate = row.original.end_date;
      return (
        <div className="whitespace-nowrap">
          {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
        </div>
      );
    },
  },
  {
    accessorKey: "rent_amount",
    header: "Monthly Rent",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {formatCurrency(row.original.rent_amount || 0)}
        </div>
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
            status === "active" ? "success" : 
            status === "draft" ? "secondary" : 
            status === "pending" ? "warning" :
            status === "expired" ? "outline" :
            "destructive"
          }
          className="capitalize"
        >
          {status === "active" ? (
            <FileCheck className="h-3 w-3 mr-1" />
          ) : status === "draft" ? (
            <FileEdit className="h-3 w-3 mr-1" />
          ) : status === "pending" ? (
            <FileClock className="h-3 w-3 mr-1" />
          ) : status === "expired" ? (
            <FileText className="h-3 w-3 mr-1" />
          ) : (
            <FileX className="h-3 w-3 mr-1" />
          )}
          {status}
        </Badge>
      );
    },
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
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/agreements/${agreement.id}`}>
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/agreements/edit/${agreement.id}`}>
                Edit agreement
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete agreement ${agreement.agreement_number}?`)) {
                  deleteAgreement(agreement.id as string);
                }
              }}
            >
              Delete agreement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
