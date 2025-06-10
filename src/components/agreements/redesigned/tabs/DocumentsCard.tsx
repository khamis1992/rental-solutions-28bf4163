
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Agreement } from '@/types/agreement';
import { AgreementActionButtons } from '../../details/AgreementActionButtons';
import { AgreementTrafficFines } from '../../AgreementTrafficFines';
import LegalCaseCard from '../../LegalCaseCard';
import { FileText, AlertTriangle, Scale } from 'lucide-react';

interface DocumentsCardProps {
  agreement: Agreement;
  onEdit: () => void;
  onDownloadPdf: () => void;
  onGenerateDocument: () => void;
  onDelete: () => void;
  isGeneratingPdf: boolean;
  getDateString: (date: string | Date) => string;
}

export function DocumentsCard({
  agreement,
  onEdit,
  onDownloadPdf,
  onGenerateDocument,
  onDelete,
  isGeneratingPdf,
  getDateString
}: DocumentsCardProps) {
  // Convert date strings to Date objects for AgreementTrafficFines
  const ensureDate = (dateValue: string | Date): Date => {
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    return dateValue;
  };

  const startDate = ensureDate(agreement.start_date);
  const endDate = ensureDate(agreement.end_date);

  return (
    <div className="space-y-6">
      {/* Document Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate, download, and manage agreement documents.
            </p>
            <AgreementActionButtons
              onEdit={onEdit}
              onDownloadPdf={onDownloadPdf}
              onGenerateDocument={onGenerateDocument}
              onDelete={onDelete}
              isGeneratingPdf={isGeneratingPdf}
            />
          </div>
        </CardContent>
      </Card>

      {/* Traffic Fines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Traffic Fines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AgreementTrafficFines 
            agreementId={agreement.id}
            startDate={startDate}
            endDate={endDate}
          />
        </CardContent>
      </Card>

      {/* Legal Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-purple-500" />
            Legal Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LegalCaseCard 
            agreementId={agreement.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
