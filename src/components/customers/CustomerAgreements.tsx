
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Car, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface Agreement {
  id: string;
  agreement_number: string;
  status: string;
  rent_amount: number;
  start_date: string;
  end_date: string;
  vehicle_id: string;
  vehicle?: {
    make: string;
    model: string;
    license_plate: string;
  };
}

interface CustomerAgreementsProps {
  customerId: string;
}

export function CustomerAgreements({ customerId }: CustomerAgreementsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgreements = async () => {
      if (!customerId) return;
      
      try {
        setLoading(true);
        
        // Fetch agreements with vehicle information
        const { data, error } = await supabase
          .from('leases')
          .select(`
            id, 
            agreement_number, 
            status, 
            rent_amount, 
            start_date, 
            end_date, 
            vehicle_id,
            vehicles:vehicle_id (
              make, 
              model, 
              license_plate
            )
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching customer agreements:', error);
          setError(t('agreements.fetchError'));
          return;
        }
        
        // Transform the data to match our Agreement interface
        const formattedAgreements = data.map(agreement => ({
          id: agreement.id,
          agreement_number: agreement.agreement_number,
          status: agreement.status,
          rent_amount: agreement.rent_amount,
          start_date: agreement.start_date,
          end_date: agreement.end_date,
          vehicle_id: agreement.vehicle_id,
          vehicle: agreement.vehicles
        }));
        
        setAgreements(formattedAgreements);
      } catch (err) {
        console.error('Error in fetchAgreements:', err);
        setError(t('common.unexpectedError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgreements();
  }, [customerId, t]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500">{t('agreements.status.active')}</Badge>;
      case 'ended':
        return <Badge variant="outline">{t('agreements.status.ended')}</Badge>;
      case 'pending_payment':
        return <Badge className="bg-yellow-500">{t('agreements.status.pendingPayment')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('agreements.status.cancelled')}</Badge>;
      default:
        return <Badge variant="secondary">{status || t('common.unknown')}</Badge>;
    }
  };

  const handleViewAgreement = (agreementId: string) => {
    navigate(`/agreements/${agreementId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (agreements.length === 0) {
    return (
      <Alert>
        <AlertDescription>{t('customers.noAgreements')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('agreements.number')}</TableHead>
              <TableHead>{t('agreements.vehicle')}</TableHead>
              <TableHead>{t('agreements.dates')}</TableHead>
              <TableHead>{t('agreements.rentAmount')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreements.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell className="font-medium">{agreement.agreement_number}</TableCell>
                <TableCell>
                  {agreement.vehicle ? (
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {agreement.vehicle.make} {agreement.vehicle.model}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {agreement.vehicle.license_plate}
                      </span>
                    </div>
                  ) : (
                    t('common.notAvailable')
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(new Date(agreement.start_date))}
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(new Date(agreement.end_date))}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(agreement.rent_amount)}
                  <div className="text-xs text-muted-foreground">
                    {t('agreements.monthly')}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewAgreement(agreement.id)}
                  >
                    {t('common.view')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
