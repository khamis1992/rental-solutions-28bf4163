
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ObligationType, UrgencyLevel, CustomerObligation } from './CustomerLegalObligations';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface LegalObligationsTabProps {
  customerId: string;
}

// Mock function to simulate fetching legal obligations
const fetchLegalObligations = async (customerId: string): Promise<CustomerObligation[]> => {
  // In a real implementation, this would fetch from your API or database
  console.log(`Fetching legal obligations for customer: ${customerId}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data for now
  return [
    {
      id: "ob-1",
      customerId: customerId,
      customerName: "Customer Name", // Would be fetched from actual data
      description: "Monthly vehicle lease payment",
      obligationType: "payment",
      amount: 2500,
      dueDate: new Date(),
      urgency: "high",
      status: "overdue",
      daysOverdue: 5,
      agreementId: "agr-123",
      agreementNumber: "AGR-2024-0001"
    }
  ];
};

const LegalObligationsTab: React.FC<LegalObligationsTabProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadObligations = async () => {
      try {
        setLoading(true);
        const data = await fetchLegalObligations(customerId);
        setObligations(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load legal obligations:", err);
        setError(err.message || "Failed to load legal obligations");
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      loadObligations();
    }
  }, [customerId]);

  // Get urgency badge
  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Customer Obligations</CardTitle>
          <CardDescription>Loading customer legal obligations...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading obligations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Customer Obligations</CardTitle>
          <CardDescription>An error occurred</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-destructive">
            <AlertTriangle className="mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Legal Obligations</CardTitle>
        <CardDescription>Customer's current legal and financial obligations</CardDescription>
      </CardHeader>
      <CardContent>
        {obligations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obligations.map((obligation) => (
                <TableRow key={obligation.id}>
                  <TableCell>{obligation.description}</TableCell>
                  <TableCell>
                    {obligation.amount === 0 ? 
                      'N/A' : 
                      obligation.amount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'QAR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })
                    }
                  </TableCell>
                  <TableCell>{formatDate(obligation.dueDate)}</TableCell>
                  <TableCell>{getUrgencyBadge(obligation.urgency)}</TableCell>
                  <TableCell>{getStatusBadge(obligation.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No legal obligations found for this customer
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalObligationsTab;
