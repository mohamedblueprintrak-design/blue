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

// ===== ALL NAVIGATION ITEMS DEFINITION =====
const allNavItems: NavItem[] = [
  // ───── Dashboard ─────
  {
    id: "dashboard",
    icon: "LayoutDashboard",
    labelAr: "لوحة التحكم",
    labelEn: "Dashboard",
    roles: allRoles,
  },

  // ───── Projects ─────
  {
    id: "projects",
    icon: "FolderKanban",
    labelAr: "المشاريع",
    labelEn: "Projects",
    roles: allRoles,
    children: [
      {
        id: "projects-overview",
        icon: "List",
        labelAr: "نظرة عامة",
        labelEn: "Overview",
        roles: allRoles,
      },
      {
        id: "projects-architectural",
        icon: "Building2",
        labelAr: "المعماري",
        labelEn: "Architectural",
        roles: ["admin", "manager", "project_manager", "engineer", "draftsman"],
      },
      {
        id: "projects-structural",
        icon: "HardHat",
        labelAr: "الإنشائي",
        labelEn: "Structural",
        roles: ["admin", "manager", "project_manager", "engineer", "draftsman"],
      },
      {
        id: "projects-mep-electrical",
        icon: "Zap",
        labelAr: "الكهربائي",
        labelEn: "MEP - Electrical",
        roles: ["admin", "manager", "project_manager", "engineer"],
      },
      {
        id: "projects-mep-plumbing",
        icon: "Droplets",
        labelAr: "السباكة",
        labelEn: "MEP - Plumbing",
        roles: ["admin", "manager", "project_manager", "engineer"],
      },
      {
        id: "projects-gov-approvals",
        icon: "Landmark",
        labelAr: "الموافقات الحكومية",
        labelEn: "Government Approvals",
        roles: managementRoles,
      },
      {
        id: "projects-schedule",
        icon: "CalendarRange",
        labelAr: "الجدول الزمني",
        labelEn: "Schedule",
        roles: managementRoles,
      },
      {
        id: "projects-boq",
        icon: "Calculator",
        labelAr: "جدول الكميات",
        labelEn: "Bill of Quantities",
        roles: managementRoles,
      },
      {
        id: "projects-change-orders",
        icon: "FileEdit",
        labelAr: "أوامر التغيير",
        labelEn: "Change Orders",
        roles: managementRoles,
      },
      {
        id: "projects-risks",
        icon: "ShieldAlert",
        labelAr: "المخاطر",
        labelEn: "Risks",
        roles: managementRoles,
      },
    ],
  },

  // ───── Tasks ─────
  {
    id: "tasks",
    icon: "CheckSquare",
    labelAr: "المهام",
    labelEn: "Tasks",
    roles: ["admin", "manager", "project_manager", "engineer", "draftsman"],
  },

  // ───── Clients ─────
  {
    id: "clients",
    icon: "Users",
    labelAr: "العملاء",
    labelEn: "Clients",
    roles: ["admin", "manager", "project_manager", "accountant"],
  },

  // ───── Contracts ─────
  {
    id: "contracts",
    icon: "FileSignature",
    labelAr: "العقود",
    labelEn: "Contracts",
    roles: fullRoles,
  },

  // ───── Documents ─────
  {
    id: "documents",
    icon: "FileText",
    labelAr: "المستندات",
    labelEn: "Documents",
    roles: [
      "admin",
      "manager",
      "project_manager",
      "engineer",
      "draftsman",
      "secretary",
      "viewer",
    ],
  },

  // ───── Site Management ─────
  {
    id: "site",
    icon: "MapPin",
    labelAr: "إدارة الموقع",
    labelEn: "Site Management",
    roles: ["admin", "manager", "project_manager", "engineer"],
    children: [
      {
        id: "site-visits",
        icon: "Eye",
        labelAr: "زيارات الموقع",
        labelEn: "Site Visits",
        roles: ["admin", "manager", "project_manager", "engineer"],
      },
      {
        id: "site-diary",
        icon: "BookOpen",
        labelAr: "يومية الموقع",
        labelEn: "Site Diary",
        roles: ["admin", "manager", "project_manager", "engineer"],
      },
      {
        id: "site-rfi",
        icon: "MessageSquareQuote",
        labelAr: "طلبات المعلومات",
        labelEn: "RFI",
        roles: ["admin", "manager", "project_manager", "engineer"],
      },
      {
        id: "site-defects",
        icon: "AlertTriangle",
        labelAr: "العيوب",
        labelEn: "Defects",
        roles: ["admin", "manager", "project_manager", "engineer"],
      },
      {
        id: "municipality",
        icon: "Landmark",
        labelAr: "المراسلات البلدية",
        labelEn: "Municipality Correspondence",
        roles: ["admin", "manager", "project_manager", "engineer"],
      },
    ],
  },

  // ───── Financial ─────
  {
    id: "financial",
    icon: "Wallet",
    labelAr: "المالية",
    labelEn: "Financial",
    roles: ["admin", "manager", "accountant"],
    children: [
      {
        id: "financial-invoices",
        icon: "Receipt",
        labelAr: "الفواتير",
        labelEn: "Invoices",
        roles: ["admin", "manager", "accountant"],
      },
      {
        id: "financial-payments",
        icon: "CreditCard",
        labelAr: "المدفوعات",
        labelEn: "Payments",
        roles: ["admin", "manager", "accountant"],
      },
      {
        id: "financial-proposals",
        icon: "FileSpreadsheet",
        labelAr: "العروض",
        labelEn: "Proposals",
        roles: ["admin", "manager", "accountant"],
      },
      {
        id: "financial-bids",
        icon: "Gavel",
        labelAr: "العطاءات",
        labelEn: "Bids",
        roles: ["admin", "manager", "accountant"],
      },
      {
        id: "financial-budgets",
        icon: "PiggyBank",
        labelAr: "الميزانيات",
        labelEn: "Budgets",
        roles: ["admin", "manager", "accountant"],
      },
    ],
  },

  // ───── Procurement ─────
  {
    id: "procurement",
    icon: "ShoppingCart",
    labelAr: "المشتريات",
    labelEn: "Procurement",
    roles: ["admin", "manager", "project_manager"],
    children: [
      {
        id: "procurement-suppliers",
        icon: "Truck",
        labelAr: "الموردون",
        labelEn: "Suppliers",
        roles: ["admin", "manager", "project_manager"],
      },
      {
        id: "procurement-orders",
        icon: "Package",
        labelAr: "أوامر الشراء",
        labelEn: "Purchase Orders",
        roles: ["admin", "manager", "project_manager"],
      },
      {
        id: "procurement-inventory",
        icon: "Warehouse",
        labelAr: "المخزون",
        labelEn: "Inventory",
        roles: ["admin", "manager", "project_manager"],
      },
    ],
  },

  // ───── HR ─────
  {
    id: "hr",
    icon: "UserCog",
    labelAr: "الموارد البشرية",
    labelEn: "Human Resources",
    roles: ["admin", "manager", "hr"],
    children: [
      {
        id: "hr-employees",
        icon: "UsersRound",
        labelAr: "الموظفون",
        labelEn: "Employees",
        roles: ["admin", "manager", "hr"],
      },
      {
        id: "hr-attendance",
        icon: "Clock",
        labelAr: "الحضور",
        labelEn: "Attendance",
        roles: ["admin", "manager", "hr"],
      },
      {
        id: "hr-leave",
        icon: "CalendarOff",
        labelAr: "الإجازات",
        labelEn: "Leave Management",
        roles: ["admin", "manager", "hr"],
      },
      {
        id: "hr-workload",
        icon: "BarChart3",
        labelAr: "أعباء العمل",
        labelEn: "Workload",
        roles: ["admin", "manager", "hr"],
      },
    ],
  },

  // ───── Transmittals ─────
  {
    id: "transmittals",
    icon: "Send",
    labelAr: "الإحالات",
    labelEn: "Transmittals",
    roles: ["admin", "manager", "project_manager", "secretary"],
  },

  // ───── Risks ─────
  {
    id: "risks",
    icon: "ShieldAlert",
    labelAr: "إدارة المخاطر",
    labelEn: "Risk Management",
    roles: ["admin", "manager", "project_manager", "engineer"],
  },

  // ───── Meetings ─────
  {
    id: "meetings",
    icon: "Video",
    labelAr: "الاجتماعات",
    labelEn: "Meetings",
    roles: ["admin", "manager", "project_manager", "secretary"],
  },

  // ───── Calendar ─────
  {
    id: "calendar",
    icon: "Calendar",
    labelAr: "التقويم",
    labelEn: "Calendar",
    roles: [
      "admin",
      "manager",
      "project_manager",
      "engineer",
      "draftsman",
      "secretary",
    ],
  },

  // ───── Gantt Chart ─────
  {
    id: "gantt",
    icon: "BarChart3",
    labelAr: "مخطط جانت",
    labelEn: "Gantt Chart",
    roles: ["admin", "manager", "project_manager"],
  },

  // ───── BOQ ─────
  {
    id: "boq",
    icon: "Calculator",
    labelAr: "جدول الكميات",
    labelEn: "Bill of Quantities",
    roles: ["admin", "manager", "project_manager"],
  },

  // ───── Knowledge Base ─────
  {
    id: "knowledge",
    icon: "BookMarked",
    labelAr: "قاعدة المعرفة",
    labelEn: "Knowledge Base",
    roles: ["admin", "manager", "project_manager", "engineer"],
  },

  // ───── Reports ─────
  {
    id: "reports",
    icon: "BarChart2",
    labelAr: "التقارير",
    labelEn: "Reports",
    roles: [
      "admin",
      "manager",
      "accountant",
      "hr",
      "viewer",
    ],
  },

  // ───── Approvals ─────
  {
    id: "approvals",
    icon: "ClipboardCheck",
    labelAr: "الموافقات",
    labelEn: "Approvals",
    roles: ["admin", "manager", "project_manager", "accountant"],
  },

  // ───── Notifications ─────
  {
    id: "notifications",
    icon: "Bell",
    labelAr: "الإشعارات",
    labelEn: "Notifications",
    roles: [
      "admin",
      "manager",
      "project_manager",
      "engineer",
      "secretary",
    ],
  },

  // ───── Activity Log ─────
  {
    id: "activity-log",
    icon: "Activity",
    labelAr: "سجل النشاط",
    labelEn: "Activity Log",
    roles: [
      "admin",
      "manager",
      "project_manager",
      "engineer",
      "accountant",
      "hr",
      "secretary",
    ],
  },

  // ───── Search ─────
  {
    id: "search",
    icon: "Search",
    labelAr: "البحث",
    labelEn: "Search",
    roles: [
      "admin",
      "manager",
      "project_manager",
      "engineer",
      "draftsman",
      "secretary",
    ],
  },

  // ───── AI Assistant ─────
  {
    id: "ai-assistant",
    icon: "Sparkles",
    labelAr: "المساعد الذكي",
    labelEn: "AI Assistant",
    roles: allRoles,
  },

  // ───── Automations ─────
  {
    id: "automations",
    icon: "Zap",
    labelAr: "الأتمتة",
    labelEn: "Automations",
    roles: ["admin", "manager"],
  },

  // ───── Help ─────
  {
    id: "help",
    icon: "BookOpen",
    labelAr: "المساعدة",
    labelEn: "Help",
    roles: allRoles,
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
