
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Agreement } from '@/types/agreement';
import { Eye } from 'lucide-react';

interface CustomerAgreementsProps {
  agreements: Agreement[];
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
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground">This customer has no agreements.</p>
          <div className="mt-4">
            <Button asChild>
              <Link to="/agreements/new">Create Agreement</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agreements</CardTitle>
        <Button asChild size="sm">
          <Link to="/agreements/new">Add Agreement</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agreement #</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements.map((agreement) => (
                <TableRow key={agreement.id}>
                  <TableCell>{agreement.agreement_number}</TableCell>
                  <TableCell>
                    {agreement.vehicle ? 
                      `${agreement.vehicle.make} ${agreement.vehicle.model}` : 
                      'No vehicle assigned'}
                  </TableCell>
                  <TableCell>
                    {agreement.start_date && agreement.end_date ? 
                      `${formatDate(new Date(agreement.start_date))} - ${formatDate(new Date(agreement.end_date))}` : 
                      'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      agreement.status === 'active' ? 'default' : 
                      agreement.status?.includes('pending') ? 'outline' :
                      agreement.status === 'completed' ? 'success' : 
                      'secondary'
                    }>
                      {agreement.status?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(agreement.total_amount || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/agreements/${agreement.id}`}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerAgreements;
