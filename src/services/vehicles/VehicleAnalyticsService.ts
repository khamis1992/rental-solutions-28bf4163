
import { BaseService, handleServiceOperation, ServiceResult } from '../base/BaseService';
import { supabase } from '@/lib/supabase';
import { VehicleUtilizationMetrics } from './types';

/**
 * Service responsible for vehicle analytics and metrics
 * Handles utilization tracking, performance metrics, and reporting
 */
export class VehicleAnalyticsService {
  /**
   * Calculates vehicle utilization metrics for a specified period
   * @param vehicleId - Vehicle identifier
   * @param startDate - Beginning of analysis period
   * @param endDate - End of analysis period
   * @returns Promise with utilization metrics including revenue and occupancy rate
   */
  async calculateUtilizationMetrics(
    vehicleId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ServiceResult<VehicleUtilizationMetrics>> {
    return handleServiceOperation(async () => {
      const { data: leases, error } = await supabase
        .from('leases')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString());
        
      if (error) {
        throw new Error(`Failed to calculate vehicle utilization: ${error.message}`);
      }
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let daysRented = 0;
      leases?.forEach(lease => {
        const leaseStart = new Date(lease.start_date || startDate);
        const leaseEnd = new Date(lease.end_date || endDate);
        
        const effectiveStart = leaseStart < startDate ? startDate : leaseStart;
        const effectiveEnd = leaseEnd > endDate ? endDate : leaseEnd;
        
        const leaseDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
        daysRented += Math.max(0, leaseDays);
      });
      
      const utilizationRate = totalDays > 0 ? (daysRented / totalDays) * 100 : 0;
      
      return {
        totalDays,
        daysRented,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        leasesCount: leases?.length || 0
      };
    });
  }

  /**
   * Gets vehicle revenue metrics
   * @param vehicleId - Vehicle identifier
   * @param startDate - Beginning of analysis period
   * @param endDate - End of analysis period
   * @returns Promise with revenue metrics
   */
  async getRevenueMetrics(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      // Get all completed payments for the vehicle during period
      const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .overlaps('start_date', 'end_date', startDate.toISOString(), endDate.toISOString());
      
      if (leasesError) {
        throw new Error(`Failed to fetch leases: ${leasesError.message}`);
      }
      
      if (!leases || leases.length === 0) {
        return {
          totalRevenue: 0,
          paymentCount: 0,
          avgPaymentAmount: 0
        };
      }
      
      const leaseIds = leases.map(lease => lease.id);
      
      const { data: payments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('amount_paid, payment_date')
        .in('lease_id', leaseIds)
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString())
        .not('status', 'eq', 'cancelled');
      
      if (paymentsError) {
        throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
      }
      
      // Calculate revenue metrics
      const totalRevenue = (payments || []).reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
      const paymentCount = payments?.length || 0;
      const avgPaymentAmount = paymentCount > 0 ? totalRevenue / paymentCount : 0;
      
      return {
        totalRevenue,
        paymentCount,
        avgPaymentAmount: Math.round(avgPaymentAmount * 100) / 100
      };
    });
  }

  /**
   * Gets fleet-wide analytics
   * @param startDate - Beginning of analysis period
   * @param endDate - End of analysis period
   * @returns Promise with fleet analytics
   */
  async getFleetAnalytics(startDate: Date, endDate: Date): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      // Get vehicle statistics by status
      const { data: statusStats, error: statusError } = await supabase
        .from('vehicles')
        .select('status, count')
        .group('status');
      
      if (statusError) {
        throw new Error(`Failed to fetch vehicle status statistics: ${statusError.message}`);
      }
      
      // Get usage statistics for period
      const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('vehicle_id')
        .overlaps('start_date', 'end_date', startDate.toISOString(), endDate.toISOString());
      
      if (leasesError) {
        throw new Error(`Failed to fetch lease data: ${leasesError.message}`);
      }
      
      // Count unique vehicles used in period
      const usedVehicles = new Set();
      leases?.forEach(lease => usedVehicles.add(lease.vehicle_id));
      
      // Get total fleet size
      const { count: totalVehicles, error: countError } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact' });
      
      if (countError) {
        throw new Error(`Failed to count vehicles: ${countError.message}`);
      }
      
      // Calculate fleet utilization
      const fleetUtilizationRate = totalVehicles ? (usedVehicles.size / totalVehicles) * 100 : 0;
      
      return {
        statusDistribution: statusStats || [],
        usedVehiclesCount: usedVehicles.size,
        totalVehicles: totalVehicles || 0,
        fleetUtilizationRate: Math.round(fleetUtilizationRate * 100) / 100,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      };
    });
  }
}

export const vehicleAnalyticsService = new VehicleAnalyticsService();
