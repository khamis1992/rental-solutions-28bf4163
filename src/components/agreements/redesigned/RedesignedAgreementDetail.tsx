import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { usePaymentScheduleManagement } from '@/hooks/payment/use-payment-schedule-management';
import { Agreement, AgreementStatus } from '@/types/agreement';
import { AgreementOverviewCard } from './tabs/AgreementOverviewCard';
import { PaymentManagementCard } from './tabs/PaymentManagementCard';
import { DocumentsCard } from './tabs/DocumentsCard';
import { SettingsCard } from './tabs/SettingsCard';
import { Loader2, ArrowLeft, Edit, Car, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

const RedesignedAgreementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { getAgreementDetails, updateAgreement } = useAgreementService();
  const { generatePaymentSchedule, isGenerating } = usePaymentScheduleManagement(id);

  useEffect(() => {
    const loadAgreement = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await getAgreementDetails(id);
        // Ensure agreement_type is properly typed
        const typedAgreement: Agreement = {
          ...data,
          agreement_type: data.agreement_type || 'short_term'
        };
        setAgreement(typedAgreement);
      } catch (error) {
        console.error('Error loading agreement:', error);
        toast.error('Failed to load agreement details');
      } finally {
        setIsLoading(false);
      }
    };

    loadAgreement();
  }, [id, getAgreementDetails]);

  const handleStatusUpdate = async (status: AgreementStatus): Promise<void> => {
    if (!agreement) return;

    try {
      await updateAgreement({
        id: agreement.id,
        data: { status }
      });
      
      setAgreement(prev => prev ? { ...prev, status } : null);
      toast.success('Agreement status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update agreement status');
    }
  };

  const handleRegenerateSchedule = async (): Promise<void> => {
    if (!agreement) return;

    try {
      await generatePaymentSchedule(
        new Date(agreement.start_date),
        new Date(agreement.end_date),
        agreement.rent_amount || 0,
        agreement.payment_frequency || 'monthly',
        agreement.payment_day || 1
      );
      toast.success('Payment schedule regenerated successfully');
    } catch (error) {
      console.error('Error regenerating schedule:', error);
      toast.error('Failed to regenerate payment schedule');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Agreement not found</p>
        <Button onClick={() => navigate('/agreements')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agreements
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate duration and rent amount for the overview card
  const duration = differenceInDays(new Date(agreement.end_date), new Date(agreement.start_date));
  const rentAmount = agreement.rent_amount || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/agreements')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Agreement {agreement.agreement_number || agreement.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              Created {format(new Date(agreement.created_at), 'PPP')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(agreement.status)}>
            {agreement.status}
          </Badge>
          <Button
            variant="outline"
            onClick={() => navigate(`/agreements/${agreement.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Customer</p>
                <p className="text-xs text-muted-foreground">
                  {agreement.customers?.full_name || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Vehicle</p>
                <p className="text-xs text-muted-foreground">
                  {agreement.vehicles ? `${agreement.vehicles.make} ${agreement.vehicles.model}` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm font-medium">Monthly Rent</p>
              <p className="text-lg font-bold">
                {formatCurrency(agreement.rent_amount || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm font-medium">Total Amount</p>
              <p className="text-lg font-bold">
                {formatCurrency(agreement.total_amount || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AgreementOverviewCard 
            agreement={agreement} 
            duration={duration}
            rentAmount={rentAmount}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentManagementCard 
            agreement={agreement}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentsCard 
            agreement={agreement}
            onEdit={() => {}}
            onDownloadPdf={() => {}}
            onGenerateDocument={() => {}}
            onDelete={() => {}}
            isGeneratingPdf={false}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SettingsCard 
            agreement={agreement}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RedesignedAgreementDetail;
