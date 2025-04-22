
import { Agreement } from '@/types/agreement';

/**
 * Formats an agreement number with proper formatting
 * 
 * @param agreementNumber The raw agreement number
 * @returns Formatted agreement number
 */
export const formatAgreementNumber = (agreementNumber: string) => {
  if (!agreementNumber) return 'N/A';

  // If already in the right format, return as is
  if (/^AGR-\d{6}-\d{4}$/.test(agreementNumber)) {
    return agreementNumber;
  }

  // Try to format it if possible
  const match = agreementNumber.match(/(\d{6})-?(\d{4})/);
  if (match) {
    return `AGR-${match[1]}-${match[2]}`;
  }

  return agreementNumber;
};

/**
 * Formats an agreement status for display
 * 
 * @param status The agreement status
 * @returns Formatted status text
 */
export const formatStatus = (status?: string) => {
  if (!status) return 'Unknown';

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
};

/**
 * Creates a PDF filename for an agreement
 * 
 * @param agreement The agreement object
 * @returns A standardized filename for the agreement
 */
export const createAgreementFilename = (agreement: Agreement) => {
  const agreementNumber = agreement.agreement_number || 'unknown';
  const customerName = agreement.customers?.full_name || 'unknown-customer';
  // Format date as YYYY-MM-DD
  const date = new Date().toISOString().split('T')[0];
  
  return `agreement-${agreementNumber}-${customerName.replace(/\s+/g, '-')}-${date}.pdf`;
};

/**
 * Extracts agreement data for template processing
 * 
 * @param agreement The agreement object
 * @returns An object with formatted data for template processing
 */
export const extractAgreementTemplateData = (agreement: Agreement) => {
  if (!agreement) return {};
  
  const startDate = agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : 'N/A';
  const endDate = agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : 'N/A';
  
  return {
    agreement_number: agreement.agreement_number || 'N/A',
    customer_name: agreement.customers?.full_name || 'N/A',
    customer_phone: agreement.customers?.phone_number || 'N/A',
    customer_email: agreement.customers?.email || 'N/A',
    customer_address: agreement.customers?.address || 'N/A',
    license_plate: agreement.vehicles?.license_plate || 'N/A',
    vehicle_make: agreement.vehicles?.make || 'N/A',
    vehicle_model: agreement.vehicles?.model || 'N/A',
    vehicle_year: agreement.vehicles?.year || 'N/A',
    vehicle_vin: agreement.vehicles?.vin || 'N/A',
    start_date: startDate,
    end_date: endDate,
    total_amount: agreement.total_amount?.toFixed(2) || '0.00',
    deposit_amount: agreement.deposit_amount?.toFixed(2) || '0.00',
    rent_amount: agreement.rent_amount?.toFixed(2) || '0.00',
    daily_late_fee: agreement.daily_late_fee?.toFixed(2) || '0.00',
  };
};
