
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { FileText, Download, Edit, Trash2, FileImage } from 'lucide-react';

interface DocumentsCardProps {
  agreement: any;
  onEdit: () => void;
  onDownloadPdf: () => Promise<void>;
  onGenerateDocument: () => Promise<void>;
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
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <CardTitle className="flex items-center justify-between text-left">
                <span className="text-left">الوثائق والمستندات</span>
                <FileImage className="h-5 w-5" />
              </CardTitle>
              <CardDescription className="text-left mt-1">
                إدارة وثائق العقد والمستندات القانونية
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Generate Documents Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-lg">إنشاء الوثائق</CardTitle>
            <CardDescription className="text-right">
              إنشاء وتحميل وثائق العقد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full flex items-center gap-2 flex-row-reverse"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPdf ? 'جاري الإنشاء...' : 'تحميل العقد (PDF)'}
            </Button>
            
            <Button 
              onClick={onGenerateDocument}
              className="w-full flex items-center gap-2 flex-row-reverse"
              variant="outline"
            >
              <FileText className="h-4 w-4" />
              إنشاء وثيقة مخصصة
            </Button>
          </CardContent>
        </Card>

        {/* Agreement Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-lg">إدارة العقد</CardTitle>
            <CardDescription className="text-right">
              تعديل أو حذف معلومات العقد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={onEdit}
              className="w-full flex items-center gap-2 flex-row-reverse"
              variant="outline"
            >
              <Edit className="h-4 w-4" />
              تعديل العقد
            </Button>
            
            <Button 
              onClick={onDelete}
              variant="destructive"
              className="w-full flex items-center gap-2 flex-row-reverse"
            >
              <Trash2 className="h-4 w-4" />
              حذف العقد
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">معلومات الوثيقة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
              <p className="font-medium">
                {new Date(getDateString(agreement.created_at)).toLocaleDateString('ar-QA')}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">آخر تعديل</p>
              <p className="font-medium">
                {new Date(getDateString(agreement.updated_at)).toLocaleDateString('ar-QA')}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">رقم العقد</p>
              <p className="font-medium">{agreement.agreement_number || 'غير محدد'}</p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">حالة العقد</p>
              <p className="font-medium">
                {agreement.status === 'active' ? 'نشط' : agreement.status}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">المعلومات القانونية</CardTitle>
          <CardDescription className="text-right">
            معلومات قانونية مهمة متعلقة بالعقد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-right space-y-2">
            <p className="text-sm text-muted-foreground">
              هذا العقد محكوم بقوانين دولة قطر ويخضع لاختصاص المحاكم القطرية.
            </p>
            <p className="text-sm text-muted-foreground">
              جميع البيانات والمعلومات الواردة في هذا العقد سرية ومحمية قانونياً.
            </p>
            <p className="text-sm text-muted-foreground">
              في حالة وجود أي نزاع، يُرجى التواصل مع الإدارة القانونية.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
