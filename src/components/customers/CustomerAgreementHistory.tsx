
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { 
  FileCheck, 
  FileEdit, 
  FileClock, 
  FileText, 
  FileX,
  Car,
  Calendar
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AgreementStatus } from '@/lib/validation-schemas/agreement';

interface CustomerAgreementHistoryProps {
  customerId: string;
}

export function CustomerAgreementHistory({ customerId }: CustomerAgreementHistoryProps) {
  const { data: agreements, isLoading, error } = useQuery({
    queryKey: ['customerAgreements', customerId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('leases')
          .select(`
            *,
            vehicles:vehicle_id (id, make, model, license_plate, year, color)
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data as SimpleAgreement[];
      } catch (err) {
        console.error('Error fetching customer agreements:', err);
        throw err;
      }
    },
    enabled: !!customerId,
  });

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    
    return (
      <Badge 
        variant={
          status === AgreementStatus.ACTIVE ? "success" : 
          status === AgreementStatus.DRAFT ? "secondary" : 
          status === AgreementStatus.PENDING ? "warning" :
          status === AgreementStatus.EXPIRED ? "outline" :
          "destructive"
        }
        className="capitalize"
      >
        {status === AgreementStatus.ACTIVE ? (
          <FileCheck className="h-3 w-3 mr-1" />
        ) : status === AgreementStatus.DRAFT ? (
          <FileEdit className="h-3 w-3 mr-1" />
        ) : status === AgreementStatus.PENDING ? (
          <FileClock className="h-3 w-3 mr-1" />
        ) : status === AgreementStatus.EXPIRED ? (
          <FileText className="h-3 w-3 mr-1" />
        ) : (
          <FileX className="h-3 w-3 mr-1" />
        )}
        {status}
      </Badge>
    );
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading agreements</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary/80" />
          <CardTitle>Agreement History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !agreements || agreements.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No agreements found for this customer.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement #</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell>
                      <Link 
                        to={`/agreements/${agreement.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {agreement.agreement_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {agreement.vehicles ? (
                        <div className="flex items-center">
                          <Car className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <span>
                            {agreement.vehicles.make} {agreement.vehicles.model} 
                            <span className="font-semibold text-primary ml-1">({agreement.vehicles.license_plate})</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {agreement.start_date && agreement.end_date ? (
                        `${format(new Date(agreement.start_date), 'MMM d, yyyy')} - ${format(new Date(agreement.end_date), 'MMM d, yyyy')}`
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(agreement.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(agreement.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
