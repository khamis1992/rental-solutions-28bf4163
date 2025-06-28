import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentsEnhanced } from '@/hooks/use-documents-enhanced';
import { 
  DocumentCategory, 
  DocumentType,
  DocumentEntityType,
  CreateDocumentRequest 
} from '@/types/document.types';

export interface DocumentUploadProps {
  entityType?: DocumentEntityType;
  entityId?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  entityType,
  entityId,
  onComplete,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>(DocumentCategory.OTHER);
  const [type, setType] = useState<DocumentType>(DocumentType.OTHER);
  const [file, setFile] = useState<File | null>(null);
  
  const { createDocument } = useDocumentsEnhanced();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      
      if (!title) {
        setTitle(acceptedFiles[0].name.split('.')[0]);
      }
    }
  }, [title]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 20971520, // 20MB
  });
  
  const handleSubmit = async () => {
    if (!file) {
      toast.error('يرجى اختيار ملف للرفع');
      return;
    }
    
    if (!title) {
      toast.error('يرجى إدخال عنوان للوثيقة');
      return;
    }
    
    const request: CreateDocumentRequest = {
      title,
      description: description || undefined,
      file,
      category,
      type,
      entity_type: entityType,
      entity_id: entityId
    };
    
    try {
      await createDocument.mutateAsync(request);
      
      setTitle('');
      setDescription('');
      setCategory(DocumentCategory.OTHER);
      setType(DocumentType.OTHER);
      setFile(null);
      
      toast.success('تم رفع المستند بنجاح!');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Enhanced error handling with helpful messages
      if (error.message.includes('bucket')) {
        toast.error('مشكلة في مساحة التخزين. يرجى استخدام زر "إعداد نظام المستندات" في الأعلى لحل المشكلة.');
      } else if (error.message.includes('size')) {
        toast.error('حجم الملف كبير جداً. الحد الأقصى 50 ميجابايت.');
      } else if (error.message.includes('type')) {
        toast.error('نوع الملف غير مدعوم. يرجى استخدام PDF, DOC, DOCX, XLS, XLSX, أو صور.');
      } else {
        toast.error(`فشل في رفع المستند: ${error.message}`);
      }
    }
  };

  // Helper functions to translate categories and types
  const getCategoryLabel = (cat: DocumentCategory) => {
    const labels: Record<DocumentCategory, string> = {
      [DocumentCategory.CONTRACT]: 'عقد',
      [DocumentCategory.INSURANCE]: 'تأمين',
      [DocumentCategory.MAINTENANCE]: 'صيانة',
      [DocumentCategory.IDENTITY]: 'هوية',
      [DocumentCategory.FINANCIAL]: 'مالي',
      [DocumentCategory.LEGAL]: 'قانوني',
      [DocumentCategory.OTHER]: 'أخرى'
    };
    return labels[cat] || cat;
  };

  const getTypeLabel = (t: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      [DocumentType.AGREEMENT]: 'اتفاقية',
      [DocumentType.INSURANCE_POLICY]: 'بوليصة تأمين',
      [DocumentType.MAINTENANCE_REPORT]: 'تقرير صيانة',
      [DocumentType.ID_CARD]: 'بطاقة هوية',
      [DocumentType.LICENSE]: 'رخصة',
      [DocumentType.RECEIPT]: 'إيصال',
      [DocumentType.INVOICE]: 'فاتورة',
      [DocumentType.LEGAL_NOTICE]: 'إشعار قانوني',
      [DocumentType.OTHER]: 'أخرى'
    };
    return labels[t] || t.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="text-right">رفع وثيقة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-right">العنوان</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="أدخل عنوان الوثيقة"
            className="text-right"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description" className="text-right">الوصف (اختياري)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="أدخل وصف الوثيقة"
            className="text-right"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-right">الفئة</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as DocumentCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DocumentCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type" className="text-right">نوع الوثيقة</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DocumentType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {getTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-right">الملف</Label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            {!file ? (
              <div className="flex flex-col items-center justify-center text-center">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">انقر للرفع</span> أو اسحب وأفلت
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, XLSX, JPG, PNG (الحد الأقصى 20 ميجابايت)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <File className="h-8 w-8 text-primary" />
                  <div className="flex-1 truncate text-right">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} كيلوبايت
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 flex-row-reverse">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={createDocument.isPending || !file || !title}
        >
          {createDocument.isPending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري الرفع...
            </>
          ) : (
            'رفع الوثيقة'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentUpload;
