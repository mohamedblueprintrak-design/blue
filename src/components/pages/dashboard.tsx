"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { useNavStore } from "@/store/nav-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FolderKanban,
  Receipt,
  TrendingUp,
  CheckSquare,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  ShieldCheck,
  Eye,
  Calendar,
  Users,
  Activity,
  CheckCircle2,
  FileText,
  CreditCard,
  Upload,
  Package,
  UserPlus,
  CircleDot,
  ListTodo,
  CheckCheck,
  Server,
  HardDrive,
  Database,
  MessageCircle,
  ShieldAlert,
  Bell,
  Plus,
  UserRoundPlus,
  Briefcase,
  Building,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ProjectHealthWidget from "@/components/pages/project-health-widget";
import { useDashboardLayout, WidgetSlot, DashboardLayoutManager } from "@/components/pages/dashboard-layout-manager";

// ===== Types =====
interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
}

interface DashboardInvoices {
  outstandingTotal: number;
  outstandingCount: number;
  overdueCount: number;
}

interface DashboardRevenue {
  monthly: Array<{
    month: string;
    labelAr: string;
    labelEn: string;
    revenue: number;
  }>;
  thisMonth: number;
  lastMonth: number;
  change: number;
}

interface RecentProject {
  id: string;
  number: string;
  name: string;
  nameEn: string;
  clientName: string;
  clientCompany: string;
  status: string;
  progress: number;
  updatedAt: string;
}

interface UpcomingTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  isOverdue: boolean;
  projectName: string;
  projectNumber: string;
  assigneeName: string;
}

interface DepartmentProgressItem {
  key: string;
  labelAr: string;
  labelEn: string;
  total: number;
  completed: number;
  progress: number;
  color: string;
}

interface DashboardAlert {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  timestamp: string;
  severity: "high" | "medium" | "low";
}

interface DashboardData {
  stats: DashboardStats;
  invoices: DashboardInvoices;
  revenue: DashboardRevenue;
  recentProjects: RecentProject[];
  upcomingTasks: UpcomingTask[];
  activeTasksCount: number;
  overdueTasksCount: number;
  departmentProgress: DepartmentProgressItem[];
  alerts: DashboardAlert[];
}

// Mock data for activity feed
interface ActivityItem {
  id: string;
  userName: string;
  actionAr: string;
  actionEn: string;
  timestamp: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

// Mock data for team performance
interface TeamMember {
  name: string;
  completion: number;
  tasksTotal: number;
  tasksDone: number;
  avatarColor: string;
}

// ===== Helpers =====
function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US").format(num);
}

function timeAgo(dateStr: string, isAr: boolean): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return isAr ? "الآن" : "Just now";
  if (diffMins < 60) return isAr ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
  if (diffHours < 24) return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  if (diffDays === 1) return isAr ? "أمس" : "Yesterday";
  if (diffDays < 7) return isAr ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;
  if (diffDays < 30) return isAr ? `منذ ${Math.floor(diffDays / 7)} أسابيع` : `${Math.floor(diffDays / 7)}w ago`;
  return isAr ? `منذ ${Math.floor(diffDays / 30)} أشهر` : `${Math.floor(diffDays / 30)}mo ago`;
}

function daysUntil(dueDate: string | null): number {
  if (!dueDate) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-orange-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getStatusBadge(status: string, isAr: boolean) {
  const map: Record<string, { labelAr: string; labelEn: string; dotColor: string; className: string }> = {
    active: { labelAr: "نشط", labelEn: "Active", dotColor: "bg-emerald-500", className: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" },
    completed: { labelAr: "مكتمل", labelEn: "Completed", dotColor: "bg-teal-500", className: "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800" },
    delayed: { labelAr: "متأخر", labelEn: "Delayed", dotColor: "bg-red-500", className: "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800" },
    on_hold: { labelAr: "معلق", labelEn: "On Hold", dotColor: "bg-amber-500", className: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800" },
    cancelled: { labelAr: "ملغى", labelEn: "Cancelled", dotColor: "bg-slate-400", className: "bg-slate-50 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700" },
  };
  const item = map[status] || map.active;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full", item.className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", item.dotColor)} />
      {isAr ? item.labelAr : item.labelEn}
    </span>
  );
}

function getAlertIcon(severity: "high" | "medium" | "low"): LucideIcon {
  switch (severity) {
    case "high": return XCircle;
    case "medium": return AlertTriangle;
    default: return AlertCircle;
  }
}

function getAlertIconColor(severity: "high" | "medium" | "low"): string {
  switch (severity) {
    case "high": return "text-red-500 bg-red-100 dark:bg-red-950/50";
    case "medium": return "text-amber-500 bg-amber-100 dark:bg-amber-950/50";
    default: return "text-blue-500 bg-blue-100 dark:bg-blue-950/50";
  }
}

function getAlertBorderColor(severity: "high" | "medium" | "low"): string {
  switch (severity) {
    case "high": return "border-s-4 border-s-red-400 dark:border-s-red-600 border-slate-200 dark:border-slate-700/50";
    case "medium": return "border-s-4 border-s-amber-400 dark:border-s-amber-600 border-slate-200 dark:border-slate-700/50";
    default: return "border-s-4 border-s-blue-400 dark:border-s-blue-600 border-slate-200 dark:border-slate-700/50";
  }
}

function getAlertBgColor(severity: "high" | "medium" | "low"): string {
  switch (severity) {
    case "high": return "bg-red-50/50 dark:bg-red-950/10";
    case "medium": return "bg-amber-50/50 dark:bg-amber-950/10";
    default: return "bg-blue-50/50 dark:bg-blue-950/10";
  }
}

