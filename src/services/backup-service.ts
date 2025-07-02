import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface BackupConfig {
  environment: 'development' | 'staging' | 'production';
  region: string;
  s3BucketName: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  backupInterval?: number;
  retentionDays?: number;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  size?: number;
  duration?: number;
  error?: string;
}

export class BackupService {
  private s3Client: S3Client;
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: config.sessionToken || process.env.AWS_SESSION_TOKEN,
      },
    });
  }

  async createBackup(data: any, backupName: string = `backup-${Date.now()}.json`): Promise<BackupResult> {
    try {
      const jsonData = JSON.stringify(data);
      const buffer = Buffer.from(jsonData);
      const bucketParams = {
        Bucket: this.config.s3BucketName,
        Key: backupName,
        Body: buffer,
      };
      const command = new PutObjectCommand(bucketParams);
      const result = await this.s3Client.send(command);

      if (result.$metadata.httpStatusCode !== 200) {
        console.error("Backup failed:", result);
        return { success: false, error: 'Backup failed to upload to S3' };
      }

      return { success: true, backupId: backupName, size: buffer.length };
    } catch (error: any) {
      console.error("Error creating backup:", error);
      return { success: false, error: error.message };
    }
  }

  async restoreBackup(backupId: string): Promise<BackupResult> {
    try {
      const bucketParams = {
        Bucket: this.config.s3BucketName,
        Key: backupId,
      };
      const command = new GetObjectCommand(bucketParams);
      const result = await this.s3Client.send(command);

      if (!result.Body) {
        return { success: false, error: 'Backup not found' };
      }

      const bodyContents = await result.Body.transformToString();
      const data = JSON.parse(bodyContents);

      return { success: true, backupId: backupId, size: bodyContents.length, data: data };
    } catch (error: any) {
      console.error("Error restoring backup:", error);
      return { success: false, error: error.message };
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const bucketParams = {
        Bucket: this.config.s3BucketName,
      };
      const command = new ListObjectsV2Command(bucketParams);
      const result = await this.s3Client.send(command);
      const backupFiles = result.Contents?.map(item => item.Key || '').filter(key => key !== '') || [];
      return backupFiles;
    } catch (error: any) {
      console.error("Error listing backups:", error);
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<BackupResult> {
    try {
      const bucketParams = {
        Bucket: this.config.s3BucketName,
        Key: backupId,
      };
      const command = new DeleteObjectCommand(bucketParams);
      await this.s3Client.send(command);

      return { success: true, backupId: backupId };
    } catch (error: any) {
      console.error("Error deleting backup:", error);
      return { success: false, error: error.message };
    }
  }

  async generatePresignedUrl(backupId: string, expirationInSeconds: number = 3600): Promise<string | null> {
    try {
      const bucketParams = {
        Bucket: this.config.s3BucketName,
        Key: backupId,
      };
      const command = new GetObjectCommand(bucketParams);
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: expirationInSeconds });
      return url;
    } catch (error: any) {
      console.error("Error generating presigned URL:", error);
      return null;
    }
  }

  async scheduleAutomatedBackups(data: any) {
    if (!this.config.backupInterval) {
      console.warn('Automated backups are disabled. Set backupInterval in config to enable.');
      return;
    }

    setInterval(async () => {
      const timestamp = new Date().toISOString();
      const backupName = `auto-backup-${timestamp}.json`;
      const result = await this.createBackup(data, backupName);

      if (result.success) {
        console.log(`Automated backup created: ${backupName}`);
        if (this.config.retentionDays) {
          this.enforceRetentionPolicy();
        }
      } else {
        console.error(`Automated backup failed: ${result.error}`);
      }
    }, this.config.backupInterval);
  }

  private async enforceRetentionPolicy() {
    const retentionDays = this.config.retentionDays || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const backups = await this.listBackups();
    for (const backup of backups) {
      if (backup.startsWith('auto-backup-')) {
        const timestamp = backup.substring('auto-backup-'.length, backup.length - '.json'.length);
        const backupDate = new Date(timestamp);
        if (backupDate < cutoffDate) {
          const deleteResult = await this.deleteBackup(backup);
          if (deleteResult.success) {
            console.log(`Deleted expired backup: ${backup}`);
          } else {
            console.error(`Failed to delete expired backup ${backup}: ${deleteResult.error}`);
          }
        }
      }
    }
  }
}

const backupConfig: BackupConfig = {
  environment: 'development',
  region: 'us-east-1',
  s3BucketName: process.env.S3_BUCKET_NAME || 'default-backup-bucket',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  backupInterval: undefined,
  retentionDays: undefined,
};

export const backupService = new BackupService(backupConfig);
