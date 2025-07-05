import { supabase } from '@/lib/supabase';
import { agreementPaymentService } from '@/services/AgreementPaymentService';

/**
 * Test function to create payments for agreement LT0RO08
 * This can be called from the browser console for debugging
 */
export async function testPaymentCreationForLT0RO08() {
  console.log('🔍 Testing payment creation for agreement LT0RO08...');
  
  try {
    // First, find the agreement with number LT0RO08
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('*')
      .eq('agreement_number', 'LT0RO08')
      .single();

    if (agreementError || !agreement) {
      console.error('❌ Agreement LT0RO08 not found:', agreementError);
      return { success: false, error: 'Agreement not found' };
    }

    console.log('✅ Found agreement LT0RO08:', agreement);

    // Check existing payments in unified_payments table
    const { data: existingPayments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreement.id);

    if (paymentsError) {
      console.error('❌ Error checking existing payments:', paymentsError);
      return { success: false, error: 'Error checking payments' };
    }

    console.log(`📊 Existing payments for LT0RO08: ${existingPayments?.length || 0}`);
    
    if (existingPayments && existingPayments.length > 0) {
      console.log('📋 Existing payments:', existingPayments);
      return { 
        success: true, 
        message: 'Payments already exist',
        existingPayments: existingPayments.length,
        payments: existingPayments
      };
    }

    // Create payment schedule
    console.log('🚀 Creating payment schedule for LT0RO08...');
    
    const result = await agreementPaymentService.createPaymentScheduleByAgreementId(agreement.id);

    if (result.success) {
      console.log('✅ Payment schedule created successfully!');
      console.log(`📈 Created ${result.scheduleCount} schedule items and ${result.paymentCount} payment records`);
      
      // Verify by fetching payments again
      const { data: newPayments, error: newPaymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreement.id);

      if (!newPaymentsError && newPayments) {
        console.log(`✅ Verification: Found ${newPayments.length} payments after creation`);
        console.log('📋 New payments:', newPayments);
      }

      return {
        success: true,
        message: result.message,
        scheduleCount: result.scheduleCount,
        paymentCount: result.paymentCount,
        payments: newPayments
      };
    } else {
      console.error('❌ Failed to create payment schedule:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Force create payment schedule for LT0RO08 (removes existing and creates new)
 */
export async function forceCreatePaymentScheduleForLT0RO08() {
  console.log('🔄 Force creating payment schedule for agreement LT0RO08...');
  
  try {
    // Find the agreement
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('*')
      .eq('agreement_number', 'LT0RO08')
      .single();

    if (agreementError || !agreement) {
      console.error('❌ Agreement LT0RO08 not found:', agreementError);
      return { success: false, error: 'Agreement not found' };
    }

    console.log('✅ Found agreement LT0RO08:', agreement);

    // Force create payment schedule
    const result = await agreementPaymentService.forceCreatePaymentSchedule(agreement.id);

    if (result.success) {
      console.log('✅ Payment schedule force-created successfully!');
      console.log(`📈 Created ${result.scheduleCount} schedule items and ${result.paymentCount} payment records`);
      
      return {
        success: true,
        message: result.message,
        scheduleCount: result.scheduleCount,
        paymentCount: result.paymentCount
      };
    } else {
      console.error('❌ Failed to force create payment schedule:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fix all agreements that are missing payment schedules
 * This is useful for fixing old agreements created before the automatic system
 */
export async function fixAllMissingPaymentSchedules() {
  console.log('🚀 Starting comprehensive fix for all agreements missing payment schedules...');
  
  try {
    const result = await agreementPaymentService.fixAllMissingPaymentSchedules();
    
    if (result.success) {
      console.log('✅ Fixing process completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - Total agreements checked: ${result.totalAgreements}`);
      console.log(`   - Agreements fixed: ${result.fixedAgreements}`);
      console.log(`   - Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.warn('⚠️ Errors encountered:');
        result.errors.forEach((error, index) => {
          console.warn(`   ${index + 1}. ${error}`);
        });
      }
      
      return {
        success: true,
        message: result.message,
        totalAgreements: result.totalAgreements,
        fixedAgreements: result.fixedAgreements,
        errors: result.errors
      };
    } else {
      console.error('❌ Fixing process failed:', result.message);
      return {
        success: false,
        error: result.message,
        errors: result.errors
      };
    }
  } catch (error) {
    console.error('❌ Unexpected error in comprehensive fix:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Simple function to check payments table for any agreement
 */
export async function checkPaymentsForAgreement(agreementNumber: string) {
  console.log(`🔍 Checking payments for agreement ${agreementNumber}...`);
  
  try {
    // Find the agreement
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('id, agreement_number, rent_amount, start_date, end_date, status')
      .eq('agreement_number', agreementNumber)
      .single();

    if (agreementError || !agreement) {
      console.error(`❌ Agreement ${agreementNumber} not found:`, agreementError);
      return { success: false, error: 'Agreement not found' };
    }

    console.log(`✅ Found agreement ${agreementNumber}:`, agreement);

    // Check payments in unified_payments table
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreement.id)
      .order('created_at', { ascending: true });

    if (paymentsError) {
      console.error('❌ Error checking payments:', paymentsError);
      return { success: false, error: 'Error checking payments' };
    }

    console.log(`📊 Found ${payments?.length || 0} payments for ${agreementNumber}`);
    if (payments && payments.length > 0) {
      console.table(payments.map(p => ({
        id: p.id.substring(0, 8) + '...',
        amount: p.amount,
        status: p.status,
        type: p.type,
        description: p.description,
        due_date: p.original_due_date?.substring(0, 10) || 'N/A'
      })));
    }

    return {
      success: true,
      agreement,
      payments: payments || [],
      count: payments?.length || 0
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check the structure of unified_payments table to see available columns
 */
async function checkUnifiedPaymentsTableStructure() {
  try {
    console.log('🔍 Checking unified_payments table structure...');
    
    // Try to insert a minimal record to see what columns are required/available
    const testData = {
      lease_id: 'test',
      amount: 100,
      status: 'pending' as const
    };
    
    console.log('Available columns based on TypeScript types:');
    console.log('- id, lease_id, amount, amount_paid, balance');
    console.log('- payment_date, payment_method, reference_number');
    console.log('- description, status, type, days_overdue');
    console.log('- late_fine_amount, original_due_date, payment_reference');
    console.log('- created_at, updated_at');
    
    // Check if we can query the table structure
    const { data, error } = await supabase
      .from('unified_payments')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      console.log('📊 Sample record structure:');
      console.table(Object.keys(data[0]));
    } else if (error) {
      console.error('❌ Error checking table:', error);
    } else {
      console.log('📋 Table is empty, checking schema...');
    }
    
  } catch (error) {
    console.error('❌ Error in checkUnifiedPaymentsTableStructure:', error);
  }
}

/**
 * Test creating a simple payment record to verify table schema
 */
async function testSimplePaymentCreation() {
  try {
    console.log('🧪 Testing simple payment creation...');
    
    // Create a minimal test payment
    const testPayment = {
      lease_id: 'test-lease-id',
      amount: 100,
      status: 'pending' as const,
      description: 'Test payment for schema verification',
      type: 'test'
    };
    
    console.log('Test payment data:', testPayment);
    
    const { data, error } = await supabase
      .from('unified_payments')
      .insert([testPayment])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Test payment creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }
    
    console.log('✅ Test payment created successfully:', data.id);
    
    // Clean up - delete the test payment
    const { error: deleteError } = await supabase
      .from('unified_payments')
      .delete()
      .eq('id', data.id);
    
    if (deleteError) {
      console.warn('⚠️ Failed to clean up test payment:', deleteError.message);
    } else {
      console.log('🧹 Test payment cleaned up successfully');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error in testSimplePaymentCreation:', error);
    return false;
  }
}

/**
 * Make these functions available globally for console testing
 */
if (typeof window !== 'undefined') {
  (window as any).testPaymentCreationForLT0RO08 = testPaymentCreationForLT0RO08;
  (window as any).forceCreatePaymentScheduleForLT0RO08 = forceCreatePaymentScheduleForLT0RO08;
  (window as any).fixAllMissingPaymentSchedules = fixAllMissingPaymentSchedules;
  (window as any).checkPaymentsForAgreement = checkPaymentsForAgreement;
  (window as any).checkUnifiedPaymentsTableStructure = checkUnifiedPaymentsTableStructure;
  (window as any).testSimplePaymentCreation = testSimplePaymentCreation;
  
  console.log('🔧 Payment testing functions are now available:');
  console.log('   - testPaymentCreationForLT0RO08()');
  console.log('   - forceCreatePaymentScheduleForLT0RO08()');
  console.log('   - fixAllMissingPaymentSchedules() - Fix ALL agreements');
  console.log('   - checkPaymentsForAgreement(agreementNumber)');
  console.log('   - checkUnifiedPaymentsTableStructure()');
  console.log('   - testSimplePaymentCreation()');
} 