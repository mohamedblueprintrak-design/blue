export type Role =
  | "admin"
  | "manager"
  | "project_manager"
  | "engineer"
  | "draftsman"
  | "accountant"
  | "hr"
  | "secretary"
  | "viewer";

export interface NavItem {
  id: string;
  icon: string;
  labelAr: string;
  labelEn: string;
  roles: Role[];
  children?: NavItem[];
}

export const roleLabelsAr: Record<Role, string> = {
  admin: "مدير النظام",
  manager: "المدير",
  project_manager: "مدير مشاريع",
  engineer: "مهندس",
  draftsman: "مساح",
  accountant: "محاسب",
  hr: "موارد بشرية",
  secretary: "سكرتارية",
  viewer: "مشاهد",
};

export const roleLabelsEn: Record<Role, string> = {
  admin: "System Admin",
  manager: "Manager",
  project_manager: "Project Manager",
  engineer: "Engineer",
  draftsman: "Draftsman",
  accountant: "Accountant",
  hr: "HR",
  secretary: "Secretary",
  viewer: "Viewer",
};

const allRoles: Role[] = [
  "admin",
  "manager",
  "project_manager",
  "engineer",
  "draftsman",
  "accountant",
  "hr",
  "secretary",
  "viewer",
];

const managementRoles: Role[] = [
  "admin",
  "manager",
  "project_manager",
];

const fullRoles: Role[] = ["admin", "manager"];

// ===== SIMPLIFIED NAVIGATION ITEMS =====
// الشريط الجانبي المبسط
const allNavItems: NavItem[] = [
  // ───── Dashboard ─────
  {
    id: "dashboard",
    icon: "LayoutDashboard",
    labelAr: "لوحة التحكم",
    labelEn: "Dashboard",
    roles: allRoles,
  },

  // ───── Projects (مبسط - بدون children) ─────
  {
    id: "projects",
    icon: "FolderKanban",
    labelAr: "المشاريع",
    labelEn: "Projects",
    roles: allRoles,
  },

  // ───── Contractors (جديد - للمقاولين والمشتريات) ─────
  {
    id: "contractors",
    icon: "HardHat",
    labelAr: "المقاولون",
    labelEn: "Contractors",
    roles: ["admin", "manager", "project_manager"],
    children: [
      {
        id: "contractors-suppliers",
        icon: "Truck",
        labelAr: "الموردون",
        labelEn: "Suppliers",
        roles: ["admin", "manager", "project_manager"],
      },
      {
        id: "contractors-inventory",
        icon: "Warehouse",
        labelAr: "المخزون",
        labelEn: "Inventory",
        roles: ["admin", "manager", "project_manager"],
      },
      {
        id: "contractors-purchase-orders",
        icon: "Package",
        labelAr: "أوامر الشراء",
        labelEn: "Purchase Orders",
        roles: ["admin", "manager", "project_manager"],
      },
      {
        id: "contractors-equipment",
        icon: "Settings",
        labelAr: "المعدات",
        labelEn: "Equipment",
        roles: ["admin", "manager", "project_manager"],
      },
    ],
  },

  // ───── Employees ─────
  {
    id: "employees",
    icon: "UsersRound",
    labelAr: "الموظفين",
    labelEn: "Employees",
    roles: ["admin", "manager", "hr"],
    children: [
      {
        id: "employees-list",
        icon: "UsersRound",
        labelAr: "قائمة الموظفين",
        labelEn: "Employees List",
        roles: ["admin", "manager", "hr"],
      },
      {
        id: "employees-attendance",
        icon: "Clock",
        labelAr: "الحضور والانصراف",
        labelEn: "Attendance",
        roles: ["admin", "manager", "hr"],
      },
      {
        id: "employees-leave",
        icon: "CalendarOff",
        labelAr: "الإجازات",
        labelEn: "Leave Management",
        roles: ["admin", "manager", "hr"],
      },
      {
        id: "employees-workload",
        icon: "BarChart3",
        labelAr: "أعباء العمل",
        labelEn: "Workload",
        roles: ["admin", "manager", "hr"],
      },
    ],
  },

  // ───── Settings ─────
  {
    id: "settings",
    icon: "Settings",
    labelAr: "الإعدادات",
    labelEn: "Settings",
    roles: ["admin", "manager"],
  },

  // ───── Admin ─────
  {
    id: "admin",
    icon: "Shield",
    labelAr: "إدارة النظام",
    labelEn: "System Admin",
    roles: ["admin"],
  },
];

// ===== FILTER NAVIGATION BY ROLE =====
function filterNavItemsByRole(items: NavItem[], role: Role): NavItem[] {
  return items
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavItemsByRole(item.children, role)
        : undefined,
    }))
    .filter((item) => {
      // Keep items without children or items that still have visible children
      if (!item.children || item.children.length === 0) {
        return true;
      }
      return item.children.length > 0;
    });
}

export function getNavItems(role: Role): NavItem[] {
  return filterNavItemsByRole(allNavItems, role);
}

