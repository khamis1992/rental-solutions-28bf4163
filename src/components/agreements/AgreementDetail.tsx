
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { AgreementActionButtons } from './details/AgreementActionButtons';
import PaymentEntryDialog from './PaymentEntryDialog';
import { generatePdfDocument } from '@/utils/agreementUtils';
import { showErrorToast, showSuccessToast } from '@/utils/toast-utils';
import { PaymentRecord } from '@/types/common';
import { formatDate } from '@/lib/date-utils';

interface AgreementDetailProps {
  agreement: any;
  onEdit: () => void;
  onDelete: () => void;
}

const AgreementDetail = ({ agreement, onEdit, onDelete }: AgreementDetailProps) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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
        <Card>
          <CardHeader>
            <CardTitle>Agreement Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Agreement Number:</strong> {agreement.agreement_number}</p>
              <p><strong>Start Date:</strong> {formatDate(startDate)}</p>
              <p><strong>End Date:</strong> {formatDate(endDate)}</p>
              <p><strong>Status:</strong> {agreement.status}</p>
              <p><strong>Total Amount:</strong> {agreement.total_amount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {agreement.customer?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {agreement.customer?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {agreement.customer?.phone || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Make:</strong> {agreement.vehicle?.make || 'N/A'}</p>
              <p><strong>Model:</strong> {agreement.vehicle?.model || 'N/A'}</p>
              <p><strong>Year:</strong> {agreement.vehicle?.year || 'N/A'}</p>
              <p><strong>License Plate:</strong> {agreement.vehicle?.license_plate || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Payment history will be displayed here
          </div>
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
