/**
 * Backup Service (SQLite simplified version)
 * خدمة النسخ الاحتياطي - نسخة مبسطة لـ SQLite
 *
 * Handles manual backups by copying the SQLite database file
 * to the db/backups/ directory with timestamp.
 */

import fs from 'fs/promises';
import path from 'path';

// ============================================
// Types
// ============================================

export interface BackupResult {
  success: boolean;
  backupId: string;
  timestamp: Date;
  size: number;
  duration: number;
  filename: string;
  error?: string;
}

export interface BackupInfo {
  id: string;
  filename: string;
  timestamp: Date;
  size: number;
  status: 'completed' | 'failed';
}

// ============================================
// Backup Service Class
// ============================================

class BackupService {
  private dbPath: string;
  private backupDir: string;

  constructor() {
    // Path to the SQLite database file
    this.dbPath = path.join(process.cwd(), 'db', 'custom.db');
    // Directory where backups are stored
    this.backupDir = path.join(process.cwd(), 'db', 'backups');
  }

  /**
   * Ensure the backup directory exists
   */
  private async ensureBackupDir(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  /**
   * Generate a backup filename with timestamp
   */
  private generateFilename(): string {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19);
    return `blueprint_backup_${dateStr}.db`;
  }

  /**
   * Generate a backup ID from filename
   */
  private generateBackupId(filename: string): string {
    return filename.replace('.db', '').replace('blueprint_backup_', '');
  }

  /**
   * Create a database backup by copying the SQLite file
   */
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date();
    const filename = this.generateFilename();
    const backupId = this.generateBackupId(filename);

    try {
      // Ensure backup directory exists
      await this.ensureBackupDir();

      // Check if source database exists
      try {
        await fs.access(this.dbPath);
      } catch {
        return {
          success: false,
          backupId,
          timestamp,
          size: 0,
          duration: Date.now() - startTime,
          filename,
          error: 'Database file not found',
        };
      }

      // Copy the database file to backups directory
      const destPath = path.join(this.backupDir, filename);
      await fs.copyFile(this.dbPath, destPath);

      // Get file size
      const stats = await fs.stat(destPath);
      const size = stats.size;

      console.log(`[Backup] Created backup: ${filename} (${(size / 1024).toFixed(1)} KB)`);

      return {
        success: true,
        backupId,
        timestamp,
        size,
        duration: Date.now() - startTime,
        filename,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Backup] Error creating backup:', errorMessage);

      return {
        success: false,
        backupId,
        timestamp,
        size: 0,
        duration: Date.now() - startTime,
        filename,
        error: errorMessage,
      };
    }
  }

  /**
   * Restore database from a backup file
   */
  async restoreBackup(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backupPath = path.join(this.backupDir, filename);

      // Check if backup file exists
      try {
        await fs.access(backupPath);
      } catch {
        return { success: false, error: 'Backup file not found' };
      }

      // Verify the backup file is a valid database file (check it's not empty)
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        return { success: false, error: 'Backup file is empty' };
      }

      // Copy the backup file over the current database
      await fs.copyFile(backupPath, this.dbPath);

      console.log(`[Backup] Restored from: ${filename}`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Backup] Error restoring backup:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      await this.ensureBackupDir();

      const files = await fs.readdir(this.backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (!file.startsWith('blueprint_backup_') || !file.endsWith('.db')) continue;

        const filepath = path.join(this.backupDir, file);
        try {
          const stats = await fs.stat(filepath);

          backups.push({
            id: this.generateBackupId(file),
            filename: file,
            timestamp: stats.birthtime,
            size: stats.size,
            status: 'completed',
          });
        } catch {
          // Skip files we can't stat
        }
      }

      // Sort by timestamp descending (newest first)
      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch {
      return [];
    }
  }

  /**
   * Delete a specific backup file
   */
  async deleteBackup(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const filepath = path.join(this.backupDir, filename);

      try {
        await fs.access(filepath);
      } catch {
        return { success: false, error: 'Backup file not found' };
      }

      await fs.unlink(filepath);
      console.log(`[Backup] Deleted: ${filename}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get backup statistics
   */
  async getStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
  }> {
    const backups = await this.listBackups();

    return {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : undefined,
      newestBackup: backups.length > 0 ? backups[0].timestamp : undefined,
    };
  }
}

// Export singleton instance
export const backupService = new BackupService();
