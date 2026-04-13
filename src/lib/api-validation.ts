/**
 * API Validation Utilities
 * أدوات التحقق من صحة البيانات في API Routes
 *
 * Provides Zod-based server-side validation for all API endpoints.
 * Ensures incoming data is properly validated before processing,
 * preventing injection attacks and data corruption.
 */

import { z, ZodSchema, ZodError } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

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

/**
 * Validate a NextRequest body against a Zod schema
 * يتحقق من صحة جسم الطلب باستخدام مخطط Zod
 *
 * Returns parsed data or a 400 NextResponse automatically.
 * Usage:
 *   const result = await validateBody(req, mySchema);
 *   if (result instanceof NextResponse) return result; // validation failed
 *   const data = result; // validated data
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T | NextResponse> {
  try {
    const body = await req.json();
    const result = validateRequest(schema, body);
    if (result.success) return result.data;
    return NextResponse.json(
      { error: result.error, errors: result.errors },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}

/**
 * Validate URL search params against a Zod schema
 * يتحقق من صحة معاملات البحث باستخدام مخطط Zod
 */
export function validateSearchParams<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): T | NextResponse {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const result = validateRequest(schema, params);
    if (result.success) return result.data;
    return NextResponse.json(
      { error: result.error, errors: result.errors },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid search parameters' },
      { status: 400 }
    );
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

// ===== Entity Schemas =====

const _safeString = z.string().max(500).optional().default('');
const safeNumber = z.coerce.number().optional().default(0);

export const projectCreateSchema = z.object({
  number: z.string().max(50).optional().default(''),
  name: z.string().min(1, 'اسم المشروع مطلوب').max(200),
  nameEn: z.string().max(200).optional().default(''),
  clientId: z.string().min(1, 'العميل مطلوب'),
  contractorId: z.string().optional().default(''),
  location: z.string().max(200).optional().default(''),
  plotNumber: z.string().max(100).optional().default(''),
  type: z.string().min(1, 'نوع المشروع مطلوب').max(50),
  budget: safeNumber,
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  description: z.string().max(5000).optional().default(''),
  status: z.string().max(50).optional().default('active'),
  progress: z.coerce.number().min(0).max(100).optional().default(0),
});

export type ProjectCreateData = z.infer<typeof projectCreateSchema>;

export const clientCreateSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب').max(200),
  company: z.string().max(200).optional().default(''),
  email: z.string().email('بريد إلكتروني غير صحيح').or(z.literal('')).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  address: z.string().max(500).optional().default(''),
  taxNumber: z.string().max(100).optional().default(''),
  creditLimit: safeNumber,
  paymentTerms: z.string().max(100).optional().default(''),
  serviceType: z.string().max(100).optional().default(''),
  serviceNotes: z.string().max(1000).optional().default(''),
});

export type ClientCreateData = z.infer<typeof clientCreateSchema>;

export const taskCreateSchema = z.object({
  title: z.string().min(1, 'عنوان المهمة مطلوب').max(300),
  description: z.string().max(5000).optional().default(''),
  projectId: z.string().optional().default(''),
  assigneeId: z.string().optional().default(''),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  status: z.string().max(50).default('todo'),
  startDate: z.string().optional().default(''),
  dueDate: z.string().optional().default(''),
  progress: z.coerce.number().min(0).max(100).optional().default(0),
  isGovernmental: z.boolean().optional().default(false),
  slaDays: z.coerce.number().optional().default(0),
});

export type TaskCreateData = z.infer<typeof taskCreateSchema>;

export const invoiceCreateSchema = z.object({
  number: z.string().min(1, 'رقم الفاتورة مطلوب').max(50),
  clientId: z.string().min(1, 'العميل مطلوب'),
  projectId: z.string().min(1, 'المشروع مطلوب'),
  issueDate: z.string().min(1, 'تاريخ الإصدار مطلوب'),
  dueDate: z.string().min(1, 'تاريخ الاستحقاق مطلوب'),
  status: z.string().max(50).default('draft'),
  subtotal: safeNumber,
  tax: safeNumber,
  total: safeNumber,
  paidAmount: safeNumber,
  remaining: safeNumber,
});

