import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Car, 
  Calendar,
  Save,
  Camera,
  Loader2,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { carRentalContractOcrService } from '@/services/car-rental-contract-ocr';
import type { CarRentalContractData, ContractOcrResult } from '@/services/car-rental-contract-ocr';
import { toast } from 'sonner';
import { ContractDataConfirmation } from './ContractDataConfirmation';

interface CarRentalContractProcessorProps {
  open?: boolean;
  onDataExtracted?: (customerData: CustomerInfo, contractData: any) => void;
  onClose?: () => void;
}

interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  driver_license: string;
  nationality: string;
  address: string;
}

const CarRentalContractProcessor: React.FC<CarRentalContractProcessorProps> = ({
  open = false,
  onDataExtracted,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractionResult, setExtractionResult] = useState<ContractOcrResult | null>(null);
  const [editableData, setEditableData] = useState<CarRentalContractData | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [confirmedData, setConfirmedData] = useState<{customerData: CustomerInfo, contractData: any} | null>(null);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setCurrentStep(2);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const processContract = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // محاكاة تقدم المعالجة
      const progressSteps = [
        { step: 20, message: 'قراءة الملف...' },
        { step: 40, message: 'استخراج النص بـ Google Vision...' },
        { step: 70, message: 'تحليل النص بـ ChatGPT...' },
        { step: 90, message: 'معالجة البيانات...' },
        { step: 100, message: 'اكتمل!' }
      ];

      for (const progressStep of progressSteps) {
        setProcessingProgress(progressStep.step);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // تحويل الملف إلى base64
      const base64 = await fileToBase64(uploadedFile);
      
      // معالجة العقد باستخدام ChatGPT + Google Vision API
      const result = await carRentalContractOcrService.extractContractFromImage(base64);
      
      setExtractionResult(result);
      
      if (result.success && result.data) {
        setEditableData(result.data);
        setCurrentStep(3);
        
        const confidenceLevel = result.confidence || 0;
        
        // عرض رسالة مناسبة حسب مستوى الثقة والنتيجة
        if (confidenceLevel > 70) {
          toast.success("تم معالجة العقد بنجاح! 🎉", {
            description: `تم استخراج البيانات بثقة ${confidenceLevel}%`,
          });
        } else if (confidenceLevel > 40) {
          toast.warning("تم معالجة العقد جزئياً ⚠️", {
            description: `تم استخراج بعض البيانات (${confidenceLevel}%) - يرجى مراجعة وتصحيح البيانات`,
          });
        } else {
          toast.info("تم إنشاء نموذج فارغ للملء اليدوي 📝", {
            description: "لم يتم استخراج البيانات تلقائياً - يرجى ملء البيانات يدوياً",
          });
        }
      } else {
        // في حالة الفشل، إظهار رسالة تشخيص مفيدة
        const errorMessage = result.debugInfo?.warningMessage || result.error || "فشل في معالجة العقد";
        const diagnostics = result.debugInfo?.diagnostics;
        
        if (diagnostics) {
          // إظهار رسالة تشخيص مفصلة
          toast.error(`خطأ في قراءة العقد: ${diagnostics.issue}`, {
            description: diagnostics.suggestion,
            duration: 6000,
          });
          
          // إذا كانت البيانات متوفرة حتى لو فشل OCR، اعرضها
          if (result.data) {
            setEditableData(result.data);
            setCurrentStep(3);
            
            toast.info("تم إنشاء نموذج فارغ للملء اليدوي 📝", {
              description: "يرجى ملء البيانات يدوياً لإنشاء الاتفاقية",
            });
          }
        } else {
          toast.error("فشل في معالجة العقد", {
            description: errorMessage,
          });
        }
      }
      
    } catch (error) {
      console.error('خطأ في معالجة العقد:', error);
      toast.error("خطأ في المعالجة", {
        description: "حدث خطأ أثناء معالجة العقد",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // دوال التعامل مع الكاميرا
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // الكاميرا الخلفية للجوال
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error('خطأ في تشغيل الكاميرا:', error);
      toast.error("خطأ في الكاميرا", {
        description: "تعذر الوصول إلى الكاميرا. تأكد من السماح بالوصول للكاميرا.",
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // تحويل الصورة إلى blob ثم إلى file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `contract-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setUploadedFile(file);
          stopCamera();
          setCurrentStep(2);
          
          toast.success("تم التقاط الصورة بنجاح! 📸", {
            description: "يمكنك الآن معالجة العقد",
          });
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const updateField = (path: string, value: string | number) => {
    if (!editableData) return;
    
    const updatedData = { ...editableData };
    setNestedValue(updatedData, path, value);
    setEditableData(updatedData);
  };

  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  };

  const handleCreateAgreement = async () => {
    if (!editableData) return;

    // التحقق من اكتمال البيانات الأساسية
    const requiredFields = [
      { field: editableData.customer.fullName, name: 'اسم العميل' },
      { field: editableData.customer.qidNumber, name: 'رقم الهوية القطرية' },
      { field: editableData.customer.phoneNumber, name: 'رقم الهاتف' },
      { field: editableData.vehicle.brand, name: 'ماركة المركبة' },
      { field: editableData.vehicle.registrationNumber, name: 'رقم اللوحة' },
      { field: editableData.contract.startDate, name: 'تاريخ بداية العقد' }
    ];

    const missingFields = requiredFields.filter(item => !item.field || item.field.toString().trim() === '');

    if (missingFields.length > 0) {
      toast.error("بيانات ناقصة ⚠️", {
        description: `يرجى ملء الحقول التالية: ${missingFields.map(f => f.name).join(', ')}`,
        duration: 5000,
      });
      return;
    }

    // التحقق من صحة رقم الهوية (11 رقم)
    if (editableData.customer.qidNumber.length !== 11) {
      toast.error("رقم هوية غير صحيح", {
        description: "رقم الهوية القطرية يجب أن يكون 11 رقماً",
      });
      return;
    }

    // التحقق من صحة رقم الهاتف القطري
    if (!/^[35679]\d{7}$/.test(editableData.customer.phoneNumber)) {
      toast.error("رقم هاتف غير صحيح", {
        description: "رقم الهاتف يجب أن يبدأ بـ 3، 5، 6، 7، أو 9 ويكون 8 أرقام",
      });
      return;
    }

    // 🎯 الانتقال إلى صفحة تأكيد البيانات
    console.log('🔄 الانتقال إلى صفحة تأكيد البيانات...');
    
    // تحضير بيانات العميل
    const customerInfo: CustomerInfo = {
      id: '', // سيتم إنشاؤه لاحقاً
      full_name: editableData.customer.fullName,
      email: '',
      phone_number: editableData.customer.phoneNumber,
      driver_license: editableData.customer.qidNumber,
      nationality: editableData.customer.nationality,
      address: 'الدوحة'
    };

    // تحضير بيانات العقد
    const contractData = {
      contract: {
        startDate: editableData.contract.startDate,
        monthlyRent: editableData.contract.monthlyRent,
        contractDuration: editableData.contract.contractDuration,
        depositAmount: editableData.contract.depositAmount
      },
      vehicle: {
        brand: editableData.vehicle.brand,
        registrationNumber: editableData.vehicle.registrationNumber,
        manufacturingYear: editableData.vehicle.manufacturingYear,
        color: editableData.vehicle.color,
        chassisNumber: editableData.vehicle.chassisNumber
      },
      confidence: extractionResult?.confidence || 0,
      debugInfo: extractionResult?.debugInfo
    };

    console.log('✅ تم تحضير البيانات للعرض:', { customerInfo, contractData });

    // حفظ البيانات والانتقال للخطوة 4 (التأكيد)
    setConfirmedData({ customerData: customerInfo, contractData });
    setCurrentStep(4);

    toast.success("تم التحقق من البيانات بنجاح! 🎉", {
      description: `راجع البيانات في الصفحة التالية قبل إنشاء الاتفاقية`,
      duration: 3000,
    });
  };

  const resetProcessor = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setExtractionResult(null);
    setEditableData(null);
    setConfirmedData(null);
    setProcessingProgress(0);
    stopCamera(); // إيقاف الكاميرا عند إعادة التعيين
  };

  // تنظيف الكاميرا عند إغلاق المكون
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ربط الكاميرا بعنصر الفيديو
  React.useEffect(() => {
    if (cameraStream && showCamera) {
      const video = document.getElementById('camera-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = cameraStream;
      }
    }
  }, [cameraStream, showCamera]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3 text-blue-800">
            <Brain className="w-8 h-8" />
            معالج العقود
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {[
              { step: 1, title: "رفع الملف", icon: <Upload className="w-5 h-5" /> },
              { step: 2, title: "معالجة بـ AI", icon: <Brain className="w-5 h-5" /> },
              { step: 3, title: "مراجعة البيانات", icon: <Save className="w-5 h-5" /> },
              { step: 4, title: "تأكيد وإنشاء", icon: <CheckCircle className="w-5 h-5" /> }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${currentStep >= item.step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                  }
                `}>
                  {item.icon}
                </div>
                <span className={`mr-2 ${currentStep >= item.step ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                  {item.title}
                </span>
                {index < 3 && (
                  <div className={`w-16 h-1 mx-4 ${currentStep > item.step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: File Upload */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  رفع عقد إيجار السيارة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showCamera ? (
                  <>
                    {/* خيارات الرفع */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* زر الكاميرا */}
                      <Button
                        onClick={startCamera}
                        variant="outline"
                        size="lg"
                        className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                      >
                        <Camera className="w-8 h-8 text-blue-600" />
                        <div className="text-center">
                          <div className="font-semibold text-blue-700">تصوير من الكاميرا</div>
                          <div className="text-sm text-gray-500">التقط صورة مباشرة</div>
                        </div>
                      </Button>

                      {/* زر رفع الملف */}
                      <div
                        {...getRootProps()}
                        className={`
                          h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                          ${isDragActive 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-green-300 hover:border-green-500 hover:bg-green-50'
                          }
                        `}
                      >
                        <input {...getInputProps()} />
                        <Upload className="w-8 h-8 text-green-600" />
                        <div className="text-center">
                          <div className="font-semibold text-green-700">
                            {isDragActive ? 'اسحب الملف هنا' : 'رفع ملف'}
                          </div>
                          <div className="text-sm text-gray-500">PNG, JPG, PDF</div>
                        </div>
                      </div>
                    </div>

                    {/* نصائح الاستخدام */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-gray-700">نصائح للحصول على أفضل النتائج:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• تأكد من وضوح النص في العقد</li>
                        <li>• استخدم إضاءة جيدة عند التصوير</li>
                        <li>• تجنب الظلال أو الانعكاسات</li>
                        <li>• تأكد من أن العقد مسطح وغير مطوي</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  /* واجهة الكاميرا */
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        id="camera-video"
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 md:h-96 object-cover"
                      />
                      
                      {/* أزرار التحكم في الكاميرا */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                        <Button
                          onClick={capturePhoto}
                          size="lg"
                          className="bg-white text-black hover:bg-gray-100 rounded-full w-16 h-16 p-0"
                        >
                          <Camera className="w-8 h-8" />
                        </Button>
                        <Button
                          onClick={stopCamera}
                          variant="outline"
                          size="lg"
                          className="bg-red-600 text-white border-red-600 hover:bg-red-700 rounded-full w-16 h-16 p-0"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center text-gray-600">
                      <p className="text-lg font-semibold mb-2">وجه الكاميرا نحو العقد</p>
                      <p className="text-sm">تأكد من وضوح النص واضغط على زر الكاميرا للالتقاط</p>
                    </div>
                  </div>
                )}
                
                {uploadedFile && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">{uploadedFile.name}</span>
                      <Badge variant="secondary">{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: AI Processing */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  معالجة العقد بـ ChatGPT + Google Vision API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isProcessing ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Brain className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-lg">جاهز لمعالجة العقد باستخدام ChatGPT + Google Vision API</p>
                    <Button onClick={processContract} size="lg" className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      بدء المعالجة الذكية
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                      <p className="font-semibold">جاري المعالجة بـ ChatGPT + Google Vision API...</p>
                    </div>
                    <Progress value={processingProgress} className="w-full" />
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• استخراج النص من الصورة باستخدام Google Vision OCR</p>
                      <p>• تحليل النص بالذكاء الاصطناعي ChatGPT</p>
                      <p>• استخراج البيانات وتصحيح الأخطاء تلقائياً</p>
                      <p>• التحقق من صحة البيانات</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review and Edit Data */}
          {currentStep === 3 && editableData && (
            <div className="space-y-6">
              {/* Extraction Results Summary */}
              <Card className={`border-l-4 ${extractionResult?.success ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {extractionResult?.success ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">
                          {extractionResult?.success ? 'تم استخراج البيانات بنجاح!' : 'فشل في الاستخراج'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          معالج بواسطة ChatGPT AI
                        </p>
                      </div>
                    </div>
                    
                    {extractionResult?.confidence && (
                      <Badge variant={extractionResult.confidence > 80 ? 'default' : 'secondary'}>
                        الثقة: {extractionResult.confidence}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Data */}
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <User className="w-5 h-5" />
                    بيانات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        value={editableData.customer.fullName}
                        onChange={(e) => updateField('customer.fullName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">الجنسية</Label>
                      <Input
                        id="nationality"
                        value={editableData.customer.nationality}
                        onChange={(e) => updateField('customer.nationality', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="qidNumber">رقم الهوية القطرية</Label>
                      <Input
                        id="qidNumber"
                        value={editableData.customer.qidNumber}
                        onChange={(e) => updateField('customer.qidNumber', e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ملاحظة: رقم رخصة القيادة سيكون نفس رقم الهوية القطرية
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                      <Input
                        id="phoneNumber"
                        value={editableData.customer.phoneNumber}
                        onChange={(e) => updateField('customer.phoneNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">العنوان</Label>
                      <Input
                        id="address"
                        value="الدوحة"
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        العنوان ثابت: الدوحة
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Data */}
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Car className="w-5 h-5" />
                    بيانات المركبة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">الماركة</Label>
                      <Input
                        id="brand"
                        value={editableData.vehicle.brand}
                        onChange={(e) => updateField('vehicle.brand', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="registrationNumber">رقم اللوحة</Label>
                      <Input
                        id="registrationNumber"
                        value={editableData.vehicle.registrationNumber}
                        onChange={(e) => updateField('vehicle.registrationNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="chassisNumber">رقم الشاسيه</Label>
                      <Input
                        id="chassisNumber"
                        value={editableData.vehicle.chassisNumber}
                        onChange={(e) => updateField('vehicle.chassisNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="manufacturingYear">سنة الصنع</Label>
                      <Input
                        id="manufacturingYear"
                        value={editableData.vehicle.manufacturingYear}
                        onChange={(e) => updateField('vehicle.manufacturingYear', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">اللون</Label>
                      <Input
                        id="color"
                        value={editableData.vehicle.color || ''}
                        onChange={(e) => updateField('vehicle.color', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Data */}
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Calendar className="w-5 h-5" />
                    بيانات العقد
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">تاريخ بداية العقد</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={editableData.contract.startDate}
                        onChange={(e) => updateField('contract.startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthlyRent">الإيجار الشهري (ريال قطري)</Label>
                      <Input
                        id="monthlyRent"
                        type="number"
                        value={editableData.contract.monthlyRent || ''}
                        onChange={(e) => updateField('contract.monthlyRent', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contractDuration">مدة العقد (بالأشهر)</Label>
                      <Input
                        id="contractDuration"
                        type="number"
                        value={editableData.contract.contractDuration || ''}
                        onChange={(e) => updateField('contract.contractDuration', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="depositAmount">مبلغ الضمان (ريال قطري)</Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        placeholder="0.00"
                        value={editableData.contract.depositAmount || ''}
                        onChange={(e) => updateField('contract.depositAmount', parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        إدخال يدوي - مبلغ التأمين المطلوب من العميل
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>ملاحظة:</strong> جميع المبالغ يتم إدخالها يدوياً حسب اتفاق الطرفين. يمكنك تعديل أي قيمة حسب الحاجة.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleCreateAgreement}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  متابعة إلى نموذج الاتفاقية
                </Button>
                
                <Button
                  onClick={resetProcessor}
                  variant="outline"
                  size="lg"
                >
                  معالجة عقد جديد
                </Button>

                {onClose && (
                  <Button
                    onClick={onClose}
                    variant="secondary"
                    size="lg"
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Data Confirmation */}
          {currentStep === 4 && confirmedData && (
            <ContractDataConfirmation
              customerData={confirmedData.customerData}
              contractData={confirmedData.contractData}
              onBack={() => setCurrentStep(3)}
              onClose={onClose || (() => {})}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarRentalContractProcessor;