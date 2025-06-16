import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { legalAIService, LegalLetterRequest, GeneratedLetter } from '@/services/LegalAIService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, FileText, Download, DollarSign, Car, Brain, MessageCircle, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/use-customers';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
}

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
  questionId?: string;
}

interface ConversationContext {
  recipient?: string;
  subject?: string;
  vehicleNumber?: string;
  vehicleInfo?: any;
  needsAuthorization?: boolean;
  letterType?: string;
  additionalInfo?: Record<string, any>;
}

const AILegalLetterGenerator = () => {
  const { language } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [conversationMode, setConversationMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [context, setContext] = useState<ConversationContext>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedLetter | null>(null);
  const [letterHistory, setLetterHistory] = useState<GeneratedLetter[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { customers: customersFromHook } = useCustomers();

  useEffect(() => {
    loadCustomers();
    loadLetterHistory();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number')
        .eq('role', 'customer')
        .order('full_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('خطأ في تحميل العملاء');
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'ai' | 'user', content: string, isQuestion = false, questionId = '') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isQuestion,
      questionId
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const startConversation = () => {
    setConversationMode(true);
    setMessages([]);
    setContext({});
    setGeneratedLetter(null);
    
    addMessage('ai', `مرحباً! أنا محامي الشركة الذكي 🤖

سأساعدك في كتابة خطاب قانوني احترافي من خلال طرح أسئلة مخصصة لفهم احتياجاتك.

**🎯 السؤال الأول: إلى من ستوجه هذا الخطاب؟**

أمثلة:
• مركز شرطة أم صلال
• شركة الأولى للتمويل  
• المرور العام
• البلدية
• المحكمة
• أي جهة أخرى...

اكتب اسم الجهة المطلوبة:`, true, 'recipient');
    
    setCurrentQuestionId('recipient');
  };

  const fetchVehicleInfo = async (vehicleNumber: string) => {
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .or(`license_plate.ilike.%${vehicleNumber}%, chassis_number.ilike.%${vehicleNumber}%`)
        .single();

      if (error) {
        console.log('Vehicle not found in database');
        return null;
      }

      return vehicle;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
  };

  const processUserResponse = async (response: string) => {
    setIsProcessing(true);
    
    try {
      // Add user message
      addMessage('user', response);
      
      // Update context based on current question
      const updatedContext = { ...context };
      
      switch (currentQuestionId) {
        case 'recipient':
          updatedContext.recipient = response;
          await askNextQuestion(updatedContext, 'subject');
          break;
          
        case 'subject':
          updatedContext.subject = response;
          // Check if subject involves vehicle
          if (response.toLowerCase().includes('مركبة') || 
              response.toLowerCase().includes('سيارة') ||
              response.toLowerCase().includes('استلام') ||
              response.toLowerCase().includes('حجز')) {
            await askNextQuestion(updatedContext, 'vehicle_number');
          } else {
            await askNextQuestion(updatedContext, 'details');
          }
          break;
          
        case 'vehicle_number':
          updatedContext.vehicleNumber = response;
          // Try to fetch vehicle info
          const vehicleInfo = await fetchVehicleInfo(response);
          if (vehicleInfo) {
            updatedContext.vehicleInfo = vehicleInfo;
            addMessage('ai', `✅ تم العثور على المركبة في النظام:

🚗 **معلومات المركبة:**
• نوع المركبة: ${vehicleInfo.make} ${vehicleInfo.model}
• رقم اللوحة: ${vehicleInfo.license_plate}
• سنة الصنع: ${vehicleInfo.year}
• اللون: ${vehicleInfo.color}

سيتم استخدام هذه المعلومات في الخطاب.`);
          } else {
            addMessage('ai', `⚠️ لم يتم العثور على المركبة في النظام.
سيتم استخدام الرقم المدخل (${response}) في الخطاب.`);
          }
          await askNextQuestion(updatedContext, 'details');
          break;
          
        case 'details':
          if (response.toLowerCase() !== 'لا' && response.toLowerCase() !== 'لايوجد') {
            updatedContext.additionalInfo = { ...updatedContext.additionalInfo, details: response };
          }
          await askNextQuestion(updatedContext, 'authorization');
          break;
          
        case 'authorization':
          updatedContext.needsAuthorization = response.toLowerCase().includes('نعم') || 
                                            response.toLowerCase().includes('يحتاج') ||
                                            response.toLowerCase().includes('مطلوب');
          await askNextQuestion(updatedContext, 'confirmation');
          break;
          
        case 'confirmation':
          if (response.toLowerCase().includes('نعم') || 
              response.toLowerCase().includes('موافق') ||
              response.toLowerCase().includes('أنشئ')) {
            await generateLetter(updatedContext);
          } else {
            await askNextQuestion(updatedContext, 'modification');
          }
          break;
          
        case 'modification':
          updatedContext.additionalInfo = { 
            ...updatedContext.additionalInfo, 
            modifications: response 
          };
          await generateLetter(updatedContext);
          break;
      }
      
      setContext(updatedContext);
      
    } catch (error) {
      console.error('Error processing response:', error);
      addMessage('ai', `❌ عذراً، حدث خطأ في معالجة ردك. يرجى المحاولة مرة أخرى.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const askNextQuestion = async (currentContext: ConversationContext, nextQuestionType: string) => {
    let questionContent = '';
    let questionId = '';

    switch (nextQuestionType) {
      case 'subject':
        questionContent = `**📝 ما هو موضوع الخطاب؟**

أمثلة حسب الجهة:
${currentContext.recipient?.toLowerCase().includes('شرطة') ? 
  '• طلب استلام مركبة محجوزة\n• بلاغ عن حادث\n• طلب تحرير محضر' :
  currentContext.recipient?.toLowerCase().includes('مرور') ?
  '• طلب إلغاء مخالفة\n• استعلام عن نقاط\n• طلب ترخيص' :
  '• طلب إعادة جدولة\n• إشعار دفع\n• شكوى رسمية'
}

اكتب موضوع الخطاب:`;
        questionId = 'subject';
        break;
        
      case 'vehicle_number':
        questionContent = `**🚗 ما هو رقم المركبة؟**

يمكنك إدخال:
• رقم اللوحة (مثل: 123456)
• رقم الشاسيه
• أي رقم تعريفي للمركبة

سيقوم النظام بالبحث عن معلومات المركبة تلقائياً:`;
        questionId = 'vehicle_number';
        break;
        
      case 'details':
        questionContent = `**📋 هل توجد تفاصيل إضافية مهمة؟**

مثل:
• تاريخ محدد
• مبالغ مالية
• أرقام مرجعية
• أي معلومات أخرى

اكتب التفاصيل أو "لا" إذا لم توجد:`;
        questionId = 'details';
        break;
        
      case 'authorization':
        questionContent = `**🔐 هل يحتاج الخطاب لتفويض رسمي؟**

• **نعم** - سيتم إضافة تفويض أسامة أحمد البشرى
• **لا** - خطاب بدون تفويض

معظم الخطابات للجهات الحكومية تحتاج تفويض:`;
        questionId = 'authorization';
        break;
        
      case 'confirmation':
        const summary = `**✅ ملخص الخطاب:**

📍 **المرسل إليه:** ${currentContext.recipient}
📝 **الموضوع:** ${currentContext.subject}
${currentContext.vehicleNumber ? `🚗 **رقم المركبة:** ${currentContext.vehicleNumber}` : ''}
${currentContext.vehicleInfo ? `   (${currentContext.vehicleInfo.make} ${currentContext.vehicleInfo.model})` : ''}
${currentContext.additionalInfo?.details ? `📋 **تفاصيل:** ${currentContext.additionalInfo.details}` : ''}
🔐 **التفويض:** ${currentContext.needsAuthorization ? 'نعم - أسامة أحمد البشرى' : 'لا'}

**هل المعلومات صحيحة؟**
اكتب "نعم" لإنشاء الخطاب أو "تعديل" للتعديل:`;
        questionContent = summary;
        questionId = 'confirmation';
        break;
        
      case 'modification':
        questionContent = `**✏️ ما التعديل المطلوب؟**

يمكنك تعديل أو إضافة أي معلومات تريدها في الخطاب:`;
        questionId = 'modification';
        break;
    }

    if (questionContent) {
      addMessage('ai', questionContent, true, questionId);
      setCurrentQuestionId(questionId);
    }
  };

  const generateLetter = async (finalContext: ConversationContext) => {
    setIsProcessing(true);
    
    try {
      addMessage('ai', `🤖 **جاري إنشاء الخطاب...**

يتم الآن إنشاء خطاب احترافي باستخدام DeepSeek مع جميع المعلومات التي قدمتها.

⏳ يرجى الانتظار...`);

      // Build comprehensive prompt
      let vehicleDetails = '';
      if (finalContext.vehicleInfo) {
        vehicleDetails = `
معلومات المركبة من النظام:
- نوع المركبة: ${finalContext.vehicleInfo.make} ${finalContext.vehicleInfo.model}
- رقم اللوحة: ${finalContext.vehicleInfo.license_plate}
- سنة الصنع: ${finalContext.vehicleInfo.year}
- اللون: ${finalContext.vehicleInfo.color}`;
      } else if (finalContext.vehicleNumber) {
        vehicleDetails = `- رقم المركبة: ${finalContext.vehicleNumber}`;
      }

      // Prepare the letter request
      const letterRequest: LegalLetterRequest = {
        type: finalContext.subject || 'خطاب رسمي',
        reason: `خطاب موجه إلى ${finalContext.recipient} بخصوص ${finalContext.subject}`,
        language: language,
        customPrompt: `
هذا طلب لإنشاء خطاب رسمي بناءً على محادثة تفاعلية:

معلومات الخطاب:
- المرسل إليه: ${finalContext.recipient}
- الموضوع: ${finalContext.subject}
${vehicleDetails}
${finalContext.additionalInfo?.details ? `- تفاصيل إضافية: ${finalContext.additionalInfo.details}` : ''}
${finalContext.additionalInfo?.modifications ? `- طلبات تعديل: ${finalContext.additionalInfo.modifications}` : ''}

التفويض: ${finalContext.needsAuthorization ? 'يجب تضمين تفويض أسامة أحمد البشرى' : 'لا يحتاج تفويض'}

يرجى إنشاء خطاب رسمي احترافي مناسب للسياق المحدد مع مراعاة طبيعة الجهة المرسل إليها.

إذا كان الخطاب موجه للشرطة أو جهة حكومية، استخدم أسلوباً رسمياً ومهذباً.
إذا كان موجه لشركة، استخدم أسلوباً تجارياً احترافياً.`
      };

      const result = await legalAIService.generateLegalLetter(letterRequest);
      
      setGeneratedLetter(result);
      
      await loadLetterHistory();
      
      addMessage('ai', `✅ **تم إنشاء الخطاب بنجاح!**

يمكنك الآن مراجعة الخطاب أدناه. إذا كنت تريد تعديل شيء، يمكنك:

🔄 بدء محادثة جديدة للحصول على خطاب مختلف
📝 نسخ النص وتعديله يدوياً
🖨️ طباعة الخطاب مباشرة

شكراً لاستخدامك النظام التفاعلي! 🎉`);
      
    } catch (error) {
      console.error('Error generating letter:', error);
      addMessage('ai', `❌ **خطأ في إنشاء الخطاب**

عذراً، حدث خطأ في إنشاء الخطاب. يرجى:
• التأكد من اتصال الإنترنت
• المحاولة مرة أخرى
• أو استخدام النموذج التقليدي

يمكنك بدء محادثة جديدة والمحاولة مرة أخرى.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim() || isProcessing) return;
    
    const response = userInput.trim();
    setUserInput('');
    processUserResponse(response);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const downloadLetter = (letter: GeneratedLetter) => {
    const blob = new Blob([letter.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letter.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                🤖 DeepSeek متصل ومُفعل
              </h3>
              <p className="text-xs text-green-600">
                DeepSeek • محامي تفاعلي ذكي • قوانين دولة قطر
              </p>
            </div>
          </div>
          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            نظام تفاعلي متطور
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          مولد الخطابات القانونية التفاعلي
        </h2>
        <p className="text-gray-600">
          نظام ذكي يطرح أسئلة مخصصة لإنشاء خطابات قانونية احترافية
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Bot className="h-5 w-5 text-green-500" />
              إنشاء خطاب جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!conversationMode ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border-r-4 border-blue-500">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500 mt-1" />
                    <div className="text-sm text-right">
                      <p className="font-medium text-blue-900 mb-2">🎯 مميزات النظام التفاعلي:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-blue-800">
                        <div>
                          <p className="font-medium text-green-700 mb-1">🧠 ذكاء متطور:</p>
                          <ul className="space-y-1 text-xs">
                            <li>• أسئلة مخصصة لكل حالة</li>
                            <li>• فهم السياق تلقائياً</li>
                            <li>• البحث في بيانات المركبات</li>
                            <li>• اقتراحات ذكية للمحتوى</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-blue-700 mb-1">⚡ سرعة وكفاءة:</p>
                          <ul className="space-y-1 text-xs">
                            <li>• أسئلة أقل مع الوقت</li>
                            <li>• إنشاء أسرع للخطابات</li>
                            <li>• دقة أعلى في المحتوى</li>
                            <li>• توفير في الوقت والجهد</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={startConversation}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  >
                    🚀 ابدأ المحادثة التفاعلية
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Chat messages */}
                <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-500 text-white'
                              : message.isQuestion
                              ? 'bg-green-100 border-2 border-green-300'
                              : 'bg-white border'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.type === 'user' ? (
                              <User className="h-4 w-4 mt-1 flex-shrink-0" />
                            ) : (
                              <Bot className="h-4 w-4 mt-1 flex-shrink-0 text-green-600" />
                            )}
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString('ar-QA')}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-end">
                        <div className="bg-white border p-3 rounded-lg max-w-[85%]">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-sm">جاري المعالجة...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isProcessing}
                    className="px-6"
                  >
                    <Send className="h-4 w-4 ml-2" />
                    إرسال
                  </Button>
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="اكتب ردك هنا..."
                    disabled={isProcessing}
                    className="text-right"
                  />
                </div>

                {/* Control buttons */}
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setConversationMode(false);
                      setMessages([]);
                      setContext({});
                      setGeneratedLetter(null);
                    }}
                    className="text-sm"
                  >
                    🔄 بدء محادثة جديدة
                  </Button>
                  
                  {/* Customer selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">العميل (اختياري):</span>
                    <Select value={selectedCustomer || "no-customer"} onValueChange={(value) => setSelectedCustomer(value === "no-customer" ? "" : value)}>
                      <SelectTrigger className="w-48 text-right text-sm">
                        <SelectValue placeholder="اختر عميلاً..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-customer">
                          <div className="text-right text-muted-foreground text-sm">
                            بدون عميل محدد
                          </div>
                        </SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="text-right">
                              <div className="font-medium text-sm">{customer.full_name}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Bot className="h-5 w-5 text-purple-500" />
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
                    onClick={() => navigator.clipboard.writeText(generatedLetter.content)}
                    className="gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    نسخ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="gap-1"
                  >
                    🖨️ طباعة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>ابدأ المحادثة التفاعلية لإنشاء خطاب قانوني مخصص</p>
                <p className="text-xs mt-2">النظام سيطرح أسئلة ذكية لفهم احتياجاتك</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {letterHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Bot className="h-5 w-5 text-amber-500" />
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