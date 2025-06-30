import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to ensure id_card_image column exists in profiles table
 * This runs a migration programmatically if the column is missing
 */
export const ensureIdCardImageColumn = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking if id_card_image column exists...');
    
    // Try to add the column - PostgreSQL will ignore if it already exists
    const migrationSQL = `
      DO $$ 
      BEGIN
          -- Check if column exists
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'id_card_image'
          ) THEN
              -- Add the column
              ALTER TABLE public.profiles ADD COLUMN id_card_image TEXT;
              
              -- Add comment
              COMMENT ON COLUMN public.profiles.id_card_image IS 'Base64 encoded image of customer ID card from scanning';
              
              RAISE NOTICE 'Successfully added id_card_image column to profiles table';
          ELSE
              RAISE NOTICE 'Column id_card_image already exists in profiles table';
          END IF;
      EXCEPTION
          WHEN OTHERS THEN
              RAISE NOTICE 'Error adding id_card_image column: %', SQLERRM;
      END $$;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.warn('⚠️ Could not run migration via RPC, column might not exist:', error);
      return false;
    }
    
    console.log('✅ id_card_image column check completed');
    return true;
  } catch (error) {
    console.warn('⚠️ Migration helper failed:', error);
    return false;
  }
};

/**
 * Simple check if column exists by trying a basic query
 */
export const checkIdCardImageColumnExists = async (): Promise<boolean> => {
  try {
    // Try a simple query that would fail if column doesn't exist
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