
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Export the Profile interface
export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  phone_number?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: true,
  error: null,
  updateProfile: async () => {}
});

export const useProfile = () => useContext(ProfileContext);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProfile(null);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // Use type assertion to ensure data conforms to Profile interface
        setProfile(data as Profile);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
        toast.error('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!profile?.id) throw new Error('No user profile found');

      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, isLoading, error, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