// ===== Mock Activity Data =====
function getMockActivities(isAr: boolean): ActivityItem[] {
  const now = new Date();
  const h = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();
  const d = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

  return [
    {
      id: "1",
      userName: isAr ? "أحمد المنصوري" : "Ahmed Al Mansouri",
      actionAr: "أنشأ مشروعاً جديداً: فيلا المروج",
      actionEn: "Created a new project: Al Murouj Villa",
      timestamp: h(1),
      icon: FolderKanban,
      iconBg: "bg-teal-100 dark:bg-teal-950/50",
      iconColor: "text-teal-600 dark:text-teal-400",
      borderColor: "border-s-teal-400 dark:border-s-teal-600",
    },
    {
      id: "2",
      userName: isAr ? "فاطمة الشامسي" : "Fatima Al Shamsi",
      actionAr: "أكملت مهمة: مراجعة المخططات الإنشائية",
      actionEn: "Completed task: Review structural drawings",
      timestamp: h(2),
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-s-emerald-400 dark:border-s-emerald-600",
    },
    {
      id: "3",
      userName: isAr ? "محمد الكعبي" : "Mohammed Al Kaabi",
      actionAr: "تم استلام دفعة: 45,000 د.إ",
      actionEn: "Payment received: AED 45,000",
      timestamp: h(4),
      icon: CreditCard,
      iconBg: "bg-blue-100 dark:bg-blue-950/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-s-blue-400 dark:border-s-blue-600",
    },
    {
      id: "4",
      userName: isAr ? "سارة البلوشي" : "Sara Al Balushi",
      actionAr: "رفعت مستند: تقرير التربة - موقع المعيصرة",
      actionEn: "Uploaded document: Soil Report - Al Maisira Site",
      timestamp: h(5),
      icon: Upload,
      iconBg: "bg-violet-100 dark:bg-violet-950/50",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderColor: "border-s-violet-400 dark:border-s-violet-600",
    },
    {
      id: "5",
      userName: isAr ? "خالد الظاهري" : "Khalid Al Dhaheri",
      actionAr: "أضاف موظفاً جديداً: علي الحداد",
      actionEn: "Added new employee: Ali Al Haddad",
      timestamp: d(1),
      icon: UserPlus,
      iconBg: "bg-sky-100 dark:bg-sky-950/50",
      iconColor: "text-sky-600 dark:text-sky-400",
      borderColor: "border-s-sky-400 dark:border-s-sky-600",
    },
    {
      id: "6",
      userName: isAr ? "نورة العتيبي" : "Noura Al Otaibi",
      actionAr: "تمت الموافقة على أمر الشراء: مواد بناء",
      actionEn: "Purchase order approved: Construction materials",
      timestamp: d(1),
      icon: Package,
      iconBg: "bg-amber-100 dark:bg-amber-950/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      borderColor: "border-s-amber-400 dark:border-s-amber-600",
    },
    {
      id: "7",
      userName: isAr ? "عبدالله المري" : "Abdullah Al Marri",
      actionAr: "حدّث تقدّم المشروع: برج النخيل إلى 75%",
      actionEn: "Updated project progress: Palm Tower to 75%",
      timestamp: d(2),
      icon: Activity,
      iconBg: "bg-rose-100 dark:bg-rose-950/50",
      iconColor: "text-rose-600 dark:text-rose-400",
      borderColor: "border-s-rose-400 dark:border-s-rose-600",
    },
    {
      id: "8",
      userName: isAr ? "مريم الرميثي" : "Maryam Al Rumaithi",
      actionAr: "أنشأت عرض سعر: مشروع الواحة السكني",
      actionEn: "Created proposal: Al Wahat Residential Project",
      timestamp: d(2),
      icon: FileText,
      iconBg: "bg-cyan-100 dark:bg-cyan-950/50",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      borderColor: "border-s-cyan-400 dark:border-s-cyan-600",
    },
  ];
}

// ===== Mock Team Performance Data =====
function getMockTeamPerformance(isAr: boolean): TeamMember[] {
  return [
    { name: isAr ? "أحمد المنصوري" : "Ahmed Al M.", completion: 92, tasksTotal: 24, tasksDone: 22, avatarColor: "" },
    { name: isAr ? "فاطمة الشامسي" : "Fatima Al S.", completion: 85, tasksTotal: 20, tasksDone: 17, avatarColor: "" },
    { name: isAr ? "محمد الكعبي" : "Mohammed Al K.", completion: 78, tasksTotal: 18, tasksDone: 14, avatarColor: "" },
    { name: isAr ? "سارة البلوشي" : "Sara Al B.", completion: 71, tasksTotal: 14, tasksDone: 10, avatarColor: "" },
    { name: isAr ? "خالد الظاهري" : "Khalid Al D.", completion: 65, tasksTotal: 20, tasksDone: 13, avatarColor: "" },
  ];
}

