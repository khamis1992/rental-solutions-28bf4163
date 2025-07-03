import { supabase } from '@/integrations/supabase'

export interface AutomationRule {
  id: string
  name: string
  description: string
  type: 'reminder' | 'status_update' | 'notification' | 'report' | 'maintenance'
  trigger: 'schedule' | 'event' | 'condition'
  schedule?: string // cron expression
  conditions?: Record<string, unknown>
  actions: AutomationAction[]
  isActive: boolean
  lastRun?: string
  nextRun?: string
  runCount: number
  errorCount: number
  created_at: string
  updated_at: string
}

export interface AutomationAction {
  type: 'send_whatsapp' | 'send_email' | 'update_status' | 'create_task' | 'generate_report'
  config: Record<string, unknown>
  order: number
}

export interface AutomationLog {
  id: string
  ruleId: string
  timestamp: string
  status: 'success' | 'failed' | 'partial'
  duration: number
  actions_executed: number
  errors: string[]
  results: Record<string, unknown>
}

export interface ReminderConfig {
  leaseExpiry: {
    daysBeforeExpiry: number[]
    includeWhatsApp: boolean
    includeEmail: boolean
    template: string
  }
  paymentDue: {
    daysBeforeDue: number[]
    daysAfterDue: number[]
    escalation: boolean
    template: string
  }
  maintenanceDue: {
    daysBeforeService: number[]
    mileageThreshold: number
    template: string
  }
}

