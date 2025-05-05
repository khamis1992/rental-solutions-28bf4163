
// Fix for ProfileContext type conversion issues
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define proper Profile type
interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  driver_license?: string;
  notes?: string;
  status?: string;
  role?: string;
  // Add other profile properties as needed
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  error: Error | null;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  updateProfile: async () => {},
  error: null
});

export const ProfileProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Use maybeSingle instead of single to avoid errors when no profile is found
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile(data as Profile);
        } else {
          console.log('No profile found for user:', user.id);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch profile'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!profile?.id) {
        throw new Error('No profile ID available');
      }

      const { error } = await supabase
        .from('profiles')
        .update(data as any)
        .eq('id', profile.id);

      if (error) throw error;
      
      // Update local state
      setProfile(prevProfile => prevProfile ? { ...prevProfile, ...data } : null);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, error }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
