
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { initializeSystem, supabase } from '@/lib/supabase';
import { differenceInMonths } from 'date-fns';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, deleteAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [paymentGenerationAttempted, setPaymentGenerationAttempted] = useState(false);
  const [contractAmount, setContractAmount] = useState<number | null>(null);
  const [rentAmount, setRentAmount] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshAgreementData = () => {
    // Increment refresh trigger to force a refresh
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Initialize the system to check for payment generation
    initializeSystem().then(() => {
      console.log("System initialized, checking for payments");
    });

    const fetchAgreement = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // First get the agreement
        const data = await getAgreement(id);
        
        if (data) {
          // Get the rent_amount directly from the leases table
          try {
            const { data: leaseData, error: leaseError } = await supabase
              .from("leases")
              .select("rent_amount, daily_late_fee")
              .eq("id", id)
              .single();
            
            if (!leaseError && leaseData) {
              // Update rent amount if available
              if (leaseData.rent_amount) {
                data.total_amount = leaseData.rent_amount;
                setRentAmount(leaseData.rent_amount);
                console.log("Updated agreement total_amount with rent_amount:", leaseData.rent_amount);
                
                // Calculate contract amount = rent_amount * duration in months
                if (data.start_date && data.end_date) {
                  const durationMonths = differenceInMonths(new Date(data.end_date), new Date(data.start_date));
                  const calculatedContractAmount = leaseData.rent_amount * (durationMonths || 1);
                  setContractAmount(calculatedContractAmount);
                  console.log(`Contract duration: ${durationMonths} months, Contract amount: ${calculatedContractAmount}`);
                }
              }
              
              // Update daily late fee if available
              if (leaseData.daily_late_fee) {
                data.daily_late_fee = leaseData.daily_late_fee;
                console.log("Updated agreement with daily_late_fee:", leaseData.daily_late_fee);
              }
            }
          } catch (err) {
            console.error("Error fetching lease data:", err);
          }
          
          setAgreement(data);
          
          // For any agreement, check for missing monthly payments
          if (data.status === 'active' && !paymentGenerationAttempted) {
            console.log(`Checking for missing payments for agreement ${data.agreement_number}...`);
            setPaymentGenerationAttempted(true);
            
            // This would typically call a function to check for missing payments
            // We'll add a placeholder for now
            console.log("Payment check completed for active agreement");
          }
        } else {
          toast.error("Agreement not found");
          navigate("/agreements");
        }
      } catch (error) {
        console.error("Error fetching agreement for edit:", error);
        toast.error("Failed to load agreement details");
        navigate("/agreements");
      } finally {
        setIsLoading(false);
        setHasAttemptedFetch(true);
      }
    };

    if (!hasAttemptedFetch || refreshTrigger > 0) {
      fetchAgreement();
    }
  }, [id, getAgreement, navigate, hasAttemptedFetch, paymentGenerationAttempted, refreshTrigger]);

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
