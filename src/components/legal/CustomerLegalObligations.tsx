
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jsPDF } from 'jspdf';
import { 
  Search, 
  FileDown, 
  MoreVertical, 
  FileText, 
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDownUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateLegalCustomerReport } from '@/utils/legalReportUtils';

// Types
type ObligationType = 'payment' | 'traffic_fine' | 'legal_case';
type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

interface CustomerObligation {
  id: string;
  customerId: string;
  customerName: string;
  obligationType: ObligationType;
  amount: number;
  dueDate: Date;
  description: string;
  urgency: UrgencyLevel;
  status: string;
  daysOverdue: number;
}

// Helper function to determine urgency
const determineUrgency = (daysOverdue: number): UrgencyLevel => {
  if (daysOverdue <= 0) return 'low';
  if (daysOverdue <= 15) return 'medium';
  if (daysOverdue <= 30) return 'high';
  return 'critical';
};

// Urgency badge styling
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

const CustomerLegalObligations: React.FC = () => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [filteredObligations, setFilteredObligations] = useState<CustomerObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('urgency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch data
  useEffect(() => {
    const fetchObligations = async () => {
      setLoading(true);
      
      try {
        // Fetch overdue payments
        const { data: overduePayments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select(`
            id,
            lease_id,
            amount,
            amount_paid,
            balance,
            payment_date,
            days_overdue,
            leases!inner(customer_id, agreement_number),
            profiles!inner(id, full_name)
          `)
          .eq('status', 'pending')
          .gt('days_overdue', 0)
          .order('days_overdue', { ascending: false });
          
        if (paymentsError) {
          console.error('Error fetching overdue payments:', paymentsError);
          toast.error('Failed to load overdue payments');
        }
        
        // Fetch traffic fines
        const { data: trafficFines, error: finesError } = await supabase
          .from('traffic_fines')
          .select(`
            id,
            fine_amount,
            violation_date,
            lease_id,
            leases!inner(customer_id, agreement_number),
            profiles!inner(id, full_name)
          `)
          .eq('payment_status', 'pending')
          .order('violation_date', { ascending: false });
          
        if (finesError) {
          console.error('Error fetching traffic fines:', finesError);
          toast.error('Failed to load traffic fines');
        }
        
        // Fetch legal cases
        const { data: legalCases, error: casesError } = await supabase
          .from('legal_cases')
          .select(`
            id,
            amount_owed,
            created_at,
            customer_id,
            priority,
            status,
            profiles!inner(id, full_name)
          `)
          .in('status', ['pending_reminder', 'pending_payment', 'pending_legal_action'])
          .order('created_at', { ascending: false });
          
        if (casesError) {
          console.error('Error fetching legal cases:', casesError);
          toast.error('Failed to load legal cases');
        }
        
        // Format and combine all obligations
        const allObligations: CustomerObligation[] = [];
        
        // Process overdue payments
        if (overduePayments) {
          const processedPayments = overduePayments.map(payment => {
            const daysOverdue = payment.days_overdue || 0;
            return {
              id: payment.id,
              customerId: payment.profiles.id,
              customerName: payment.profiles.full_name,
              obligationType: 'payment' as ObligationType,
              amount: payment.balance || 0,
              dueDate: new Date(payment.payment_date),
              description: `Overdue rent payment (Agreement #${payment.leases.agreement_number})`,
              urgency: determineUrgency(daysOverdue),
              status: 'Overdue Payment',
              daysOverdue
            };
          });
          allObligations.push(...processedPayments);
        }
        
        // Process traffic fines
        if (trafficFines) {
          const processedFines = trafficFines.map(fine => {
            const violationDate = new Date(fine.violation_date);
            const today = new Date();
            const daysOverdue = Math.floor((today.getTime() - violationDate.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
              id: fine.id,
              customerId: fine.profiles.id,
              customerName: fine.profiles.full_name,
              obligationType: 'traffic_fine' as ObligationType,
              amount: fine.fine_amount || 0,
              dueDate: violationDate,
              description: `Unpaid traffic fine (Agreement #${fine.leases.agreement_number})`,
              urgency: determineUrgency(daysOverdue),
              status: 'Unpaid Fine',
              daysOverdue
            };
          });
          allObligations.push(...processedFines);
        }
        
        // Process legal cases
        if (legalCases) {
          const processedCases = legalCases.map(legalCase => {
            const createdDate = new Date(legalCase.created_at);
            const today = new Date();
            const daysOverdue = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Map priority to urgency
            let urgency: UrgencyLevel = 'medium';
            if (legalCase.priority === 'high') urgency = 'high';
            if (legalCase.priority === 'urgent') urgency = 'critical';
            if (legalCase.priority === 'low') urgency = 'low';
            
            return {
              id: legalCase.id,
              customerId: legalCase.customer_id,
              customerName: legalCase.profiles.full_name,
              obligationType: 'legal_case' as ObligationType,
              amount: legalCase.amount_owed || 0,
              dueDate: createdDate,
              description: `Legal case (${legalCase.status.replace(/_/g, ' ')})`,
              urgency,
              status: 'Legal Case',
              daysOverdue
            };
          });
          allObligations.push(...processedCases);
        }
        
        setObligations(allObligations);
        setFilteredObligations(allObligations);
      } catch (error) {
        console.error('Error fetching obligations:', error);
        toast.error('Failed to load customer obligations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchObligations();
  }, []);
  
  // Apply filters and sorting
  useEffect(() => {
    let result = [...obligations];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(obligation => 
        obligation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obligation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obligation.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply urgency filter
    if (urgencyFilter !== 'all') {
      result = result.filter(obligation => obligation.urgency === urgencyFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(obligation => obligation.obligationType === typeFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'customer':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case 'dueDate':
          comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
        case 'daysOverdue':
          comparison = a.daysOverdue - b.daysOverdue;
          break;
        case 'urgency':
          const urgencyOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          comparison = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredObligations(result);
  }, [obligations, searchQuery, urgencyFilter, typeFilter, sortBy, sortOrder]);
  
  // Generate and download report for a customer
  const handleGenerateReport = async (customerId: string, customerName: string) => {
    try {
      // Get all obligations for this customer
      const customerObligations = obligations.filter(o => o.customerId === customerId);
      
      if (customerObligations.length === 0) {
        toast.error('No obligations found for this customer');
        return;
      }
      
      // Generate the PDF report
      const pdf = await generateLegalCustomerReport(customerId, customerName, customerObligations);
      
      // Save the PDF
      pdf.save(`${customerName.replace(/\s+/g, '_')}_Legal_Report.pdf`);
      
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate customer report');
    }
  };
  
  // Toggle sort order
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc'); // Default to descending
    }
  };
  
  // Group obligations by customer for the customer list view
  const customerSummary = React.useMemo(() => {
    const summary: Record<string, {
      customerId: string;
      customerName: string;
      totalAmount: number;
      highestUrgency: UrgencyLevel;
      obligationCount: number;
    }> = {};
    
    filteredObligations.forEach(obligation => {
      if (!summary[obligation.customerId]) {
        summary[obligation.customerId] = {
          customerId: obligation.customerId,
          customerName: obligation.customerName,
          totalAmount: 0,
          highestUrgency: 'low',
          obligationCount: 0
        };
      }
      
      // Update totals
      summary[obligation.customerId].totalAmount += obligation.amount;
      summary[obligation.customerId].obligationCount += 1;
      
      // Set highest urgency
      const urgencyOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      if (urgencyOrder[obligation.urgency] > urgencyOrder[summary[obligation.customerId].highestUrgency]) {
        summary[obligation.customerId].highestUrgency = obligation.urgency;
      }
    });
    
    return Object.values(summary);
  }, [filteredObligations]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Customer Legal Obligations</CardTitle>
        <CardDescription>
          Manage customers with pending payments, fines, or legal cases
        </CardDescription>
        
        {/* Filter and sort controls */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer or description..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="traffic_fine">Traffic Fines</SelectItem>
              <SelectItem value="legal_case">Legal Cases</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgencies</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading customer obligations...</div>
        ) : customerSummary.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('customer')}>
                    <div className="flex items-center">
                      Customer
                      {sortBy === 'customer' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-1 h-4 w-4" /> : <ArrowDownAZ className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                    <div className="flex items-center">
                      Total Amount Due
                      {sortBy === 'amount' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-1 h-4 w-4" /> : <ArrowDownAZ className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Issues Count</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('urgency')}>
                    <div className="flex items-center">
                      Highest Urgency
                      {sortBy === 'urgency' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-1 h-4 w-4" /> : <ArrowDownAZ className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerSummary.map((summary) => (
                  <TableRow key={summary.customerId}>
                    <TableCell className="font-medium">
                      {summary.customerName}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'QAR' }).format(summary.totalAmount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {summary.obligationCount}
                    </TableCell>
                    <TableCell>
                      {getUrgencyBadge(summary.highestUrgency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleGenerateReport(summary.customerId, summary.customerName)}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No customer obligations found with the current filters.
          </div>
        )}
        
        {/* Detailed list of all obligations */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">All Obligations</h3>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden lg:table-cell cursor-pointer" onClick={() => handleSort('dueDate')}>
                    <div className="flex items-center">
                      Due Date
                      {sortBy === 'dueDate' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-1 h-4 w-4" /> : <ArrowDownAZ className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort('daysOverdue')}>
                    <div className="flex items-center">
                      Days Overdue
                      {sortBy === 'daysOverdue' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-1 h-4 w-4" /> : <ArrowDownAZ className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end">
                      Amount
                      {sortBy === 'amount' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-1 h-4 w-4" /> : <ArrowDownAZ className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort('urgency')}>
                    <div className="flex items-center">
                      Urgency
                      {sortBy === 'urgency' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-1 h-4 w-4" /> : <ArrowDownAZ className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredObligations.length > 0 ? (
                  filteredObligations.map((obligation) => (
                    <TableRow key={`${obligation.id}-${obligation.obligationType}`}>
                      <TableCell className="font-medium">
                        {obligation.customerName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {obligation.obligationType === 'payment' && (
                            <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                          )}
                          {obligation.obligationType === 'traffic_fine' && (
                            <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                          )}
                          {obligation.obligationType === 'legal_case' && (
                            <FileText className="mr-2 h-4 w-4 text-blue-500" />
                          )}
                          {obligation.description}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {obligation.dueDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {obligation.daysOverdue}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'QAR' }).format(obligation.amount)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getUrgencyBadge(obligation.urgency)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No obligations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerLegalObligations;
