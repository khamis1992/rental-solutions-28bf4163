
import { generateSimplifiedAgreementPdf } from './simplified-pdf-generator';
import { supabase } from '@/lib/supabase';

export async function generatePdfDocument(agreement: any): Promise<boolean> {
  try {
    console.log('Starting simplified PDF generation for agreement:', agreement.id);
    
    // Get customer information with error handling
    let customer = null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', agreement.customer_id)
        .single();

      if (error) {
        console.warn('Error fetching customer:', error);
      } else {
        customer = data;
      }
    } catch (error) {
      console.warn('Failed to fetch customer data:', error);
    }

    // Get vehicle information with error handling
    let vehicle = null;
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', agreement.vehicle_id)
        .single();

      if (error) {
        console.warn('Error fetching vehicle:', error);
      } else {
        vehicle = data;
      }
    } catch (error) {
      console.warn('Failed to fetch vehicle data:', error);
    }

    // Get payment information (optional)
    let payment = null;
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreement.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error fetching payments:', error);
      } else if (data && data.length > 0) {
        payment = data[0];
      }
    } catch (error) {
      console.warn('Failed to fetch payment data:', error);
    }

    // Prepare data with safe fallbacks
    const agreementData = {
      ...agreement,
      agreement_number: agreement.agreement_number || `AG-${agreement.id.slice(0, 8)}`,
      rent_amount: agreement.rent_amount || 0,
      total_amount: agreement.total_amount || 0,
      deposit_amount: agreement.deposit_amount || 0,
      daily_late_fee: agreement.daily_late_fee || 120
    };

    const customerData = customer || {
      full_name: 'Customer Name Not Available',
      name: 'Customer Name Not Available',
      email: 'Not Available',
      phone_number: 'Not Available',
      driver_license: 'Not Available',
      nationality: 'Not Available'
    };

    const vehicleData = vehicle || {
      make: 'Not Available',
      model: 'Not Available',
      year: new Date().getFullYear(),
      license_plate: 'Not Available',
      vin: 'Not Available',
      color: 'Not Available'
    };

    const paymentData = payment || {
      down_payment: agreementData.deposit_amount || 0
    };

    console.log('Generating simplified PDF with data:', {
      agreement: agreementData,
      customer: customerData,
      vehicle: vehicleData,
      payment: paymentData
    });

    // Generate the simplified PDF
    await generateSimplifiedAgreementPdf({
      agreement: agreementData,
      customer: customerData,
      vehicle: vehicleData,
      payment: paymentData
    });

    console.log('Simplified PDF generation completed successfully');
    return true;

  } catch (error) {
    console.error('Error in generatePdfDocument:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('PDF generation error details:', error.message);
    }
    
    return false;
  }
}
