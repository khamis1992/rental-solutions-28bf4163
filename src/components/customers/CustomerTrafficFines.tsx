
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { asTableId } from '@/lib/uuid-helpers'; 
import { formatCurrency } from '@/lib/utils';
import { ExclamationTriangleIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import { handleSupabaseResponse, hasData } from '@/utils/supabase-type-helpers';
import { CustomerInfo } from '@/types/customer';

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

export function CustomerTrafficFines({ customerId }: CustomerTrafficFinesProps) {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Record<string, VehicleInfo>>({});

  useEffect(() => {
    async function fetchData() {
      if (!customerId) return;

      try {
        setIsLoading(true);

        // First, get all leases for this customer
        const leaseResponse = await supabase
          .from('leases')
          .select('id')
          .eq('customer_id', customerId);

        if (!hasData(leaseResponse)) {
          console.error('Error fetching leases:', leaseResponse.error);
          setIsLoading(false);
          return;
        }

        const leases = leaseResponse.data;
        if (!leases.length) {
          setIsLoading(false);
          return;
        }

        // Get all traffic fines for these leases
        const leaseIds = leases.map(lease => lease.id);
        
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
        
        // Collect unique vehicle IDs
        const vehicleIds = Array.from(
          new Set(
            fineData
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

        setFines(fineData);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fines</CardTitle>
        <CardDescription>Fines associated with this customer</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : fines.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Violation #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.map((fine) => {
                // Only render fines with valid data
                if (!fine?.id) return null;
                
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
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Unpaid</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {fine.fine_location || 'N/A'}
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
            <p className="text-sm text-muted-foreground">This customer has no recorded traffic fines.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
