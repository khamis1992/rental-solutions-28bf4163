
import { createRoot } from 'react-dom/client';
import ReactDOMLegacy from 'react-dom';
import App from './App.tsx';
import './index.css';

// Initialize monitoring services
import { initializeMonitoring } from './services/monitoring';
import { ErrorBoundary } from './components/error/ErrorBoundary';

// Import payment testing utilities in development
if (import.meta.env.DEV) {
  import('./utils/test-payment-creation.ts');
}

// Initialize monitoring before app starts
initializeMonitoring();

// Enhanced PWA Service Worker Registration
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Wait for page load to complete
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(true);
        } else {
          window.addEventListener('load', resolve);
        }
      });

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('Service worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
              // Dispatch custom event for UpdatePrompt component
              window.dispatchEvent(new CustomEvent('sw-update-available', { 
                detail: { registration } 
              }));
            }
          });
        }
      });
      
      // Check for existing service worker updates
      if (registration.waiting) {
        console.log('Service worker update available');
        window.dispatchEvent(new CustomEvent('sw-update-available', { 
          detail: { registration } 
        }));
      }
      
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  } else {
    console.log('Service workers are not supported.');
  }
};

// Enhanced PWA Install Features
const initPWAFeatures = () => {
  let deferredPrompt: any = null;
  
  // Handle beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e;
    
    // Store globally for components to access
    (window as any).canInstallPWA = true;
    (window as any).deferredPrompt = deferredPrompt;
    
    // Dispatch custom event for PWA components
    window.dispatchEvent(new CustomEvent('pwa-install-available', { 
      detail: deferredPrompt 
    }));
  });

  // Handle app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed successfully');
    deferredPrompt = null;
    (window as any).canInstallPWA = false;
    (window as any).deferredPrompt = null;
    
    // Show success notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('تم التثبيت بنجاح!', {
        body: 'تطبيق العراف للتأجير متوفر الآن على شاشتك الرئيسية.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png'
      });
    }
    
    // Dispatch success event
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
  
  // Enhanced iOS detection and handling
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (isIOS) {
    console.log('iOS device detected - manual install instructions available');
    (window as any).isIOSDevice = true;
  }
  
  // Check if already installed (standalone mode)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true ||
                      document.referrer.includes('android-app://');
  
  if (isStandalone) {
    console.log('App is running in standalone mode');
    (window as any).isPWAInstalled = true;
    document.body.classList.add('pwa-installed');
  }
};

// Global PWA install function with enhanced error handling
(window as any).installPWA = async () => {
  const deferredPrompt = (window as any).deferredPrompt;
  
  if (!deferredPrompt) {
    console.log('No install prompt available');
    
    if ((window as any).isIOSDevice) {
      // Enhanced iOS instructions
      const instructions = `لإضافة التطبيق إلى الشاشة الرئيسية:

1. اضغط على زر المشاركة (⬆️) في أسفل الشاشة
2. مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"
3. اضغط "إضافة" لإكمال التثبيت

بعد التثبيت، ستجد التطبيق في الشاشة الرئيسية ويمكن استخدامه بدون إنترنت.`;
      
      alert(instructions);
    } else {
      alert('للتثبيت: استخدم قائمة المتصفح واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
    }
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      (window as any).deferredPrompt = null;
      return true;
    } else {
      console.log('User dismissed the install prompt');
      return false;
    }
  } catch (error) {
    console.error('Error showing install prompt:', error);
    return false;
  }
};

// Initialize app with proper sequencing
const initApp = async () => {
  try {
    // Initialize PWA features first
    initPWAFeatures();
    
    // Register service worker
    await registerServiceWorker();
    
    // Mount React app
    const container = document.getElementById("root");
    if (container) {
      const root = createRoot(container);
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      );
    }
  } catch (error) {
    console.error('App initialization failed:', error);
    
    // Fallback: still try to mount the app
    const container = document.getElementById("root");
    if (container) {
      const root = createRoot(container);
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      );
    }
  }
};

// Start the app
initApp();
