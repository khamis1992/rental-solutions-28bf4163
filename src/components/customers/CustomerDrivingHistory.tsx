
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface TrafficFine {
  id: string;
  violation_number: string;
  violation_date: string;
  fine_amount: number;
  violation_charge: string;
  payment_status: string;
  location?: string;
}

interface CustomerDrivingHistoryProps {
  trafficFines: TrafficFine[];
  isLoading: boolean;
}

const CustomerDrivingHistory: React.FC<CustomerDrivingHistoryProps> = ({ trafficFines, isLoading }) => {
  if (isLoading) {
    return <div>Loading driving history...</div>;
  }

  if (!trafficFines || trafficFines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driving History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No traffic violations found for this customer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Violations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Violation #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Violation</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trafficFines.map((fine) => (
              <TableRow key={fine.id}>
                <TableCell>{fine.violation_number}</TableCell>
                <TableCell>{new Date(fine.violation_date).toLocaleDateString()}</TableCell>
                <TableCell>{fine.violation_charge}</TableCell>
                <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
                <TableCell>{fine.location || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={fine.payment_status === 'completed' ? 'success' : 'destructive'}>
                    {fine.payment_status === 'completed' ? 'Paid' : 'Pending'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CustomerDrivingHistory;
