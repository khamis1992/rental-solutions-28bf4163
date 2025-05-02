
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertTriangle, 
  Car, 
  CheckCircle, 
  MoreVertical, 
  Plus, 
  Search, 
  X,
  UserCheck,
  DollarSign,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/stat-card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'; 

interface TrafficFinesListProps {
  isAutoAssigning?: boolean;
}

interface AssignmentResult {
  id: string;
  licensePlate?: string;
  success: boolean;
  error?: string;
  message?: string;
}

const TrafficFinesList = ({ isAutoAssigning = false }: TrafficFinesListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { trafficFines, isLoading, payTrafficFine, disputeTrafficFine, assignToCustomer, cleanupInvalidAssignments } = useTrafficFines();
  const [assigningFines, setAssigningFines] = useState(false);
  const [assignmentResults, setAssignmentResults] = useState<AssignmentResult[]>([]);
  const [showAssignmentResults, setShowAssignmentResults] = useState(false);
  const [showInvalidAssignments, setShowInvalidAssignments] = useState(false);
  
  const filteredFines = trafficFines ? trafficFines.filter(fine => 
    ((fine.violationNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.licensePlate?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.violationCharge?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
  ) : [];

  // Check for invalid date ranges in fine assignments
  const invalidAssignments = filteredFines.filter(fine => {
    if (!fine.leaseId || !fine.leaseStartDate || !fine.violationDate) return false;
    
    const violationDate = new Date(fine.violationDate);
    const leaseStartDate = new Date(fine.leaseStartDate);
    const leaseEndDate = fine.leaseEndDate ? new Date(fine.leaseEndDate) : new Date();
    
    return violationDate < leaseStartDate || violationDate > leaseEndDate;
  });
  
  const hasInvalidAssignments = invalidAssignments.length > 0;

  const assignedFines = filteredFines.filter(fine => fine.customerId);
  const unassignedFines = filteredFines.filter(fine => !fine.customerId);
  
  const assignedFinesAmount = assignedFines.reduce((total, fine) => total + fine.fineAmount, 0);
  const unassignedFinesAmount = unassignedFines.reduce((total, fine) => total + fine.fineAmount, 0);

  const handlePayFine = (id: string) => {
    payTrafficFine.mutate({ id });
  };

  const handleDisputeFine = (id: string) => {
    disputeTrafficFine.mutate({ id });
  };

  const handleAutoAssignFines = async () => {
    try {
      setAssigningFines(true);
      setAssignmentResults([]);
      setShowAssignmentResults(false);
      
      toast.info("Auto-assigning fines", {
        description: "Please wait while fines are assigned to customers..."
      });

      let assignedCount = 0;
      let failedCount = 0;
      const pendingFines = filteredFines.filter(fine => !fine.customerId);
      const results: AssignmentResult[] = [];

      if (pendingFines.length === 0) {
        toast.info("No unassigned fines to process");
        setAssigningFines(false);
        return;
      }

      console.log(`Attempting to auto-assign ${pendingFines.length} fines`);

      for (const fine of pendingFines) {
        const result: AssignmentResult = {
          id: fine.id,
          licensePlate: fine.licensePlate,
          success: false
        };
        
        if (!fine.licensePlate) {
          result.error = 'Missing license plate';
          results.push(result);
          failedCount++;
          continue;
        }

        try {
          console.log(`Assigning fine ${fine.id} with license plate ${fine.licensePlate}`);
          await assignToCustomer.mutateAsync({ id: fine.id });
          result.success = true;
          result.message = 'Successfully assigned';
          assignedCount++;
        } catch (error) {
          console.error(`Failed to assign fine ${fine.id}:`, error);
          result.error = error instanceof Error ? error.message : String(error);
          failedCount++;
        }
        
        results.push(result);
      }

      // Store the results for detailed reporting
      setAssignmentResults(results);
      setShowAssignmentResults(true);

      if (assignedCount > 0) {
        toast.success(`Successfully assigned ${assignedCount} out of ${pendingFines.length} fines to customers`);
      } else {
        toast.warning("No fines could be assigned to customers");
      }

      if (failedCount > 0) {
        toast.error(`Failed to assign ${failedCount} fines`);
      }
    } catch (error: any) {
      console.error("Auto-assignment error:", error);
      toast.error("There was an error assigning fines to customers: " + (error.message || "Unknown error"));
    } finally {
      setAssigningFines(false);
    }
  };
  
  const handleFixInvalidAssignments = () => {
    cleanupInvalidAssignments.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white border-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
      case 'disputed':
        return <Badge className="bg-amber-500 text-white border-amber-600"><AlertTriangle className="mr-1 h-3 w-3" /> Disputed</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-red-500 text-white border-red-600"><X className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };

  const getCustomerAssignmentStatus = (fine: any) => {
    if (fine.customerId) {
      const isInvalidAssignment = fine.leaseId && fine.violationDate && fine.leaseStartDate && (
        new Date(fine.violationDate) < new Date(fine.leaseStartDate) || 
        (fine.leaseEndDate && new Date(fine.violationDate) > new Date(fine.leaseEndDate))
      );
      
      if (isInvalidAssignment) {
        return (
          <Badge className="bg-orange-500 text-white border-orange-600">
            <AlertTriangle className="mr-1 h-3 w-3" /> Invalid Assignment
          </Badge>
        );
      }
      
      return (
        <Badge className="bg-blue-500 text-white border-blue-600">
          <UserCheck className="mr-1 h-3 w-3" /> Assigned
        </Badge>
      );
    }
    return <Badge variant="outline">Unassigned</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Traffic Fines"
          value={filteredFines.length.toString()}
          description="Total number of traffic fines in the system"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <StatCard 
          title="Assigned Fines"
          value={assignedFines.length.toString()}
          description={`Total amount: ${formatCurrency(assignedFinesAmount)}`}
          icon={UserCheck}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Unassigned Fines"
          value={unassignedFines.length.toString()}
          description={`Total amount: ${formatCurrency(unassignedFinesAmount)}`}
          icon={Users}
          iconColor="text-red-500"
        />
      </div>

      {hasInvalidAssignments && (
        <Alert variant={showInvalidAssignments ? "default" : "destructive"} className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Fine Assignments Detected</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              {invalidAssignments.length} traffic {invalidAssignments.length === 1 ? 'fine is' : 'fines are'} assigned to customers 
              but the violation dates fall outside the lease periods.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowInvalidAssignments(!showInvalidAssignments)}
              >
                {showInvalidAssignments ? 'Hide' : 'Show'} Invalid Assignments
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleFixInvalidAssignments}
                disabled={cleanupInvalidAssignments.isPending}
              >
                {cleanupInvalidAssignments.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-3 w-3" />
                    Fix Invalid Assignments
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {showAssignmentResults && assignmentResults.length > 0 && (
        <Alert variant="default" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Auto-Assignment Results</AlertTitle>
          <AlertDescription>
            <div className="max-h-40 overflow-y-auto mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left">License Plate</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentResults.map((result) => (
                    <tr key={result.id} className="border-t">
                      <td className="py-1">{result.licensePlate || 'N/A'}</td>
                      <td className="py-1">
                        {result.success ? (
                          <span className="text-green-500 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" /> Success
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <X className="h-3 w-3 mr-1" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="py-1 truncate max-w-[250px]">{result.message || result.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => setShowAssignmentResults(false)}
            >
              Hide Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Traffic Fines</CardTitle>
              <CardDescription>
                Manage and track traffic fines for your vehicles
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                className="w-full md:w-auto"
                onClick={handleAutoAssignFines}
                disabled={assigningFines || isAutoAssigning}
                variant="secondary"
              >
                <UserCheck className="mr-2 h-4 w-4" /> 
                {(assigningFines || isAutoAssigning) ? "Assigning..." : "Auto-Assign"}
              </Button>
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Fine
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by violation number, license plate, or charge..."
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
                  <TableHead>Violation #</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead className="hidden md:table-cell">Violation Date</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isAutoAssigning ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {isAutoAssigning ? "Auto-assigning traffic fines..." : "Loading traffic fines..."}
                    </TableCell>
                  </TableRow>
                ) : filteredFines.length > 0 ? (
                  filteredFines.filter(fine => {
                    // Filter out invalid assignments if not showing them
                    if (!showInvalidAssignments && fine.customerId && fine.leaseId && fine.violationDate && fine.leaseStartDate) {
                      const isInvalid = new Date(fine.violationDate) < new Date(fine.leaseStartDate) || 
                        (fine.leaseEndDate && new Date(fine.violationDate) > new Date(fine.leaseEndDate));
                      return !isInvalid;
                    }
                    return true;
                  }).map((fine) => (
                    <TableRow key={fine.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                          {fine.violationNumber}
                        </div>
                      </TableCell>
                      <TableCell>{fine.licensePlate}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(fine.violationDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{fine.location || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(fine.fineAmount)}</TableCell>
                      <TableCell>
                        {getStatusBadge(fine.paymentStatus)}
                      </TableCell>
                      <TableCell>
                        {getCustomerAssignmentStatus(fine)}
                        {fine.customerName && (
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
                            {fine.customerName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handlePayFine(fine.id)}
                              disabled={fine.paymentStatus === 'paid'}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Pay Fine
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDisputeFine(fine.id)}
                              disabled={fine.paymentStatus === 'disputed'}
                            >
                              <X className="mr-2 h-4 w-4" /> Dispute Fine
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => assignToCustomer.mutate({ id: fine.id })}
                              disabled={!!fine.customerId}
                            >
                              <UserCheck className="mr-2 h-4 w-4" /> Assign to Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {searchQuery ? "No matching traffic fines found." : "No traffic fines found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFinesList;
