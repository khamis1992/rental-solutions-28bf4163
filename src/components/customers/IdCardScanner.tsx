// ID Card Scanner Component - Complete Implementation
import React, { useState, useRef, useCallback } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { useIdCardScanner, ScanResult } from '@/hooks/use-id-card-scanner';
import { 
  Camera, 
  Upload, 
  FileImage, 
  Scan, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  User,
  CreditCard,
  Calendar,
  Globe,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react';
import { QatariIdCardData } from '@/services/google-vision-ocr';
import { toast } from 'sonner';

export interface IdCardScannerProps {
  onScanComplete?: (data: QatariIdCardData) => void;
  onScanError?: (error: string) => void;
  mockMode?: boolean;
  className?: string;
}

export const IdCardScanner: React.FC<IdCardScannerProps> = ({
  onScanComplete,
  onScanError,
  mockMode = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isScanning,
    lastResult,
    scanIdCard,
    scanFromCamera,
    scanFromDrop,
    clearResult,
    testWithMockData,
    options
  } = useIdCardScanner({
    mockData: mockMode,
    maxFileSize: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg']
  });

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const result = await scanFromCamera(event);
    
    if (result.success && result.data) {
      setShowResult(true);
      onScanComplete?.(result.data);
    } else if (result.error) {
      onScanError?.(result.error);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [scanFromCamera, onScanComplete, onScanError]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const result = await scanFromDrop(files);
      
      if (result.success && result.data) {
        setShowResult(true);
        onScanComplete?.(result.data);
      } else if (result.error) {
        onScanError?.(result.error);
      }
    }
  }, [scanFromDrop, onScanComplete, onScanError]);

  // Handle test scan
  const handleTestScan = useCallback(async () => {
    const result = await testWithMockData();
    
    if (result.success && result.data) {
      setShowResult(true);
      onScanComplete?.(result.data);
    } else if (result.error) {
      onScanError?.(result.error);
    }
  }, [testWithMockData, onScanComplete, onScanError]);

  // Handle clear result
  const handleClearResult = useCallback(() => {
    clearResult();
    setShowResult(false);
  }, [clearResult]);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Scanner Interface */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Scan className="h-6 w-6 text-blue-500" />
            مسح البطاقة الشخصية
          </CardTitle>
          <CardDescription className="text-center">
            {mockMode ? 
              'وضع التجريب - سيتم استخدام بيانات وهمية لاختبار النظام' :
              'امسح البطاقة الشخصية القطرية لاستخراج البيانات تلقائياً'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${isDragging 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
              ${isScanning ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            `}
            onClick={!isScanning ? triggerFileInput : undefined}
          >
            {isScanning ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">جاري المسح...</p>
                  <p className="text-sm text-muted-foreground">
                    {mockMode ? 'معالجة البيانات التجريبية' : 'تحليل البطاقة باستخدام Google Vision'}
                  </p>
                </div>
                <Progress value={65} className="w-64" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {isDragging ? (
                    <Download className="h-16 w-16 text-blue-500 animate-bounce" />
                  ) : (
                    <FileImage className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragging ? 'اترك الملف هنا' : 'اسحب صورة البطاقة أو انقر للتصفح'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG أو JPEG (حتى {options.maxFileSize}MB)
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-center gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    رفع ملف
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    التقاط صورة
                  </Button>
                  
                  {mockMode && (
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestScan();
                      }}
                      className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Eye className="h-4 w-4" />
                      اختبار سريع
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={options.allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Scanning Results */}
      {showResult && lastResult && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {lastResult.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    تم المسح بنجاح
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    فشل في المسح
                  </>
                )}
                
                {lastResult.confidence && (
                  <Badge 
                    variant={lastResult.confidence >= 85 ? "default" : "secondary"}
                    className="mr-2"
                  >
                    دقة: {lastResult.confidence}%
                  </Badge>
                )}
              </CardTitle>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearResult}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                مسح آخر
              </Button>
            </div>
            
            {lastResult.processingTime && (
              <CardDescription>
                وقت المعالجة: {(lastResult.processingTime / 1000).toFixed(1)} ثانية
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent>
            {lastResult.success && lastResult.data ? (
              <div className="space-y-4">
                {/* Extracted Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">الاسم الكامل</p>
                        <p className="font-medium">{lastResult.data.fullName || 'غير محدد'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">رقم الهوية</p>
                        <p className="font-mono">{lastResult.data.idNumber || 'غير محدد'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">تاريخ الميلاد</p>
                        <p className="font-medium">{lastResult.data.dateOfBirth || 'غير محدد'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">الجنسية</p>
                        <p className="font-medium">{lastResult.data.nationality || 'غير محدد'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {lastResult.data.expiryDate && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">تاريخ انتهاء البطاقة</p>
                        <p className="font-medium">{lastResult.data.expiryDate}</p>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Confidence Warning */}
                {lastResult.confidence && lastResult.confidence < 85 && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">انتبه: دقة منخفضة</p>
                      <p className="text-sm text-amber-700">
                        يرجى مراجعة البيانات المستخرجة والتأكد من صحتها قبل الحفظ
                      </p>
                    </div>
                  </div>
                )}
                
                {mockMode && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Eye className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">بيانات تجريبية</p>
                      <p className="text-sm text-green-700">
                        هذه بيانات وهمية للاختبار. في الوضع الحقيقي ستكون البيانات مستخرجة من البطاقة الفعلية
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">خطأ في المسح</p>
                  <p className="text-sm text-red-700">{lastResult.error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="font-medium text-blue-900">نصائح للحصول على أفضل النتائج:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                تأكد من وضوح صورة البطاقة وعدم وجود ظلال
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                استخدم إضاءة جيدة وتجنب الانعكاسات
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                تأكد من ظهور جميع النصوص في الصورة
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                استخدم صوراً بدقة عالية (PNG أو JPG)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
