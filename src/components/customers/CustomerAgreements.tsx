
import { useState, useEffect } from 'react';
import { useAgreements } from '@/hooks/use-agreements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2, FileText } from 'lucide-react';

interface CustomerAgreementsProps {
  customerId: string;
}

const CustomerAgreements = ({ customerId }: CustomerAgreementsProps) => {
  const { agreements, isLoading } = useAgreements({ customer_id: customerId });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading agreements...</span>
      </div>
    );
  }

  if (!agreements || agreements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No agreements found for this customer.</p>
          <Button asChild className="mt-4">
            <Link to={`/agreements/add?customer=${customerId}`}>
              Create Agreement
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Customer Agreements</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="border rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead>Agreement #</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreements.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell className="font-medium">
                  {agreement.agreement_number || 'N/A'}
                </TableCell>
                <TableCell>
                  {agreement.start_date && (
                    <>
                      {format(new Date(agreement.start_date), 'MMM d, yyyy')}
                      {agreement.end_date && (
                        <>
                          <br />
                          to {format(new Date(agreement.end_date), 'MMM d, yyyy')}
                        </>
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell>
                  {agreement.vehicles ? (
                    <>
                      {agreement.vehicles.make} {agreement.vehicles.model}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {agreement.vehicles.license_plate}
                      </span>
                    </>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  {agreement.total_amount ? formatCurrency(agreement.total_amount) : 'N/A'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(agreement.status)}
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/agreements/${agreement.id}`}>
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CustomerAgreements;
