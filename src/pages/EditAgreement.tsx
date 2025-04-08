
import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { ClipboardEdit, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AgreementForm from '@/components/agreements/AgreementForm';
import { useAgreements } from '@/hooks/use-agreements';
import { Agreement } from '@/types/agreement';
import { updateAgreementWithCheck } from '@/utils/agreement-utils';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { toast } from 'sonner';
import { Card, CardDescription } from '@/components/ui/card';

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAgreement } = useAgreements();

  useEffect(() => {
    const loadAgreement = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const agreementData = await getAgreement(id);
        if (agreementData) {
          setAgreement({
            ...adaptSimpleToFullAgreement(agreementData),
            terms_accepted: true, 
            additional_drivers: []
          });
        } else {
          toast.error('Agreement not found');
          navigate('/agreements');
        }
      } catch (error) {
        console.error('Error loading agreement:', error);
        toast.error('Error loading agreement');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAgreement();
  }, [id, navigate, getAgreement]);

  const handleSubmit = async (formData: Agreement) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await updateAgreementWithCheck({ 
        id, 
        data: formData 
      });
      
      toast.success('Agreement updated successfully');
      navigate(`/agreements/${id}`);
    } catch (error) {
      console.error('Error updating agreement:', error);
      toast.error('Error updating agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!agreement) {
    return (
      <PageContainer>
        <Card className="p-6">
          <CardDescription>
            Agreement not found. It may have been deleted or you don't have permission to view it.
          </CardDescription>
          <Button asChild className="mt-4">
            <Link to="/agreements">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agreements
            </Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <SectionHeader
          title="Edit Agreement"
          description="Update agreement details and information"
          icon={ClipboardEdit}
        />
        
        <Button variant="outline" asChild>
          <Link to={`/agreements/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Link>
        </Button>
      </div>
      
      <AgreementForm 
        agreement={agreement} 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting}
        mode="edit" 
      />
    </PageContainer>
  );
};

export default EditAgreement;
