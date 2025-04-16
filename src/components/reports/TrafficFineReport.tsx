
import React, { useState, useEffect } from 'react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, DollarSign, User, UserCheck, Loader2 } from 'lucide-react';
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

// Define types for fine grouping
interface CustomerFineGroup {
  customerId: string;
  customerName: string;
  totalAmount: number;
  fines: any[];
}

const TrafficFineReport = () => {
  const { trafficFines, isLoading, assignToCustomer } = useTrafficFines();
  const [searchTerm, setSearchTerm] = useState('');
  const [finesData, setFinesData] = useState<any[]>([]);
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [assigningFine, setAssigningFine] = useState<string | null>(null);

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Process traffic fines data
  const filteredFines = finesData.filter(fine => 
    (fine.licensePlate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (fine.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (fine.violationNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Add debug log for filtered fines
  console.log("Filtered traffic fines for report:", {
    count: filteredFines.length,
    first5: filteredFines.slice(0, 5)
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

  // Calculate summary metrics
  const totalFines = filteredFines.length;
  const totalAmount = filteredFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const assignedFines = filteredFines.filter(fine => fine.customerId).length;
  const unassignedFines = filteredFines.filter(fine => !fine.customerId).length;

  // Group fines by customer
  const finesByCustomer = filteredFines.reduce<Record<string, CustomerFineGroup>>((acc, fine) => {
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
  const unassignedFinesList = filteredFines.filter(fine => !fine.customerId);

  // Add debug log for report data
  console.log("Prepared data for report:", {
    totalFines,
    totalAmount,
    assignedFines,
    unassignedFines,
    sortedCustomers: sortedCustomers.length,
    unassignedFinesList: unassignedFinesList.length
  });

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
      <div className="flex items-center space-x-2">
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox"
            className="h-4 w-4" 
            checked={showUnassigned}
            onChange={(e) => setShowUnassigned(e.target.checked)}
          />
          <span className="text-sm">Show unassigned fines</span>
        </label>
      </div>

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
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customer.fines.map((fine) => (
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
                              </TableRow>
                            ))}
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
