import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Result } from '@/types/response.types';

// Type definitions for Legal Management
export interface UnpaidAgreement {
  id: string;
  customer_id: string;
  customer_name: string;
  vehicle_license_plate: string;
  amount_owed: number;
  days_overdue: number;
  last_payment_date?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface UnpaidTrafficFine {
  id: string;
  customer_id: string;
  customer_name: string;
  violation_number: string;
  license_plate: string;
  fine_amount: number;
  violation_date: string;
  days_overdue: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface LegalCandidate {
  id: string;
  customer_id: string;
  customer_name: string;
  type: 'unpaid_agreement' | 'unpaid_traffic_fine' | 'combined';
  total_amount_owed: number;
  unpaid_agreements: UnpaidAgreement[];
  unpaid_traffic_fines: UnpaidTrafficFine[];
  priority_score: number;
  recommended_action: string;
  auto_detected_at: string;
}

export interface LegalTemplate {
  id: string;
  name: string;
  type: 'demand_letter' | 'court_notice' | 'settlement_offer' | 'payment_reminder' | 'legal_notice';
  content: string;
  variables: string[]; // Array of variable names like ['customer_name', 'amount_owed', 'due_date']
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LegalCase {
  id: string;
  customer_id: string;
  customer_name: string;
  case_number: string;
  case_type: 'payment_collection' | 'traffic_fine_collection' | 'contract_breach' | 'other';
  status: 'open' | 'in_progress' | 'pending_payment' | 'resolved' | 'closed';
  total_amount: number;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  notes?: string;
  documents: string[]; // Array of document IDs
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface LegalDocument {
  id: string;
  case_id: string;
  template_id: string;
  document_type: string;
  content: string;
  generated_at: string;
  file_path?: string; // Path to generated PDF
  sent_at?: string;
  sent_via?: 'email' | 'post' | 'hand_delivery';
}

export class LegalManagementService extends BaseService {
  
  /**
   * AUTO-DETECTION ENGINE
   * Automatically detect customers with unpaid agreements (30+ days overdue)
   */
  async detectUnpaidAgreements(): Promise<Result<UnpaidAgreement[]>> {
    return this.safeExecute(async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // تحديث حالة المدفوعات المتأخرة تلقائياً قبل التحليل
      console.log('🔄 تحديث حالة المدفوعات المتأخرة...');
      try {
        const { ensureAllMonthlyPayments } = await import('../lib/payment-utils');
        
        // جلب جميع العقود النشطة لتحديث مدفوعاتها
        const { data: activeAgreements } = await supabase
          .from('leases')
          .select('id')
          .eq('status', 'active');

        if (activeAgreements) {
          for (const agreement of activeAgreements.slice(0, 5)) { // تحديث أول 5 عقود لتجنب التحميل الزائد
            await ensureAllMonthlyPayments(agreement.id);
          }
        }
        console.log('✅ تم تحديث حالة المدفوعات المتأخرة');
      } catch (error) {
        console.warn('⚠️ فشل في تحديث حالة المدفوعات:', error);
      }

      const { data: agreements, error } = await supabase
        .from('leases')
        .select(`
          id,
          customer_id,
          vehicle_id,
          profiles:customer_id (full_name),
          vehicles:vehicle_id (license_plate),
          unified_payments (
            id,
            amount,
            due_date,
            status,
            payment_date
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      const unpaidAgreements: UnpaidAgreement[] = [];

      for (const agreement of agreements || []) {
        // فقط الدفعات التي حالتها 'overdue' رسمياً
        const unpaidPayments = agreement.unified_payments?.filter(
          payment => payment.status === 'overdue'
        ) || [];

        if (unpaidPayments.length === 0) continue;

        const amountOwed = unpaidPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const oldestUnpaidDate = unpaidPayments
          .map(p => new Date(p.due_date))
          .reduce((oldest, date) => date < oldest ? date : oldest, new Date());
        
        const daysOverdue = Math.floor((new Date().getTime() - oldestUnpaidDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate priority based on amount and days overdue
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (daysOverdue > 90 || amountOwed > 10000) priority = 'critical';
        else if (daysOverdue > 60 || amountOwed > 5000) priority = 'high';
        else if (daysOverdue > 30 || amountOwed > 2000) priority = 'medium';

        unpaidAgreements.push({
          id: agreement.id,
          customer_id: agreement.customer_id,
          customer_name: (agreement.profiles as any)?.full_name || 'Unknown Customer',
          vehicle_license_plate: (agreement.vehicles as any)?.license_plate || 'Unknown',
          amount_owed: amountOwed,
          days_overdue: daysOverdue,
          last_payment_date: unpaidPayments[0]?.payment_date,
          priority
        });
      }

      return unpaidAgreements.sort((a, b) => b.days_overdue - a.days_overdue);
    });
  }

  /**
   * AUTO-DETECTION ENGINE
   * Automatically detect customers with unpaid traffic fines (15+ days overdue)
   */
  async detectUnpaidTrafficFines(): Promise<Result<UnpaidTrafficFine[]>> {
    return this.safeExecute(async () => {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      const { data: fines, error } = await supabase
        .from('traffic_fines')
        .select(`
          id,
          violation_number,
          license_plate,
          fine_amount,
          violation_date,
          payment_status,
          lease_id,
          leases:lease_id (
            customer_id,
            profiles:customer_id (full_name)
          )
        `)
        .eq('payment_status', 'pending')
        .lt('violation_date', fifteenDaysAgo.toISOString());

      if (error) throw error;

      const unpaidTrafficFines: UnpaidTrafficFine[] = (fines || []).map(fine => {
        const violationDate = new Date(fine.violation_date);
        const daysOverdue = Math.floor((new Date().getTime() - violationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate priority based on amount and days overdue
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (daysOverdue > 60 || fine.fine_amount > 2000) priority = 'critical';
        else if (daysOverdue > 45 || fine.fine_amount > 1000) priority = 'high';
        else if (daysOverdue > 30 || fine.fine_amount > 500) priority = 'medium';

        return {
          id: fine.id,
          customer_id: (fine.leases as any)?.customer_id || '',
          customer_name: (fine.leases as any)?.profiles?.full_name || 'Unknown Customer',
          violation_number: fine.violation_number,
          license_plate: fine.license_plate,
          fine_amount: fine.fine_amount,
          violation_date: fine.violation_date,
          days_overdue: daysOverdue,
          priority
        };
      });

      return unpaidTrafficFines.sort((a, b) => b.days_overdue - a.days_overdue);
    });
  }

  /**
   * AUTO-DETECTION ENGINE
   * Generate comprehensive list of customers eligible for legal action
   */
  async generateLegalCandidates(): Promise<Result<LegalCandidate[]>> {
    return this.safeExecute(async () => {
      const [unpaidAgreementsResult, unpaidFinesResult] = await Promise.all([
        this.detectUnpaidAgreements(),
        this.detectUnpaidTrafficFines()
      ]);

      if (!unpaidAgreementsResult.success || !unpaidFinesResult.success) {
        throw new Error('Failed to detect unpaid obligations');
      }

      const unpaidAgreements = unpaidAgreementsResult.data;
      const unpaidFines = unpaidFinesResult.data;

      // Group by customer
      const customerMap = new Map<string, LegalCandidate>();

      // Process unpaid agreements
      unpaidAgreements.forEach(agreement => {
        if (!customerMap.has(agreement.customer_id)) {
          customerMap.set(agreement.customer_id, {
            id: `candidate_${agreement.customer_id}`,
            customer_id: agreement.customer_id,
            customer_name: agreement.customer_name,
            type: 'unpaid_agreement',
            total_amount_owed: 0,
            unpaid_agreements: [],
            unpaid_traffic_fines: [],
            priority_score: 0,
            recommended_action: '',
            auto_detected_at: new Date().toISOString()
          });
        }
        
        const candidate = customerMap.get(agreement.customer_id)!;
        candidate.unpaid_agreements.push(agreement);
        candidate.total_amount_owed += agreement.amount_owed;
      });

      // Process unpaid traffic fines
      unpaidFines.forEach(fine => {
        if (!customerMap.has(fine.customer_id)) {
          customerMap.set(fine.customer_id, {
            id: `candidate_${fine.customer_id}`,
            customer_id: fine.customer_id,
            customer_name: fine.customer_name,
            type: 'unpaid_traffic_fine',
            total_amount_owed: 0,
            unpaid_agreements: [],
            unpaid_traffic_fines: [],
            priority_score: 0,
            recommended_action: '',
            auto_detected_at: new Date().toISOString()
          });
        }

        const candidate = customerMap.get(fine.customer_id)!;
        candidate.unpaid_traffic_fines.push(fine);
        candidate.total_amount_owed += fine.fine_amount;
      });

      // Calculate priority scores and recommended actions
      const candidates = Array.from(customerMap.values()).map(candidate => {
        // Determine type based on what obligations they have
        if (candidate.unpaid_agreements.length > 0 && candidate.unpaid_traffic_fines.length > 0) {
          candidate.type = 'combined';
        }

        // Calculate priority score (0-100)
        let priorityScore = 0;
        priorityScore += candidate.total_amount_owed / 100; // Amount factor
        priorityScore += candidate.unpaid_agreements.reduce((sum, a) => sum + a.days_overdue, 0) / 10; // Days overdue factor
        priorityScore += candidate.unpaid_traffic_fines.reduce((sum, f) => sum + f.days_overdue, 0) / 10;
        priorityScore += candidate.unpaid_agreements.length * 5; // Multiple agreements factor
        priorityScore += candidate.unpaid_traffic_fines.length * 3; // Multiple fines factor

        candidate.priority_score = Math.min(100, Math.round(priorityScore));

        // Recommended action based on priority score
        if (candidate.priority_score >= 80) {
          candidate.recommended_action = 'Immediate legal action - Court filing';
        } else if (candidate.priority_score >= 60) {
          candidate.recommended_action = 'Final demand letter with legal notice';
        } else if (candidate.priority_score >= 40) {
          candidate.recommended_action = 'Formal demand letter';
        } else {
          candidate.recommended_action = 'Payment reminder notice';
        }

        return candidate;
      });

      return candidates.sort((a, b) => b.priority_score - a.priority_score);
    });
  }

  /**
   * LEGAL CASE MANAGEMENT
   * Create a new legal case against a customer
   */
  async createLegalCase(
    customerId: string,
    caseType: LegalCase['case_type'],
    totalAmount: number,
    notes?: string
  ): Promise<Result<LegalCase>> {
    return this.safeExecute(async () => {
      // Generate case number
      const caseNumber = `LC-${Date.now()}-${customerId.slice(0, 6).toUpperCase()}`;

      // Get customer name
      const { data: customer } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', customerId)
        .single();

      const legalCase: Omit<LegalCase, 'id'> = {
        customer_id: customerId,
        customer_name: customer?.full_name || 'Unknown Customer',
        case_number: caseNumber,
        case_type: caseType,
        status: 'open',
        total_amount: totalAmount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes,
        documents: [],
        priority: totalAmount > 5000 ? 'high' : totalAmount > 2000 ? 'medium' : 'low'
      };

      const { data, error } = await supabase
        .from('legal_cases')
        .insert(legalCase)
        .select()
        .single();

      if (error) throw error;

      return data as LegalCase;
    });
  }

  /**
   * LEGAL CASE MANAGEMENT
   * Update legal case status and add notes
   */
  async updateLegalCase(
    caseId: string,
    updates: Partial<Pick<LegalCase, 'status' | 'notes' | 'assigned_to' | 'priority'>>
  ): Promise<Result<LegalCase>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('legal_cases')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;

      return data as LegalCase;
    });
  }

  /**
   * LEGAL TEMPLATE MANAGEMENT
   * Create a new legal document template
   */
  async createLegalTemplate(
    name: string,
    type: LegalTemplate['type'],
    content: string,
    variables: string[]
  ): Promise<Result<LegalTemplate>> {
    return this.safeExecute(async () => {
      const template: Omit<LegalTemplate, 'id'> = {
        name,
        type,
        content,
        variables,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };

      const { data, error } = await supabase
        .from('legal_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;

      return data as LegalTemplate;
    });
  }

  /**
   * LEGAL TEMPLATE MANAGEMENT
   * Get all active legal templates
   */
  async getLegalTemplates(): Promise<Result<LegalTemplate[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('legal_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as LegalTemplate[];
    });
  }

  /**
   * DOCUMENT GENERATION
   * Generate a legal document from template with customer data
   */
  async generateDocumentFromTemplate(
    templateId: string,
    caseId: string,
    customerData: Record<string, any>
  ): Promise<Result<LegalDocument>> {
    return this.safeExecute(async () => {
      // Get template
      const { data: template, error: templateError } = await supabase
        .from('legal_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Replace variables in template content
      let content = template.content;
      template.variables.forEach((variable: string) => {
        const value = customerData[variable] || `[${variable}]`;
        content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });

      const document: Omit<LegalDocument, 'id'> = {
        case_id: caseId,
        template_id: templateId,
        document_type: template.type,
        content,
        generated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('legal_documents')
        .insert(document)
        .select()
        .single();

      if (error) throw error;

      return data as LegalDocument;
    });
  }

  /**
   * REPORTING
   * Get legal management dashboard statistics
   */
  async getDashboardStats(): Promise<Result<{
    total_candidates: number;
    total_cases: number;
    total_amount_at_risk: number;
    cases_by_status: Record<string, number>;
    priority_breakdown: Record<string, number>;
    recent_activities: any[];
  }>> {
    return this.safeExecute(async () => {
      const [candidatesResult, casesResult] = await Promise.all([
        this.generateLegalCandidates(),
        supabase.from('legal_cases').select('*')
      ]);

      if (!candidatesResult.success) throw new Error('Failed to get candidates');
      if (casesResult.error) throw casesResult.error;

      const candidates = candidatesResult.data;
      const cases = casesResult.data || [];

      const stats = {
        total_candidates: candidates.length,
        total_cases: cases.length,
        total_amount_at_risk: candidates.reduce((sum, c) => sum + c.total_amount_owed, 0),
        cases_by_status: cases.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        priority_breakdown: cases.reduce((acc, c) => {
          acc[c.priority] = (acc[c.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recent_activities: cases
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 10)
      };

      return stats;
    });
  }
}

export const legalManagementService = new LegalManagementService(supabase); 