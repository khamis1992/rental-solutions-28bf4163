#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createWriteStream } from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const pipelineAsync = promisify(pipeline)

interface BackupConfig {
  supabaseUrl: string
  supabaseServiceKey: string
  backupPath: string
  retentionDays: number
  compression: boolean
  encryption: boolean
  notificationWebhook?: string
  s3Config?: {
    bucket: string
    region: string
    accessKeyId: string
    secretAccessKey: string
  }
}

interface BackupReport {
  timestamp: string
  type: 'full' | 'incremental' | 'schema-only' | 'data-only'
  status: 'success' | 'failed' | 'partial'
  duration: number
  size: number
  tables: string[]
  errors: string[]
  location: string
}

class AutomatedBackupSystem {
  private config: BackupConfig
  private supabase: any
  private backupReports: BackupReport[] = []

  constructor(config: BackupConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
  }

  async runFullBackup(): Promise<BackupReport> {
    console.log('🔄 بدء النسخ الاحتياطي الكامل...')
    const startTime = Date.now()
    const timestamp = new Date().toISOString()
    
    const report: BackupReport = {
      timestamp,
      type: 'full',
      status: 'failed',
      duration: 0,
      size: 0,
      tables: [],
      errors: [],
      location: ''
    }

    try {
      // إنشاء مجلد النسخ الاحتياطية
      const backupDir = path.join(this.config.backupPath, `backup_${timestamp.replace(/[:.]/g, '-')}`)
      fs.mkdirSync(backupDir, { recursive: true })

      // 1. نسخ احتياطي لقاعدة البيانات
      await this.backupDatabase(backupDir, report)
      
      // 2. نسخ احتياطي للملفات المرفوعة
      await this.backupStorageFiles(backupDir, report)
      
      // 3. نسخ احتياطي لإعدادات النظام
      await this.backupSystemConfig(backupDir, report)
      
      // 4. ضغط النسخة الاحتياطية
      if (this.config.compression) {
        await this.compressBackup(backupDir, report)
      }
      
      // 5. تشفير النسخة الاحتياطية
      if (this.config.encryption) {
        await this.encryptBackup(backupDir, report)
      }
      
      // 6. رفع للتخزين السحابي
      if (this.config.s3Config) {
        await this.uploadToS3(backupDir, report)
      }
      
      // 7. تنظيف النسخ القديمة
      await this.cleanOldBackups()
      
      report.status = 'success'
      report.duration = Date.now() - startTime
      report.location = backupDir
      
      console.log('✅ اكتمل النسخ الاحتياطي الكامل بنجاح!')
      
      // إرسال إشعار النجاح
      await this.sendNotification(report)
      
    } catch (error) {
      report.status = 'failed'
      report.errors.push(error instanceof Error ? error.message : String(error))
      report.duration = Date.now() - startTime
      
      console.error('❌ فشل النسخ الاحتياطي:', error)
      
      // إرسال إشعار الفشل
      await this.sendNotification(report)
    }

    this.backupReports.push(report)
    await this.saveBackupReport(report)
    
    return report
  }

  private async backupDatabase(backupDir: string, report: BackupReport): Promise<void> {
    console.log('📊 نسخ احتياطي لقاعدة البيانات...')
    
    try {
      // جلب قائمة الجداول
      const { data: tables, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .neq('table_type', 'VIEW')

      if (error) throw error

      const tableNames = tables.map((t: any) => t.table_name)
      report.tables = tableNames

      // نسخ احتياطي لكل جدول
      for (const tableName of tableNames) {
        await this.backupTable(tableName, backupDir, report)
      }

      // نسخ احتياطي للمخطط (Schema)
      await this.backupSchema(backupDir)

      // نسخ احتياطي للوظائف والمحفزات
      await this.backupFunctionsAndTriggers(backupDir)

    } catch (error) {
      report.errors.push(`Database backup failed: ${error}`)
      throw error
    }
  }

  private async backupTable(tableName: string, backupDir: string, report: BackupReport): Promise<void> {
    try {
      console.log(`📋 نسخ جدول: ${tableName}`)
      
      // جلب البيانات على دفعات لتجنب مشاكل الذاكرة
      let allData: any[] = []
      let from = 0
      const batchSize = 1000

      while (true) {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .range(from, from + batchSize - 1)

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error
        }

        if (!data || data.length === 0) break

        allData = allData.concat(data)
        from += batchSize

        if (data.length < batchSize) break
      }

      // حفظ البيانات في ملف JSON
      const tablePath = path.join(backupDir, 'data', `${tableName}.json`)
      fs.mkdirSync(path.dirname(tablePath), { recursive: true })
      
      fs.writeFileSync(tablePath, JSON.stringify(allData, null, 2), 'utf8')
      
      console.log(`✅ تم نسخ ${allData.length} سجل من جدول ${tableName}`)

    } catch (error) {
      report.errors.push(`Failed to backup table ${tableName}: ${error}`)
      console.error(`❌ فشل نسخ جدول ${tableName}:`, error)
    }
  }

