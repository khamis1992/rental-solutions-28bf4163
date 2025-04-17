
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define proper Profile type
export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  role?: string;
  status?: string;
  // Add any other profile fields
}

interface ProfileContextProps {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (updatedProfile: Partial<Profile>) => Promise<any>;
}

const ProfileContext = createContext<ProfileContextProps | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export const ProfileProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fix the type error at line 48
  const fetchProfile = async () => {
    try {
      const user = supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }
      
      // Type safe query using proper id type
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (await user).data.user?.id || '')
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        // Fix type error at line 57 - safely cast data to Profile
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProfile();
  }, []);
  
  // Fix type error at line 77-78
  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    try {
      if (!profile?.id) return null;
      
      // Convert Profile to the right table update type
      const { data, error } = await supabase
        .from('profiles')
        .update({
          // Specify fields directly instead of passing the whole object
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
          phone_number: updatedProfile.phone_number,
          address: updatedProfile.address,
          // Add any other fields that need updating
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  };
  
  const value: ProfileContextProps = {
    profile,
    loading,
    fetchProfile,
    updateProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileProvider;