// ===== CHECK PERMISSION HELPER =====
export function hasPermission(role: Role, pageId: string): boolean {
  const items = getNavItems(role);
  return checkItemAccess(items, pageId);
}

function checkItemAccess(items: NavItem[], pageId: string): boolean {
  for (const item of items) {
    if (item.id === pageId) return true;
    if (item.children && checkItemAccess(item.children, pageId)) return true;
  }
  return false;
}

// ===== PROJECT TAB ITEMS (للاستخدام داخل المشروع) =====
export const projectTabItems = [
  { id: "overview", icon: "Eye", labelAr: "نظرة عامة", labelEn: "Overview" },
  { id: "technical", icon: "Building2", labelAr: "فني", labelEn: "Technical" },
  { id: "tasks", icon: "CheckSquare", labelAr: "المهام", labelEn: "Tasks" },
  { id: "documents", icon: "FileText", labelAr: "المستندات", labelEn: "Documents" },
  { id: "financial", icon: "Wallet", labelAr: "المالية", labelEn: "Financial" },
  { id: "site", icon: "MapPin", labelAr: "الموقع", labelEn: "Site" },
  { id: "team", icon: "Users", labelAr: "الفريق", labelEn: "Team" },
  { id: "help", icon: "Sparkles", labelAr: "مساعدة", labelEn: "Help" },
];

// Technical Sub-tabs
export const technicalSubTabs = [
  { id: "architectural", icon: "Building2", labelAr: "المعماري", labelEn: "Architectural" },
  { id: "structural", icon: "HardHat", labelAr: "الإنشائي", labelEn: "Structural" },
  { id: "electrical", icon: "Zap", labelAr: "الكهربائي", labelEn: "Electrical" },
  { id: "plumbing", icon: "Droplets", labelAr: "السباكة", labelEn: "Plumbing" },
  { id: "gov-approvals", icon: "Landmark", labelAr: "الموافقات الحكومية", labelEn: "Gov Approvals" },
  { id: "boq", icon: "Calculator", labelAr: "جدول الكميات", labelEn: "BOQ" },
  { id: "change-orders", icon: "FileEdit", labelAr: "أوامر التغيير", labelEn: "Change Orders" },
  { id: "risks", icon: "ShieldAlert", labelAr: "المخاطر", labelEn: "Risks" },
];

// Documents Sub-tabs
export const documentsSubTabs = [
  { id: "contract", icon: "FileSignature", labelAr: "العقد", labelEn: "Contract" },
  { id: "documents", icon: "FileText", labelAr: "المستندات", labelEn: "Documents" },
  { id: "municipality", icon: "Landmark", labelAr: "المراسلات البلدية", labelEn: "Municipality" },
];

// Financial Sub-tabs
export const financialSubTabs = [
  { id: "invoices", icon: "Receipt", labelAr: "الفواتير", labelEn: "Invoices" },
  { id: "payments", icon: "CreditCard", labelAr: "المدفوعات", labelEn: "Payments" },
  { id: "budgets", icon: "PiggyBank", labelAr: "الميزانية", labelEn: "Budget" },
  { id: "proposals", icon: "FileSpreadsheet", labelAr: "العروض", labelEn: "Proposals" },
  { id: "bids", icon: "Gavel", labelAr: "العطاءات", labelEn: "Bids" },
];

// Site Sub-tabs
export const siteSubTabs = [
  { id: "clients", icon: "Users", labelAr: "العملاء", labelEn: "Clients" },
  { id: "site-visits", icon: "Eye", labelAr: "زيارات الموقع", labelEn: "Site Visits" },
  { id: "site-diary", icon: "BookOpen", labelAr: "يومية الموقع", labelEn: "Site Diary" },
  { id: "rfi", icon: "MessageSquareQuote", labelAr: "طلبات المعلومات", labelEn: "RFI" },
  { id: "defects", icon: "AlertTriangle", labelAr: "العيوب", labelEn: "Defects" },
];

// Team Sub-tabs
export const teamSubTabs = [
  { id: "team-members", icon: "UsersRound", labelAr: "الفريق", labelEn: "Team" },
  { id: "meetings", icon: "Video", labelAr: "الاجتماعات", labelEn: "Meetings" },
  { id: "approvals", icon: "ClipboardCheck", labelAr: "الموافقات", labelEn: "Approvals" },
  { id: "notifications", icon: "Bell", labelAr: "الإشعارات", labelEn: "Notifications" },
  { id: "activity-log", icon: "Activity", labelAr: "سجل النشاط", labelEn: "Activity Log" },
];

// Help Sub-tabs
export const helpSubTabs = [
  { id: "ai-assistant", icon: "Sparkles", labelAr: "المساعد الذكي", labelEn: "AI Assistant" },
  { id: "knowledge", icon: "BookMarked", labelAr: "قاعدة المعرفة", labelEn: "Knowledge" },
  { id: "calendar", icon: "Calendar", labelAr: "التقويم", labelEn: "Calendar" },
  { id: "search", icon: "Search", labelAr: "البحث", labelEn: "Search" },
];