  private async backupSchema(backupDir: string): Promise<void> {
    console.log('🏗️ نسخ مخطط قاعدة البيانات...')
    
    try {
      // جلب تعريفات الجداول
      const { data: columns, error } = await this.supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public')

      if (error) throw error

      const schemaPath = path.join(backupDir, 'schema', 'columns.json')
      fs.mkdirSync(path.dirname(schemaPath), { recursive: true })
      fs.writeFileSync(schemaPath, JSON.stringify(columns, null, 2))

      // جلب المفاتيح الخارجية
      const { data: constraints, error: constraintsError } = await this.supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_schema', 'public')

      if (!constraintsError) {
        const constraintsPath = path.join(backupDir, 'schema', 'constraints.json')
        fs.writeFileSync(constraintsPath, JSON.stringify(constraints, null, 2))
      }

      console.log('✅ تم نسخ مخطط قاعدة البيانات')

    } catch (error) {
      console.error('❌ فشل نسخ المخطط:', error)
      throw error
    }
  }

  private async backupFunctionsAndTriggers(backupDir: string): Promise<void> {
    console.log('⚙️ نسخ الوظائف والمحفزات...')
    
    try {
      // جلب الوظائف المخصصة
      const { data: functions, error } = await this.supabase
        .from('information_schema.routines')
        .select('*')
        .eq('routine_schema', 'public')

      if (!error && functions) {
        const functionsPath = path.join(backupDir, 'schema', 'functions.json')
        fs.writeFileSync(functionsPath, JSON.stringify(functions, null, 2))
      }

      console.log('✅ تم نسخ الوظائف والمحفزات')

    } catch (error) {
      console.error('❌ فشل نسخ الوظائف:', error)
    }
  }

  private async backupStorageFiles(backupDir: string, report: BackupReport): Promise<void> {
    console.log('📁 نسخ الملفات المرفوعة...')
    
    try {
      // جلب قائمة الـ buckets
      const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets()
      
      if (bucketsError) throw bucketsError

      for (const bucket of buckets) {
        await this.backupStorageBucket(bucket.name, backupDir, report)
      }

      console.log('✅ تم نسخ جميع الملفات المرفوعة')

    } catch (error) {
      report.errors.push(`Storage backup failed: ${error}`)
      console.error('❌ فشل نسخ الملفات:', error)
    }
  }

  private async backupStorageBucket(bucketName: string, backupDir: string, report: BackupReport): Promise<void> {
    try {
      console.log(`📦 نسخ bucket: ${bucketName}`)
      
      // جلب قائمة الملفات
      const { data: files, error } = await this.supabase.storage
        .from(bucketName)
        .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

      if (error) throw error

      const bucketDir = path.join(backupDir, 'storage', bucketName)
      fs.mkdirSync(bucketDir, { recursive: true })

      // نسخ كل ملف
      for (const file of files) {
        await this.backupStorageFile(bucketName, file.name, bucketDir, report)
      }

    } catch (error) {
      report.errors.push(`Failed to backup bucket ${bucketName}: ${error}`)
      console.error(`❌ فشل نسخ bucket ${bucketName}:`, error)
    }
  }

  private async backupStorageFile(bucketName: string, fileName: string, bucketDir: string, report: BackupReport): Promise<void> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .download(fileName)

      if (error) throw error

      const filePath = path.join(bucketDir, fileName)
      fs.mkdirSync(path.dirname(filePath), { recursive: true })

      const arrayBuffer = await data.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      fs.writeFileSync(filePath, buffer)

