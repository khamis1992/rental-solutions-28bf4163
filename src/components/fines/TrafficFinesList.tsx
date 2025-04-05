
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
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/stat-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TrafficFinesListProps {
  onAddFine?: () => void;
  isAutoAssigning?: boolean;
}

const TrafficFinesList = ({ onAddFine, isAutoAssigning = false }: TrafficFinesListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { trafficFines, isLoading, error, payTrafficFine, disputeTrafficFine, assignToCustomer } = useTrafficFines();
  const [assigningFines, setAssigningFines] = useState(false);
  const [dataValidation, setDataValidation] = useState<{ valid: boolean; issues: string[] }>({ 
    valid: true, 
    issues: [] 
  });
  
  // Validate the traffic fines data when it loads
  useEffect(() => {
    if (trafficFines && trafficFines.length > 0) {
      validateTrafficFinesData(trafficFines);
    }
  }, [trafficFines]);
  
  // Data validation function to check for data integrity
  const validateTrafficFinesData = (fines: any[]) => {
    const issues: string[] = [];
    
    // Check for required fields and data consistency
    fines.forEach((fine, index) => {
      if (!fine.id) {
        issues.push(`Fine at index ${index} is missing ID field`);
      }
      
      if (!fine.violationNumber) {
        issues.push(`Fine ID ${fine.id} is missing violation number`);
      }
      
      if (!fine.licensePlate) {
        issues.push(`Fine ID ${fine.id} (${fine.violationNumber || 'Unknown'}) is missing license plate`);
      }
      
      if (!fine.fineAmount && fine.fineAmount !== 0) {
        issues.push(`Fine ID ${fine.id} (${fine.violationNumber || 'Unknown'}) is missing amount`);
      }
      
      if (fine.violationDate && !(fine.violationDate instanceof Date) && isNaN(new Date(fine.violationDate).getTime())) {
        issues.push(`Fine ID ${fine.id} (${fine.violationNumber || 'Unknown'}) has invalid violation date`);
      }
    });
    
    setDataValidation({
      valid: issues.length === 0,
      issues
    });
    
    // Log issues to console for debugging
    if (issues.length > 0) {
      console.warn('Traffic fines data validation issues:', issues);
    }
  };

  const filteredFines = trafficFines ? trafficFines.filter(fine => 
    ((fine.violationNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.licensePlate?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.violationCharge?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
  ) : [];

  const assignedFines = filteredFines.filter(fine => fine.customerId);
  const unassignedFines = filteredFines.filter(fine => !fine.customerId);
  
  const assignedFinesAmount = assignedFines.reduce((total, fine) => total + fine.fineAmount, 0);
  const unassignedFinesAmount = unassignedFines.reduce((total, fine) => total + fine.fineAmount, 0);

  const handlePayFine = async (id: string) => {
    try {
      await payTrafficFine.mutate({ id });
      toast.success("Fine marked as paid successfully");
    } catch (error) {
      console.error("Error paying fine:", error);
      toast.error("Failed to pay fine", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  const handleDisputeFine = async (id: string) => {
    try {
      await disputeTrafficFine.mutate({ id });
      toast.success("Fine marked as disputed successfully");
    } catch (error) {
      console.error("Error disputing fine:", error);
      toast.error("Failed to dispute fine", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  const handleAutoAssignFines = async () => {
    try {
      setAssigningFines(true);
      toast.info("Auto-assigning fines", {
        description: "Please wait while fines are assigned to customers..."
      });

      let assignedCount = 0;
      let failedCount = 0;
      const pendingFines = filteredFines.filter(fine => !fine.customerId);

      if (pendingFines.length === 0) {
        toast.info("No unassigned fines to process");
        setAssigningFines(false);
        return;
      }

      console.log(`Attempting to auto-assign ${pendingFines.length} fines`);

      for (const fine of pendingFines) {
        if (!fine.licensePlate) {
          console.log(`Skipping fine ${fine.id} - missing license plate`);
          continue;
        }

        try {
          console.log(`Assigning fine ${fine.id} with license plate ${fine.licensePlate}`);
          await assignToCustomer.mutate({ id: fine.id });
          assignedCount++;
        } catch (error) {
          console.error(`Failed to assign fine ${fine.id}:`, error);
          failedCount++;
        }
      }

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
      return (
        <Badge className="bg-blue-500 text-white border-blue-600">
          <UserCheck className="mr-1 h-3 w-3" /> Assigned
        </Badge>
      );
    }
    return <Badge variant="outline">Unassigned</Badge>;
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading traffic fines</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load traffic fines data"}
        </AlertDescription>
      </Alert>
    );
  }

  // Display data validation warnings if found
  const renderDataValidationWarning = () => {
    if (!dataValidation.valid && dataValidation.issues.length > 0) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Data Validation Issues</AlertTitle>
          <AlertDescription>
            <p>Some traffic fines data has validation issues:</p>
            <ul className="list-disc pl-5 mt-2">
              {dataValidation.issues.slice(0, 3).map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
              {dataValidation.issues.length > 3 && (
                <li>...and {dataValidation.issues.length - 3} more issues</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {renderDataValidationWarning()}
      
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
                {(assigningFines || isAutoAssigning) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" /> 
                    Auto-Assign
                  </>
                )}
              </Button>
              <Button 
                className="w-full md:w-auto"
                onClick={onAddFine}
              >
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
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        {isAutoAssigning ? "Auto-assigning traffic fines..." : "Loading traffic fines..."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredFines.length > 0 ? (
                  filteredFines.map((fine) => (
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
