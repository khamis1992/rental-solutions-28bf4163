
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePayments } from '@/hooks/use-payments';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, deleteAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);

  // Pass the agreement object directly and the ID as a fallback
  const { rentAmount, contractAmount } = useRentAmount(agreement, id);
  
  // Get payments data
  const { payments, isLoadingPayments, fetchPayments } = usePayments(id || '', null);

  const fetchAgreementData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await getAgreement(id);
      
      if (data) {
        // Convert SimpleAgreement to Agreement type
        setAgreement(adaptSimpleToFullAgreement(data));
        // Fetch payments when agreement data is loaded
        fetchPayments();
      } else {
        toast.error("Agreement not found");
        navigate("/agreements");
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      toast.error('Failed to load agreement details');
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  };

  useEffect(() => {
    if (id && (!hasAttemptedFetch || refreshTrigger > 0)) {
      fetchAgreementData();
    }
  }, [id, refreshTrigger]);

  const handleDelete = async (agreementId: string) => {
    try {
      await deleteAgreement.mutateAsync(agreementId);
      toast.success("Agreement deleted successfully");
      navigate("/agreements");
    } catch (error) {
      console.error("Error deleting agreement:", error);
      toast.error("Failed to delete agreement");
    }
  };

  const refreshAgreementData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGenerateDocument = () => {
    setIsDocumentDialogOpen(true);
  };

  return (
    <PageContainer
      title="Agreement Details"
      description="View and manage rental agreement details"
      backLink="/agreements"
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full md:col-span-2" />
          </div>
        </div>
      ) : agreement ? (
        <>
          <AgreementDetail 
            agreement={agreement}
            onDelete={handleDelete}
            rentAmount={rentAmount}
            contractAmount={contractAmount}
            onPaymentDeleted={refreshAgreementData}
            onDataRefresh={refreshAgreementData}
            onGenerateDocument={handleGenerateDocument}
          />
          
          <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
            <DialogContent className="max-w-4xl">
              <InvoiceGenerator 
                recordType="agreement" 
                recordId={agreement.id} 
                onClose={() => setIsDocumentDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
          <p className="text-muted-foreground mb-4">
            The agreement you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="outline" onClick={() => navigate("/agreements")}>
            Return to Agreements
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default AgreementDetailPage;
