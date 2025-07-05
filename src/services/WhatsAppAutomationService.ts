/**
 * خدمة أتمتة رسائل الواتساب
 * تتحكم في إرسال الرسائل المجدولة بناءً على التواريخ المحددة
 * 
 * القوالب المدعومة:
 * 1. تذكير شهري (28 من كل شهر)
 * 2. غرامة تأخير (1 من كل شهر)
 * 3. إنذار نهائي (حسب الحاجة)
 * 4. إجراء قانوني (24 ساعة إنذار)
 * 5. تقرير المدير (1-10 من كل شهر)
 */

import { supabase } from '@/lib/supabase';
import { twilioWhatsAppService } from './TwilioWhatsAppService';

export interface AutomationRule {
  id: string;
  template_type: 'monthly_reminder' | 'delay_penalty' | 'final_warning' | 'legal_action' | 'manager_report';
  schedule_type: 'monthly' | 'daily' | 'custom';
  schedule_day?: number; // يوم الشهر (1-31)
  schedule_time?: string; // وقت الإرسال (HH:MM)
  is_active: boolean;
  target_audience: 'customers' | 'managers' | 'overdue_customers';
  created_at: string;
  updated_at: string;
}

export interface ScheduledMessage {
  id: string;
  customer_id?: string;
  manager_id?: string;
  template_type: string;
  scheduled_date: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  sent_at?: string;
  error_message?: string;
  message_id?: string;
}

export class WhatsAppAutomationService {
  
  /**
   * تحقق من القواعد المجدولة وإرسال الرسائل المطلوبة
   */
  async processScheduledMessages(): Promise<void> {
    try {
      console.log('🔄 بدء معالجة الرسائل المجدولة...');
      
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1;
      
      // تنفيذ القواعد بناءً على التاريخ الحالي
      if (currentDay === 28) {
        await this.sendMonthlyReminders();
      }
      
      if (currentDay === 1) {
        await this.sendDelayPenalties();
      }
      
      if (currentDay >= 1 && currentDay <= 10) {
        await this.sendManagerReports(currentDay);
      }
      
      // القواعد اليومية
      await this.sendFinalWarnings();
      await this.sendLegalActions();

    } catch (error) {
      console.error('خطأ في معالجة الرسائل المجدولة:', error);
    }
  }

  /**
   * إرسال تذكيرات شهرية للعملاء (28 من كل شهر)
   */
  private async sendMonthlyReminders(): Promise<void> {
    try {
      console.log('📅 إرسال التذكيرات الشهرية...');

      // جلب العملاء الذين لديهم دفعات قادمة
      const { data: payments, error } = await supabase
        .from('payment_schedules')
        .select(`
          *,
          leases!inner(
            customer_id,
            agreement_number,
            profiles!inner(full_name, phone)
          )
        `)
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString().split('T')[0])
        .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) {
        console.error('خطأ في جلب الدفعات المستحقة:', error);
        return;
      }

