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

// PWA Service Worker Registration
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service worker registered successfully:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
              // You can show an update notification here
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('تحديث متوفر', {
                  body: 'إصدار جديد من التطبيق متوفر. يرجى التحديث.',
                  icon: '/icons/icon-192x192.png'
                });
              }
            }
          });
        }
      });
      
      // Check for existing service worker updates
      if (registration.waiting) {
        console.log('Service worker update available');
      }
      
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  } else {
    console.log('Service workers are not supported.');
  }
};

// PWA Install Helper
const initPWAFeatures = () => {
  // Store install prompt event
  let deferredPrompt: any = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Update UI to show install button or prompt
    (window as any).canInstallPWA = true;
    (window as any).deferredPrompt = deferredPrompt;
    
    // Dispatch custom event for InstallPrompt component
    window.dispatchEvent(new CustomEvent('pwa-install-available', { detail: deferredPrompt }));
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    (window as any).canInstallPWA = false;
    (window as any).deferredPrompt = null;
    
    // Show success message
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('تم التثبيت بنجاح!', {
        body: 'تطبيق العارف للتأجير متوفر الآن على شاشتك الرئيسية.',
        icon: '/icons/icon-192x192.png'
      });
    }
  });
  
  // Handle iOS install prompt manually
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    console.log('iOS device detected - manual install instructions will be shown');
    (window as any).isIOSDevice = true;
  }
  
  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone || (window.navigator as any).standalone) {
    console.log('App is running in standalone mode');
    (window as any).isPWAInstalled = true;
  }
};

// Global PWA install function
(window as any).installPWA = async () => {
  const deferredPrompt = (window as any).deferredPrompt;
  
  if (!deferredPrompt) {
    console.log('No install prompt available');
    // For browsers that don't support install prompt or iOS
    if ((window as any).isIOSDevice) {
      alert('لإضافة التطبيق إلى الشاشة الرئيسية:\n1. اضغط على زر المشاركة في أسفل الشاشة\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"');
    } else {
      alert('لإضافة التطبيق إلى الشاشة الرئيسية، استخدم قائمة المتصفح واختر "إضافة إلى الشاشة الرئيسية"');
    }
    return false;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
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

// Initialize app
const initApp = async () => {
  // Register service worker
  await registerServiceWorker();
  
  // Initialize PWA features
  initPWAFeatures();
  
  // Mount React app
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<ErrorBoundary>
      <App />
    </ErrorBoundary>);
  }
};

// Start the app
initApp();
