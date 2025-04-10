
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
import { Gavel, Plus, Search, MoreVertical, FileText, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLegalCases } from '@/hooks/use-legal';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';

const LegalCases = () => {
  const navigate = useNavigate();
  const { cases, loading, error } = useLegalCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  // Filter cases based on search query
  const filteredCases = cases.filter(
    (legalCase) =>
      legalCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      legalCase.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      legalCase.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (legalCase.customer_name && legalCase.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pending_reminder':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'active':
        return <Badge className="bg-blue-500 text-white">Active</Badge>;
      case 'closed':
        return <Badge className="bg-green-500 text-white">Closed</Badge>;
      case 'settled':
        return <Badge className="bg-indigo-500 text-white">Settled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string = 'medium') => {
    switch (priority.toLowerCase()) {
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

  const handleViewDetails = (caseId: string) => {
    // For now, we'll just set selected case, but in future could navigate to detail page
    setSelectedCase(caseId === selectedCase ? null : caseId);
  };

  const handleNewCase = () => {
    navigate('/legal/cases/new');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>Manage and track legal cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading legal cases...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !cases.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>Manage and track legal cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-destructive font-medium">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Legal Cases</CardTitle>
            <CardDescription>
              Manage and track legal cases
            </CardDescription>
          </div>
          <Button className="w-full md:w-auto" onClick={handleNewCase}>
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
                <TableHead>Case Number</TableHead>
                <TableHead className="hidden md:table-cell">Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.length > 0 ? (
                filteredCases.map((legalCase) => (
                  <React.Fragment key={legalCase.id}>
                    <TableRow 
                      className="cursor-pointer"
                      onClick={() => handleViewDetails(legalCase.id)}
                    >
                      <TableCell className="font-medium">{legalCase.case_number}</TableCell>
                      <TableCell className="hidden md:table-cell">{legalCase.title}</TableCell>
                      <TableCell>{legalCase.customer_name || 'Unknown'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatCurrency(legalCase.amount_owed)}
                      </TableCell>
                      <TableCell>{getPriorityBadge(legalCase.priority)}</TableCell>
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
                                handleViewDetails(legalCase.id);
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
                    {selectedCase === legalCase.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/50 px-4 py-3">
                          <div className="space-y-2">
                            <h3 className="font-medium">Case Details</h3>
                            <p><span className="font-medium">Description:</span> {legalCase.description}</p>
                            <p><span className="font-medium">Case Type:</span> {legalCase.case_type}</p>
                            {legalCase.hearing_date && (
                              <p><span className="font-medium">Hearing Date:</span> {formatDate(new Date(legalCase.hearing_date))}</p>
                            )}
                            <p><span className="font-medium">Created:</span> {formatDate(new Date(legalCase.created_at))}</p>
                            <div className="flex justify-end pt-2">
                              <Button variant="outline" size="sm" className="mr-2">
                                Edit Case
                              </Button>
                              <Button size="sm">
                                Manage Documents
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
  );
};

export default LegalCases;
