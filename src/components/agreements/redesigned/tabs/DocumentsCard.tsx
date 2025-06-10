
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Agreement } from '@/types/agreement';
import { AgreementActionButtons } from '../../details/AgreementActionButtons';
import { AgreementTrafficFines } from '../../AgreementTrafficFines';
import LegalCaseCard from '../../LegalCaseCard';
import { FileText, AlertTriangle, Scale, Download } from 'lucide-react';
import { generateArabicContract } from '@/utils/contract-generator';
import { toast } from 'sonner';

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

  // Handle Arabic contract generation
  const handleGenerateArabicContract = async () => {
    try {
      toast.info('جاري إنشاء عقد الإيجار العربي...');
      const success = await generateArabicContract(agreement);
      
      if (success) {
        toast.success('تم إنشاء العقد العربي بنجاح');
      } else {
        toast.error('فشل في إنشاء العقد العربي');
      }
    } catch (error) {
      console.error('Error generating Arabic contract:', error);
      toast.error('فشل في إنشاء العقد العربي');
    }
  };

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
            
            {/* Arabic Contract Button */}
            <div className="mb-4">
              <Button
                onClick={handleGenerateArabicContract}
                disabled={isGeneratingPdf}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                عقد الإيجار العربي (Arabic Contract)
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Generate official Arabic rental agreement contract
              </p>
            </div>
            
            {/* Standard Action Buttons */}
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
