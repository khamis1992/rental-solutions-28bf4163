
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generatePoliceReport } from '@/utils/policeReportUtils';
import { AlertCircle, FileDown, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCustomers } from '@/hooks/use-customers';
import { toast } from 'sonner';

// Type for customers with obligations
interface CustomerWithObligations {
  id: string;
  full_name: string;
  phone_number: string;
  driver_license: string;
  email?: string;
  totalOwed: number;
}

const PoliceReportTab = () => {
  const [customers, setCustomers] = useState<CustomerWithObligations[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [generatedFileName, setGeneratedFileName] = useState<string>('');
  
  // Load customers with outstanding obligations
  useEffect(() => {
    async function fetchCustomersWithObligations() {
      setIsFetching(true);
      setError(null);
      
      try {
        console.log('Fetching customers with outstanding obligations');
        
        // Get all customers with overdue payments
        const { data: overduePayments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select(`
            lease_id,
            balance
          `)
          .eq('status', 'pending')
          .gt('days_overdue', 0);
        
        if (paymentsError) {
          throw new Error(`Failed to fetch overdue payments: ${paymentsError.message}`);
        }
        
        if (!overduePayments || overduePayments.length === 0) {
          setCustomers([]);
          setIsFetching(false);
          return;
        }
        
        // Extract lease IDs
        const leaseIds = overduePayments.map(payment => payment.lease_id).filter(Boolean);
        
        if (leaseIds.length === 0) {
          setCustomers([]);
          setIsFetching(false);
          return;
        }
        
        // Get leases with customer IDs
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select('id, customer_id')
          .in('id', leaseIds);
        
        if (leasesError) {
          throw new Error(`Failed to fetch leases: ${leasesError.message}`);
        }
        
        // Map lease IDs to customer IDs
        const leaseToCustomerMap = new Map();
        leases?.forEach(lease => {
          if (lease.customer_id) {
            leaseToCustomerMap.set(lease.id, lease.customer_id);
          }
        });
        
        // Calculate total owed per customer
        const customerTotals: Record<string, number> = {};
        overduePayments.forEach(payment => {
          const customerId = leaseToCustomerMap.get(payment.lease_id);
          if (customerId) {
            if (!customerTotals[customerId]) {
              customerTotals[customerId] = 0;
            }
            customerTotals[customerId] += (payment.balance || 0);
          }
        });
        
        // Get unique customer IDs
        const customerIds = Object.keys(customerTotals);
        
        if (customerIds.length === 0) {
          setCustomers([]);
          setIsFetching(false);
          return;
        }
        
        // Fetch customer details
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('id, full_name, phone_number, driver_license, email')
          .in('id', customerIds);
        
        if (customerError) {
          throw new Error(`Failed to fetch customers: ${customerError.message}`);
        }
        
        // Build final customer list with total owed
        const customersWithTotals = customerData?.map(customer => ({
          ...customer,
          totalOwed: customerTotals[customer.id] || 0
        })).sort((a, b) => b.totalOwed - a.totalOwed) || [];
        
        setCustomers(customersWithTotals);
        
        if (customersWithTotals.length > 0) {
          setSelectedCustomerId(customersWithTotals[0].id);
        }
      } catch (err) {
        console.error('Error fetching customers with obligations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load customers with obligations');
      } finally {
        setIsFetching(false);
      }
    }
    
    fetchCustomersWithObligations();
  }, []);
  
  const handleGenerateReport = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get selected customer
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      
      if (!selectedCustomer) {
        throw new Error('Selected customer not found');
      }
      
      // Generate the police report
      const result = await generatePoliceReport(selectedCustomerId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate police report');
      }
      
      setGeneratedFileName(result.fileName || selectedCustomer.full_name);
      setShowSuccessDialog(true);
      
      toast.success('Police report generated successfully');
    } catch (err) {
      console.error('Error generating police report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate police report');
      toast.error('Failed to generate police report', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Police Report</CardTitle>
          <CardDescription>
            Create official police reports for customers with outstanding obligations
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading customers with outstanding obligations...</span>
            </div>
          ) : customers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No eligible customers</AlertTitle>
              <AlertDescription>
                There are no customers with outstanding obligations at this time.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label htmlFor="customer-select" className="text-sm font-medium">
                    Select Customer with Outstanding Obligations
                  </label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="customer-select" className="w-full">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <span className="flex justify-between items-center gap-2">
                            <span>{customer.full_name}</span>
                            <span className="text-sm text-muted-foreground">
                              (QAR {customer.totalOwed.toLocaleString()})
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleGenerateReport} 
            disabled={isLoading || isFetching || !selectedCustomerId || customers.length === 0}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Generate Police Report
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Police Report Generated</DialogTitle>
            <DialogDescription>
              The police report for the selected customer has been generated successfully.
            </DialogDescription>
          </DialogHeader>
          <p className="text-center text-muted-foreground">
            The report has been downloaded as "{generatedFileName}.pdf"
          </p>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoliceReportTab;
