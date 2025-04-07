import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAgreements } from '@/hooks/use-agreements';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Car, User, CalendarDays, CircleDollarSign, Edit, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, AlertTriangle } from 'lucide-react';

const AgreementDetailPage = () => {
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const { getAgreement } = useAgreements();

  useEffect(() => {
    const fetchAgreement = async () => {
      if (!id) return;
    
      setLoading(true);
      try {
        const data = await getAgreement(id);
        if (data) {
          setAgreement(data);
        } else {
          setError('Agreement not found');
        }
      } catch (err) {
        console.error('Error fetching agreement details:', err);
        setError('Failed to load agreement details');
      } finally {
        setLoading(false);
      }
    };

    fetchAgreement();
  }, [id, getAgreement]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading agreement details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Failed to load agreement details. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agreement) {
    return <div className="flex items-center justify-center h-screen">Agreement not found.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <Button asChild variant="ghost">
            <Link to="/agreements" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agreements
            </Link>
          </Button>
          <h2 className="text-3xl font-bold mt-2">Agreement Details</h2>
        </div>
        <Button asChild variant="outline">
          <Link to={`/agreements/edit/${agreement.id}`} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" />
            Edit Agreement
          </Link>
        </Button>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Agreement Information
          </CardTitle>
          <CardDescription>Details about this rental agreement</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-semibold">Agreement Number</h4>
            <p>{agreement.agreement_number || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-semibold">Status</h4>
            <Badge
              variant={
                agreement.status === 'active' ? 'success' :
                agreement.status === 'pending' ? 'warning' :
                agreement.status === 'cancelled' ? 'destructive' :
                agreement.status === 'closed' ? 'outline' :
                agreement.status === 'expired' ? 'secondary' :
                'default'
              }
              className="capitalize"
            >
              {agreement.status}
            </Badge>
          </div>
          <div>
            <h4 className="font-semibold">Start Date</h4>
            <p>{agreement.start_date ? format(new Date(agreement.start_date), 'PPP') : 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-semibold">End Date</h4>
            <p>{agreement.end_date ? format(new Date(agreement.end_date), 'PPP') : 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-semibold">Total Amount</h4>
            <p>{agreement.total_amount ? `QAR ${agreement.total_amount.toLocaleString()}` : 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-semibold">Deposit Amount</h4>
            <p>{agreement.deposit_amount ? `QAR ${agreement.deposit_amount.toLocaleString()}` : 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="mr-2 h-5 w-5" />
            Vehicle Information
          </CardTitle>
          <CardDescription>Details about the rented vehicle</CardDescription>
        </CardHeader>
        <CardContent>
          {agreement.vehicles ? (
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold">Make & Model</h4>
                <p>{agreement.vehicles.make} {agreement.vehicles.model}</p>
              </div>
              <div>
                <h4 className="font-semibold">License Plate</h4>
                <p>{agreement.vehicles.license_plate}</p>
              </div>
              <div>
                <h4 className="font-semibold">Year</h4>
                <p>{agreement.vehicles.year}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No vehicle information available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Customer Information
          </CardTitle>
          <CardDescription>Details about the customer renting the vehicle</CardDescription>
        </CardHeader>
        <CardContent>
          {agreement.customers ? (
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold">Full Name</h4>
                <p>{agreement.customers.full_name}</p>
              </div>
              <div>
                <h4 className="font-semibold">Email</h4>
                <p>{agreement.customers.email}</p>
              </div>
              <div>
                <h4 className="font-semibold">Phone</h4>
                <p>{agreement.customers.phone}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No customer information available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5" />
            Rental Period
          </CardTitle>
          <CardDescription>Start and end dates of the rental agreement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold">Start Date</h4>
              <p>{agreement.start_date ? format(new Date(agreement.start_date), 'PPP') : 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold">End Date</h4>
              <p>{agreement.end_date ? format(new Date(agreement.end_date), 'PPP') : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgreementDetailPage;
