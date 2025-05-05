import { supabase } from '@/lib/supabase';
import { ObligationType, UrgencyLevel, CustomerObligation } from './CustomerLegalObligations';

// LegalObligationsService class for managing customer legal obligations
class LegalObligationsService {
  // Fetch overdue payments
  private static async getOverduePayments(): Promise<CustomerObligation[]> {
    try {
      // Simulate fetching overdue payments from a database or API
      const mockPayments: CustomerObligation[] = [
        {
          id: "pay-1",
          customerId: "cust-1",
          customerName: "Ahmed Al-Mansoori",
          description: "Vehicle lease payment overdue",
          obligationType: "payment",
          amount: 3000,
          dueDate: new Date(2024, 2, 10),
          urgency: "high",
          status: "overdue",
          daysOverdue: 20,
          agreementId: "agr-123",
          agreementNumber: "AGR-2024-001",
          lateFine: 300
        },
        {
          id: "pay-2",
          customerId: "cust-2",
          customerName: "Fatima Al-Qasimi",
          description: "Installment payment pending",
          obligationType: "payment",
          amount: 1500,
          dueDate: new Date(2024, 3, 1),
          urgency: "medium",
          status: "overdue",
          daysOverdue: 2
        }
      ];
      return mockPayments;
    } catch (error) {
      console.error("Error fetching overdue payments:", error);
      return [];
    }
  }

  // Fetch traffic fines
  private static async getTrafficFines(): Promise<CustomerObligation[]> {
    try {
      // Simulate fetching traffic fines from a database or API
      const mockFines: CustomerObligation[] = [
        {
          id: "fine-1",
          customerId: "cust-3",
          customerName: "Mohammed Al-Hashimi",
          description: "Speeding ticket on Sheikh Zayed Road",
          obligationType: "traffic_fine",
          amount: 500,
          dueDate: new Date(2024, 4, 1),
          urgency: "high",
          status: "pending",
          daysOverdue: 0
        }
      ];
      return mockFines;
    } catch (error) {
      console.error("Error fetching traffic fines:", error);
      return [];
    }
  }

  // Fetch legal cases
  private static async getLegalCases(): Promise<CustomerObligation[]> {
    try {
      // Simulate fetching legal cases from a database or API
      const mockCases: CustomerObligation[] = [
        {
          id: "case-1",
          customerId: "cust-4",
          customerName: "Layla Al-Farsi",
          description: "Contract dispute with Al Nahda Construction",
          obligationType: "legal_case",
          amount: 0,
          dueDate: new Date(2024, 5, 15),
          urgency: "critical",
          status: "in progress",
          daysOverdue: 0
        }
      ];
      return mockCases;
    } catch (error) {
      console.error("Error fetching legal cases:", error);
      return [];
    }
  }
  
  // Get all legal obligations across different types
  static async getAllObligations(): Promise<CustomerObligation[]> {
    try {
      const obligations: CustomerObligation[] = [];
      
      // Fetch overdue payments
      const overduePayments = await this.getOverduePayments();
      if (overduePayments.length > 0) {
        obligations.push(...overduePayments);
      }
      
      // Fetch traffic fines
      const trafficFines = await this.getTrafficFines();
      if (trafficFines.length > 0) {
        obligations.push(...trafficFines);
      }
      
      // Fetch legal cases
      const legalCases = await this.getLegalCases();
      if (legalCases.length > 0) {
        obligations.push(...legalCases);
      }
      
      return obligations;
    } catch (error) {
      console.error("Error fetching all obligations:", error);
      throw error;
    }
  }
}

/**
 * Fetches legal obligations for customers
 * @returns The result of the operation with either obligations or an error
 */
export async function fetchLegalObligations() {
  try {
    const obligations = await LegalObligationsService.getAllObligations();
    return { obligations, error: null };
  } catch (error) {
    console.error("Error fetching legal obligations:", error);
    return { obligations: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default LegalObligationsService;
