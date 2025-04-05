
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gavel, Plus, Search, MoreVertical, FileText, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import LegalCaseDetails from './LegalCaseDetails';
import { CustomerObligation } from './CustomerLegalObligations';
import { useMemo } from 'react';

const MOCK_CASES = [
  {
    id: '1',
    customerId: 'cust-1',
    customerName: 'Ahmed Al-Mansour',
    description: 'Overdue payments (Agreement #AGR-202402-1234)',
    obligationType: 'payment',
    amount: 12000,
    dueDate: new Date(2023, 11, 15),
    urgency: 'high',
    status: 'Overdue Payment',
    daysOverdue: 28,
    agreementId: 'agr-1',
    agreementNumber: 'AGR-202402-1234'
  },
  {
    id: '2',
    customerId: 'cust-2',
    customerName: 'Fatima Al-Qasimi',
    description: 'Unpaid traffic fine (Agreement #AGR-202401-5678)',
    obligationType: 'traffic_fine',
    amount: 3500,
    dueDate: new Date(2024, 0, 5),
    urgency: 'medium',
    status: 'Unpaid Fine',
    daysOverdue: 15,
    agreementId: 'agr-2',
    agreementNumber: 'AGR-202401-5678'
  },
  {
    id: '3',
    customerId: 'cust-3',
    customerName: 'Mohamed Al-Farsi',
    description: 'Legal case (in legal process)',
    obligationType: 'legal_case',
    amount: 25000,
    dueDate: new Date(2023, 10, 20),
    urgency: 'critical',
    status: 'Legal Case',
    daysOverdue: 60,
    agreementId: 'agr-3',
    agreementNumber: 'AGR-202311-9012'
  }
];

const LegalCaseManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CustomerObligation | null>(null);
  
  const filteredCases = useMemo(() => {
    return MOCK_CASES.filter(
      (legalCase) =>
        legalCase.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        legalCase.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        legalCase.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (legalCase.agreementNumber && legalCase.agreementNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const handleCaseClick = (legalCase: any) => {
    setSelectedCase(legalCase);
  };

  const handleCloseCase = () => {
    setSelectedCase(null);
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
    if (status.includes('Overdue')) {
      return <Badge variant="destructive">{status}</Badge>;
    } else if (status.includes('Unpaid')) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">{status}</Badge>;
    } else if (status.includes('Legal Case')) {
      return <Badge className="bg-purple-500 hover:bg-purple-600">{status}</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {selectedCase ? (
        <LegalCaseDetails obligation={selectedCase} onClose={handleCloseCase} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Legal Cases</CardTitle>
                <CardDescription>
                  Manage and track legal cases and obligations
                </CardDescription>
              </div>
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> New Case
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases..."
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
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.length > 0 ? (
                    filteredCases.map((legalCase) => (
                      <TableRow 
                        key={legalCase.id}
                        className="cursor-pointer"
                        onClick={() => handleCaseClick(legalCase)}
                      >
                        <TableCell className="font-medium">{legalCase.customerName}</TableCell>
                        <TableCell className="hidden md:table-cell">{legalCase.description}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {typeof legalCase.amount === 'number' ? 
                            legalCase.amount.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'QAR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }) : 
                            legalCase.amount
                          }
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(legalCase.dueDate)}</TableCell>
                        <TableCell>{getUrgencyBadge(legalCase.urgency)}</TableCell>
                        <TableCell>{getStatusBadge(legalCase.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCaseClick(legalCase);
                                }}
                              >
                                <Gavel className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <FileText className="mr-2 h-4 w-4" /> View Documents
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <AlertTriangle className="mr-2 h-4 w-4" /> Mark as Urgent
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No cases found.
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

export default LegalCaseManagement;
