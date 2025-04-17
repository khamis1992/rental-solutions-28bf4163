import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Calendar, FileText, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { CustomerObligation } from './CustomerLegalObligations.types';

interface LegalCase {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
  agreement_id?: string;
  case_number: string;
  case_type: string;
  assigned_to?: string;
  due_date?: string;
  resolution?: string;
  documents?: string[];
  notes?: string;
}

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
}

interface Agreement {
  id: string;
  agreement_number: string;
  customer_id: string;
  status: string;
}

const LegalCaseManagement: React.FC = () => {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isAddCaseDialogOpen, setIsAddCaseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [newCase, setNewCase] = useState<Partial<LegalCase>>({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    case_type: 'dispute',
  });
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch legal cases
        const { data: casesData, error: casesError } = await supabase
          .from('legal_cases')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (casesError) throw casesError;
        setCases(casesData || []);
        
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, full_name, email, phone_number');
          
        if (customersError) throw customersError;
        setCustomers(customersData || []);
        
        // Fetch agreements
        const { data: agreementsData, error: agreementsError } = await supabase
          .from('leases')
          .select('id, agreement_number, customer_id, status');
          
        if (agreementsError) throw agreementsError;
        setAgreements(agreementsData || []);
        
        // Fetch customer obligations
        const { data: obligationsData, error: obligationsError } = await supabase
          .from('customer_obligations')
          .select('*')
          .eq('obligationType', 'legal')
          .order('dueDate', { ascending: true });
          
        if (obligationsError) throw obligationsError;
        setObligations(obligationsData || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load legal cases');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const filteredCases = cases.filter(legalCase => {
    const matchesSearch = 
      legalCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      legalCase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      legalCase.case_number.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter ? legalCase.status === statusFilter : true;
    const matchesPriority = priorityFilter ? legalCase.priority === priorityFilter : true;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
  
  const handleAddCase = async () => {
    try {
      // Generate a case number
      const caseNumber = `LC-${Date.now().toString().slice(-6)}`;
      
      const { data, error } = await supabase
        .from('legal_cases')
        .insert([{
          ...newCase,
          case_number: caseNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
        
      if (error) throw error;
      
      setCases([...(data || []), ...cases]);
      setIsAddCaseDialogOpen(false);
      setNewCase({
        title: '',
        description: '',
        status: 'open',
        priority: 'medium',
        case_type: 'dispute',
      });
      
      toast.success('Legal case created successfully');
    } catch (error) {
      console.error('Error adding case:', error);
      toast.error('Failed to create legal case');
    }
  };
  
  const handleDeleteCase = async () => {
    if (!selectedCase) return;
    
    try {
      const { error } = await supabase
        .from('legal_cases')
        .delete()
        .eq('id', selectedCase.id);
        
      if (error) throw error;
      
      setCases(cases.filter(c => c.id !== selectedCase.id));
      setIsDeleteDialogOpen(false);
      setSelectedCase(null);
      
      toast.success('Legal case deleted successfully');
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('Failed to delete legal case');
    }
  };
  
  const handleViewCase = (caseId: string) => {
    navigate(`/legal/cases/${caseId}`);
  };
  
  const getCustomerName = (customerId?: string) => {
    if (!customerId) return 'N/A';
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.full_name : 'Unknown Customer';
  };
  
  const getAgreementNumber = (agreementId?: string) => {
    if (!agreementId) return 'N/A';
    const agreement = agreements.find(a => a.id === agreementId);
    return agreement ? agreement.agreement_number : 'Unknown Agreement';
  };
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <Badge variant="outline">Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'closed':
        return <Badge>Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'high':
        return <Badge variant="warning">High</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Legal Case Management</h1>
        <Button onClick={() => setIsAddCaseDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>
      
      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">All Cases</TabsTrigger>
          <TabsTrigger value="obligations">Legal Obligations</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Legal Cases</CardTitle>
              <CardDescription>
                Manage and track all legal cases related to customers and agreements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredCases.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case #</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Agreement</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.map((legalCase) => (
                        <TableRow key={legalCase.id}>
                          <TableCell>{legalCase.case_number}</TableCell>
                          <TableCell className="font-medium">{legalCase.title}</TableCell>
                          <TableCell>{getCustomerName(legalCase.customer_id)}</TableCell>
                          <TableCell>{getAgreementNumber(legalCase.agreement_id)}</TableCell>
                          <TableCell>{getStatusBadge(legalCase.status)}</TableCell>
                          <TableCell>{getPriorityBadge(legalCase.priority)}</TableCell>
                          <TableCell>{format(new Date(legalCase.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewCase(legalCase.id)}
                              >
                                View
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedCase(legalCase);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold">No Cases Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter || priorityFilter
                      ? "No cases match your search criteria."
                      : "No legal cases have been created yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="obligations" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Legal Obligations</CardTitle>
              <CardDescription>
                Track legal obligations, deadlines, and requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {obligations.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {obligations.map((obligation) => (
                        <TableRow key={obligation.id}>
                          <TableCell className="font-medium">{obligation.title}</TableCell>
                          <TableCell>{obligation.description}</TableCell>
                          <TableCell>
                            {obligation.dueDate 
                              ? format(new Date(obligation.dueDate), 'MMM d, yyyy') 
                              : 'No deadline'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={obligation.status === 'completed' ? 'success' : 'outline'}>
                              {obligation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                obligation.urgency === 'critical' ? 'destructive' :
                                obligation.urgency === 'high' ? 'warning' :
                                obligation.urgency === 'medium' ? 'secondary' : 'outline'
                              }
                            >
                              {obligation.urgency}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
                  <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold">No Legal Obligations</h3>
                  <p className="text-muted-foreground">
                    No legal obligations have been created yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Legal Calendar</CardTitle>
              <CardDescription>
                View upcoming legal deadlines, court dates, and important events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
                <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold">Calendar View</h3>
                <p className="text-muted-foreground">
                  Calendar integration coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Case Dialog */}
      <Dialog open={isAddCaseDialogOpen} onOpenChange={setIsAddCaseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Legal Case</DialogTitle>
            <DialogDescription>
              Enter the details for the new legal case.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newCase.title}
                onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newCase.description}
                onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">
                Customer
              </Label>
              <Select 
                value={newCase.customer_id} 
                onValueChange={(value) => setNewCase({ ...newCase, customer_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agreement" className="text-right">
                Agreement
              </Label>
              <Select 
                value={newCase.agreement_id} 
                onValueChange={(value) => setNewCase({ ...newCase, agreement_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an agreement" />
                </SelectTrigger>
                <SelectContent>
                  {agreements
                    .filter(a => !newCase.customer_id || a.customer_id === newCase.customer_id)
                    .map((agreement) => (
                      <SelectItem key={agreement.id} value={agreement.id}>
                        {agreement.agreement_number}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="case_type" className="text-right">
                Case Type
              </Label>
              <Select 
                value={newCase.case_type} 
                onValueChange={(value) => setNewCase({ ...newCase, case_type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dispute">Dispute</SelectItem>
                  <SelectItem value="collection">Collection</SelectItem>
                  <SelectItem value="damage">Damage Claim</SelectItem>
                  <SelectItem value="contract">Contract Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select 
                value={newCase.status} 
                onValueChange={(value) => setNewCase({ ...newCase, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select 
                value={newCase.priority} 
                onValueChange={(value) => setNewCase({ ...newCase, priority: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due_date" className="text-right">
                Due Date
              </Label>
              <div className="col-span-3">
                <DatePicker
                  date={newCase.due_date ? new Date(newCase.due_date) : undefined}
                  setDate={(date) => setNewCase({ 
                    ...newCase, 
                    due_date: date ? date.toISOString() : undefined 
                  })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assigned_to" className="text-right">
                Assigned To
              </Label>
              <Input
                id="assigned_to"
                value={newCase.assigned_to || ''}
                onChange={(e) => setNewCase({ ...newCase, assigned_to: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCase}>Create Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this legal case? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCase}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LegalCaseManagement;
