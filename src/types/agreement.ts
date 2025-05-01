
/**
 * Core types and interfaces for the Agreement Management System.
 * These types represent the fundamental data structures used throughout
 * the rental fleet management application.
 */

import { LeaseId, VehicleId, ProfileId, PaymentId } from './database-common';

/**
 * Represents the current state of an agreement in the system.
 * Used to track the lifecycle of a rental agreement from creation to completion.
 */
export type AgreementStatus = 
  | 'draft'           // Initial creation state
  | 'pending'         // Awaiting approval/processing
  | 'active'          // Currently in effect
  | 'completed'       // Successfully finished
  | 'cancelled'       // Terminated before completion
  | 'terminated'      // Ended due to breach/violation
  | 'pending_payment' // Awaiting payment processing
  | 'pending_deposit' // Awaiting initial deposit
  | 'archived'        // Historical record
  | 'closed';         // Formally concluded

/**
 * Core agreement data structure containing all essential information
 * about a vehicle rental agreement between a customer and the company.
 */
export interface Agreement {
  id: LeaseId;
  agreement_number: string;
  customer_id: ProfileId;
  vehicle_id: VehicleId;
  status: AgreementStatus;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  payment_frequency: string;
  payment_day: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Extended agreement details including related data from other entities
 * Used for displaying comprehensive agreement information in the UI.
 */
export interface AgreementDetails extends Agreement {
  customer: {
    id: ProfileId;
    full_name: string;
    email: string;
    phone_number: string;
  };
  vehicle: {
    id: VehicleId;
    make: string;
    model: string;
    year: number;
    license_plate: string;
  };
  payments: Array<{
    id: PaymentId;
    amount: number;
    status: string;
    payment_date: string;
  }>;
}

/**
 * Configuration for agreement creation and modification
 * Defines the rules and constraints for agreement management.
 */
export interface AgreementConfig {
  /** Minimum required deposit amount as a percentage of total value */
  minDepositPercent: number;
  /** Maximum allowed rental duration in days */
  maxRentalDuration: number;
  /** Grace period for late payments in days */
  paymentGracePeriod: number;
  /** Allowed payment frequencies */
  allowedFrequencies: string[];
}

