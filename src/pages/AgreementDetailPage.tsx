
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
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

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
    if (!id) {
      console.error("No agreement ID was provided in the URL");
      setInitializationError(new Error('No agreement ID was provided in the URL'));
      setIsLoading(false);
      return;
    }
    
    if (!isMounted.current || dataFetchAttempted.current) return;
    
    setIsLoading(true);
    dataFetchAttempted.current = true;
    
    try {
      console.log("Fetching agreement details for ID:", id);
      const data = await getAgreement(id);
      
      if (!isMounted.current) {
        return;
      }
      
      if (!data) {
        console.error("No agreement data found for ID:", id);
        setInitializationError(new Error(`Agreement with ID ${id} not found`));
        setIsLoading(false);
        return;
      }
      
      console.log("Agreement data fetched successfully:", data);
      
      // Ensure dates are properly converted to Date objects
      if (data.start_date && !(data.start_date instanceof Date)) {
        try {
          data.start_date = new Date(data.start_date);
        } catch (e) {
          console.error("Error converting start_date to Date object:", e);
        }
      }
      
      if (data.end_date && !(data.end_date instanceof Date)) {
        try {
          data.end_date = new Date(data.end_date);
        } catch (e) {
          console.error("Error converting end_date to Date object:", e);
        }
      }
      
      setAgreement(data);
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
    console.log("Component mounted, initializing data fetch for ID:", id);
    fetchAgreementData();
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchAgreementData]);

  // Custom hooks for specific functionality - only call when agreement is available
  const { rentAmount, contractAmount } = useRentAmount(agreement, id);
  const { refreshTrigger, refreshAgreementData, handleSpecialAgreementPayments } = usePaymentGeneration(agreement, id);

  // Handle refreshing data when needed
  useEffect(() => {
    if (refreshTrigger > 0 && id && isMounted.current) {
      console.log("Refresh triggered, fetching updated agreement data");
      dataFetchAttempted.current = false; // Reset to allow re-fetching
      fetchAgreementData();
    }
  }, [refreshTrigger, id, fetchAgreementData]);

  // Special agreement check - run only when agreement and rentAmount are loaded
  useEffect(() => {
    if (agreement && rentAmount && agreement.agreement_number === 'MR202462') {
      console.log("Special agreement MR202462 found with rentAmount:", rentAmount);
      handleSpecialAgreementPayments(agreement, rentAmount);
    }
  }, [agreement, rentAmount, handleSpecialAgreementPayments]);

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

  useEffect(() => {
    // Additional debugging useEffect that runs on state updates
    console.log("AgreementDetailPage current state:", {
      agreementLoaded: !!agreement,
      isLoading,
      hasError: !!initializationError,
      rentAmount,
      contractAmount,
      refreshTrigger,
      currentId: id
    });
    
    if (agreement) {
      console.log("Agreement state details:", {
        id: agreement.id,
        agreement_number: agreement.agreement_number,
        hasCustomerData: !!agreement.customers,
        hasVehicleData: !!agreement.vehicles,
        status: agreement.status,
        dates: {
          start: agreement.start_date,
          end: agreement.end_date,
          startIsDate: agreement.start_date instanceof Date,
          endIsDate: agreement.end_date instanceof Date
        }
      });
    }
  }, [agreement, isLoading, initializationError, rentAmount, contractAmount, refreshTrigger, id]);

  if (initializationError) {
    return (
      <PageContainer
        title="Agreement Details"
        description="View and manage rental agreement details"
        backLink="/agreements"
      >
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-red-600">Error loading agreement</h3>
          <p className="text-muted-foreground mb-4">
            {initializationError.message}
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => {
                dataFetchAttempted.current = false;
                setInitializationError(null);
                fetchAgreementData();
              }}
              className="mt-4"
            >
              Retry
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/agreements")}
              className="mt-4"
            >
              Return to Agreements
            </Button>
          </div>
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
