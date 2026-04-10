/**
 * Authorization Module
 * وحدة التحقق من الصلاحيات
 *
 * Handles role-based access control (RBAC) and permission checks.
 * Uses string role values (not Prisma enums) for client-side compatibility.
 */

import { Permission, ROLE_PERMISSIONS, UserRoleValues } from '../types';

// ============================================
// Role Types (client-safe string constants)
// ============================================

export type Role = string;

const ROLE_HIERARCHY: Record<string, number> = {
  [UserRoleValues.ADMIN]: 100,
  [UserRoleValues.MANAGER]: 80,
  [UserRoleValues.PROJECT_MANAGER]: 70,
  [UserRoleValues.ENGINEER]: 50,
  [UserRoleValues.DRAFTSMAN]: 45,
  [UserRoleValues.ACCOUNTANT]: 50,
  [UserRoleValues.HR]: 50,
  [UserRoleValues.SECRETARY]: 40,
  [UserRoleValues.VIEWER]: 25,
  // Also support lowercase for backward compat
  admin: 100,
  manager: 80,
  'project-manager': 70,
  engineer: 50,
  draftsman: 45,
  accountant: 50,
  hr: 50,
  secretary: 40,
  viewer: 25,
};

/**
 * Normalize role to uppercase for lookup
 */
function normalizeRole(role: string): string {
  const upper = role.toUpperCase();
  // Map compound roles
  if (upper === 'PROJECT_MANAGER' || upper === 'PROJECT-MANAGER' || upper === 'PROJECTMANAGER') {
    return 'PROJECT_MANAGER';
  }
  return upper;
}

// ============================================
// Permission Checks
// ============================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const normalizedRole = normalizeRole(userRole);
  const rolePermissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// ============================================
// Role Checks
// ============================================

/**
 * Check if user role is at or above a certain level
 */
export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[normalizeRole(userRole)] || ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[normalizeRole(requiredRole)] || ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: Role): boolean {
  const r = normalizeRole(userRole);
  return r === 'ADMIN' || r === 'admin';
}

/**
 * Check if user is manager or above
 */
export function isManagerOrAbove(userRole: Role): boolean {
  return isRoleAtLeast(userRole, UserRoleValues.MANAGER);
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(userRole: Role): boolean {
  return hasAnyPermission(userRole, [
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
  ]);
}

/**
 * Check if user can manage projects
 */
export function canManageProjects(userRole: Role): boolean {
  return hasAnyPermission(userRole, [
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
  ]);
}

/**
 * Check if user can approve items
 */
export function canApprove(userRole: Role): boolean {
  return isManagerOrAbove(userRole);
}

/**
 * Check if user can access financial data
 */
export function canAccessFinancials(userRole: Role): boolean {
  return hasAnyPermission(userRole, [
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    Permission.BUDGET_MANAGE,
  ]);
}

/**
 * Check if user can access HR data
 */
export function canAccessHR(userRole: Role): boolean {
  const r = normalizeRole(userRole);
  return r === 'ADMIN' || r === 'MANAGER' || r === 'HR';
}

// ============================================
// Role Utilities
// ============================================

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS[role] || [];
}

/**
 * Get role level in hierarchy
 */
export function getRoleLevel(role: Role): number {
  return ROLE_HIERARCHY[normalizeRole(role)] || ROLE_HIERARCHY[role] || 0;
}

/**
 * Get all roles below a certain level
 */
export function getRolesBelow(role: Role): string[] {
  const level = ROLE_HIERARCHY[normalizeRole(role)] || ROLE_HIERARCHY[role] || 0;
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, rLevel]) => rLevel < level)
    .map(([r]) => r);
}

/**
 * Get all roles at or above a certain level
 */
export function getRolesAtOrAbove(role: Role): string[] {
  const level = ROLE_HIERARCHY[normalizeRole(role)] || ROLE_HIERARCHY[role] || 0;
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, rLevel]) => rLevel >= level)
    .map(([r]) => r);
}

// ============================================
// Resource Access Control
// ============================================

/**
 * Check if user can access a specific resource
 */
export function canAccessResource(
  userRole: Role,
  resourceType: string,
  action: 'read' | 'write' | 'delete',
  resourceOwnerId?: string,
  userId?: string
): boolean {
  if (isAdmin(userRole)) return true;

  if (resourceOwnerId && userId && resourceOwnerId === userId) {
    return true;
  }

  const permissionMap: Record<string, Record<string, Permission>> = {
    project: {
      read: Permission.PROJECT_READ,
      write: Permission.PROJECT_UPDATE,
      delete: Permission.PROJECT_DELETE,
    },
    client: {
      read: Permission.CLIENT_READ,
      write: Permission.CLIENT_UPDATE,
      delete: Permission.CLIENT_DELETE,
    },
    task: {
      read: Permission.TASK_READ,
      write: Permission.TASK_UPDATE,
      delete: Permission.TASK_DELETE,
    },
    invoice: {
      read: Permission.INVOICE_READ,
      write: Permission.INVOICE_UPDATE,
      delete: Permission.INVOICE_DELETE,
    },
    user: {
      read: Permission.USER_READ,
      write: Permission.USER_UPDATE,
      delete: Permission.USER_DELETE,
    },
    document: {
      read: Permission.DOCUMENT_READ,
      write: Permission.DOCUMENT_UPDATE,
      delete: Permission.DOCUMENT_DELETE,
    },
  };

  const resourcePermissions = permissionMap[resourceType.toLowerCase()];
  if (!resourcePermissions) return false;

  const requiredPermission = resourcePermissions[action];
  if (!requiredPermission) return false;

  return hasPermission(userRole, requiredPermission);
}

// ============================================
// Organization Access
// ============================================

/**
 * Check if user belongs to the same organization as a resource
 */
export function isSameOrganization(
  userOrgId: string | undefined,
  resourceOrgId: string | undefined
): boolean {
  if (!userOrgId || !resourceOrgId) return false;
  return userOrgId === resourceOrgId;
}

/**
 * Check if user can access organization data
 */
export function canAccessOrganization(
  userRole: Role,
  userOrgId: string | undefined,
  resourceOrgId: string | undefined
): boolean {
  if (!isSameOrganization(userOrgId, resourceOrgId)) {
    return false;
  }
  return true;
}
