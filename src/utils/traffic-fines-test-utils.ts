
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SystemHealthCheckResult {
  status: 'available' | 'unavailable' | 'degraded' | 'warning' | 'error';
  issues: string[];
  metrics: {
    totalFines: number;
    unassignedFines: number;
    pendingFines: number;
    paidFines: number;
    disputedFines: number;
  };
  timestamp: string;
}

export interface FineAssignmentTestResult {
  success: boolean;
  overallStatus: string;
  details: {
    leaseFound: boolean;
    dateValidation: boolean;
    customerAssociation: boolean;
    message: string;
  };
}

export interface TrafficFineDataQualityResult {
  issueCount: number;
  severityScore: number;
  categorizedIssues: {
    missingData: number;
    incorrectDates: number;
    duplicates: number;
    incorrectAssignments: number;
  };
  recommendations: string[];
}

export async function runTrafficFinesSystemHealthCheck(): Promise<SystemHealthCheckResult> {
  try {
    // Fetch traffic fines statistics
    const { data: fines, error: finesError } = await supabase
      .from('traffic_fines')
      .select('id, payment_status, assignment_status');
    
    if (finesError) throw finesError;

    // Process metrics
    const totalFines = fines?.length || 0;
    const unassignedFines = fines?.filter(f => !f.lease_id).length || 0;
    const pendingFines = fines?.filter(f => f.payment_status === 'pending').length || 0;
    const paidFines = fines?.filter(f => f.payment_status === 'paid').length || 0;
    const disputedFines = fines?.filter(f => f.payment_status === 'disputed').length || 0;

    // Identify issues
    const issues: string[] = [];
    if (unassignedFines > totalFines * 0.3) {
      issues.push(`High number of unassigned fines: ${unassignedFines} (${Math.round(unassignedFines/totalFines*100)}%)`);
    }

    if (pendingFines > totalFines * 0.5) {
      issues.push(`High number of unpaid fines: ${pendingFines} (${Math.round(pendingFines/totalFines*100)}%)`);
    }

    // Determine overall status
    let status: SystemHealthCheckResult['status'] = 'available';
    if (issues.length > 3) {
      status = 'error';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return {
      status,
      issues,
      metrics: {
        totalFines,
        unassignedFines,
        pendingFines,
        paidFines,
        disputedFines
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in system health check:', error);
    return {
      status: 'degraded',
      issues: [error instanceof Error ? error.message : 'Unknown error during health check'],
      metrics: {
        totalFines: 0,
        unassignedFines: 0,
        pendingFines: 0,
        paidFines: 0,
        disputedFines: 0
      },
      timestamp: new Date().toISOString()
    };
  }
}

export async function testTrafficFineAssignment(fineId: string): Promise<FineAssignmentTestResult> {
  try {
    // Get fine details
    const { data: fine, error: fineError } = await supabase
      .from('traffic_fines')
      .select('id, license_plate, violation_date, lease_id')
      .eq('id', fineId)
      .single();
    
    if (fineError || !fine) {
      throw new Error(fineError?.message || 'Fine not found');
    }

    // Find best lease match
    const { data: leases, error: leaseError } = await supabase
      .from('leases')
      .select('id, start_date, end_date, customer_id')
      .eq('vehicle_id', (await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', fine.license_plate)
        .single()).data?.id)
      .order('created_at', { ascending: false });
    
    if (leaseError) {
      throw new Error(leaseError.message);
    }

    // Test data
    const details = {
      leaseFound: leases && leases.length > 0,
      dateValidation: false,
      customerAssociation: false,
      message: ''
    };

    if (!details.leaseFound) {
      details.message = `No lease found for license plate ${fine.license_plate}`;
      return {
        success: false,
        overallStatus: 'No matching lease found',
        details
      };
    }

    // Check date validation
    for (const lease of leases) {
      const violationDate = new Date(fine.violation_date);
      const startDate = new Date(lease.start_date);
      const endDate = lease.end_date ? new Date(lease.end_date) : new Date();
      
      if (violationDate >= startDate && violationDate <= endDate) {
        details.dateValidation = true;
        details.customerAssociation = !!lease.customer_id;
        break;
      }
    }

    if (!details.dateValidation) {
      details.message = 'Violation date does not match any lease period';
    } else if (!details.customerAssociation) {
      details.message = 'Lease found but missing customer association';
    } else {
      details.message = 'Fine can be properly assigned to a customer';
    }

    return {
      success: details.leaseFound && details.dateValidation && details.customerAssociation,
      overallStatus: details.message,
      details
    };
  } catch (error) {
    console.error('Error testing fine assignment:', error);
    return {
      success: false,
      overallStatus: error instanceof Error ? error.message : 'Unknown error testing assignment',
      details: {
        leaseFound: false,
        dateValidation: false,
        customerAssociation: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

export async function testTrafficFineDataQuality(): Promise<TrafficFineDataQualityResult> {
  try {
    // Fetch traffic fines
    const { data: fines, error } = await supabase
      .from('traffic_fines')
      .select('id, license_plate, violation_date, lease_id, payment_status, fine_amount');
    
    if (error) throw error;
    
    const issues = {
      missingData: 0,
      incorrectDates: 0,
      duplicates: 0,
      incorrectAssignments: 0
    };
    
    // Check for missing data
    fines?.forEach(fine => {
      if (!fine.license_plate || !fine.violation_date) {
        issues.missingData++;
      }
      
      // Check for invalid dates
      const violationDate = new Date(fine.violation_date);
      if (isNaN(violationDate.getTime()) || violationDate > new Date()) {
        issues.incorrectDates++;
      }
    });
    
    // Check for duplicate fines (same license plate and violation date)
    const dupeMap = new Map();
    fines?.forEach(fine => {
      const key = `${fine.license_plate}-${fine.violation_date}`;
      dupeMap.set(key, (dupeMap.get(key) || 0) + 1);
    });
    
    issues.duplicates = Array.from(dupeMap.values()).filter(count => count > 1).length;
    
    // Calculate severity score (0-100)
    const totalIssues = Object.values(issues).reduce((sum, count) => sum + count, 0);
    const severityScore = Math.min(100, Math.round((totalIssues / (fines?.length || 1)) * 100));
    
    // Generate recommendations
    const recommendations = [];
    if (issues.missingData > 0) {
      recommendations.push(`Complete missing data for ${issues.missingData} traffic fines`);
    }
    if (issues.incorrectDates > 0) {
      recommendations.push(`Fix incorrect dates for ${issues.incorrectDates} traffic fines`);
    }
    if (issues.duplicates > 0) {
      recommendations.push(`Review ${issues.duplicates} potential duplicate fine records`);
    }
    if (issues.incorrectAssignments > 0) {
      recommendations.push(`Fix ${issues.incorrectAssignments} incorrect customer assignments`);
    }
    
    return {
      issueCount: totalIssues,
      severityScore,
      categorizedIssues: issues,
      recommendations
    };
  } catch (error) {
    console.error('Error checking traffic fine data quality:', error);
    return {
      issueCount: 0,
      severityScore: 0,
      categorizedIssues: {
        missingData: 0,
        incorrectDates: 0,
        duplicates: 0,
        incorrectAssignments: 0
      },
      recommendations: [
        'An error occurred during quality check. Please try again.'
      ]
    };
  }
}

export async function fixTrafficFineDataQualityIssues(
  options: {
    fixDates?: boolean;
    fixDuplicates?: boolean;
    fixAssignments?: boolean;
  } = {}
): Promise<{ fixed: number; errors: number; details: string[] }> {
  const details: string[] = [];
  let fixed = 0;
  let errors = 0;

  try {
    // Fix invalid dates if requested
    if (options.fixDates) {
      const { data: fines, error } = await supabase
        .from('traffic_fines')
        .select('id, violation_date')
        .or('violation_date.is.null,violation_date.gt.now()');

      if (error) throw error;

      if (fines && fines.length > 0) {
        for (const fine of fines) {
          try {
            // Use today's date for invalid dates
            await supabase
              .from('traffic_fines')
              .update({ violation_date: new Date().toISOString() })
              .eq('id', fine.id);
            
            fixed++;
            details.push(`Fixed invalid date for fine ID: ${fine.id}`);
          } catch {
            errors++;
          }
        }
      }
    }

    // Handle other fixes as needed...

    return { fixed, errors, details };
  } catch (error) {
    console.error('Error fixing traffic fine data quality issues:', error);
    return { 
      fixed, 
      errors: errors + 1, 
      details: [...details, error instanceof Error ? error.message : 'Unknown error during fix operation']
    };
  }
}