export type InvoiceCreateData = z.infer<typeof invoiceCreateSchema>;

export const contractCreateSchema = z.object({
  number: z.string().min(1, 'رقم العقد مطلوب').max(50),
  title: z.string().min(1, 'عنوان العقد مطلوب').max(300),
  clientId: z.string().min(1, 'العميل مطلوب'),
  projectId: z.string().optional().default(''),
  value: safeNumber,
  type: z.string().max(50).optional().default('engineering_services'),
  status: z.string().max(50).default('pending'),
  signedByName: z.string().max(200).optional().default(''),
  signedByTitle: z.string().max(200).optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
});

export type ContractCreateData = z.infer<typeof contractCreateSchema>;

export const meetingCreateSchema = z.object({
  title: z.string().min(1, 'عنوان الاجتماع مطلوب').max(300),
  date: z.string().min(1, 'التاريخ مطلوب'),
  time: z.string().min(1, 'الوقت مطلوب'),
  duration: z.coerce.number().min(15).default(60),
  projectId: z.string().optional().default(''),
  location: z.string().max(300).optional().default(''),
  type: z.string().max(50).default('onsite'),
  notes: z.string().max(5000).optional().default(''),
});

export type MeetingCreateData = z.infer<typeof meetingCreateSchema>;

export const supplierCreateSchema = z.object({
  name: z.string().min(1, 'اسم المورد مطلوب').max(200),
  category: z.string().max(100).optional().default(''),
  email: z.string().email().or(z.literal('')).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  address: z.string().max(500).optional().default(''),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  creditLimit: safeNumber,
});

export type SupplierCreateData = z.infer<typeof supplierCreateSchema>;

export const bidCreateSchema = z.object({
  projectId: z.string().min(1, 'المشروع مطلوب'),
  contractorId: z.string().min(1, 'المقاول مطلوب'),
  contractorName: z.string().max(200).optional().default(''),
  amount: safeNumber,
  technicalScore: z.coerce.number().min(0).max(100).optional().default(0),
  financialScore: z.coerce.number().min(0).max(100).optional().default(0),
  totalScore: z.coerce.number().min(0).max(100).optional().default(0),
  status: z.string().max(50).default('submitted'),
  deadline: z.string().optional().default(''),
});

export type BidCreateData = z.infer<typeof bidCreateSchema>;

export const siteVisitCreateSchema = z.object({
  projectId: z.string().min(1, 'المشروع مطلوب'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  plotNumber: z.string().max(100).optional().default(''),
  municipality: z.string().max(100).optional().default(''),
  status: z.string().max(50).optional().default('pending'),
});

export type SiteVisitCreateData = z.infer<typeof siteVisitCreateSchema>;

export const notificationCreateSchema = z.object({
  userId: z.string().min(1, 'المستخدم مطلوب'),
  type: z.string().max(100),
  title: z.string().min(1, 'العنوان مطلوب').max(300),
  message: z.string().min(1, 'الرسالة مطلوبة').max(2000),
  relatedEntityType: z.string().max(50).optional().default(''),
  relatedEntityId: z.string().optional().default(''),
});

export type NotificationCreateData = z.infer<typeof notificationCreateSchema>;

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  department: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  role: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

export type UserUpdateData = z.infer<typeof userUpdateSchema>;

export const companySettingsSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  nameEn: z.string().max(300).optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  taxNumber: z.string().max(100).optional(),
  currency: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
  workingDays: z.string().max(100).optional(),
  workingHours: z.string().max(100).optional(),
});

export type CompanySettingsData = z.infer<typeof companySettingsSchema>;

export const aiChatSchema = z.object({
  message: z.string().min(1, 'الرسالة مطلوبة').max(10000),
  conversationId: z.string().max(100).optional().default(''),
  userId: z.string().optional().default(''),
  language: z.enum(['ar', 'en']).optional().default('ar'),
  projectId: z.string().optional().default(''),
  model: z.string().max(50).optional().default('gpt-4'),
});

