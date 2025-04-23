
import React, { useState, useMemo } from 'react';
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
import { Gavel, Plus, Search, MoreVertical, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import LegalCaseDetails from './LegalCaseDetails';
import { CustomerObligation } from './CustomerLegalObligations';
import { useLegalCases } from '@/hooks/use-legal-cases';
import { LegalCase } from '@/types/legal-case';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const LegalCaseManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CustomerObligation | null>(null);
  const navigate = useNavigate();
  
  // Fetch legal cases from Supabase
  const { cases, loading, error } = useLegalCases();
  
  // Filter cases based on search query
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    
    return cases.filter(
      (legalCase) =>
        (legalCase.customer_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (legalCase.status?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (legalCase.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (legalCase.case_number?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  }, [cases, searchQuery]);

  const handleCaseClick = (legalCase: LegalCase) => {
    // Convert the LegalCase to CustomerObligation format expected by LegalCaseDetails
    const obligation: CustomerObligation = {
      id: legalCase.id,
      customerId: legalCase.customer_id,
      customerName: legalCase.customer_name || 'Unknown Customer',
      description: legalCase.description || '',
      obligationType: 'legal_case',
      amount: legalCase.amount_claimed || 0,
      dueDate: legalCase.hearing_date ? new Date(legalCase.hearing_date) : new Date(legalCase.created_at),
      urgency: getUrgencyFromCaseType(legalCase.case_type),
      status: legalCase.status || 'pending',
      daysOverdue: calculateDaysOverdue(legalCase.created_at)
    };
    setSelectedCase(obligation);
  };

  const handleCloseCase = () => {
    setSelectedCase(null);
  };

  const handleCreateCase = () => {
    navigate('/legal/cases/new');
  };

  // Helper function to determine urgency based on case type
  const getUrgencyFromCaseType = (caseType: string): 'low' | 'medium' | 'high' | 'critical' => {
    if (!caseType) return 'medium';
    switch (caseType) {
      case 'contract_dispute':
        return 'high';
      case 'traffic_violation':
        return 'medium';
      case 'insurance_claim':
        return 'medium';
      case 'customer_complaint':
        return 'low';
      default:
        return 'medium';
    }
  };

  // Calculate days since case was created
  const calculateDaysOverdue = (createdAt: string): number => {
    const created = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Active</Badge>;
      case 'pending':
      case 'pending_reminder':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'closed':
      case 'settled':
        return <Badge className="bg-green-500 hover:bg-green-600">Closed</Badge>;
      case 'escalated':
      case 'in_legal_process':
        return <Badge variant="destructive">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>Loading legal case records...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading cases...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>An error occurred while loading legal cases</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry Loading
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              <Button className="w-full md:w-auto" onClick={handleCreateCase}>
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
                    <TableHead className="hidden md:table-cell">Case Number</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Priority</TableHead>
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
                        <TableCell className="font-medium">{legalCase.customer_name || "Unknown"}</TableCell>
                        <TableCell className="hidden md:table-cell">{legalCase.case_number || `CASE-${legalCase.id.slice(0, 6)}`}</TableCell>
                        <TableCell className="hidden md:table-cell">{legalCase.description || "No description"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {typeof legalCase.amount_claimed === 'number' ? 
                            legalCase.amount_claimed.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'QAR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }) : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {legalCase.hearing_date ? formatDate(new Date(legalCase.hearing_date)) : formatDate(new Date(legalCase.created_at))}
                        </TableCell>
                        <TableCell>{getUrgencyBadge(getUrgencyFromCaseType(legalCase.case_type))}</TableCell>
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
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center p-4">
                          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                          <p className="text-lg font-medium">No legal cases found</p>
                          <p className="text-muted-foreground mb-4">Get started by creating your first case</p>
                          <Button onClick={handleCreateCase}>
                            <Plus className="mr-2 h-4 w-4" /> New Case
                          </Button>
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

export default LegalCaseManagement;
