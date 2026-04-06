"use client";

import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth-store";
import { useNavStore } from "@/store/nav-store";
import { getNavItems, roleLabelsAr, type NavItem, type Role } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  FolderKanban,
  List,
  Building2,
  Building,
  HardHat,
  Zap,
  Droplets,
  Landmark,
  CalendarRange,
  Calculator,
  FileEdit,
  ShieldAlert,
  CheckSquare,
  Users,
  FileSignature,
  FileText,
  MapPin,
  Eye,
  BookOpen,
  MessageSquareQuote,
  AlertTriangle,
  GanttChart,
  Wallet,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Gavel,
  PiggyBank,
  ShoppingCart,
  Truck,
  Package,
  Warehouse,
  UserCog,
  UsersRound,
  Clock,
  CalendarOff,
  BarChart3,
  BarChart2,
  Send,
  Video,
  Calendar,
  BookMarked,
  BellRing,
  Shield,
  ClipboardCheck,
  ChevronDown,
  Activity,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Dashboard from "@/components/pages/dashboard";
import TasksKanban from "@/components/pages/tasks";
import ClientsPage from "@/components/pages/clients";
import ContractsPage from "@/components/pages/contracts";
import ProjectsList from "@/components/pages/projects";
import ProjectDetail from "@/components/pages/project-detail";
import InvoicesPage from "@/components/pages/invoices";
import PaymentsPage from "@/components/pages/payments";
import ProposalsPage from "@/components/pages/proposals";
import BidsPage from "@/components/pages/bids";
import BudgetsPage from "@/components/pages/budgets";
import EmployeesPage from "@/components/pages/employees";
import AttendancePage from "@/components/pages/attendance";
import LeavePage from "@/components/pages/leave";
import WorkloadPage from "@/components/pages/workload";
import SiteVisitsPage from "@/components/pages/site-visits";
import DefectsPage from "@/components/pages/defects";
import SiteDiaryPage from "@/components/pages/site-diary";
import RFIPage from "@/components/pages/rfi";
import SubmittalsPage from "@/components/pages/submittals";
import ChangeOrdersPage from "@/components/pages/change-orders";
import TransmittalsPage from "@/components/pages/transmittals";
import RisksPage from "@/components/pages/risks";
import MeetingsPage from "@/components/pages/meetings";
import SuppliersPage from "@/components/pages/suppliers";
import InventoryPage from "@/components/pages/inventory";
import PurchaseOrdersPage from "@/components/pages/purchase-orders";
import EquipmentPage from "@/components/pages/equipment";
import DocumentsPage from "@/components/pages/documents";
import KnowledgePage from "@/components/pages/knowledge";
import ReportsPage from "@/components/pages/reports";
import SettingsPage from "@/components/pages/settings";
import AdminPanel from "@/components/pages/admin";
import AIAssistant from "@/components/pages/ai-assistant";
import GlobalSearch from "@/components/pages/search";
import CalendarPage from "@/components/pages/calendar";
import NotificationsPage from "@/components/pages/notifications";
import ActivityLog from "@/components/pages/activity-log";
import ApprovalsPage from "@/components/pages/approvals";
import GanttPage from "@/components/pages/gantt";
import BOQPage from "@/components/pages/boq";
import MunicipalityCorrespondencePage from "@/components/pages/municipality-correspondence";
import ProfilePage from "@/components/pages/profile";
import HelpPage from "@/components/pages/help";
import AutomationsPage from "@/components/pages/automations";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import QuickActions from "@/components/layout/quick-actions";
import WelcomeModal from "@/components/layout/welcome-modal";
import ShortcutsOverlay from "@/components/layout/shortcuts-overlay";
import SidebarStats from "@/components/layout/sidebar-stats";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import LogoImage from "@/components/ui/logo-image";

