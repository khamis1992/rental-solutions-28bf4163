
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrafficFine, TrafficFineStatusType } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle, CheckCircle, Clock, X, HelpCircle } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerTrafficFinesProps {
  customerId: string;
}

interface VehicleInfo {
  make: string;
  model: string;
}

export function CustomerTrafficFines({ customerId }: CustomerTrafficFinesProps) {
  const { t } = useTranslation();
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      try {
        setLoading(true);
        
        if (!customerId) {
          throw new Error("Invalid customer ID");
        }
        
        // Step 1: First find all leases associated with this customer
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
          setLoading(false);
          return;
        }
        
        // Extract the lease IDs
        const leaseIds = leases.map(lease => lease.id);
        console.log(`Found ${leaseIds.length} leases for customer ${customerId}`, leaseIds);
        
        // Step 2: Fetch traffic fines associated with these lease IDs
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
            payment_date,
            vehicles:vehicle_id (make, model)
          `)
          .in('lease_id', leaseIds)
          .order('violation_date', { ascending: false });
          
        if (finesError) {
          console.error("Error fetching traffic fines:", finesError);
          throw new Error(`Could not retrieve traffic fines: ${finesError.message}`);
        }
        
        console.log(`Found ${trafficFines?.length || 0} traffic fines`);
            
        // Transform the data to match the TrafficFine interface
        const formattedFines = (trafficFines || []).map(fine => {
          // Safely access vehicle data
          let vehicleModel: string | undefined = undefined;
          
          if (fine.vehicles) {
            // Handle proper structure of vehicles data
            let vehicleInfo: VehicleInfo;
            
            if (Array.isArray(fine.vehicles)) {
              // It's an array, use the first element if it exists
              if (fine.vehicles.length > 0) {
                // Use type assertion to tell TypeScript this is a valid object
                const firstVehicle = fine.vehicles[0] as any;
                vehicleInfo = {
                  make: firstVehicle.make,
                  model: firstVehicle.model
                };
              } else {
                // Empty array, set default values
                vehicleInfo = {
                  make: '',
                  model: ''
                };
              }
            } else {
              // It's a direct object, use type assertion
              const vehicleObj = fine.vehicles as any;
              vehicleInfo = {
                make: vehicleObj.make,
                model: vehicleObj.model
              };
            }
            
            vehicleModel = `${vehicleInfo.make} ${vehicleInfo.model}`;
          }

          return {
            id: fine.id,
            violationNumber: fine.violation_number || `TF-${Math.floor(Math.random() * 10000)}`,
            licensePlate: fine.license_plate,
            vehicleModel,
            violationDate: new Date(fine.violation_date),
            fineAmount: fine.fine_amount,
            violationCharge: fine.violation_charge,
            paymentStatus: fine.payment_status as TrafficFineStatusType,
            location: fine.fine_location || '',
            vehicleId: fine.vehicle_id,
            paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined,
            customerId: customerId,
            leaseId: fine.lease_id
          };
        });
            
        setFines(formattedFines);
      } catch (err) {
        console.error('Error fetching traffic fines:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load traffic fines';
        setError(errorMessage);
        
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
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="mr-1 h-3 w-3" /> {t('trafficFines.status.paid')}</Badge>;
      case 'disputed':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300"><AlertTriangle className="mr-1 h-3 w-3" /> {t('trafficFines.status.disputed')}</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><X className="mr-1 h-3 w-3" /> {t('trafficFines.status.pending')}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-4">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('common.error')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (fines.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('trafficFines.noFines')}</h3>
          <p className="text-muted-foreground mb-6">{t('trafficFines.noFinesDesc')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">{t('trafficFines.totalFines', { count: fines.length })}</h3>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Violation #</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Violation</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>{fine.violationCharge || t('common.notProvided')}</TableCell>
                  <TableCell>{formatCurrency(fine.fineAmount)}</TableCell>
                  <TableCell>
                    {getStatusBadge(fine.paymentStatus)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {t('common.showing', { count: fines.length })}
          </p>
          <p className="text-sm font-medium">
            {t('common.total')}: {formatCurrency(fines.reduce((sum, fine) => sum + fine.fineAmount, 0))}
          </p>
        </div>
      </div>
    </Card>
  );
}
