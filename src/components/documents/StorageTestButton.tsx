import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';
import { 
  testStorageConnection, 
  createDocumentsBucketManually 
} from '@/lib/documents/document-storage';
import { toast } from 'sonner';

export const StorageTestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const setupStorage = async () => {
    setIsLoading(true);
    try {
      // Test connection first
      toast.info('اختبار الاتصال مع Supabase Storage...');
      const connectionResult = await testStorageConnection();
      
      if (!connectionResult.success) {
        toast.error(`فشل الاتصال: ${connectionResult.error}`);
        return;
      }
      
      toast.success('تم الاتصال بنجاح');
      
      // Create bucket
      toast.info('إنشاء مساحة تخزين المستندات...');
      const bucketResult = await createDocumentsBucketManually();
      
      if (bucketResult.success) {
        toast.success('✅ تم إعداد نظام المستندات بنجاح! يمكنك الآن رفع المستندات.');
      } else {
        toast.error(`فشل في إنشاء مساحة التخزين: ${bucketResult.error}`);
      }
    } catch (error: any) {
      toast.error(`خطأ في الإعداد: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={setupStorage}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري الإعداد...
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          إعداد نظام المستندات
        </>
      )}
    </Button>
  );
}; 