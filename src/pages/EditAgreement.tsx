
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { SimpleAgreement } from '@/types/agreement';

export default function EditAgreement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<SimpleAgreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { getAgreement, updateAgreement } = useAgreements();

  // Load agreement data
  useEffect(() => {
    async function loadAgreement() {
      if (!id) return;

      try {
        setIsLoading(true);
        const agreement = await getAgreement(id);
        setInitialValues(agreement);
      } catch (error) {
        console.error('Error loading agreement:', error);
        toast.error('Failed to load agreement details');
      } finally {
        setIsLoading(false);
      }
    }

    loadAgreement();
  }, [id, getAgreement]);

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  // If the agreement doesn't exist, show an error
  if (!initialValues) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <h3 className="font-bold text-lg">Agreement Not Found</h3>
        <p>The agreement you're trying to edit doesn't exist or has been deleted.</p>
      </div>
    );
  }

  // Format dates for form consumption
  const formattedAgreement = {
    ...initialValues,
    start_date: initialValues.start_date ? new Date(initialValues.start_date) : new Date(),
    end_date: initialValues.end_date ? new Date(initialValues.end_date) : new Date(),
    created_at: initialValues.created_at ? new Date(initialValues.created_at) : new Date(),
    updated_at: initialValues.updated_at ? new Date(initialValues.updated_at) : new Date(),
    status: initialValues.status || 'DRAFT'
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Agreement</h1>

      {/* Temporarily disabled - waiting for AgreementForm implementation */}
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <h4 className="text-lg font-medium mb-2">Agreement Editor Under Construction</h4>
        <p className="text-muted-foreground mb-4">The agreement editing functionality is being implemented.</p>
        <p>Agreement Number: {initialValues.agreement_number}</p>
      </div>
    </div>
  );
}
