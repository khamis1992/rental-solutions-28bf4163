/**
 * Testing utilities for traffic fines functionality
 */
import { supabase } from '@/integrations/supabase/client';
import { TrafficFine } from '@/hooks/use-traffic-fines';
import { logOperation } from './monitoring-utils';

/**
 * Run a diagnostic test on traffic fine assignment process
 */
export const testTrafficFineAssignment = async (fineId: string) => {
  const results = {
    success: false,
    steps: [] as {step: string, success: boolean, message: string, data?: any}[],
    overallStatus: '',
    recommendations: [] as string[]
  };
  
  try {
    // Step 1: Get traffic fine details
    let step = {
      step: 'Fetching traffic fine',
      success: false,
      message: '',
      data: null as any
    };
    
    const { data: fine, error: fineError } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('id', fineId)
      .single();
      
    if (fineError) {
      step.success = false;
      step.message = `Error: ${fineError.message}`;
      results.steps.push(step);
      results.overallStatus = 'Failed to fetch traffic fine';
      results.recommendations.push('Verify that the traffic fine ID exists');
      return results;
    }
    
    step.success = true;
    step.message = 'Successfully fetched traffic fine';
    step.data = fine;
    results.steps.push(step);
    
    // Step 2: Check license plate
    step = {
      step: 'Validating license plate',
      success: false,
      message: '',
      data: null
    };
    
    if (!fine.license_plate) {
      step.success = false;
      step.message = 'Traffic fine has no license plate';
      results.steps.push(step);
      results.overallStatus = 'Cannot process without license plate';
      results.recommendations.push('Add a license plate to the traffic fine');
      return results;
    }
    
    step.success = true;
    step.message = `License plate: ${fine.license_plate}`;
    results.steps.push(step);
    
    // Step 3: Find vehicle
    step = {
      step: 'Finding vehicle',
      success: false,
      message: '',
      data: null
    };
    
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, make, model, license_plate')
      .eq('license_plate', fine.license_plate)
      .single();
      
    if (vehicleError) {
      step.success = false;
      step.message = `Error: ${vehicleError.message}`;
      results.steps.push(step);
      results.overallStatus = 'Failed to find matching vehicle';
      results.recommendations.push('Verify that a vehicle with this license plate exists');
      return results;
    }
    
    step.success = true;
    step.message = `Found vehicle: ${vehicle.make} ${vehicle.model}`;
    step.data = vehicle;
    results.steps.push(step);
    
    // Step 4: Find active lease
    step = {
      step: 'Finding active lease',
      success: false,
      message: '',
      data: null
    };
    
    const violationDate = new Date(fine.violation_date);
    
    const { data: leases, error: leaseError } = await supabase
      .from('leases')
      .select('id, customer_id, agreement_number, start_date, end_date')
      .eq('vehicle_id', vehicle.id)
      .lte('start_date', violationDate.toISOString())
      .gte('end_date', violationDate.toISOString());
      
    if (leaseError) {
      step.success = false;
      step.message = `Error: ${leaseError.message}`;
      results.steps.push(step);
      results.overallStatus = 'Failed to find active lease';
      results.recommendations.push('Verify that the database is accessible');
      return results;
    }
    
    if (!leases || leases.length === 0) {
      step.success = false;
      step.message = `No active lease found for date: ${violationDate.toISOString()}`;
      results.steps.push(step);
      results.overallStatus = 'No active lease for this date';
      results.recommendations.push('Verify that the vehicle was leased on the violation date');
      return results;
    }
    
    step.success = true;
    step.message = `Found ${leases.length} active lease(s)`;
    step.data = leases;
    results.steps.push(step);
    
    // Step 5: Get customer details
    step = {
      step: 'Getting customer details',
      success: false,
      message: '',
      data: null
    };
    
    const lease = leases[0]; // Use the first lease if multiple
    
    if (!lease.customer_id) {
      step.success = false;
      step.message = 'Lease has no customer ID';
      results.steps.push(step);
      results.overallStatus = 'Lease is missing customer information';
      results.recommendations.push('Update the lease with customer information');
      return results;
    }
    
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', lease.customer_id)
      .single();
      
    if (customerError) {
      step.success = false;
      step.message = `Error: ${customerError.message}`;
      results.steps.push(step);
      results.overallStatus = 'Failed to get customer details';
      results.recommendations.push('Verify that the customer exists');
      return results;
    }
    
    step.success = true;
    step.message = `Found customer: ${customer.full_name}`;
    step.data = customer;
    results.steps.push(step);
    
    // Final result
    results.success = true;
    results.overallStatus = 'Traffic fine can be assigned successfully';
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.steps.push({
      step: 'Unexpected error',
      success: false,
      message: errorMessage,
      data: null
    });
    results.overallStatus = 'Test failed due to unexpected error';
    results.recommendations.push('Check server logs for details');
    
    // Log the error
    logOperation(
      'trafficFineAssignmentTest',
      'error',
      { fineId },
      errorMessage
    );
  }
  
  return results;
};

