/**
 * Security Audit Service
 * خدمة سجل التدقيق الأمني
 * 
 * Provides functions for logging security-relevant events
 * for compliance, debugging, and security monitoring.
 */

import { db } from '@/lib/db';

export type SecurityAction =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_verification_success'
  | '2fa_verification_failed'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'account_locked'
  | 'account_unlocked'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'csrf_validation_failed'
  | 'unauthorized_access_attempt'
  | 'permission_denied'
  | 'api_key_generated'
  | 'api_key_revoked'
  | 'data_export'
  | 'bulk_delete'
  | 'sensitive_data_access';

export interface AuditLogData {
  userId?: string;
  action: SecurityAction;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  status?: 'success' | 'failed' | 'blocked';
  errorMessage?: string;
}

/**
 * Log a security event to the audit log
 */
export async function logSecurityEvent(data: AuditLogData): Promise<void> {
  try {
    await db.securityAuditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        details: data.details ? JSON.stringify(data.details) : null,
        status: data.status || 'success',
        errorMessage: data.errorMessage || null,
      },
    });
  } catch (error) {
    // Don't throw on audit log failure - just log it
    console.error('Failed to log security event:', error);
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0] || 'unknown';
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  
  return 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  userId: string | null,
  success: boolean,
  request: Request,
  reason?: string
): Promise<void> {
  await logSecurityEvent({
    userId: userId || undefined,
    action: success ? 'login_success' : 'login_failed',
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
    status: success ? 'success' : 'failed',
    errorMessage: reason,
    details: success ? undefined : { reason },
  });
}

/**
 * Log 2FA event
 */
export async function log2FAEvent(
  userId: string,
  action: 'enabled' | 'disabled' | 'verify_success' | 'verify_failed',
  request: Request,
  details?: Record<string, unknown>
): Promise<void> {
  const actionMap: Record<string, SecurityAction> = {
    enabled: '2fa_enabled',
    disabled: '2fa_disabled',
    verify_success: '2fa_verification_success',
    verify_failed: '2fa_verification_failed',
  };
  
  await logSecurityEvent({
    userId,
    action: actionMap[action],
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
    status: action.includes('success') || action === 'enabled' ? 'success' : 'failed',
    details,
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string | null,
  activity: string,
  request: Request,
  details?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    userId: userId || undefined,
    action: 'suspicious_activity',
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
    status: 'failed',
    details: { activity, ...details },
  });
}

/**
 * Get recent security events for a user
 */
export async function getRecentSecurityEvents(
  userId: string,
  limit: number = 50
): Promise<AuditLogData[]> {
  const logs = await db.securityAuditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  return logs.map(log => ({
    userId: log.userId || undefined,
    action: log.action as SecurityAction,
    entityType: log.entityType || undefined,
    entityId: log.entityId || undefined,
    ipAddress: log.ipAddress || undefined,
    userAgent: log.userAgent || undefined,
    details: log.details ? JSON.parse(log.details) : undefined,
    status: log.status as 'success' | 'failed' | 'blocked',
    errorMessage: log.errorMessage || undefined,
  }));
}

/**
 * Check for suspicious patterns
 */
export async function detectSuspiciousPatterns(
  userId: string,
  timeWindowMinutes: number = 60
): Promise<{
  suspicious: boolean;
  reasons: string[];
}> {
  const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  const recentEvents = await db.securityAuditLog.findMany({
    where: {
      userId,
      createdAt: { gte: cutoff },
    },
  });
  
  const reasons: string[] = [];
  
  // Check for multiple failed login attempts
  const failedLogins = recentEvents.filter(
    e => e.action === 'login_failed'
  ).length;
  if (failedLogins >= 5) {
    reasons.push(`Multiple failed login attempts (${failedLogins} in last ${timeWindowMinutes} minutes)`);
  }
  
  // Check for multiple 2FA failures
  const failed2FA = recentEvents.filter(
    e => e.action === '2fa_verification_failed'
  ).length;
  if (failed2FA >= 3) {
    reasons.push(`Multiple 2FA verification failures (${failed2FA} in last ${timeWindowMinutes} minutes)`);
  }
  
  // Check for access from multiple IPs
  const uniqueIPs = new Set(
    recentEvents
      .filter(e => e.ipAddress && e.ipAddress !== 'unknown')
      .map(e => e.ipAddress)
  );
  if (uniqueIPs.size >= 3) {
    reasons.push(`Access from multiple IP addresses (${uniqueIPs.size} different IPs)`);
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}
