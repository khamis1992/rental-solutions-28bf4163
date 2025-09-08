
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, Download, Edit, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VehicleData } from '@/types/vehicle.types';
import { DocumentList } from '@/components/documents/DocumentList';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { StorageTestButton } from '@/components/documents/StorageTestButton';
import { DocumentEntityType } from '@/types/document.types';
import { toast } from 'sonner';

interface VehicleDocumentsTabProps {
  vehicle: VehicleData;
}

export const VehicleDocumentsTab: React.FC<VehicleDocumentsTabProps> = ({ vehicle }) => {
  const { language } = useLanguage();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
  };

  const handleDownloadAll = () => {
    toast.info('جاري تحضير تحميل جميع المستندات...');
    // TODO: Implement download all functionality
  };

  const handleEditDocuments = () => {
    toast.info('وضع تحرير المستندات غير متوفر حالياً');
    // TODO: Implement edit mode functionality
  };

  const handleUploadComplete = () => {
    setIsUploadDialogOpen(false);
    toast.success('تم رفع المستند بنجاح');
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Storage Setup Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-right" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <strong>مشكلة في رفع المستندات؟</strong>
              <p className="text-sm text-muted-foreground mt-1">
                إذا كنت تواجه خطأ في رفع المستندات، اضغط على زر الإعداد لحل المشكلة
              </p>
            </div>
            <StorageTestButton />
          </div>
        </AlertDescription>
      </Alert>

      {/* Document Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            <FileText className="h-5 w-5" />
            {language === 'ar' ? 'إدارة المستندات' : 'Document Management'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'إدارة جميع المستندات المتعلقة بهذه المركبة' : 'Manage all documents related to this vehicle'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button 
              variant="outline" 
              className={`${language === 'ar' ? 'flex-row-reverse' : ''}`}
              onClick={handleUploadClick}
            >
              <Upload className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'رفع مستند' : 'Upload Document'}
            </Button>
            <Button 
              variant="outline"
              className={`${language === 'ar' ? 'flex-row-reverse' : ''}`}
              onClick={handleDownloadAll}
            >
              <Download className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'تحميل الكل' : 'Download All'}
            </Button>
            <Button 
              variant="outline"
              className={`${language === 'ar' ? 'flex-row-reverse' : ''}`}
              onClick={handleEditDocuments}
            >
              <Edit className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'تحرير المستندات' : 'Edit Documents'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { 
            title: language === 'ar' ? 'وثائق التسجيل' : 'Registration Documents',
            description: language === 'ar' ? 'رخصة السيارة وأوراق التسجيل' : 'Vehicle license and registration papers',
            count: 0 
          },
          { 
            title: language === 'ar' ? 'وثائق التأمين' : 'Insurance Documents',
            description: language === 'ar' ? 'بوليصة التأمين والوثائق ذات الصلة' : 'Insurance policy and related documents',
            count: 0 
          },
          { 
            title: language === 'ar' ? 'تقارير الفحص' : 'Inspection Reports',
            description: language === 'ar' ? 'تقارير الفحص الفني والصيانة' : 'Technical inspection and maintenance reports',
            count: 0 
          },
          { 
            title: language === 'ar' ? 'وثائق الإيجار' : 'Rental Documents',
            description: language === 'ar' ? 'عقود الإيجار والاتفاقيات' : 'Rental contracts and agreements',
            count: 0 
          },
          { 
            title: language === 'ar' ? 'صور المركبة' : 'Vehicle Photos',
            description: language === 'ar' ? 'صور المركبة والأضرار' : 'Vehicle photos and damage records',
            count: 0 
          },
          { 
            title: language === 'ar' ? 'مستندات أخرى' : 'Other Documents',
            description: language === 'ar' ? 'مستندات متنوعة أخرى' : 'Miscellaneous other documents',
            count: 0 
          }
        ].map((category, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-base ${language === 'ar' ? 'text-right' : ''}`}>
                {category.title}
              </CardTitle>
              <CardDescription className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className="text-2xl font-bold text-muted-foreground">
                  {category.count}
                </span>
                <Button variant="ghost" size="sm">
                  {language === 'ar' ? 'عرض' : 'View'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'جميع المستندات' : 'All Documents'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'قائمة كاملة بجميع المستندات المرفوعة' : 'Complete list of all uploaded documents'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList 
            entityType={DocumentEntityType.VEHICLE} 
            entityId={vehicle.id} 
            showUploadButton={true}
            showSearch={true}
            showFilters={false}
          />
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">رفع مستند للمركبة</DialogTitle>
          </DialogHeader>
          <DocumentUpload
            entityType={DocumentEntityType.VEHICLE}
            entityId={vehicle.id}
            onComplete={handleUploadComplete}
            onCancel={() => setIsUploadDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
