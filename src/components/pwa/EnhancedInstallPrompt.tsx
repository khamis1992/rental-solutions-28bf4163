import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Download, Smartphone, Star, Wifi, WifiOff, Bell, 
  Zap, Shield, Users, Timer, CheckCircle, ArrowRight,
  Sparkles, Crown, Heart, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UserEngagementData {
  totalVisits: number;
  totalTimeSpent: number;
  featuresUsed: string[];
  lastVisit: number;
  installPromptShown: number;
  installPromptDismissed: number;
}

interface AppFeature {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  highlight?: boolean;
}

export const EnhancedInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptPhase, setPromptPhase] = useState<'initial' | 'features' | 'benefits' | 'install'>('initial');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [userEngagement, setUserEngagement] = useState<UserEngagementData | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  // Platform detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

  // App features showcase
  const appFeatures: AppFeature[] = [
    {
      icon: WifiOff,
      title: 'العمل بدون إنترنت',
      description: 'تصفح وإدارة العقود حتى بدون اتصال',
      highlight: true
    },
    {
      icon: Bell,
      title: 'إشعارات فورية',
      description: 'تنبيهات لاستحقاق الدفعات والصيانة',
      highlight: true
    },
    {
      icon: Zap,
      title: 'سرعة فائقة',
      description: 'تحميل أسرع 3x من المتصفح العادي'
    },
    {
      icon: Shield,
      title: 'أمان متقدم',
      description: 'حماية بيانات العملاء والعقود'
    },
    {
      icon: Timer,
      title: 'توفير الوقت',
      description: 'وصول مباشر من الشاشة الرئيسية'
    },
    {
      icon: TrendingUp,
      title: 'تحليلات متقدمة',
      description: 'رؤى مالية وتقارير تفصيلية'
    }
  ];

  // Load user engagement data
  useEffect(() => {
    const loadEngagementData = () => {
      const stored = localStorage.getItem('user-engagement-data');
      if (stored) {
        setUserEngagement(JSON.parse(stored));
      } else {
        const initialData: UserEngagementData = {
          totalVisits: 1,
          totalTimeSpent: 0,
          featuresUsed: [],
          lastVisit: Date.now(),
          installPromptShown: 0,
          installPromptDismissed: 0
        };
        setUserEngagement(initialData);
        localStorage.setItem('user-engagement-data', JSON.stringify(initialData));
      }
    };

    loadEngagementData();
  }, []);

  // Smart timing logic for showing prompt
  useEffect(() => {
    if (!userEngagement || isInStandaloneMode) return;

    const shouldShowPrompt = () => {
      // Don't show if dismissed recently
      const lastDismissed = localStorage.getItem('install-prompt-last-dismissed');
      if (lastDismissed) {
        const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) return false;
      }

      // Smart criteria based on engagement
      const criteria = {
        minVisits: 2,
        minTimeSpent: 30000, // 30 seconds
        maxDismissals: 2,
        cooldownPeriod: 24 * 60 * 60 * 1000 // 24 hours
      };

      const meetsVisitCriteria = userEngagement.totalVisits >= criteria.minVisits;
      const meetsTimeCriteria = userEngagement.totalTimeSpent >= criteria.minTimeSpent;
      const withinDismissalLimit = userEngagement.installPromptDismissed < criteria.maxDismissals;
      const pastCooldown = Date.now() - userEngagement.lastVisit > criteria.cooldownPeriod;

      return meetsVisitCriteria && meetsTimeCriteria && withinDismissalLimit;
    };

    // Delay based on engagement level
    const getOptimalDelay = () => {
      if (userEngagement.totalVisits >= 5) return 3000; // Frequent user
      if (userEngagement.totalVisits >= 3) return 8000; // Regular user
      return 15000; // New user
    };

    if (shouldShowPrompt()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
        // Update engagement data
        const updated = {
          ...userEngagement,
          installPromptShown: userEngagement.installPromptShown + 1
        };
        setUserEngagement(updated);
        localStorage.setItem('user-engagement-data', JSON.stringify(updated));
      }, getOptimalDelay());

      return () => clearTimeout(timer);
    }
  }, [userEngagement, isInStandaloneMode]);

  // Feature carousel effect
  useEffect(() => {
    if (promptPhase === 'features' && showPrompt) {
      const interval = setInterval(() => {
        setCurrentFeatureIndex(prev => (prev + 1) % appFeatures.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [promptPhase, showPrompt]);

  // Handle install prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setInstallSuccess(true);
          setTimeout(() => {
            setShowPrompt(false);
            localStorage.removeItem('install-prompt-last-dismissed');
          }, 2000);
        }
        setDeferredPrompt(null);
      } else {
        showPlatformInstructions();
      }
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const showPlatformInstructions = () => {
    const instructions = isIOS 
      ? 'لتثبيت التطبيق على iPhone/iPad:\n\n1. اضغط على زر المشاركة (↑) في أسفل الشاشة\n2. مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة" في الزاوية العلوية\n\nستجد التطبيق على شاشتك الرئيسية!'
      : isAndroid
      ? 'لتثبيت التطبيق على Android:\n\n1. اضغط على قائمة المتصفح (⋮) في الزاوية العلوية\n2. اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"\n3. اضغط "إضافة" أو "تثبيت"\n\nسيظهر التطبيق على شاشتك الرئيسية!'
      : 'لتثبيت التطبيق:\n\nاستخدم قائمة المتصفح واختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"';
    
    alert(instructions);
    setShowPrompt(false);
  };

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-last-dismissed', Date.now().toString());
    
    if (userEngagement) {
      const updated = {
        ...userEngagement,
        installPromptDismissed: userEngagement.installPromptDismissed + 1
      };
      setUserEngagement(updated);
      localStorage.setItem('user-engagement-data', JSON.stringify(updated));
    }
  }, [userEngagement]);

  const nextPhase = () => {
    const phases: typeof promptPhase[] = ['initial', 'features', 'benefits', 'install'];
    const currentIndex = phases.indexOf(promptPhase);
    if (currentIndex < phases.length - 1) {
      setPromptPhase(phases[currentIndex + 1]);
    }
  };

  if (!showPrompt || !isMobile || isInStandaloneMode) return null;

  const renderPhaseContent = () => {
    switch (promptPhase) {
      case 'initial':
        return (
          <div className="text-center p-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-full inline-block mb-4"
            >
              <Smartphone className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              تطبيق العارف للتأجير
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              احصل على تجربة أفضل مع التطبيق المخصص لإدارة تأجير السيارات
            </p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Star className="w-3 h-3 mr-1" />
                4.9/5
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Users className="w-3 h-3 mr-1" />
                +1000 مستخدم
              </Badge>
            </div>

            <Button onClick={nextPhase} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              اكتشف المزايا
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        );

      case 'features':
        const currentFeature = appFeatures[currentFeatureIndex];
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">مزايا التطبيق</h3>
              <Progress value={(currentFeatureIndex + 1) / appFeatures.length * 100} className="w-full" />
            </div>

            <motion.div
              key={currentFeatureIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center"
            >
              <div className={`p-4 rounded-full inline-block mb-4 ${
                currentFeature.highlight ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-blue-100'
              }`}>
                <currentFeature.icon className={`w-8 h-8 ${
                  currentFeature.highlight ? 'text-white' : 'text-blue-600'
                }`} />
              </div>
              
              <h4 className="text-lg font-semibold mb-2">{currentFeature.title}</h4>
              <p className="text-gray-600 mb-6">{currentFeature.description}</p>
            </motion.div>

            <Button onClick={nextPhase} className="w-full">
              التالي
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        );

      case 'benefits':
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">لماذا التطبيق أفضل؟</h3>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { icon: Zap, text: 'سرعة تحميل 3x أفضل', color: 'text-yellow-600' },
                { icon: WifiOff, text: 'يعمل بدون إنترنت', color: 'text-green-600' },
                { icon: Bell, text: 'إشعارات ذكية للمهام', color: 'text-blue-600' },
                { icon: Shield, text: 'أمان وخصوصية متقدمة', color: 'text-purple-600' }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 flex-row-reverse"
                >
                  <CheckCircle className={`w-5 h-5 ${benefit.color}`} />
                  <span className="text-gray-700">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <Button onClick={nextPhase} className="w-full bg-gradient-to-r from-green-600 to-blue-600">
              ابدأ التثبيت
              <Download className="w-4 h-4 mr-2" />
            </Button>
          </div>
        );

      case 'install':
        if (installSuccess) {
          return (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center p-6"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-700 mb-2">تم التثبيت بنجاح!</h3>
              <p className="text-gray-600">ستجد التطبيق على شاشتك الرئيسية</p>
            </motion.div>
          );
        }

        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-green-500 to-blue-600 p-4 rounded-full inline-block mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">جاهز للتثبيت!</h3>
              <p className="text-gray-600">
                لن يستغرق التثبيت سوى ثوانٍ معدودة
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 flex-row-reverse text-sm text-gray-600">
                <Heart className="w-4 h-4 text-red-500" />
                <span>مجاني تماماً • لا يحتاج متجر تطبيقات</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white"
              >
                {isInstalling ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جارٍ التثبيت...
                  </div>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    تثبيت الآن
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="outline"
                disabled={isInstalling}
              >
                لاحقاً
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <Card className="w-full max-w-sm bg-white shadow-2xl overflow-hidden" dir="rtl">
          <div className="relative">
            {promptPhase !== 'initial' && (
              <button
                onClick={handleDismiss}
                className="absolute top-4 left-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            <CardContent className="p-0">
              {renderPhaseContent()}
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}; 