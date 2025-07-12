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

// Create context with default values and proper null handling
const ProfileContext = createContext<ProfileContextType | null>(null);

// Safe hook with proper error handling
export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  
  if (context === null) {
    // Return safe default values instead of throwing error on first render
    console.warn('useProfile called outside ProfileProvider, using fallback values');
    return {
      profile: null,
      isLoading: true,
      error: null,
      updateProfile: async () => {
        console.warn('updateProfile called outside ProfileProvider');
      }
    };
  }
  
  return context;
};

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
      setError(null);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProfile(null);
          setIsLoading(false);
          return;
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // Handle case where profile doesn't exist yet
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, creating default profile');
            setProfile(null);
          } else {
            throw profileError;
          }
        } else {
          setProfile(data as Profile);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        const errorMessage = err instanceof Error ? err : new Error('Failed to fetch profile');
        setError(errorMessage);
        
        // Don't show toast on initial load to avoid spam
        if (profile !== null) {
          toast.error('Failed to load user profile');
        }
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
        setError(null);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!profile?.id) {
        throw new Error('No user profile found');
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(errorMessage);
      throw err;
    }
  };

  const contextValue: ProfileContextType = {
    profile,
    isLoading,
    error,
    updateProfile,
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};
