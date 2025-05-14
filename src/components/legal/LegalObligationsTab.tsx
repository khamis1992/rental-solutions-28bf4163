
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { CustomerObligation } from './CustomerLegalObligations';
import { useLegalCaseQuery } from '@/hooks/use-legal-case-query';

interface LegalObligationsTabProps {
  customerId: string;
}

const LegalObligationsTab: React.FC<LegalObligationsTabProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getLegalCases } = useLegalCaseQuery();
  const { data: legalCases, isLoading: casesLoading, isError, error: queryError } = 
    customerId ? getLegalCases({ customerId }) : { data: null, isLoading: false, isError: false, error: null };

  // Added console logs for debugging
  useEffect(() => {
    console.log("LegalObligationsTab: useEffect triggered with customerId:", customerId);
    
    if (!customerId) {
      console.error("LegalObligationsTab: No customer ID provided");
      setLoading(false);
      setError("No customer ID provided");
      return;
    }
    
    if (isError && queryError) {
      console.error("LegalObligationsTab: Error fetching legal cases:", queryError);
      setError(queryError instanceof Error ? queryError.message : "Failed to fetch legal obligations");
      setLoading(false);
      return;
    }
    
    if (!casesLoading && legalCases) {
      console.log("LegalObligationsTab: Legal cases fetched:", legalCases);
      
      const mappedObligations = legalCases.map(legalCase => ({
        id: legalCase.id,
        customerId: legalCase.customer_id,
        customerName: legalCase.customer_name || 'Unknown Customer',
        description: legalCase.description || '',
        obligationType: 'legal_case',
        amount: legalCase.amount_owed || 0,
        dueDate: legalCase.due_date ? new Date(legalCase.due_date) : undefined,
        urgency: legalCase.priority?.toLowerCase() || 'medium',
        status: legalCase.status || 'pending',
        daysOverdue: legalCase.days_overdue || 0,
        createdAt: new Date(legalCase.created_at || new Date())
      }));
      
      setObligations(mappedObligations);
      setLoading(false);
    }
  }, [customerId, legalCases, casesLoading, isError, queryError]);

        // For now, we'll use mock data while implementing the actual functionality
        const mockObligations: CustomerObligation[] = [
          {
            id: "ob-1",
            customerId: customerId,
            customerName: customerData?.full_name || "Unknown Customer",
            description: "Monthly vehicle lease payment",
            status: "overdue",
            dueDate: new Date(),
            createdAt: new Date(), // Make sure createdAt is provided
            amount: 1200,
            urgency: "high",
            daysOverdue: 5,
            obligationType: "payment"
          }
        ];
        
        setObligations(mockObligations);
        setError(null);
      } catch (err: any) {
        console.error("LegalObligationsTab: Failed to load legal obligations:", err);
        setError(err.message || "Failed to load legal obligations");
      } finally {
        setLoading(false);
      }
    };

    loadObligations();
  }, [customerId]); // Keep customerId in dependency array

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
