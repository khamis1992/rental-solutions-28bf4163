import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const InstallButton: React.FC<InstallButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = ''
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({
        title: 'تم تثبيت التطبيق بنجاح',
        description: 'يمكنك الآن الوصول للتطبيق من الشاشة الرئيسية',
        duration: 5000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installed successfully');
        setIsInstalled(true);
        toast({
          title: 'تم تثبيت التطبيق',
          description: 'التطبيق الآن متاح من الشاشة الرئيسية',
          duration: 3000,
        });
      } else {
        console.log('PWA installation dismissed');
        toast({
          title: 'تم إلغاء التثبيت',
          description: 'يمكنك تثبيت التطبيق لاحقاً',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Installation failed:', error);
      toast({
        title: 'فشل في التثبيت',
        description: 'حدث خطأ أثناء تثبيت التطبيق',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  // Don't show button if already installed or prompt not available
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
    >
      {isInstalling ? (
        <>
          <Smartphone className="w-4 h-4 animate-pulse" />
          <span className="hidden sm:inline">جاري التثبيت...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">تثبيت التطبيق</span>
        </>
      )}
    </Button>
  );
};

export default InstallButton;