// ===== Mini Progress Ring =====
function MiniProgressRing({ progress, size = 40, strokeWidth = 3.5, className }: { progress: number; size?: number; strokeWidth?: number; className?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const color = progress >= 80 ? "#10b981" : progress >= 50 ? "#133371" : progress >= 25 ? "#f59e0b" : "#ef4444";

  return (
    <svg className={cn("shrink-0 -rotate-90", className)} width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-100 dark:text-slate-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

// ===== Chart Colors =====
const CHART_BAR_COLOR = "#133371";
const CHART_BAR_HOVER_COLOR = "#0e2a5c";

// ===== Custom Chart Tooltip =====
function ChartTooltip({ active, payload, label, isAr }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  isAr: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
        {formatCurrency(payload[0].value, isAr ? "ar" : "en")} AED
      </p>
    </div>
  );
}

// ===== Loading Skeleton =====
function DashboardSkeleton({ isAr }: { isAr: boolean }) {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-xl border-slate-200 dark:border-slate-700/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Department Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-xl border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Table + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-xl border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===== My Tasks Widget =====
interface MyTaskItem {
  id: string;
  title: string;
  titleEn: string;
  priority: string;
  status: string;
  dueDate: string | null;
  projectName: string;
  projectNameEn: string;
}

function getMockMyTasks(isAr: boolean): MyTaskItem[] {
  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 86400000).toISOString().split("T")[0];

  return [
    { id: "mt1", title: isAr ? "مراجعة المخططات الإنشائية" : "Review structural drawings", titleEn: "Review structural drawings", priority: "urgent", status: "in_progress", dueDate: d(1), projectName: isAr ? "برج النخيل" : "Palm Tower", projectNameEn: "Palm Tower" },
    { id: "mt2", title: isAr ? "إعداد تقرير التربة" : "Prepare soil report", titleEn: "Prepare soil report", priority: "high", status: "todo", dueDate: d(3), projectName: isAr ? "فيلات المروج" : "Al Murouj Villas", projectNameEn: "Al Murouj Villas" },
    { id: "mt3", title: isAr ? "تنسيق مع البلدية" : "Coordinate with municipality", titleEn: "Coordinate with municipality", priority: "normal", status: "todo", dueDate: d(5), projectName: isAr ? "مجمع الواحة" : "Al Wahat Complex", projectNameEn: "Al Wahat Complex" },
    { id: "mt4", title: isAr ? "تحديث جدول المهام" : "Update task schedule", titleEn: "Update task schedule", priority: "high", status: "in_progress", dueDate: d(-2), projectName: isAr ? "مدرسة السلام" : "Al Salam School", projectNameEn: "Al Salam School" },
    { id: "mt5", title: isAr ? "فحص مواد البناء" : "Inspect construction materials", titleEn: "Inspect construction materials", priority: "normal", status: "todo", dueDate: d(7), projectName: isAr ? "مسجد الفجر" : "Al Fajr Mosque", projectNameEn: "Al Fajr Mosque" },
  ];
}

function MyTasksWidget({ language }: { language: "ar" | "en" }) {
  const isAr = language === "ar";
  const { user } = useAuthStore();
  const { setCurrentPage } = useNavStore();
  const queryClient = useQueryClient();

  const { data: apiTasks, isError } = useQuery<MyTaskItem[]>({
    queryKey: ["my-tasks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const params = new URLSearchParams();
      params.set("assigneeId", user.id);
      params.set("status", "todo,in_progress");
      params.set("limit", "5");
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return (json.tasks || []).map((task: Record<string, unknown>) => ({
        id: task.id,
        title: task.title || "",
        titleEn: task.titleEn || task.title || "",
        priority: task.priority || "normal",
        status: task.status || "todo",
        dueDate: task.dueDate || null,
        projectName: (task.project as Record<string, unknown> | undefined)?.name || "",
        projectNameEn: (task.project as Record<string, unknown> | undefined)?.nameEn || (task.project as Record<string, unknown> | undefined)?.name || "",
      }));
    },
    enabled: !!user?.id,
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
  });

  const tasks = (apiTasks && apiTasks.length > 0 ? apiTasks : getMockMyTasks(isAr)).slice(0, 5);

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-amber-500";
      default: return "bg-slate-400";
    }
  };

  const getDaysInfo = (dueDate: string | null) => {
    if (!dueDate) return { days: 999, label: "", badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let label: string;
    let badgeClass: string;
    if (days < 0) {
      label = isAr ? `متأخر ${Math.abs(days)} يوم` : `${Math.abs(days)}d overdue`;
      badgeClass = "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800";
    } else if (days === 0) {
      label = isAr ? "اليوم" : "Today";
      badgeClass = "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
    } else if (days === 1) {
      label = isAr ? "غداً" : "Tomorrow";
      badgeClass = "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
    } else if (days <= 3) {
      label = isAr ? `${days} أيام` : `${days}d`;
      badgeClass = "bg-amber-100/70 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 border border-amber-200/60 dark:border-amber-800/60";
    } else {
      label = isAr ? `${days} أيام` : `${days}d`;
      badgeClass = "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";
    }
    return { days, label, badgeClass };
  };

  const pendingCount = tasks.filter((t) => t.status !== "done").length;

  return (
    <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-shadow">
      {/* Teal gradient header */}
      <div className="bg-gradient-to-l from-teal-600 to-teal-700 dark:from-teal-800 dark:to-teal-900 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ListTodo className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isAr ? "مهامي" : "My Tasks"}
              </h3>
              <p className="text-[11px] text-white/70">
                {isAr ? `${pendingCount} مهمة معلقة` : `${pendingCount} tasks pending`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage("tasks")}
            className="text-xs text-white/80 hover:text-white transition-colors flex items-center gap-1"
          >
            {isAr ? "عرض الكل" : "View All"}
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Task List */}
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.map((task, idx) => {
            const { days, label, badgeClass } = getDaysInfo(task.dueDate);
            const isOverdue = days < 0;
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30",
                  idx % 2 === 1 && "bg-slate-50/40 dark:bg-slate-800/10"
                )}
              >
                {/* Priority dot */}
                <span className={cn("w-2 h-2 rounded-full shrink-0", getPriorityDot(task.priority))} />

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {isAr ? task.title : task.titleEn || task.title}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {isAr ? task.projectName : task.projectNameEn || task.projectName}
                  </p>
                </div>

                {/* Due date badge */}
                {label && (
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                    badgeClass,
                    isOverdue && "animate-pulse"
                  )}>
                    <Clock className="h-2.5 w-2.5" />
                    {label}
                  </span>
                )}

                {/* Mark done button */}
                <button
                  onClick={() => completeMutation.mutate(task.id)}
                  className="h-6 w-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 hover:bg-teal-50 hover:border-teal-500 dark:hover:bg-teal-950/30 dark:hover:border-teal-500 transition-colors group"
                  title={isAr ? "تمت المهمة" : "Mark done"}
                >
                  <CheckCheck className="h-3 w-3 text-slate-400 group-hover:text-teal-500 transition-colors" />
                </button>
              </div>
            );
          })}
        </div>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isAr ? "لا توجد مهام معلقة!" : "No pending tasks!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Main Dashboard Component =====
