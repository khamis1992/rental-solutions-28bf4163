import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import { usePayment } from '@/hooks/use-payment';
import { isValidUuid } from '@/types/db';

export function AgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  console.log('AgreementDetailPage - URL param id:', id);
  
  // Validate the agreement ID from URL params
  const isValidAgreementId = id && id !== 'undefined' && isValidUuid(id);
  console.log('AgreementDetailPage - isValidAgreementId:', isValidAgreementId);

  // Use the payment hook with validated ID
  const {
    generatePayment,
    isPending,
    isValidAgreementId: hookValidatesId
  } = usePayment(isValidAgreementId ? id : undefined);

  console.log('AgreementDetailPage - hookValidatesId:', hookValidatesId);

  // Load agreement data (this would typically come from a hook)
  useEffect(() => {
    if (!isValidAgreementId) {
      console.error('AgreementDetailPage - Invalid agreement ID from URL:', id);
      setIsLoading(false);
      return;
    }

    // TODO: Replace with actual agreement loading logic
    // For now, just simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      // This would be replaced with actual agreement data loading
    }, 1000);

    return () => clearTimeout(timer);
  }, [id, isValidAgreementId]);

  const handleGeneratePayment = async () => {
    console.log('AgreementDetailPage.handleGeneratePayment called');
    
    if (!isValidAgreementId) {
      console.error('Cannot generate payment - invalid agreement ID:', id);
      toast.error('Invalid agreement ID. Cannot generate payment.');
      return;
    }

    if (!hookValidatesId) {
      console.error('Payment hook did not validate agreement ID:', id);
      toast.error('Payment system error. Please refresh and try again.');
      return;
    }

    try {
      console.log('AgreementDetailPage - Calling generatePayment for ID:', id);
      const result = await generatePayment(id);
      console.log('AgreementDetailPage - generatePayment result:', result);
      
      if (result?.success) {
        toast.success(result.message || 'Payment schedule generated successfully');
      } else {
        toast.error(result?.message || 'Failed to generate payment schedule');
      }
    } catch (error) {
      console.error('AgreementDetailPage - Error generating payment:', error);
      toast.error(`Error generating payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Show error state for invalid agreement ID
  if (!isValidAgreementId) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/agreements')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agreements
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Invalid agreement ID: "{id}". Please check the URL and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/agreements')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agreements
        </Button>
      </div>

      {/* Debug info (remove in production) */}
      <div className="mb-4 p-4 bg-gray-100 rounded text-sm">
        <p><strong>Debug Info:</strong></p>
        <p>Agreement ID: {id}</p>
        <p>Valid ID: {String(isValidAgreementId)}</p>
        <p>Hook Validates: {String(hookValidatesId)}</p>
      </div>

      <div className="mb-6">
        <Button
          onClick={handleGeneratePayment}
          disabled={isPending.generatePayment || !isValidAgreementId}
          className="mr-4"
        >
          {isPending.generatePayment ? 'Generating...' : 'Generate Payment Schedule'}
        </Button>
      </div>

      {/* This would be replaced with the actual AgreementDetail component */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Agreement Details</h1>
        <p>Agreement ID: {id}</p>
        <p>Status: {isValidAgreementId ? 'Valid' : 'Invalid'}</p>
        {/* TODO: Add actual agreement details here */}
      </div>
    </div>
  );
}
