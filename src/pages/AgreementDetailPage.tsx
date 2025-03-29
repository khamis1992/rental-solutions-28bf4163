
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { initializeSystem } from '@/lib/supabase';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, deleteAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use refs to track mounting state
  const isMounted = useRef(true);
  const initializationComplete = useRef(false);

  // Custom hooks for specific functionality
  const { rentAmount, contractAmount } = useRentAmount(agreement, id);
  const { refreshTrigger, refreshAgreementData } = usePaymentGeneration(agreement, id);

  // Fetch agreement data
  useEffect(() => {
    if (!id) return;
    
    let isActive = true;
    setIsLoading(true);
    
    const fetchAgreementData = async () => {
      try {
        // Make sure system is initialized first (only once per session)
        if (!initializationComplete.current) {
          await initializeSystem();
          if (isActive) {
            initializationComplete.current = true;
          }
        }
        
        // Then fetch agreement data
        const data = await getAgreement(id);
        
        if (!isActive || !data) {
          return;
        }
        
        setAgreement(data);
      } catch (error) {
        if (isActive) {
          console.error("Error fetching agreement:", error);
          toast.error("Failed to load agreement details");
          navigate("/agreements");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchAgreementData();
    
    return () => {
      isActive = false;
    };
  }, [id, getAgreement, navigate, refreshTrigger]);

  // Set up cleanup function for component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

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