export default function Dashboard({ language }: { language: "ar" | "en" }) {
  const isAr = language === "ar";
  const { user } = useAuthStore();
  const { setCurrentPage, setCurrentProjectId } = useNavStore();

  const layout = useDashboardLayout();

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <DashboardSkeleton isAr={isAr} />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {isAr ? "خطأ في تحميل البيانات" : "Error loading data"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isAr ? "تعذر تحميل بيانات لوحة التحكم" : "Failed to load dashboard data"}
        </p>
      </div>
    );
  }

  const { stats, invoices, revenue, recentProjects, upcomingTasks, departmentProgress, alerts, activeTasksCount, overdueTasksCount } = data;

  // Mock data
  const activities = getMockActivities(isAr);
  const teamPerformance = getMockTeamPerformance(isAr);

  // ===== Mock Chart Data =====
  const projectStatusData = [
    { name: isAr ? "نشط" : "Active", value: stats.activeProjects, color: "#133371" },
    { name: isAr ? "مكتمل" : "Completed", value: stats.completedProjects, color: "#10b981" },
    { name: isAr ? "متأخر" : "Delayed", value: stats.delayedProjects, color: "#ef4444" },
    { name: isAr ? "معلق" : "On Hold", value: stats.totalProjects - stats.activeProjects - stats.completedProjects - stats.delayedProjects, color: "#f59e0b" },
  ];

  const taskTrendData = [
    { month: isAr ? "يناير" : "Jan", created: 45, completed: 38 },
    { month: isAr ? "فبراير" : "Feb", created: 52, completed: 48 },
    { month: isAr ? "مارس" : "Mar", created: 38, completed: 42 },
    { month: isAr ? "أبريل" : "Apr", created: 61, completed: 55 },
    { month: isAr ? "مايو" : "May", created: 49, completed: 51 },
    { month: isAr ? "يونيو" : "Jun", created: 56, completed: 47 },
  ];

  const budgetOverviewData = [
    { name: isAr ? "برج النخيل" : "Palm Tower", budget: 4200000 },
    { name: isAr ? "فيلات المروج" : "Al Murouj Villas", budget: 3100000 },
    { name: isAr ? "مجمع الواحة" : "Al Wahat Complex", budget: 2800000 },
    { name: isAr ? "مدرسة السلام" : "Al Salam School", budget: 1950000 },
    { name: isAr ? "مسجد الفجر" : "Al Fajr Mosque", budget: 1200000 },
  ];

  const handleProjectClick = (projectId: string) => {
    setCurrentProjectId(projectId);
    setCurrentPage("projects-overview");
  };

  // Stat cards config
  const statCards = [
    {
      label: isAr ? "إجمالي المشاريع" : "Total Projects",
      value: formatNumber(stats.totalProjects, language),
      icon: FolderKanban,
      gradientFrom: "from-teal-500",
      gradientTo: "to-teal-600",
      borderAccent: "border-s-teal-500",
      bgColor: "bg-teal-100 dark:bg-teal-950/30",
      iconColor: "text-teal-600 dark:text-teal-400",
      trend: { value: stats.activeProjects, label: isAr ? "نشط" : "active", isPositive: true },
      secondaryBadge: stats.delayedProjects > 0 ? { value: stats.delayedProjects, label: isAr ? "متأخر" : "delayed", type: "danger" as const } : null,
    },
    {
      label: isAr ? "الفواتير المستحقة" : "Outstanding Invoices",
      value: formatCurrency(invoices.outstandingTotal, language),
      valueSuffix: "AED",
      icon: Receipt,
      gradientFrom: "from-amber-500",
      gradientTo: "to-amber-600",
      borderAccent: "border-s-amber-500",
      bgColor: "bg-amber-100 dark:bg-amber-950/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      trend: invoices.overdueCount > 0 ? { value: invoices.overdueCount, label: isAr ? "متأخر" : "overdue", isPositive: false } : null,
      secondaryBadge: null,
      valueSub: `(${invoices.outstandingCount})`,
    },
    {
      label: isAr ? "إيرادات هذا الشهر" : "This Month Revenue",
      value: formatCurrency(revenue.thisMonth, language),
      valueSuffix: "AED",
      icon: TrendingUp,
      gradientFrom: "from-emerald-500",
      gradientTo: "to-emerald-600",
      borderAccent: "border-s-emerald-500",
      bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      trend: revenue.change !== 0 ? { value: Math.abs(revenue.change), label: "%", isPositive: revenue.change > 0, showArrow: true } : null,
      secondaryBadge: null,
      valueSub: revenue.change !== 0 ? (isAr ? "مقارنة بالشهر الماضي" : "vs last month") : undefined,
    },
    {
      label: isAr ? "المهام القادمة (7 أيام)" : "Upcoming Tasks (7 days)",
      value: formatNumber(activeTasksCount, language),
      icon: CheckSquare,
      gradientFrom: "from-blue-500",
      gradientTo: "to-blue-600",
      borderAccent: "border-s-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      trend: overdueTasksCount > 0 ? { value: overdueTasksCount, label: isAr ? "متأخر" : "overdue", isPositive: false } : null,
      secondaryBadge: null,
    },
  ];

  // Department accent colors
  const deptAccents: Record<string, string> = {
    architectural: "bg-teal-500",
    structural: "bg-amber-500",
    mep: "bg-violet-500",
  };

  return (
    <div className="space-y-6">
      {/* ===== Welcome Section with Notification Bell & Quick Create ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isAr ? `مرحباً، ${user?.name || "مستخدم"}` : `Welcome, ${user?.name || "User"}`}
            </h2>
            {/* Notification Bell */}
            <button
              onClick={() => setCurrentPage("notifications")}
              className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 group"
              title={isAr ? "الإشعارات" : "Notifications"}
            >
              <Bell className="h-4 w-4 text-white" />
              <span className="absolute -top-1 -end-1 h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-900 shadow-sm">
                {alerts.length}
              </span>
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? "إليك ملخص نشاطك اليوم ومؤشرات الأداء"
              : "Here's your activity summary and key performance indicators"}
          </p>
          {/* Quick Create Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              onClick={() => setCurrentPage("clients")}
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-sm rounded-lg"
            >
              <UserRoundPlus className="h-3.5 w-3.5" />
              {isAr ? "عميل جديد" : "New Client"}
            </Button>
            <Button
              onClick={() => setCurrentPage("projects")}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs gap-1.5 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              {isAr ? "مشروع جديد" : "New Project"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {new Date().toLocaleDateString(isAr ? "ar-AE" : "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* ===== Stats Cards ===== */}
      <DashboardLayoutManager layout={layout} language={language}>
      <WidgetSlot widgetId="kpi-cards" layout={layout} language={language}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          // Deterministic sparkline bar heights based on card index (pure CSS, no logic change)
          const sparkBars = [
            [60, 80, 55],
            [45, 70, 90],
            [70, 55, 85],
            [50, 65, 40],
          ];
          const bars = sparkBars[i % sparkBars.length];
          const sparkColor = card.trend?.isPositive
            ? "bg-emerald-400 dark:bg-emerald-500"
            : "bg-red-400 dark:bg-red-500";

          return (
            <Card
              key={i}
              className={cn(
                "rounded-xl border-slate-200/80 dark:border-slate-700/50 transition-all duration-300 ease-out",
                "hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 hover:scale-[1.02] hover:-translate-y-1",
                "border-s-4",
                "bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-800/50",
                card.borderAccent
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md",
                    card.gradientFrom, card.gradientTo
                  )}>
                    <Icon className="h-5 w-5 text-white drop-shadow-sm" />
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end items-center">
                    {card.trend && (
                      <span className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        card.trend.isPositive
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                      )}>
                        {card.trend.isPositive
                          ? <ArrowUpRight className="h-3 w-3" />
                          : <ArrowDownRight className="h-3 w-3" />
                        }
                        {card.trend.value}{card.trend.label}
                      </span>
                    )}
                    {card.secondaryBadge && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 dark:bg-red-950/50 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400">
                        <XCircle className="h-3 w-3" />
                        {card.secondaryBadge.value} {card.secondaryBadge.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="min-w-0">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {card.value}
                      {card.valueSuffix && (
                        <span className="text-base font-medium text-slate-400 ms-1">{card.valueSuffix}</span>
                      )}
                      {card.valueSub && (
                        <span className="text-sm font-normal text-slate-400 ms-1">{card.valueSub}</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {card.label}
                    </div>
                  </div>
                  {/* Sparkline mini chart - 3 CSS bars */}
                  <div className="flex items-end gap-[3px] h-8 ms-3 shrink-0" aria-hidden="true">
                    {bars.map((h, bi) => (
                      <div
                        key={bi}
                        className={cn(
                          "w-[5px] rounded-sm transition-all duration-300",
                          bi === bars.length - 1 ? sparkColor : "bg-slate-200 dark:bg-slate-700"
                        )}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      </WidgetSlot>
      <WidgetSlot widgetId="quick-overview" layout={layout} language={language}>
      {/* ===== Quick Overview Strip ===== */}
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="flex gap-3 min-w-max">
          {[
            { icon: FolderKanban, count: stats.activeProjects, label: isAr ? "مشاريع نشطة" : "Active Projects", bg: "bg-teal-50 dark:bg-teal-950/30", iconBg: "bg-teal-100 dark:bg-teal-900/50", iconColor: "text-teal-600 dark:text-teal-400" },
            { icon: AlertTriangle, count: overdueTasksCount, label: isAr ? "مهام متأخرة" : "Overdue Tasks", bg: "bg-red-50 dark:bg-red-950/20", iconBg: "bg-red-100 dark:bg-red-900/50", iconColor: "text-red-600 dark:text-red-400" },
            { icon: Receipt, count: invoices.outstandingCount, label: isAr ? "فواتير معلقة" : "Pending Invoices", bg: "bg-amber-50 dark:bg-amber-950/20", iconBg: "bg-amber-100 dark:bg-amber-900/50", iconColor: "text-amber-600 dark:text-amber-400" },
            { icon: Calendar, count: upcomingTasks.length, label: isAr ? "اجتماعات قادمة" : "Upcoming Meetings", bg: "bg-sky-50 dark:bg-sky-950/20", iconBg: "bg-sky-100 dark:bg-sky-900/50", iconColor: "text-sky-600 dark:text-sky-400" },
            { icon: MessageCircle, count: 3, label: isAr ? "طلبات معلقة (RFI)" : "Open RFIs", bg: "bg-violet-50 dark:bg-violet-950/20", iconBg: "bg-violet-100 dark:bg-violet-900/50", iconColor: "text-violet-600 dark:text-violet-400" },
            { icon: ShieldAlert, count: stats.delayedProjects, label: isAr ? "مخاطر حرجة" : "Critical Risks", bg: "bg-rose-50 dark:bg-rose-950/20", iconBg: "bg-rose-100 dark:bg-rose-900/50", iconColor: "text-rose-600 dark:text-rose-400" },
          ].map((pill, idx) => {
            const PillIcon = pill.icon;
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-transparent",
                  pill.bg,
                  "hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                )}
              >
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", pill.iconBg)}>
                  <PillIcon className={cn("h-4 w-4", pill.iconColor)} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{pill.count}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{pill.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      </WidgetSlot>
      <WidgetSlot widgetId="revenue-chart" layout={layout} language={language}>
      {/* ===== Revenue Chart + Department Progress ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  {isAr ? "الإيرادات الشهرية" : "Monthly Revenue"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? "إجمالي المدفوعات المحصلة خلال آخر 6 أشهر" : "Total collected payments over the last 6 months"}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 gap-1">
                {isAr ? "عرض المزيد" : "View More"}
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenue.monthly} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#133371" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#133371" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey={isAr ? "labelAr" : "labelEn"}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    dx={-4}
                  />
                  <Tooltip content={<ChartTooltip isAr={isAr} />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#133371"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Progress */}
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              {isAr ? "تقدّم الأقسام" : "Department Progress"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? "مراحل المشاريع النشطة لكل قسم" : "Active project stages per department"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 pt-2">
            {departmentProgress.map((dept, idx) => {
              const accentColor = deptAccents[dept.key] || "bg-teal-500";
              return (
                <div key={dept.key}>
                  <div className="py-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("h-1 w-6 rounded-full", accentColor)} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {isAr ? dept.labelAr : dept.labelEn}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                          {dept.completed}/{dept.total}
                        </span>
                        <span className={cn(
                          "text-xs font-bold tabular-nums min-w-[36px] text-center px-1.5 py-0.5 rounded-md",
                          accentColor.replace("bg-", "text-"),
                          accentColor.replace("bg-", "bg-").replace("-500", "-100").replace("-500", "-50")
                        )}>
                          {dept.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700 ease-out",
                          accentColor
                        )}
                        style={{ width: `${dept.progress}%` }}
                      />
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {dept.total > 0
                          ? (dept.total - dept.completed) > 0
                            ? isAr
                              ? `${dept.total - dept.completed} مرحلة متبقية`
                              : `${dept.total - dept.completed} stages left`
                            : isAr
                              ? "مكتمل"
                              : "Complete"
                          : isAr
                            ? "لا توجد مراحل"
                            : "No stages"}
                      </span>
                    </div>
                  </div>
                  {idx < departmentProgress.length - 1 && (
                    <div className="border-t border-slate-100 dark:border-slate-800" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      </WidgetSlot>
      <WidgetSlot widgetId="my-tasks" layout={layout} language={language}>
      {/* ===== My Tasks Widget ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MyTasksWidget language={language} />
        </div>

        {/* ===== System Status Widget ===== */}
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <Server className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  {isAr ? "حالة النظام" : "System Status"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? "حالة الخدمات الأساسية" : "Core services status"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-2">
            {[
              { icon: Database, label: isAr ? "قاعدة البيانات" : "Database", status: "operational" as const, latency: "12ms", uptime: "99.9%" },
              { icon: Activity, label: isAr ? "واجهة البرمجة (API)" : "API", status: "operational" as const, latency: "45ms", uptime: "99.8%" },
              { icon: HardDrive, label: isAr ? "التخزين" : "Storage", status: "warning" as const, latency: "120ms", uptime: "98.5%" },
            ].map((service, idx) => {
              const ServiceIcon = service.icon;
              const isOk = service.status === "operational";
              return (
                <div key={idx}>
                  <div className="py-3 flex items-center gap-3">
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      isOk ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-amber-50 dark:bg-amber-950/30"
                    )}>
                      <ServiceIcon className={cn("h-4 w-4", isOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{service.label}</span>
                        <span className="flex items-center gap-1.5">
                          <span className={cn(
                            "relative flex h-2 w-2",
                            isOk ? "" : ""
                          )}>
                            {isOk && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                            )}
                            <span className={cn(
                              "relative inline-flex rounded-full h-2 w-2",
                              isOk ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                          </span>
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            isOk
                              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                          )}>
                            {isOk ? (isAr ? "يعمل" : "Operational") : (isAr ? "تحذير" : "Warning")}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{service.latency}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {isAr ? "متاح" : "Uptime"}: {service.uptime}
                        </span>
                      </div>
                    </div>
                  </div>
                  {idx < 2 && (
                    <div className="border-t border-slate-50 dark:border-slate-800/50" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      </WidgetSlot>
      <WidgetSlot widgetId="recent-projects" layout={layout} language={language}>
      {/* ===== Recent Projects Table + Alerts ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Projects */}
        <Card className="lg:col-span-2 rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              {isAr ? "المشاريع الأخيرة" : "Recent Projects"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? "آخر المشاريع المحدّثة" : "Last updated projects"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-4">
                    {isAr ? "الرقم" : "Number"}
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {isAr ? "المشروع" : "Project"}
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">
                    {isAr ? "العميل" : "Client"}
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {isAr ? "الحالة" : "Status"}
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
                    {isAr ? "التقدم" : "Progress"}
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="border-slate-100 dark:border-slate-800 cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <TableCell className="px-4">
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {project.number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {isAr ? project.name : (project.nameEn || project.name)}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {timeAgo(project.updatedAt, isAr)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {project.clientCompany || project.clientName}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(project.status, isAr)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-[60px] h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              project.progress >= 80 ? "bg-emerald-500" :
                              project.progress >= 40 ? "bg-teal-500" :
                              project.progress >= 20 ? "bg-amber-500" : "bg-slate-400"
                            )}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums w-8 text-start">
                          {Math.round(project.progress)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectClick(project.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Alerts Section */}
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  {isAr ? "التنبيهات المهمة" : "Important Alerts"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? "تحتاج اهتمامك فوراً" : "Requires your immediate attention"}
                </CardDescription>
              </div>
              {alerts.length > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                  {alerts.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShieldCheck className="h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? "لا توجد تنبيهات حالياً" : "No alerts at this time"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((alert) => {
                  const IconComponent = getAlertIcon(alert.severity);
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "rounded-xl border p-3 transition-colors hover:brightness-95 dark:hover:brightness-110",
                        getAlertBorderColor(alert.severity),
                        getAlertBgColor(alert.severity)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                          getAlertIconColor(alert.severity)
                        )}>
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            {isAr ? alert.titleAr : alert.titleEn}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                            {isAr ? alert.descriptionAr : alert.descriptionEn}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(alert.timestamp, isAr)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* View All Link */}
                <Button variant="ghost" className="w-full text-xs text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 mt-1">
                  {isAr ? "عرض الكل" : "View All"}
                  <ArrowUpRight className="h-3 w-3 ms-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      </WidgetSlot>
      <WidgetSlot widgetId="gantt-timeline" layout={layout} language={language}>
      {/* ===== Project Gantt Timeline ===== */}
      <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 relative">
          {/* Teal accent line */}
          <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  {isAr ? "الجدول الزمني للمشاريع" : "Project Timeline"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? "نظرة عامة على تقدم المشاريع النشطة" : "Active projects progress overview"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" />
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? "نشط" : "Active"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? "مكتمل" : "Done"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? "متأخر" : "Delayed"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rotate-45 bg-amber-400 rounded-sm" />
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? "معلم" : "Milestone"}</span>
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentProjects.slice(0, 5).map((project, idx) => {
              const progress = Math.round(project.progress);
              const isDelayed = project.status === "delayed";
              const isCompleted = project.status === "completed";
              const barColor = isDelayed
                ? "from-red-400 to-red-500 dark:from-red-500 dark:to-red-600"
                : isCompleted
                  ? "from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600"
                  : "from-teal-400 to-cyan-500 dark:from-teal-500 dark:to-cyan-600";
              const trackColor = isDelayed
                ? "bg-red-100 dark:bg-red-950/30"
                : isCompleted
                  ? "bg-emerald-100 dark:bg-emerald-950/30"
                  : "bg-teal-100/60 dark:bg-teal-950/30";
              // Milestone positions (deterministic based on project index)
              const milestonePct = [35, 60, 45, 75, 50][idx % 5];

              return (
                <div key={project.id} className="group">
                  <div className="flex items-center gap-3">
                    {/* Project Name */}
                    <div className="w-[160px] shrink-0 min-w-0">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate block">
                        {isAr ? project.name : (project.nameEn || project.name)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {project.number}
                      </span>
                    </div>

                    {/* Gantt Bar */}
                    <div className="flex-1 relative">
                      <div className={cn("h-7 rounded-lg overflow-hidden relative shadow-sm", trackColor)}>
                        {/* Progress bar */}
                        <div
                          className={cn(
                            "h-full rounded-lg bg-gradient-to-l transition-all duration-700 ease-out relative shadow-sm",
                            barColor
                          )}
                          style={{ width: `${Math.max(progress, 2)}%` }}
                        >
                          {/* Progress percentage label on bar */}
                          {progress > 15 && (
                            <span className="absolute inset-0 flex items-center justify-end pe-2">
                              <span className="text-[10px] font-bold text-white/90 tabular-nums drop-shadow-sm">{progress}%</span>
                            </span>
                          )}
                        </div>

                        {/* Milestone diamond */}
                        {milestonePct <= progress && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 z-10"
                            style={{ left: `${milestonePct}%` }}
                          >
                            <div className="w-3 h-3 rotate-45 bg-amber-400 dark:bg-amber-500 rounded-[2px] shadow-sm ring-2 ring-white dark:ring-slate-800" />
                          </div>
                        )}

                        {/* Today marker */}
                        {idx === 0 && (
                          <div
                            className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-slate-400 dark:border-slate-500 z-10"
                            style={{ left: `${Math.min(progress + 5, 95)}%` }}
                          >
                            <div className="absolute -top-1 start-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400" />
                          </div>
                        )}
                      </div>
                      {/* Progress label outside bar when too small */}
                      {progress <= 15 && (
                        <span className="absolute start-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">{progress}%</span>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="w-5 shrink-0 flex justify-center">
                      {isDelayed ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <CircleDot className="h-3.5 w-3.5 text-teal-500" />
                      )}
                    </div>
                  </div>
                  {idx < Math.min(recentProjects.length, 5) - 1 && (
                    <div className="border-t border-slate-50 dark:border-slate-800/50 mt-3" />
                  )}
                </div>
              );
            })}
            {recentProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? "لا توجد مشاريع حالياً" : "No projects yet"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ======================================== */}
      {/* ===== NEW WIDGETS SECTION ===== */}
      {/* ======================================== */}

      </WidgetSlot>
      <WidgetSlot widgetId="deadlines-team" layout={layout} language={language}>
      {/* ===== Upcoming Deadlines + Team Performance ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Deadlines Widget */}
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-md">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                    {isAr ? "المواعيد النهائية القادمة" : "Upcoming Deadlines"}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? "أقرب المهام المستحقة" : "Nearest task deadlines"}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] px-2">
                {upcomingTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? "لا توجد مواعيد نهائية قادمة" : "No upcoming deadlines"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.slice(0, 7).map((task) => {
                  const days = daysUntil(task.dueDate);
                  const isOverdue = task.isOverdue || days < 0;
                  const isUrgent = !isOverdue && days <= 3;
                  const isWarning = !isOverdue && !isUrgent && days <= 7;

                  const dotColor = isOverdue
                    ? "bg-red-500"
                    : isUrgent
                    ? "bg-amber-500"
                    : isWarning
                    ? "bg-amber-400"
                    : "bg-emerald-500";

                  const badgeClass = isOverdue
                    ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                    : isUrgent
                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                    : isWarning
                    ? "bg-amber-50/70 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 border border-amber-200/60 dark:border-amber-800/60"
                    : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";

                  const daysLabel = isOverdue
                    ? isAr ? `متأخر ${Math.abs(days)} يوم` : `${Math.abs(days)}d overdue`
                    : days === 0
                    ? isAr ? "اليوم" : "Today"
                    : days === 1
                    ? isAr ? "غداً" : "Tomorrow"
                    : isAr ? `${days} يوم` : `${days}d`;

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer",
                        "hover:bg-slate-50/80 dark:hover:bg-slate-800/30",
                        isOverdue && "bg-red-50/30 dark:bg-red-950/10 border-red-100 dark:border-red-900/30"
                      )}
                      onClick={() => handleProjectClick(task.projectNumber)}
                    >
                      {/* Avatar */}
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className={cn("text-white text-[10px] font-semibold", getAvatarColor(task.assigneeName))}>
                          {getInitials(task.assigneeName)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {task.projectName}
                        </p>
                      </div>

                      {/* Due date badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOverdue && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                          </span>
                        )}
                        <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", badgeClass)}>
                          <Clock className="h-2.5 w-2.5" />
                          {daysLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Performance Widget */}
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                    {isAr ? "أداء الفريق" : "Team Performance"}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? "معدل إتمام المهام لكل عضو" : "Task completion rate per member"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamPerformance.map((member, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-default"
                )}
              >
                {/* Avatar with hash-based color */}
                <Avatar className="h-9 w-9 shrink-0 ring-2 ring-slate-100 dark:ring-slate-700">
                  <AvatarFallback className={cn("text-white text-[10px] font-bold", member.avatarColor || getAvatarColor(member.name))}>
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Name & Task Count */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0 ms-2 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {member.tasksDone}/{member.tasksTotal} {isAr ? "مهمة" : "tasks"}
                    </span>
                  </div>

                  {/* Progress bar with gradient + shine effect */}
                  <div className="relative h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        member.completion >= 85
                          ? "bg-gradient-to-r from-teal-500 to-emerald-400"
                          : member.completion >= 70
                          ? "bg-gradient-to-r from-teal-500 to-cyan-400"
                          : member.completion >= 50
                          ? "bg-gradient-to-r from-amber-400 to-amber-500"
                          : "bg-gradient-to-r from-orange-400 to-amber-500"
                      )}
                      style={{ width: `${member.completion}%` }}
                    />
                    {/* Shine overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent rounded-full" />
                  </div>
                </div>

                {/* Percentage with colored badge */}
                <span className={cn(
                  "text-xs font-bold tabular-nums min-w-[40px] text-center px-1.5 py-0.5 rounded-lg shrink-0",
                  member.completion >= 85
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                    : member.completion >= 70
                    ? "bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400"
                    : member.completion >= 50
                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                    : "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400"
                )}>
                  {member.completion}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      </WidgetSlot>
      <WidgetSlot widgetId="activity-overview" layout={layout} language={language}>
      {/* ===== Recent Activity Feed + Quick Project Overview ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity Feed Widget */}
        <Card className="lg:col-span-2 rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shadow-md">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                    {isAr ? "آخر الأنشطة" : "Recent Activity"}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? "آخر التحديثات والأحداث" : "Latest updates and events"}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 gap-1">
                {isAr ? "عرض الكل" : "View All"}
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[420px] overflow-y-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute start-[19px] top-3 bottom-3 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="space-y-0.5">
                {activities.map((activity, idx) => {
                  const IconComp = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "relative flex items-start gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30",
                        "border-s-2",
                        activity.borderColor
                      )}
                    >
                      {/* Timeline dot + icon */}
                      <div className={cn(
                        "relative z-10 h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                        activity.iconBg
                      )}>
                        <IconComp className={cn("h-4 w-4", activity.iconColor)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {activity.userName}
                          </span>
                          {" "}
                          {isAr ? activity.actionAr : activity.actionEn}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {timeAgo(activity.timestamp, isAr)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Project Overview Widget */}
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
                <CircleDot className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  {isAr ? "نظرة سريعة على المشاريع" : "Project Overview"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? "حالة المشاريع النشطة" : "Active projects status"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[420px] overflow-y-auto">
            <div className="space-y-3">
              {recentProjects.slice(0, 4).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 transition-all hover:shadow-sm hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                  onClick={() => handleProjectClick(project.id)}
                >
                  {/* Progress Ring */}
                  <div className="relative">
                    <MiniProgressRing progress={project.progress} size={44} strokeWidth={3.5} />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-300">
                      {Math.round(project.progress)}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {isAr ? project.name : (project.nameEn || project.name)}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {project.clientCompany || project.clientName}
                    </p>
                    <div className="mt-1.5">
                      {getStatusBadge(project.status, isAr)}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowUpRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                </div>
              ))}

              {/* View All */}
              <Button
                variant="ghost"
                className="w-full text-xs text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 mt-2"
                onClick={() => setCurrentPage("projects")}
              >
                {isAr ? "عرض جميع المشاريع" : "View All Projects"}
                <ArrowUpRight className="h-3 w-3 ms-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      </WidgetSlot>
      <WidgetSlot widgetId="charts-section" layout={layout} language={language}>
      {/* ===== New Chart Sections ===== */}
      {/* Project Status Donut + Monthly Task Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Status Donut Chart */}
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              {isAr ? "حالة المشاريع" : "Project Status"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? "توزيع المشاريع حسب الحالة" : "Project distribution by status"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full max-w-[220px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload as { name: string; value: number; color: string };
                        return (
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{d.name}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{d.value}</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{stats.totalProjects}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{isAr ? "مشروع" : "Projects"}</span>
                </div>
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                {projectStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums ms-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Task Completion Trend */}
        <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50 relative">
            {/* Teal accent line */}
            <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              {isAr ? "معدل إكمال المهام" : "Task Completion Trend"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? "المهام المنشأة مقابل المكتملة (آخر 6 أشهر)" : "Created vs completed tasks (last 6 months)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskTrendData} barGap={4}>
                  <defs>
                    <linearGradient id="createdBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cbd5e1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="completedBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#133371" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0e2a5c" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    dx={-4}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                          {payload.map((p, i) => (
                            <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
                              {p.name}: {p.value}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>}
                  />
                  <Bar
                    dataKey="created"
                    name={isAr ? "منشأة" : "Created"}
                    fill="url(#createdBar)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name={isAr ? "مكتملة" : "Completed"}
                    fill="url(#completedBar)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      </WidgetSlot>
      <WidgetSlot widgetId="dept-workload" layout={layout} language={language}>
      {/* ===== Department Workload Overview ===== */}
      <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 relative">
          <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  {isAr ? "حمل الأقسام" : "Department Workload"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? "نظرة عامة على حمل العمل لكل قسم" : "Overview of task load per department"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: "arch", labelAr: "القسم المعماري", labelEn: "Architecture", icon: Building, color: "from-teal-500 to-teal-600", bg: "bg-teal-50 dark:bg-teal-950/20", total: departmentProgress.find(d => d.key === "architectural")?.total || 0, completed: departmentProgress.find(d => d.key === "architectural")?.completed || 0, progress: departmentProgress.find(d => d.key === "architectural")?.progress || 0 },
              { key: "struct", labelAr: "القسم الإنشائي", labelEn: "Structural", icon: Wrench, color: "from-amber-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", total: departmentProgress.find(d => d.key === "structural")?.total || 0, completed: departmentProgress.find(d => d.key === "structural")?.completed || 0, progress: departmentProgress.find(d => d.key === "structural")?.progress || 0 },
              { key: "mep", labelAr: "الكهروميكانيك", labelEn: "MEP", icon: Zap, color: "from-violet-500 to-violet-600", bg: "bg-violet-50 dark:bg-violet-950/20", total: departmentProgress.find(d => d.key === "mep")?.total || 0, completed: departmentProgress.find(d => d.key === "mep")?.completed || 0, progress: departmentProgress.find(d => d.key === "mep")?.progress || 0 },
              { key: "pm", labelAr: "إدارة المشاريع", labelEn: "Project Mgmt", icon: FolderKanban, color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", total: stats.activeProjects, completed: stats.completedProjects, progress: stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0 },
              { key: "admin", labelAr: "الإدارة", labelEn: "Administration", icon: ShieldCheck, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", total: activeTasksCount, completed: activeTasksCount - overdueTasksCount, progress: activeTasksCount > 0 ? Math.round(((activeTasksCount - overdueTasksCount) / activeTasksCount) * 100) : 0 },
              { key: "doc", labelAr: "الوثائق", labelEn: "Documentation", icon: FileText, color: "from-rose-500 to-rose-600", bg: "bg-rose-50 dark:bg-rose-950/20", total: invoices.outstandingCount, completed: 0, progress: 0 },
            ].map((dept) => {
              const DeptIcon = dept.icon;
              return (
                <div
                  key={dept.key}
                  className={cn(
                    "rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-3 transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-default",
                    dept.bg
                  )}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm", dept.color)}>
                      <DeptIcon className="h-4 w-4 text-white" />
                    </div>
                    <MiniProgressRing progress={dept.progress} size={32} strokeWidth={3} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {isAr ? dept.labelAr : dept.labelEn}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {dept.completed}/{dept.total}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      </WidgetSlot>
      <WidgetSlot widgetId="project-health" layout={layout} language={language}>
      {/* ===== Project Health Widget ===== */}
      <ProjectHealthWidget language={language} />

      {/* Budget Overview Mini Chart */}
      <Card className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50 relative">
          {/* Teal accent line */}
          <div className="absolute top-0 start-0 end-0 h-[3px] rounded-t-xl bg-gradient-to-l from-teal-500 to-teal-400" />
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                {isAr ? "أعلى المشاريع من حيث الميزانية" : "Top Projects by Budget"}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? "أعلى 5 مشاريع من حيث الميزانية الإجمالية" : "Top 5 projects by total budget"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetOverviewData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="budgetBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0e2a5c" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#133371" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={120}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as { name: string; budget: number };
                    return (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{d.name}</p>
                        <p className="text-sm font-bold text-teal-600 dark:text-teal-400 font-mono tabular-nums">
                          {formatCurrency(d.budget, language)} AED
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="budget"
                  name={isAr ? "الميزانية" : "Budget"}
                  fill="url(#budgetBar)"
                  radius={[0, 6, 6, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      </WidgetSlot>
      </DashboardLayoutManager>
    </div>
  );
}
