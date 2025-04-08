
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AgreementWithDetails } from '@/hooks/use-agreements';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface CustomerAgreementsProps {
  agreements: AgreementWithDetails[];
  isLoading: boolean;
}

const CustomerAgreements: React.FC<CustomerAgreementsProps> = ({ agreements, isLoading }) => {
  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (!agreements || agreements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No agreements found for this customer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agreements</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agreement #</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreements.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell>{agreement.agreement_number}</TableCell>
                <TableCell>
                  {agreement.vehicle?.make} {agreement.vehicle?.model} {agreement.vehicle?.license_plate && `(${agreement.vehicle.license_plate})`}
                </TableCell>
                <TableCell>
                  <Badge variant={agreement.status === 'active' ? 'default' : 'secondary'}>
                    {agreement.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(agreement.start_date)}</TableCell>
                <TableCell>{formatDate(agreement.end_date)}</TableCell>
                <TableCell>{formatCurrency(agreement.rent_amount)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/agreements/${agreement.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
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
