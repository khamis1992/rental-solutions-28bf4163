import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface BackupConfig {
  retentionDays: number
  enableCompression: boolean
  notificationWebhook?: string
}

interface BackupResult {
  success: boolean
  timestamp: string
  duration: number
  tablesBackedUp: number
  totalRecords: number
  size: number
  errors: string[]
}

interface BackupRequest {
  type: 'full' | 'incremental' | 'schema-only'
  config?: Partial<BackupConfig>
  tables?: string[]
}

const defaultConfig: BackupConfig = {
  retentionDays: 30,
  enableCompression: true
}

serve(async (req) => {
  try {
    // التحقق من طريقة الطلب
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        message: 'يجب استخدام POST request'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // التحقق من التوثيق
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'مطلوب توكن التوثيق'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // قراءة بيانات الطلب
    const requestData: BackupRequest = await req.json()
    const config = { ...defaultConfig, ...requestData.config }

    // إنشاء عميل Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`🔄 بدء النسخ الاحتياطي: ${requestData.type}`)
    const startTime = Date.now()

    const result: BackupResult = {
      success: false,
      timestamp: new Date().toISOString(),
      duration: 0,
      tablesBackedUp: 0,
      totalRecords: 0,
      size: 0,
      errors: []
    }

    try {
      switch (requestData.type) {
        case 'full':
          await performFullBackup(supabase, result, config)
          break
        case 'incremental':
          await performIncrementalBackup(supabase, result, config)
          break
        case 'schema-only':
          await performSchemaBackup(supabase, result, config)
          break
        default:
          throw new Error(`نوع النسخ الاحتياطي غير مدعوم: ${requestData.type}`)
      }

      result.success = true
      result.duration = Date.now() - startTime

      console.log(`✅ اكتمل النسخ الاحتياطي بنجاح في ${result.duration}ms`)

      // إرسال إشعار النجاح
      if (config.notificationWebhook) {
        await sendNotification(config.notificationWebhook, result, true)
      }

      // تنظيف النسخ القديمة
      await cleanupOldBackups(supabase, config.retentionDays)

    } catch (error) {
      result.success = false
      result.duration = Date.now() - startTime
      result.errors.push(error.message || String(error))

      console.error(`❌ فشل النسخ الاحتياطي:`, error)

      // إرسال إشعار الفشل
      if (config.notificationWebhook) {
        await sendNotification(config.notificationWebhook, result, false)
      }
    }

    // حفظ تقرير النسخ الاحتياطي
    await saveBackupReport(supabase, result)

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('خطأ في معالجة الطلب:', error)
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message || 'حدث خطأ غير متوقع'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function performFullBackup(
  supabase: any, 
  result: BackupResult, 
  config: BackupConfig
): Promise<void> {
  console.log('📊 بدء النسخ الاحتياطي الكامل...')

  // جلب قائمة جميع الجداول
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_all_tables')

  if (tablesError) {
    throw new Error(`فشل جلب قائمة الجداول: ${tablesError.message}`)
  }

  const tableNames = tables?.map((t: any) => t.table_name) || []
  console.log(`📋 تم العثور على ${tableNames.length} جدول`)

  // نسخ احتياطي لكل جدول
  for (const tableName of tableNames) {
    try {
      await backupTable(supabase, tableName, result)
      result.tablesBackedUp++
    } catch (error) {
      console.error(`❌ فشل نسخ جدول ${tableName}:`, error)
      result.errors.push(`فشل نسخ جدول ${tableName}: ${error.message}`)
    }
  }

  // نسخ احتياطي للمخطط
  await backupDatabaseSchema(supabase, result)

  // نسخ احتياطي للوظائف
  await backupFunctions(supabase, result)
}

async function performIncrementalBackup(
  supabase: any, 
  result: BackupResult, 
  config: BackupConfig
): Promise<void> {
  console.log('🔄 بدء النسخ الاحتياطي التدريجي...')

  // جلب وقت آخر نسخة احتياطية
  const { data: lastBackup } = await supabase
    .from('backup_reports')
    .select('timestamp')
    .eq('success', true)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  const lastBackupTime = lastBackup?.timestamp || new Date(0).toISOString()
  console.log(`📅 آخر نسخة احتياطية: ${lastBackupTime}`)

  // جلب الجداول التي تحتوي على عمود updated_at
  const tablesWithTimestamp = [
    'profiles', 'leases', 'payments', 'vehicles', 
    'maintenance_records', 'traffic_fines'
  ]

  for (const tableName of tablesWithTimestamp) {
    try {
      await backupTableIncremental(supabase, tableName, lastBackupTime, result)
      result.tablesBackedUp++
    } catch (error) {
      console.error(`❌ فشل النسخ التدريجي لجدول ${tableName}:`, error)
      result.errors.push(`فشل النسخ التدريجي لجدول ${tableName}: ${error.message}`)
    }
  }
}

async function performSchemaBackup(
  supabase: any, 
  result: BackupResult, 
  config: BackupConfig
): Promise<void> {
  console.log('🏗️ بدء نسخ المخطط فقط...')

  await backupDatabaseSchema(supabase, result)
  await backupFunctions(supabase, result)
  
  result.tablesBackedUp = 1 // Schema backup
}

async function backupTable(
  supabase: any, 
  tableName: string, 
  result: BackupResult
): Promise<void> {
  console.log(`📋 نسخ جدول: ${tableName}`)

  let allData: any[] = []
  let from = 0
  const batchSize = 1000

  // جلب البيانات على دفعات
  while (true) {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .range(from, from + batchSize - 1)

    if (error) {
      throw new Error(`فشل جلب بيانات جدول ${tableName}: ${error.message}`)
    }

    if (!data || data.length === 0) break

    allData = allData.concat(data)
    from += batchSize

    if (data.length < batchSize) break
  }

  // حفظ البيانات في جدول النسخ الاحتياطية
  const backupData = {
    table_name: tableName,
    backup_timestamp: new Date().toISOString(),
    record_count: allData.length,
    data: JSON.stringify(allData),
    data_size: JSON.stringify(allData).length
  }

  const { error: insertError } = await supabase
    .from('table_backups')
    .insert(backupData)

  if (insertError) {
    throw new Error(`فشل حفظ نسخة احتياطية لجدول ${tableName}: ${insertError.message}`)
  }

  result.totalRecords += allData.length
  result.size += backupData.data_size

  console.log(`✅ تم نسخ ${allData.length} سجل من جدول ${tableName}`)
}

async function backupTableIncremental(
  supabase: any, 
  tableName: string, 
  lastBackupTime: string, 
  result: BackupResult
): Promise<void> {
  console.log(`🔄 نسخ تدريجي لجدول: ${tableName}`)

  // جلب السجلات المحدثة فقط
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .gte('updated_at', lastBackupTime)

  if (error) {
    throw new Error(`فشل جلب البيانات المحدثة لجدول ${tableName}: ${error.message}`)
  }

  if (!data || data.length === 0) {
    console.log(`📭 لا توجد بيانات محدثة في جدول ${tableName}`)
    return
  }

  // حفظ البيانات المحدثة
  const backupData = {
    table_name: tableName,
    backup_timestamp: new Date().toISOString(),
    backup_type: 'incremental',
    record_count: data.length,
    data: JSON.stringify(data),
    data_size: JSON.stringify(data).length,
    filter_criteria: `updated_at >= '${lastBackupTime}'`
  }

  const { error: insertError } = await supabase
    .from('table_backups')
    .insert(backupData)

  if (insertError) {
    throw new Error(`فشل حفظ النسخة التدريجية لجدول ${tableName}: ${insertError.message}`)
  }

  result.totalRecords += data.length
  result.size += backupData.data_size

  console.log(`✅ تم نسخ ${data.length} سجل محدث من جدول ${tableName}`)
}

async function backupDatabaseSchema(
  supabase: any, 
  result: BackupResult
): Promise<void> {
  console.log('🏗️ نسخ مخطط قاعدة البيانات...')

  try {
    // جلب تعريفات الأعمدة
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')

    if (columnsError) {
      throw new Error(`فشل جلب تعريفات الأعمدة: ${columnsError.message}`)
    }

    // جلب القيود والمفاتيح
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_schema', 'public')

    if (constraintsError) {
      throw new Error(`فشل جلب القيود: ${constraintsError.message}`)
    }

    // حفظ مخطط قاعدة البيانات
    const schemaBackup = {
      backup_type: 'schema',
      backup_timestamp: new Date().toISOString(),
      schema_data: JSON.stringify({
        columns: columns || [],
        constraints: constraints || []
      }),
      data_size: JSON.stringify({ columns, constraints }).length
    }

    const { error: insertError } = await supabase
      .from('schema_backups')
      .insert(schemaBackup)

    if (insertError) {
      throw new Error(`فشل حفظ مخطط قاعدة البيانات: ${insertError.message}`)
    }

    result.size += schemaBackup.data_size
    console.log('✅ تم نسخ مخطط قاعدة البيانات')

  } catch (error) {
    console.error('❌ فشل نسخ المخطط:', error)
    result.errors.push(`فشل نسخ المخطط: ${error.message}`)
  }
}

async function backupFunctions(
  supabase: any, 
  result: BackupResult
): Promise<void> {
  console.log('⚙️ نسخ الوظائف المخصصة...')

  try {
    // جلب الوظائف المخصصة
    const { data: functions, error } = await supabase
      .rpc('get_custom_functions')

    if (error) {
      console.warn('تعذر جلب الوظائف المخصصة:', error.message)
      return
    }

    if (functions && functions.length > 0) {
      const functionsBackup = {
        backup_type: 'functions',
        backup_timestamp: new Date().toISOString(),
        functions_data: JSON.stringify(functions),
        data_size: JSON.stringify(functions).length
      }

      const { error: insertError } = await supabase
        .from('functions_backups')
        .insert(functionsBackup)

      if (insertError) {
        throw new Error(`فشل حفظ الوظائف: ${insertError.message}`)
      }

      result.size += functionsBackup.data_size
      console.log(`✅ تم نسخ ${functions.length} وظيفة مخصصة`)
    }

  } catch (error) {
    console.error('❌ فشل نسخ الوظائف:', error)
    result.errors.push(`فشل نسخ الوظائف: ${error.message}`)
  }
}

async function cleanupOldBackups(
  supabase: any, 
  retentionDays: number
): Promise<void> {
  console.log(`🧹 تنظيف النسخ الأقدم من ${retentionDays} يوم...`)

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
  const cutoffTimestamp = cutoffDate.toISOString()

  try {
    // حذف النسخ القديمة من الجداول
    const { error: tableBackupsError } = await supabase
      .from('table_backups')
      .delete()
      .lt('backup_timestamp', cutoffTimestamp)

    if (tableBackupsError) {
      console.error('فشل حذف نسخ الجداول القديمة:', tableBackupsError.message)
    }

    // حذف النسخ القديمة من المخططات
    const { error: schemaBackupsError } = await supabase
      .from('schema_backups')
      .delete()
      .lt('backup_timestamp', cutoffTimestamp)

    if (schemaBackupsError) {
      console.error('فشل حذف نسخ المخططات القديمة:', schemaBackupsError.message)
    }

    // حذف تقارير النسخ القديمة
    const { error: reportsError } = await supabase
      .from('backup_reports')
      .delete()
      .lt('timestamp', cutoffTimestamp)

    if (reportsError) {
      console.error('فشل حذف تقارير النسخ القديمة:', reportsError.message)
    }

    console.log('✅ تم تنظيف النسخ القديمة')

  } catch (error) {
    console.error('❌ فشل تنظيف النسخ القديمة:', error)
  }
}

async function saveBackupReport(
  supabase: any, 
  result: BackupResult
): Promise<void> {
  try {
    const { error } = await supabase
      .from('backup_reports')
      .insert({
        timestamp: result.timestamp,
        success: result.success,
        duration: result.duration,
        tables_backed_up: result.tablesBackedUp,
        total_records: result.totalRecords,
        backup_size: result.size,
        errors: result.errors
      })

    if (error) {
      console.error('فشل حفظ تقرير النسخ الاحتياطي:', error.message)
    }

  } catch (error) {
    console.error('خطأ في حفظ التقرير:', error)
  }
}

async function sendNotification(
  webhookUrl: string, 
  result: BackupResult, 
  success: boolean
): Promise<void> {
  try {
    const statusEmoji = success ? '✅' : '❌'
    const statusText = success ? 'نجح' : 'فشل'
    
    const message = {
      text: `${statusEmoji} تقرير النسخ الاحتياطي التلقائي`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*نظام إدارة تأجير السيارات*\n\n` +
                  `*الحالة:* ${statusText}\n` +
                  `*الوقت:* ${new Date(result.timestamp).toLocaleString('ar-QA')}\n` +
                  `*المدة:* ${(result.duration / 1000).toFixed(2)} ثانية\n` +
                  `*الجداول:* ${result.tablesBackedUp}\n` +
                  `*السجلات:* ${result.totalRecords.toLocaleString()}\n` +
                  `*الحجم:* ${(result.size / 1024 / 1024).toFixed(2)} MB`
          }
        }
      ]
    }

    if (result.errors.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*الأخطاء (${result.errors.length}):*\n${result.errors.slice(0, 3).map(e => `• ${e}`).join('\n')}`
        }
      })
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

  } catch (error) {
    console.error('فشل إرسال الإشعار:', error)
  }
} 