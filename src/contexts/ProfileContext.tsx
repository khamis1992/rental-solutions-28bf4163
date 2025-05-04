
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; // Make sure we're using the correct client
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export interface Profile {
  id: string;
  full_name: string;
  role: "admin" | "manager" | "user" | "staff" | "customer" | string;
  email: string;
  status: "active" | "inactive" | "suspended" | "pending_review" | "blacklisted" | "pending_payment";
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get auth context safely with error handling
  const auth = (() => {
    try {
      return useAuth();
    } catch (error) {
      console.warn("Auth context not available yet. Profile features will be limited.");
      return { user: null, loading: true };
    }
  })();
  
  const { user } = auth;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log("Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      console.log("Fetched profile:", data);
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
      toast.error(`Failed to load profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    
    try {
      // Ensure status is one of the allowed values if it's being updated
      if (updates.status && !["active", "inactive", "suspended", "pending_review", "blacklisted", "pending_payment"].includes(updates.status)) {
        throw new Error(`Invalid status value: ${updates.status}`);
      }
      
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error.message}`);
      throw error;
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        updateProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
