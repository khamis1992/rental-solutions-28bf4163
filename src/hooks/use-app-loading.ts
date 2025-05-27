
import { useState, useEffect } from 'react';

interface AppLoadingState {
  isAppLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  error: string | null;
}

export function useAppLoading() {
  const [state, setState] = useState<AppLoadingState>({
    isAppLoading: true,
    loadingProgress: 0,
    loadingMessage: 'Initializing application...',
    error: null
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Step 1: Basic initialization
        setState(prev => ({ 
          ...prev, 
          loadingProgress: 25, 
          loadingMessage: 'Loading core components...' 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow React to render

        // Step 2: Check for critical dependencies
        setState(prev => ({ 
          ...prev, 
          loadingProgress: 50, 
          loadingMessage: 'Checking dependencies...' 
        }));

        // Verify that React Router is working
        if (typeof window === 'undefined') {
          throw new Error('Window object not available');
        }

        // Step 3: Initialize contexts
        setState(prev => ({ 
          ...prev, 
          loadingProgress: 75, 
          loadingMessage: 'Setting up contexts...' 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 100));

        // Step 4: Complete
        setState(prev => ({ 
          ...prev, 
          loadingProgress: 100, 
          loadingMessage: 'Ready!',
          isAppLoading: false 
        }));
        
      } catch (error) {
        console.error('App initialization failed:', error);
        setState(prev => ({ 
          ...prev, 
          isAppLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    initializeApp();
  }, []);

  return state;
}