export class AutomationService {
  private static instance: AutomationService
  private isRunning = false
  private intervalId?: number

  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService()
    }
    return AutomationService.instance
  }

  constructor() {
    this.startAutomationEngine()
  }

  private startAutomationEngine(): void {
    if (this.isRunning) return

    console.log('🤖 بدء تشغيل محرك الأتمتة...')
    this.isRunning = true

    // تشغيل المحرك كل دقيقة
    this.intervalId = window.setInterval(async () => {
      await this.executeScheduledRules()
    }, 60000)

    // تشغيل فوري للمراجعة
    this.executeScheduledRules()
  }

  public stopAutomationEngine(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    this.isRunning = false
    console.log('⏹️ تم إيقاف محرك الأتمتة')
  }

  private async executeScheduledRules(): Promise<void> {
    try {
      const { data: rules, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('is_active', true)
        .eq('trigger', 'schedule')

      if (error) {
        console.error('فشل جلب قواعد الأتمتة:', error.message)
        return
      }

      const currentTime = new Date()

      for (const rule of rules || []) {
        try {
          if (this.shouldExecuteRule(rule, currentTime)) {
            await this.executeRule(rule)
          }
        } catch (error) {
          console.error(`فشل تنفيذ قاعدة الأتمتة ${rule.name}:`, error)
          await this.logRuleExecution(rule.id, 'failed', 0, [String(error)])
        }
      }
    } catch (error) {
      console.error('خطأ في محرك الأتمتة:', error)
    }
  }

  private shouldExecuteRule(rule: Record<string, unknown>, currentTime: Date): boolean {
    if (!rule.schedule || typeof rule.schedule !== 'string') return false

    // تحليل تعبير cron المبسط
    const cronParts = rule.schedule.split(' ')
    if (cronParts.length !== 5) return false

    const [minute, hour, day, month, dayOfWeek] = cronParts
    const now = {
      minute: currentTime.getMinutes(),
      hour: currentTime.getHours(),
      day: currentTime.getDate(),
      month: currentTime.getMonth() + 1,
      dayOfWeek: currentTime.getDay()
    }

    // فحص كل جزء من تعبير cron
    return (
      this.matchesCronValue(minute, now.minute) &&
      this.matchesCronValue(hour, now.hour) &&
      this.matchesCronValue(day, now.day) &&
      this.matchesCronValue(month, now.month) &&
      this.matchesCronValue(dayOfWeek, now.dayOfWeek)
    )
  }

  private matchesCronValue(cronValue: string, actualValue: number): boolean {
    if (cronValue === '*') return true
    if (cronValue.includes('/')) {
      const [base, step] = cronValue.split('/')
      if (base === '*') {
        return actualValue % parseInt(step) === 0
      }
    }
    if (cronValue.includes(',')) {
      return cronValue.split(',').some(v => parseInt(v) === actualValue)
    }
    if (cronValue.includes('-')) {
      const [start, end] = cronValue.split('-').map(Number)
      return actualValue >= start && actualValue <= end
    }
    return parseInt(cronValue) === actualValue
  }

  private async executeRule(rule: Record<string, unknown>): Promise<void> {
    console.log(`🔄 تنفيذ قاعدة الأتمتة: ${rule.name}`)
    const startTime = Date.now()
    const results: Record<string, unknown>[] = []
    const errors: string[] = []
    let actionsExecuted = 0

    try {
      const actions = (rule.actions as AutomationAction[]) || []
      
      for (const action of actions.sort((a: AutomationAction, b: AutomationAction) => a.order - b.order)) {
        try {
          const result = await this.executeAction(action, rule)
          results.push(result)
          actionsExecuted++
        } catch (error) {
          const errorMsg = `فشل تنفيذ الإجراء ${action.type}: ${error}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      const status = errors.length === 0 ? 'success' : 
                    actionsExecuted > 0 ? 'partial' : 'failed'

      const duration = Date.now() - startTime

      await this.logRuleExecution(rule.id as string, status, actionsExecuted, errors, results)
      await this.updateRuleStats(rule.id as string, status)

      console.log(`✅ اكتمل تنفيذ قاعدة ${rule.name} - ${status}`)

    } catch (error) {
      const duration = Date.now() - startTime
      await this.logRuleExecution(rule.id as string, 'failed', actionsExecuted, [String(error)])
      await this.updateRuleStats(rule.id as string, 'failed')
      throw error
    }
  }

  private async executeAction(action: AutomationAction, rule: Record<string, unknown>): Promise<any> {
    switch (action.type) {
      case 'send_whatsapp':
        return await this.sendWhatsAppAction(action.config)
      case 'send_email':
        return await this.sendEmailAction(action.config)
      case 'update_status':
        return await this.updateStatusAction(action.config)
      case 'create_task':
        return await this.createTaskAction(action.config)
      case 'generate_report':
        return await this.generateReportAction(action.config)
      default:
        throw new Error(`نوع الإجراء غير مدعوم: ${action.type}`)
    }
  }

  private async sendWhatsAppAction(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log('📱 إرسال رسالة واتساب...')
    
    try {
      const { phone, template, variables } = config
      
      // جلب قالب الرسالة
      const { data: templateData, error } = await supabase
        .from('whatsapp_templates')
        .select('content')
        .eq('name', template)
        .single()

      if (error) throw error

      let message = templateData.content

      // استبدال المتغيرات
      if (variables && typeof variables === 'object') {
        Object.keys(variables).forEach(key => {
          message = message.replace(`{{${key}}}`, String((variables as Record<string, unknown>)[key]))
        })
      }

      // إرسال الرسالة (محاكاة)
      await supabase
        .from('whatsapp_messages')
        .insert({
          phone_number: phone,
          message: message,
          type: 'automated',
          status: 'sent',
          sent_at: new Date().toISOString()
        })

      return { success: true, phone, message }
    } catch (error) {
      throw new Error(`فشل إرسال واتساب: ${error}`)
    }
  }

  private async sendEmailAction(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log('📧 إرسال بريد إلكتروني...')
    
    try {
      const { email, subject, template, variables } = config
      
      // جلب قالب البريد
      let content = String(template)
      if (variables && typeof variables === 'object') {
        Object.keys(variables).forEach(key => {
          content = content.replace(`{{${key}}}`, String((variables as Record<string, unknown>)[key]))
        })
      }

      // حفظ الإشعار
      await supabase
        .from('notifications')
        .insert({
          type: 'email',
          recipient: email,
          subject: subject,
          content: content,
          sent_at: new Date().toISOString()
        })

      return { success: true, email, subject }
    } catch (error) {
      throw new Error(`فشل إرسال البريد الإلكتروني: ${error}`)
    }
  }

  private async updateStatusAction(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log('🔄 تحديث الحالة...')
    
    try {
      const { table, conditions, updates } = config
      
      let query = supabase.from(String(table)).update(updates as Record<string, unknown>)
      
      // تطبيق الشروط
      if (conditions && typeof conditions === 'object') {
        Object.keys(conditions).forEach(key => {
          const value = (conditions as Record<string, unknown>)[key]
          if (typeof value === 'object' && value !== null && 'operator' in value) {
            const operatorValue = value as { operator: string; value: unknown }
            switch (operatorValue.operator) {
              case 'eq':
                query = query.eq(key, operatorValue.value)
                break
              case 'lt':
                query = query.lt(key, operatorValue.value)
                break
              case 'gt':
                query = query.gt(key, operatorValue.value)
                break
              case 'lte':
                query = query.lte(key, operatorValue.value)
                break
              case 'gte':
                query = query.gte(key, operatorValue.value)
                break
            }
          } else {
            query = query.eq(key, value)
          }
        })
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, updatedRecords: data?.length || 0 }
    } catch (error) {
      throw new Error(`فشل تحديث الحالة: ${error}`)
    }
  }

  private async createTaskAction(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log('📝 إنشاء مهمة...')
    
    try {
      const { title, description, assignee, dueDate, priority } = config
      
      await supabase
        .from('tasks')
        .insert({
          title: String(title),
          description: String(description),
          assignee: String(assignee),
          due_date: String(dueDate),
          priority: String(priority) || 'medium',
          status: 'pending',
          created_at: new Date().toISOString()
        })

      return { success: true, title }
    } catch (error) {
      throw new Error(`فشل إنشاء المهمة: ${error}`)
    }
  }

  private async generateReportAction(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log('📊 إنشاء تقرير...')
    
    try {
      const { reportType, parameters, recipients } = config
      
      let reportData: Record<string, unknown> = {}
      
      switch (reportType) {
        case 'daily_summary':
          reportData = await this.generateDailySummaryReport()
          break
        case 'overdue_payments':
          reportData = await this.generateOverduePaymentsReport()
          break
        case 'expiring_leases':
          reportData = await this.generateExpiringLeasesReport()
          break
        case 'maintenance_due':
          reportData = await this.generateMaintenanceDueReport()
          break
        default:
          throw new Error(`نوع التقرير غير مدعوم: ${reportType}`)
      }

      // حفظ التقرير
      const { data: report, error } = await supabase
        .from('automated_reports')
        .insert({
          type: String(reportType),
          data: reportData,
          parameters: parameters as Record<string, unknown>,
          generated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // إرسال التقرير للمستلمين
      if (recipients && Array.isArray(recipients) && recipients.length > 0) {
        for (const recipient of recipients) {
          await this.sendEmailAction({
            email: recipient,
            subject: `تقرير تلقائي: ${reportType}`,
            template: `تم إنشاء تقرير ${reportType} التلقائي.\n\nيمكنك مراجعة التقرير في النظام.`,
            variables: {}
          })
        }
      }

      return { success: true, reportId: report.id, reportType }
    } catch (error) {
      throw new Error(`فشل إنشاء التقرير: ${error}`)
    }
  }

  private async generateDailySummaryReport(): Promise<Record<string, unknown>> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    const { data: newLeases, error: leasesError } = await supabase
      .from('leases')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    const totalPayments = payments?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) || 0
    const newLeasesCount = newLeases?.length || 0

    return {
      date: today,
      totalPayments,
      newLeasesCount,
      payments: payments || [],
      newLeases: newLeases || []
    }
  }

  private async generateOverduePaymentsReport(): Promise<Record<string, unknown>> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: overduePayments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today)

    const totalOverdueAmount = overduePayments?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) || 0

    return {
      totalOverdue: overduePayments?.length || 0,
      totalAmount: totalOverdueAmount,
      payments: overduePayments || []
    }
  }

  private async generateExpiringLeasesReport(): Promise<Record<string, unknown>> {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const { data: expiringLeases, error } = await supabase
      .from('leases')
      .select('*')
      .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .eq('status', 'active')

    return {
      total: expiringLeases?.length || 0,
      leases: expiringLeases || []
    }
  }

  private async generateMaintenanceDueReport(): Promise<Record<string, unknown>> {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')

    const maintenanceDue = vehicles?.filter((vehicle: { last_service_mileage?: number; mileage: number }) => {
      const mileageSinceService = vehicle.mileage - (vehicle.last_service_mileage || 0)
      return mileageSinceService >= 10000 // افتراض كل 10,000 كم
    }) || []

    return {
      total: maintenanceDue.length,
      vehicles: maintenanceDue
    }
  }

  private async logRuleExecution(
    ruleId: string, 
    status: string, 
    actionsExecuted: number, 
    errors: string[], 
    results?: any
  ): Promise<void> {
    try {
      await supabase
        .from('automation_logs')
        .insert({
          rule_id: ruleId,
          timestamp: new Date().toISOString(),
          status: status,
          actions_executed: actionsExecuted,
          errors: errors,
          results: results || {}
        })
    } catch (error) {
      console.error('فشل حفظ سجل الأتمتة:', error)
    }
  }

  private async updateRuleStats(ruleId: string, status: string): Promise<void> {
    try {
      const { data: rule, error: fetchError } = await supabase
        .from('automation_rules')
        .select('run_count, error_count')
        .eq('id', ruleId)
        .single()

      if (fetchError) throw fetchError

      const updates: any = {
        run_count: (rule.run_count || 0) + 1,
        last_run: new Date().toISOString()
      }

      if (status === 'failed') {
        updates.error_count = (rule.error_count || 0) + 1
      }

      await supabase
        .from('automation_rules')
        .update(updates)
        .eq('id', ruleId)
    } catch (error) {
      console.error('فشل تحديث إحصائيات القاعدة:', error)
    }
  }

  // واجهة برمجة التطبيقات العامة
  async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at' | 'runCount' | 'errorCount'>): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automation_rules')
      .insert({
        ...rule,
        run_count: 0,
        error_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAutomationRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automation_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAutomationRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getAutomationLogs(ruleId?: string, limit: number = 100): Promise<AutomationLog[]> {
    let query = supabase
      .from('automation_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (ruleId) {
      query = query.eq('rule_id', ruleId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async testAutomationRule(ruleId: string): Promise<{ success: boolean; message: string; results?: any }> {
    try {
      const { data: rule, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('id', ruleId)
        .single()

      if (error) throw error

      console.log(`🧪 اختبار قاعدة الأتمتة: ${rule.name}`)
      await this.executeRule(rule)

      return {
        success: true,
        message: 'تم تنفيذ القاعدة بنجاح'
      }
    } catch (error) {
      return {
        success: false,
        message: `فشل تنفيذ القاعدة: ${error}`
      }
    }
  }

  async getAutomationStatistics(): Promise<{
    totalRules: number
    activeRules: number
    totalExecutions: number
    successRate: number
    lastExecution: string | null
  }> {
    try {
      const [rulesResult, logsResult] = await Promise.all([
        supabase.from('automation_rules').select('*'),
        supabase.from('automation_logs').select('*').order('timestamp', { ascending: false }).limit(1000)
      ])

      const rules = rulesResult.data || []
      const logs = logsResult.data || []

      const activeRules = rules.filter((r: { is_active: boolean }) => r.is_active).length
      const successfulExecutions = logs.filter((l: { status: string }) => l.status === 'success').length
      const successRate = logs.length > 0 ? (successfulExecutions / logs.length) * 100 : 0

      return {
        totalRules: rules.length,
        activeRules,
        totalExecutions: logs.length,
        successRate,
        lastExecution: logs.length > 0 ? logs[0].timestamp : null
      }
    } catch (error) {
      console.error('فشل جلب إحصائيات الأتمتة:', error)
      return {
        totalRules: 0,
        activeRules: 0,
        totalExecutions: 0,
        successRate: 0,
        lastExecution: null
      }
    }
  }

  // قوالب الأتمتة الجاهزة
  async createDefaultAutomationRules(): Promise<void> {
    const defaultRules = [
      {
        name: 'تذكير انتهاء عقد الإيجار',
        description: 'إرسال تذكير قبل انتهاء عقد الإيجار بـ 30 و 15 و 7 أيام',
        type: 'reminder' as const,
        trigger: 'schedule' as const,
        schedule: '0 9 * * *', // يومياً في الساعة 9 صباحاً
        actions: [{
          type: 'send_whatsapp' as const,
          config: {
            template: 'lease_expiry_reminder',
            phone: '{{customer_phone}}',
            variables: {
              customer_name: '{{customer_name}}',
              expiry_date: '{{expiry_date}}',
              days_remaining: '{{days_remaining}}'
            }
          },
          order: 1
        }],
        isActive: true
      },
      {
        name: 'تذكير الدفع المستحق',
        description: 'إرسال تذكير بالمدفوعات المستحقة',
        type: 'reminder' as const,
        trigger: 'schedule' as const,
        schedule: '0 10 * * *', // يومياً في الساعة 10 صباحاً
        actions: [{
          type: 'send_whatsapp' as const,
          config: {
            template: 'payment_due_reminder',
            phone: '{{customer_phone}}',
            variables: {
              customer_name: '{{customer_name}}',
              amount: '{{amount}}',
              due_date: '{{due_date}}'
            }
          },
          order: 1
        }],
        isActive: true
      },
      {
        name: 'تقرير يومي للإدارة',
        description: 'إنشاء وإرسال تقرير يومي بالإحصائيات',
        type: 'report' as const,
        trigger: 'schedule' as const,
        schedule: '0 18 * * *', // يومياً في الساعة 6 مساء
        actions: [{
          type: 'generate_report' as const,
          config: {
            reportType: 'daily_summary',
            recipients: ['admin@company.com']
          },
          order: 1
        }],
        isActive: true
      },
      {
        name: 'تحديث حالة المركبات',
        description: 'تحديث حالة المركبات بناءً على انتهاء العقود',
        type: 'status_update' as const,
        trigger: 'schedule' as const,
        schedule: '0 1 * * *', // يومياً في الساعة 1 صباحاً
        actions: [{
          type: 'update_status' as const,
          config: {
            table: 'vehicles',
            conditions: {
              status: 'rented',
              lease_end_date: { operator: 'lt', value: new Date().toISOString() }
            },
            updates: {
              status: 'available'
            }
          },
          order: 1
        }],
        isActive: true
      }
    ]

    for (const rule of defaultRules) {
      try {
        await this.createAutomationRule(rule)
        console.log(`✅ تم إنشاء قاعدة الأتمتة: ${rule.name}`)
      } catch (error) {
        console.error(`❌ فشل إنشاء قاعدة الأتمتة ${rule.name}:`, error)
      }
    }
  }
} 