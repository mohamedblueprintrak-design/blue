"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavStore } from "@/store/nav-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Eye,
  Building2,
  HardHat,
  Zap,
  Droplets,
  Landmark,
  Calculator,
  FileEdit,
  ShieldAlert,
  CheckSquare,
  FileSignature,
  FileText,
  Wallet,
  Receipt,
  CreditCard,
  PiggyBank,
  FileSpreadsheet,
  Gavel,
  MapPin,
  Users,
  UsersRound,
  Video,
  ClipboardCheck,
  Bell,
  Activity,
  Sparkles,
  BookMarked,
  Calendar,
  Search,
  MessageSquareQuote,
  AlertTriangle,
  BookOpen,
  Clock,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowUpRight,
  Plus,
  Building,
  UserPlus,
  Briefcase,
  Star,
  FolderKanban,
  CalendarRange,
  Timer,
} from "lucide-react";

// Import page components
import TasksKanban from "@/components/pages/tasks";
import ClientsPage from "@/components/pages/clients";
import ContractsPage from "@/components/pages/contracts";
import InvoicesPage from "@/components/pages/invoices";
import PaymentsPage from "@/components/pages/payments";
import ProposalsPage from "@/components/pages/proposals";
import BidsPage from "@/components/pages/bids";
import BudgetsPage from "@/components/pages/budgets";
import SiteVisitsPage from "@/components/pages/site-visits";
import DefectsPage from "@/components/pages/defects";
import SiteDiaryPage from "@/components/pages/site-diary";
import RFIPage from "@/components/pages/rfi";
import ChangeOrdersPage from "@/components/pages/change-orders";
import RisksPage from "@/components/pages/risks";
import MeetingsPage from "@/components/pages/meetings";
import DocumentsPage from "@/components/pages/documents";
import KnowledgePage from "@/components/pages/knowledge";
import ApprovalsPage from "@/components/pages/approvals";
import CalendarPage from "@/components/pages/calendar";
import NotificationsPage from "@/components/pages/notifications";
import ActivityLog from "@/components/pages/activity-log";
import AIAssistant from "@/components/pages/ai-assistant";
import GlobalSearch from "@/components/pages/search";
import GanttPage from "@/components/pages/gantt";
import BOQPage from "@/components/pages/boq";
import MunicipalityCorrespondencePage from "@/components/pages/municipality-correspondence";
import EmployeesPage from "@/components/pages/employees";

// ===== TYPES =====
interface ProjectDetailProps {
  language: "ar" | "en";
}

interface ProjectStage {
  id: string;
  department: string;
  stageName: string;
  stageOrder: number;
  status: string;
  engineerId: string | null;
  notes: string;
}

interface GovApproval {
  id: string;
  authority: string;
  status: string;
  submissionDate: string | null;
  approvalDate: string | null;
  rejectionCount: number;
  notes: string;
}

interface BOQItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