      for (const payment of payments || []) {
        const customer = (payment as any).leases?.profiles;
        if (customer?.phone) {
          await twilioWhatsAppService.sendMonthlyReminder(
            customer.phone,
            customer.full_name,
            payment.amount,
            payment.due_date,
            (payment as any).leases?.agreement_number,
            5 // افتراضي
          );
        }
      }

    } catch (error) {
      console.error('خطأ في إرسال التذكيرات الشهرية:', error);
    }
  }

  /**
   * إرسال غرامات التأخير (1 من كل شهر)
   */
  private async sendDelayPenalties(): Promise<void> {
    try {
      console.log('💰 إرسال غرامات التأخير...');

      // جلب العملاء الذين لديهم دفعات متأخرة
      const { data: overduePayments, error } = await supabase
        .from('payment_schedules')
        .select(`
          *,
          leases!inner(
            customer_id,
            agreement_number,
            profiles!inner(full_name, phone)
          )
        `)
        .eq('status', 'overdue')
        .lt('due_date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('خطأ في جلب الدفعات المتأخرة:', error);
        return;
      }

      for (const payment of overduePayments || []) {
        const customer = (payment as any).leases?.profiles;
        if (customer?.phone) {
          const daysOverdue = Math.floor((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24));
          const penaltyAmount = Math.round(payment.amount * 0.05); // 5% غرامة
          
          await twilioWhatsAppService.sendDelayPenalty(
            customer.phone,
            customer.full_name,
            payment.amount,
            penaltyAmount,
            daysOverdue,
            (payment as any).leases?.agreement_number,
            payment.amount + penaltyAmount
          );
        }
      }

    } catch (error) {
      console.error('خطأ في إرسال غرامات التأخير:', error);
    }
  }

  /**
   * إرسال تقارير يومية للمدير العام (أيام 1-10 من كل شهر)
   */
  private async sendManagerReports(currentDay: number): Promise<void> {
    try {
      console.log(`📊 إرسال تقرير المدير العام - اليوم ${currentDay}...`);

      // رقم وهاتف المدير (يمكن تخزينه في الإعدادات)
      const managerPhone = '+97450000000'; // يجب تحديث هذا من الإعدادات
      const managerName = 'المدير العام';

      // جمع إحصائيات اليوم
      const stats = await this.getTodayStats();

      await twilioWhatsAppService.sendManagerReport(
        managerPhone,
        managerName,
        new Date().toLocaleDateString('ar-QA'),
        stats.totalCollections,
        stats.overduePayments,
        stats.newContracts,
        stats.totalRevenue,
        stats.activeVehicles
      );

    } catch (error) {
      console.error('خطأ في إرسال تقرير المدير:', error);
    }
  }

  /**
   * إرسال إنذارات نهائية للعملاء المتأخرين بشدة
   */
  private async sendFinalWarnings(): Promise<void> {
    try {
      console.log('⚠️ إرسال الإنذارات النهائية...');

      const { data: severelyOverdue, error } = await supabase
        .from('payment_schedules')
        .select(`
          *,
          leases!inner(
            customer_id,
            agreement_number,
            profiles!inner(full_name, phone)
          )
        `)
        .eq('status', 'overdue')
        .lt('due_date', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // متأخر أكثر من 60 يوم

      if (error) {
        console.error('خطأ في جلب الدفعات المتأخرة بشدة:', error);
        return;
      }

      for (const payment of severelyOverdue || []) {
        const customer = (payment as any).leases?.profiles;
        if (customer?.phone) {
          const daysOverdue = Math.floor((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24));
          
          await twilioWhatsAppService.sendFinalWarning(
            customer.phone,
            customer.full_name,
            payment.amount,
            (payment as any).leases?.agreement_number,
            daysOverdue
          );
        }
      }

    } catch (error) {
      console.error('خطأ في إرسال الإنذارات النهائية:', error);
    }
  }

  /**
   * إرسال إنذارات الإجراء القانوني (24 ساعة)
   */
  private async sendLegalActions(): Promise<void> {
    try {
      console.log('⚖️ إرسال إنذارات الإجراء القانوني...');

      const { data: criticalOverdue, error } = await supabase
        .from('payment_schedules')
        .select(`
          *,
          leases!inner(
            customer_id,
            agreement_number,
            profiles!inner(full_name, phone),
            vehicles!inner(make, model, year, plate_number)
          )
        `)
        .eq('status', 'overdue')
        .lt('due_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // متأخر أكثر من 90 يوم

      if (error) {
        console.error('خطأ في جلب الدفعات الحرجة:', error);
        return;
      }

      for (const payment of criticalOverdue || []) {
        const customer = (payment as any).leases?.profiles;
        const vehicle = (payment as any).leases?.vehicles;
        if (customer?.phone) {
          const vehicleDetails = vehicle 
            ? `${vehicle.make} ${vehicle.model} ${vehicle.year} - لوحة ${vehicle.plate_number}`
            : 'المركبة المؤجرة';
          
          await twilioWhatsAppService.sendLegalAction(
            customer.phone,
            customer.full_name,
            payment.amount,
            (payment as any).leases?.agreement_number,
            vehicleDetails
          );
        }
      }

    } catch (error) {
      console.error('خطأ في إرسال إنذارات الإجراء القانوني:', error);
    }
  }

  /**
   * جلب إحصائيات اليوم للتقرير اليومي
   */
  private async getTodayStats(): Promise<{
    totalCollections: number;
    overduePayments: number;
    newContracts: number;
    totalRevenue: number;
    activeVehicles: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // إجمالي المحصلات اليوم
      const { data: collections } = await supabase
        .from('unified_payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('payment_date', today);

      // الدفعات المتأخرة
      const { data: overdue } = await supabase
        .from('payment_schedules')
        .select('id')
        .eq('status', 'overdue');

      // العقود الجديدة اليوم
      const { data: newContracts } = await supabase
        .from('leases')
        .select('id')
        .gte('created_at', today);

      // المركبات النشطة
      const { data: activeVehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('status', 'rented');

      const totalCollections = collections?.length || 0;
      const totalRevenue = collections?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      return {
        totalCollections,
        overduePayments: overdue?.length || 0,
        newContracts: newContracts?.length || 0,
        totalRevenue,
        activeVehicles: activeVehicles?.length || 0
      };

    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
      return {
        totalCollections: 0,
        overduePayments: 0,
        newContracts: 0,
        totalRevenue: 0,
        activeVehicles: 0
      };
    }
  }

  /**
   * إنشاء قاعدة أتمتة جديدة
   */
  async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>): Promise<AutomationRule | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_rules')
        .insert(rule)
        .select()
        .single();

      if (error) {
        console.error('خطأ في إنشاء قاعدة الأتمتة:', error);
        return null;
      }

      return data as AutomationRule;
    } catch (error) {
      console.error('خطأ في إنشاء قاعدة الأتمتة:', error);
      return null;
    }
  }

  /**
   * تحديث قاعدة أتمتة موجودة
   */
  async updateAutomationRule(id: string, updates: Partial<AutomationRule>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whatsapp_automation_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('خطأ في تحديث قاعدة الأتمتة:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('خطأ في تحديث قاعدة الأتمتة:', error);
      return false;
    }
  }

  /**
   * جلب جميع قواعد الأتمتة
   */
  async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب قواعد الأتمتة:', error);
        return [];
      }

      return data as AutomationRule[];
    } catch (error) {
      console.error('خطأ في جلب قواعد الأتمتة:', error);
      return [];
    }
  }
}

// تصدير instance واحد
export const whatsAppAutomationService = new WhatsAppAutomationService(); 