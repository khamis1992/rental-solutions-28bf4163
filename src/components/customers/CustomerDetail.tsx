import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Mail, Phone, User, Car, FileText, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date-utils';
import { useAgreements, AgreementWithDetails } from '@/hooks/use-agreements';
import { CustomerTrafficFines } from './CustomerTrafficFines';

const CustomerDetail = ({ customerId }: { customerId: string }) => {
  const [customer, setCustomer] = useState<{
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAgreement } = useAgreements();
  const [activeAgreements, setActiveAgreements] = useState<AgreementWithDetails[]>([]);
  const [pastAgreements, setPastAgreements] = useState<AgreementWithDetails[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch customer data from Supabase
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', customerId)
          .single();

        if (customerError) {
          throw new Error(`Failed to fetch customer: ${customerError.message}`);
        }

        if (customerData) {
          setCustomer(customerData);
          const agreementQuery = getAgreement;
          const activeAgreement = await agreementQuery(customerId);

          if (activeAgreement) {
            setActiveAgreements([activeAgreement]);
          } else {
            setActiveAgreements([]);
          }
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  if (loading) {
    return <div className="text-center py-4">Loading customer details...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!customer) {
    return <div className="text-center py-4">Customer not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <User className="mr-2 h-5 w-5" />
            {customer.full_name}
          </CardTitle>
          <CardDescription>
            View customer details and manage agreements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${customer.email}`} className="hover:underline">
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone_number}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Customer Actions</h3>
              <div className="mt-2 space-y-2">
                <Button asChild>
                  <Link to="/agreements/new">
                    <FileText className="mr-2 h-4 w-4" />
                    Create New Agreement
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to={`/customers/${customerId}/edit`}>
                    <User className="mr-2 h-4 w-4" />
                    Edit Customer Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeAgreements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Agreement Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold">Vehicle Information</h3>
                <div className="mt-2 space-y-2">
                  {activeAgreements[0].vehicle && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Make/Model:</span>
                        <span>{activeAgreements[0].vehicle.make} {activeAgreements[0].vehicle.model} ({activeAgreements[0].vehicle.year})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">License Plate:</span>
                        <span>{activeAgreements[0].vehicle.license_plate}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Agreement Information</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agreement Number:</span>
                    <span>
                      <Link
                        to={`/agreements/${activeAgreements[0].id}`}
                        className="text-primary hover:underline flex items-center"
                      >
                        {activeAgreements[0].agreement_number}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span>{formatDate(new Date(activeAgreements[0].start_date as string))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date:</span>
                    <span>{formatDate(new Date(activeAgreements[0].end_date as string))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rent Amount:</span>
                    <span>{activeAgreements[0].rent_amount}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>
            View and manage traffic fines associated with this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerTrafficFines customerId={customerId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetail;
