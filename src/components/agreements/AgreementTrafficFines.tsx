
import React from 'react';
import { useTrafficFineService } from '@/hooks/services/useTrafficFineService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { PaginatedTrafficFineResult, TrafficFine } from '@/types/traffic-fine';

interface AgreementTrafficFinesProps {
  agreementId: string;
}

export const AgreementTrafficFines: React.FC<AgreementTrafficFinesProps> = ({ agreementId }) => {
  const trafficFineService = useTrafficFineService();
  const { data: trafficFines, isLoading, error } = trafficFineService.getTrafficFines(agreementId);

  if (isLoading) {
    return <div>Loading traffic fines...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Handle different return types safely
  const finesArray = Array.isArray(trafficFines) 
    ? trafficFines 
    : (trafficFines as PaginatedTrafficFineResult)?.data || [];

  // Filter unpaid fines - safely handle potential different return types
  const unpaidFines = finesArray.filter(fine => 
    fine.payment_status === 'pending' || fine.payment_status === 'overdue'
  );

  const hasFines = finesArray.length > 0;
  const hasUnpaidFines = unpaidFines.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Traffic Violations</CardTitle>
            <CardDescription>Recent traffic violations for this agreement</CardDescription>
          </div>
          {hasUnpaidFines && (
            <Badge variant="destructive">{unpaidFines.length} Unpaid</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasFines ? (
          <div className="text-center py-4 text-muted-foreground">
            No traffic violations found for this agreement.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Violation</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finesArray.map((fine: TrafficFine) => (
                <TableRow key={fine.id}>
                  <TableCell>
                    {fine.violation_date && format(new Date(fine.violation_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{fine.fine_location || 'Unknown'}</TableCell>
                  <TableCell>{fine.violation_charge || 'Traffic Violation'}</TableCell>
                  <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={fine.payment_status === 'completed' ? 'outline' : 'destructive'}
                    >
                      {fine.payment_status === 'completed' ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
