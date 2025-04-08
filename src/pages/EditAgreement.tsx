
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAgreements } from "@/hooks/use-agreements";
import AgreementForm from "@/components/agreements/AgreementForm";
import { Agreement } from "@/types/agreement";
import { useToast } from "@/components/ui/use-toast";
import PageContainer from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { updateAgreementWithCheck, adaptSimpleToFullAgreement } from "@/utils/agreement-utils";
import { useAuth } from "@/contexts/AuthContext";

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch agreement details
  const { agreement, isLoading, error, refetch } = useAgreements({ id });
  const [fullAgreement, setFullAgreement] = useState<Agreement | null>(null);
  
  useEffect(() => {
    if (agreement) {
      // Need to adapt for backward compatibility and handle security deposit fields
      const adaptedAgreement = {
        ...agreement,
        security_deposit_amount: agreement.security_deposit_amount || 0,
        deposit_amount: agreement.security_deposit_amount || 0,
        terms_accepted: true, // Default value for existing agreements
        additional_drivers: [] // Default value for existing agreements
      };
      setFullAgreement(adaptedAgreement);
    }
  }, [agreement]);

  const handleSubmit = async (formData: Agreement) => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await updateAgreementWithCheck(
        { id, data: formData },
        user?.id,
        () => {
          toast({
            title: "Agreement Updated",
            description: "The agreement has been updated successfully.",
          });
          refetch();
        },
        (error) => {
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "An error occurred while updating the agreement.",
          });
        }
      );
      
      if (!result?.success) {
        throw new Error("Failed to update agreement");
      }
    } catch (error) {
      console.error("Error updating agreement:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer 
        title="Edit Agreement" 
        description="Loading agreement details..."
        backLink="/agreements"
      >
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !agreement) {
    return (
      <PageContainer 
        title="Edit Agreement" 
        description="There was an error loading the agreement"
        backLink="/agreements"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message || "The agreement could not be loaded. Please try again later."}
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Edit Agreement" 
      description={`Agreement ${agreement.agreement_number || ''}`}
      backLink="/agreements"
    >
      {fullAgreement && (
        <AgreementForm 
          initialValues={fullAgreement}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          mode="edit"
        />
      )}
    </PageContainer>
  );
};

export default EditAgreement;
