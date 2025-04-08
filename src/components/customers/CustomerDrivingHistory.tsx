
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';

interface DrivingRecord {
  id: string;
  date: string;
  incident_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  fine_amount?: number;
  points?: number;
}

interface CustomerDrivingHistoryProps {
  customerId: string;
  records?: DrivingRecord[];
  isLoading: boolean;
}

const CustomerDrivingHistory: React.FC<CustomerDrivingHistoryProps> = ({
  customerId,
  records = [],
  isLoading,
}) => {
  if (isLoading) {
    return <div>Loading driving history...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driving History</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No driving records found for this customer.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead>Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(new Date(record.date))}</TableCell>
                  <TableCell>{record.incident_type}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>
                    <Badge variant={
                      record.severity === 'low' ? 'outline' :
                      record.severity === 'medium' ? 'secondary' :
                      'destructive'
                    }>
                      {record.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.fine_amount ? formatCurrency(record.fine_amount) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {record.points ?? 'N/A'}
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

export default CustomerDrivingHistory;
