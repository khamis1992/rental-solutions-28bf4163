
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { hasData } from '@/utils/supabase-type-helpers';
import { ExclamationTriangleIcon } from '@/components/icons/radix-shim';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CustomerTrafficFinesProps {
  customerId: string;
}

type TrafficFine = {
  id: string;
  violation_number: string;
  license_plate: string;
  vehicle_id: string;
  violation_date: string;
  fine_amount: number;
  violation_charge: string;
  payment_status: string;
  fine_location: string;
  lease_id: string;
  payment_date: string | null;
};

type VehicleInfo = {
  id: string;
  make: string;
  model: string;
};

type LeaseInfo = {
  id: string;
  start_date: string;
  end_date: string | null;
  agreement_number: string;
};

export function CustomerTrafficFines({ customerId }: CustomerTrafficFinesProps) {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Record<string, VehicleInfo>>({});
  const [leases, setLeases] = useState<Record<string, LeaseInfo>>({});
  const [invalidFines, setInvalidFines] = useState<TrafficFine[]>([]);
  const [showInvalidFines, setShowInvalidFines] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!customerId) return;

      try {
        setIsLoading(true);

        // First, get all leases for this customer
        const leaseResponse = await supabase
          .from('leases')
          .select('id, start_date, end_date, agreement_number')
          .eq('customer_id', customerId);

        if (!hasData(leaseResponse)) {
          console.error('Error fetching leases:', leaseResponse.error);
          setIsLoading(false);
          return;
        }

        const leaseData = leaseResponse.data;
        if (!leaseData.length) {
          setIsLoading(false);
          return;
        }

        // Create a lease lookup object
        const leaseMap: Record<string, LeaseInfo> = {};
        leaseData.forEach(lease => {
          if (lease && lease.id) {
            leaseMap[lease.id] = {
              id: lease.id,
              start_date: lease.start_date,
              end_date: lease.end_date,
              agreement_number: lease.agreement_number
            };
          }
        });
        setLeases(leaseMap);

        // Get all traffic fines for these leases
        const leaseIds = leaseData.map(lease => lease.id);
        
        const finesResponse = await supabase
          .from('traffic_fines')
          .select('*')
          .in('lease_id', leaseIds);

        if (!hasData(finesResponse)) {
          console.error('Error fetching fines:', finesResponse.error);
          setIsLoading(false);
          return;
        }

        const fineData = finesResponse.data as TrafficFine[];
        
        // Separate valid and invalid fines
        const validFines: TrafficFine[] = [];
        const invalidFines: TrafficFine[] = [];

        // Verify that violation dates fall within lease periods
        fineData.forEach(fine => {
          if (!fine.lease_id || !fine.violation_date) {
            invalidFines.push(fine);
            return;
          }
          
          const lease = leaseMap[fine.lease_id];
          if (!lease) {
            invalidFines.push(fine);
            return;
          }
          
          const violationDate = new Date(fine.violation_date);
          const startDate = new Date(lease.start_date);
          const endDate = lease.end_date ? new Date(lease.end_date) : new Date();
          
          if (violationDate >= startDate && violationDate <= endDate) {
            validFines.push(fine);
          } else {
            invalidFines.push(fine);
          }
        });
        
        console.log(`Customer ${customerId}: Found ${validFines.length} valid fines and ${invalidFines.length} invalid fines`);

        // Collect unique vehicle IDs
        const vehicleIds = Array.from(
          new Set(
            [...validFines, ...invalidFines]
              .filter(fine => fine && fine.vehicle_id)
              .map(fine => fine.vehicle_id)
          )
        );
        
        // Get vehicle info
        if (vehicleIds.length > 0) {
          const vehiclesResponse = await supabase
            .from('vehicles')
            .select('id, make, model')
            .in('id', vehicleIds);

          if (hasData(vehiclesResponse)) {
            const vehicleData = vehiclesResponse.data;
            const vehicleMap: Record<string, VehicleInfo> = {};
            
            vehicleData.forEach(vehicle => {
              vehicleMap[vehicle.id] = {
                id: vehicle.id,
                make: vehicle.make,
                model: vehicle.model
              };
            });
            
            setVehicles(vehicleMap);
          }
        }

        setFines(validFines);
        setInvalidFines(invalidFines);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, [customerId]);

  const getVehicleInfo = (vehicleId: string | null): string => {
    if (!vehicleId || !vehicles[vehicleId]) return 'Unknown Vehicle';
    const vehicle = vehicles[vehicleId];
    return `${vehicle.make} ${vehicle.model}`;
  };

  const getLeaseInfo = (leaseId: string | null): string => {
    if (!leaseId || !leases[leaseId]) return 'N/A';
    return leases[leaseId].agreement_number || 'Unknown Agreement';
  };

  // Calculate the fines to display based on the toggle
  const finesToDisplay = showInvalidFines ? [...fines, ...invalidFines] : fines;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Traffic Fines</CardTitle>
            <CardDescription>Fines associated with this customer</CardDescription>
          </div>
          {invalidFines.length > 0 && (
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox"
                className="h-4 w-4" 
                checked={showInvalidFines}
                onChange={(e) => setShowInvalidFines(e.target.checked)}
              />
              <span className="text-sm">Show all fines including invalid dates</span>
            </label>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            {invalidFines.length > 0 && (
              <Alert variant="warning" className="mb-4">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Invalid Fine Assignments</AlertTitle>
                <AlertDescription>
                  {invalidFines.length} traffic {invalidFines.length === 1 ? 'fine is' : 'fines are'} assigned to this customer but 
                  {invalidFines.length === 1 ? ' its violation date falls' : ' their violation dates fall'} outside the lease periods. 
                  {!showInvalidFines && ' These are hidden by default.'}
                </AlertDescription>
              </Alert>
            )}

            {finesToDisplay.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Violation #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Agreement #</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Validity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finesToDisplay.map((fine) => {
                    // Only render fines with valid data
                    if (!fine?.id) return null;

                    // Check if this is a valid fine (violation date within lease period)
                    const isValid = fines.some(validFine => validFine.id === fine.id);
                    
                    return (
                      <TableRow key={fine.id}>
                        <TableCell>{fine.violation_number}</TableCell>
                        <TableCell>
                          {fine.violation_date ? format(new Date(fine.violation_date), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>{getVehicleInfo(fine.vehicle_id)}</TableCell>
                        <TableCell>{fine.license_plate}</TableCell>
                        <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
                        <TableCell>
                          {fine.payment_status === 'paid' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>
                          ) : fine.payment_status === 'pending' ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                          ) : fine.payment_status === 'disputed' ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Disputed</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Unknown</Badge>
                          )}
                        </TableCell>
                        <TableCell>{getLeaseInfo(fine.lease_id)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {fine.fine_location || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {isValid ? (
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
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-muted/30">
                <ExclamationTriangleIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No Traffic Fines</h3>
                <p className="text-sm text-muted-foreground">This customer has no valid traffic fines.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
