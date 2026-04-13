/**
 * API Validation Utilities
 * أدوات التحقق من صحة البيانات في API Routes
 *
 * Provides Zod-based server-side validation for all API endpoints.
 * Ensures incoming data is properly validated before processing,
 * preventing injection attacks and data corruption.
 */

import { z, ZodSchema, ZodError } from 'zod';

// ===== Validation Result Types =====

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ===== Core Validation Function =====

/**
 * Validate request data against a Zod schema
 * يتحقق من صحة البيانات باستخدام مخطط Zod
 */
export function validateRequest<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.') || '_root';
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }

      const firstError = error.issues[0];
      const mainMessage = firstError?.message || 'بيانات غير صالحة';

      return {
        success: false,
        error: mainMessage,
        errors: fieldErrors,
      };
    }
    return {
      success: false,
      error: 'بيانات غير صالحة',
    };
  }
}

// ===== Auth Schemas =====

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z.string()
    .min(1, 'كلمة المرور مطلوبة')
    .max(128, 'كلمة المرور طويلة جداً'),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(128, 'كلمة المرور طويلة جداً'),
  name: z.string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً')
    .optional()
    .default(''),
  fullName: z.string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً')
    .optional()
    .default(''),
  organizationName: z.string().max(200).optional(),
  department: z.string().max(100).optional(),
  role: z.string().max(50).optional(),
  action: z.string().optional(),
});

export type RegisterData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('صيغة البريد الإلكتروني غير صحيحة'),
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'رمز إعادة التعيين مطلوب'),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(128, 'كلمة المرور طويلة جداً'),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => !data.confirmPassword || data.password === data.confirmPassword,
  { message: 'كلمات المرور غير متطابقة', path: ['confirmPassword'] }
);

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string()
    .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .max(128, 'كلمة المرور طويلة جداً'),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
  { message: 'كلمات المرور غير متطابقة', path: ['confirmPassword'] }
);

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

// ===== Common Schemas =====

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().default(''),
  sortField: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationData = z.infer<typeof paginationSchema>;

export const idParamSchema = z.object({
  id: z.string().min(1, 'المعرف مطلوب'),
});

export type IdParamData = z.infer<typeof idParamSchema>;
