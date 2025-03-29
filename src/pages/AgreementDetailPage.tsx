
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, deleteAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  
  // Use refs to track component lifecycle
  const isMounted = useRef(true);
  const dataFetchAttempted = useRef(false);

  // Fetch agreement data
  const fetchAgreementData = useCallback(async () => {
    if (!id || !isMounted.current || dataFetchAttempted.current) return;
    
    setIsLoading(true);
    dataFetchAttempted.current = true;
    
    try {
      console.log("Fetching agreement details for ID:", id);
      const data = await getAgreement(id);
      
      if (!isMounted.current) {
        return;
      }
      
      if (!data) {
        console.log("No agreement data found for ID:", id);
        setIsLoading(false);
        return;
      }
      
      setAgreement(data);
      console.log("Agreement data fetched successfully:", data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching agreement:", error);
      if (isMounted.current) {
        setInitializationError(error instanceof Error ? error : new Error('Unknown error'));
        setIsLoading(false);
        toast.error("Failed to load agreement details");
      }
    }
  }, [id, getAgreement]);

  // Initial data fetch
  useEffect(() => {
    fetchAgreementData();
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchAgreementData]);

  // Custom hooks for specific functionality - only call when agreement is available
  const { rentAmount, contractAmount } = useRentAmount(agreement, id);
  const { refreshTrigger, refreshAgreementData } = usePaymentGeneration(agreement, id);

  // Handle refreshing data when needed
  useEffect(() => {
    if (refreshTrigger > 0 && id && isMounted.current) {
      dataFetchAttempted.current = false; // Reset to allow re-fetching
      fetchAgreementData();
    }
  }, [refreshTrigger, id, fetchAgreementData]);

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

  if (initializationError) {
    return (
      <PageContainer
        title="Agreement Details"
        description="View and manage rental agreement details"
        backLink="/agreements"
      >
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2 text-red-600">Error loading agreement</h3>
          <p className="text-muted-foreground">
            {initializationError.message}
          </p>
          <button 
            onClick={() => {
              dataFetchAttempted.current = false;
              setInitializationError(null);
              fetchAgreementData();
            }}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageContainer>
    );
  }

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
        <AgreementDetail 
          agreement={agreement} 
          onDelete={handleDelete}
          contractAmount={contractAmount}
          rentAmount={rentAmount}
          onPaymentDeleted={refreshAgreementData}
        />
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
          <p className="text-muted-foreground">
            The agreement you're looking for doesn't exist or has been removed.
          </p>
        </div>
      )}
    </PageContainer>
  );
};

export default AgreementDetailPage;