// ===== ICON MAP =====
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  List,
  Building2,
  Building,
  HardHat,
  Zap,
  Droplets,
  Landmark,
  CalendarRange,
  Calculator,
  FileEdit,
  ShieldAlert,
  CheckSquare,
  Users,
  FileSignature,
  FileText,
  MapPin,
  Eye,
  BookOpen,
  MessageSquareQuote,
  AlertTriangle,
  GanttChart,
  Wallet,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Gavel,
  PiggyBank,
  ShoppingCart,
  Truck,
  Package,
  Warehouse,
  UserCog,
  UsersRound,
  Clock,
  CalendarOff,
  BarChart3,
  BarChart2,
  Send,
  Video,
  Calendar,
  BookMarked,
  Bell,
  BellRing,
  Search,
  Settings,
  Shield,
  ClipboardCheck,
  Sparkles,
  Activity,
};

function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || LayoutDashboard;
}

// ===== SIDEBAR QUICK STATS =====
function SidebarQuickStats() {
  const { language } = useLanguage();

  const { data } = useQuery({
    queryKey: ["sidebar-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard?statsOnly=true");
      if (!res.ok) return null;
      return res.json() as Promise<{ stats?: { activeProjects: number; delayedProjects: number }; overdueTasksCount?: number } | null>;
    },
    refetchInterval: 60000,
  });

  const activeProjects = data?.stats?.activeProjects ?? 0;
  const overdueTasks = data?.overdueTasksCount ?? 0;

  return (
    <div className="px-2 py-2 space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-teal-500" />
          {language === "ar" ? "المشاريع النشطة" : "Active Projects"}
        </span>
        <span className="font-semibold text-teal-600 dark:text-teal-400 tabular-nums">{activeProjects}</span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          {language === "ar" ? "المهام المستحقة" : "Overdue Tasks"}
        </span>
        <span className={`font-semibold tabular-nums ${overdueTasks > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>{overdueTasks}</span>
      </div>
    </div>
  );
}

// ===== i18n Store =====
function getLanguageSnapshot(): "ar" | "en" {
  if (typeof window === "undefined") return "ar";
  return (localStorage.getItem("blueprint-lang") as "ar" | "en") || "ar";
}

function getLanguageServerSnapshot(): "ar" | "en" {
  return "ar";
}

function subscribeToLanguage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener("blueprint-lang-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("blueprint-lang-change", callback);
  };
}

function useLanguage() {
  const language = useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, getLanguageServerSnapshot);

  const toggleLanguage = () => {
    const next = language === "ar" ? "en" : "ar";
    localStorage.setItem("blueprint-lang", next);
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = next;
    window.dispatchEvent(new Event("blueprint-lang-change"));
  };

  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  return { language, toggleLanguage, t, isAr: language === "ar" };
}

// ===== SIDEBAR NAV COMPONENTS =====
function AppSidebar() {
  const { user } = useAuthStore();
  const { currentPage, setCurrentPage } = useNavStore();
  const { language, t, isAr } = useLanguage();
  const [expandedItems, setExpandedItems] = useState<string[]>(["projects"]);
  const { state } = useSidebar();

  if (!user) return null;

  const navItems = getNavItems(user.role as Role);
  const sidebarSide = isAr ? "right" : "left";

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNavClick = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpanded(item.id);
    } else {
      setCurrentPage(item.id);
    }
  };

  return (
    <Sidebar side={sidebarSide} collapsible="icon" className="border-slate-200 dark:border-slate-700">
      <SidebarHeader className="p-3">
        <div className={cn(
          "flex items-center gap-3 px-2 py-1",
          state === "collapsed" && "justify-center px-0"
        )}>
          <LogoImage size={36} className="shrink-0 shadow-md shadow-teal-500/20" />
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                BluePrint
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                {t("نظام إدارة الاستشارات", "Consultancy Management")}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="mx-3 w-auto" />

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item, itemIdx) => {
                const Icon = getIcon(item.icon);
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.includes(item.id);
                const isActive =
                  currentPage === item.id ||
                  item.children?.some((c) => currentPage === c.id);

                // Keyboard shortcut for first 6 top-level items
                const shortcutKey = itemIdx < 6 ? String(itemIdx + 1) : null;

                return (
                  <SidebarMenuItem key={item.id}>
                    {hasChildren ? (
                      <>
                        <div className="relative group">
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => handleNavClick(item)}
                            tooltip={t(item.labelAr, item.labelEn)}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{t(item.labelAr, item.labelEn)}</span>
                            <ChevronDown
                              className={cn(
                                "ms-auto h-4 w-4 shrink-0 transition-transform duration-200",
                                isExpanded && "rotate-180"
                              )}
                            />
                          </SidebarMenuButton>
                          {shortcutKey && state !== "collapsed" && (
                            <kbd className="absolute bottom-0.5 start-1 text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none select-none">
                              {shortcutKey}
                            </kbd>
                          )}
                        </div>
                        {isExpanded && (
                          <SidebarMenuSub>
                            {item.children!.map((child) => {
                              const ChildIcon = getIcon(child.icon);
                              return (
                                <SidebarMenuSubItem key={child.id}>
                                  <SidebarMenuSubButton
                                    isActive={currentPage === child.id}
                                    onClick={() => setCurrentPage(child.id)}
                                  >
                                    <ChildIcon className="h-3.5 w-3.5" />
                                    <span>{t(child.labelAr, child.labelEn)}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        )}
                      </>
                    ) : (
                      <div className="relative group">
                        <SidebarMenuButton
                          isActive={currentPage === item.id}
                          onClick={() => setCurrentPage(item.id)}
                          tooltip={t(item.labelAr, item.labelEn)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{t(item.labelAr, item.labelEn)}</span>
                        </SidebarMenuButton>
                        {shortcutKey && state !== "collapsed" && (
                          <kbd className="absolute bottom-0.5 start-1 text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none select-none">
                            {shortcutKey}
                          </kbd>
                        )}
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {/* Quick Stats - only when sidebar is expanded */}
        {state !== "collapsed" && <SidebarQuickStats />}
        {state !== "collapsed" && <SidebarStats />}
        <Separator className="mb-3" />
        <div className={cn(
          "flex items-center gap-3 px-2 py-1",
          state === "collapsed" && "justify-center px-0"
        )}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {state !== "collapsed" && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate leading-none">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">
                {roleLabelsAr[user.role as Role] || user.role}
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

// ===== HEADER COMPONENT =====
function AppHeader() {
  const { user, logout } = useAuthStore();
  const { currentPage } = useNavStore();
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t, isAr } = useLanguage();

  // Live notification count via API
  const { data: notifData } = useQuery({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/count");
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    refetchInterval: 30000,
  });
  const notifCount = notifData?.count ?? 0;

  const pageLabels: Record<string, { ar: string; en: string }> = {
    dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
    projects: { ar: "المشاريع", en: "Projects" },
    tasks: { ar: "المهام", en: "Tasks" },
    clients: { ar: "العملاء", en: "Clients" },
    contracts: { ar: "العقود", en: "Contracts" },
    documents: { ar: "المستندات", en: "Documents" },
    site: { ar: "إدارة الموقع", en: "Site Management" },
    financial: { ar: "المالية", en: "Financial" },
    procurement: { ar: "المشتريات", en: "Procurement" },
    hr: { ar: "الموارد البشرية", en: "Human Resources" },
    transmittals: { ar: "الإحالات", en: "Transmittals" },
    risks: { ar: "إدارة المخاطر", en: "Risk Management" },
    meetings: { ar: "الاجتماعات", en: "Meetings" },
    calendar: { ar: "التقويم", en: "Calendar" },
    knowledge: { ar: "قاعدة المعرفة", en: "Knowledge Base" },
    reports: { ar: "التقارير", en: "Reports" },
    approvals: { ar: "الموافقات", en: "Approvals" },
    notifications: { ar: "الإشعارات", en: "Notifications" },
    "activity-log": { ar: "سجل النشاط", en: "Activity Log" },
    search: { ar: "البحث", en: "Search" },
    settings: { ar: "الإعدادات", en: "Settings" },
    admin: { ar: "إدارة النظام", en: "System Admin" },
    "projects-overview": { ar: "نظرة عامة على المشاريع", en: "Projects Overview" },
    "projects-architectural": { ar: "التصميم المعماري", en: "Architectural Design" },
    "projects-structural": { ar: "التصميم الإنشائي", en: "Structural Design" },
    "site-visits": { ar: "زيارات الموقع", en: "Site Visits" },
    "site-diary": { ar: "يومية الموقع", en: "Site Diary" },
    "site-rfi": { ar: "طلبات المعلومات", en: "RFI" },
    "site-defects": { ar: "العيوب", en: "Defects" },
    "site-submittals": { ar: "المستندات المقدمة", en: "Submittals" },
    "site-change-orders": { ar: "أوامر التغيير", en: "Change Orders" },
    "financial-invoices": { ar: "الفواتير", en: "Invoices" },
    "financial-payments": { ar: "المدفوعات", en: "Payments" },
    "financial-proposals": { ar: "العروض المالية", en: "Proposals" },
    "financial-bids": { ar: "العطاءات", en: "Bids" },
    "financial-budgets": { ar: "الميزانيات", en: "Budgets" },
    "hr-employees": { ar: "الموظفون", en: "Employees" },
    "hr-attendance": { ar: "الحضور والانصراف", en: "Attendance" },
    "hr-leave": { ar: "الإجازات", en: "Leave Management" },
    "hr-workload": { ar: "أعباء العمل", en: "Workload" },
    "procurement-suppliers": { ar: "الموردين", en: "Suppliers" },
    "procurement-inventory": { ar: "المخزون", en: "Inventory" },
    "procurement-purchase-orders": { ar: "أوامر الشراء", en: "Purchase Orders" },
    "procurement-equipment": { ar: "المعدات", en: "Equipment" },
    "ai-assistant": { ar: "المساعد الذكي", en: "AI Assistant" },
    gantt: { ar: "مخطط جانت", en: "Gantt Chart" },
    boq: { ar: "جدول الكميات", en: "Bill of Quantities" },
    municipality: { ar: "المراسلات البلدية", en: "Municipality Correspondence" },
    help: { ar: "المساعدة", en: "Help" },
    profile: { ar: "الملف الشخصي", en: "Profile" },
    automations: { ar: "الأتمتة", en: "Automations" },
  };

  const pageTitle = pageLabels[currentPage]
    ? t(pageLabels[currentPage].ar, pageLabels[currentPage].en)
    : t("لوحة التحكم", "Dashboard");

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 lg:px-6">
      {/* Sidebar Trigger */}
      <SidebarTrigger className="-ms-1" />

      {/* Separator */}
      <Separator orientation="vertical" className="h-6" />

      {/* Page Title */}
      <h1 className="text-base font-semibold text-slate-900 dark:text-white flex-1 truncate">
        {pageTitle}
      </h1>

      {/* Right-side actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 btn-press"
                onClick={() => useNavStore.getState().setCurrentPage("search")}
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t("بحث", "Search")} (Ctrl+K)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Language Toggle */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 btn-press"
                onClick={toggleLanguage}
              >
                <Globe className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{language === "ar" ? "English" : "عربي"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Dark Mode Toggle */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 btn-press"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t("الوضع الليلي", "Dark Mode")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notifications */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 btn-press"
                onClick={() => useNavStore.getState().setCurrentPage("notifications")}
              >
                <Bell className="h-4 w-4" />
                {notifCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-0 rounded-full">
                    {notifCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t("الإشعارات", "Notifications")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                {user?.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isAr ? "start" : "end"}
            className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                {roleLabelsAr[(user?.role) as Role] || user?.role}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => useNavStore.getState().setCurrentPage("profile")}
            >
              <User className="me-2 h-4 w-4" />
              {t("الملف الشخصي", "Profile")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => useNavStore.getState().setCurrentPage("settings")}
            >
              <Settings className="me-2 h-4 w-4" />
              {t("الإعدادات", "Settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="me-2 h-4 w-4" />
              {t("تسجيل الخروج", "Sign Out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ===== MAIN APP LAYOUT =====
interface AppLayoutProps {
  language: "ar" | "en";
}

export default function AppLayout({ language }: AppLayoutProps) {
  const { currentPage, currentProjectId, setCurrentPage, setCurrentProjectId } = useNavStore();
  const isAr = language === "ar";

  // Register global keyboard shortcuts (Ctrl+K → search, Escape → close)
  useKeyboardShortcuts();

  // Shortcuts overlay state
  const [showShortcuts, setShowShortcuts] = useState(false);

  // ? key and number key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // ? key → toggle shortcuts overlay (only when not in input)
      if (e.key === "?" && !isInputFocused) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      // Escape → close shortcuts overlay
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
        return;
      }

      // Number keys 1-6 for quick navigation (only when not in input)
      if (!isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const numKey = parseInt(e.key);
        if (numKey >= 1 && numKey <= 6) {
          e.preventDefault();
          const pageMap: Record<number, string> = {
            1: "dashboard",
            2: "projects",
            3: "tasks",
            4: "clients",
            5: "financial-invoices",
            6: "calendar",
          };
          const page = pageMap[numKey];
          if (page) {
            setCurrentProjectId(null);
            setCurrentPage(page);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts, setCurrentPage, setCurrentProjectId]);

  useEffect(() => {
    document.documentElement.dir = isAr ? "rtl" : "ltr";
    document.documentElement.lang = isAr ? "ar" : "en";
  }, [isAr]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />

        {/* Breadcrumb Navigation - shown when not on dashboard */}
        <Breadcrumbs language={language} />

        {/* Command Palette Overlay - renders above everything */}
        {currentPage === "search" && <GlobalSearch language={language} />}

        <main className="flex-1 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 custom-scrollbar overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Dashboard Content */}
              {currentPage === "dashboard" && <Dashboard language={language} />}

              {/* Projects List & Detail */}
              {(currentPage === "projects" || currentPage.startsWith("projects-")) && (
                currentProjectId ? (
                  <ProjectDetail language={language} />
                ) : (
                  <ProjectsList language={language} />
                )
              )}

              {/* Tasks Kanban */}
              {currentPage === "tasks" && <TasksKanban language={language} />}

              {/* Clients */}
              {currentPage === "clients" && <ClientsPage language={language} />}

              {/* Contracts */}
              {currentPage === "contracts" && <ContractsPage language={language} />}

              {/* Financial Modules */}
              {(currentPage === "financial" || currentPage === "financial-invoices") && <InvoicesPage language={language} />}
              {currentPage === "financial-payments" && <PaymentsPage language={language} />}
              {currentPage === "financial-proposals" && <ProposalsPage language={language} />}
              {currentPage === "financial-bids" && <BidsPage language={language} />}
              {currentPage === "financial-budgets" && <BudgetsPage language={language} />}

              {/* HR Modules */}
              {(currentPage === "hr" || currentPage === "hr-employees") && <EmployeesPage language={language} />}
              {currentPage === "hr-attendance" && <AttendancePage language={language} />}
              {currentPage === "hr-leave" && <LeavePage language={language} />}
              {currentPage === "hr-workload" && <WorkloadPage language={language} />}

              {/* Procurement Modules */}
              {(currentPage === "procurement" || currentPage === "procurement-suppliers") && <SuppliersPage language={language} />}
              {currentPage === "procurement-inventory" && <InventoryPage language={language} />}
              {currentPage === "procurement-purchase-orders" && <PurchaseOrdersPage language={language} />}
              {currentPage === "procurement-equipment" && <EquipmentPage language={language} />}

              {/* Site Management Modules */}
              {(currentPage === "site" || currentPage === "site-visits") && <SiteVisitsPage language={language} />}
              {currentPage === "site-diary" && <SiteDiaryPage language={language} />}
              {currentPage === "site-rfi" && <RFIPage language={language} />}
              {currentPage === "site-defects" && <DefectsPage language={language} />}
              {currentPage === "site-submittals" && <SubmittalsPage language={language} />}
              {currentPage === "site-change-orders" && <ChangeOrdersPage language={language} />}

              {/* Transmittals, Risks, Meetings */}
              {currentPage === "transmittals" && <TransmittalsPage language={language} />}
              {currentPage === "risks" && <RisksPage language={language} />}
              {currentPage === "meetings" && <MeetingsPage language={language} />}

              {/* Documents */}
              {currentPage === "documents" && <DocumentsPage language={language} />}

              {/* Knowledge Base */}
              {currentPage === "knowledge" && <KnowledgePage language={language} />}

              {/* Reports */}
              {currentPage === "reports" && <ReportsPage language={language} />}

              {/* Settings */}
              {currentPage === "settings" && <SettingsPage language={language} />}

              {/* Admin Panel */}
              {currentPage === "admin" && <AdminPanel language={language} />}

              {/* AI Assistant */}
              {currentPage === "ai-assistant" && <AIAssistant language={language} />}

              {/* Global Search is rendered as overlay above - see AppLayout */}

              {/* Calendar */}
              {currentPage === "calendar" && <CalendarPage language={language} />}

              {/* Approvals */}
              {currentPage === "approvals" && <ApprovalsPage language={language} />}

              {/* Notifications */}
              {currentPage === "notifications" && <NotificationsPage language={language} />}

              {/* Activity Log */}
              {currentPage === "activity-log" && <ActivityLog language={language} />}

              {/* Gantt Chart */}
              {currentPage === "gantt" && <GanttPage language={language} />}

              {/* BOQ */}
              {currentPage === "boq" && <BOQPage language={language} />}

              {/* Municipality Correspondence */}
              {(currentPage === "municipality" || currentPage === "site-municipality") && <MunicipalityCorrespondencePage language={language} />}

              {/* Profile */}
              {currentPage === "profile" && <ProfilePage language={language} />}

              {/* Help */}
              {currentPage === "help" && <HelpPage language={language} />}

              {/* Automations */}
              {currentPage === "automations" && <AutomationsPage language={language} />}

              {/* Other pages - placeholder */}
              {currentPage !== "dashboard" &&
                !currentPage.startsWith("projects") &&
                currentPage !== "tasks" &&
                currentPage !== "clients" &&
                currentPage !== "contracts" &&
                currentPage !== "financial" &&
                !currentPage.startsWith("financial-") &&
                currentPage !== "site" &&
                !currentPage.startsWith("site-") &&
                currentPage !== "hr" &&
                !currentPage.startsWith("hr-") &&
                currentPage !== "procurement" &&
                !currentPage.startsWith("procurement-") &&
                currentPage !== "transmittals" &&
                currentPage !== "risks" &&
                currentPage !== "meetings" &&
                currentPage !== "documents" &&
                currentPage !== "knowledge" &&
                currentPage !== "reports" &&
                currentPage !== "settings" &&
                currentPage !== "admin" &&
                currentPage !== "ai-assistant" &&
                currentPage !== "search" &&
                currentPage !== "calendar" &&
                currentPage !== "notifications" &&
                currentPage !== "approvals" &&
                currentPage !== "activity-log" &&
                currentPage !== "profile" &&
                currentPage !== "help" &&
                currentPage !== "automations" &&
                currentPage !== "gantt" &&
                currentPage !== "boq" &&
                currentPage !== "municipality" &&
                currentPage !== "site-municipality" && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <LogoImage size={64} className="mb-4 bg-slate-100 dark:bg-slate-800 [&>div]:opacity-40" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {isAr ? "قيد التطوير" : "Under Development"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                    {isAr
                      ? "هذه الصفحة قيد التطوير حالياً وستكون متاحة قريباً"
                      : "This page is currently under development and will be available soon"}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </SidebarInset>

      {/* Quick Actions FAB */}
      <QuickActions language={language} />

      {/* Welcome Onboarding Modal */}
      {currentPage === "dashboard" && <WelcomeModal language={language} />}

      {/* Toast Notifications - handled by root layout */}

      {/* Keyboard Shortcuts Overlay */}
      <ShortcutsOverlay language={language} open={showShortcuts} onOpenChange={setShowShortcuts} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav language={language} />
    </SidebarProvider>
  );
}


