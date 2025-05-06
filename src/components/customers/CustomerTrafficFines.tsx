import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerDetails {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  driver_license?: string;
}

interface TrafficFine {
  id: string;
  violation_number: string;
  license_plate: string;
  violation_date: string;
  fine_amount: number;
  violation_charge: string;
  payment_status: string;
  fine_location: string;
}

interface CustomerTrafficFinesProps {
  customerId: string;
}

export const CustomerTrafficFines: React.FC<CustomerTrafficFinesProps> = ({ customerId }) => {
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    id: '',
    full_name: '',
    email: '',
    phone_number: '',
  });
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerAndFines = async () => {
      setIsLoading(true);
      try {
        // Fix: Use type assertion to handle type issues
        const { data: customer } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', customerId as any)
          .single();

        // Fix: Safely access properties with null checks
        if (customer) {
          const safeCustomer = customer as any;
          setCustomerDetails({
            id: safeCustomer.id || '',
            full_name: safeCustomer.full_name || '',
            email: safeCustomer.email || '', 
            phone_number: safeCustomer.phone_number || '',
            driver_license: safeCustomer.driver_license,
          });

          // Get leases for this customer with type assertion
          const { data: leases } = await supabase
            .from('leases')
            .select('*')
            .eq('customer_id', customerId as any);

          if (leases && leases.length > 0) {
            const leaseIds = leases.map((lease: any) => lease.id);
            const { data: fines } = await supabase
              .from('traffic_fines')
              .select('*')
              .in('lease_id', leaseIds);

            setTrafficFines(fines as any[] || []);
          } else {
            setTrafficFines([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerAndFines();
  }, [customerId]);

  return (
    <div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Violation</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Violation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trafficFines.map((fine) => (
                <TableRow key={fine.id}>
                  <TableCell className="font-medium">{fine.violation_charge}</TableCell>
                  <TableCell>{fine.violation_date}</TableCell>
                  <TableCell>{fine.fine_amount}</TableCell>
                  <TableCell>
                    <Badge variant={fine.payment_status === 'paid' ? 'success' : 'destructive'}>
                      {fine.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{fine.fine_location}</TableCell>
                </TableRow>
              ))}
              {trafficFines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No traffic fines found for this customer.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
