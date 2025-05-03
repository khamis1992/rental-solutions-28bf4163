
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useTrafficFines, type TrafficFine } from '@/hooks/use-traffic-fines';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { validateFineDate } from '@/hooks/traffic-fines/use-traffic-fine-validation';
import { supabase } from '@/lib/supabase';

interface AgreementTrafficFinesProps {
  customerId: string;
}

export function CustomerTrafficFines({ customerId }: AgreementTrafficFinesProps) {
  const { isLoading: isHookLoading } = useTrafficFines();
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [showLoader, setShowLoader] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    loadCustomerFines();
  }, [customerId]);

  async function loadCustomerFines() {
    setLoading(true);
    try {
      // First, get all leases for this customer
      const { data: leases, error: leaseError } = await supabase
        .from('leases')
        .select('id, start_date, end_date')
        .eq('customer_id', customerId);

      if (leaseError) {
        console.error('Error fetching leases:', leaseError);
        setLoading(false);
        return;
      }

      if (!leases || leases.length === 0) {
        // If no leases, check for direct fine assignments
        const { data: directFines, error: directFinesError } = await supabase
          .from('traffic_fines')
          .select(`
            id,
            violation_number,
            license_plate,
            violation_date,
            fine_amount,
            violation_charge,
            payment_status,
            fine_location,
            lease_id
          `)
          .eq('customer_id', customerId);

        if (directFinesError) {
          console.error('Error fetching direct fines:', directFinesError);
        }

        setFines(directFines?.map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number,
          licensePlate: fine.license_plate,
          violationDate: fine.violation_date ? new Date(fine.violation_date) : new Date(),
          fineAmount: fine.fine_amount,
          violationCharge: fine.violation_charge,
          paymentStatus: fine.payment_status,
          location: fine.fine_location,
          leaseId: fine.lease_id
        })) || []);
        
        setLoading(false);
        return;
      }

      // Get all fines for these leases
      const leaseIds = leases.map(lease => lease.id);
      const { data: leaseFines, error: finesError } = await supabase
        .from('traffic_fines')
        .select(`
          id,
          violation_number,
          license_plate,
          violation_date,
          fine_amount,
          violation_charge,
          payment_status,
          fine_location,
          lease_id
        `)
        .in('lease_id', leaseIds);

      if (finesError) {
        console.error('Error fetching lease fines:', finesError);
        setLoading(false);
        return;
      }

      // Transform and validate fines data
      const transformedFines = leaseFines?.map(fine => {
        const relatedLease = leases.find(lease => lease.id === fine.lease_id);
        let isValid = false;
        let validationMessage = '';
        
        if (relatedLease && fine.violation_date && relatedLease.start_date) {
          const validationResult = validateFineDate(
            new Date(fine.violation_date),
            new Date(relatedLease.start_date),
            relatedLease.end_date ? new Date(relatedLease.end_date) : undefined
          );
          
          isValid = validationResult.isValid;
          validationMessage = validationResult.reason || '';
        }
        
        return {
          id: fine.id,
          violationNumber: fine.violation_number,
          licensePlate: fine.license_plate,
          violationDate: fine.violation_date ? new Date(fine.violation_date) : new Date(),
          fineAmount: fine.fine_amount,
          violationCharge: fine.violation_charge,
          paymentStatus: fine.payment_status,
          location: fine.fine_location,
          leaseId: fine.lease_id,
          isValid,
          validationMessage
        };
      }) || [];

      setFines(transformedFines);
    } catch (error) {
      console.error('Error in loadCustomerFines:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleReassignFine = async (fineId: string) => {
    try {
      // Unassign the fine from the current lease
      const { error } = await supabase
        .from('traffic_fines')
        .update({ 
          lease_id: null, 
          assignment_status: 'pending' 
        })
        .eq('id', fineId);
      
      if (error) {
        console.error('Error reassigning fine:', error);
        return;
      }
      
      // Refresh fines
      loadCustomerFines();
      
    } catch (error) {
      console.error('Error in handleReassignFine:', error);
    }
  };

  const handleRefresh = async () => {
    setShowLoader(true);
    await loadCustomerFines();
    // Wait a moment for visual feedback
    setTimeout(() => {
      setShowLoader(false);
    }, 1000);
  };

  if (isHookLoading || loading || showLoader) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fines && fines.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Location</th>
                <th className="text-left py-3 px-4">Violation</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-right py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((fine) => (
                <tr key={fine.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    {fine.violationDate 
                      ? format(new Date(fine.violationDate), 'dd MMM yyyy') 
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4">{fine.location || 'N/A'}</td>
                  <td className="py-3 px-4">{fine.violationCharge || 'N/A'}</td>
                  <td className="py-3 px-4 text-right">
                    {fine.fineAmount 
                      ? `QAR ${fine.fineAmount.toLocaleString()}` 
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      fine.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fine.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReassignFine(fine.id)}
                      className="text-xs"
                    >
                      Reassign
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-4 text-muted-foreground">
          No traffic fines found for this customer.
        </p>
      )}
      
      <div className="flex justify-between items-center pt-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {fines?.length > 0 ? 
              `Showing ${fines.length} fine${fines.length !== 1 ? 's' : ''}` :
              'No fines found'}
          </p>
        </div>
        
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
    </div>
  );
}
