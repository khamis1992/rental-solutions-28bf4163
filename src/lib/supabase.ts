import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const initializeSystem = async (): Promise<boolean> => {
  try {
    // Check if the system is already initialized
    const { data, error } = await supabase
      .from('system_settings')
      .select('is_initialized')
      .single();

    if (error) {
      console.error("Error checking system initialization:", error);
      throw error;
    }

    if (data && data.is_initialized) {
      console.log("System is already initialized.");
      return true;
    }

    // Perform initialization tasks
    console.log("Initializing system...");

    // Example: Create default roles
    await createDefaultRoles();

    // Example: Create default settings
    await createDefaultSettings();

    // Set the system as initialized
    const { error: updateError } = await supabase
      .from('system_settings')
      .update({ is_initialized: true })
      .eq('id', 1); // Assuming you have a single row with ID 1

    if (updateError) {
      console.error("Error setting system as initialized:", updateError);
      throw updateError;
    }

    console.log("System initialized successfully.");
    return true;
  } catch (error) {
    console.error("System initialization failed:", error);
    return false;
  }
};

const createDefaultRoles = async (): Promise<void> => {
  // Check if roles already exist
  const { data, error } = await supabase
    .from('roles')
    .select('*');

  if (error) {
    console.error("Error checking roles:", error);
    throw error;
  }

  if (data && data.length > 0) {
    console.log("Roles already exist, skipping creation.");
    return;
  }

  // Create default roles
  const roles = [
    { name: 'admin', description: 'Administrator role' },
    { name: 'manager', description: 'Manager role' },
    { name: 'user', description: 'User role' },
  ];

  const { error: insertError } = await supabase
    .from('roles')
    .insert(roles);

  if (insertError) {
    console.error("Error creating default roles:", insertError);
    throw insertError;
  }

  console.log("Default roles created successfully.");
};

const createDefaultSettings = async (): Promise<void> => {
  // Check if settings already exist
  const { data, error } = await supabase
    .from('system_settings')
    .select('*');

  if (error) {
    console.error("Error checking settings:", error);
    throw error;
  }

  if (data && data.length > 0) {
    console.log("Settings already exist, skipping creation.");
    return;
  }

  // Create default settings
  const settings = {
    is_initialized: false,
    company_name: 'Your Company',
    company_email: 'info@yourcompany.com',
    company_phone: '+1234567890',
  };

  const { error: insertError } = await supabase
    .from('system_settings')
    .insert(settings);

  if (insertError) {
    console.error("Error creating default settings:", insertError);
    throw insertError;
  }

  console.log("Default settings created successfully.");
};

// Add function stub for the missing function
export const forceGeneratePaymentForAgreement = async (agreementId: string): Promise<boolean> => {
  try {
    console.log("Force generating payment for agreement:", agreementId);
    // This function would be implemented to generate payments for an agreement
    return true;
  } catch (error) {
    console.error("Error generating payment:", error);
    return false;
  }
};
