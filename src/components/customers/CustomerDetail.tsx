
import React, { useEffect, useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Phone, Mail, Home, AlertTriangle, Calendar, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import CustomerTrafficFines from './CustomerTrafficFines';
import { toast } from 'sonner';
import { validateFineDate } from '@/hooks/traffic-fines/use-traffic-fine-validation';
import { supabase } from '@/lib/supabase';

export const CustomerDetail = () => {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validatingFines, setValidatingFines] = useState(false);

  useEffect(() => {
    // In a real implementation, this would fetch the actual customer data
    // For now, we're using mock data as a placeholder
    const mockCustomer = {
      id: 'cust-123',
      full_name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+974 5555-1234',
      address: '123 Corniche Street, West Bay, Doha',
      created_at: '2023-04-15T08:30:00Z',
      status: 'active',
      documents_verified: true
    };

    // Simulate loading
    setTimeout(() => {
      setCustomer(mockCustomer);
      setLoading(false);
    }, 800);
  }, []);

  const handleValidateTrafficFines = async () => {
    if (!customer?.id) return;
    
    setValidatingFines(true);
    try {
      // Get all leases for this customer
      const { data: leases, error: leaseError } = await supabase
        .from('leases')
        .select('id, start_date, end_date')
        .eq('customer_id', customer.id);
        
      if (leaseError) throw leaseError;
      
      // No leases? Nothing to validate
      if (!leases || leases.length === 0) {
        toast.info('No agreements found for this customer');
        return;
      }
      
      // Get all traffic fines for these leases
      const leaseIds = leases.map(lease => lease.id);
      const { data: fines, error: fineError } = await supabase
        .from('traffic_fines')
        .select('*')
        .in('lease_id', leaseIds);
        
      if (fineError) throw fineError;
      
      if (!fines || fines.length === 0) {
        toast.info('No traffic fines found for this customer');
        return;
      }
      
      // Create a lease lookup for quick validation
      const leaseLookup = leases.reduce((acc: any, lease: any) => {
        acc[lease.id] = lease;
        return acc;
      }, {});
      
      // Validate each fine
      const invalidFines = [];
      for (const fine of fines) {
        const lease = leaseLookup[fine.lease_id];
        if (!lease) continue;
        
        const validation = validateFineDate(
          fine.violation_date,
          lease.start_date,
          lease.end_date
        );
        
        if (!validation.isValid) {
          invalidFines.push({
            id: fine.id,
            leaseId: fine.lease_id,
            reason: validation.reason
          });
        }
      }
      
      // If we found invalid fines, show a warning and offer to fix
      if (invalidFines.length > 0) {
        toast.warning(`Found ${invalidFines.length} invalid fine assignments`, {
          description: 'Some traffic fines are assigned to agreements outside their valid date range.',
          action: {
            label: 'Fix Issues',
            onClick: () => handleFixInvalidFines(invalidFines)
          }
        });
      } else {
        toast.success('All traffic fines validated successfully', {
          description: `${fines.length} fines checked with no issues found.`
        });
      }
      
    } catch (error) {
      console.error('Error validating traffic fines:', error);
      toast.error('Failed to validate traffic fines', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setValidatingFines(false);
    }
  };
  
  const handleFixInvalidFines = async (invalidFines: any[]) => {
    try {
      let fixedCount = 0;
      
      for (const fine of invalidFines) {
        const { error } = await supabase
          .from('traffic_fines')
          .update({ 
            lease_id: null,
            assignment_status: 'pending'
          })
          .eq('id', fine.id);
          
        if (!error) {
          fixedCount++;
        }
      }
      
      toast.success(`Fixed ${fixedCount} invalid fine assignments`, {
        description: fixedCount < invalidFines.length
          ? `${invalidFines.length - fixedCount} could not be fixed`
          : 'All issues have been resolved'
      });
    } catch (error) {
      console.error('Error fixing invalid fines:', error);
      toast.error('Failed to fix invalid fine assignments');
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Customer Profile</CardTitle>
          <Badge variant={customer?.status === 'active' ? 'success' : 'secondary'}>
            {customer?.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-xl font-medium">{customer?.full_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Customer since {customer?.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleValidateTrafficFines}
                disabled={validatingFines}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                {validatingFines ? 'Validating...' : 'Validate Traffic Fines'}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer?.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span>{customer?.address || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-md ${customer?.documents_verified ? 'bg-green-50' : 'bg-amber-50'}`}>
              <AlertTriangle className={`h-5 w-5 ${customer?.documents_verified ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">Document Verification</p>
              <p className="text-sm text-muted-foreground">
                {customer?.documents_verified
                  ? 'All documents have been verified'
                  : 'Some documents require verification'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Display customer traffic fines */}
      {customer?.id && <CustomerTrafficFines customerId={customer.id} />}
    </div>
  );
};

export default CustomerDetail;
