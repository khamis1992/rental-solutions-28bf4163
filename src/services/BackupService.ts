import { supabase } from '@/integrations/supabase'

export interface BackupConfig {
  type: 'full' | 'incremental' | 'schema-only'
  tables?: string[]
  retentionDays: number
  compression: boolean
  notificationEmail?: string
}

export interface BackupResult {
  id: string
  timestamp: string
  type: string
  status: 'success' | 'failed' | 'in_progress'
  duration: number
  tablesCount: number
  recordsCount: number
  size: number
  errors: string[]
  downloadUrl?: string
}

export class BackupService {
  private static instance: BackupService
  
  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  async createBackup(config: BackupConfig): Promise<BackupResult> {
    console.log('🔄 بدء عملية النسخ الاحتياطي...')
    
    const backupId = this.generateBackupId()
    const startTime = Date.now()
    
    const result: BackupResult = {
      id: backupId,
      timestamp: new Date().toISOString(),
      type: config.type,
      status: 'in_progress',
      duration: 0,
      tablesCount: 0,
      recordsCount: 0,
      size: 0,
      errors: []
    }

    try {
      // حفظ حالة البداية
      await this.saveBackupStatus(result)

      switch (config.type) {
        case 'full':
          await this.performFullBackup(result, config)
          break
        case 'incremental':
          await this.performIncrementalBackup(result, config)
          break
        case 'schema-only':
          await this.performSchemaBackup(result, config)
          break
      }

      result.status = 'success'
      result.duration = Date.now() - startTime
      
      console.log(`✅ اكتمل النسخ الاحتياطي بنجاح في ${result.duration}ms`)

      // إنشاء رابط تحميل
      result.downloadUrl = await this.generateDownloadUrl(backupId)

      // تنظيف النسخ القديمة
      await this.cleanupOldBackups(config.retentionDays)

      // إرسال إشعار النجاح
      if (config.notificationEmail) {
        await this.sendNotificationEmail(config.notificationEmail, result, true)
      }

    } catch (error) {
      result.status = 'failed'
      result.duration = Date.now() - startTime
      result.errors.push(error instanceof Error ? error.message : String(error))
      
      console.error('❌ فشل النسخ الاحتياطي:', error)

      // إرسال إشعار الفشل
      if (config.notificationEmail) {
        await this.sendNotificationEmail(config.notificationEmail, result, false)
      }
    }

    // حفظ النتيجة النهائية
    await this.saveBackupStatus(result)
    
    return result
  }