interface SchedulePhase {
  id: string;
  section: string;
  phaseOrder: number;
  phaseName: string;
  duration: number;
  maxDuration: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface Assignment {
  id: string;
  role: string;
  user: { id: string; name: string; avatar: string; department: string; position: string };
}

interface ProjectData {
  id: string;
  number: string;
  name: string;
  nameEn: string;
  clientId: string;
  location: string;
  plotNumber: string;
  type: string;
  status: string;
  progress: number;
  budget: number;
  startDate: string | null;
  endDate: string | null;
  description: string;
  client: { id: string; name: string; company: string; email: string; phone: string };
  createdBy: { id: string; name: string };
  assignments: Assignment[];
  stages: ProjectStage[];
  govApprovals: GovApproval[];
  boqItems: BOQItem[];
  schedulePhases: SchedulePhase[];
  invoices: Array<{ id: string; number: string; total: number; paidAmount: number; status: string }>;
  contracts: Array<{ id: string; value: number; status: string }>;
  budgets: Array<{ planned: number; actual: number; category: string }>;
  siteVisits: Array<{ id: string; date: string; status: string }>;
  defects: Array<{ id: string; title: string; severity: string; status: string }>;
  siteDiaries: Array<{ id: string; date: string; workerCount: number }>;
  taskStats: { total: number; todo: number; inProgress: number; review: number; done: number };
}

// ===== CONSTANTS =====
const STATUS_LABELS: Record<string, Record<string, string>> = {
  ar: {
    NOT_STARTED: "لم يبدأ", IN_PROGRESS: "قيد التنفيذ",
    SUBMITTED: "مقدم للمراجعة", APPROVED: "معتمد", REJECTED: "مرفوض",
    PENDING: "معلق", COMPLETED: "مكتمل", DRAFT: "مسودة",
    active: "نشط", completed: "مكتمل", delayed: "متأخر",
    on_hold: "معلق", cancelled: "ملغى",
  },
  en: {
    NOT_STARTED: "Not Started", IN_PROGRESS: "In Progress",
    SUBMITTED: "Submitted", APPROVED: "Approved", REJECTED: "Rejected",
    PENDING: "Pending", COMPLETED: "Completed", DRAFT: "Draft",
    active: "Active", completed: "Completed", delayed: "Delayed",
    on_hold: "On Hold", cancelled: "Cancelled",
  },
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SUBMITTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200",
  completed: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200",
  delayed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200",
  on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200",
};

// ===== HELPER COMPONENTS =====
function StatusBadge({ status, language }: { status: string; language: "ar" | "en" }) {
  const label = STATUS_LABELS[language]?.[status] || status;
  const color = STATUS_COLORS[status] || STATUS_COLORS.NOT_STARTED;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border-0 px-2.5 py-0.5", color)}>
      {label}
    </Badge>
  );
}

