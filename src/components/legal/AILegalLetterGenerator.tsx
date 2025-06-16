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

سأساعدك في كتابة خطاب قانوني احترافي. 

لنبدأ بالسؤال الأول:

**🎯 إلى من ستوجه هذا الخطاب؟**

أمثلة:
• مركز شرطة أم صلال
• شركة الأولى للتمويل  
• المرور العام
• البلدية
• أي جهة أخرى...`, true, 'recipient');
    
    setCurrentQuestionId('recipient');
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
          await askNextQuestion(updatedContext, 'vehicle_or_details');
          break;
          
        case 'vehicle_or_details':
          if (response.match(/\d+/)) {
            // If response contains numbers, treat as vehicle number
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
            await askNextQuestion(updatedContext, 'authorization');
          } else {
            updatedContext.additionalInfo = { ...updatedContext.additionalInfo, details: response };
            await askNextQuestion(updatedContext, 'authorization');
          }
          break;
          
        case 'authorization':
          updatedContext.needsAuthorization = response.toLowerCase().includes('نعم') || response.toLowerCase().includes('يحتاج');
          await askNextQuestion(updatedContext, 'final_confirmation');
          break;
          
        case 'final_confirmation':
          if (response.toLowerCase().includes('نعم') || response.toLowerCase().includes('موافق')) {
            await generateLetter(updatedContext);
          } else {
            await askNextQuestion(updatedContext, 'additional_info');
          }
          break;
          
        case 'additional_info':
          updatedContext.additionalInfo = { 
            ...updatedContext.additionalInfo, 
            additionalDetails: response 
          };
          await generateLetter(updatedContext);
          break;
      }
      
      setContext(updatedContext);
      
    } catch (error) {
      console.error('Error processing response:', error);
      addMessage('ai', `عذراً، حدث خطأ في معالجة ردك. يرجى المحاولة مرة أخرى.`);
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

أمثلة:
• طلب استلام مركبة
• إشعار بالدفع
• طلب إعادة جدولة
• شكوى رسمية
• اكتب الموضوع المطلوب...`;
        questionId = 'subject';
        break;
        
      case 'vehicle_or_details':
        if (currentContext.subject?.toLowerCase().includes('مركبة') || 
            currentContext.subject?.toLowerCase().includes('سيارة') ||
            currentContext.subject?.toLowerCase().includes('استلام') ||
            currentContext.subject?.toLowerCase().includes('حجز')) {
          questionContent = `**🚗 ما هو رقم المركبة؟**

يمكنك إدخال:
• رقم اللوحة (مثل: 123456)
• رقم الشاسيه
• أي رقم تعريفي للمركبة

سيقوم النظام بالبحث عن معلومات المركبة تلقائياً:`;
        } else {
          questionContent = `**📋 هل توجد تفاصيل إضافية مهمة؟**

مثل:
• تاريخ محدد
• مبالغ مالية
• أرقام مرجعية
• أي معلومات أخرى

اكتب التفاصيل أو "لا" إذا لم توجد:`;
        }
        questionId = 'vehicle_or_details';
        break;
        
      case 'authorization':
        questionContent = `**🔐 هل يحتاج الخطاب لتفويض؟**

• **نعم** - سيتم إضافة تفويض أسامة أحمد البشرى
• **لا** - خطاب بدون تفويض

(معظم الخطابات الرسمية تحتاج تفويض)`;
        questionId = 'authorization';
        break;
        
      case 'final_confirmation':
        const summary = `**✅ ملخص الخطاب:**

📍 **المرسل إليه:** ${currentContext.recipient}
📝 **الموضوع:** ${currentContext.subject}
${currentContext.vehicleNumber ? `🚗 **رقم المركبة:** ${currentContext.vehicleNumber}` : ''}
🔐 **التفويض:** ${currentContext.needsAuthorization ? 'نعم - أسامة أحمد البشرى' : 'لا'}

**هل المعلومات صحيحة وتريد إنشاء الخطاب؟**
اكتب "نعم" للمتابعة أو "تعديل" لإضافة معلومات`;
        questionContent = summary;
        questionId = 'final_confirmation';
        break;
        
      case 'additional_info':
        questionContent = `**📝 ما التعديل أو المعلومات الإضافية المطلوبة؟**

اكتب ما تريد إضافته أو تعديله في الخطاب.`;
        questionId = 'additional_info';
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

يتم الآن إنشاء خطاب احترافي باستخدام DeepSeek مع جميع المعلومات المطلوبة.

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
${finalContext.additionalInfo?.additionalDetails ? `- طلبات تعديل: ${finalContext.additionalInfo.additionalDetails}` : ''}

التفويض: ${finalContext.needsAuthorization ? 'يجب تضمين تفويض أسامة أحمد البشرى' : 'لا يحتاج تفويض'}

يرجى إنشاء خطاب رسمي احترافي مناسب للسياق المحدد مع مراعاة طبيعة الجهة المرسل إليها.

إذا كان الخطاب موجه للشرطة أو جهة حكومية، استخدم أسلوباً رسمياً ومهذباً.
إذا كان موجه لشركة، استخدم أسلوباً تجارياً احترافياً.`
      };

      const result = await legalAIService.generateLegalLetter(letterRequest);
      
      setGeneratedLetter(result);
      
      await loadLetterHistory();
      
      addMessage('ai', `✅ **تم إنشاء الخطاب بنجاح!**

يمكنك الآن مراجعة الخطاب أدناه وتحميله أو نسخه.

🔄 إذا كنت تريد تعديل شيء، يمكنك بدء محادثة جديدة.`);
      
    } catch (error) {
      console.error('Error generating letter:', error);
      addMessage('ai', `❌ عذراً، حدث خطأ في إنشاء الخطاب. يرجى المحاولة مرة أخرى أو استخدام النموذج التقليدي.`);
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
                DeepSeek • خبير قانوني قطري • مدرب على قوانين دولة قطر
              </p>
            </div>
          </div>
          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            OpenAI متصل
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          مولد الخطابات القانونية بالذكاء الاصطناعي
        </h2>
        <p className="text-gray-600">
          إنشاء خطابات قانونية مخصصة باستخدام الذكاء الاصطناعي والقوانين القطرية
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 hover:border-green-400 transition-colors cursor-pointer" 
                      onClick={startConversation}>
                  <CardContent className="p-4 text-center">
                    <MessageCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-bold text-green-800 mb-2">🤖 المحادثة التفاعلية</h3>
                    <p className="text-sm text-green-600">
                      النظام الذكي الجديد - يطرح أسئلة مخصصة لفهم احتياجاتك
                    </p>
                    <Button className="mt-3 w-full bg-green-600 hover:bg-green-700">
                      ابدأ المحادثة التفاعلية
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardContent className="p-4 text-center">
                    <FileText className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-bold text-blue-800 mb-2">📝 النموذج التقليدي</h3>
                    <p className="text-sm text-blue-600">
                      النظام السابق - املأ الحقول وأنشئ الخطاب مباشرة
                    </p>
                    <Button variant="outline" className="mt-3 w-full" disabled>
                      قريباً - متوفر أسفل الصفحة
                    </Button>
                  </CardContent>
                </Card>
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
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-500 text-white'
                              : message.isQuestion
                              ? 'bg-green-100 border border-green-300'
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
                        <div className="bg-white border p-3 rounded-lg max-w-[80%]">
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
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isProcessing}
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
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

                {/* Reset button */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setConversationMode(false)}
                    className="text-sm"
                  >
                    🔄 بدء محادثة جديدة
                  </Button>
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