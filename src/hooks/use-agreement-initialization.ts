
import { useState, useEffect, useRef } from 'react';
import { initializeSystem } from '@/lib/supabase';

export function useAgreementInitialization() {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttemptedRef = useRef(false);

  useEffect(() => {
    const performInitialization = async () => {
      // Only attempt initialization once
      if (initializationAttemptedRef.current) return;
      
      initializationAttemptedRef.current = true;
      
      try {
        await initializeSystem();
        console.log("System initialized");
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing system:", error);
        // Still mark as initialized to prevent endless retry attempts
        setIsInitialized(true);
      }
    };

    performInitialization();
  }, []);

  return { isInitialized };
}
