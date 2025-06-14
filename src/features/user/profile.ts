import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('خطأ في جلب الملف الشخصي:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: UpdateProfileRequest
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      toast.error('فشل تحديث الملف الشخصي');
      return false;
    }

    toast.success('تم تحديث الملف الشخصي بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    toast.error('فشل تحديث الملف الشخصي');
    return false;
  }
};

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('خطأ في رفع الصورة الشخصية:', uploadError);
      toast.error('فشل رفع الصورة الشخصية');
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('خطأ في رفع الصورة الشخصية:', error);
    toast.error('فشل رفع الصورة الشخصية');
    return null;
  }
};
