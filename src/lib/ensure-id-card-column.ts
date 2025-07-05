import { supabase } from '@/integrations/supabase/client';

/**
 * دالة لضمان وجود عمود id_card_image في جدول profiles
 * تحاول إضافة العمود إذا لم يكن موجوداً
 */
export const ensureIdCardImageColumn = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking if id_card_image column exists...');
    
    // جرب استعلام بسيط للتحقق من وجود العمود
    const { error: testError } = await supabase
      .from('profiles')
      .select('id_card_image')
      .limit(1);
    
    if (testError) {
      console.warn('⚠️ id_card_image column does not exist:', testError.message);
      
      // محاولة إضافة العمود (قد تفشل حسب صلاحيات قاعدة البيانات)
      console.log('🔧 Attempting to add id_card_image column...');
      
      try {
        const { error: alterError } = await supabase.rpc('sql', {
          query: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_card_image TEXT;`
        });
        
        if (alterError) {
          console.warn('❌ Could not add column via RPC:', alterError.message);
          return false;
        } else {
          console.log('✅ Successfully added id_card_image column');
          return true;
        }
      } catch (rpcError) {
        console.warn('❌ RPC failed, column does not exist and cannot be added:', rpcError);
        return false;
      }
    } else {
      console.log('✅ id_card_image column exists and is accessible');
      return true;
    }
  } catch (error) {
    console.warn('❌ Error checking column existence:', error);
    return false;
  }
};

/**
 * فحص بسيط إذا كان العمود موجود
 */
export const checkIdCardImageColumnExists = async (): Promise<boolean> => {
  try {
    // محاولة استعلام بسيط للتحقق من وجود العمود
    await supabase
      .from('profiles')
      .select('id_card_image')
      .limit(1);
    
    console.log('✅ id_card_image column exists');
    return true;
  } catch (error: any) {
    if (error?.message?.includes('id_card_image')) {
      console.warn('⚠️ id_card_image column does not exist');
      return false;
    }
    console.warn('⚠️ Error checking column existence:', error);
    return false;
  }
}; 