
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
import { 
  Search, 
  FileDown, 
  MoreVertical, 
  FileText, 
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDownUp,
  AlertCircle,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { generateLegalCustomerReport } from '@/utils/legalReportUtils';
import { fetchLegalObligations, determineUrgency } from './LegalObligationsService';

// Types
export type ObligationType = 'payment' | 'traffic_fine' | 'legal_case';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CustomerObligation {
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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('urgency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [retryCount, setRetryCount] = useState(0);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Fetch data with retries
  const fetchObligations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching obligations (attempt ${retryCount + 1})...`);
      const { obligations: fetchedObligations, error: fetchError } = await fetchLegalObligations();
      
      if (fetchError) {
        console.error('Error in fetchLegalObligations:', fetchError);
        setError(fetchError);
        toast.error(fetchError);
      } else {
        setObligations(fetchedObligations);
        setFilteredObligations(fetchedObligations);
        
        // Show message if no data found
        if (fetchedObligations.length === 0) {
          console.log('No legal obligations found in the database');
        } else {
          console.log(`Successfully loaded ${fetchedObligations.length} obligations`);
        }
      }
    } catch (error) {
      console.error('Error fetching obligations:', error);
      setError('Failed to load customer obligations. Please try again.');
      toast.error('Failed to load customer obligations');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch with retry logic
  useEffect(() => {
    fetchObligations();
    
    // Set up automatic retry if needed (max 3 retries with increasing delay)
    const retryTimeouts = [3000, 6000, 10000]; // 3, 6, 10 seconds
    
    if (retryCount < 3) {
      const timeoutId = setTimeout(() => {
        if (loading || error) {
          console.log(`Auto-retrying... Attempt ${retryCount + 1}`);
          setRetryCount(prev => prev + 1);
          fetchObligations();
        }
      }, retryTimeouts[retryCount]);
      
      return () => clearTimeout(timeoutId);
    }
  }, [retryCount]);
  
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
  
  // Force refresh with loading state
  const handleRefresh = () => {
    setRetryCount(0);
    fetchObligations();
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
          
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            className="md:w-auto"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8 space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>Loading customer obligations...</p>
            <p className="text-xs text-muted-foreground">
              This may take a moment as we're fetching data from multiple sources.
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8 flex flex-col items-center gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="text-destructive font-medium">{error}</div>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        ) : filteredObligations.length === 0 ? (
          <div className="text-center py-12 border rounded-md flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div className="text-muted-foreground">
              <p className="font-medium text-lg">No obligations found</p>
              <p className="text-sm max-w-md mx-auto mt-1">
                This could mean there are no pending legal obligations in the system, 
                or there might be a connection issue with the database.
              </p>
            </div>
            <Button onClick={handleRefresh} className="mt-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        ) : customerSummary.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Customer Summary</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDetails(!showDetails)}
                className="ml-auto"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            
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
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No customer obligations found with the current filters.
          </div>
        )}
        
        {/* Detailed list of all obligations */}
        {showDetails && filteredObligations.length > 0 && (
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
                  {filteredObligations.map((obligation) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerLegalObligations;
