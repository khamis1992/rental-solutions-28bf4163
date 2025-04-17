
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementForm } from '@/components/agreements/AgreementForm';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditAgreement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreementById, updateAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAgreement() {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getAgreementById(id); // Pass the ID as a string
        
        if (!data) {
          setError('Agreement not found');
        } else {
          setAgreement(data);
        }
      } catch (err: any) {
        console.error('Error fetching agreement:', err);
        setError(err.message || 'Failed to load agreement');
      } finally {
        setLoading(false);
      }
    }

    fetchAgreement();
  }, [id, getAgreementById]);

  const handleSubmit = async (formData: any) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      await updateAgreement.mutateAsync({
        ...formData,
        id
      });
      
      toast.success('Agreement updated successfully');
      navigate(`/agreements/${id}`);
    } catch (err: any) {
      console.error('Error updating agreement:', err);
      toast.error(`Failed to update agreement: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Edit Agreement" description="Loading agreement information...">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !agreement) {
    return (
      <PageContainer title="Error" description={error || 'Agreement not found'}>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error || 'Could not find the requested agreement.'}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Edit Agreement" 
      description={`Editing agreement #${agreement.agreement_number || id}`}
    >
      <AgreementForm
        initialData={agreement}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        isEditMode
      />
    </PageContainer>
  );
}
