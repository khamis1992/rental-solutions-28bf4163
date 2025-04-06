
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrafficFine, TrafficFineStatusType } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle, CheckCircle, Clock, X, HelpCircle } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { validateDataConsistency, logOperation } from '@/utils/monitoring-utils';

interface CustomerTrafficFinesProps {
  customerId: string;
}

export function CustomerTrafficFines({ customerId }: CustomerTrafficFinesProps) {
  const { t } = useTranslation();
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      try {
        setLoading(true);
        
        if (!customerId) {
          throw new Error("Invalid customer ID");
        }
        
        // Log operation start
        logOperation('fetchCustomerTrafficFines', 'success', { customerId });
        
        // Step 1: First find all leases associated with this customer using explicit join syntax
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select('id')
          .eq('customer_id', customerId);
          
        if (leasesError) {
          console.error("Error fetching customer leases:", leasesError);
          throw new Error(`Could not retrieve customer leases: ${leasesError.message}`);
        }
        
        // If customer has no leases, return empty array
        if (!leases || leases.length === 0) {
          console.log(`No leases found for customer ${customerId}`);
          setFines([]);
          return;
        }
        
        // Extract the lease IDs
        const leaseIds = leases.map(lease => lease.id);
        console.log(`Found ${leaseIds.length} leases for customer ${customerId}`, leaseIds);
        
        // Step 2: Fetch traffic fines associated with these lease IDs using explicit join
        const { data: trafficFines, error: finesError } = await supabase
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
            vehicle_id,
            lease_id,
            payment_date
          `)
          .in('lease_id', leaseIds)
          .order('violation_date', { ascending: false });
          
        if (finesError) {
          console.error("Error fetching traffic fines:", finesError);
          throw new Error(`Could not retrieve traffic fines: ${finesError.message}`);
        }
        
        console.log(`Found ${trafficFines?.length || 0} traffic fines`);
        
        // If we have vehicle IDs, get vehicle details to enhance the data
        if (trafficFines && trafficFines.length > 0) {
          const vehicleIds = trafficFines
            .map(fine => fine.vehicle_id)
            .filter(Boolean) as string[];
            
          if (vehicleIds.length > 0) {
            // Get vehicle details
            const { data: vehicles, error: vehiclesError } = await supabase
              .from('vehicles')
              .select('id, make, model')
              .in('id', vehicleIds);
              
            if (vehiclesError) {
              console.error("Error fetching vehicle details:", vehiclesError);
              // Continue without vehicle details
            }
            
            // Create a map of vehicle IDs to vehicle models
            const vehicleMap = new Map();
            vehicles?.forEach(vehicle => {
              vehicleMap.set(vehicle.id, `${vehicle.make} ${vehicle.model}`);
            });
            
            // Transform and enhance the data to match the TrafficFine interface
            const formattedFines: TrafficFine[] = (trafficFines || []).map(fine => ({
              id: fine.id,
              violationNumber: fine.violation_number || `TF-${Math.floor(Math.random() * 10000)}`,
              licensePlate: fine.license_plate,
              vehicleModel: fine.vehicle_id ? vehicleMap.get(fine.vehicle_id) : undefined,
              violationDate: new Date(fine.violation_date),
              fineAmount: fine.fine_amount,
              violationCharge: fine.violation_charge,
              paymentStatus: fine.payment_status as TrafficFineStatusType,
              location: fine.fine_location || '',
              vehicleId: fine.vehicle_id,
              paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined,
              customerId: customerId,
              leaseId: fine.lease_id
            }));
            
            setFines(formattedFines);
          } else {
            // Transform the data without vehicle details
            const formattedFines: TrafficFine[] = (trafficFines || []).map(fine => ({
              id: fine.id,
              violationNumber: fine.violation_number || `TF-${Math.floor(Math.random() * 10000)}`,
              licensePlate: fine.license_plate,
              vehicleModel: undefined,
              violationDate: new Date(fine.violation_date),
              fineAmount: fine.fine_amount,
              violationCharge: fine.violation_charge,
              paymentStatus: fine.payment_status as TrafficFineStatusType,
              location: fine.fine_location || '',
              vehicleId: fine.vehicle_id,
              paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined,
              customerId: customerId,
              leaseId: fine.lease_id
            }));
            
            setFines(formattedFines);
          }
        } else {
          setFines([]);
        }
      } catch (err) {
        console.error('Error fetching traffic fines:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load traffic fines';
        setError(errorMessage);
        
        // Log error
        logOperation(
          'fetchCustomerTrafficFines',
          'error',
          { customerId },
          errorMessage
        );
        
        toast.error('Failed to load traffic fines', {
          description: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrafficFines();
  }, [customerId]);

  const getStatusBadge = (status: TrafficFineStatusType) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
      case 'disputed':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300"><AlertTriangle className="mr-1 h-3 w-3" /> Disputed</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><X className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };

  const validateFineData = async (fineId: string) => {
    try {
      const results = await validateDataConsistency('trafficFine', fineId, supabase);
      setValidationResults(results);
      
      if (results.isValid) {
        toast.success('Data validation successful', {
          description: 'All relationships are valid'
        });
      } else {
        toast.error('Data validation failed', {
          description: `Found ${results.inconsistencies.length} issues`
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Validation failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const clearValidation = () => {
    setValidationResults(null);
  };

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (fines.length === 0) {
    return <div className="py-4 text-center text-muted-foreground">{t('customers.noTrafficFines')}</div>;
  }

  return (
    <div className="space-y-4">
      {validationResults && (
        <Alert 
          variant={validationResults.isValid ? "default" : "destructive"}
          className="mb-4"
        >
          <AlertTitle>
            {validationResults.isValid ? 'Validation Successful' : 'Validation Issues Found'}
          </AlertTitle>
          <AlertDescription>
            {validationResults.isValid ? (
              <p>All data relationships are valid.</p>
            ) : (
              <div>
                <p className="mb-2">The following issues were found:</p>
                <ul className="list-disc pl-5">
                  {validationResults.inconsistencies.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={clearValidation}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Violation #</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Violation</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fines.map((fine) => (
            <TableRow key={fine.id}>
              <TableCell className="font-medium">{fine.violationNumber}</TableCell>
              <TableCell>
                {fine.licensePlate}
                {fine.vehicleModel && (
                  <div className="text-xs text-muted-foreground">{fine.vehicleModel}</div>
                )}
              </TableCell>
              <TableCell>{formatDate(fine.violationDate)}</TableCell>
              <TableCell>{fine.violationCharge}</TableCell>
              <TableCell>{formatCurrency(fine.fineAmount)}</TableCell>
              <TableCell>
                {getStatusBadge(fine.paymentStatus)}
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => validateFineData(fine.id)}
                      >
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Validate data relationships</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
