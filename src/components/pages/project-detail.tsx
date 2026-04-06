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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Eye,
  PenLine,
  HardHat,
  Zap,
  DollarSign,
  MapPin,
  Shield,
  FileSpreadsheet,
  CalendarRange,
  Users,
  MessageSquare,
  LayoutGrid,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Circle,
  ChevronLeft,
  Building2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Timer,
  FileText,
  Phone,
  Mail,
  Layers,
  Droplets,
  Pencil,
  Trash2,
  Building,
  Plus,
  ClipboardCheck,
  UserPlus,
  ArrowUpRight,
  MessageCircle,
  Briefcase,
  Star,
} from "lucide-react";

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

interface ClientInteraction {
  id: string;
  type: string;
  date: string;
  subject: string;
  description: string;
  outcome: string;
  client: { id: string; name: string };
}

interface SiteVisit {
  id: string;
  date: string;
  plotNumber: string;
  municipality: string;
  status: string;
}

interface Defect {
  id: string;
  title: string;
  severity: string;
  status: string;
}

interface SiteDiary {
  id: string;
  date: string;
  weather: string;
  workerCount: number;
  workDescription: string;
}

interface InvoiceBrief {
  id: string;
  number: string;
  total: number;
  paidAmount: number;
  status: string;
}

interface Assignment {
  id: string;
  role: string;
  user: { id: string; name: string; avatar: string; department: string; position: string };
}

interface MuniRejection {
  id: string;
  department: string;
  count: number;
  notes: string;
  lastRejectionDate: string | null;
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
  stagesByDepartment: Record<string, ProjectStage[]>;
  govApprovals: GovApproval[];
  muniRejections: MuniRejection[];
  boqItems: BOQItem[];
  schedulePhases: SchedulePhase[];
  scheduleBySection: Record<string, SchedulePhase[]>;
  invoices: InvoiceBrief[];
  contracts: Array<{ id: string; value: number; status: string }>;
  budgets: Array<{ planned: number; actual: number; category: string }>;
  siteVisits: SiteVisit[];
  defects: Defect[];
  siteDiaries: SiteDiary[];
  clientInteractions: ClientInteraction[];
  taskStats: { total: number; todo: number; inProgress: number; review: number; done: number };
}

// ===== CONSTANTS =====
const ARCHITECTURAL_STAGES = [
  "sketch_start", "design_concept", "plan_development", "preliminary_docs",
  "3d_rendering", "owner_approval", "execution_plans", "final_plans",
];

const STRUCTURAL_STAGES = [
  "soil_report", "foundation_plan", "beams", "columns", "slabs",
  "stairs", "3d_model", "structural_details", "design_calculations", "schedules",
];

const MEP_SECTIONS = [
  "mep_electrical", "mep_plumbing", "mep_water", "mep_civil_defense", "mep_telecom",
];

const GOV_AUTHORITIES = ["MUN", "FEWA", "ETISALAT", "CIVIL_DEFENSE"];

const SCHEDULE_SECTIONS = ["architectural", "structural", "electrical", "governmental"];

