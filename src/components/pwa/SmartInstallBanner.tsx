import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Star, Shield, Zap, Users, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SmartInstallBannerProps {
  position?: 'top' | 'bottom' | 'floating';
  theme?: 'default' | 'premium' | 'minimal';
  showOnPages?: string[];
  minEngagementScore?: number;
}

export const SmartInstallBanner: React.FC<SmartInstallBannerProps> = ({
  position = 'top',
  theme = 'default',
  showOnPages = [],
  minEngagementScore = 0
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [engagementScore, setEngagementScore] = useState(0);
  const [userInteractions, setUserInteractions] = useState(0);
  const [visitDuration, setVisitDuration] = useState(0);
  const [currentPage, setCurrentPage] = useState('');

  // Detect platform and capabilities
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone === true;

  // Calculate engagement score based on user behavior
  useEffect(() => {
    const startTime = Date.now();
    let interactionCount = 0;

    // Track page interactions
    const trackInteraction = () => {
      interactionCount++;
      setUserInteractions(prev => prev + 1);
    };

    // Track visit duration
    const updateDuration = () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setVisitDuration(duration);
    };

    // Event listeners for user engagement
    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true });
    });

    // Update duration every 10 seconds
    const durationInterval = setInterval(updateDuration, 10000);

    // Get current page
    setCurrentPage(window.location.pathname);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackInteraction);
      });
      clearInterval(durationInterval);
    };
  }, []);

  // Calculate engagement score
  useEffect(() => {
    const score = Math.min(100, 
      (userInteractions * 2) + 
      Math.floor(visitDuration / 10) + 
      (currentPage !== '/' ? 10 : 0) // Bonus for visiting other pages
    );
    setEngagementScore(score);
  }, [userInteractions, visitDuration, currentPage]);

  // Smart banner display logic
  useEffect(() => {
    if (isInStandaloneMode) return; // Already installed

    // Check dismissal history
    const bannerDismissed = localStorage.getItem('smart-banner-dismissed');
    const dismissedTime = bannerDismissed ? parseInt(bannerDismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Don't show if dismissed recently
    if (bannerDismissed && daysSinceDismissed < 3) return;

    // Check page restrictions
    if (showOnPages.length > 0 && !showOnPages.includes(currentPage)) return;

    // Check engagement threshold
    if (engagementScore < minEngagementScore) return;

    // Smart timing logic
    const showTimeout = (() => {
      if (engagementScore > 50) return 2000; // High engagement - show soon
      if (engagementScore > 20) return 5000; // Medium engagement
      return 10000; // Low engagement - wait longer
    })();

    const timer = setTimeout(() => {
      setShowBanner(true);
    }, showTimeout);

    return () => clearTimeout(timer);
  }, [engagementScore, currentPage, showOnPages, minEngagementScore]);

  // Handle install prompt
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
          setShowBanner(false);
          localStorage.removeItem('smart-banner-dismissed');
        }
        setDeferredPrompt(null);
      } else {
        // Platform-specific instructions
        showInstallInstructions();
      }
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const showInstallInstructions = () => {
    const instructions = isIOS 
      ? 'للتثبيت على iOS:\n1. اضغط على زر المشاركة (↑)\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"'
      : isAndroid
      ? 'للتثبيت على أندرويد:\n1. اضغط على قائمة المتصفح (⋮)\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"'
      : 'للتثبيت:\nاستخدم قائمة المتصفح واختر "إضافة إلى الشاشة الرئيسية"';
    
    alert(instructions);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('smart-banner-dismissed', Date.now().toString());
  };

  if (!showBanner || !isMobile) return null;

  // Theme configurations
  const themes = {
    default: {
      bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
      text: 'text-white',
      button: 'bg-white text-blue-600 hover:bg-gray-100',
      accent: 'text-blue-200'
    },
    premium: {
      bg: 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600',
      text: 'text-white',
      button: 'bg-white text-gray-900 hover:bg-gray-100',
      accent: 'text-purple-200'
    },
    minimal: {
      bg: 'bg-white border-t border-gray-200 shadow-lg',
      text: 'text-gray-900',
      button: 'bg-blue-600 text-white hover:bg-blue-700',
      accent: 'text-gray-600'
    }
  };

  const themeClasses = themes[theme];

  const bannerContent = (
    <div className={`${themeClasses.bg} ${themeClasses.text} p-4 relative overflow-hidden`} dir="rtl">
      {/* Background decoration for premium theme */}
      {theme === 'premium' && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent" />
          <Star className="absolute top-2 right-4 w-6 h-6 animate-pulse" />
          <Zap className="absolute bottom-2 left-8 w-4 h-4 animate-bounce" />
        </div>
      )}

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 flex-row-reverse">
          <div className="bg-white/20 p-2 rounded-full">
            <Smartphone className="w-6 h-6" />
          </div>
          
          <div className="flex-1 text-right">
            <div className="flex items-center gap-2 flex-row-reverse mb-1">
              <h3 className="font-bold text-lg">تطبيق العارف للتأجير</h3>
              <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                جديد
              </Badge>
            </div>
            
            <p className={`text-sm ${themeClasses.accent} leading-relaxed`}>
              وصول سريع • يعمل بدون إنترنت • إشعارات فورية
            </p>
            
            {/* Features for premium theme */}
            {theme === 'premium' && (
              <div className="flex items-center gap-4 mt-2 flex-row-reverse">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span className="text-xs">آمن</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span className="text-xs">سريع</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span className="text-xs">+1000 مستخدم</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mr-4">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            size="sm"
            className={`${themeClasses.button} font-semibold shadow-md`}
          >
            {isInstalling ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                جارٍ التثبيت...
              </div>
            ) : (
              <>
                <Download className="w-4 h-4 ml-1" />
                تثبيت
              </>
            )}
          </Button>
          
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Engagement indicator */}
      {engagementScore > 30 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className="h-full bg-white/50 transition-all duration-500"
            style={{ width: `${Math.min(100, engagementScore)}%` }}
          />
        </div>
      )}
    </div>
  );

  // Position wrapper
  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    floating: 'fixed bottom-4 left-4 right-4 z-50 rounded-lg overflow-hidden shadow-xl'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ 
          y: position === 'top' ? -100 : position === 'bottom' ? 100 : 50,
          opacity: 0 
        }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ 
          y: position === 'top' ? -100 : position === 'bottom' ? 100 : 50,
          opacity: 0 
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={positionClasses[position]}
      >
        {bannerContent}
      </motion.div>
    </AnimatePresence>
  );
}; 