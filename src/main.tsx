import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// import App from './SimpleApp.tsx';
import './index.css';


// Initialize monitoring services
import { initializeMonitoring } from './services/monitoring';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { initPhoneNumberObserver } from './utils/phone-display-utils';

// Import payment testing utilities in development
if (import.meta.env.DEV) {
  import('./utils/test-payment-creation.ts');
}

// Setup console error handling before app starts
if (import.meta.env.PROD) {
import '@/utils/emergency-reset';
import '@/utils/loop-detector';
  // Production: Minimize console output
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    // Only log critical errors in production
    const message = args.join(' ');
    if (message.includes('chunk load') || message.includes('network')) {
      originalError(...args);
    }
  };
  
  console.warn = () => {}; // Suppress all warnings in production
} else {
  // Development: Show all errors for debugging
  console.log('🔍 Development mode - All console errors visible for debugging');
}

// Initialize monitoring before app starts
initializeMonitoring();

// PWA Install Helper
const initPWAFeatures = () => {
  console.log('[PWA] Using Vite PWA plugin for service worker management');
  
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
        body: 'تطبيق العراف للتأجير متوفر الآن على شاشتك الرئيسية.',
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
  
  // Service worker is handled by Vite PWA plugin
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service Worker controller changed - reloading');
      window.location.reload();
    });
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
  // Initialize PWA features (service worker handled by Vite PWA plugin)
  initPWAFeatures();
  
  // Initialize phone number LTR styling observer
  setTimeout(() => {
    initPhoneNumberObserver();
  }, 1000); // Wait for app to mount
  
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