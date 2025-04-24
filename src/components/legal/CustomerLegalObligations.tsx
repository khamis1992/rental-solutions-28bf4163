
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date-utils';
import LegalCaseDetails from './LegalCaseDetails';
import { Search, AlertTriangle, Loader2, Plus, Filter, FileText, CalendarDays } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';

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
  daysOverdue: number;
}

// Mock data for demonstration
const mockObligations: CustomerObligation[] = [
  {
    id: "ob-1",
    customerId: "cust-1",
    customerName: "Ahmed Al-Mansoori",
    description: "Monthly vehicle lease payment",
    obligationType: "payment",
    amount: 2500,
    dueDate: new Date(2024, 3, 15),
    urgency: "high",
    status: "overdue",
    daysOverdue: 12
  },
  {
    id: "ob-2",
    customerId: "cust-2",
    customerName: "Fatima Al-Qasimi",
    description: "Insurance documentation submission",
    obligationType: "document",
    amount: 0,
    dueDate: new Date(2024, 3, 25),
    urgency: "medium",
    status: "pending",
    daysOverdue: 0
  },
  {
    id: "ob-3",
    customerId: "cust-3",
    customerName: "Mohammed Al-Hashimi",
    description: "Contract renewal signature",
    obligationType: "contract",
    amount: 0,
    dueDate: new Date(2024, 3, 20),
    urgency: "critical",
    status: "overdue",
    daysOverdue: 7
  },
  {
    id: "ob-4",
    customerId: "cust-4",
    customerName: "Layla Al-Farsi",
    description: "Vehicle maintenance check",
    obligationType: "service",
    amount: 450,
    dueDate: new Date(2024, 4, 5),
    urgency: "low",
    status: "pending",
    daysOverdue: 0
  },
  {
    id: "ob-5",
    customerId: "cust-1",
    customerName: "Ahmed Al-Mansoori",
    description: "Late fee payment",
    obligationType: "payment",
    amount: 250,
    dueDate: new Date(2024, 3, 18),
    urgency: "high",
    status: "overdue",
    daysOverdue: 9
  }
];

export const CustomerLegalObligations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObligation, setSelectedObligation] = useState<CustomerObligation | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // This could be replaced with actual data from a hook
  const obligations: CustomerObligation[] = mockObligations;

  // Filter obligations based on search query, status filter, and type filter
  const filteredObligations = useMemo(() => {
    return obligations.filter(
      (obligation) => {
        const matchesSearch = obligation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          obligation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          obligation.status.toLowerCase().includes(searchQuery.toLowerCase());
          
        const matchesStatus = filterStatus === null || obligation.status.toLowerCase() === filterStatus.toLowerCase();
        const matchesType = filterType === null || obligation.obligationType === filterType;
        const matchesTab = activeTab === 'all' || 
                         (activeTab === 'overdue' && obligation.status === 'overdue') ||
                         (activeTab === 'urgent' && (obligation.urgency === 'high' || obligation.urgency === 'critical')) ||
                         (activeTab === 'pending' && obligation.status === 'pending');
        
        return matchesSearch && matchesStatus && matchesType && matchesTab;
      }
    );
  }, [searchQuery, obligations, filterStatus, filterType, activeTab]);

  const handleObligationClick = (obligation: CustomerObligation) => {
    setSelectedObligation(obligation);
  };

  const handleCloseObligation = () => {
    setSelectedObligation(null);
  };

  const handleStatusFilterChange = (status: string | null) => {
    setFilterStatus(status);
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

  // Get obligation type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Payment</Badge>;
      case 'document':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">Document</Badge>;
      case 'contract':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">Contract</Badge>;
      case 'service':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">Service</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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

  // Calculate statistics
  const overdueObligations = obligations.filter(o => o.status === 'overdue').length;
  const pendingObligations = obligations.filter(o => o.status === 'pending').length;
  const urgentObligations = obligations.filter(o => o.urgency === 'high' || o.urgency === 'critical').length;
  const totalAmount = obligations
    .filter(o => o.status === 'overdue' && o.obligationType === 'payment')
    .reduce((sum, o) => sum + o.amount, 0);

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

  return (
    <div className="space-y-6">
      {selectedObligation ? (
        <LegalCaseDetails obligation={selectedObligation} onClose={handleCloseObligation} />
      ) : (
        <>
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-destructive">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Overdue Obligations</p>
                <h3 className="text-2xl font-bold text-destructive">{overdueObligations}</h3>
                <Separator className="my-2" />
                <Button variant="link" className="p-0 h-auto text-xs text-destructive" onClick={() => setActiveTab('overdue')}>
                  View overdue items →
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Urgent Obligations</p>
                <h3 className="text-2xl font-bold text-orange-500">{urgentObligations}</h3>
                <Separator className="my-2" />
                <Button variant="link" className="p-0 h-auto text-xs text-orange-500" onClick={() => setActiveTab('urgent')}>
                  View urgent items →
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Obligations</p>
                <h3 className="text-2xl font-bold text-blue-500">{pendingObligations}</h3>
                <Separator className="my-2" />
                <Button variant="link" className="p-0 h-auto text-xs text-blue-500" onClick={() => setActiveTab('pending')}>
                  View pending items →
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Overdue Amount</p>
                <h3 className="text-2xl font-bold text-green-700">
                  {totalAmount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'QAR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </h3>
                <Separator className="my-2" />
                <Button variant="link" className="p-0 h-auto text-xs text-green-700">
                  View payment details →
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Customer Legal Obligations</CardTitle>
                  <CardDescription>
                    Manage and track customer legal obligations and requirements
                  </CardDescription>
                </div>
                <Button className="w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> New Obligation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="overdue" className="text-red-500 data-[state=active]:text-white data-[state=active]:bg-red-500">
                    Overdue
                  </TabsTrigger>
                  <TabsTrigger value="urgent" className="text-orange-500 data-[state=active]:text-white data-[state=active]:bg-orange-500">
                    Urgent
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-blue-500 data-[state=active]:text-white data-[state=active]:bg-blue-500">
                    Pending
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search obligations..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <Select value={filterType || ''} onValueChange={(value) => setFilterType(value || null)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="icon" onClick={() => {
                    setFilterType(null);
                    setFilterStatus(null);
                    setSearchQuery('');
                    setActiveTab('all');
                  }}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
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
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{obligation.description}</span>
                              <span className="text-xs text-muted-foreground md:hidden">
                                Due: {formatDate(obligation.dueDate)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {getTypeIcon(obligation.obligationType)}
                          </TableCell>
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
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center">
                              <CalendarDays className="mr-1 h-3 w-3 text-muted-foreground" />
                              {formatDate(obligation.dueDate)}
                              {obligation.daysOverdue > 0 && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  {obligation.daysOverdue} days
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getUrgencyBadge(obligation.urgency)}</TableCell>
                          <TableCell>{getStatusBadge(obligation.status)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center p-4">
                            <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                            <p className="text-lg font-medium">No customer obligations found</p>
                            <p className="text-muted-foreground mb-4">Start by creating a new customer obligation</p>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" /> New Obligation
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredObligations.length} of {obligations.length} obligations
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" /> Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2" /> Send Reminders
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CustomerLegalObligations;
