
import React from 'react';
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgreements } from '@/hooks/use-agreements';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date-utils';
import { AlertCircle, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import AgreementPayments from '@/components/agreements/AgreementPayments';
import AgreementDocuments from '@/components/agreements/AgreementDocuments';
import AgreementVehicleDetails from '@/components/agreements/AgreementVehicleDetails';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { getAgreement, isAgreementLoading } = useAgreements();
  const [agreement, setAgreement] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState("details");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAgreement = async () => {
      try {
        if (id) {
          const data = await getAgreement(id);
          setAgreement(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch agreement details');
      }
    };

    fetchAgreement();
  }, [id, getAgreement]);

  const handlePaymentUpdate = () => {
    if (id) {
      getAgreement(id).then(data => setAgreement(data));
    }
  };

  if (isAgreementLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  if (!agreement) {
    return (
      <PageContainer>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Agreement Not Found</AlertTitle>
          <AlertDescription>The requested agreement does not exist or has been removed.</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <SectionHeader
          title={`Agreement ${agreement.agreement_number || ''}`}
          description={`Created on ${formatDate(new Date(agreement.created_at))}`}
          icon={FileText}
        />
        <Button asChild>
          <Link to={`/agreements/${agreement.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit Agreement
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Information</CardTitle>
              <CardDescription>Agreement details and status information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Customer</h3>
                <p>{agreement.customer?.full_name || 'Not assigned'}</p>
                {agreement.customer?.email && <p className="text-sm text-muted-foreground">{agreement.customer.email}</p>}
                {agreement.customer?.phone_number && <p className="text-sm text-muted-foreground">{agreement.customer.phone_number}</p>}
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Vehicle</h3>
                <p>{agreement.vehicle ? `${agreement.vehicle.make} ${agreement.vehicle.model} (${agreement.vehicle.year})` : 'Not assigned'}</p>
                <p className="text-sm text-muted-foreground">{agreement.vehicle?.license_plate || ''}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Period</h3>
                <p>From {formatDate(new Date(agreement.start_date))} to {formatDate(new Date(agreement.end_date))}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    agreement.status === 'active' ? 'bg-green-500' : 
                    agreement.status === 'pending' || agreement.status === 'pending_payment' || agreement.status === 'pending_deposit' ? 'bg-yellow-500' : 
                    'bg-gray-500'
                  }`}></span>
                  <span className="capitalize">{agreement.status?.replace('_', ' ') || 'Unknown'}</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <p>Rent Amount: ${agreement.rent_amount?.toLocaleString()}</p>
                <p>Total Amount: ${agreement.total_amount?.toLocaleString()}</p>
                {agreement.security_deposit_amount && (
                  <p>Security Deposit: ${agreement.security_deposit_amount.toLocaleString()}</p>
                )}
              </div>
              
              {agreement.notes && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm">{agreement.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <AgreementPayments 
            agreementId={agreement.id} 
            isLoading={false}
            onPaymentUpdate={handlePaymentUpdate}
          />
        </TabsContent>

        <TabsContent value="vehicle">
          <AgreementVehicleDetails 
            vehicle={agreement.vehicle}
            isLoading={false}
          />
        </TabsContent>

        <TabsContent value="documents">
          <AgreementDocuments 
            agreementId={agreement.id}
            documents={agreement.documents}
            isLoading={false}
            onUpload={handlePaymentUpdate}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default AgreementDetailPage;
