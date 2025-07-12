import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

interface SettingsContextType {
  settings: Record<string, any>;
  loading: boolean;
  error: Error | null;
  updateSetting: (key: string, value: any) => Promise<void>;
  getSetting: (key: string, defaultValue?: any) => any;
  refreshSettings: () => Promise<void>;
}

// Simple loop detector for critical functions
class SimpleLoopDetector {
  private calls: number[] = [];
  private maxCalls: number;
  private timeWindow: number;

  constructor(maxCalls = 20, timeWindow = 5000) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindow;
  }

  checkCall(): boolean {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < this.timeWindow);
    this.calls.push(now);

    if (this.calls.length > this.maxCalls) {
      console.error(`🚨 Too many calls detected: ${this.calls.length} in ${this.timeWindow}ms`);
      return false;
    }
    return true;
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SafeSafeSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchDetector = useRef(new SimpleLoopDetector(10, 5000));
  const updateDetector = useRef(new SimpleLoopDetector(15, 5000));
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchTime = useRef<number>(0);

  const fetchSettings = useCallback(async () => {
    // Loop detection
    if (!fetchDetector.current.checkCall()) {
      console.warn('🚫 fetchSettings blocked due to loop detection');
      return;
    }

    // Debouncing
    const now = Date.now();
    if (now - lastFetchTime.current < 1000) {
      console.warn('⚠️ fetchSettings debounced');
      return;
    }
    lastFetchTime.current = now;

    try {
      setLoading(true);
      setError(null);

      // Timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) throw new Error(error.message);

      const settingsMap: Record<string, any> = {};
      if (data && Array.isArray(data)) {
        data.forEach((setting: SystemSetting) => {
          if (setting?.setting_key) {
            settingsMap[setting.setting_key] = setting.setting_value;
          }
        });
      }

      setSettings(prevSettings => {
        // Only update if actually changed to prevent unnecessary re-renders
        const hasChanged = JSON.stringify(prevSettings) !== JSON.stringify(settingsMap);
        return hasChanged ? settingsMap : prevSettings;
      });
      
      console.log('✅ Settings fetched successfully');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('⚠️ Settings fetch aborted due to timeout');
        setError(new Error('Settings fetch timeout'));
      } else {
        console.error("❌ Failed to fetch settings:", err);
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Delay initial fetch to prevent race conditions
    const timer = setTimeout(() => {
      if (isMounted) {
        fetchSettings();
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchSettings]);

  const updateSetting = useCallback(async (key: string, value: any) => {
    // Loop detection
    if (!updateDetector.current.checkCall()) {
      console.warn('🚫 updateSetting blocked due to loop detection');
      throw new Error('Update blocked due to excessive calls');
    }

    try {
      setError(null);

      const { error: upsertError } = await supabase
        .from('system_settings')
        .upsert({ 
          setting_key: key, 
          setting_value: value,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'setting_key' 
        });

      if (upsertError) throw new Error(upsertError.message);
      
      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Limited toast notifications
      if (!['theme', 'language', 'rtl'].includes(key)) {
        toast.success(`إعداد "${key}" تم تحديثه`);
      }
      
      console.log(`✅ Setting ${key} updated:`, value);
    } catch (err: any) {
      console.error(`❌ Failed to update setting "${key}":`, err);
      toast.error(`فشل في تحديث الإعداد: ${err.message}`);
      throw err;
    }
  }, []);

  const getSetting = useCallback((key: string, defaultValue?: any) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }, [settings]);

  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  const contextValue: SettingsContextType = {
    settings: settings || {},
    loading,
    error,
    updateSetting,
    getSetting,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSafeSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    // Safe fallback instead of throwing
    console.warn('⚠️ useSafeSettings used outside provider, providing fallback');
    return {
      settings: {},
      loading: false,
      error: null,
      updateSetting: async () => {
        console.warn('⚠️ updateSetting called outside provider');
      },
      getSetting: (key: string, defaultValue?: any) => defaultValue,
      refreshSettings: async () => {
        console.warn('⚠️ refreshSettings called outside provider');
      }
    } as SettingsContextType;
  }
  return context;
}; 