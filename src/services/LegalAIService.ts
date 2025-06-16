import { supabase } from '@/lib/supabase';

export interface CustomerContext {
  id: string;
  name: string;
  email: string;
  phone: string;
  pendingAmount: number;
  overduePayments: number;
  trafficFines: number;
}

export interface LegalLetterRequest {
  type: 'contract_cancellation' | 'payment_reminder' | 'traffic_fine_notice';
  customerId: string;
  contractId?: string;
  reason: string;
  language: 'ar' | 'en';
}

export interface GeneratedLetter {
  id: string;
  title: string;
  content: string;
  type: string;
  customerId: string;
  generatedAt: string;
}

export class LegalAIService {
  async gatherCustomerContext(customerId: string): Promise<CustomerContext> {
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    const { data: payments } = await supabase
      .from('car_installment_payments')
      .select('*')
      .eq('customer_id', customerId)
      .in('status', ['pending', 'overdue']);

    const { data: fines } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'unpaid');

    const pendingAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const overduePayments = payments?.filter(p => p.status === 'overdue').length || 0;
    const trafficFines = fines?.reduce((sum, f) => sum + f.amount, 0) || 0;

    return {
      id: customer.id,
      name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      pendingAmount,
      overduePayments,
      trafficFines
    };
  }

  async generateLegalLetter(request: LegalLetterRequest): Promise<GeneratedLetter> {
    const context = await this.gatherCustomerContext(request.customerId);
    const content = this.generateLetterContent(request, context);

    const letter: GeneratedLetter = {
      id: crypto.randomUUID(),
      title: this.generateTitle(request, context),
      content,
      type: request.type,
      customerId: request.customerId,
      generatedAt: new Date().toISOString()
    };

    this.saveLetter(letter);
    return letter;
  }

  private generateLetterContent(request: LegalLetterRequest, context: CustomerContext): string {
    if (request.type === 'contract_cancellation' && request.language === 'ar') {
      return this.generateCancellationLetterAr(request, context);
    }
    return 'Letter content generated';
  }

  private generateCancellationLetterAr(request: LegalLetterRequest, context: CustomerContext): string {
    return `بسم الله الرحمن الرحيم

السيد/السيدة: ${context.name}

الموضوع: إشعار بإلغاء عقد الإيجار

تحية طيبة وبعد،

نشير إلى العقد المبرم بيننا بخصوص تأجير المركبة.

نظراً للأسباب التالية:
${this.generateReasons(context)}

وعليه، ووفقاً للقانون المدني القطري رقم 22 لسنة 2004، المادة 648، نبلغكم بإلغاء العقد.

التفاصيل المالية:
• المبلغ المستحق: ${context.pendingAmount.toLocaleString()} ريال قطري
• الأقساط المتأخرة: ${context.overduePayments}
• المخالفات المرورية: ${context.trafficFines.toLocaleString()} ريال قطري

المطلوب تسديد المبالغ خلال 7 أيام من تاريخ هذا الإشعار.

مع فائق الاحترام،
شركة حلول الإيجار
التاريخ: ${new Date().toLocaleDateString('ar-QA')}`;
  }

  private generateReasons(context: CustomerContext): string {
    const reasons = [];
    if (context.pendingAmount > 0) {
      reasons.push(`• مستحقات مالية متأخرة: ${context.pendingAmount.toLocaleString()} ريال`);
    }
    if (context.trafficFines > 0) {
      reasons.push(`• مخالفات مرورية غير مسددة: ${context.trafficFines.toLocaleString()} ريال`);
    }
    return reasons.join('\n');
  }

  private generateTitle(request: LegalLetterRequest, context: CustomerContext): string {
    if (request.language === 'ar') {
      return `إشعار ${request.type === 'contract_cancellation' ? 'إلغاء عقد' : 'قانوني'} - ${context.name}`;
    }
    return `Legal Notice - ${context.name}`;
  }

  private saveLetter(letter: GeneratedLetter): void {
    const stored = localStorage.getItem('legal_letters') || '[]';
    const letters = JSON.parse(stored);
    letters.push(letter);
    localStorage.setItem('legal_letters', JSON.stringify(letters));
  }

  async getLetterHistory(): Promise<GeneratedLetter[]> {
    const stored = localStorage.getItem('legal_letters') || '[]';
    return JSON.parse(stored);
  }
}

export const legalAIService = new LegalAIService(); 