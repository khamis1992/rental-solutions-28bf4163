interface EmergencyResetOptions {
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  disableServiceWorkers?: boolean;
  clearCache?: boolean;
  forceReload?: boolean;
}

export class EmergencyReset {
  private static isResetting = false;

  static async performEmergencyReset(options: EmergencyResetOptions = {}) {
    if (this.isResetting) {
      console.warn('Emergency reset already in progress');
      return;
    }

    this.isResetting = true;
    console.log('🚨 Emergency Reset Started');

    try {
      // Clear localStorage
      if (options.clearLocalStorage !== false) {
        try {
          localStorage.clear();
          console.log('✅ localStorage cleared');
        } catch (e) {
          console.warn('❌ Failed to clear localStorage:', e);
        }
      }

      // Clear sessionStorage
      if (options.clearSessionStorage !== false) {
        try {
          sessionStorage.clear();
          console.log('✅ sessionStorage cleared');
        } catch (e) {
          console.warn('❌ Failed to clear sessionStorage:', e);
        }
      }

      // Disable Service Workers
      if (options.disableServiceWorkers !== false && 'serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));
          console.log('✅ Service Workers disabled');
        } catch (e) {
          console.warn('❌ Failed to disable Service Workers:', e);
        }
      }

      // Clear cache
      if (options.clearCache !== false && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('✅ Cache cleared');
        } catch (e) {
          console.warn('❌ Failed to clear cache:', e);
        }
      }

      console.log('🚨 Emergency Reset Completed');

      // Force reload
      if (options.forceReload !== false) {
        setTimeout(() => {
          window.location.href = window.location.origin + '/auth/login';
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Emergency Reset Failed:', error);
    } finally {
      this.isResetting = false;
    }
  }

  static createEmergencyButton() {
    const button = document.createElement('button');
    button.innerHTML = '🚨 Emergency Reset';
    button.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 999999;
      background: #dc3545;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    `;
    button.onclick = () => this.performEmergencyReset();
    document.body.appendChild(button);
  }

  static detectFreeze() {
    let lastTime = Date.now();
    let freezeCount = 0;

    const checkFreeze = () => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTime;
      
      if (timeDiff > 3000) { // More than 3 seconds
        freezeCount++;
        console.warn(`🚨 App freeze detected #${freezeCount}. Time diff: ${timeDiff}ms`);
        
        if (freezeCount >= 3) {
          console.error('🚨 Multiple freezes detected. Triggering emergency reset.');
          this.performEmergencyReset();
          return;
        }
      }
      
      lastTime = currentTime;
      setTimeout(checkFreeze, 1000);
    };

    checkFreeze();
  }
}

// Auto-initialize emergency reset tools
if (typeof window !== 'undefined') {
  // Add emergency reset to window for console access
  (window as any).emergencyReset = EmergencyReset.performEmergencyReset.bind(EmergencyReset);
  
  // Start freeze detection
  EmergencyReset.detectFreeze();
  
  // Create emergency button in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => EmergencyReset.createEmergencyButton(), 2000);
  }
} 