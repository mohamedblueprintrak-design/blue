/**
 * Demo Credentials for Development & Testing
 * بيانات الدخول التجريبية للتطوير والاختبار
 *
 * SECURITY NOTES:
 * - These passwords are ONLY used for demo/seed data
 * - They are bcrypt-hashed before storing in the database
 * - They should NEVER be used in production
 * - In production, set DEMO_MODE=false and use real passwords
 *
 * أمان:
 * - هذه الباسوردات للعرض والتطوير فقط
 * - يتم تشفيرها بـ bcrypt قبل تخزينها
 * - لا تستخدم أبداً في الإنتاج
 */

export interface DemoCredential {
  email: string;
  password: string;
  nameAr: string;
  nameEn: string;
  role: string;
  labelAr: string;
  labelEn: string;
}

/**
 * Fixed demo passwords - strong enough for demo, memorable for developers
 * Each role has a unique password following the pattern: {Role}@BP2024!
 * BP = BluePrint, 2024 = year
 */
export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: 'admin@blueprint.ae',
    password: 'Admin@BP2024!',
    nameAr: 'المدير العام',
    nameEn: 'General Manager',
    role: 'admin',
    labelAr: 'المدير العام',
    labelEn: 'Admin',
  },
  {
    email: 'pm@blueprint.ae',
    password: 'Manager@BP2024!',
    nameAr: 'عمر يوسف',
    nameEn: 'Omar Youssef',
    role: 'project_manager',
    labelAr: 'مدير مشاريع',
    labelEn: 'Project Manager',
  },
  {
    email: 'eng@blueprint.ae',
    password: 'Engineer@BP2024!',
    nameAr: 'أحمد محمد',
    nameEn: 'Ahmed Mohamed',
    role: 'engineer',
    labelAr: 'مهندس معماري',
    labelEn: 'Architect',
  },
  {
    email: 'struct@blueprint.ae',
    password: 'Struct@BP2024!',
    nameAr: 'سارة علي',
    nameEn: 'Sara Ali',
    role: 'engineer',
    labelAr: 'مهندس إنشائي',
    labelEn: 'Structural Eng',
  },
  {
    email: 'elec@blueprint.ae',
    password: 'Elec@BP2024!',
    nameAr: 'خالد سعيد',
    nameEn: 'Khalid Saeed',
    role: 'engineer',
    labelAr: 'مهندس كهربائي',
    labelEn: 'Electrical Eng',
  },
  {
    email: 'site@blueprint.ae',
    password: 'Site@BP2024!',
    nameAr: 'ياسر أحمد',
    nameEn: 'Yasser Ahmed',
    role: 'engineer',
    labelAr: 'مهندس موقع',
    labelEn: 'Site Engineer',
  },
  {
    email: 'mep@blueprint.ae',
    password: 'Mep@BP2024!',
    nameAr: 'محمد سالم',
    nameEn: 'Mohamed Salem',
    role: 'engineer',
    labelAr: 'مهندس ميكانيكا',
    labelEn: 'MEP Engineer',
  },
  {
    email: 'draft@blueprint.ae',
    password: 'Draft@BP2024!',
    nameAr: 'نورة حسين',
    nameEn: 'Noura Hussein',
    role: 'engineer',
    labelAr: 'رسام',
    labelEn: 'Draftsman',
  },
  {
    email: 'acc@blueprint.ae',
    password: 'Account@BP2024!',
    nameAr: 'فاطمة حسن',
    nameEn: 'Fatima Hassan',
    role: 'accountant',
    labelAr: 'محاسب',
    labelEn: 'Accountant',
  },
  {
    email: 'sec@blueprint.ae',
    password: 'Secret@BP2024!',
    nameAr: 'خالد سعيد',
    nameEn: 'Khalid Saeed',
    role: 'secretary',
    labelAr: 'سكرتيرة',
    labelEn: 'Secretary',
  },
  {
    email: 'hr@blueprint.ae',
    password: 'Hr@BP2024!',
    nameAr: 'سارة علي',
    nameEn: 'Sara Ali',
    role: 'hr',
    labelAr: 'موارد بشرية',
    labelEn: 'HR',
  },
  {
    email: 'viewer@blueprint.ae',
    password: 'View@BP2024!',
    nameAr: 'عبدالله محمود',
    nameEn: 'Abdullah Mahmoud',
    role: 'viewer',
    labelAr: 'مشاهد',
    labelEn: 'Viewer',
  },
];

/**
 * Get demo password for a given email
 * يجلب كلمة المرور التجريبية بناءً على البريد الإلكتروني
 */
export function getDemoPassword(email: string): string | undefined {
  return DEMO_CREDENTIALS.find(c => c.email === email)?.password;
}

/**
 * Get all demo credentials as a simple email→password map
 * يجلب جميع بيانات الدخول التجريبية كخريطة بريد→كلمة مرور
 */
export function getDemoCredentialsMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of DEMO_CREDENTIALS) {
    map[c.email] = c.password;
  }
  return map;
}

/**
 * Check if we're running in demo/development mode
 * يتحقق مما إذا كنا نعمل في وضع العرض/التطوير
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';
}