const STAGE_LABELS: Record<string, Record<string, string>> = {
  ar: {
    sketch_start: "بدء المخطط", design_concept: "مفهوم التصميم",
    plan_development: "تطوير المخططات", preliminary_docs: "المستندات الأولية",
    "3d_rendering": "التصيير ثلاثي الأبعاد", owner_approval: "موافقة المالك",
    execution_plans: "مخططات التنفيذ", final_plans: "المخططات النهائية",
    soil_report: "تقرير التربة", foundation_plan: "مخطط الأساسات",
    beams: "العتلات", columns: "الأعمدة", slabs: "البلاطات",
    stairs: "الدرج", "3d_model": "النموذج ثلاثي الأبعاد",
    structural_details: "التفاصيل الإنشائية", design_calculations: "حسابات التصميم",
    schedules: "الجداول",
    mep_electrical: "الكهرباء", mep_plumbing: "الصرف الصحي",
    mep_water: "مياه الشرب", mep_civil_defense: "الدفاع المدني",
    mep_telecom: "الاتصالات",
    MUN: "البلدية", FEWA: "هيئة الإمارات", ETISALAT: "اتصالات",
    CIVIL_DEFENSE: "الدفاع المدني",
  },
  en: {
    sketch_start: "Sketch Start", design_concept: "Design Concept",
    plan_development: "Plan Development", preliminary_docs: "Preliminary Docs",
    "3d_rendering": "3D Rendering", owner_approval: "Owner Approval",
    execution_plans: "Execution Plans", final_plans: "Final Plans",
    soil_report: "Soil Report", foundation_plan: "Foundation Plan",
    beams: "Beams", columns: "Columns", slabs: "Slabs",
    stairs: "Stairs", "3d_model": "3D Model",
    structural_details: "Structural Details", design_calculations: "Design Calculations",
    schedules: "Schedules",
    mep_electrical: "Electricity", mep_plumbing: "Plumbing",
    mep_water: "Water Supply", mep_civil_defense: "Civil Defense",
    mep_telecom: "Telecom",
    MUN: "Municipality", FEWA: "FEWA", ETISALAT: "Etisalat",
    CIVIL_DEFENSE: "Civil Defense",
  },
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  ar: {
    NOT_STARTED: "لم يبدأ", IN_PROGRESS: "قيد التنفيذ",
    SUBMITTED: "مقدم للمراجعة", APPROVED: "معتمد", REJECTED: "مرفوض",
    PENDING: "معلق", COMPLETED: "مكتمل", DRAFT: "مسودة",
    SENT: "مرسل", OPEN: "مفتوح", RESOLVED: "تم الحل",
    active: "نشط", completed: "مكتمل", delayed: "متأخر",
    on_hold: "معلق", cancelled: "ملغى", paid: "مدفوع",
    overdue: "متأخر الدفع", partial: "مدفوع جزئيا",
  },
  en: {
    NOT_STARTED: "Not Started", IN_PROGRESS: "In Progress",
    SUBMITTED: "Submitted", APPROVED: "Approved", REJECTED: "Rejected",
    PENDING: "Pending", COMPLETED: "Completed", DRAFT: "Draft",
    SENT: "Sent", OPEN: "Open", RESOLVED: "Resolved",
    active: "Active", completed: "Completed", delayed: "Delayed",
    on_hold: "On Hold", cancelled: "Cancelled", paid: "Paid",
    overdue: "Overdue", partial: "Partial",
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
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
  completed: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800",
  delayed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
  on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
};

const BOQ_CATEGORIES: Record<string, Record<string, string>> = {
  ar: { civil: "أشغال مدنية", structural: "أشغال إنشائية", electrical: "أشغال كهربائية", finishing: "أشغال تشطيب" },
  en: { civil: "Civil", structural: "Structural", electrical: "Electrical", finishing: "Finishing" },
};

const GOV_AUTHORITY_ICONS: Record<string, string> = {
  MUN: "🏛️",
  FEWA: "💧",
  ETISALAT: "📡",
  CIVIL_DEFENSE: "🚒",
};

// ===== UTILITY HELPERS =====
const AVATAR_COLORS = ["#14b8a6", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#06b6d4", "#84cc16"];

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getMockActivities(language: "ar" | "en") {
  const isAr = language === "ar";
  return [
    { id: "1", type: "progress", icon: TrendingUp, color: "#14b8a6", user: isAr ? "أحمد محمد" : "Ahmed M.", action: isAr ? "حدّث تقدم المشروع إلى 75%" : "Updated project progress to 75%", time: isAr ? "منذ ساعتين" : "2 hours ago" },
    { id: "2", type: "task", icon: ClipboardCheck, color: "#10b981", user: isAr ? "سارة علي" : "Sara A.", action: isAr ? "أكملت مهمة مراجعة المخططات" : "Completed drawing review task", time: isAr ? "منذ 5 ساعات" : "5 hours ago" },
    { id: "3", type: "invoice", icon: FileText, color: "#8b5cf6", user: isAr ? "خالد حسن" : "Khaled H.", action: isAr ? "أُصدِرت فاتورة #INV-045" : "Invoice #INV-045 issued", time: isAr ? "أمس" : "Yesterday" },
    { id: "4", type: "approval", icon: Shield, color: "#f59e0b", user: isAr ? "محمد عمر" : "Mohamed O.", action: isAr ? "تم الحصول على موافقة البلدية" : "Municipality approval obtained", time: isAr ? "منذ يومين" : "2 days ago" },
    { id: "5", type: "comment", icon: MessageCircle, color: "#3b82f6", user: isAr ? "فاطمة أحمد" : "Fatima A.", action: isAr ? "أضافت تعليقاً على مرحلة التصميم" : "Added comment on design phase", time: isAr ? "منذ 3 أيام" : "3 days ago" },
  ];
}

// ===== HELPER COMPONENTS =====
function StatusBadge({ status, language, pulse }: { status: string; language: "ar" | "en"; pulse?: boolean }) {
  const label = STATUS_LABELS[language]?.[status] || status;
  const color = STATUS_COLORS[status] || STATUS_COLORS.NOT_STARTED;
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium border-0 px-2.5 py-0.5", color, pulse && "animate-pulse")}
    >
      {label}
    </Badge>
  );
}

function FormatAED({ amount }: { amount: number }) {
  return (
    <span className="font-medium">
      {amount.toLocaleString()} <span className="text-xs text-slate-400 font-normal">AED</span>
    </span>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  language,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  color: string;
  language: "ar" | "en";
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow duration-200">
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

function ProgressRing({ value, size = 56, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#10b981" : value >= 40 ? "#14b8a6" : value >= 20 ? "#f59e0b" : "#94a3b8";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
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
  const deptStages = stages.filter((s) => s.department === department);
  const completed = deptStages.filter((s) => s.status === "APPROVED").length;
  const total = deptStages.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-4 border-s-4"
      style={{ borderInlineStartWidth: "4px", borderInlineStartColor: accentColor }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{label}</h4>
          <p className="text-xs text-slate-400">{completed}/{total} {language === "ar" ? "مراحل" : "stages"}</p>
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{pct}%</span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}

// ===== STAGE STEPPER COMPONENT =====
function StageStepper({
  stages,
  language,
}: {
  stages: ProjectStage[];
  language: "ar" | "en";
}) {
  const isAr = language === "ar";
  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-0 overflow-x-auto pb-4 scrollbar-thin">
        {sortedStages.map((stage, idx) => {
          const stageLabel = STAGE_LABELS[language]?.[stage.stageName] || stage.stageName;
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
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 animate-pulse"
                    : isRejected
                    ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                    : isSubmitted
                    ? "bg-amber-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                )}>
                  {isApproved ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isRejected ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    stage.stageOrder + 1
                  )}
                </div>
                <p className="text-[10px] text-center font-medium text-slate-600 dark:text-slate-400 leading-tight line-clamp-2">
                  {stageLabel}
                </p>
                {isApproved && (
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {isAr ? "معتمد" : "Approved"}
                  </span>
                )}
                {isInProgress && (
                  <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">
                    {isAr ? "جاري" : "Active"}
                  </span>
                )}
                {isRejected && (
                  <span className="text-[9px] text-red-600 dark:text-red-400 font-medium">
                    {isAr ? "مرفوض" : "Rejected"}
                  </span>
                )}
              </div>
              {/* Connector Line */}
              {idx < sortedStages.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-0.5 rounded-full shrink-0",
                  isApproved ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                )} />
              )}
            </div>
          );
        })}
      </div>
      {/* Stage Details */}
      <div className="mt-4 space-y-2">
        {sortedStages.map((stage) => {
          const stageLabel = STAGE_LABELS[language]?.[stage.stageName] || stage.stageName;
          return (
            <div key={stage.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                stage.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : stage.status === "IN_PROGRESS"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : stage.status === "REJECTED"
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : stage.status === "SUBMITTED"
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              )}>
                {stage.status === "APPROVED" ? "✓" : stage.stageOrder + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{stageLabel}</p>
                {stage.notes && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{stage.notes}</p>
                )}
              </div>
              <StatusBadge status={stage.status} language={language} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== GOV APPROVAL CARD =====
function GovApprovalCard({
  auth,
  approval,
  language,
}: {
  auth: string;
  approval: GovApproval | undefined;
  language: "ar" | "en";
}) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const label = STAGE_LABELS[language]?.[auth] || auth;
  const status = approval?.status || "PENDING";
  const emoji = GOV_AUTHORITY_ICONS[auth] || "📋";
  const icon = auth === "MUN" ? Building2 :
    auth === "FEWA" ? Droplets :
    auth === "ETISALAT" ? Phone :
    Shield;

  const isApproved = status === "APPROVED";
  const isPending = status === "PENDING";
  const isRejected = status === "REJECTED";

  return (
    <Card className={cn(
      "rounded-xl border-2 transition-all hover:shadow-md",
      isApproved
        ? "border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-slate-900"
        : isRejected
        ? "border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/10 dark:to-slate-900"
        : "border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900"
    )}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
            isApproved
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : isRejected
              ? "bg-red-100 dark:bg-red-900/30"
              : "bg-slate-100 dark:bg-slate-800"
          )}>
            {emoji}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">{label}</h4>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={status} language={language} pulse={isPending} />
              {approval && approval.rejectionCount > 0 && (
                <Badge variant="outline" className="text-xs border-red-200 text-red-600 bg-red-50 dark:bg-red-950/30">
                  <XCircle className="h-3 w-3 me-1" />
                  {approval.rejectionCount}x {t("رفض", "reject")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2 mb-4">
          {/* Submitted */}
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              approval?.submissionDate ? "bg-teal-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
            )}>
              {approval?.submissionDate ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[9px]">1</span>}
            </div>
            <span className="text-[10px] text-slate-500">{t("تقديم", "Submit")}</span>
          </div>

          {/* Connector */}
          <div className={cn(
            "flex-1 h-0.5 rounded-full max-w-[40px]",
            approval?.submissionDate ? "bg-teal-400" : "bg-slate-200 dark:bg-slate-700"
          )} />

          {/* Rejected N times */}
          {approval?.rejectionCount && approval.rejectionCount > 0 && (
            <>
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <XCircle className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] text-red-500 font-medium">{approval.rejectionCount}x</span>
              </div>
              <div className="flex-1 h-0.5 rounded-full bg-amber-300 dark:bg-amber-700 max-w-[40px]" />
            </>
          )}

          {/* Approved */}
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              isApproved ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
            )}>
              {isApproved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[9px]">✓</span>}
            </div>
            <span className="text-[10px] text-slate-500">{t("موافقة", "Approve")}</span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/30 rounded-lg p-3">
          <div>
            <span className="text-slate-400">{t("تاريخ التقديم", "Submitted")}</span>
            <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
              {approval?.submissionDate
                ? new Date(approval.submissionDate).toLocaleDateString(isAr ? "ar-AE" : "en-US")
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-slate-400">{t("تاريخ الموافقة", "Approved")}</span>
            <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
              {approval?.approvalDate
                ? new Date(approval.approvalDate).toLocaleDateString(isAr ? "ar-AE" : "en-US")
                : "—"}
            </p>
          </div>
        </div>
        {approval?.notes && (
          <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {approval.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ===== GANTT BAR =====
function GanttBar({
  phase,
  language,
}: {
  phase: SchedulePhase;
  language: "ar" | "en";
}) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const pct = phase.maxDuration > 0 ? Math.min((phase.duration / phase.maxDuration) * 100, 100) : 0;
  const isOverdue = phase.duration > phase.maxDuration && phase.status !== "COMPLETED";
  const barColor = phase.status === "COMPLETED"
    ? "bg-emerald-500"
    : phase.status === "IN_PROGRESS"
    ? "bg-amber-500"
    : "bg-slate-300 dark:bg-slate-600";

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
        {phase.status === "COMPLETED" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : phase.status === "IN_PROGRESS" ? (
          <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
        ) : (
          <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
            {phase.phaseName}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {isOverdue && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-3 w-3 me-0.5" />
                {t("تحذير", "Warn")}
              </Badge>
            )}
            <span className={cn(
              "text-xs font-bold tabular-nums",
              isOverdue ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"
            )}>
              {phase.duration}/{phase.maxDuration} {t("يوم", "d")}
            </span>
          </div>
        </div>
        {/* Gantt Bar */}
        <div className="relative h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function ProjectDetail({ language }: ProjectDetailProps) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { currentProjectId, currentProjectTab, setCurrentProjectId, setCurrentPage, setCurrentProjectTab } = useNavStore();

  const [activeTab, setActiveTab] = useState(currentProjectTab || "overview");

  const prevTabRef = useState(currentProjectTab || "overview");
  if (currentProjectTab !== prevTabRef[0]) {
    prevTabRef[1](currentProjectTab);
    setActiveTab(currentProjectTab || "overview");
  }

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
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentProjectTab(tab);
  };

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    setCurrentProjectTab(tab);
  };

  const totalInvoiced = project?.invoices?.reduce((s, i) => s + i.total, 0) || 0;
  const totalPaid = project?.invoices?.reduce((s, i) => s + i.paidAmount, 0) || 0;
  const totalBudgetActual = project?.budgets?.reduce((s, b) => s + b.actual, 0) || 0;
  const budgetPct = (project?.budget ?? 0) > 0 ? Math.min(Math.round((totalBudgetActual / (project?.budget ?? 0)) * 100), 100) : 0;

  const getStageProgress = (department: string) => {
    if (!project?.stages) return 0;
    const deptStages = project.stages.filter((s) => s.department === department);
    const completed = deptStages.filter((s) => s.status === "APPROVED").length;
    return deptStages.length > 0 ? Math.round((completed / deptStages.length) * 100) : 0;
  };

  const getSectionScheduleProgress = (section: string) => {
    if (!project?.schedulePhases) return 0;
    const phases = project.schedulePhases.filter((p) => p.section === section);
    const completed = phases.filter((p) => p.status === "COMPLETED").length;
    return phases.length > 0 ? Math.round((completed / phases.length) * 100) : 0;
  };

  const tabItems = [
    { value: "overview", label: isAr ? "نظرة عامة" : "Overview", icon: Eye },
    { value: "architectural", label: isAr ? "المعماري" : "Architectural", icon: PenLine },
    { value: "structural", label: isAr ? "الإنشائي" : "Structural", icon: HardHat },
    { value: "mep", label: isAr ? "الكهروميكانيك" : "MEP", icon: Zap },
    { value: "financial", label: isAr ? "المالي" : "Financial", icon: DollarSign },
    { value: "site", label: isAr ? "الموقع" : "Site", icon: MapPin },
    { value: "approvals", label: isAr ? "الموافقات" : "Approvals", icon: Shield },
    { value: "boq", label: isAr ? "الكميات" : "BOQ", icon: FileSpreadsheet },
    { value: "schedule", label: isAr ? "الجدول" : "Schedule", icon: CalendarRange },
    { value: "responsibility", label: isAr ? "المسؤوليات" : "Matrix", icon: Users },
    { value: "interactions", label: isAr ? "التفاعلات" : "Interactions", icon: MessageSquare },
  ];

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

  const isDelayed = project.status === "delayed";

  return (
    <div className="space-y-4">
      {/* ===== Header ===== */}
      <Card className="border-slate-200 dark:border-slate-700/50 bg-gradient-to-l from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {/* Back Button */}
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9 shrink-0 mt-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5 rotate-180" />}
              </Button>
              <div>
                {/* Top meta line */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 border-0 px-2">
                    #{project.number}
                  </Badge>
                  <StatusBadge
                    status={project.status}
                    language={language}
                    pulse={isDelayed}
                  />
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
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ProgressRing value={Math.round(project.progress)} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      {Math.round(project.progress)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Pencil className="h-3.5 w-3.5" />
                  {t("تعديل", "Edit")}
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 border-red-200 dark:border-red-800">
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("حذف", "Delete")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs + Sidebar layout */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tab Triggers */}
            <ScrollArea className="w-full -mb-px" dir={isAr ? "rtl" : "ltr"}>
              <TabsList className="bg-slate-100 dark:bg-slate-800 h-auto p-1 rounded-xl w-fit min-w-full">
                {tabItems.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm transition-all",
                      "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm",
                      "data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:rounded-b-none"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>

            {/* Tab 1: Overview */}
            <TabsContent value="overview">
              <div className="space-y-4 mt-4">
                {/* Hero Section */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 dark:from-teal-800 dark:via-teal-700 dark:to-cyan-700 p-6 md:p-8 text-white">
                  {/* Decorative pattern overlay */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-[10px] font-mono px-2 py-0.5">
                            #{project.number}
                          </Badge>
                          <Badge className={cn(
                            "border-0 text-[10px] font-medium px-2 py-0.5",
                            project.status === "active" ? "bg-emerald-500/80 text-white" :
                            project.status === "completed" ? "bg-teal-500/80 text-white" :
                            project.status === "delayed" ? "bg-red-500/80 text-white" :
                            "bg-white/30 text-white"
                          )}>
                            {STATUS_LABELS[language]?.[project.status] || project.status}
                          </Badge>
                          <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-[10px] px-2 py-0.5">
                            {project.type === "villa" ? t("فيلا", "Villa") :
                              project.type === "building" ? t("مبنى", "Building") :
                              project.type === "commercial" ? t("تجاري", "Commercial") :
                              t("صناعي", "Industrial")}
                          </Badge>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">
                          {isAr ? project.name : project.nameEn || project.name}
                        </h2>
                        <p className="text-white/80 text-sm mb-4">
                          <Users className="h-3.5 w-3.5 inline me-1" />
                          {project.client?.name} {project.client?.company ? `— ${project.client.company}` : ""}
                          {project.location && (
                            <>
                              {" · "}
                              <MapPin className="h-3.5 w-3.5 inline me-1" />
                              {project.location}
                            </>
                          )}
                          {project.plotNumber && (
                            <>
                              {" · "}
                              <MapPin className="h-3.5 w-3.5 inline me-1" />
                              {project.plotNumber}
                            </>
                          )}
                        </p>
                        {/* Key Metrics Pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs">
                            <CalendarRange className="h-3 w-3" />
                            <span className="text-white/70">{t("البدء", "Start")}:</span>
                            <span className="font-semibold">{project.startDate ? new Date(project.startDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", day: "numeric" }) : "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs">
                            <Timer className="h-3 w-3" />
                            <span className="text-white/70">{t("الانتهاء", "End")}:</span>
                            <span className="font-semibold">{project.endDate ? new Date(project.endDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", day: "numeric" }) : "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs">
                            <Wallet className="h-3 w-3" />
                            <span className="font-mono font-semibold">{project.budget.toLocaleString()} {isAr ? "د.إ" : "AED"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs">
                            <TrendingUp className="h-3 w-3" />
                            <span className="font-bold">{Math.round(project.progress)}%</span>
                          </div>
                        </div>
                      </div>
                      {/* Large Progress Ring */}
                      <div className="flex flex-col items-center gap-2 lg:gap-3 shrink-0">
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
                    </div>
                  </div>
                </div>

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard
                    label={t("قيمة العقد", "Contract Value")}
                    value={<><span className="font-mono tabular-nums">{(project.budget || 0).toLocaleString()}</span> <span className="text-xs text-slate-400 font-normal">{isAr ? "د.إ" : "AED"}</span></>}
                    icon={Wallet}
                    color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                    language={language}
                  />
                  <StatCard
                    label={t("المصروفات الفعلية", "Spent to Date")}
                    value={<><span className="font-mono tabular-nums">{totalBudgetActual.toLocaleString()}</span> <span className="text-xs text-slate-400 font-normal">{isAr ? "د.إ" : "AED"}</span></>}
                    icon={TrendingDown}
                    color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    language={language}
                  />
                  <StatCard
                    label={t("المتبقي", "Remaining")}
                    value={<><span className="font-mono tabular-nums">{Math.max(0, (project.budget || 0) - totalBudgetActual).toLocaleString()}</span> <span className="text-xs text-slate-400 font-normal">{isAr ? "د.إ" : "AED"}</span></>}
                    icon={DollarSign}
                    color={(project.budget || 0) - totalBudgetActual > 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}
                    language={language}
                  />
                  <StatCard
                    label={t("المهام", "Tasks")}
                    value={`${project.taskStats.done}/${project.taskStats.total}`}
                    icon={ClipboardCheck}
                    color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                    language={language}
                  />
                </div>

                {/* Budget Comparison + Progress Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Budget Utilization */}
                  <Card className="border-slate-200 dark:border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">{t("استهلاك الميزانية", "Budget Utilization")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Main utilization bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-500">{t("الفعلي / المخطط", "Actual / Planned")}</span>
                            <span className={cn("font-bold font-mono tabular-nums", budgetPct > 90 ? "text-red-600 dark:text-red-400" : budgetPct > 70 ? "text-amber-600 dark:text-amber-400" : "text-teal-600 dark:text-teal-400")}>
                              {budgetPct}%
                            </span>
                          </div>
                          <div className="h-5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-700 bg-gradient-to-r",
                                budgetPct > 90 ? "from-red-500 to-red-400" : budgetPct > 70 ? "from-amber-500 to-amber-400" : "from-teal-500 to-cyan-400"
                              )}
                              style={{ width: `${Math.min(budgetPct, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] mt-1 text-slate-400">
                            <span className="font-mono tabular-nums">{totalBudgetActual.toLocaleString()} {isAr ? "د.إ" : "AED"}</span>
                            <span className="font-mono tabular-nums">{project.budget.toLocaleString()} {isAr ? "د.إ" : "AED"}</span>
                          </div>
                        </div>
                        {/* Variance indicator */}
                        <div className={cn(
                          "flex items-center justify-between p-3 rounded-xl",
                          project.budget - totalBudgetActual >= 0
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50"
                            : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50"
                        )}>
                          <div className="flex items-center gap-2">
                            {project.budget - totalBudgetActual >= 0 ? (
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </div>
                            )}
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("الانحراف", "Variance")}</span>
                          </div>
                          <span className={cn("font-bold font-mono tabular-nums text-sm", project.budget - totalBudgetActual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                            {project.budget - totalBudgetActual >= 0 ? "+" : ""}{(project.budget - totalBudgetActual).toLocaleString()} {isAr ? "د.إ" : "AED"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Task Stats Visual */}
                  <Card className="border-slate-200 dark:border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">{t("إحصائيات المهام", "Task Statistics")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Task distribution bar */}
                      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex mb-4">
                        {project.taskStats.total > 0 && (
                          <>
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(project.taskStats.done / project.taskStats.total) * 100}%` }} />
                            <div className="h-full bg-violet-500 transition-all" style={{ width: `${(project.taskStats.review / project.taskStats.total) * 100}%` }} />
                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${(project.taskStats.inProgress / project.taskStats.total) * 100}%` }} />
                            <div className="h-full bg-amber-400 transition-all" style={{ width: `${(project.taskStats.todo / project.taskStats.total) * 100}%` }} />
                          </>
                        )}
                      </div>
                      {/* Legend + counts */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                          <span className="text-xs text-slate-500 flex-1">{t("معلقة", "To Do")}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{project.taskStats.todo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs text-slate-500 flex-1">{t("قيد التنفيذ", "In Progress")}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{project.taskStats.inProgress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-violet-500 shrink-0" />
                          <span className="text-xs text-slate-500 flex-1">{t("مراجعة", "Review")}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{project.taskStats.review}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-xs text-slate-500 flex-1">{t("مكتملة", "Done")}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{project.taskStats.done}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{t("الإجمالي", "Total")}</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{project.taskStats.total}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Department Progress with Accent Colors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <DepartmentProgress
                    stages={project.stages}
                    department="architectural"
                    language={language}
                    label={t("القسم المعماري", "Architectural")}
                    icon={PenLine}
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
                    department="mep_electrical"
                    language={language}
                    label={t("الكهرباء والميكانيك", "MEP")}
                    icon={Zap}
                    accentColor="#8b5cf6"
                  />
                </div>

                {/* Bottom Row: Team Members + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Project Team Members */}
                  <Card className="border-slate-200 dark:border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4 text-teal-600" />
                        {t("فريق المشروع", "Project Team")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {project.assignments.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">{t("لا يوجد أعضاء", "No team members")}</p>
                      ) : (
                        <div className="space-y-2.5 max-h-64 overflow-y-auto">
                          {project.assignments.map((assign) => {
                            const avatarColor = getAvatarColor(assign.user.name);
                            return (
                              <div key={assign.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm"
                                  style={{ backgroundColor: avatarColor }}
                                >
                                  {getInitials(assign.user.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{assign.user.name}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{assign.user.department} — {assign.user.position}</p>
                                </div>
                                <Badge variant="outline" className="text-[10px] bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800 shrink-0">
                                  {assign.role}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Activity Timeline */}
                  <Card className="border-slate-200 dark:border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-teal-600" />
                          {t("النشاط الأخير", "Recent Activity")}
                        </div>
                        <button className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
                          {t("عرض الكل", "View All")}
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative max-h-64 overflow-y-auto">
                        {/* Vertical timeline line */}
                        <div className={cn("absolute top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700", isAr ? "right-[19px]" : "left-[19px]")} />
                        <div className="space-y-4">
                          {getMockActivities(language).map((activity) => (
                            <div key={activity.id} className={cn("relative flex gap-3", isAr ? "flex-row-reverse" : "")}>
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm"
                                style={{ backgroundColor: `${activity.color}15`, color: activity.color }}
                              >
                                <activity.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  <span className="font-semibold">{activity.user}</span>{" "}
                                  <span className="text-slate-500 dark:text-slate-400">{activity.action}</span>
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{activity.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                {project.description && (
                  <Card className="border-slate-200 dark:border-slate-700/50">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-400 mb-1.5">{t("وصف المشروع", "Project Description")}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{project.description}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Tab 2: Architectural */}
            <TabsContent value="architectural">
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label={t("الإنجاز", "Progress")} value={`${getStageProgress("architectural")}%`} icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" language={language} />
                  <StatCard label={t("مكتمل", "Completed")} value={`${project.stages.filter((s) => s.department === "architectural" && s.status === "APPROVED").length}/${project.stages.filter((s) => s.department === "architectural").length}`} icon={CheckCircle2} color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" language={language} />
                  <StatCard label={t("قيد التنفيذ", "In Progress")} value={project.stages.filter((s) => s.department === "architectural" && s.status === "IN_PROGRESS").length} icon={Clock} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" language={language} />
                  <StatCard label={t("عدد الرفوض", "Rejections")} value={project.muniRejections.filter((r) => r.department === "architectural")[0]?.count || 0} icon={XCircle} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" language={language} />
                </div>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">{t("مراحل القسم المعماري", "Architectural Stages")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StageStepper stages={project.stages.filter((s) => s.department === "architectural")} language={language} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 3: Structural */}
            <TabsContent value="structural">
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label={t("الإنجاز", "Progress")} value={`${getStageProgress("structural")}%`} icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" language={language} />
                  <StatCard label={t("مكتمل", "Completed")} value={`${project.stages.filter((s) => s.department === "structural" && s.status === "APPROVED").length}/${project.stages.filter((s) => s.department === "structural").length}`} icon={CheckCircle2} color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" language={language} />
                  <StatCard label={t("قيد التنفيذ", "In Progress")} value={project.stages.filter((s) => s.department === "structural" && s.status === "IN_PROGRESS").length} icon={Clock} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" language={language} />
                  <StatCard label={t("عدد الرفوض", "Rejections")} value={project.muniRejections.filter((r) => r.department === "structural")[0]?.count || 0} icon={XCircle} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" language={language} />
                </div>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">{t("مراحل القسم الإنشائي", "Structural Stages")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StageStepper stages={project.stages.filter((s) => s.department === "structural")} language={language} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 4: MEP */}
            <TabsContent value="mep">
              <MEPTabContent stages={project.stages} language={language} />
            </TabsContent>

            {/* Tab 5: Financial */}
            <TabsContent value="financial">
              <div className="space-y-4 mt-4">
                {/* 3 Budget Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Original Budget - Teal */}
                  <div className="rounded-xl p-4 bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-700 dark:to-teal-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/70 font-medium">{t("الميزانية الأصلية", "Original Budget")}</span>
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Wallet className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold font-mono tabular-nums">{project.budget.toLocaleString()}</p>
                    <p className="text-xs text-white/60 mt-1">{isAr ? "د.إ" : "AED"}</p>
                  </div>
                  {/* Spent to Date - Amber */}
                  <div className="rounded-xl p-4 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-700 dark:to-amber-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/70 font-medium">{t("المصروف حتى الآن", "Spent to Date")}</span>
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <TrendingDown className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold font-mono tabular-nums">{totalBudgetActual.toLocaleString()}</p>
                    <p className="text-xs text-white/60 mt-1">{isAr ? "د.إ" : "AED"} · {budgetPct}%</p>
                  </div>
                  {/* Remaining - Emerald/Red */}
                  <div className={cn(
                    "rounded-xl p-4 text-white",
                    project.budget - totalBudgetActual >= 0
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-700 dark:to-emerald-800"
                      : "bg-gradient-to-br from-red-500 to-red-600 dark:from-red-700 dark:to-red-800"
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/70 font-medium">{t("المتبقي", "Remaining")}</span>
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        {project.budget - totalBudgetActual >= 0
                          ? <TrendingUp className="h-5 w-5" />
                          : <AlertTriangle className="h-5 w-5" />
                        }
                      </div>
                    </div>
                    <p className="text-2xl font-bold font-mono tabular-nums">{Math.abs(project.budget - totalBudgetActual).toLocaleString()}</p>
                    <p className="text-xs text-white/60 mt-1">
                      {isAr ? "د.إ" : "AED"}
                      {project.budget - totalBudgetActual < 0 && ` (${t("تجاوز", "Overrun")})`}
                    </p>
                  </div>
                </div>

                {/* Budget Utilization Bar */}
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{t("استهلاك الميزانية", "Budget Utilization")}</CardTitle>
                      <div className="flex items-center gap-2">
                        {project.budget - totalBudgetActual >= 0 ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                            <TrendingUp className="h-3 w-3" />
                            {t("إيجابي", "Positive")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                            <TrendingDown className="h-3 w-3" />
                            {t("سلبي", "Negative")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-6 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700 bg-gradient-to-r",
                            budgetPct > 90 ? "from-red-500 to-rose-400" : budgetPct > 70 ? "from-amber-500 to-amber-400" : "from-teal-500 to-cyan-400"
                          )}
                          style={{ width: `${Math.min(budgetPct, 100)}%` }}
                        />
                        {/* 75% target marker */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10" style={{ left: "75%" }} />
                        <span className="absolute top-0.5 text-[9px] text-slate-500 z-20" style={{ left: "75%", transform: "translateX(-50%)" }}>75%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{t("المصروف", "Spent")}</span>
                        <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                          {totalBudgetActual.toLocaleString()} / {project.budget.toLocaleString()} {isAr ? "د.إ" : "AED"}
                        </span>
                      </div>
                      {/* Variance Indicator */}
                      <div className={cn(
                        "flex items-center justify-between p-3 rounded-xl mt-2",
                        project.budget - totalBudgetActual >= 0
                          ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50"
                          : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50"
                      )}>
                        <div className="flex items-center gap-2">
                          {project.budget - totalBudgetActual >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("الانحراف", "Variance")}</span>
                        </div>
                        <span className={cn("font-bold font-mono tabular-nums text-sm", project.budget - totalBudgetActual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                          {project.budget - totalBudgetActual >= 0 ? "+" : ""}{(project.budget - totalBudgetActual).toLocaleString()} {isAr ? "د.إ" : "AED"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Status Summary + Invoices */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Payment Status Summary */}
                  <Card className="border-slate-200 dark:border-slate-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">{t("حالة المدفوعات", "Payment Status")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const paidCount = project.invoices.filter(i => i.status === "paid").length;
                        const pendingCount = project.invoices.filter(i => i.status === "PENDING" || i.status === "SENT").length;
                        const overdueCount = project.invoices.filter(i => i.status === "overdue").length;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">{t("مدفوعة", "Paid")}</span>
                              </div>
                              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{paidCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">{t("معلقة", "Pending")}</span>
                              </div>
                              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">{pendingCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">{t("متأخرة", "Overdue")}</span>
                              </div>
                              <span className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">{overdueCount}</span>
                            </div>
                            {/* Collection rate */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-slate-400">{t("نسبة التحصيل", "Collection Rate")}</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                  {totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all"
                                  style={{ width: `${totalInvoiced > 0 ? Math.min((totalPaid / totalInvoiced) * 100, 100) : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Invoices Table */}
                  <Card className="border-slate-200 dark:border-slate-700/50 lg:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">{t("الفواتير", "Invoices")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {project.invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                          <FileText className="h-8 w-8 mb-2 opacity-30" />
                          <p className="text-sm">{t("لا توجد فواتير", "No invoices")}</p>
                        </div>
                      ) : (
                        <>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                                  <TableHead className="text-xs font-semibold">{t("الرقم", "No.")}</TableHead>
                                  <TableHead className="text-xs font-semibold">{t("المبلغ", "Amount")}</TableHead>
                                  <TableHead className="text-xs font-semibold">{t("المدفوع", "Paid")}</TableHead>
                                  <TableHead className="text-xs font-semibold">{t("المتبقي", "Balance")}</TableHead>
                                  <TableHead className="text-xs font-semibold">{t("الحالة", "Status")}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {project.invoices.slice(0, 5).map((inv, idx) => (
                                  <TableRow key={inv.id} className={cn(idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                                    <TableCell className="font-mono text-xs">{inv.number}</TableCell>
                                    <TableCell className="font-mono tabular-nums text-sm font-medium">{inv.total.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{isAr ? "د.إ" : "AED"}</span></TableCell>
                                    <TableCell className="font-mono tabular-nums text-sm text-emerald-600 dark:text-emerald-400">{inv.paidAmount.toLocaleString()}</TableCell>
                                    <TableCell className="font-mono tabular-nums text-sm">{(inv.total - inv.paidAmount).toLocaleString()}</TableCell>
                                    <TableCell><StatusBadge status={inv.status} language={language} /></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {project.invoices.length > 5 && (
                            <p className="text-xs text-slate-400 text-center mt-2">
                              {t(`+ ${project.invoices.length - 5} فواتير أخرى`, `+ ${project.invoices.length - 5} more invoices`)}
                            </p>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Budget Summary by Category */}
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">{t("ملخص الميزانية", "Budget Summary")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.budgets.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">{t("لا توجد بيانات ميزانية", "No budget data")}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                              <TableHead className="text-xs font-semibold">{t("التصنيف", "Category")}</TableHead>
                              <TableHead className="text-xs font-semibold">{t("المخطط", "Planned")}</TableHead>
                              <TableHead className="text-xs font-semibold">{t("الفعلي", "Actual")}</TableHead>
                              <TableHead className="text-xs font-semibold">{t("الانحراف", "Deviation")}</TableHead>
                              <TableHead className="text-xs font-semibold">{t("النسبة", "% Used")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {project.budgets.map((b, i) => {
                              const devPct = b.planned > 0 ? Math.round((b.actual / b.planned) * 100) : 0;
                              return (
                                <TableRow key={i} className={cn(i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                                  <TableCell className="font-medium text-sm">{b.category}</TableCell>
                                  <TableCell className="font-mono tabular-nums text-sm">{b.planned.toLocaleString()} <span className="text-[10px] text-slate-400">{isAr ? "د.إ" : "AED"}</span></TableCell>
                                  <TableCell className="font-mono tabular-nums text-sm">{b.actual.toLocaleString()} <span className="text-[10px] text-slate-400">{isAr ? "د.إ" : "AED"}</span></TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      {b.actual <= b.planned ? (
                                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <TrendingDown className="h-3 w-3 text-red-500" />
                                      )}
                                      <span className={cn("font-medium font-mono tabular-nums text-sm", b.actual > b.planned ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                                        {b.actual > b.planned ? "+" : ""}{(b.actual - b.planned).toLocaleString()}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div className={cn("h-full rounded-full", devPct > 100 ? "bg-red-500" : devPct > 80 ? "bg-amber-500" : "bg-teal-500")} style={{ width: `${Math.min(devPct, 100)}%` }} />
                                      </div>
                                      <span className={cn("text-xs font-medium tabular-nums", devPct > 100 ? "text-red-600" : devPct > 80 ? "text-amber-600" : "text-slate-600 dark:text-slate-400")}>{devPct}%</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* BOQ Summary */}
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">{t("ملخص بنود الكميات", "BOQ Summary")}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{project.boqItems.length} {t("بند", "items")}</p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="text-xs text-slate-400">{t("الإجمالي", "Total")}</p>
                        <p className="text-lg font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
                          {project.boqItems.reduce((s, i) => s + i.total, 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">{isAr ? "د.إ" : "AED"}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 6: Site */}
            <TabsContent value="site">
              <div className="space-y-4 mt-4">
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("زيارات الموقع", "Site Visits")}</CardTitle></CardHeader>
                  <CardContent>
                    {project.siteVisits.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">{t("لا توجد زيارات", "No visits")}</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {project.siteVisits.slice(0, 10).map((visit) => (
                          <div key={visit.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{visit.plotNumber || t("زيارة", "Visit")}</p>
                              <p className="text-xs text-slate-400">{visit.municipality}</p>
                            </div>
                            <div className="text-end">
                              <p className="text-xs text-slate-500">{new Date(visit.date).toLocaleDateString(isAr ? "ar-AE" : "en-US")}</p>
                              <StatusBadge status={visit.status} language={language} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("العيوب", "Defects")}</CardTitle></CardHeader>
                  <CardContent>
                    {project.defects.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">{t("لا توجد عيوب", "No defects")}</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {project.defects.map((defect) => (
                          <div key={defect.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={cn("h-4 w-4", defect.severity === "critical" ? "text-red-500" : defect.severity === "high" ? "text-amber-500" : "text-slate-400")} />
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{defect.title}</p>
                            </div>
                            <StatusBadge status={defect.status} language={language} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("يومية الموقع", "Site Diary")}</CardTitle></CardHeader>
                  <CardContent>
                    {project.siteDiaries.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">{t("لا توجد يوميات", "No diary entries")}</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {project.siteDiaries.map((diary) => (
                          <div key={diary.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{new Date(diary.date).toLocaleDateString(isAr ? "ar-AE" : "en-US")}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>{diary.weather}</span>
                                <span>{diary.workerCount} {t("عمال", "workers")}</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{diary.workDescription}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 7: Government Approvals */}
            <TabsContent value="approvals">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {GOV_AUTHORITIES.map((auth) => {
                  const approval = project.govApprovals.find((a) => a.authority === auth);
                  return (
                    <GovApprovalCard key={auth} auth={auth} approval={approval} language={language} />
                  );
                })}
              </div>
            </TabsContent>

            {/* Tab 8: BOQ */}
            <TabsContent value="boq">
              <div className="mt-4">
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[500px]">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                          <TableRow>
                            <TableHead>{t("الرمز", "Code")}</TableHead>
                            <TableHead>{t("الوصف", "Description")}</TableHead>
                            <TableHead>{t("الوحدة", "Unit")}</TableHead>
                            <TableHead>{t("الكمية", "Qty")}</TableHead>
                            <TableHead>{t("سعر الوحدة", "Unit Price")}</TableHead>
                            <TableHead>{t("الإجمالي", "Total")}</TableHead>
                            <TableHead>{t("التصنيف", "Category")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {project.boqItems.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">{t("لا توجد بنود", "No items")}</TableCell></TableRow>
                          ) : (
                            project.boqItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.code}</TableCell>
                                <TableCell className="font-medium text-sm max-w-[200px] truncate">{item.description}</TableCell>
                                <TableCell className="text-sm">{item.unit}</TableCell>
                                <TableCell className="text-sm">{item.quantity}</TableCell>
                                <TableCell className="text-sm">{item.unitPrice.toLocaleString()}</TableCell>
                                <TableCell className="font-medium text-sm">{item.total.toLocaleString()}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{BOQ_CATEGORIES[language]?.[item.category] || item.category}</Badge></TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {project.boqItems.length > 0 && (
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={5} className="font-semibold text-end">{t("الإجمالي", "Total")}</TableCell>
                              <TableCell className="font-bold">{project.boqItems.reduce((s, i) => s + i.total, 0).toLocaleString()} AED</TableCell>
                              <TableCell />
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 9: Schedule (Enhanced Gantt Chart) */}
            <TabsContent value="schedule">
              <div className="space-y-4 mt-4">
                {SCHEDULE_SECTIONS.map((section) => {
                  const phases = project.schedulePhases?.filter((p) => p.section === section) || [];
                  const sectionLabels: Record<string, Record<string, string>> = {
                    ar: { architectural: "القسم المعماري", structural: "القسم الإنشائي", electrical: "القسم الكهربائي", governmental: "القسم الحكومي" },
                    en: { architectural: "Architectural", structural: "Structural", electrical: "Electrical", governmental: "Governmental" },
                  };
                  const progress = getSectionScheduleProgress(section);
                  const totalDays = phases.reduce((s, p) => s + p.duration, 0);
                  const maxDays = phases.reduce((s, p) => s + p.maxDuration, 0);
                  const isOverdue = totalDays > maxDays;
                  const sectionColors: Record<string, string> = {
                    architectural: "#14b8a6", structural: "#f59e0b", electrical: "#3b82f6", governmental: "#8b5cf6",
                  };
                  const sectionColor = sectionColors[section] || "#14b8a6";

                  return (
                    <Card key={section} className="border-slate-200 dark:border-slate-700/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sectionColor}15`, color: sectionColor }}>
                              {section === "architectural" ? <PenLine className="h-4 w-4" /> :
                               section === "structural" ? <HardHat className="h-4 w-4" /> :
                               section === "electrical" ? <Zap className="h-4 w-4" /> :
                               <Shield className="h-4 w-4" />}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-semibold">{sectionLabels[language]?.[section] || section}</CardTitle>
                              <p className="text-[11px] text-slate-400">{phases.length} {t("مرحلة", "phases")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn("text-sm font-bold tabular-nums", isOverdue ? "text-red-600" : "text-slate-700 dark:text-slate-300")}>
                              {totalDays} / {maxDays} {t("يوم", "days")}
                            </span>
                            {isOverdue && (
                              <Badge variant="outline" className="text-xs border-red-200 text-red-600 bg-red-50 dark:bg-red-950/30">
                                <AlertTriangle className="h-3 w-3 me-1" />
                                {t("تجاوز", "Overdue")}
                              </Badge>
                            )}
                            <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: sectionColor }} />
                            </div>
                            <span className="text-xs font-bold tabular-nums" style={{ color: sectionColor }}>{progress}%</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {phases.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-6">{t("لا توجد مراحل", "No phases")}</p>
                        ) : (
                          <div className="space-y-2">
                            {phases.map((phase) => {
                              const pct = phase.maxDuration > 0 ? Math.min((phase.duration / phase.maxDuration) * 100, 100) : 0;
                              const isPhaseOverdue = phase.duration > phase.maxDuration && phase.status !== "COMPLETED";
                              const statusColor = phase.status === "COMPLETED" ? "#10b981"
                                : phase.status === "IN_PROGRESS" ? "#14b8a6"
                                : phase.status === "DELAYED" || isPhaseOverdue ? "#ef4444"
                                : "#94a3b8";

                              return (
                                <div key={phase.id} className="group">
                                  <div className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    {/* Status Icon */}
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                                      {phase.status === "COMPLETED" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : phase.status === "IN_PROGRESS" ? (
                                        <Clock className="h-4 w-4 text-teal-500 animate-pulse" />
                                      ) : isPhaseOverdue ? (
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                      )}
                                    </div>

                                    {/* Task Name + Bar */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{phase.phaseName}</p>
                                        <div className="flex items-center gap-2 shrink-0 ms-2">
                                          {/* Date range */}
                                          {phase.startDate && phase.endDate && (
                                            <span className="text-[10px] text-slate-400 font-mono tabular-nums hidden sm:inline">
                                              {new Date(phase.startDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", day: "numeric" })}
                                              {" → "}
                                              {new Date(phase.endDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", day: "numeric" })}
                                            </span>
                                          )}
                                          <span className={cn(
                                            "text-[11px] font-bold tabular-nums min-w-[60px] text-end",
                                            isPhaseOverdue ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
                                          )}>
                                            {phase.duration}/{phase.maxDuration} {t("ي", "d")}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Gantt Bar with Gradient */}
                                      <div className="relative h-5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-500 relative"
                                          style={{
                                            width: `${pct}%`,
                                            backgroundColor: statusColor,
                                            opacity: phase.status === "NOT_STARTED" ? 0.3 : 1,
                                          }}
                                        >
                                          {/* Progress percentage on bar */}
                                          {pct > 15 && phase.status !== "NOT_STARTED" && (
                                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90">
                                              {phase.status === "COMPLETED" ? "✓" : `${Math.round(pct)}%`}
                                            </span>
                                          )}
                                        </div>
                                        {/* Milestone diamond for completed */}
                                        {phase.status === "COMPLETED" && pct >= 100 && (
                                          <div className="absolute top-0.5 end-0.5 z-10">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                              <path d="M6 0L8 4L12 6L8 8L6 12L4 8L0 6L4 4L6 0Z" fill="#10b981" stroke="#fff" strokeWidth="0.5" />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Status Legend */}
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-[11px] text-slate-500">{t("مكتمل", "Completed")}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-teal-500" />
                            <span className="text-[11px] text-slate-500">{t("قيد التنفيذ", "In Progress")}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-[11px] text-slate-500">{t("متأخر", "Delayed")}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="text-[11px] text-slate-500">{t("لم يبدأ", "Not Started")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 ms-auto">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M6 0L8 4L12 6L8 8L6 12L4 8L0 6L4 4L6 0Z" fill="#10b981" />
                            </svg>
                            <span className="text-[11px] text-slate-500">{t("معلم رئيسي", "Milestone")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Overall Schedule Summary */}
                <Card className="border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">{t("ملخص الجدول الزمني", "Schedule Summary")}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {project.schedulePhases?.filter(p => p.status === "COMPLETED").length || 0} / {project.schedulePhases?.length || 0} {t("مرحلة مكتملة", "phases completed")}
                          </span>
                          <div className="flex items-center gap-2">
                            <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {project.startDate && project.endDate ? (
                                <>
                                  {new Date(project.startDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", year: "numeric" })}
                                  {" → "}
                                  {new Date(project.endDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", year: "numeric" })}
                                </>
                              ) : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <ProgressRing value={(() => {
                            const all = project.schedulePhases?.length || 0;
                            const done = project.schedulePhases?.filter(p => p.status === "COMPLETED").length || 0;
                            return all > 0 ? Math.round((done / all) * 100) : 0;
                          })()} size={44} strokeWidth={3} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-900 dark:text-white tabular-nums">
                              {(() => {
                                const all = project.schedulePhases?.length || 0;
                                const done = project.schedulePhases?.filter(p => p.status === "COMPLETED").length || 0;
                                return all > 0 ? Math.round((done / all) * 100) : 0;
                              })()}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 10: Responsibility Matrix (RACI) */}
            <TabsContent value="responsibility">
              <div className="mt-4 space-y-4">
                {project.assignments.length === 0 ? (
                  <Card className="border-slate-200 dark:border-slate-700/50">
                    <CardContent className="py-12 text-center">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t("لا توجد تعيينات", "No assignments")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Team Members Summary */}
                    <Card className="border-slate-200 dark:border-slate-700/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4 text-teal-600" />
                          {t("فريق المشروع", "Project Team")}
                          <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 border-0 ms-1">
                            {project.assignments.length} {t("عضو", "members")}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-3">
                          {project.assignments.map((assign) => {
                            const avatarColor = getAvatarColor(assign.user.name);
                            return (
                              <div key={assign.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm"
                                  style={{ backgroundColor: avatarColor }}
                                >
                                  {getInitials(assign.user.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{assign.user.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{assign.user.position}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* RACI Matrix Table */}
                    <Card className="border-slate-200 dark:border-slate-700/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">{t("مصفوفة المسؤوليات (RACI)", "Responsibility Matrix (RACI)")}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-start p-3 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/50 min-w-[160px] sticky start-0 z-10">
                                  {t("العضو", "Member")}
                                </th>
                                {(() => {
                                  const phases = [
                                    { key: "concept", ar: "المفهوم", en: "Concept" },
                                    { key: "schematic", ar: "المخطط التخطيطي", en: "Schematic" },
                                    { key: "design_dev", ar: "تطوير التصميم", en: "Design Dev" },
                                    { key: "construction_docs", ar: "مستندات التنفيذ", en: "Constr. Docs" },
                                    { key: "construction_admin", ar: "إدارة التنفيذ", en: "Constr. Admin" },
                                  ];
                                  return phases.map((phase) => (
                                    <th key={phase.key} className="p-3 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/50 min-w-[100px] text-center whitespace-nowrap">
                                      {isAr ? phase.ar : phase.en}
                                    </th>
                                  ));
                                })()}
                              </tr>
                            </thead>
                            <tbody>
                              {project.assignments.map((assign, idx) => {
                                // Generate deterministic RACI values based on user name and role
                                const hash = assign.user.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                                const raciPhases = ["concept", "schematic", "design_dev", "construction_docs", "construction_admin"];
                                const raciRow = raciPhases.map((_, pi) => {
                                  const cellHash = (hash * 31 + pi * 17) % 100;
                                  const role = assign.role?.toLowerCase() || "";
                                  if (role.includes("مدير") || role.includes("manager") || role.includes("pm")) {
                                    if (pi === 0 || pi === 4) return "A";
                                    if (cellHash < 40) return "R";
                                    if (cellHash < 70) return "I";
                                    return "C";
                                  }
                                  if (role.includes("مهندس") || role.includes("engineer")) {
                                    if (pi === 2 || pi === 3) return "R";
                                    if (cellHash < 30) return "C";
                                    if (cellHash < 50) return "I";
                                    return "A";
                                  }
                                  if (role.includes("محاسب") || role.includes("account")) {
                                    if (pi === 3) return "R";
                                    return cellHash < 50 ? "I" : "C";
                                  }
                                  // Default
                                  if (cellHash < 25) return "R";
                                  if (cellHash < 45) return "A";
                                  if (cellHash < 70) return "C";
                                  return "I";
                                });

                                const raciConfig: Record<string, { bg: string; text: string; label: string; labelEn: string }> = {
                                  R: { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300", label: "مسؤول", labelEn: "Responsible" },
                                  A: { bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-300", label: "المحاسَب", labelEn: "Accountable" },
                                  C: { bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-700 dark:text-sky-300", label: "مستشار", labelEn: "Consulted" },
                                  I: { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-500 dark:text-slate-400", label: "مطلع", labelEn: "Informed" },
                                };

                                return (
                                  <tr key={assign.id} className={cn(
                                    "border-b border-slate-100 dark:border-slate-800 last:border-0",
                                    idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
                                  )}>
                                    <td className="p-3 sticky start-0 z-10 min-w-[160px]" style={{ backgroundColor: idx % 2 === 0 ? (undefined) : undefined }}>
                                      <div className={cn(
                                        "flex items-center gap-2 rounded-lg p-1",
                                        idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
                                      )}>
                                        <div
                                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                                          style={{ backgroundColor: getAvatarColor(assign.user.name) }}
                                        >
                                          {getInitials(assign.user.name)}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{assign.user.name}</p>
                                          <p className="text-[10px] text-slate-400 truncate">{assign.role}</p>
                                        </div>
                                      </div>
                                    </td>
                                    {raciRow.map((raci, pi) => {
                                      const config = raciConfig[raci];
                                      return (
                                        <td key={pi} className="p-2 text-center">
                                          <span
                                            className={cn(
                                              "inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold transition-all hover:scale-110 cursor-default",
                                              config.bg, config.text
                                            )}
                                            title={isAr ? config.label : config.labelEn}
                                          >
                                            {raci}
                                          </span>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* RACI Legend */}
                    <div className="flex items-center justify-center gap-6 py-2">
                      {[
                        { letter: "R", bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300", labelAr: "R — مسؤول (Responsible)", labelEn: "R — Responsible (Does the work)" },
                        { letter: "A", bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-700 dark:text-violet-300", labelAr: "A — المحاسَب (Accountable)", labelEn: "A — Accountable (Decision maker)" },
                        { letter: "C", bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-700 dark:text-sky-300", labelAr: "C — مستشار (Consulted)", labelEn: "C — Consulted (Provides input)" },
                        { letter: "I", bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-500 dark:text-slate-400", labelAr: "I — مطلع (Informed)", labelEn: "I — Informed (Kept updated)" },
                      ].map((item) => (
                        <div key={item.letter} className="flex items-center gap-2" title={isAr ? item.labelAr : item.labelEn}>
                          <span className={cn("inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold", item.bg, item.text)}>
                            {item.letter}
                          </span>
                          <span className="text-[11px] text-slate-500 hidden sm:inline">{isAr ? item.labelAr : item.labelEn}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Tab 11: Client Interactions */}
            <TabsContent value="interactions">
              <div className="mt-4">
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("تفاعلات العميل", "Client Interactions")}</CardTitle></CardHeader>
                  <CardContent>
                    {project.clientInteractions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">{t("لا توجد تفاعلات", "No interactions")}</p>
                    ) : (
                      <div className="relative">
                        <div className={cn("absolute top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700", isAr ? "right-4 md:right-6" : "left-4 md:left-6")} />
                        <div className="space-y-4">
                          {project.clientInteractions.map((interaction) => {
                            const typeIcon = interaction.type === "meeting" ? Users : interaction.type === "call" ? Phone : Mail;
                            const typeColor = interaction.type === "meeting"
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : interaction.type === "call"
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
                            const typeLabels: Record<string, Record<string, string>> = {
                              ar: { meeting: "اجتماع", call: "مكالمة", email: "بريد إلكتروني" },
                              en: { meeting: "Meeting", call: "Call", email: "Email" },
                            };
                            return (
                              <div key={interaction.id} className={cn("relative flex gap-4", isAr ? "flex-row-reverse" : "")}>
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 mt-1", typeColor)}>
                                  {React.createElement(typeIcon, { className: "h-4 w-4" })}
                                </div>
                                <div className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-slate-900 dark:text-white">{interaction.subject || typeLabels[language]?.[interaction.type] || interaction.type}</span>
                                      <Badge variant="outline" className="text-xs border-0 bg-slate-100 dark:bg-slate-700 text-slate-500">{typeLabels[language]?.[interaction.type] || interaction.type}</Badge>
                                    </div>
                                    <span className="text-xs text-slate-400">{new Date(interaction.date).toLocaleDateString(isAr ? "ar-AE" : "en-US")}</span>
                                  </div>
                                  {interaction.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{interaction.description}</p>}
                                  {interaction.outcome && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                      {t("النتيجة", "Outcome")}: {interaction.outcome}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: Quick Navigation */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-teal-600" />
              {t("التنقل السريع", "Quick Navigation")}
            </h3>
            <div className="space-y-1">
              {tabItems.map((tab) => {
                const isActive = activeTab === tab.value;
                let progress = 0;
                if (tab.value === "overview") progress = Math.round(project.progress);
                else if (tab.value === "architectural") progress = getStageProgress("architectural");
                else if (tab.value === "structural") progress = getStageProgress("structural");
                else if (tab.value === "mep") progress = getStageProgress("mep_electrical");
                else if (tab.value === "approvals") {
                  const approved = project.govApprovals.filter((a) => a.status === "APPROVED").length;
                  progress = Math.round((approved / GOV_AUTHORITIES.length) * 100);
                }
                else if (tab.value === "schedule") progress = getSectionScheduleProgress("architectural");
                return (
                  <button
                    key={tab.value}
                    onClick={() => navigateToTab(tab.value)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                      isActive
                        ? "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-start truncate">{tab.label}</span>
                    {(progress > 0 || isActive) && (
                      <span className={cn("text-[10px] font-medium w-8 text-end", isActive ? "text-teal-600" : "text-slate-400")}>
                        {progress}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <Separator className="my-3" />
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t("العميل", "Client")}</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-500">{project.client?.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{project.client?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{project.client?.company}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== MEP TAB COMPONENT =====
function MEPTabContent({
  stages,
  language,
}: {
  stages: ProjectStage[];
  language: "ar" | "en";
}) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const mepIcons: Record<string, React.ElementType> = {
    mep_electrical: Zap,
    mep_plumbing: Droplets,
    mep_water: Droplets,
    mep_civil_defense: Shield,
    mep_telecom: Phone,
  };
  const mepColors: Record<string, string> = {
    mep_electrical: "#14b8a6",
    mep_plumbing: "#3b82f6",
    mep_water: "#06b6d4",
    mep_civil_defense: "#ef4444",
    mep_telecom: "#8b5cf6",
  };

  return (
    <div className="space-y-4 mt-4">
      {MEP_SECTIONS.map((section) => {
        const sectionStages = stages.filter((s) => s.department === section);
        const Icon = mepIcons[section] || Layers;
        const label = STAGE_LABELS[language]?.[section] || section;
        const completed = sectionStages.filter((s) => s.status === "APPROVED").length;
        const total = sectionStages.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        const accentColor = mepColors[section] || "#14b8a6";

        return (
          <Card key={section} className="border-slate-200 dark:border-slate-700/50 border-s-4"
            style={{ borderInlineStartWidth: "4px", borderInlineStartColor: accentColor }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                    <p className="text-xs text-slate-400">{completed}/{total} {t("مراحل", "stages")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accentColor }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums" style={{ color: accentColor }}>{pct}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sectionStages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">{t("لا توجد مراحل", "No stages")}</p>
              ) : (
                <div className="space-y-2">
                  {sectionStages.map((stage) => (
                    <div key={stage.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          stage.status === "APPROVED" ? "bg-emerald-500" :
                          stage.status === "IN_PROGRESS" ? "bg-blue-500 animate-pulse" :
                          stage.status === "REJECTED" ? "bg-red-500" : "bg-slate-300"
                        )} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{STAGE_LABELS[language]?.[stage.stageName] || stage.stageName}</span>
                      </div>
                      <StatusBadge status={stage.status} language={language} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