/**
 * Validate a traffic fine for assignment eligibility
 */
export const validateTrafficFineForAssignment = (fine: TrafficFine): {
  isValid: boolean;
  validationErrors: string[];
} => {
  const validationErrors: string[] = [];
  
  // Required fields
  if (!fine.id) validationErrors.push('Missing fine ID');
  if (!fine.licensePlate) validationErrors.push('Missing license plate');
  if (!fine.violationDate) validationErrors.push('Missing violation date');
  
  // Validation rules
  if (fine.fineAmount <= 0) validationErrors.push('Invalid fine amount');
  
  // Date validation
  const violationDate = fine.violationDate;
  const today = new Date();
  if (new Date(violationDate) > new Date()) {
    validationErrors.push('Violation date cannot be in the future');
  }
  
  // Business rules
  if (fine.paymentStatus === 'paid') validationErrors.push('Fine is already paid');
  
  return {
    isValid: validationErrors.length === 0,
    validationErrors
  };
};

/**
 * Run a health check on traffic fines system
 */
export const runTrafficFinesSystemHealthCheck = async () => {
  const results = {
    status: 'success' as 'success' | 'warning' | 'error',
    issues: [] as string[],
    metrics: {
      totalFines: 0,
      unassignedFines: 0,
      pendingFines: 0,
      paidFines: 0,
      disputedFines: 0
    }
  };
  
  try {
    // Check database connection
    const { error: connectionError } = await supabase.from('traffic_fines').select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      results.status = 'error';
      results.issues.push(`Database connection error: ${connectionError.message}`);
      return results;
    }
    
    // Get traffic fines counts
    const { data: countData, error: countError } = await supabase
      .from('traffic_fines')
      .select('payment_status, lease_id', { count: 'exact' });
      
    if (countError) {
      results.status = 'error';
      results.issues.push(`Failed to get traffic fines count: ${countError.message}`);
      return results;
    }
    
    // Calculate metrics
    if (countData) {
      results.metrics.totalFines = countData.length;
      results.metrics.unassignedFines = countData.filter(fine => !fine.lease_id).length;
      results.metrics.pendingFines = countData.filter(fine => fine.payment_status === 'pending').length;
      results.metrics.paidFines = countData.filter(fine => fine.payment_status === 'paid').length;
      results.metrics.disputedFines = countData.filter(fine => fine.payment_status === 'disputed').length;
    }
    
    // Check for potential data issues
    
    // 1. Fines without license plates
    const { data: noPlateData, error: noPlateError } = await supabase
      .from('traffic_fines')
      .select('id')
      .is('license_plate', null);
      
    if (!noPlateError && noPlateData && noPlateData.length > 0) {
      results.status = 'warning';
      results.issues.push(`${noPlateData.length} traffic fines have no license plate`);
    }
    
    // 2. Fines with future dates
    const { data: futureDates, error: futureDatesError } = await supabase
      .from('traffic_fines')
      .select('id, violation_date')
      .gt('violation_date', new Date().toISOString());
      
    if (!futureDatesError && futureDates && futureDates.length > 0) {
      results.status = 'warning';
      results.issues.push(`${futureDates.length} traffic fines have future violation dates`);
    }
    
    // Overall system status
    if (results.issues.length === 0) {
      results.status = 'success';
    } else if (results.status !== 'error') {
      results.status = 'warning';
    }
    
  } catch (error) {
    results.status = 'error';
    results.issues.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    
    // Log the error
    logOperation(
      'trafficFinesHealthCheck',
      'error',
      {},
      error instanceof Error ? error.message : String(error)
    );
  }
  
  return results;
};
