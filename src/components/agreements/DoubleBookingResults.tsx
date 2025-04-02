
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileX, Loader2 } from 'lucide-react';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { Link } from 'react-router-dom';

export function DoubleBookingResults() {
  const [recentlyCancelled, setRecentlyCancelled] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyCancelled = async () => {
      setIsLoading(true);
      try {
        // Get agreements cancelled in the last 24 hours
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data, error } = await supabase
          .from('leases')
          .select(`
            id,
            agreement_number,
            status,
            updated_at,
            vehicle_id,
            vehicles:vehicle_id (make, model, license_plate),
            customers:customer_id (full_name, email, phone_number)
          `)
          .eq('status', AgreementStatus.CANCELLED)
          .gt('updated_at', twentyFourHoursAgo.toISOString())
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setRecentlyCancelled(data || []);
      } catch (error) {
        console.error("Error fetching recently cancelled agreements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentlyCancelled();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileX className="mr-2 h-5 w-5 text-destructive" />
          Recently Cancelled Agreements
        </CardTitle>
        <CardDescription>
          Agreements that were cancelled within the last 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentlyCancelled.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No recently cancelled agreements found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement #</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cancelled At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentlyCancelled.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell>
                      <Link to={`/agreements/${agreement.id}`} className="font-medium text-primary hover:underline">
                        {agreement.agreement_number}
                      </Link>
                      <Badge className="ml-2" variant="destructive">Cancelled</Badge>
                    </TableCell>
                    <TableCell>
                      {agreement.vehicles ? (
                        <>
                          {agreement.vehicles.make} {agreement.vehicles.model} 
                          <span className="ml-1 font-medium">({agreement.vehicles.license_plate})</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {agreement.customers ? (
                        <div>
                          <div>{agreement.customers.full_name}</div>
                          <div className="text-xs text-muted-foreground">{agreement.customers.phone_number}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {agreement.updated_at ? (
                        format(new Date(agreement.updated_at), 'MMM d, yyyy h:mm a')
                      ) : (
                        'Unknown'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