export type AiChatData = z.infer<typeof aiChatSchema>;

export const approvalCreateSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().min(1).max(100),
  title: z.string().min(1, 'العنوان مطلوب').max(300),
  description: z.string().max(2000).optional().default(''),
  requestedBy: z.string().max(200).optional().default(''),
  assignedTo: z.string().max(200).optional().default(''),
  step: z.coerce.number().min(1).default(1),
  totalSteps: z.coerce.number().min(1).default(1),
  amount: safeNumber,
});

export type ApprovalCreateData = z.infer<typeof approvalCreateSchema>;

export const employeeCreateSchema = z.object({
  userId: z.string().min(1, 'المستخدم مطلوب'),
  department: z.string().max(200).optional().default(''),
  position: z.string().max(200).optional().default(''),
  salary: safeNumber,
  hireDate: z.string().optional().default(''),
  employmentStatus: z.string().max(50).optional().default('active'),
});

export type EmployeeCreateData = z.infer<typeof employeeCreateSchema>;

export const leaveCreateSchema = z.object({
  employeeId: z.string().min(1, 'الموظف مطلوب'),
  type: z.string().min(1).max(50),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
  reason: z.string().max(2000).optional().default(''),
  status: z.string().max(50).optional().default('pending'),
});

export type LeaveCreateData = z.infer<typeof leaveCreateSchema>;

export const contractorCreateSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب').max(200),
  nameEn: z.string().max(200).optional().default(''),
  companyName: z.string().max(300).optional().default(''),
  companyEn: z.string().max(300).optional().default(''),
  contactPerson: z.string().max(200).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  email: z.string().email().or(z.literal('')).optional().default(''),
  address: z.string().max(500).optional().default(''),
  category: z.string().max(50).optional().default(''),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  specialties: z.string().max(1000).optional().default(''),
  experience: z.string().max(1000).optional().default(''),
  crNumber: z.string().max(100).optional().default(''),
  licenseNumber: z.string().max(100).optional().default(''),
  bankName: z.string().max(200).optional().default(''),
  bankAccount: z.string().max(100).optional().default(''),
  iban: z.string().max(100).optional().default(''),
  isActive: z.boolean().optional().default(true),
});

export type ContractorCreateData = z.infer<typeof contractorCreateSchema>;

export const knowledgeArticleSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(300),
  content: z.string().min(1, 'المحتوى مطلوب').max(50000),
  category: z.string().max(50).optional().default('guide'),
  tags: z.string().max(500).optional().default(''),
});

export type KnowledgeArticleData = z.infer<typeof knowledgeArticleSchema>;

export const siteDiarySchema = z.object({
  projectId: z.string().min(1, 'المشروع مطلوب'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  weather: z.string().max(200).optional().default(''),
  workerCount: z.coerce.number().min(0).optional().default(0),
  workDescription: z.string().max(5000).optional().default(''),
});

export type SiteDiaryData = z.infer<typeof siteDiarySchema>;

export const govApprovalSchema = z.object({
  projectId: z.string().min(1, 'المشروع مطلوب'),
  authority: z.string().min(1).max(50),
  status: z.string().max(50).default('PENDING'),
  submissionDate: z.string().optional().default(''),
  approvalDate: z.string().optional().default(''),
  notes: z.string().max(2000).optional().default(''),
});

export type GovApprovalData = z.infer<typeof govApprovalSchema>;

export const proposalSchema = z.object({
  number: z.string().min(1).max(50),
  clientId: z.string().min(1, 'العميل مطلوب'),
  projectId: z.string().optional().default(''),
  subtotal: safeNumber,
  tax: safeNumber,
  total: safeNumber,
  status: z.string().max(50).default('draft'),
});

export type ProposalData = z.infer<typeof proposalSchema>;

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

/**
 * Generic update schema — allows partial updates with string values
 * مخطط تحديث عام — يسمح بالتحديث الجزئي
 */
export function createUpdateSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).partial();
}
