
import React, { useState, useEffect } from 'react';
import { Download, CheckCircle } from 'lucide-react';

import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const InstallButton: React.FC<InstallButtonProps> = ({
  variant = "default",
  size = "default",
  className = "",
  showIcon = true,
  children
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

  // Browser environment check
  const isIOS = isBrowser && (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  const isStandalone = isBrowser && (window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true);

  useEffect(() => {
    // Set browser environment
    if (typeof window !== 'undefined') {
      setIsBrowser(true);
    }
  }, []);

  useEffect(() => {
    if (!isBrowser || isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // For iOS or browsers without native support
    if (isIOS || (!deferredPrompt && /Mobile/i.test(navigator.userAgent))) {
      setCanInstall(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isBrowser, isStandalone, deferredPrompt, isIOS]);

  const handleInstall = async () => {
    if (isInstalling) return;
    
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          toast.success('تم تثبيت التطبيق بنجاح!', {
            description: 'يمكنك الآن الوصول للتطبيق من الشاشة الرئيسية'
          });
          setCanInstall(false);
        } else {
          toast.info('تم إلغاء تثبيت التطبيق');
        }
        setDeferredPrompt(null);
      } else {
        // Show manual installation instructions with better UX
        showInstallInstructions();
      }
    } catch (error) {
      console.error('Install error:', error);
      toast.error('حدث خطأ أثناء التثبيت');
    } finally {
      setIsInstalling(false);
    }
  };

  const showInstallInstructions = () => {
    const instructions = isIOS 
      ? 'للتثبيت على iOS:\n\n1. اضغط على زر المشاركة (↑) في أسفل الشاشة\n2. مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة" لإكمال التثبيت'
      : 'للتثبيت على أندرويد:\n\n1. اضغط على قائمة المتصفح (⋮)\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة" لإكمال التثبيت';
    
    // Use a more user-friendly approach than alert
    toast.info('تعليمات التثبيت', {
      description: instructions.replace(/\n/g, ' '),
      duration: 8000,
      action: {
        label: "فهمت",
        onClick: () => {}
      }
    });
  };

  // Don't render during SSR
  if (!isBrowser) return null;

  // Don't show if already installed
  if (isStandalone) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`${className} opacity-50 cursor-default`}
        disabled
      >
        <CheckCircle className="w-4 h-4 ml-1 text-green-600" />
        مثبت بالفعل
      </Button>
    );
  }

  if (!canInstall) return null;

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      variant={variant}
      size={size}
      className={className}
    >
      {isInstalling ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          جارٍ التثبيت...
        </div>
      ) : (
        <>
          {showIcon && <Download className="w-4 h-4 ml-1" />}
          {children || 'تثبيت التطبيق'}
        </>
      )}
    </Button>
  );
};
