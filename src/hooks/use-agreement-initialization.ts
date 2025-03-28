
import { useState, useEffect, useRef } from 'react';
import { initializeSystem } from '@/lib/supabase';

export function useAgreementInitialization() {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttemptedRef = useRef(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    // Cleanup function to prevent memory leaks
    let isMounted = true;
    
    const performInitialization = async () => {
      // Return immediately if initialization is already in progress or has been attempted
      if (initializationAttemptedRef.current || initializingRef.current) return;
      
      initializationAttemptedRef.current = true;
      initializingRef.current = true;
      
      try {
        await initializeSystem();
        console.log("System initialized");
        
        // Only update state if component is still mounted
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error initializing system:", error);
        // Still mark as initialized to prevent endless retry attempts
        if (isMounted) {
          setIsInitialized(true);
        }
      } finally {
        initializingRef.current = false;
      }
    };

    performInitialization();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return { isInitialized };
}
