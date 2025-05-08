import React, { useState, useEffect } from 'react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, User, UserCheck, Loader2, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Define types for fine grouping
interface CustomerFineGroup {
  customerId: string;
  customerName: string;
  totalAmount: number;
  fines: any[];
}

const TrafficFineReport = () => {
  const { trafficFines, isLoading, assignToCustomer, cleanupInvalidAssignments } = useTrafficFines();
  const [searchTerm, setSearchTerm] = useState('');
  const [finesData, setFinesData] = useState<any[]>([]);
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [assigningFine, setAssigningFine] = useState<string | null>(null);
  const [showInvalidDates, setShowInvalidDates] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Ensure we have data to process even when trafficFines is undefined
  useEffect(() => {
    if (trafficFines) {
      console.log("Traffic fines data loaded in report component:", trafficFines.length);
      setFinesData(trafficFines);
    } else {
      console.log("No traffic fines data available in report component");
      setFinesData([]);
    }
  }, [trafficFines]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading traffic fines data...</p>
        </div>
      </div>
    );
  }

  // Validate if the fine occurred within the lease period
  const isValidFine = (fine: any) => {
    if (!fine.leaseId) return false;
    
    // Check if the fine has a violation date and the assigned lease has start/end dates
    if (!fine.violationDate || !fine.leaseStartDate) return false;
    
    const violationDate = new Date(fine.violationDate);
    const leaseStartDate = new Date(fine.leaseStartDate);
    const leaseEndDate = fine.leaseEndDate ? new Date(fine.leaseEndDate) : new Date();
    
    return violationDate >= leaseStartDate && violationDate <= leaseEndDate;
  };

  // Process traffic fines data
  const filteredFines = finesData.filter(fine => 
    ((fine.licensePlate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (fine.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (fine.violationNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
  );
  
  // Split fines into valid and invalid assignments
  const validFines = filteredFines.filter(fine => !fine.customerId || isValidFine(fine));
  const invalidAssignedFines = filteredFines.filter(fine => fine.customerId && !isValidFine(fine));

  // Add debug log for filtered fines
  console.log("Filtered traffic fines for report:", {
    all: filteredFines.length,
    valid: validFines.length,
    invalid: invalidAssignedFines.length
  });

  // Handle assigning a fine to a customer
  const handleAssignToCustomer = async (id: string) => {
    if (!id) {
      toast.error("Invalid fine ID");
      return;
    }

    try {
      setAssigningFine(id);
      await assignToCustomer.mutateAsync({ id });
      toast.success("Fine assigned to customer successfully");
    } catch (error) {
      console.error("Error assigning fine to customer:", error);
      toast.error("Failed to assign fine to customer", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setAssigningFine(null);
    }
  };

  // Handle cleanup of invalid assignments
  const handleCleanupInvalidAssignments = async () => {
    try {
      setIsCleaningUp(true);
      await cleanupInvalidAssignments.mutateAsync();
    } catch (error) {
      console.error("Error cleaning up invalid assignments:", error);
      toast.error("Failed to clean up invalid assignments", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Calculate summary metrics based on valid assignments only
  const totalFines = showInvalidDates ? filteredFines.length : validFines.length;
  const totalAmount = (showInvalidDates ? filteredFines : validFines)
    .reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const assignedFines = (showInvalidDates ? filteredFines : validFines)
    .filter(fine => fine.customerId).length;
  const unassignedFines = (showInvalidDates ? filteredFines : validFines)
    .filter(fine => !fine.customerId).length;

  // Group fines by customer (only valid ones by default)
  const finesToDisplay = showInvalidDates ? filteredFines : validFines;

  // Group fines by customer
  const finesByCustomer = finesToDisplay.reduce<Record<string, CustomerFineGroup>>((acc, fine) => {
    if (fine.customerId && fine.customerName) {
      if (!acc[fine.customerId]) {
        acc[fine.customerId] = {
          customerId: fine.customerId,
          customerName: fine.customerName,
          totalAmount: 0,
          fines: []
        };
      }
      acc[fine.customerId].totalAmount += fine.fineAmount || 0;
      acc[fine.customerId].fines.push(fine);
    }
    return acc;
  }, {});

  // Sort customers by total fine amount
  const sortedCustomers = Object.values(finesByCustomer).sort((a, b) => b.totalAmount - a.totalAmount);

  // Collect all unassigned fines
  const unassignedFinesList = finesToDisplay.filter(fine => !fine.customerId);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fines</p>
                <h3 className="text-2xl font-bold mt-1">{totalFines}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</h3>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Fines</p>
                <h3 className="text-2xl font-bold mt-1">{assignedFines}</h3>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unassigned Fines</p>
                <h3 className="text-2xl font-bold mt-1">{unassignedFines}</h3>
              </div>
              <User className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search by license plate, customer name or violation number..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Display Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox"
              className="h-4 w-4" 
              checked={showUnassigned}
              onChange={(e) => setShowUnassigned(e.target.checked)}
            />
            <span className="text-sm">Show unassigned fines</span>
          </label>

          <label className="flex items-center space-x-2">
            <input 
              type="checkbox"
              className="h-4 w-4" 
              checked={showInvalidDates}
              onChange={(e) => setShowInvalidDates(e.target.checked)}
            />
            <span className="text-sm">Include invalid lease period assignments</span>
          </label>
        </div>

        {invalidAssignedFines.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCleanupInvalidAssignments}
            disabled={isCleaningUp}
            className="flex items-center gap-1"
          >
            {isCleaningUp ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                Cleaning...
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Fix invalid assignments
              </>
            )}
          </Button>
        )}
      </div>
      
      {invalidAssignedFines.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Fine Assignments Detected</AlertTitle>
          <AlertDescription>
            {invalidAssignedFines.length} traffic {invalidAssignedFines.length === 1 ? 'fine is' : 'fines are'} assigned to customers 
            but the violation dates fall outside the lease periods. 
            {!showInvalidDates && ' These are hidden by default.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Traffic Fines Report */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines Report</CardTitle>
          <CardDescription>
            {totalFines === 0 ? "No traffic fines found" : 
            `Showing ${totalFines} traffic fine${totalFines !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalFines > 0 ? (
            <div className="space-y-6">
              {/* Assigned Fines */}
              {sortedCustomers.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Fines by Customer</h3>
                  
                  {sortedCustomers.map((customer) => (
                    <Card key={customer.customerId} className="mb-4">
                      <CardHeader className="bg-muted/50 py-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg">{customer.customerName}</CardTitle>
                            <CardDescription>
                              Total: {formatCurrency(customer.totalAmount)} • {customer.fines.length} fine{customer.fines.length !== 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Violation #</TableHead>
                              <TableHead>License Plate</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Validity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customer.fines.map((fine) => {
                              const isValidFineDate = isValidFine(fine);
                              return (
                                <TableRow key={fine.id}>
                                  <TableCell>{fine.violationNumber || 'N/A'}</TableCell>
                                  <TableCell>{fine.licensePlate || 'N/A'}</TableCell>
                                  <TableCell>{fine.violationDate ? formatDate(new Date(fine.violationDate)) : 'N/A'}</TableCell>
                                  <TableCell>{fine.location || 'N/A'}</TableCell>
                                  <TableCell>{formatCurrency(fine.fineAmount || 0)}</TableCell>
                                  <TableCell>
                                    <Badge className={fine.paymentStatus === 'paid' 
                                      ? 'bg-green-500' 
                                      : fine.paymentStatus === 'disputed' 
                                        ? 'bg-yellow-500' 
                                        : 'bg-red-500'}>
                                      {fine.paymentStatus.charAt(0).toUpperCase() + fine.paymentStatus.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {isValidFineDate ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Valid
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                        Invalid Period
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Unassigned Fines */}
              {showUnassigned && unassignedFinesList.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Unassigned Fines</h3>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Violation #</TableHead>
                            <TableHead>License Plate</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unassignedFinesList.map((fine) => (
                            <TableRow key={fine.id}>
                              <TableCell>{fine.violationNumber || 'N/A'}</TableCell>
                              <TableCell>{fine.licensePlate || 'N/A'}</TableCell>
                              <TableCell>{fine.violationDate ? formatDate(new Date(fine.violationDate)) : 'N/A'}</TableCell>
                              <TableCell>{fine.location || 'N/A'}</TableCell>
                              <TableCell>{formatCurrency(fine.fineAmount || 0)}</TableCell>
                              <TableCell>
                                <Badge className={fine.paymentStatus === 'paid' 
                                  ? 'bg-green-500' 
                                  : fine.paymentStatus === 'disputed' 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'}>
                                  {fine.paymentStatus.charAt(0).toUpperCase() + fine.paymentStatus.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAssignToCustomer(fine.id)}
                                  disabled={assigningFine === fine.id}
                                  className="flex items-center"
                                >
                                  {assigningFine === fine.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Assigning...
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-3 w-3 mr-1" />
                                      Assign
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* No Results */}
              {sortedCustomers.length === 0 && (!showUnassigned || unassignedFinesList.length === 0) && (
                <div className="py-6 text-center text-muted-foreground">
                  No traffic fines found matching your search criteria
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No traffic fines found in the system
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFineReport;
