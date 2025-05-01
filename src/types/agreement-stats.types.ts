
/**
 * Represents the statistical information related to rental agreements
 */
export interface AgreementStats {
  totalAgreements: number;
  activeAgreements: number;
  pendingPayments: number;
  overduePayments: number;
  activeValue: number;
}

/**
 * Represents detailed agreement statistics with additional metrics
 */
export interface DetailedAgreementStats extends AgreementStats {
  // Additional metrics
  completedAgreements: number;
  cancelledAgreements: number;
  totalPaymentsReceived: number;
  totalPaymentsOverdue: number;
  averageAgreementDuration: number; // in days
  averagePaymentDelay: number; // in days
}

/**
 * Represents the status and count for each agreement status
 */
export interface AgreementStatusCounts {
  status: string;
  count: number;
}

/**
 * Represents the response from the server for agreement statistics
 */
export interface AgreementStatsResponse {
  stats: AgreementStats;
  statusCounts: AgreementStatusCounts[];
  success: boolean;
  errorMessage?: string;
}
