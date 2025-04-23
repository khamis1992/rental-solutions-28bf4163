
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { 
  MoreHorizontal, 
  FileText, 
  FileCheck, 
  FileX, 
  FileClock, 
  FileEdit,
  FilePlus,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

export const AgreementList = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const navigate = useNavigate();
  
  const { 
    agreements, 
    isLoading, 
    error,
    setSearchParams,
    deleteAgreement 
  } = useAgreements({ status: statusFilter });

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setSearchParams(prev => ({ ...prev, status: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center w-full sm:w-auto space-x-2">
          <Select
            value={statusFilter}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={AgreementStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={AgreementStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={AgreementStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={AgreementStatus.EXPIRED}>Expired</SelectItem>
              <SelectItem value={AgreementStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button asChild>
          <Link to="/agreements/add">
            <FilePlus className="h-4 w-4 mr-2" />
            New Agreement
          </Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : String(error)}</AlertDescription>
        </Alert>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agreement #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Rental Period</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={`skeleton-cell-${i}-${j}`}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : agreements && agreements.length > 0 ? (
              agreements.map((agreement) => (
                <TableRow key={agreement.id}>
                  <TableCell className="font-medium">
                    <Link 
                      to={`/agreements/${agreement.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {agreement.agreement_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {agreement.customers && agreement.customers.id ? (
                      <Link 
                        to={`/customers/${agreement.customers.id}`}
                        className="hover:underline"
                      >
                        {agreement.customers.full_name || 'N/A'}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {agreement.vehicles && agreement.vehicles.id ? (
                      <Link 
                        to={`/vehicles/${agreement.vehicles.id}`}
                        className="hover:underline"
                      >
                        {agreement.vehicles.make && agreement.vehicles.model ? (
                          <span>
                            {agreement.vehicles.make} {agreement.vehicles.model} 
                            <span className="font-semibold text-primary ml-1">({agreement.vehicles.license_plate})</span>
                          </span>
                        ) : agreement.vehicles.license_plate ? (
                          <span>Vehicle: <span className="font-semibold text-primary">{agreement.vehicles.license_plate}</span></span>
                        ) : 'N/A'}
                      </Link>
                    ) : agreement.vehicle_id ? (
                      <Link 
                        to={`/vehicles/${agreement.vehicle_id}`}
                        className="hover:underline text-amber-600"
                      >
                        Vehicle ID: {agreement.vehicle_id}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {agreement.start_date && agreement.end_date && (
                      <span>
                        {format(new Date(agreement.start_date), 'MMM d, yyyy')} - {format(new Date(agreement.end_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(agreement.rent_amount || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        agreement.status === AgreementStatus.ACTIVE ? "success" : 
                        agreement.status === AgreementStatus.DRAFT ? "secondary" : 
                        agreement.status === AgreementStatus.PENDING ? "warning" :
                        agreement.status === AgreementStatus.EXPIRED ? "outline" :
                        "destructive"
                      }
                      className="capitalize"
                    >
                      {agreement.status === AgreementStatus.ACTIVE ? (
                        <FileCheck className="h-3 w-3 mr-1" />
                      ) : agreement.status === AgreementStatus.DRAFT ? (
                        <FileEdit className="h-3 w-3 mr-1" />
                      ) : agreement.status === AgreementStatus.PENDING ? (
                        <FileClock className="h-3 w-3 mr-1" />
                      ) : agreement.status === AgreementStatus.EXPIRED ? (
                        <FileText className="h-3 w-3 mr-1" />
                      ) : (
                        <FileX className="h-3 w-3 mr-1" />
                      )}
                      {agreement.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {agreement.created_at ? format(new Date(agreement.created_at), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
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
                              deleteAgreement.mutate(agreement.id);
                            }
                          }}
                        >
                          Delete agreement
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <p>
                      {statusFilter !== 'all' ? 
                        'No agreements found with the selected status.' : 
                        'Add your first agreement using the button above.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
