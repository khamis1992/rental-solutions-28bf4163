
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import LegalCaseDetails from './LegalCaseDetails';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';

export interface CustomerObligation {
  id: string;
  customerId: string;
  customerName: string;
  description: string;
  obligationType: string;
  amount: number;
  dueDate: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  daysOverdue?: number;
}

export const CustomerLegalObligations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObligation, setSelectedObligation] = useState<CustomerObligation | null>(null);
  const [loading, setLoading] = useState(false);

  // Hardcoded customer obligations data
  const obligations: CustomerObligation[] = [
    {
      id: '1',
      customerId: '101',
      customerName: 'Ahmed Al-Farsi',
      description: 'Contract dispute resolution payment',
      obligationType: 'legal_settlement',
      amount: 15000,
      dueDate: new Date('2024-05-25'),
      urgency: 'high',
      status: 'pending',
      daysOverdue: 0
    },
    {
      id: '2',
      customerId: '102',
      customerName: 'Mohammed Al-Thani',
      description: 'Insurance claim documentation requirement',
      obligationType: 'document_submission',
      amount: 0,
      dueDate: new Date('2024-04-30'),
      urgency: 'medium',
      status: 'overdue',
      daysOverdue: 5
    },
    {
      id: '3',
      customerId: '103',
      customerName: 'Sara Al-Mansouri',
      description: 'Traffic violation fine payment',
      obligationType: 'fine_payment',
      amount: 3500,
      dueDate: new Date('2024-05-15'),
      urgency: 'medium',
      status: 'pending',
      daysOverdue: 0
    },
    {
      id: '4',
      customerId: '104',
      customerName: 'Khalid Al-Sulaiti',
      description: 'Late return fee settlement',
      obligationType: 'fee_settlement',
      amount: 5000,
      dueDate: new Date('2024-03-20'),
      urgency: 'low',
      status: 'completed',
      daysOverdue: 0
    },
    {
      id: '5',
      customerId: '105',
      customerName: 'Aisha Al-Emadi',
      description: 'Vehicle damage assessment hearing',
      obligationType: 'court_appearance',
      amount: 22500,
      dueDate: new Date('2024-06-22'),
      urgency: 'critical',
      status: 'pending',
      daysOverdue: 0
    }
  ];

  // Filter obligations based on search query
  const filteredObligations = useMemo(() => {
    return obligations.filter(
      (obligation) =>
        obligation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obligation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obligation.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleObligationClick = (obligation: CustomerObligation) => {
    setSelectedObligation(obligation);
  };

  const handleCloseObligation = () => {
    setSelectedObligation(null);
  };

  const getUrgencyBadge = (urgency: string) => {
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

  // Simulate loading for better UX
  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Card>
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

  return (
    <div className="space-y-6">
      {selectedObligation ? (
        <LegalCaseDetails obligation={selectedObligation} onClose={handleCloseObligation} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Customer Legal Obligations</CardTitle>
            <CardDescription>
              Manage and track customer legal obligations and requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search obligations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden md:table-cell">Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredObligations.length > 0 ? (
                    filteredObligations.map((obligation) => (
                      <TableRow 
                        key={obligation.id}
                        className="cursor-pointer"
                        onClick={() => handleObligationClick(obligation)}
                      >
                        <TableCell className="font-medium">{obligation.customerName}</TableCell>
                        <TableCell>{obligation.description}</TableCell>
                        <TableCell className="hidden md:table-cell">
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
                        <TableCell className="hidden md:table-cell">{formatDate(obligation.dueDate)}</TableCell>
                        <TableCell>{getUrgencyBadge(obligation.urgency)}</TableCell>
                        <TableCell>{getStatusBadge(obligation.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                          <p>No obligations match your search.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerLegalObligations;
