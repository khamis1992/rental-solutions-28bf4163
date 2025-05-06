
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from '@/lib/date-utils';
import { Loader2, AlertTriangle, FileText, Scale, CalendarClock } from 'lucide-react';
import { CustomerObligation, UrgencyLevel } from './CustomerLegalObligations';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface CustomerLegalObligationsPageProps {
  customerId: string;
}

const CustomerLegalObligationsPage: React.FC<CustomerLegalObligationsPageProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getLegalCasesByCustomerId } = useLegalCases();

  useEffect(() => {
    const loadLegalObligations = async () => {
      try {
        setLoading(true);
        
        // Ensure we have a valid customerId before proceeding
        if (!customerId) {
          console.error("No customer ID provided");
          setError("No customer ID provided");
          setLoading(false);
          return;
        }
        
        console.log("Fetching legal cases for customer:", customerId);
        
        try {
          // Get legal cases for this customer
          const legalCases = await getLegalCasesByCustomerId(customerId);
          console.log("Legal cases fetched:", legalCases);
          
          // Transform legal cases to obligations format
          const customerObligations: CustomerObligation[] = legalCases.map(legalCase => ({
            id: legalCase.id,
            customerId: legalCase.customer_id,
            customerName: legalCase.profiles?.full_name || 'Unknown',
            obligationType: 'legal_case',
            amount: legalCase.amount_owed || 0,
            dueDate: legalCase.resolution_date ? new Date(legalCase.resolution_date) : new Date(),
            description: legalCase.description || 'Legal case',
            urgency: (legalCase.priority as UrgencyLevel) || 'medium',
            status: legalCase.status || 'pending',
            daysOverdue: calculateDaysOverdue(legalCase.resolution_date),
            agreementId: undefined,
            lateFine: 0,
          }));
          
          setObligations(customerObligations);
        } catch (error) {
          console.error("Error fetching legal cases:", error);
          setError("Failed to fetch legal cases. Please try again later.");
        }
      } catch (err: any) {
        console.error("Failed to load legal obligations:", err);
        setError(err.message || "Failed to load legal obligations");
      } finally {
        setLoading(false);
      }
    };

    loadLegalObligations();
  }, [customerId, getLegalCasesByCustomerId]);

  // Calculate days overdue
  const calculateDaysOverdue = (dateStr?: string): number => {
    if (!dateStr) return 0;
    
    const dueDate = new Date(dateStr);
    const today = new Date();
    
    if (dueDate > today) return 0;
    
    const diffTime = Math.abs(today.getTime() - dueDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

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
      case 'resolved':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'pending':
      case 'pending_reminder':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Pending</Badge>;
      case 'overdue':
      case 'escalated':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateNewCase = () => {
    toast.info("Create new case functionality will be added here");
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Legal Obligations</CardTitle>
          <CardDescription>Customer's legal cases and obligations</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading legal obligations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Legal Obligations</CardTitle>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Legal Obligations</h2>
          <p className="text-muted-foreground">
            Manage all legal obligations and cases for this customer
          </p>
        </div>
        <Button onClick={handleCreateNewCase}>
          <FileText className="mr-2 h-4 w-4" /> Create New Case
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{obligations.length}</div>
            <p className="text-xs text-muted-foreground">
              Total legal cases for this customer
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{obligations.filter(o => o.status.toLowerCase() !== 'completed' && o.status.toLowerCase() !== 'resolved').length}</div>
            <p className="text-xs text-muted-foreground">
              Cases requiring attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Owed</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'QAR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(
                obligations.reduce((total, obligation) => total + obligation.amount, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount owed across all cases
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>All legal cases and obligations for this customer</CardDescription>
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
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'QAR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(obligation.amount)
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
    </div>
  );
};

export default CustomerLegalObligationsPage;
