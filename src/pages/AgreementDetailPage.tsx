
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { PageContainer } from '@/components/layout/PageContainer';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CalendarCheck, FileCheck, FileText, Ban } from 'lucide-react';
import { AgreementStatus, EnhancedAnalysisResult } from '@/types/agreement';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Import these functions when they're available in the codebase
const manuallyRunPaymentMaintenance = async (leaseId: string) => {
  console.log("Payment maintenance not implemented yet");
  return { success: true, message: "Not implemented yet" };
};

const fixAgreementPayments = async (leaseId: string) => {
  console.log("Fix agreement payments not implemented yet");
  return { success: true, message: "Not implemented yet" };
};

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement } = useAgreements({});
  const [state, setState] = useState<{
    agreement: any | null;
    loading: boolean;
    error: string | null;
    enhancedAnalysis: EnhancedAnalysisResult | null;
    isAnalyzing: boolean;
  }>({
    agreement: null,
    loading: true,
    error: null,
    enhancedAnalysis: null,
    isAnalyzing: false
  });

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isFixingPayments, setIsFixingPayments] = useState(false);
  
  useEffect(() => {
    const loadAgreement = async () => {
      if (!id) return;
      
      try {
        const agreement = await getAgreement(id);
        setState(prev => ({ ...prev, agreement, loading: false }));
      } catch (err) {
        setState(prev => ({ 
          ...prev, 
          error: err instanceof Error ? err.message : 'Failed to load agreement details',
          loading: false
        }));
      }
    };
    
    loadAgreement();
  }, [id, getAgreement]);

  const handleFixPayments = async () => {
    if (!state.agreement?.id) return;
    
    setIsFixingPayments(true);
    try {
      const result = await fixAgreementPayments(state.agreement.id);
      if (result.success) {
        toast.success(result.message || "Payments fixed successfully");
      } else {
        toast.error(result.message || "Failed to fix payments");
      }
    } catch (err) {
      toast.error("An error occurred while fixing payments");
      console.error(err);
    } finally {
      setIsFixingPayments(false);
    }
  };
  
  const handleRunMaintenance = async () => {
    if (!state.agreement?.id) return;
    
    setIsConfirmDialogOpen(false);
    setState(prev => ({ ...prev, isAnalyzing: true }));
    
    try {
      const result = await manuallyRunPaymentMaintenance(state.agreement.id);
      if (result.success) {
        toast.success(result.message || "Maintenance completed successfully");
      } else {
        toast.error(result.message || "Maintenance failed");
      }
    } catch (err) {
      toast.error("An error occurred during maintenance");
      console.error(err);
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleStatusChange = async (newStatus: AgreementStatus) => {
    if (!state.agreement?.id) return;
    
    try {
      const { error } = await supabase
        .from('leases')
        .update({ status: newStatus.toLowerCase() })
        .eq('id', state.agreement.id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      setState(prev => ({
        ...prev,
        agreement: { ...prev.agreement, status: newStatus }
      }));
      
      toast.success(`Agreement status updated to ${newStatus}`);
    } catch (err) {
      toast.error(`Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  if (state.loading) {
    return (
      <PageContainer title="Agreement Details" backLink="/agreements">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }
  
  if (state.error || !state.agreement) {
    return (
      <PageContainer title="Agreement Details" backLink="/agreements">
        <div className="bg-destructive/10 p-4 rounded-md flex items-center">
          <AlertCircle className="h-6 w-6 mr-2 text-destructive" />
          <div>
            <h3 className="font-medium">Error</h3>
            <p className="text-sm">{state.error || "Agreement not found"}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const { agreement } = state;
  
  return (
    <PageContainer 
      title={`Agreement ${agreement.agreement_number || agreement.id.substring(0, 8)}`}
      backLink="/agreements"
      actions={
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsConfirmDialogOpen(true)}
            disabled={state.isAnalyzing}
          >
            {state.isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Maintenance...
              </>
            ) : (
              <>
                <CalendarCheck className="mr-2 h-4 w-4" />
                Run Payment Maintenance
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleFixPayments}
            disabled={isFixingPayments}
          >
            {isFixingPayments ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Fix Payments
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => navigate(`/agreements/edit/${agreement.id}`)}
            variant="secondary"
          >
            <FileText className="mr-2 h-4 w-4" />
            Edit Agreement
          </Button>
          
          {agreement.status !== AgreementStatus.CANCELLED && (
            <Button 
              variant="destructive"
              onClick={() => handleStatusChange(AgreementStatus.CANCELLED)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel Agreement
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agreement Details</CardTitle>
            <CardDescription>
              Status: <Badge variant={
                agreement.status === AgreementStatus.ACTIVE ? "success" : 
                agreement.status === AgreementStatus.DRAFT ? "secondary" : 
                agreement.status === AgreementStatus.PENDING ? "warning" : 
                "destructive"
              }>{agreement.status}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
              <p>{new Date(agreement.start_date).toLocaleDateString()} - {new Date(agreement.end_date).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
              <p>${agreement.total_amount?.toFixed(2) || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Deposit</h3>
              <p>${agreement.deposit_amount?.toFixed(2) || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p>{agreement.customers?.full_name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
              <p>
                {agreement.customers?.email && <span className="block">{agreement.customers.email}</span>}
                {agreement.customers?.phone_number && <span className="block">{agreement.customers.phone_number}</span>}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Driver License</h3>
              <p>{agreement.customers?.driver_license || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Vehicle</h3>
              <p>{agreement.vehicles ? `${agreement.vehicles.make} ${agreement.vehicles.model} (${agreement.vehicles.year})` : 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">License Plate</h3>
              <p>{agreement.vehicles?.license_plate || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">VIN</h3>
              <p>{agreement.vehicles?.vin || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{agreement.notes || 'No notes available'}</p>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Created: {new Date(agreement.created_at).toLocaleString()}
              {agreement.updated_at && ` • Updated: ${new Date(agreement.updated_at).toLocaleString()}`}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Payment Maintenance?</AlertDialogTitle>
            <AlertDialogDescription>
              This will check and generate any missing payments for this agreement.
              This operation can take some time to complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRunMaintenance}>
              Run Maintenance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default AgreementDetailPage;
