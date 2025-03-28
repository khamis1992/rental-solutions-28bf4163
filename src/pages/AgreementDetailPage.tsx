
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useAgreementInitialization } from '@/hooks/use-agreement-initialization';
import { useAgreementPayments } from '@/hooks/use-agreement-payments';
import { useSpecialAgreementHandler } from '@/hooks/use-special-agreement-handler';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, deleteAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fetchAttemptedRef = useRef(false);

  // System initialization - only happens once
  const { isInitialized } = useAgreementInitialization();
  
  // Payments and related data - depends on system initialization
  const { 
    payments, 
    isLoadingPayments, 
    rentAmount, 
    contractAmount,
    fetchPayments
  } = useAgreementPayments({
    agreementId: id,
    isInitialized,
    refreshTrigger
  });
  
  // Special agreement handling (for MR202462) - only runs once after initialization
  useSpecialAgreementHandler(id, agreement?.agreement_number, isInitialized);

  // Function to manually refresh the agreement data
  const refreshAgreementData = useCallback(() => {
    console.log("Refreshing agreement data...");
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Fetch agreement data - separated from other data fetching operations
  useEffect(() => {
    let isMounted = true;
    
    const fetchAgreement = async () => {
      if (!id || !isInitialized || fetchAttemptedRef.current) return;
      
      fetchAttemptedRef.current = true;
      setIsLoading(true);
      
      try {
        // Get the agreement
        const data = await getAgreement(id);
        
        if (data && isMounted) {
          setAgreement(data);
        } else if (isMounted) {
          toast.error("Agreement not found");
          navigate("/agreements");
        }
      } catch (error) {
        console.error("Error fetching agreement:", error);
        if (isMounted) {
          toast.error("Failed to load agreement details");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAgreement();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [id, getAgreement, navigate, isInitialized]);

  // Handle refresh trigger separately to avoid loading state issues
  useEffect(() => {
    let isMounted = true;
    
    if (refreshTrigger > 0 && id && isInitialized) {
      const refreshData = async () => {
        try {
          const data = await getAgreement(id);
          if (data && isMounted) {
            setAgreement(data);
          }
        } catch (error) {
          console.error("Error refreshing agreement:", error);
        }
      };
      
      refreshData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger, id, getAgreement, isInitialized]);

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

  // Handle payment deleted event - only refresh payments, not everything
  const handlePaymentDeleted = useCallback(() => {
    console.log("Payment deleted, refreshing payment data only");
    fetchPayments();
  }, [fetchPayments]);

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
          payments={payments}
          isLoadingPayments={isLoadingPayments}
          onPaymentDeleted={handlePaymentDeleted}
          onDataRefresh={refreshAgreementData}
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
