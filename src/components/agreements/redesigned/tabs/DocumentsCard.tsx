
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Agreement } from '@/types/agreement';
import { AgreementTrafficFines } from '../../AgreementTrafficFines';
import LegalCaseCard from '../../LegalCaseCard';
import { FileText, AlertTriangle, Scale, Download, Award } from 'lucide-react';
import { generateArabicContract } from '@/utils/contract-generator';
import { toast } from 'sonner';
import { useTranslation } from '@/utils/translation-helper';

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
  const { t } = useTranslation();
  
  // Convert date strings to Date objects for AgreementTrafficFines
  const ensureDate = (dateValue: string | Date): Date => {
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    return dateValue;
  };

  const startDate = ensureDate(agreement.start_date);
  const endDate = ensureDate(agreement.end_date);

  // Handle comprehensive Arabic contract generation
  const handleGenerateComprehensiveContract = async () => {
    try {
      toast.info('جاري إنشاء عقد الإيجار العربي الشامل...');
      const success = await generateArabicContract(agreement);
      
      if (success) {
        toast.success('تم إنشاء العقد العربي الشامل بنجاح');
      } else {
        toast.error('فشل في إنشاء العقد العربي');
      }
    } catch (error) {
      console.error('Error generating comprehensive Arabic contract:', error);
      toast.error('فشل في إنشاء العقد العربي');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
      {/* Left side - Document Management and Traffic Fines (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Document Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <FileText className="h-5 w-5" />
              إدارة الوثائق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-right">
                إدارة العقود والوثائق المهنية العربية للإيجار
              </p>
              
              {/* Comprehensive Arabic Contract Button */}
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-800 text-right">العقد الشامل</h4>
                </div>
                <p className="text-sm text-emerald-700 mb-3 text-right">
                  إدارة العقود والوثائق المهنية العربية للإيجار
                </p>
                <Button
                  onClick={handleGenerateComprehensiveContract}
                  disabled={isGeneratingPdf}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 flex-row-reverse"
                >
                  <Download className="h-4 w-4" />
                  إنشاء العقد الكامل
                </Button>
              </div>
              
              {/* Only Edit and Delete buttons remain */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3 text-right">خيارات الوثائق الأخرى</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={onEdit}>
                    تعديل العقد
                  </Button>
                  <Button variant="destructive" onClick={onDelete}>
                    حذف العقد
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Fines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right flex-row-reverse">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              المخالفات المرورية
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
      </div>

      {/* Right side - Legal Cases (1/3 width) */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end text-right flex-row-reverse">
              <Scale className="h-5 w-5 text-purple-500" />
              القضايا القانونية
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div style={{ textAlign: 'right', direction: 'rtl' }}>
              <LegalCaseCard 
                agreementId={agreement.id}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
