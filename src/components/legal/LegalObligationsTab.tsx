
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { CustomerObligation } from './CustomerLegalObligations';
import { supabase } from '@/lib/supabase';

interface LegalObligationsTabProps {
  customerId: string;
}

const LegalObligationsTab: React.FC<LegalObligationsTabProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadObligations = async () => {
      if (!customerId) {
        setLoading(false);
        setError("No customer ID provided");
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch customer name first
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', customerId)
          .maybeSingle();
          
        if (customerError) {
          console.error("Error fetching customer data:", customerError);
          throw new Error("Failed to fetch customer information");
        }

        // For now, we'll use mock data while implementing the actual functionality
        const mockObligations: CustomerObligation[] = [
          {
            id: "ob-1",
            customerId: customerId,
            customerName: customerData?.full_name || "Unknown Customer",
            description: "Monthly vehicle lease payment",
            status: "overdue",
            dueDate: new Date(),
            createdAt: new Date(),
            amount: 1200,
            urgency: "high",
            daysOverdue: 5,
            obligationType: "payment"
          }
        ];
        
        setObligations(mockObligations);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load legal obligations:", err);
        setError(err.message || "Failed to load legal obligations");
      } finally {
        setLoading(false);
      }
    };

    loadObligations();
  }, [customerId]); // Properly include customerId in the dependency array

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
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obligations.map((obligation) => (
                <TableRow key={obligation.id}>
                  <TableCell>{obligation.description}</TableCell>
                  <TableCell>
                    {obligation.dueDate ? formatDate(obligation.dueDate) : 'N/A'}
                  </TableCell>
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
