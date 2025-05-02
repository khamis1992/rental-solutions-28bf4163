
import { supabase } from '@/lib/supabase';
import { validateTrafficFines, identifyFinesWithoutLicensePlates } from '@/utils/validation/traffic-fine-validation';

/**
 * Traffic fine data quality test result
 */
export interface TrafficFineDataQualityResult {
  status: 'success' | 'warning' | 'error';
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  missingLicensePlateCount: number;
  duplicateCount: number;
  issues: string[];
}

/**
 * Test the quality of traffic fine data in the database
 * @returns Promise resolving to a data quality test result
 */
export const testTrafficFineDataQuality = async (): Promise<TrafficFineDataQualityResult> => {
  const results: TrafficFineDataQualityResult = {
    status: 'success',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    missingLicensePlateCount: 0,
    duplicateCount: 0,
    issues: []
  };
  
  try {
    // Fetch all traffic fines
    const { data: fines, error } = await supabase
      .from('traffic_fines')
      .select('*');
      
    if (error) {
      throw new Error(`Failed to fetch traffic fines: ${error.message}`);
    }
    
    if (!fines) {
      throw new Error('No data returned from database');
    }
    
    results.totalRecords = fines.length;
    
    if (fines.length === 0) {
      results.issues.push('No traffic fines found in the database');
      return results;
    }
    
    // Check for data validation issues
    const mappedData = fines.map(fine => ({
      licensePlate: fine.license_plate,
      violationNumber: fine.violation_number,
      violationDate: fine.violation_date ? new Date(fine.violation_date) : undefined,
      fineAmount: fine.fine_amount,
      violationCharge: fine.violation_charge,
      location: fine.fine_location
    }));
    
    const validationResults = validateTrafficFines(mappedData);
    results.invalidRecords = validationResults.errorCount;
    results.validRecords = results.totalRecords - results.invalidRecords;
    
    if (validationResults.errorCount > 0) {
      results.status = 'warning';
      results.issues.push(`${validationResults.errorCount} traffic fines have validation errors`);
    }
    
    // Check for missing license plates
    const finesWithoutLicensePlate = identifyFinesWithoutLicensePlates(mappedData);
    results.missingLicensePlateCount = finesWithoutLicensePlate.length;
    
    if (finesWithoutLicensePlate.length > 0) {
      results.status = 'warning';
      results.issues.push(`${finesWithoutLicensePlate.length} traffic fines have no license plate`);
    }
    
    // Check for potential duplicates
    const licenseViolationMap = new Map<string, string[]>();
    
    fines.forEach(fine => {
      if (!fine.license_plate || !fine.violation_date) return;
      
      const key = `${fine.license_plate}_${fine.violation_date}`;
      const existingIds = licenseViolationMap.get(key) || [];
      licenseViolationMap.set(key, [...existingIds, fine.id]);
    });
    
    const duplicates = Array.from(licenseViolationMap.entries())
      .filter(([_, ids]) => ids.length > 1);
      
    results.duplicateCount = duplicates.length;
    
    if (duplicates.length > 0) {
      results.status = 'warning';
      results.issues.push(`Found ${duplicates.length} potential duplicate entries (same license plate and date)`);
    }
    
    // Set final status
    if (results.invalidRecords > results.totalRecords * 0.2) {
      results.status = 'error';
      results.issues.push(`High percentage (${Math.round(results.invalidRecords / results.totalRecords * 100)}%) of invalid records detected`);
    }
    
    return results;
    
  } catch (error) {
    console.error('Error testing data quality:', error);
    return {
      status: 'error',
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      missingLicensePlateCount: 0,
      duplicateCount: 0,
      issues: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
};

/**
 * Fix common data quality issues with traffic fines
 * @returns Promise resolving to a result of the fix operation
 */
export const fixTrafficFineDataQualityIssues = async (): Promise<{
  success: boolean;
  fixed: number;
  issues: string[];
}> => {
  const result = {
    success: true,
    fixed: 0,
    issues: [] as string[]
  };
  
  try {
    // 1. Fix missing violation dates by setting them to the current date
    const { data: noDateData, error: noDateError } = await supabase
      .from('traffic_fines')
      .update({ violation_date: new Date().toISOString() })
      .is('violation_date', null)
      .select();
      
    if (noDateError) {
      throw new Error(`Error fixing missing dates: ${noDateError.message}`);
    }
    
    if (noDateData && noDateData.length > 0) {
      result.fixed += noDateData.length;
      result.issues.push(`Fixed ${noDateData.length} records with missing violation dates`);
    }
    
    // 2. Fix negative fine amounts by converting them to positive
    const { data: negativeAmountData, error: negativeAmountError } = await supabase
      .from('traffic_fines')
      .select('*')
      .lt('fine_amount', 0);
      
    if (negativeAmountError) {
      throw new Error(`Error finding negative amounts: ${negativeAmountError.message}`);
    }
    
    if (negativeAmountData && negativeAmountData.length > 0) {
      for (const fine of negativeAmountData) {
        await supabase
          .from('traffic_fines')
          .update({ fine_amount: Math.abs(fine.fine_amount) })
          .eq('id', fine.id);
      }
      
      result.fixed += negativeAmountData.length;
      result.issues.push(`Fixed ${negativeAmountData.length} records with negative fine amounts`);
    }
    
    // 3. Fix null payment statuses
    const { data: noStatusData, error: noStatusError } = await supabase
      .from('traffic_fines')
      .update({ payment_status: 'pending' })
      .is('payment_status', null)
      .select();
      
    if (noStatusError) {
      throw new Error(`Error fixing missing statuses: ${noStatusError.message}`);
    }
    
    if (noStatusData && noStatusData.length > 0) {
      result.fixed += noStatusData.length;
      result.issues.push(`Fixed ${noStatusData.length} records with missing payment status`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error fixing data quality issues:', error);
    return {
      success: false,
      fixed: 0,
      issues: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
};