  private async performFullBackup(result: BackupResult, config: BackupConfig): Promise<void> {
    console.log('📊 بدء النسخ الاحتياطي الكامل...')

    // جلب قائمة جميع الجداول
    const tables = config.tables || await this.getAllTables()
    result.tablesCount = tables.length

    const backupData: Record<string, Record<string, unknown>[]> = {}

    // نسخ احتياطي لكل جدول
    for (const tableName of tables) {
      try {
        const tableData = await this.backupTable(tableName)
        backupData[tableName] = tableData
        result.recordsCount += tableData.length
        
        console.log(`✅ تم نسخ جدول ${tableName}: ${tableData.length} سجل`)
      } catch (error) {
        const errorMsg = `فشل نسخ جدول ${tableName}: ${error}`
        result.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

    // حفظ النسخة الاحتياطية
    await this.saveBackupData(result.id, backupData, 'full')
    result.size = JSON.stringify(backupData).length
  }

  private async performIncrementalBackup(result: BackupResult, config: BackupConfig): Promise<void> {
    console.log('🔄 بدء النسخ الاحتياطي التدريجي...')

    // جلب وقت آخر نسخة احتياطية
    const lastBackupTime = await this.getLastBackupTime()
    console.log(`📅 آخر نسخة احتياطية: ${lastBackupTime}`)

    // الجداول التي تدعم النسخ التدريجي (لها عمود updated_at)
    const incrementalTables = [
      'profiles', 'leases', 'payments', 'vehicles',
      'maintenance_records', 'traffic_fines', 'whatsapp_messages'
    ]

    const tables = config.tables || incrementalTables
    result.tablesCount = tables.length

    const backupData: Record<string, Record<string, unknown>[]> = {}

    for (const tableName of tables) {
      try {
        const tableData = await this.backupTableIncremental(tableName, lastBackupTime)
        if (tableData.length > 0) {
          backupData[tableName] = tableData
          result.recordsCount += tableData.length
          console.log(`✅ تم نسخ ${tableData.length} سجل محدث من جدول ${tableName}`)
        } else {
          console.log(`📭 لا توجد تحديثات في جدول ${tableName}`)
        }
      } catch (error) {
        const errorMsg = `فشل النسخ التدريجي لجدول ${tableName}: ${error}`
        result.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

    // حفظ النسخة الاحتياطية
    await this.saveBackupData(result.id, backupData, 'incremental')
    result.size = JSON.stringify(backupData).length
  }

  private async performSchemaBackup(result: BackupResult, config: BackupConfig): Promise<void> {
    console.log('🏗️ بدء نسخ مخطط قاعدة البيانات...')

    try {
      const schemaData = await this.getSchemaDefinition()
      
      await this.saveBackupData(result.id, { schema: schemaData }, 'schema')
      
      result.tablesCount = 1
      result.recordsCount = 0
      result.size = JSON.stringify(schemaData).length
      
      console.log('✅ تم نسخ مخطط قاعدة البيانات')
    } catch (error) {
      throw new Error(`فشل نسخ المخطط: ${error}`)
    }
  }

  private async getAllTables(): Promise<string[]> {
    // قائمة الجداول الرئيسية في النظام
    return [
      'profiles',
      'leases', 
      'payments',
      'vehicles',
      'maintenance_records',
      'traffic_fines',
      'whatsapp_messages',
      'whatsapp_templates',
      'system_logs',
      'performance_metrics'
    ]
  }

  private async backupTable(tableName: string): Promise<any[]> {
    let allData: any[] = []
    let from = 0
    const batchSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, from + batchSize - 1)

      if (error) {
        throw new Error(`فشل جلب بيانات جدول ${tableName}: ${error.message}`)
      }

      if (!data || data.length === 0) break

      allData = allData.concat(data)
      from += batchSize

      if (data.length < batchSize) break
    }

    return allData
  }

  private async backupTableIncremental(tableName: string, lastBackupTime: string): Promise<any[]> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .gte('updated_at', lastBackupTime)

    if (error) {
      throw new Error(`فشل جلب البيانات المحدثة لجدول ${tableName}: ${error.message}`)
    }

    return data || []
  }

  private async getSchemaDefinition(): Promise<any> {
    // محاولة جلب تعريف المخطط من information_schema
    try {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public')

      if (error) {
        throw error
      }

      return { columns: columns || [] }
    } catch (error) {
      // في حالة عدم توفر information_schema، نستخدم تعريف ثابت
      return {
        note: 'Schema definition not available through information_schema',
        timestamp: new Date().toISOString()
      }
    }
  }

  private async saveBackupData(backupId: string, data: any, type: string): Promise<void> {
    try {
      // محاولة حفظ النسخة الاحتياطية في Storage
      const fileName = `backup_${backupId}_${type}.json`
      const fileContent = JSON.stringify(data, null, 2)
      
      const { error } = await supabase.storage
        .from('backups')
        .upload(fileName, fileContent, {
          contentType: 'application/json',
          upsert: true
        })

      if (error) {
        console.error('فشل حفظ النسخة في Storage:', error.message)
        
        // في حالة فشل Storage، نحفظ في جدول backup_data
        await supabase
          .from('backup_data')
          .insert({
            backup_id: backupId,
            data: data,
            size: fileContent.length,
            created_at: new Date().toISOString()
          })
      }
    } catch (error) {
      console.error('فشل حفظ النسخة الاحتياطية:', error)
      throw error
    }
  }

  private async saveBackupStatus(result: BackupResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('backup_reports')
        .upsert({
          id: result.id,
          timestamp: result.timestamp,
          type: result.type,
          status: result.status,
          duration: result.duration,
          tables_count: result.tablesCount,
          records_count: result.recordsCount,
          size: result.size,
          errors: result.errors,
          download_url: result.downloadUrl
        })

      if (error) {
        console.error('فشل حفظ حالة النسخ الاحتياطي:', error.message)
      }
    } catch (error) {
      console.error('خطأ في حفظ الحالة:', error)
    }
  }

