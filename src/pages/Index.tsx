import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Users, FileText, Shield, Smartphone, Download } from 'lucide-react';
import { InstallButton } from '@/components/pwa/InstallButton';
import { PWAStatus } from '@/components/pwa/PWAStatus';

const Index = () => {
  const { user } = useSafeAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (user) {
    return null; // Will redirect to dashboard
  }

  const features = [
    {
      icon: Car,
      title: 'إدارة المركبات',
      description: 'تتبع وإدارة أسطول المركبات بكفاءة عالية'
    },
    {
      icon: Users,
      title: 'إدارة العملاء',
      description: 'قاعدة بيانات شاملة لجميع العملاء والمستأجرين'
    },
    {
      icon: FileText,
      title: 'الاتفاقيات القانونية',
      description: 'إنشاء وإدارة عقود التأجير والوثائق القانونية'
    },
    {
      icon: Shield,
      title: 'الأمان والحماية',
      description: 'نظام آمن مع حماية كاملة للبيانات'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                نظام العراف لإدارة التأجير
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* PWA Install Button */}
              <InstallButton 
                variant="outline"
                className="hidden sm:flex"
              />
              
              <Button 
                onClick={() => navigate('/auth/login')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                تسجيل الدخول
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            نظام إدارة تأجير السيارات الأكثر تطوراً
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            حلول شاملة لإدارة أسطول المركبات، العملاء، الاتفاقيات القانونية، والمدفوعات 
            مع دعم العمل بدون إنترنت
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => navigate('/auth/register')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
            >
              ابدأ الآن مجاناً
            </Button>
            
            {/* Mobile Install Button */}
            <InstallButton 
              variant="outline"
              size="lg"
              className="sm:hidden px-8 py-3 text-lg"
            >
              <Smartphone className="w-5 h-5 ml-2" />
              تثبيت التطبيق
            </InstallButton>
          </div>
        </div>

        {/* PWA Status Card */}
        <div className="mb-16 flex justify-center">
          <PWAStatus />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* PWA Features Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <Download className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">
              تطبيق يعمل على جميع الأجهزة
            </h3>
            <p className="text-lg mb-6 text-blue-100">
              ثبت التطبيق على هاتفك أو حاسوبك واستخدمه حتى بدون إنترنت
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                <span>يعمل بدون إنترنت</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                <span>تثبيت سريع</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>جميع الأجهزة</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 نظام العراف لإدارة التأجير. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
