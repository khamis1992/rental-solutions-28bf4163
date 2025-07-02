
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Agreement } from '@/types/agreement';
import { FileCheck, FileEdit, FileClock, FileText, FileX, MoreHorizontal, Car, User, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface AgreementCardViewProps {
  agreements: Agreement[];
  isLoading: boolean;
  onDeleteAgreement: (id: string) => void;
}

export function AgreementCardView({ agreements, isLoading, onDeleteAgreement }: AgreementCardViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!agreements?.length) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No agreements found</h3>
        <p className="text-gray-500 max-w-md mx-auto mt-2">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" className="capitalize"><FileCheck className="h-3 w-3 mr-1" />{status}</Badge>;
      case "draft":
        return <Badge variant="secondary" className="capitalize"><FileEdit className="h-3 w-3 mr-1" />{status}</Badge>;
      case "pending":
      case "pending_payment":
      case "pending_deposit":
        return <Badge variant="warning" className="capitalize"><FileClock className="h-3 w-3 mr-1" />pending</Badge>;
      case "expired":
      case "archived":
        return <Badge variant="outline" className="capitalize"><FileText className="h-3 w-3 mr-1" />expired</Badge>;
      case "cancelled":
      case "terminated":
        return <Badge variant="destructive" className="capitalize"><FileX className="h-3 w-3 mr-1" />cancelled</Badge>;
      default:
        return <Badge className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agreements.map((agreement) => (
        <Card key={agreement.id} className="overflow-hidden hover:border-primary/50 transition-colors">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center space-x-2">
              <Link
                to={`/agreements/${agreement.id}`}
                className="font-medium text-primary hover:underline"
              >
                {agreement.agreement_number || `AG-${agreement.id.substring(0, 8)}`}
              </Link>
              {getStatusBadge(agreement.status)}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      onDeleteAgreement(agreement.id as string);
                    }
                  }}
                >
                  Delete agreement
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            {/* Customer */}
            <div className="flex items-start space-x-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="text-sm">
                {agreement.customers && agreement.customers.id ? (
                  <Link 
                    to={`/customers/${agreement.customers.id}`}
                    className="hover:underline font-medium"
                  >
                    {agreement.customers.full_name || 'N/A'}
                  </Link>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
            
            {/* Vehicle */}
            <div className="flex items-start space-x-2">
              <Car className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="text-sm">
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
                  <span className="text-amber-600">Vehicle ID: {agreement.vehicle_id}</span>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
            
            {/* Period */}
            <div className="flex items-start space-x-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="text-sm">
                {agreement.start_date && agreement.end_date ? (
                  <span>
                    {format(new Date(agreement.start_date), 'MMM d, yyyy')} - {format(new Date(agreement.end_date), 'MMM d, yyyy')}
                  </span>
                ) : (
                  'Period not specified'
                )}
              </div>
            </div>
            
            {/* Amount */}
            <div className="flex items-start space-x-2">
              <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="text-sm font-medium">
                {formatCurrency(agreement.rent_amount || 0)}/month
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between">
            <Link
              to={`/agreements/${agreement.id}`}
              className="text-xs text-primary hover:underline"
            >
              View Details
            </Link>
            <Link
              to={`/agreements/edit/${agreement.id}`}
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Edit
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