  private async getLastBackupTime(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('backup_reports')
        .select('timestamp')
        .eq('status', 'success')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        // إذا لم توجد نسخة سابقة، نبدأ من بداية العام الحالي
        const currentYear = new Date().getFullYear()
        return new Date(currentYear, 0, 1).toISOString()
      }

      return data.timestamp
    } catch (error) {
      console.error('فشل جلب وقت آخر نسخة احتياطية:', error)
      return new Date(0).toISOString()
    }
  }

  private async cleanupOldBackups(retentionDays: number): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
      const cutoffTimestamp = cutoffDate.toISOString()

      // حذف التقارير القديمة
      const { error: reportsError } = await supabase
        .from('backup_reports')
        .delete()
        .lt('timestamp', cutoffTimestamp)

      if (reportsError) {
        console.error('فشل حذف تقارير النسخ القديمة:', reportsError.message)
      }

      // حذف بيانات النسخ القديمة
      const { error: dataError } = await supabase
        .from('backup_data')
        .delete()
        .lt('created_at', cutoffTimestamp)

      if (dataError) {
        console.error('فشل حذف بيانات النسخ القديمة:', dataError.message)
      }

      // حذف ملفات النسخ من Storage
      const { data: files, error: listError } = await supabase.storage
        .from('backups')
        .list()

      if (!listError && files) {
        const oldFiles = files.filter((file: { created_at?: string; updated_at?: string; name: string }) => {
          const fileDate = new Date(file.created_at || file.updated_at || '')
          return fileDate < cutoffDate
        })

        if (oldFiles.length > 0) {
          const filePaths = oldFiles.map((file: { name: string }) => file.name)
          const { error: deleteError } = await supabase.storage
            .from('backups')
            .remove(filePaths)

          if (deleteError) {
            console.error('فشل حذف ملفات النسخ القديمة:', deleteError.message)
          } else {
            console.log(`✅ تم حذف ${oldFiles.length} ملف نسخ قديم`)
          }
        }
      }

    } catch (error) {
      console.error('فشل تنظيف النسخ القديمة:', error)
    }
  }

  private async generateDownloadUrl(backupId: string): Promise<string> {
    try {
      const fileName = `backup_${backupId}_full.json`
      
      const { data, error } = await supabase.storage
        .from('backups')
        .createSignedUrl(fileName, 3600) // صالح لساعة واحدة

      if (error) {
        throw error
      }

      return data.signedUrl
    } catch (error) {
      console.error('فشل إنشاء رابط التحميل:', error)
      return ''
    }
  }

  private async sendNotificationEmail(email: string, result: BackupResult, success: boolean): Promise<void> {
    try {
      const statusText = success ? 'نجح' : 'فشل'
      const statusEmoji = success ? '✅' : '❌'
      
      // يمكن تطبيق إرسال البريد الإلكتروني هنا
      // باستخدام خدمة مثل SendGrid أو AWS SES
      
      console.log(`📧 إشعار البريد الإلكتروني: ${statusEmoji} ${statusText}`)
      
      // مؤقتاً، نسجل الإشعار فقط
      await supabase
        .from('notifications')
        .insert({
          type: 'backup_notification',
          recipient: email,
          subject: `${statusEmoji} تقرير النسخ الاحتياطي - ${statusText}`,
          content: `تم ${statusText} النسخ الاحتياطي في ${new Date(result.timestamp).toLocaleString('ar-QA')}`,
          sent_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('فشل إرسال إشعار البريد الإلكتروني:', error)
    }
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  async getBackupHistory(limit: number = 50): Promise<BackupResult[]> {
    try {
      const { data, error } = await supabase
        .from('backup_reports')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data.map((row: Record<string, unknown>) => ({
        id: row.id,
        timestamp: row.timestamp,
        type: row.type,
        status: row.status,
        duration: row.duration,
        tablesCount: row.tables_count,
        recordsCount: row.records_count,
        size: row.size,
        errors: row.errors || [],
        downloadUrl: row.download_url
      }))
    } catch (error) {
      console.error('فشل جلب تاريخ النسخ الاحتياطية:', error)
      return []
    }
  }

  async getBackupStatistics(): Promise<{
    totalBackups: number
    successfulBackups: number
    failedBackups: number
    totalSize: number
    averageDuration: number
    lastBackup: BackupResult | null
  }> {
    try {
      const { data, error } = await supabase
        .from('backup_reports')
        .select('status, size, duration, timestamp')
        .order('timestamp', { ascending: false })

      if (error) {
        throw error
      }

      const successful = data.filter((b: { status: string }) => b.status === 'success')
      const failed = data.filter((b: { status: string }) => b.status === 'failed')

      return {
        totalBackups: data.length,
        successfulBackups: successful.length,
        failedBackups: failed.length,
        totalSize: data.reduce((sum: number, b: { size?: number }) => sum + (b.size || 0), 0),
        averageDuration: data.length > 0 
          ? data.reduce((sum: number, b: { duration?: number }) => sum + (b.duration || 0), 0) / data.length 
          : 0,
        lastBackup: data.length > 0 ? data[0] as BackupResult : null
      }
    } catch (error) {
      console.error('فشل جلب إحصائيات النسخ الاحتياطية:', error)
      return {
        totalBackups: 0,
        successfulBackups: 0,
        failedBackups: 0,
        totalSize: 0,
        averageDuration: 0,
        lastBackup: null
      }
    }
  }

  async restoreFromBackup(backupId: string, options: {
    tables?: string[]
    confirmRestore: boolean
  }): Promise<{ success: boolean; message: string; restoredTables: string[] }> {
    if (!options.confirmRestore) {
      throw new Error('يجب تأكيد عملية الاستعادة')
    }

    console.log(`🔄 بدء استعادة البيانات من النسخة الاحتياطية: ${backupId}`)

    try {
      // جلب بيانات النسخة الاحتياطية
      const { data: backupData, error } = await supabase
        .from('backup_data')
        .select('data')
        .eq('backup_id', backupId)
        .single()

      if (error || !backupData) {
        throw new Error('لم يتم العثور على النسخة الاحتياطية')
      }

      const data = backupData.data
      const tablesToRestore = options.tables || Object.keys(data)
      const restoredTables: string[] = []

      for (const tableName of tablesToRestore) {
        if (data[tableName] && Array.isArray(data[tableName])) {
          try {
            // حذف البيانات الحالية (اختياري، يحتاج تأكيد إضافي)
            // await supabase.from(tableName).delete().neq('id', '')

            // إدراج البيانات المستعادة
            const { error: insertError } = await supabase
              .from(tableName)
              .upsert(data[tableName])

            if (insertError) {
              throw insertError
            }

            restoredTables.push(tableName)
            console.log(`✅ تم استعادة جدول ${tableName}: ${data[tableName].length} سجل`)
          } catch (error) {
            console.error(`❌ فشل استعادة جدول ${tableName}:`, error)
          }
        }
      }

      const successMessage = `تم استعادة ${restoredTables.length} من ${tablesToRestore.length} جدول بنجاح`
      console.log(`✅ ${successMessage}`)

      return {
        success: true,
        message: successMessage,
        restoredTables
      }

    } catch (error) {
      const errorMessage = `فشل استعادة البيانات: ${error}`
      console.error(`❌ ${errorMessage}`)
      
      return {
        success: false,
        message: errorMessage,
        restoredTables: []
      }
    }
  }
} 