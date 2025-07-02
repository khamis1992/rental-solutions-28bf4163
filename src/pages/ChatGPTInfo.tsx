
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  Brain, 
  Eye, 
  Zap, 
  CheckCircle, 
  Target, 
  TrendingUp,
  FileText,
  ArrowRight,
  Star,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatGPTInfo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              نظام معالجة العقود بالذكاء الاصطناعي
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            مقارنة شاملة بين نظام Google Vision OCR التقليدي ونظام ChatGPT الذكي لمعالجة عقود إيجار السيارات
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Google Vision OCR */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-800">
                <Eye className="w-8 h-8" />
                Google Vision OCR
                <Badge variant="secondary">النظام التقليدي</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                نظام استخراج النصوص التقليدي مع معالجة بأنماط محددة مسبقاً
              </p>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">المزايا:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>دقة عالية في استخراج النصوص الواضحة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>سرعة في المعالجة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>لا يحتاج ChatGPT API</span>
                  </li>
                </ul>

                <h4 className="font-semibold text-orange-800">العيوب:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>يعتمد على أنماط ثابتة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>لا يفهم السياق</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>صعوبة مع النصوص غير المنتظمة</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/car-rental-contract-test')}
                  variant="outline" 
                  className="w-full"
                >
                  اختبار Google Vision
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ChatGPT AI */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <Brain className="w-8 h-8" />
                ChatGPT AI
                <Badge variant="default">النظام الذكي</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                نظام ذكي يفهم السياق ويحلل النصوص بذكاء اصطناعي متطور
              </p>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-800">المزايا:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>فهم السياق والمعنى</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>تصحيح الأخطاء تلقائياً</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>فهم المصطلحات القانونية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>استنتاج البيانات المفقودة</span>
                  </li>
                </ul>

                <h4 className="font-semibold text-blue-800">التحديات:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-600" />
                    <span>يحتاج OpenAI API Key</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>أبطأ قليلاً من OCR</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/chatgpt-contract-test')}
                  className="w-full"
                >
                  اختبار ChatGPT
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Comparison */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="text-2xl text-green-800 flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              مقارنة الأداء والدقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">الدقة</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Google Vision:</span>
                    <Badge variant="secondary">85%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ChatGPT:</span>
                    <Badge variant="default">95%</Badge>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">السرعة</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Google Vision:</span>
                    <Badge variant="default">3-5 ثواني</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ChatGPT:</span>
                    <Badge variant="secondary">5-8 ثواني</Badge>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">الذكاء</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Google Vision:</span>
                    <Badge variant="outline">محدود</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ChatGPT:</span>
                    <Badge variant="default">متقدم</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-800">🎯 متى تستخدم Google Vision؟</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• عندما تكون العقود منتظمة ومنسقة</li>
                <li>• عند الحاجة لسرعة عالية في المعالجة</li>
                <li>• عندما لا يتوفر OpenAI API Key</li>
                <li>• للعقود التي تتبع نموذج ثابت</li>
                <li>• عند معالجة كميات كبيرة من العقود</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">🚀 متى تستخدم ChatGPT؟</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• عندما تكون العقود غير منتظمة</li>
                <li>• عند وجود أخطاء إملائية في النص</li>
                <li>• للعقود المعقدة أو المختلفة</li>
                <li>• عند الحاجة لفهم السياق</li>
                <li>• لاستنتاج البيانات المفقودة</li>
                <li>• للحصول على أعلى دقة ممكنة</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Current System */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-800 flex items-center gap-3">
              <Brain className="w-8 h-8" />
              النظام الحالي المطبق
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-lg mb-4 text-purple-800">نظام هجين متطور 🔄</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-orange-600">1</span>
                  </div>
                  <p><strong>استخراج النص</strong></p>
                  <p className="text-gray-600">Google Vision OCR</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-blue-600">2</span>
                  </div>
                  <p><strong>التحليل الذكي</strong></p>
                  <p className="text-gray-600">ChatGPT AI</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-green-600">3</span>
                  </div>
                  <p><strong>النتيجة</strong></p>
                  <p className="text-gray-600">دقة 95%+</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => navigate('/car-rental-contract-test')}
                size="lg"
                className="flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                جرب النظام الهجين
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">⚙️ إعداد النظام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded border border-yellow-200">
                <h4 className="font-semibold mb-2">متطلبات التشغيل:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• <strong>Google Vision API Key:</strong> متوفر ومفعل ✅</li>
                  <li>• <strong>OpenAI API Key:</strong> اختياري للحصول على أفضل النتائج</li>
                  <li>• <strong>النظام الاحتياطي:</strong> يعمل بدون ChatGPT إذا لم يتوفر API Key</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>نصيحة:</strong> للحصول على أفضل النتائج، أضف OpenAI API Key في ملف البيئة (.env) 
                  تحت المتغير VITE_OPENAI_API_KEY
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatGPTInfo; 