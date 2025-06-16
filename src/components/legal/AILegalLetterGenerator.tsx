import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { legalAIService, GeneratedLetter, LegalLetterRequest } from '@/services/LegalAIService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Brain, 
  FileText, 
  Download, 
  Eye,
  History,
  Bot,
  DollarSign,
  Car
} from 'lucide-react';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

const AILegalLetterGenerator = () => {
  const { language } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [letterType, setLetterType] = useState<'contract_cancellation' | 'payment_reminder' | 'traffic_fine_notice' | 'installment_reschedule_request'>('installment_reschedule_request');
  const [reason, setReason] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedLetter | null>(null);
  const [letterHistory, setLetterHistory] = useState<GeneratedLetter[]>([]);

  // Helper to determine if reason is required
  const isReasonRequired = letterType === 'installment_reschedule_request';

  useEffect(() => {
    loadCustomers();
    loadLetterHistory();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, email, phone')
        .order('full_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('خطأ في تحميل العملاء');
    }
  };

  const loadLetterHistory = async () => {
    try {
      const history = await legalAIService.getLetterHistory();
      setLetterHistory(history);
    } catch (error) {
      console.error('Error loading letter history:', error);
    }
  };

  const generateLetter = async () => {
    if (!selectedCustomer) {
      toast.error('يرجى اختيار عميل');
      return;
    }

    if (isReasonRequired && !reason.trim()) {
      toast.error('يرجى إدخال أسباب طلب إعادة الجدولة');
      return;
    }

    setIsGenerating(true);
    try {
      const request: LegalLetterRequest = {
        type: letterType,
        customerId: selectedCustomer,
        reason: reason || getDefaultReason(letterType),
        language: 'ar'
      };

      const letter = await legalAIService.generateLegalLetter(request);
      setGeneratedLetter(letter);
      await loadLetterHistory();
      
      toast.success('تم إنشاء الخطاب بنجاح');
    } catch (error) {
      console.error('Error generating letter:', error);
      toast.error('خطأ في إنشاء الخطاب');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDefaultReason = (type: string): string => {
    const reasons = {
      contract_cancellation: 'إلغاء العقد',
      payment_reminder: 'تذكير بالسداد',
      traffic_fine_notice: 'إشعار مخالفات مرورية',
      installment_reschedule_request: 'طلب إعادة جدولة الأقساط'
    };
    return reasons[type as keyof typeof reasons] || '';
  };

  const downloadLetter = (letter: GeneratedLetter) => {
    const blob = new Blob([letter.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${letter.title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print helper
  const printLetter = (letter: GeneratedLetter) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${letter.title}</title><style>body{font-family: 'Tahoma', sans-serif; white-space:pre-wrap; direction:rtl; text-align:right;}</style></head><body>${letter.content.replace(/\n/g, '<br/>')}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Brain className="h-6 w-6 text-blue-500" />
            مولد الخطابات القانونية بالذكاء الاصطناعي
          </CardTitle>
          <div className="text-sm text-muted-foreground text-right">
            استخدم الذكاء الاصطناعي لإنشاء خطابات قانونية رسمية مدربة على القانون القطري
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Bot className="h-5 w-5 text-green-500" />
              إنشاء خطاب جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-right block mb-2">اختيار العميل</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر عميلاً..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="text-right">
                        <div className="font-medium">{customer.full_name}</div>
                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right block mb-2">نوع الخطاب</Label>
              <Select value={letterType} onValueChange={setLetterType as any}>
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installment_reschedule_request">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      طلب إعادة جدولة أقساط
                    </div>
                  </SelectItem>
                  <SelectItem value="contract_cancellation">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      إلغاء عقد
                    </div>
                  </SelectItem>
                  <SelectItem value="payment_reminder">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      تذكير بالسداد
                    </div>
                  </SelectItem>
                  <SelectItem value="traffic_fine_notice">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      إشعار مخالفات مرورية
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right block mb-2">السبب (اختياري)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isReasonRequired ? 'يرجى ذكر جميع الأسباب مفصّلة...' : 'اتركه فارغاً للاستخدام التلقائي للذكاء الاصطناعي'}
                className="text-right min-h-[90px]"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-r-4 border-blue-500">
              <div className="flex items-start gap-2">
                <Brain className="h-5 w-5 text-blue-500 mt-1" />
                <div className="text-sm text-right">
                  <p className="font-medium text-blue-900 mb-1">الذكاء الاصطناعي سيقوم بـ:</p>
                  <ul className="text-blue-800 space-y-1">
                    <li>• تجميع بيانات العميل من النظام</li>
                    <li>• حساب المبالغ المستحقة والأقساط المتأخرة</li>
                    <li>• جلب معلومات المخالفات المرورية</li>
                    <li>• تطبيق القانون القطري المناسب</li>
                    <li>• إنشاء خطاب رسمي بالصيغة الصحيحة</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={generateLetter} 
              disabled={isGenerating || !selectedCustomer}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Brain className="h-4 w-4 animate-pulse" />
                  جاري الإنشاء بالذكاء الاصطناعي...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  إنشاء الخطاب بالذكاء الاصطناعي
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Eye className="h-5 w-5 text-purple-500" />
              معاينة الخطاب المُولد
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedLetter ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="text-right">
                    <h3 className="font-medium">{generatedLetter.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(generatedLetter.generatedAt).toLocaleString('ar-QA')}
                    </p>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-right text-sm leading-relaxed">
                    {generatedLetter.content}
                  </pre>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadLetter(generatedLetter)}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    تحميل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printLetter(generatedLetter)}
                    className="gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    طباعة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>اختر عميلاً واضغط على "إنشاء الخطاب" لبدء إنشاء خطاب قانوني</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {letterHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <History className="h-5 w-5 text-amber-500" />
              سجل الخطابات المُولدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {letterHistory.map((letter) => (
                <div
                  key={letter.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="text-right">
                    <h4 className="font-medium">{letter.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(letter.generatedAt).toLocaleString('ar-QA')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadLetter(letter)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AILegalLetterGenerator; 