      report.size += buffer.length

    } catch (error) {
      report.errors.push(`Failed to backup file ${fileName}: ${error}`)
    }
  }

  private async backupSystemConfig(backupDir: string, report: BackupReport): Promise<void> {
    console.log('⚙️ نسخ إعدادات النظام...')
    
    try {
      const configDir = path.join(backupDir, 'config')
      fs.mkdirSync(configDir, { recursive: true })

      // نسخ ملفات التكوين
      const configFiles = [
        'vite.config.ts',
        'package.json',
        'tsconfig.json',
        '.env.example'
      ]

      for (const file of configFiles) {
        if (fs.existsSync(file)) {
          fs.copyFileSync(file, path.join(configDir, file))
        }
      }

      // نسخ migration files
      const migrationsDir = path.join('supabase', 'migrations')
      if (fs.existsSync(migrationsDir)) {
        const targetMigrationsDir = path.join(configDir, 'migrations')
        this.copyDirectory(migrationsDir, targetMigrationsDir)
      }

      console.log('✅ تم نسخ إعدادات النظام')

    } catch (error) {
      report.errors.push(`System config backup failed: ${error}`)
      console.error('❌ فشل نسخ الإعدادات:', error)
    }
  }

  private copyDirectory(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true })
    
    const entries = fs.readdirSync(src, { withFileTypes: true })
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  private async compressBackup(backupDir: string, report: BackupReport): Promise<void> {
    console.log('🗜️ ضغط النسخة الاحتياطية...')
    
    try {
      const tarFile = `${backupDir}.tar.gz`
      execSync(`tar -czf "${tarFile}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`)
      
      // حذف المجلد الأصلي
      execSync(`rm -rf "${backupDir}"`)
      
      const stats = fs.statSync(tarFile)
      report.size = stats.size
      report.location = tarFile
      
      console.log(`✅ تم ضغط النسخة الاحتياطية: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)

    } catch (error) {
      report.errors.push(`Compression failed: ${error}`)
      console.error('❌ فشل الضغط:', error)
    }
  }

  private async encryptBackup(backupDir: string, report: BackupReport): Promise<void> {
    console.log('🔒 تشفير النسخة الاحتياطية...')
    
    try {
      const sourceFile = this.config.compression ? `${backupDir}.tar.gz` : backupDir
      const encryptedFile = `${sourceFile}.enc`
      
      // استخدام OpenSSL للتشفير
      const password = process.env.BACKUP_ENCRYPTION_KEY || 'default-backup-key'
      execSync(`openssl enc -aes-256-cbc -salt -in "${sourceFile}" -out "${encryptedFile}" -k "${password}"`)
      
      // حذف الملف غير المشفر
      if (fs.existsSync(sourceFile)) {
        fs.unlinkSync(sourceFile)
      }
      
      report.location = encryptedFile
      
      console.log('✅ تم تشفير النسخة الاحتياطية')

    } catch (error) {
      report.errors.push(`Encryption failed: ${error}`)
      console.error('❌ فشل التشفير:', error)
    }
  }

  private async uploadToS3(backupDir: string, report: BackupReport): Promise<void> {
    console.log('☁️ رفع للتخزين السحابي...')
    
    try {
      if (!this.config.s3Config) return

      const AWS = require('aws-sdk')
      const s3 = new AWS.S3({
        accessKeyId: this.config.s3Config.accessKeyId,
        secretAccessKey: this.config.s3Config.secretAccessKey,
        region: this.config.s3Config.region
      })

      const filePath = report.location
      const fileName = path.basename(filePath)
      const fileContent = fs.readFileSync(filePath)

      const params = {
        Bucket: this.config.s3Config.bucket,
        Key: `backups/${fileName}`,
        Body: fileContent,
        StorageClass: 'STANDARD_IA', // تخزين منخفض التكلفة
        Metadata: {
          'backup-type': report.type,
          'backup-timestamp': report.timestamp,
          'system': 'rental-solutions'
        }
      }

      await s3.upload(params).promise()
      
      console.log('✅ تم رفع النسخة الاحتياطية للتخزين السحابي')

    } catch (error) {
      report.errors.push(`S3 upload failed: ${error}`)
      console.error('❌ فشل الرفع للتخزين السحابي:', error)
    }
  }

  private async cleanOldBackups(): Promise<void> {
    console.log('🧹 تنظيف النسخ القديمة...')
    
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

      const backupFiles = fs.readdirSync(this.config.backupPath)
        .filter(file => file.startsWith('backup_'))
        .map(file => ({
          name: file,
          path: path.join(this.config.backupPath, file),
          stats: fs.statSync(path.join(this.config.backupPath, file))
        }))
        .filter(file => file.stats.mtime < cutoffDate)

      for (const file of backupFiles) {
        if (file.stats.isDirectory()) {
          execSync(`rm -rf "${file.path}"`)
        } else {
          fs.unlinkSync(file.path)
        }
        console.log(`🗑️ تم حذف النسخة القديمة: ${file.name}`)
      }

      console.log(`✅ تم تنظيف ${backupFiles.length} نسخة قديمة`)

    } catch (error) {
      console.error('❌ فشل تنظيف النسخ القديمة:', error)
    }
  }

  private async sendNotification(report: BackupReport): Promise<void> {
    if (!this.config.notificationWebhook) return

    try {
      const statusEmoji = report.status === 'success' ? '✅' : '❌'
      const message = {
        text: `${statusEmoji} تقرير النسخ الاحتياطي`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*نظام إدارة تأجير السيارات - تقرير النسخ الاحتياطي*\n\n` +
                    `*الحالة:* ${report.status === 'success' ? 'نجح' : 'فشل'}\n` +
                    `*النوع:* ${report.type}\n` +
                    `*الوقت:* ${new Date(report.timestamp).toLocaleString('ar-QA')}\n` +
                    `*المدة:* ${(report.duration / 1000).toFixed(2)} ثانية\n` +
                    `*الحجم:* ${(report.size / 1024 / 1024).toFixed(2)} MB\n` +
                    `*الجداول:* ${report.tables.length}\n` +
                    `*الأخطاء:* ${report.errors.length}`
            }
          }
        ]
      }

      if (report.errors.length > 0) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*تفاصيل الأخطاء:*\n${report.errors.slice(0, 5).map(e => `• ${e}`).join('\n')}`
          }
        })
      }

      await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })

    } catch (error) {
      console.error('❌ فشل إرسال الإشعار:', error)
    }
  }

  private async saveBackupReport(report: BackupReport): Promise<void> {
    try {
      const reportsDir = path.join(this.config.backupPath, 'reports')
      fs.mkdirSync(reportsDir, { recursive: true })

      const reportFile = path.join(reportsDir, `report_${report.timestamp.replace(/[:.]/g, '-')}.json`)
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

    } catch (error) {
      console.error('❌ فشل حفظ تقرير النسخ الاحتياطي:', error)
    }
  }

  async runIncrementalBackup(): Promise<BackupReport> {
    console.log('🔄 بدء النسخ الاحتياطي التدريجي...')
    
    // نسخ احتياطي للبيانات المتغيرة فقط منذ آخر نسخة
    const lastBackupTime = this.getLastBackupTime()
    
    // إضافة منطق النسخ التدريجي هنا
    // يمكن تطبيقه بناءً على أعمدة updated_at في الجداول
    
    return this.runFullBackup() // مؤقتاً، سنقوم بالنسخ الكامل
  }

  private getLastBackupTime(): Date {
    // جلب وقت آخر نسخة احتياطية من التقارير
    try {
      const reportsDir = path.join(this.config.backupPath, 'reports')
      if (!fs.existsSync(reportsDir)) return new Date(0)

      const reportFiles = fs.readdirSync(reportsDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse()

      if (reportFiles.length === 0) return new Date(0)

      const lastReport = JSON.parse(fs.readFileSync(path.join(reportsDir, reportFiles[0]), 'utf8'))
      return new Date(lastReport.timestamp)

    } catch (error) {
      console.error('فشل جلب وقت آخر نسخة احتياطية:', error)
      return new Date(0)
    }
  }

  async getBackupStatistics(): Promise<{
    totalBackups: number
    successfulBackups: number
    failedBackups: number
    totalSize: number
    averageDuration: number
    lastBackup: BackupReport | null
  }> {
    const successful = this.backupReports.filter(r => r.status === 'success')
    const failed = this.backupReports.filter(r => r.status === 'failed')
    
    return {
      totalBackups: this.backupReports.length,
      successfulBackups: successful.length,
      failedBackups: failed.length,
      totalSize: this.backupReports.reduce((sum, r) => sum + r.size, 0),
      averageDuration: this.backupReports.length > 0 
        ? this.backupReports.reduce((sum, r) => sum + r.duration, 0) / this.backupReports.length 
        : 0,
      lastBackup: this.backupReports.length > 0 ? this.backupReports[this.backupReports.length - 1] : null
    }
  }
}

// تصدير النظام وإعداد التشغيل
export { AutomatedBackupSystem, BackupConfig, BackupReport }

// تشغيل النظام إذا تم استدعاؤه مباشرة
if (require.main === module) {
  const config: BackupConfig = {
    supabaseUrl: process.env.VITE_SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    backupPath: process.env.BACKUP_PATH || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    compression: process.env.BACKUP_COMPRESSION === 'true',
    encryption: process.env.BACKUP_ENCRYPTION === 'true',
    notificationWebhook: process.env.BACKUP_NOTIFICATION_WEBHOOK,
    s3Config: process.env.AWS_S3_BUCKET ? {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || 'me-south-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    } : undefined
  }

  const backupSystem = new AutomatedBackupSystem(config)
  
  // تشغيل النسخ الاحتياطي
  const backupType = process.argv[2] || 'full'
  
  if (backupType === 'full') {
    backupSystem.runFullBackup()
  } else if (backupType === 'incremental') {
    backupSystem.runIncrementalBackup()
  } else {
    console.log('استخدام: npm run backup [full|incremental]')
  }
} 