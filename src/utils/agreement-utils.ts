
import { generateAgreementPdfAndUploadAndDownload } from './generateAgreementPdf';
import { supabase } from '@/lib/supabase';

export async function generatePdfDocument(agreement: any): Promise<boolean> {
  try {
    console.log('Starting PDF generation for agreement:', agreement.id);
    
    // Get customer information
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', agreement.customer_id)
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      // Continue with empty customer data rather than failing
    }

    // Get vehicle information
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', agreement.vehicle_id)
      .single();

    if (vehicleError) {
      console.error('Error fetching vehicle:', vehicleError);
      // Continue with empty vehicle data rather than failing
    }

    // Get payment information (optional)
    const { data: payments, error: paymentError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreement.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (paymentError) {
      console.error('Error fetching payments:', paymentError);
    }

    const payment = payments && payments.length > 0 ? payments[0] : null;

    // Prepare data with fallbacks
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

    console.log('Generating PDF with data:', {
      agreement: agreementData,
      customer: customerData,
      vehicle: vehicleData,
      payment: paymentData
    });

    // Generate the PDF
    await generateAgreementPdfAndUploadAndDownload({
      agreement: agreementData,
      customer: customerData,
      vehicle: vehicleData,
      payment: paymentData
    });

    console.log('PDF generation completed successfully');
    return true;

  } catch (error) {
    console.error('Error in generatePdfDocument:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      if (error.message.includes('xCoordinate')) {
        console.error('PDF layout error - likely issue with font or text positioning');
      } else if (error.message.includes('font')) {
        console.error('Font loading error in PDF generation');
      }
    }
    
    return false;
  }
}
