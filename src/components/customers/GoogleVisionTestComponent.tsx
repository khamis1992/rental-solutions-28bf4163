import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Settings,
  Activity,
  Clock,
  Target,
  Eye,
  FileText,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { googleVisionOCR, ExtractedIdData, OCRResult } from '@/services/google-vision-ocr';
import { idCardOCRService } from '@/services/id-card-ocr-service';

/**
 * مكون اختبار متقدم لنظام Google Vision OCR
 */
export const GoogleVisionTestComponent: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState<OCRResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingStats, setProcessingStats] = useState<any>(null);
  const [serviceInfo, setServiceInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحديث معلومات الخدمة عند تحميل المكون
  React.useEffect(() => {
    const info = idCardOCRService.getServiceInfo();
    setServiceInfo(info);
  }, []);

  /**
   * معالجة رفع الملف
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صالحة');
      return;
    }

    setIsProcessing(true);
    setTestResults(null);

    try {
      // عرض الصورة
      const reader = new FileReader();
      reader.onload = (e) => setCapturedImage(e.target?.result as string);
      reader.readAsDataURL(file);

      // معالجة بـ Google Vision
      const result = await googleVisionOCR.processIdCard(file);
      setTestResults(result);

      if (result.success) {
        toast.success(`✅ نجح المسح! دقة: ${result.data?.confidence}%`);
      } else {
        toast.error(`❌ فشل المسح: ${result.error}`);
      }

    } catch (error) {
      toast.error('خطأ في المعالجة');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setCapturedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-blue-600" />
            اختبار Google Vision OCR
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>رفع صورة للاختبار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="mb-4">اختر صورة بطاقة شخصية للاختبار</p>
            
            <div className="flex gap-3 justify-center">
              <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                اختيار صورة
              </Button>
              {testResults && (
                <Button variant="outline" onClick={clearResults}>
                  مسح النتائج
                </Button>
              )}
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>جاري المعالجة...</span>
              </div>
              <Progress value={75} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              النتائج
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.success && testResults.data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>الاسم:</strong> {testResults.data.fullName}</p>
                  <p><strong>رقم الهوية:</strong> {testResults.data.idNumber}</p>
                  <p><strong>الجنسية:</strong> {testResults.data.nationality}</p>
                  <p><strong>تاريخ الميلاد:</strong> {testResults.data.dateOfBirth}</p>
                </div>
                <div>
                  <p><strong>الدقة:</strong> {testResults.data.confidence}%</p>
                  <p><strong>وقت المعالجة:</strong> {testResults.processingTime}ms</p>
                  <Badge variant="secondary">
                    {testResults.data.confidence >= 90 ? 'ممتاز' : 
                     testResults.data.confidence >= 75 ? 'جيد' : 'متوسط'}
                  </Badge>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  فشل في المعالجة: {testResults.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Preview */}
      {capturedImage && (
        <Card>
          <CardHeader>
            <CardTitle>الصورة المرفوعة</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={capturedImage} 
              alt="البطاقة المرفوعة" 
              className="max-w-full max-h-64 mx-auto rounded-lg border"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 