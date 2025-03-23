
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgreementForm from '@/components/agreements/AgreementForm';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, updateAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgreement = async () => {
      if (!id) {
        toast.error("Agreement ID is required");
        navigate("/agreements");
        return;
      }
      
      setIsLoading(true);
      try {
        const data = await getAgreement(id);
        if (data) {
          setAgreement(data);
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
      }
    };

    fetchAgreement();
  }, [id, getAgreement, navigate]);

  const handleSubmit = async (updatedAgreement: Agreement) => {
    if (!id) return;
    
    try {
      await updateAgreement.mutateAsync({ 
        id, 
        data: updatedAgreement 
      });
      toast.success("Agreement updated successfully");
      navigate(`/agreements/${id}`);
    } catch (error) {
      console.error("Error updating agreement:", error);
      toast.error("Failed to update agreement");
    }
  };

  return (
    <PageContainer
      title="Edit Agreement"
      description="Modify existing rental agreement details"
      backLink={`/agreements/${id}`}
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : agreement ? (
        <AgreementForm 
          initialData={agreement} 
          onSubmit={handleSubmit} 
          isEditMode={true}
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

export default EditAgreement;
