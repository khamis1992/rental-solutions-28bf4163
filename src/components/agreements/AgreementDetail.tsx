import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { AgreementActionButtons } from './details/AgreementActionButtons';
import { AgreementDetailsSection } from './details/AgreementDetailsSection';
import { CustomerDetailsSection } from './details/CustomerDetailsSection';
import { VehicleDetailsSection } from './details/VehicleDetailsSection';
import { PaymentHistorySection } from './details/PaymentHistorySection';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { generatePdfDocument } from '@/utils/agreementUtils';
import { showErrorToast, showSuccessToast } from '@/utils/toast-utils';
import { supabase } from '@/integrations/supabase/client';
import { PaymentRecord } from '@/types/common';
import { formatDate, formatDateTime } from '@/lib/date-utils';

interface AgreementDetailProps {
  onEdit: () => void;
  onDelete: () => void;
}

const AgreementDetail = ({ agreement, onEdit, onDelete }: AgreementDetailProps) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const handleEdit = () => {
    onEdit();
  };

  const handleDelete = () => {
    onDelete();
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await generatePdfDocument(agreement);
      if (result) {
        showSuccessToast('PDF generated successfully');
      } else {
        showErrorToast(new Error('Failed to generate PDF'), 'PDF Generation Failed');
      }
    } catch (error) {
      showErrorToast(error, 'PDF Generation Error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateDocument = async () => {
    try {
      const result = await generatePdfDocument(agreement);
      if (result) {
        showSuccessToast('Document generated successfully');
      } else {
        showErrorToast(new Error('Failed to generate document'), 'Document Generation Failed');
      }
    } catch (error) {
      showErrorToast(error, 'Document Generation Error');
    }
  };

  const onPaymentAdded = async (agreementId: string) => {
    console.log('Payment added, refreshing agreement details for agreement ID:', agreementId);
  };

  if (!agreement) {
    return <div>Agreement not found</div>;
  }

  // Convert string dates to Date objects for display
  const startDate = typeof agreement.start_date === 'string' ? new Date(agreement.start_date) : agreement.start_date;
  const endDate = typeof agreement.end_date === 'string' ? new Date(agreement.end_date) : agreement.end_date;

  return (
    <div>
      <SectionHeader
        title="Agreement Details"
        description={`View and manage details for agreement #${agreement.agreement_number}`}
        actions={
          <AgreementActionButtons
            onEdit={handleEdit}
            onDownloadPdf={handleDownloadPdf}
            onGenerateDocument={handleGenerateDocument}
            onDelete={handleDelete}
            isGeneratingPdf={isGeneratingPdf}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AgreementDetailsSection agreement={agreement} startDate={formatDate(startDate)} endDate={formatDate(endDate)} />
        <CustomerDetailsSection customer={agreement.customer} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
        <VehicleDetailsSection vehicle={agreement.vehicle} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentHistorySection
            agreementId={agreement.id}
            onPaymentSelect={(payment) => {
              setSelectedPayment(payment);
              setPaymentDialogOpen(true);
            }}
          />
        </CardContent>
      </Card>

      <PaymentEntryDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        agreementId={agreement.id}
        onPaymentAdded={onPaymentAdded}
      />
    </div>
  );
};

export default AgreementDetail;
