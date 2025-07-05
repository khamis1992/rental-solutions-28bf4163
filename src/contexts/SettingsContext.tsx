
import React, { createContext, useContext, useState, useEffect } from "react";
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

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw new Error(error.message);

      const settingsMap: Record<string, any> = {};
      data.forEach((setting: SystemSetting) => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });

      setSettings(settingsMap);
    } catch (err: any) {
      console.error("Failed to fetch settings:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    try {
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
      
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success(`Setting "${key}" updated successfully`);
    } catch (err: any) {
      console.error(`Failed to update setting "${key}":`, err);
      toast.error(`Failed to update setting: ${err.message}`);
      throw err;
    }
  };

  const getSetting = (key: string, defaultValue?: any) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSetting,
        getSetting,
        refreshSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
