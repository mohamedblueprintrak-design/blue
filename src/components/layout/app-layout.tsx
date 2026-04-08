"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
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
  HardHat,
  Truck,
  Package,
  Warehouse,
  UsersRound,
  Clock,
  CalendarOff,
  BarChart3,
  ChevronDown,
  Activity,
  Sparkles,
  AlertTriangle,
  Shield,
  PenTool,
  Gavel,
  SearchCheck,
  ClipboardCheck,
  Gift,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Dashboard from "@/components/pages/dashboard";
import ProjectsList from "@/components/pages/projects";
import ProjectDetail from "@/components/pages/project-detail";
import ContractorsPage from "@/components/pages/contractors";
import ClientsPage from "@/components/pages/clients";
import EmployeesPage from "@/components/pages/employees";
import AttendancePage from "@/components/pages/attendance";
import LeavePage from "@/components/pages/leave";
import WorkloadPage from "@/components/pages/workload";
import SettingsPage from "@/components/pages/settings";
import AdminPanel from "@/components/pages/admin";
import TendersPage from "@/components/pages/tenders";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import QuickActions from "@/components/layout/quick-actions";
import WelcomeModal from "@/components/layout/welcome-modal";
import ShortcutsOverlay from "@/components/layout/shortcuts-overlay";
import SidebarStats from "@/components/layout/sidebar-stats";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

import CommissionsPage from "@/components/pages/commissions";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import LogoImage from "@/components/ui/logo-image";

// ===== ICON MAP =====
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  HardHat,
  Truck,
  Package,
  Warehouse,
  Settings,
  UsersRound,
  Clock,
  CalendarOff,
  BarChart3,
  Shield,
  Activity,
  Sparkles,
  AlertTriangle,
  Gavel,
  PenTool,
  Search,
  SearchCheck,
  ClipboardCheck,
  Gift,
  Bell,
  User,
  UserPlus,
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
      return res.json() as Promise<{ stats?: { activeProjects: number }; overdueTasksCount?: number } | null>;
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
        <span className={`font-semibold tabular-nums ${overdueTasks > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
          {overdueTasks}
        </span>
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

// ===== SIDEBAR NAV COMPONENT =====
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
              {navItems.map((item) => {
                const Icon = getIcon(item.icon);
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.includes(item.id);
                const isActive = currentPage === item.id || item.children?.some((c) => currentPage === c.id);

                return (
                  <SidebarMenuItem key={item.id}>
                    {hasChildren ? (
                      <>
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
                      <SidebarMenuButton
                        isActive={currentPage === item.id}
                        onClick={() => setCurrentPage(item.id)}
                        tooltip={t(item.labelAr, item.labelEn)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{t(item.labelAr, item.labelEn)}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
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
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t, isAr } = useLanguage();

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

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 lg:px-6">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="h-6" />
      <h1 className="text-base font-semibold text-slate-900 dark:text-white flex-1 truncate">
        {t("لوحة التحكم", "Dashboard")}
      </h1>
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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

        <Separator orientation="vertical" className="h-6 mx-1" />

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
          <DropdownMenuContent align={isAr ? "start" : "end"} className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                {roleLabelsAr[(user?.role) as Role] || user?.role}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => useNavStore.getState().setCurrentPage("settings")}>
              <Settings className="me-2 h-4 w-4" />
              {t("الإعدادات", "Settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600" onClick={handleLogout}>
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

  useKeyboardShortcuts();

  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "?" && !isInputFocused) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts]);

  useEffect(() => {
    document.documentElement.dir = isAr ? "rtl" : "ltr";
    document.documentElement.lang = isAr ? "ar" : "en";
  }, [isAr]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <Breadcrumbs language={language} />

        <main className="flex-1 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 custom-scrollbar overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Dashboard */}
              {currentPage === "dashboard" && <Dashboard language={language} />}

              {/* Projects - List or Detail */}
              {currentPage === "projects" && (
                currentProjectId ? (
                  <ProjectDetail language={language} />
                ) : (
                  <ProjectsList language={language} />
                )
              )}

              {/* Tenders */}
              {currentPage === "tenders" && <TendersPage language={language} />}

              {/* Commissions & Referrals */}
              {currentPage === "commissions" && <CommissionsPage language={language} />}

              {/* Clients */}
              {currentPage === "clients" && <ClientsPage language={language} />}

              {/* Contractors */}
              {currentPage === "contractors" && <ContractorsPage language={language} />}

              {/* Employees Section */}
              {(currentPage === "employees" || currentPage === "employees-list") && (
                <EmployeesPage language={language} />
              )}
              {currentPage === "employees-attendance" && <AttendancePage language={language} />}
              {currentPage === "employees-leave" && <LeavePage language={language} />}
              {currentPage === "employees-workload" && <WorkloadPage language={language} />}

              {/* Settings */}
              {currentPage === "settings" && <SettingsPage language={language} />}

              {/* Admin */}
              {currentPage === "admin" && <AdminPanel language={language} />}

              {/* Placeholder for undefined pages */}
              {!["dashboard", "projects", "tenders", "commissions", "clients", "contractors", "employees", "employees-list",
                 "employees-attendance", "employees-leave", "employees-workload", "settings", "admin"].includes(currentPage) && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <LogoImage size={64} className="mb-4 bg-slate-100 dark:bg-slate-800 [&>div]:opacity-40" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {isAr ? "قيد التطوير" : "Under Development"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                    {isAr ? "هذه الصفحة قيد التطوير" : "This page is under development"}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </SidebarInset>

      <QuickActions language={language} />
      {currentPage === "dashboard" && <WelcomeModal language={language} />}
      <ShortcutsOverlay language={language} open={showShortcuts} onOpenChange={setShowShortcuts} />
      <MobileBottomNav language={language} />
    </SidebarProvider>
  );
}
