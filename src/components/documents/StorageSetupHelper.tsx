import React, { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings,
  Database,
  Loader2 
} from 'lucide-react';
import { 
  testStorageConnection, 
  createDocumentsBucketManually,
  ensureDocumentsBucket 
} from '@/lib/documents/document-storage';
import { toast } from 'sonner';

interface StorageSetupHelperProps {
  onSetupComplete?: () => void;
}

export const StorageSetupHelper: React.FC<StorageSetupHelperProps> = ({ 
  onSetupComplete 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    error?: string;
  }>({ tested: false, success: false });
  
  const [bucketStatus, setBucketStatus] = useState<{
    tested: boolean;
    success: boolean;
    error?: string;
  }>({ tested: false, success: false });

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testStorageConnection();
      setConnectionStatus({ 
        tested: true, 
        success: result.success, 
        error: result.error 
      });
      
      if (result.success) {
        toast.success('تم الاتصال بنجاح مع Supabase Storage');
      } else {
        toast.error(`فشل الاتصال: ${result.error}`);
      }
    } catch (error: any) {
      setConnectionStatus({ 
        tested: true, 
        success: false, 
        error: error.message 
      });
      toast.error('خطأ في اختبار الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const setupBucket = async () => {
    setIsLoading(true);
    try {
      const result = await createDocumentsBucketManually();
      setBucketStatus({ 
        tested: true, 
        success: result.success, 
        error: result.error 
      });
      
      if (result.success) {
        toast.success('تم إنشاء مساحة التخزين بنجاح');
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        toast.error(`فشل في إنشاء مساحة التخزين: ${result.error}`);
      }
    } catch (error: any) {
      setBucketStatus({ 
        tested: true, 
        success: false, 
        error: error.message 
      });
      toast.error('خطأ في إنشاء مساحة التخزين');
    } finally {
      setIsLoading(false);
    }
  };

  const fullSetup = async () => {
    setIsLoading(true);
    try {
      // Test connection first
      const connectionResult = await testStorageConnection();
      setConnectionStatus({ 
        tested: true, 
        success: connectionResult.success, 
        error: connectionResult.error 
      });
      
      if (!connectionResult.success) {
        toast.error(`فشل الاتصال: ${connectionResult.error}`);
        return;
      }
      
      // Then ensure bucket exists
      const bucketResult = await ensureDocumentsBucket();
      setBucketStatus({ 
        tested: true, 
        success: bucketResult.success, 
        error: bucketResult.error 
      });
      
      if (bucketResult.success) {
        toast.success('تم إعداد نظام المستندات بنجاح');
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        toast.error(`فشل في إعداد مساحة التخزين: ${bucketResult.error}`);
      }
    } catch (error: any) {
      toast.error('خطأ في الإعداد الكامل');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: { tested: boolean; success: boolean }) => {
    if (!status.tested) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return status.success ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (status: { tested: boolean; success: boolean }) => {
    if (!status.tested) {
      return <Badge variant="secondary">غير مختبر</Badge>;
    }
    return status.success ? 
      <Badge variant="default" className="bg-green-100 text-green-800">جاهز</Badge> : 
      <Badge variant="destructive">خطأ</Badge>;
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Settings className="h-5 w-5" />
          إعداد نظام المستندات
        </CardTitle>
        <CardDescription className="text-right">
          اختبار وإعداد Supabase Storage لرفع المستندات
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(connectionStatus)}
            <div className="text-right">
              <h4 className="font-medium">اتصال قاعدة البيانات</h4>
              <p className="text-sm text-muted-foreground">
                التحقق من الاتصال مع Supabase Storage
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(connectionStatus)}
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "اختبار"}
            </Button>
          </div>
        </div>

        {/* Error display for connection */}
        {connectionStatus.tested && !connectionStatus.success && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              خطأ في الاتصال: {connectionStatus.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Bucket Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(bucketStatus)}
            <div className="text-right">
              <h4 className="font-medium">مساحة تخزين المستندات</h4>
              <p className="text-sm text-muted-foreground">
                إنشاء مساحة تخزين للمستندات (documents bucket)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(bucketStatus)}
            <Button
              variant="outline"
              size="sm"
              onClick={setupBucket}
              disabled={isLoading || !connectionStatus.success}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء"}
            </Button>
          </div>
        </div>

        {/* Error display for bucket */}
        {bucketStatus.tested && !bucketStatus.success && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              خطأ في مساحة التخزين: {bucketStatus.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success message */}
        {connectionStatus.success && bucketStatus.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              ✅ نظام المستندات جاهز للاستخدام! يمكنك الآن رفع المستندات بنجاح.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={fullSetup}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري الإعداد...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 ml-2" />
                إعداد كامل
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setConnectionStatus({ tested: false, success: false });
              setBucketStatus({ tested: false, success: false });
            }}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 