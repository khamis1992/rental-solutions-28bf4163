
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { TrafficFine, useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgreementTrafficFinesProps {
  agreementId: string;
}

const AgreementTrafficFines: React.FC<AgreementTrafficFinesProps> = ({ agreementId }) => {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrafficFines = async () => {
      setIsLoading(true);
      try {
        // Get traffic fines associated with this agreement
        const { data, error } = await supabase
          .from('traffic_fines')
          .select('*')
          .eq('lease_id', agreementId);

        if (error) throw error;

        // Format the data to match our TrafficFine type
        const formattedFines = data.map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number,
          violationDate: fine.violation_date,
          licensePlate: fine.license_plate,
          fineAmount: fine.fine_amount,
          paymentStatus: fine.payment_status || 'pending',
          location: fine.location,
          violationCharge: fine.violation_charge,
          customerId: fine.customer_id,
          customerName: '',  // Will be filled if needed
          customerPhone: '', // Will be filled if needed
          paymentDate: fine.payment_date,
          lease_id: fine.lease_id
        }));

        setTrafficFines(formattedFines);
      } catch (err) {
        console.error('Error fetching traffic fines:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (agreementId) {
      fetchTrafficFines();
    }
  }, [agreementId]);

  const getTotalAmount = () => {
    return trafficFines.reduce((total, fine) => total + fine.fineAmount, 0);
  };

  const getPaidAmount = () => {
    return trafficFines
      .filter(fine => fine.paymentStatus === 'paid')
      .reduce((total, fine) => total + fine.fineAmount, 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'disputed':
        return <Badge variant="warning">Disputed</Badge>;
      default:
        return <Badge variant="destructive">Pending</Badge>;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Traffic Fines</CardTitle>
            <CardDescription>
              Traffic violations associated with this agreement
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/traffic-fines/add')}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Fine
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">Loading traffic fines...</div>
        ) : trafficFines.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No traffic fines found for this agreement</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Total Fines</div>
                <div className="text-2xl font-bold">{trafficFines.length}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="text-2xl font-bold">{formatCurrency(getTotalAmount())}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Paid Amount</div>
                <div className="text-2xl font-bold">{formatCurrency(getPaidAmount())}</div>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Violation #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trafficFines.map((fine) => (
                    <TableRow key={fine.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                          {fine.violationNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(fine.violationDate)}
                      </TableCell>
                      <TableCell>
                        <div>Location: {fine.location || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">
                          Charge: {fine.violationCharge || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(fine.fineAmount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(fine.paymentStatus)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AgreementTrafficFines;
