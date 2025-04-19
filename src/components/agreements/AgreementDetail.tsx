
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { fixAgreementPayments } from '@/lib/supabase';
import { forceGeneratePaymentForAgreement } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useAgreements } from '@/hooks/use-agreements';
import { usePayments } from '@/hooks/use-payments';
import { supabase } from '@/lib/supabase';
import { AgreementDetailsLayout } from './details/AgreementDetailsLayout';

const AgreementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getAgreement, isLoading: isAgreementLoading, error: agreementError } = useAgreements();
  const [agreement, setAgreement] = useState<any>(null);
  const { rentAmount, isLoading: isRentAmountLoading } = useRentAmount(agreement, id || '');
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);

  const { 
    payments, 
    isLoading: isLoadingPayments, 
    fetchPayments: fetchPaymentsHook,
    addPayment,
    updatePayment,
    deletePayment
  } = usePayments(id || '');

  useEffect(() => {
    if (id) {
      const fetchAgreementData = async () => {
        const data = await getAgreement(id);
        if (data) {
          setAgreement(data);
        }
      };
      fetchAgreementData();
    }
  }, [id, getAgreement]);

  useEffect(() => {
    if (id) {
      fetchPaymentsHook();
    }
  }, [id, fetchPaymentsHook]);

  const handlePaymentSubmit = async (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    targetPaymentId?: string
  ) => {
    try {
      if (!agreement) return;
      
      toast({
        title: "Success",
        description: "Payment recorded successfully",
        variant: "default",
      });
      
      setIsPaymentDialogOpen(false);
      refetchAgreement();
      fetchPaymentsHook();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const refetchAgreement = async () => {
    if (id) {
      const data = await getAgreement(id);
      if (data) {
        setAgreement(data);
      }
    }
  };

  const handleGeneratePayment = async () => {
    if (!id || !agreement) return;
    
    setIsGeneratingPayment(true);
    try {
      const result = await forceGeneratePaymentForAgreement(supabase, id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Payment schedule generated successfully",
          variant: "default",
        });
        refetchAgreement();
      } else {
        toast({
          title: "Error",
          description: `Failed to generate payment: ${result.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating payment:", error);
      toast({
        title: "Error",
        description: "Failed to generate payment schedule",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handleRunMaintenanceJob = async () => {
    if (!id) return;
    
    setIsRunningMaintenance(true);
    try {
      const result = await fixAgreementPayments(id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Payment maintenance completed",
          variant: "default",
        });
        refetchAgreement();
        fetchPaymentsHook();
      } else {
        toast({
          title: "Error",
          description: result.message || "Payment maintenance failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error running maintenance job:", error);
      toast({
        title: "Error",
        description: "Failed to run maintenance job",
        variant: "destructive",
      });
    } finally {
      setIsRunningMaintenance(false);
    }
  };

  return (
    <AgreementDetailsLayout
      agreement={agreement}
      isLoading={isAgreementLoading}
      rentAmount={rentAmount}
      isGeneratingPayment={isGeneratingPayment}
      isRunningMaintenance={isRunningMaintenance}
      isDocumentDialogOpen={isDocumentDialogOpen}
      setIsDocumentDialogOpen={setIsDocumentDialogOpen}
      isPaymentDialogOpen={isPaymentDialogOpen}
      setIsPaymentDialogOpen={setIsPaymentDialogOpen}
      onGeneratePayment={handleGeneratePayment}
      onRunMaintenanceJob={handleRunMaintenanceJob}
      onHandlePaymentSubmit={handlePaymentSubmit}
      navigate={navigate}
    />
  );
};

export default AgreementDetail;