function ProgressRing({ value, size = 56, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#10b981" : value >= 40 ? "#14b8a6" : value >= 20 ? "#f59e0b" : "#94a3b8";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: React.ReactNode; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-slate-200 dark:border-slate-700/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== DEPARTMENT PROGRESS =====
function DepartmentProgress({
  stages,
  department,
  language,
  label,
  icon: Icon,
  accentColor,
}: {
  stages: ProjectStage[];
  department: string;
  language: "ar" | "en";
  label: string;
  icon: React.ElementType;
  accentColor: string;
}) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const deptStages = stages.filter((s) => s.department === department);
  const completed = deptStages.filter((s) => s.status === "APPROVED").length;
  const total = deptStages.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card 
      className="border-slate-200 dark:border-slate-700/50 overflow-hidden"
      style={{ borderInlineStartWidth: "4px", borderInlineStartColor: accentColor }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{label}</h4>
            <p className="text-xs text-slate-500">{completed}/{total} {t("مراحل", "stages")}</p>
          </div>
          <div className="text-end">
            <span className="text-lg font-bold" style={{ color: accentColor }}>{pct}%</span>
          </div>
        </div>
        <Progress value={pct} className="h-2 bg-slate-100 dark:bg-slate-800" />
      </CardContent>
    </Card>
  );
}

// ===== STAGE STEPPER =====
function StageStepper({ stages, language }: { stages: ProjectStage[]; language: "ar" | "en" }) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-0 min-w-max">
        {sortedStages.map((stage, idx) => {
          const isApproved = stage.status === "APPROVED";
          const isInProgress = stage.status === "IN_PROGRESS";
          const isRejected = stage.status === "REJECTED";
          const isSubmitted = stage.status === "SUBMITTED";

          return (
            <div key={stage.id} className="flex items-center shrink-0">
              {/* Step Node */}
              <div className="flex flex-col items-center gap-1.5 w-20">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 relative",
                  isApproved
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : isInProgress
                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/20 animate-pulse"
                    : isRejected
                    ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                    : isSubmitted
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {isApproved ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isRejected ? (
                    <XCircle className="h-4 w-4" />
                  ) : isInProgress ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] text-center leading-tight max-w-[80px]",
                  isInProgress || isApproved ? "text-slate-900 dark:text-white font-medium" : "text-slate-500"
                )}>
                  {stage.stageName}
                </span>
              </div>
              
              {/* Connector Line */}
              {idx < sortedStages.length - 1 && (
                <div className={cn(
                  "w-8 h-1 rounded-full mx-1",
                  isApproved ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== TAB CONFIGURATION =====
const mainTabs = [
  { id: "overview", icon: Eye, labelAr: "نظرة عامة", labelEn: "Overview" },
  { id: "technical", icon: Building2, labelAr: "فني", labelEn: "Technical" },
  { id: "tasks", icon: CheckSquare, labelAr: "المهام", labelEn: "Tasks" },
  { id: "documents", icon: FileText, labelAr: "المستندات", labelEn: "Documents" },
  { id: "financial", icon: Wallet, labelAr: "المالية", labelEn: "Financial" },
  { id: "site", icon: MapPin, labelAr: "الموقع", labelEn: "Site" },
  { id: "team", icon: Users, labelAr: "الفريق", labelEn: "Team" },
  { id: "help", icon: Sparkles, labelAr: "مساعدة", labelEn: "Help" },
];

const technicalSubTabs = [
  { id: "architectural", icon: Building2, labelAr: "المعماري", labelEn: "Architectural" },
  { id: "structural", icon: HardHat, labelAr: "الإنشائي", labelEn: "Structural" },
  { id: "electrical", icon: Zap, labelAr: "الكهربائي", labelEn: "Electrical" },
  { id: "plumbing", icon: Droplets, labelAr: "السباكة", labelEn: "Plumbing" },
  { id: "gov-approvals", icon: Landmark, labelAr: "الموافقات الحكومية", labelEn: "Gov Approvals" },
  { id: "boq", icon: Calculator, labelAr: "جدول الكميات", labelEn: "BOQ" },
  { id: "change-orders", icon: FileEdit, labelAr: "أوامر التغيير", labelEn: "Change Orders" },
  { id: "risks", icon: ShieldAlert, labelAr: "المخاطر", labelEn: "Risks" },
];

const documentsSubTabs = [
  { id: "contract", icon: FileSignature, labelAr: "العقد", labelEn: "Contract" },
  { id: "documents", icon: FileText, labelAr: "المستندات", labelEn: "Documents" },
  { id: "municipality", icon: Landmark, labelAr: "المراسلات البلدية", labelEn: "Municipality" },
];

const financialSubTabs = [
  { id: "invoices", icon: Receipt, labelAr: "الفواتير", labelEn: "Invoices" },
  { id: "payments", icon: CreditCard, labelAr: "المدفوعات", labelEn: "Payments" },
  { id: "budgets", icon: PiggyBank, labelAr: "الميزانية", labelEn: "Budget" },
  { id: "proposals", icon: FileSpreadsheet, labelAr: "العروض", labelEn: "Proposals" },
  { id: "bids", icon: Gavel, labelAr: "العطاءات", labelEn: "Bids" },
];

const siteSubTabs = [
  { id: "clients", icon: Users, labelAr: "العملاء", labelEn: "Clients" },
  { id: "site-visits", icon: Eye, labelAr: "زيارات الموقع", labelEn: "Site Visits" },
  { id: "site-diary", icon: BookOpen, labelAr: "يومية الموقع", labelEn: "Site Diary" },
  { id: "rfi", icon: MessageSquareQuote, labelAr: "طلبات المعلومات", labelEn: "RFI" },
  { id: "defects", icon: AlertTriangle, labelAr: "العيوب", labelEn: "Defects" },
];

const teamSubTabs = [
  { id: "team-members", icon: UsersRound, labelAr: "الفريق", labelEn: "Team" },
  { id: "meetings", icon: Video, labelAr: "الاجتماعات", labelEn: "Meetings" },
  { id: "approvals", icon: ClipboardCheck, labelAr: "الموافقات", labelEn: "Approvals" },
  { id: "notifications", icon: Bell, labelAr: "الإشعارات", labelEn: "Notifications" },
  { id: "activity-log", icon: Activity, labelAr: "سجل النشاط", labelEn: "Activity Log" },
];

const helpSubTabs = [
  { id: "ai-assistant", icon: Sparkles, labelAr: "المساعد الذكي", labelEn: "AI Assistant" },
  { id: "knowledge", icon: BookMarked, labelAr: "قاعدة المعرفة", labelEn: "Knowledge" },
  { id: "calendar", icon: Calendar, labelAr: "التقويم", labelEn: "Calendar" },
  { id: "search", icon: Search, labelAr: "البحث", labelEn: "Search" },
];

// ===== SUB-TAB RENDERER =====
function SubTabsNav({ 
  tabs, 
  activeSubTab, 
  onSubTabChange, 
  language 
}: { 
  tabs: typeof technicalSubTabs; 
  activeSubTab: string; 
  onSubTabChange: (id: string) => void;
  language: "ar" | "en";
}) {
  const isAr = language === "ar";
  return (
    <ScrollArea className="w-full mb-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex gap-2 pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSubTabChange(tab.id)}
            className={cn(
              "gap-1.5 h-8 text-xs whitespace-nowrap",
              activeSubTab === tab.id 
                ? "bg-teal-600 hover:bg-teal-700 text-white" 
                : "border-slate-200 dark:border-slate-700"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {isAr ? tab.labelAr : tab.labelEn}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ===== OVERVIEW TAB CONTENT =====
function OverviewTab({ project, language }: { project: ProjectData; language: "ar" | "en" }) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const totalInvoiced = project?.invoices?.reduce((s, i) => s + i.total, 0) || 0;
  const totalPaid = project?.invoices?.reduce((s, i) => s + i.paidAmount, 0) || 0;
  const totalBudgetActual = project?.budgets?.reduce((s, b) => s + b.actual, 0) || 0;
  const budgetPct = project.budget > 0 ? Math.round((totalBudgetActual / project.budget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 dark:from-teal-800 dark:via-teal-700 dark:to-cyan-700 p-6 md:p-8 text-white">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")` 
        }} />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              {/* Key Metrics Pills */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs">
                  <CalendarRange className="h-3 w-3" />
                  <span className="text-white/70">{t("البدء", "Start")}:</span>
                  <span className="font-semibold">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", day: "numeric" }) : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs">
                  <Timer className="h-3 w-3" />
                  <span className="text-white/70">{t("الانتهاء", "End")}:</span>
                  <span className="font-semibold">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", day: "numeric" }) : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs">
                  <Wallet className="h-3 w-3" />
                  <span className="font-mono font-semibold">{project.budget.toLocaleString()} {isAr ? "د.إ" : "AED"}</span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-8 gap-1.5 text-xs bg-white text-teal-700 hover:bg-white/90 font-medium shadow-md">
                  <Pencil className="h-3.5 w-3.5" />
                  {t("تعديل المشروع", "Edit Project")}
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm">
                  <Plus className="h-3.5 w-3.5" />
                  {t("إضافة مهمة", "Add Task")}
                </Button>
              </div>
            </div>

            {/* Large Progress Ring */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative">
                <svg width={120} height={120} className="transform -rotate-90">
                  <circle cx={60} cy={60} r={52} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={8} />
                  <circle
                    cx={60} cy={60} r={52} fill="none" stroke="#fff" strokeWidth={8}
                    strokeDasharray={52 * 2 * Math.PI}
                    strokeDashoffset={52 * 2 * Math.PI - (project.progress / 100) * 52 * 2 * Math.PI}
                    strokeLinecap="round" className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white tabular-nums">{Math.round(project.progress)}%</span>
                  <span className="text-[10px] text-white/60">{t("الإنجاز", "Progress")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t("الميزانية", "Budget")}
          value={<>{project.budget.toLocaleString()} <span className="text-xs text-slate-400">AED</span></>}
          icon={PiggyBank}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label={t("الفواتير", "Invoiced")}
          value={<>{totalInvoiced.toLocaleString()} <span className="text-xs text-slate-400">AED</span></>}
          icon={Receipt}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label={t("المدفوع", "Paid")}
          value={<>{totalPaid.toLocaleString()} <span className="text-xs text-slate-400">AED</span></>}
          icon={CreditCard}
          color="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
        />
        <StatCard
          label={t("المهام", "Tasks")}
          value={project.taskStats?.total || 0}
          icon={CheckSquare}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      {/* Department Progress */}
      {project.stages && project.stages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DepartmentProgress
            stages={project.stages}
            department="architectural"
            language={language}
            label={t("القسم المعماري", "Architectural")}
            icon={Building2}
            accentColor="#14b8a6"
          />
          <DepartmentProgress
            stages={project.stages}
            department="structural"
            language={language}
            label={t("القسم الإنشائي", "Structural")}
            icon={HardHat}
            accentColor="#f59e0b"
          />
          <DepartmentProgress
            stages={project.stages}
            department="mep"
            language={language}
            label={t("الكهرباء والميكانيك", "MEP")}
            icon={Zap}
            accentColor="#3b82f6"
          />
        </div>
      )}

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-500" />
              {t("معلومات المشروع", "Project Info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t("رقم المشروع", "Project No.")}</span>
              <span className="font-medium">#{project.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الموقع", "Location")}</span>
              <span className="font-medium">{project.location || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("رقم القطعة", "Plot No.")}</span>
              <span className="font-medium">{project.plotNumber || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("النوع", "Type")}</span>
              <span className="font-medium">
                {project.type === "villa" ? t("فيلا", "Villa") :
                 project.type === "building" ? t("مبنى", "Building") :
                 project.type === "commercial" ? t("تجاري", "Commercial") :
                 t("صناعي", "Industrial")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-500" />
              {t("العميل", "Client")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الاسم", "Name")}</span>
              <span className="font-medium">{project.client?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الشركة", "Company")}</span>
              <span className="font-medium">{project.client?.company || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("البريد", "Email")}</span>
              <span className="font-medium">{project.client?.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الهاتف", "Phone")}</span>
              <span className="font-medium">{project.client?.phone || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      {project.assignments && project.assignments.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-teal-500" />
              {t("فريق العمل", "Project Team")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {project.assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      {assignment.user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{assignment.user?.name}</p>
                    <p className="text-xs text-slate-500">{assignment.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function ProjectDetail({ language }: ProjectDetailProps) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { 
    currentProjectId, 
    currentProjectTab, 
    currentProjectSubTab,
    setCurrentProjectId, 
    setCurrentPage, 
    setCurrentProjectTab,
    setCurrentProjectSubTab 
  } = useNavStore();

  const [activeTab, setActiveTab] = useState(currentProjectTab || "overview");
  const [activeSubTab, setActiveSubTab] = useState(currentProjectSubTab || "");

  // Sync with store
  React.useEffect(() => {
    if (currentProjectTab && currentProjectTab !== activeTab) {
      setActiveTab(currentProjectTab);
    }
    if (currentProjectSubTab !== activeSubTab) {
      setActiveSubTab(currentProjectSubTab || "");
    }
  }, [currentProjectTab, currentProjectSubTab]);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return null;
      const res = await fetch(`/api/projects/${currentProjectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json() as Promise<ProjectData>;
    },
    enabled: !!currentProjectId,
  });

  const handleBack = () => {
    setCurrentProjectId(null);
    setCurrentPage("projects");
    setCurrentProjectTab("overview");
    setCurrentProjectSubTab("");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentProjectTab(tab);
    // Set default sub-tab for tabs with sub-tabs
    const subTabsMap: Record<string, typeof technicalSubTabs> = {
      technical: technicalSubTabs,
      documents: documentsSubTabs,
      financial: financialSubTabs,
      site: siteSubTabs,
      team: teamSubTabs,
      help: helpSubTabs,
    };
    if (subTabsMap[tab] && subTabsMap[tab].length > 0) {
      const defaultSubTab = subTabsMap[tab][0].id;
      setActiveSubTab(defaultSubTab);
      setCurrentProjectSubTab(defaultSubTab);
    } else {
      setActiveSubTab("");
      setCurrentProjectSubTab("");
    }
  };

  const handleSubTabChange = (subTab: string) => {
    setActiveSubTab(subTab);
    setCurrentProjectSubTab(subTab);
  };

  // Get current sub-tabs based on main tab
  const getCurrentSubTabs = () => {
    switch (activeTab) {
      case "technical": return technicalSubTabs;
      case "documents": return documentsSubTabs;
      case "financial": return financialSubTabs;
      case "site": return siteSubTabs;
      case "team": return teamSubTabs;
      case "help": return helpSubTabs;
      default: return [];
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Building2 className="h-12 w-12 text-slate-300" />
        <p className="text-slate-500">{t("لم يتم العثور على المشروع", "Project not found")}</p>
        <Button variant="outline" onClick={handleBack}>
          {t("رجوع", "Back")}
        </Button>
      </div>
    );
  }

  const currentSubTabs = getCurrentSubTabs();

  return (
    <div className="space-y-4">
      {/* ===== Header ===== */}
      <Card className="border-slate-200 dark:border-slate-700/50 bg-gradient-to-l from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9 shrink-0 mt-0.5">
                {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5 rotate-180" />}
              </Button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 border-0 px-2">
                    #{project.number}
                  </Badge>
                  <StatusBadge status={project.status} language={language} />
                  <Badge variant="outline" className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 border-0">
                    {project.type === "villa" ? t("فيلا", "Villa") :
                     project.type === "building" ? t("مبنى", "Building") :
                     project.type === "commercial" ? t("تجاري", "Commercial") :
                     t("صناعي", "Industrial")}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
                  {isAr ? project.name : project.nameEn || project.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {project.client?.name} {project.client?.company ? `— ${project.client.company}` : ""}
                </p>
              </div>
            </div>

            {/* Right: Progress Ring + Actions */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <ProgressRing value={Math.round(project.progress)} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    {Math.round(project.progress)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Pencil className="h-3.5 w-3.5" />
                  {t("تعديل", "Edit")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Main Tabs ===== */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <ScrollArea className="w-full -mb-px" dir={isAr ? "rtl" : "ltr"}>
          <TabsList className="bg-slate-100 dark:bg-slate-800 h-auto p-1 rounded-xl w-fit min-w-full">
            {mainTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm",
                  "data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400"
                )}
              >
                <tab.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{isAr ? tab.labelAr : tab.labelEn}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {/* ===== Tab Contents ===== */}
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <OverviewTab project={project} language={language} />
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="mt-4">
          <SubTabsNav 
            tabs={technicalSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="space-y-4">
            {activeSubTab === "architectural" && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard 
                    label={t("الإنجاز", "Progress")} 
                    value={`${Math.round(project.stages?.filter((s) => s.department === "architectural" && s.status === "APPROVED").length / Math.max(project.stages?.filter((s) => s.department === "architectural").length, 1) * 100 || 0)}%`} 
                    icon={TrendingUp} 
                    color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                  />
                  <StatCard 
                    label={t("مكتمل", "Completed")} 
                    value={`${project.stages?.filter((s) => s.department === "architectural" && s.status === "APPROVED").length || 0}/${project.stages?.filter((s) => s.department === "architectural").length || 0}`} 
                    icon={CheckCircle2} 
                    color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" 
                  />
                  <StatCard 
                    label={t("قيد التنفيذ", "In Progress")} 
                    value={project.stages?.filter((s) => s.department === "architectural" && s.status === "IN_PROGRESS").length || 0} 
                    icon={Clock} 
                    color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" 
                  />
                  <StatCard 
                    label={t("عدد الرفوض", "Rejections")} 
                    value={0} 
                    icon={XCircle} 
                    color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                  />
                </div>
                {/* Stages */}
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">{t("مراحل القسم المعماري", "Architectural Stages")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.stages?.filter((s) => s.department === "architectural").length > 0 ? (
                      <StageStepper stages={project.stages.filter((s) => s.department === "architectural")} language={language} />
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Building2 className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                        <p>{t("لا توجد مراحل", "No stages defined")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            {activeSubTab === "structural" && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard 
                    label={t("الإنجاز", "Progress")} 
                    value={`${Math.round(project.stages?.filter((s) => s.department === "structural" && s.status === "APPROVED").length / Math.max(project.stages?.filter((s) => s.department === "structural").length, 1) * 100 || 0)}%`} 
                    icon={TrendingUp} 
                    color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                  />
                  <StatCard 
                    label={t("مكتمل", "Completed")} 
                    value={`${project.stages?.filter((s) => s.department === "structural" && s.status === "APPROVED").length || 0}/${project.stages?.filter((s) => s.department === "structural").length || 0}`} 
                    icon={CheckCircle2} 
                    color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" 
                  />
                  <StatCard 
                    label={t("قيد التنفيذ", "In Progress")} 
                    value={project.stages?.filter((s) => s.department === "structural" && s.status === "IN_PROGRESS").length || 0} 
                    icon={Clock} 
                    color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" 
                  />
                  <StatCard 
                    label={t("عدد الرفوض", "Rejections")} 
                    value={0} 
                    icon={XCircle} 
                    color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                  />
                </div>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">{t("مراحل القسم الإنشائي", "Structural Stages")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.stages?.filter((s) => s.department === "structural").length > 0 ? (
                      <StageStepper stages={project.stages.filter((s) => s.department === "structural")} language={language} />
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <HardHat className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                        <p>{t("لا توجد مراحل", "No stages defined")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            {activeSubTab === "electrical" && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard 
                    label={t("الإنجاز", "Progress")} 
                    value={`${Math.round(project.stages?.filter((s) => s.department === "electrical" && s.status === "APPROVED").length / Math.max(project.stages?.filter((s) => s.department === "electrical").length, 1) * 100 || 0)}%`} 
                    icon={TrendingUp} 
                    color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                  />
                  <StatCard 
                    label={t("مكتمل", "Completed")} 
                    value={`${project.stages?.filter((s) => s.department === "electrical" && s.status === "APPROVED").length || 0}/${project.stages?.filter((s) => s.department === "electrical").length || 0}`} 
                    icon={CheckCircle2} 
                    color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" 
                  />
                  <StatCard 
                    label={t("قيد التنفيذ", "In Progress")} 
                    value={project.stages?.filter((s) => s.department === "electrical" && s.status === "IN_PROGRESS").length || 0} 
                    icon={Clock} 
                    color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" 
                  />
                  <StatCard 
                    label={t("عدد الرفوض", "Rejections")} 
                    value={0} 
                    icon={XCircle} 
                    color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                  />
                </div>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">{t("مراحل الكهرباء", "Electrical Stages")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.stages?.filter((s) => s.department === "electrical").length > 0 ? (
                      <StageStepper stages={project.stages.filter((s) => s.department === "electrical")} language={language} />
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Zap className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                        <p>{t("لا توجد مراحل", "No stages defined")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            {activeSubTab === "plumbing" && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard 
                    label={t("الإنجاز", "Progress")} 
                    value={`${Math.round(project.stages?.filter((s) => s.department === "plumbing" && s.status === "APPROVED").length / Math.max(project.stages?.filter((s) => s.department === "plumbing").length, 1) * 100 || 0)}%`} 
                    icon={TrendingUp} 
                    color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                  />
                  <StatCard 
                    label={t("مكتمل", "Completed")} 
                    value={`${project.stages?.filter((s) => s.department === "plumbing" && s.status === "APPROVED").length || 0}/${project.stages?.filter((s) => s.department === "plumbing").length || 0}`} 
                    icon={CheckCircle2} 
                    color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" 
                  />
                  <StatCard 
                    label={t("قيد التنفيذ", "In Progress")} 
                    value={project.stages?.filter((s) => s.department === "plumbing" && s.status === "IN_PROGRESS").length || 0} 
                    icon={Clock} 
                    color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" 
                  />
                  <StatCard 
                    label={t("عدد الرفوض", "Rejections")} 
                    value={0} 
                    icon={XCircle} 
                    color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                  />
                </div>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">{t("مراحل السباكة", "Plumbing Stages")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.stages?.filter((s) => s.department === "plumbing").length > 0 ? (
                      <StageStepper stages={project.stages.filter((s) => s.department === "plumbing")} language={language} />
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Droplets className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                        <p>{t("لا توجد مراحل", "No stages defined")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            {activeSubTab === "gov-approvals" && (
              <Card className="border-slate-200 dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">{t("الموافقات الحكومية", "Government Approvals")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.govApprovals && project.govApprovals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {project.govApprovals.map((approval) => (
                        <div key={approval.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium">{approval.authority}</span>
                          </div>
                          <StatusBadge status={approval.status} language={language} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Landmark className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                      <p>{t("لا توجد موافقات", "No approvals tracked")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {activeSubTab === "boq" && <BOQPage language={language} />}
            {activeSubTab === "change-orders" && <ChangeOrdersPage language={language} />}
            {activeSubTab === "risks" && <RisksPage language={language} />}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <TasksKanban language={language} projectId={currentProjectId || undefined} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <SubTabsNav 
            tabs={documentsSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            {activeSubTab === "contract" && <ContractsPage language={language} />}
            {activeSubTab === "documents" && <DocumentsPage language={language} />}
            {activeSubTab === "municipality" && <MunicipalityCorrespondencePage language={language} />}
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="mt-4">
          <SubTabsNav 
            tabs={financialSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            {activeSubTab === "invoices" && <InvoicesPage language={language} />}
            {activeSubTab === "payments" && <PaymentsPage language={language} />}
            {activeSubTab === "budgets" && <BudgetsPage language={language} />}
            {activeSubTab === "proposals" && <ProposalsPage language={language} />}
            {activeSubTab === "bids" && <BidsPage language={language} />}
          </div>
        </TabsContent>

        {/* Site Tab */}
        <TabsContent value="site" className="mt-4">
          <SubTabsNav 
            tabs={siteSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            {activeSubTab === "clients" && <ClientsPage language={language} />}
            {activeSubTab === "site-visits" && <SiteVisitsPage language={language} />}
            {activeSubTab === "site-diary" && <SiteDiaryPage language={language} />}
            {activeSubTab === "rfi" && <RFIPage language={language} />}
            {activeSubTab === "defects" && <DefectsPage language={language} />}
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-4">
          <SubTabsNav 
            tabs={teamSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            {activeSubTab === "team-members" && (
              <div className="text-center py-8">
                <UsersRound className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold">{t("فريق المشروع", "Project Team")}</h3>
                <p className="text-slate-500 mt-2">{t("أعضاء الفريق العاملين على المشروع", "Team members working on this project")}</p>
              </div>
            )}
            {activeSubTab === "meetings" && <MeetingsPage language={language} />}
            {activeSubTab === "approvals" && <ApprovalsPage language={language} />}
            {activeSubTab === "notifications" && <NotificationsPage language={language} />}
            {activeSubTab === "activity-log" && <ActivityLog language={language} />}
          </div>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="mt-4">
          <SubTabsNav 
            tabs={helpSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            {activeSubTab === "ai-assistant" && <AIAssistant language={language} />}
            {activeSubTab === "knowledge" && <KnowledgePage language={language} />}
            {activeSubTab === "calendar" && <CalendarPage language={language} />}
            {activeSubTab === "search" && <GlobalSearch language={language} />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
