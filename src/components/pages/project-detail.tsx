"use client";

import React, { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  PenTool,
  FileCheck,
  Award,
  SearchCheck,
  Send,
  BarChart3,
  GitBranch,
  Play,
  ArrowRight,
  RotateCcw,
  Upload,
  Phone,
  Download,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  FileUp,
  History,
} from "lucide-react";
import { toast } from "sonner";

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
import SubmittalsPage from "@/components/pages/submittals";
import TransmittalsPage from "@/components/pages/transmittals";
import EmployeesPage from "@/components/pages/employees";
import TeamMembers from "@/components/pages/team-members";
import SupervisionPage from "@/components/pages/supervision";
import ContractorsPage from "@/components/pages/contractors";
import InspectionsPage from "@/components/pages/inspections";

// ===== WORKFLOW TYPES =====
interface WorkflowStageData {
  id: string;
  workflowId: string;
  templateStageId: string | null;
  name: string;
  nameEn: string;
  order: number;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  assigneeId: string | null;
  notes: string;
  steps: WorkflowStepData[];
}

interface WorkflowStepData {
  id: string;
  stageId: string;
  templateStepId: string | null;
  name: string;
  nameEn: string;
  order: number;
  status: string;
  assigneeId: string | null;
  assignedRole: string;
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  action: string;
  notes: string;
  returnReason: string;
  severity: string;
  assignee?: { id: string; name: string; avatar: string; role: string } | null;
}

interface WorkflowData {
  id: string;
  projectId: string;
  templateId: string | null;
  currentStageId: string | null;
  status: string;
  progress: number;
  startedAt: string;
  completedAt: string | null;
  stages: WorkflowStageData[];
  template?: { id: string; name: string; nameEn: string } | null;
  progressData?: {
    totalStages: number;
    completedStages: number;
    totalSteps: number;
    completedSteps: number;
    progress: number;
    currentStageIndex: number;
  };
}

// ===== CONTRACTOR RFQ TYPES =====
interface ContractorRFQBid {
  id: string;
  projectId: string;
  contractorId: string | null;
  contractorName: string;
  contractorContact: string;
  amount: number;
  technicalScore: number;
  financialScore: number;
  totalScore: number;
  status: string;
  deadline: string | null;
  quoteFile: string;
  quoteUploadedAt: string | null;
  rfqSentAt: string | null;
  rfqStatus: string;
  aiAnalysis: string;
  contractFile: string;
  contractSignedAt: string | null;
  isAwarded: boolean;
  contractor?: {
    id: string;
    name: string;
    companyName: string;
    rating: number;
    category: string;
    phone: string;
    email: string;
    experience: string;
    specialties: string;
  } | null;
}

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
  contractor: { id: string; name: string; nameEn: string; companyName: string; companyEn: string; contactPerson: string; phone: string; email: string; category: string; rating: number; crNumber: string; licenseNumber: string } | null;
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

// ===== DESIGN PIPELINE =====
const DESIGN_PIPELINE_STAGES = [
  { key: "concept", labelAr: "مبدئي", labelEn: "Concept" },
  { key: "schematic", labelAr: "تخطيطي", labelEn: "Schematic" },
  { key: "development", labelAr: "تطوير", labelEn: "Development" },
  { key: "construction_docs", labelAr: "مخططات تنفيذية", labelEn: "Construction Docs" },
  { key: "as_built", labelAr: "أس-بيلت", labelEn: "As-Built" },
];

function DesignPipeline({ department, stages, language }: { department: string; stages: ProjectStage[]; language: "ar" | "en" }) {
  const isAr = language === "ar";
  const deptStages = stages.filter(s => s.department === department);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-500";
      case "IN_PROGRESS": return "bg-teal-500";
      case "SUBMITTED": return "bg-amber-500";
      case "REJECTED": return "bg-red-500";
      default: return "bg-slate-200 dark:bg-slate-700";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return <CheckCircle2 className="h-3 w-3 text-white" />;
      case "IN_PROGRESS": return <Clock className="h-3 w-3 text-white" />;
      case "REJECTED": return <XCircle className="h-3 w-3 text-white" />;
      default: return <span className="text-[8px] text-slate-500 dark:text-slate-400">•</span>;
    }
  };

  return (
    <div className="space-y-3">
      {DESIGN_PIPELINE_STAGES.map((stage, idx) => {
        const stageData = deptStages.find(s => s.stageOrder === idx + 1);
        const status = stageData?.status || "NOT_STARTED";
        const color = getStatusColor(status);
        
        return (
          <div key={stage.key} className="flex items-center gap-3">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", color)}>
              {getStatusIcon(status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-medium", status !== "NOT_STARTED" ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                  {isAr ? stage.labelAr : stage.labelEn}
                </span>
                {stageData?.notes && (
                  <span className="text-[9px] text-slate-400 truncate max-w-[120px]">{stageData.notes}</span>
                )}
              </div>
              {idx < DESIGN_PIPELINE_STAGES.length - 1 && (
                <div className={cn("w-0.5 h-3 ms-3 rounded-full", status === "APPROVED" ? "bg-emerald-300" : "bg-slate-200 dark:bg-slate-700")} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== TAB CONFIGURATION =====
const mainTabs = [
  { id: "overview", icon: Eye, labelAr: "نظرة عامة", labelEn: "Overview" },
  { id: "workflow", icon: GitBranch, labelAr: "سير العمل", labelEn: "Workflow" },
  { id: "design", icon: PenTool, labelAr: "مرحلة التصميم", labelEn: "Design Stage" },
  { id: "municipality", icon: Landmark, labelAr: "البلدية", labelEn: "Municipality" },
  { id: "boq", icon: Calculator, labelAr: "مقاييس ومواصفات", labelEn: "BOQ & Specs" },
  { id: "contractor", icon: HardHat, labelAr: "تعيين مقاول", labelEn: "Contractor Assignment" },
  { id: "supervision", icon: ClipboardCheck, labelAr: "الإشراف", labelEn: "Supervision" },
  { id: "tasks", icon: CheckSquare, labelAr: "المهام", labelEn: "Tasks" },
  { id: "financial", icon: Wallet, labelAr: "المالية", labelEn: "Financial" },
  { id: "documents", icon: FileText, labelAr: "المستندات", labelEn: "Documents" },
];

const designSubTabs = [
  { id: "architectural", icon: Building2, labelAr: "المعماري", labelEn: "Architectural" },
  { id: "structural", icon: HardHat, labelAr: "الإنشائي", labelEn: "Structural" },
  { id: "mep", icon: Zap, labelAr: "الكهربائي والميكانيك", labelEn: "MEP" },
  { id: "civil-defense", icon: ShieldAlert, labelAr: "الدفاع المدني", labelEn: "Civil Defense" },
];

const municipalitySubTabs = [
  { id: "license", icon: FileSignature, labelAr: "الرخصة", labelEn: "License" },
  { id: "correspondence", icon: Landmark, labelAr: "المراسلات البلدية", labelEn: "Correspondence" },
  { id: "approved-drawings", icon: FileCheck, labelAr: "المخططات المعتمدة", labelEn: "Approved Drawings" },
];

const boqSubTabs = [
  { id: "boq", icon: Calculator, labelAr: "جدول الكميات", labelEn: "BOQ" },
  { id: "specs", icon: FileText, labelAr: "المواصفات الفنية", labelEn: "Specifications" },
];

const contractorSubTabs = [
  { id: "rfq", icon: Send, labelAr: "إرسال طلب عرض", labelEn: "Send RFQ" },
  { id: "bids", icon: Gavel, labelAr: "عروض الأسعار", labelEn: "Price Bids" },
  { id: "comparison", icon: BarChart3, labelAr: "مقارنة ذكية", labelEn: "Smart Compare" },
  { id: "award", icon: Award, labelAr: "الترسية", labelEn: "Award" },
];

const supervisionSubTabs = [
  { id: "checklists", icon: ClipboardCheck, labelAr: "زيارات الإشراف", labelEn: "Supervision Visits" },
  { id: "violations", icon: AlertTriangle, labelAr: "المخالفات", labelEn: "Violations" },
  { id: "inspections", icon: SearchCheck, labelAr: "فحص المباني", labelEn: "Building Inspections" },
  { id: "completion", icon: Award, labelAr: "شهادة الإنجاز", labelEn: "Completion Certificate" },
];

const financialSubTabs = [
  { id: "invoices", icon: Receipt, labelAr: "الفواتير", labelEn: "Invoices" },
  { id: "payments", icon: CreditCard, labelAr: "المدفوعات", labelEn: "Payments" },
  { id: "budgets", icon: PiggyBank, labelAr: "الميزانية", labelEn: "Budget" },
  { id: "proposals", icon: FileSpreadsheet, labelAr: "العروض", labelEn: "Proposals" },
];

// ===== SUB-TAB RENDERER =====
function SubTabsNav<T extends { id: string }>({ 
  tabs, 
  activeSubTab, 
  onSubTabChange, 
  language 
}: { 
  tabs: T[]; 
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

// ===== HELPERS =====
function getContractorCategoryLabel(category: string, isAr: boolean) {
  if (!category) return isAr ? "غير محدد" : "Not specified";
  const labels: Record<string, { ar: string; en: string }> = {
    civil: { ar: "أشغال مدنية", en: "Civil Works" },
    electrical: { ar: "أشغال كهربائية", en: "Electrical" },
    mep: { ar: "كهرباء وميكانيك", en: "MEP" },
    finishing: { ar: "تشطيبات", en: "Finishing" },
    plumbing: { ar: "سباكة", en: "Plumbing" },
    hvac: { ar: "تكييف وتبريد", en: "HVAC" },
  };
  return labels[category]?.[isAr ? "ar" : "en"] || category;
}

// ===== DESIGN STAGE CONSTANTS =====
interface DesignStep {
  id: string;
  nameAr: string;
  nameEn: string;
  assignee: string;
  status: "not-started" | "in-progress" | "submitted" | "approved";
  date: string | null;
}

interface DesignDiscipline {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: React.ElementType;
  color: string;
  steps: DesignStep[];
  supervisor: string;
}

const DESIGN_DISCIPLINES: DesignDiscipline[] = [
  {
    id: "architectural", nameAr: "المعماري", nameEn: "Architectural", icon: Building2, color: "#14b8a6", supervisor: "",
    steps: [
      { id: "arch-1", nameAr: "التخطيط المساحي", nameEn: "Space Planning", assignee: "", status: "not-started", date: null },
      { id: "arch-2", nameAr: "التصميم المبدئي", nameEn: "Preliminary Design", assignee: "", status: "not-started", date: null },
      { id: "arch-3", nameAr: "تطوير التصميم", nameEn: "Design Development", assignee: "", status: "not-started", date: null },
      { id: "arch-4", nameAr: "المخططات النهائية", nameEn: "Final Drawings", assignee: "", status: "not-started", date: null },
      { id: "arch-5", nameAr: "موافقة العميل", nameEn: "Client Approval", assignee: "", status: "not-started", date: null },
      { id: "arch-6", nameAr: "تقديم البلدية", nameEn: "Municipality Submission", assignee: "", status: "not-started", date: null },
    ],
  },
  {
    id: "structural", nameAr: "الإنشائي", nameEn: "Structural", icon: HardHat, color: "#f59e0b", supervisor: "",
    steps: [
      { id: "str-1", nameAr: "التحليل الإنشائي", nameEn: "Structural Analysis", assignee: "", status: "not-started", date: null },
      { id: "str-2", nameAr: "تصميم الأساسات", nameEn: "Foundation Design", assignee: "", status: "not-started", date: null },
      { id: "str-3", nameAr: "تصميم الأعمدة والعتلات", nameEn: "Column/Beam Design", assignee: "", status: "not-started", date: null },
      { id: "str-4", nameAr: "المخططات الإنشائية النهائية", nameEn: "Final Structural Drawings", assignee: "", status: "not-started", date: null },
      { id: "str-5", nameAr: "المراجعة والاعتماد", nameEn: "Review & Approval", assignee: "", status: "not-started", date: null },
    ],
  },
  {
    id: "mep_electrical", nameAr: "MEP الكهرباء", nameEn: "MEP Electrical", icon: Zap, color: "#3b82f6", supervisor: "",
    steps: [
      { id: "el-1", nameAr: "تخطيط الكهرباء", nameEn: "Electrical Layout", assignee: "", status: "not-started", date: null },
      { id: "el-2", nameAr: "توزيع الطاقة", nameEn: "Power Distribution", assignee: "", status: "not-started", date: null },
      { id: "el-3", nameAr: "تصميم الإضاءة", nameEn: "Lighting Design", assignee: "", status: "not-started", date: null },
      { id: "el-4", nameAr: "المخططات النهائية", nameEn: "Final Drawings", assignee: "", status: "not-started", date: null },
      { id: "el-5", nameAr: "الاعتماد", nameEn: "Approval", assignee: "", status: "not-started", date: null },
    ],
  },
  {
    id: "mep_plumbing", nameAr: "MEP السباكة", nameEn: "MEP Plumbing", icon: Droplets, color: "#06b6d4", supervisor: "",
    steps: [
      { id: "pl-1", nameAr: "تخطيط السباكة", nameEn: "Plumbing Layout", assignee: "", status: "not-started", date: null },
      { id: "pl-2", nameAr: "إمداد المياه", nameEn: "Water Supply", assignee: "", status: "not-started", date: null },
      { id: "pl-3", nameAr: "تصميم الصرف", nameEn: "Drainage Design", assignee: "", status: "not-started", date: null },
      { id: "pl-4", nameAr: "المخططات النهائية", nameEn: "Final Drawings", assignee: "", status: "not-started", date: null },
      { id: "pl-5", nameAr: "الاعتماد", nameEn: "Approval", assignee: "", status: "not-started", date: null },
    ],
  },
  {
    id: "mep_hvac", nameAr: "MEP التكييف", nameEn: "MEP HVAC", icon: Activity, color: "#8b5cf6", supervisor: "",
    steps: [
      { id: "hv-1", nameAr: "حساب الأحمال الحرارية", nameEn: "HVAC Load Calculation", assignee: "", status: "not-started", date: null },
      { id: "hv-2", nameAr: "تصميم القنوات", nameEn: "Duct Design", assignee: "", status: "not-started", date: null },
      { id: "hv-3", nameAr: "اختيار المعدات", nameEn: "Equipment Selection", assignee: "", status: "not-started", date: null },
      { id: "hv-4", nameAr: "المخططات النهائية", nameEn: "Final Drawings", assignee: "", status: "not-started", date: null },
      { id: "hv-5", nameAr: "الاعتماد", nameEn: "Approval", assignee: "", status: "not-started", date: null },
    ],
  },
  {
    id: "civil_defense", nameAr: "الدفاع المدني", nameEn: "Civil Defense", icon: ShieldAlert, color: "#ef4444", supervisor: "",
    steps: [
      { id: "cd-1", nameAr: "خطة السلامة من الحرائق", nameEn: "Fire Safety Plan", assignee: "", status: "not-started", date: null },
      { id: "cd-2", nameAr: "طرق الإخلاء", nameEn: "Evacuation Routes", assignee: "", status: "not-started", date: null },
      { id: "cd-3", nameAr: "نظام إنذار الحريق", nameEn: "Fire Alarm System", assignee: "", status: "not-started", date: null },
      { id: "cd-4", nameAr: "التقديم النهائي", nameEn: "Final Submission", assignee: "", status: "not-started", date: null },
      { id: "cd-5", nameAr: "الاعتماد", nameEn: "Approval", assignee: "", status: "not-started", date: null },
    ],
  },
];

const APPROVAL_CHAIN = [
  { key: "engineer", labelAr: "المهندس", labelEn: "Engineer" },
  { key: "lead_engineer", labelAr: "المهندس الأول", labelEn: "Lead Engineer" },
  { key: "dept_head", labelAr: "رئيس القسم", labelEn: "Department Head" },
  { key: "manager", labelAr: "المدير", labelEn: "Manager" },
];

const PIPELINE_STAGES = [
  { key: "design", labelAr: "التصميم", labelEn: "Design", icon: PenTool },
  { key: "municipality", labelAr: "البلدية", labelEn: "Municipality", icon: Landmark },
  { key: "boq", labelAr: "كميات", labelEn: "BOQ", icon: Calculator },
  { key: "contractor", labelAr: "المقاول", labelEn: "Contractor", icon: HardHat },
  { key: "supervision", labelAr: "الإشراف", labelEn: "Supervision", icon: ClipboardCheck },
];

const MOCK_TEAM = [
  { id: "1", name: "أحمد محمد", nameEn: "Ahmed Mohamed", role: "مهندس معماري", roleEn: "Architect", status: "active" },
  { id: "2", name: "سارة أحمد", nameEn: "Sara Ahmed", role: "مهندسة إنشائية", roleEn: "Structural Eng.", status: "active" },
  { id: "3", name: "خالد علي", nameEn: "Khalid Ali", role: "مهندس كهرباء", roleEn: "Electrical Eng.", status: "idle" },
  { id: "4", name: "فاطمة حسن", nameEn: "Fatma Hassan", role: "مصممة داخلي", roleEn: "Interior Designer", status: "active" },
];

const MOCK_ACTIVITY = [
  { id: "1", actionAr: "تم تحديث التصميم المعماري", actionEn: "Architectural design updated", time: "2h ago", user: "أحمد محمد" },
  { id: "2", actionAr: "تم رفع مخططات الأساسات", actionEn: "Foundation drawings uploaded", time: "5h ago", user: "سارة أحمد" },
  { id: "3", actionAr: "تم اعتماد المرحلة الأولى", actionEn: "Phase 1 approved", time: "1d ago", user: "المدير" },
  { id: "4", actionAr: "تم إضافة مهمة جديدة", actionEn: "New task added", time: "2d ago", user: "أحمد محمد" },
  { id: "5", actionAr: "تم تحديث الميزانية", actionEn: "Budget updated", time: "3d ago", user: "المدير" },
];

const MOCK_DOCUMENTS = [
  { id: "1", nameAr: "المخطط المعماري النهائي.pdf", nameEn: "Final Architectural Plan.pdf", size: "2.4 MB", date: "2024-01-15" },
  { id: "2", nameAr: "تقرير التربة.pdf", nameEn: "Soil Report.pdf", size: "1.1 MB", date: "2024-01-10" },
  { id: "3", nameAr: "مخطط الأساسات.dwg", nameEn: "Foundation Plan.dwg", size: "5.2 MB", date: "2024-01-08" },
];

const MUNICIPALITY_PREREQUISITES = [
  { id: "arch", labelAr: "المخططات المعمارية المعتمدة", labelEn: "Approved Architectural Drawings", dependsOn: "architectural" },
  { id: "struct", labelAr: "المخططات الإنشائية المعتمدة", labelEn: "Approved Structural Drawings", dependsOn: "structural" },
  { id: "elec", labelAr: "مخططات الكهرباء", labelEn: "Electrical Drawings", dependsOn: "mep_electrical" },
  { id: "plumb", labelAr: "مخططات السباكة", labelEn: "Plumbing Drawings", dependsOn: "mep_plumbing" },
  { id: "hvac", labelAr: "مخططات التكييف", labelEn: "HVAC Drawings", dependsOn: "mep_hvac" },
  { id: "civil_def", labelAr: "خطة الدفاع المدني", labelEn: "Civil Defense Plan", dependsOn: "civil_defense" },
  { id: "survey", labelAr: "مسح الأرض", labelEn: "Land Survey", dependsOn: "external" },
  { id: "soil", labelAr: "تقرير التربة", labelEn: "Soil Report", dependsOn: "external" },
];

const DESIGN_STEP_STATUS_LABELS: Record<string, Record<string, string>> = {
  ar: { "not-started": "لم يبدأ", "in-progress": "قيد التنفيذ", submitted: "مقدم", approved: "معتمد" },
  en: { "not-started": "Not Started", "in-progress": "In Progress", submitted: "Submitted", approved: "Approved" },
};

const DESIGN_STEP_STATUS_COLORS: Record<string, string> = {
  "not-started": "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

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

      {/* ===== Client & Contractor & Project Info ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Card — Owner */}
        <Card className="border-slate-200 dark:border-slate-700/50" style={{ borderInlineStartWidth: "4px", borderInlineStartColor: "#14b8a6" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <span className="text-slate-900 dark:text-white">{t("العميل", "Client")}</span>
                <p className="text-[10px] text-slate-400 font-normal">{t("مالك المشروع", "Project Owner")}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الاسم", "Name")}</span>
              <span className="font-medium text-slate-900 dark:text-white">{project.client?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الشركة", "Company")}</span>
              <span className="font-medium text-slate-900 dark:text-white">{project.client?.company || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("البريد", "Email")}</span>
              <span className="font-medium text-teal-600 dark:text-teal-400">{project.client?.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الهاتف", "Phone")}</span>
              <span className="font-medium text-slate-900 dark:text-white" dir="ltr">{project.client?.phone || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contractor Card — Executor */}
        <Card className="border-slate-200 dark:border-slate-700/50" style={{ borderInlineStartWidth: "4px", borderInlineStartColor: "#f59e0b" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <HardHat className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <span className="text-slate-900 dark:text-white">{t("المقاول", "Contractor")}</span>
                <p className="text-[10px] text-slate-400 font-normal">{t("المنفذ للمشروع", "Project Executor")}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {project.contractor ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("الشركة", "Company")}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{project.contractor.companyName || project.contractor.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("جهة الاتصال", "Contact")}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{project.contractor.contactPerson || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("التخصص", "Category")}</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">{getContractorCategoryLabel(project.contractor.category, isAr)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t("التقييم", "Rating")}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn("h-3 w-3", star <= (project.contractor?.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600")}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("السجل التجاري", "CR Number")}</span>
                  <span className="font-medium text-slate-900 dark:text-white" dir="ltr">{project.contractor.crNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("الهاتف", "Phone")}</span>
                  <span className="font-medium text-slate-900 dark:text-white" dir="ltr">{project.contractor.phone || "—"}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-2">
                  <HardHat className="h-5 w-5 text-amber-300 dark:text-amber-600" />
                </div>
                <p className="text-xs text-slate-400">{t("لم يتم تحديد مقاول", "No contractor assigned")}</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">{t("يمكنك تعيين مقاول من صفحة العطاءات", "Assign a contractor from the Bids page")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Info Card */}
        <Card className="border-slate-200 dark:border-slate-700/50" style={{ borderInlineStartWidth: "4px", borderInlineStartColor: "#3b82f6" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              {t("معلومات المشروع", "Project Info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t("رقم المشروع", "Project No.")}</span>
              <span className="font-medium text-slate-900 dark:text-white">#{project.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الموقع", "Location")}</span>
              <span className="font-medium text-slate-900 dark:text-white">{project.location || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("رقم القطعة", "Plot No.")}</span>
              <span className="font-medium text-slate-900 dark:text-white">{project.plotNumber || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("النوع", "Type")}</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {project.type === "villa" ? t("فيلا", "Villa") :
                 project.type === "building" ? t("مبنى", "Building") :
                 project.type === "commercial" ? t("تجاري", "Commercial") :
                 t("صناعي", "Industrial")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Remaining Card */}
      {project.endDate && (
        <Card className="border-slate-200 dark:border-slate-700/50" style={{ borderInlineStartWidth: "4px", borderInlineStartColor: project.endDate && new Date(project.endDate) < new Date() ? "#ef4444" : "#3b82f6" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{t("الوقت المتبقي", "Time Remaining")}</h4>
                </div>
              </div>
              <span className={cn("text-lg font-bold", new Date(project.endDate) < new Date() ? "text-red-500" : "text-blue-600")}>
                {(() => {
                  const now = new Date();
                  const end = new Date(project.endDate!);
                  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  if (daysLeft < 0) return `${Math.abs(daysLeft)} ${t("يوم متأخر", "days overdue")}`;
                  return `${daysLeft} ${t("يوم", "days")}`;
                })()}
              </span>
            </div>
            <Progress
              value={(() => {
                if (!project.startDate || !project.endDate) return 0;
                const start = new Date(project.startDate).getTime();
                const end = new Date(project.endDate).getTime();
                const now = Date.now();
                if (now >= end) return 100;
                if (now <= start) return 0;
                return Math.round(((now - start) / (end - start)) * 100);
              })()}
              className="h-2 bg-slate-100 dark:bg-slate-800"
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
              <span>{project.startDate ? new Date(project.startDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", day: "numeric" }) : "—"}</span>
              <span>{project.endDate ? new Date(project.endDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", day: "numeric" }) : "—"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary Bar */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{t("الملخص المالي", "Financial Summary")}</h4>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-6 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              {project.budget > 0 && (
                <>
                  <div
                    className="bg-emerald-500 h-full flex items-center justify-center text-[9px] font-bold text-white transition-all"
                    style={{ width: `${Math.min((totalPaid / project.budget) * 100, 100)}%` }}
                    title={t("المدفوع", "Paid")}
                  >
                    {totalPaid > 0 && `${Math.round((totalPaid / project.budget) * 100)}%`}
                  </div>
                  <div
                    className="bg-blue-400 h-full flex items-center justify-center text-[9px] font-bold text-white transition-all"
                    style={{ width: `${Math.max(((totalInvoiced - totalPaid) / project.budget) * 100, 0)}%` }}
                    title={t("مستحق", "Invoiced")}
                  />
                  <div
                    className="bg-slate-200 dark:bg-slate-700 h-full flex-1"
                    title={t("متبقي", "Remaining")}
                  />
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300" />
              <span className="text-slate-500">{t("قيمة العقد", "Contract")}: <span className="font-bold text-slate-900 dark:text-white">{project.budget.toLocaleString()} AED</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-500">{t("المدفوع", "Paid")}: <span className="font-bold text-emerald-600">{totalPaid.toLocaleString()} AED</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-slate-500">{t("مستحق", "Invoiced")}: <span className="font-bold text-blue-600">{totalInvoiced.toLocaleString()} AED</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-slate-500">{t("متبقي", "Remaining")}: <span className="font-bold text-slate-900 dark:text-white">{Math.max(project.budget - totalPaid, 0).toLocaleString()} AED</span></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Client & Contractor & Project Info ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Info Card — Enhanced with clickable contacts */}
        <Card className="border-slate-200 dark:border-slate-700/50" style={{ borderInlineStartWidth: "4px", borderInlineStartColor: "#14b8a6" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <span className="text-slate-900 dark:text-white">{t("العميل", "Client")}</span>
                <p className="text-[10px] text-slate-400 font-normal">{t("مالك المشروع", "Project Owner")}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الاسم", "Name")}</span>
              <span className="font-medium text-slate-900 dark:text-white">{project.client?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الشركة", "Company")}</span>
              <span className="font-medium text-slate-900 dark:text-white">{project.client?.company || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{t("البريد", "Email")}</span>
              {project.client?.email ? (
                <a href={`mailto:${project.client.email}`} className="font-medium text-teal-600 dark:text-teal-400 hover:underline">{project.client.email}</a>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{t("الهاتف", "Phone")}</span>
              <div className="flex items-center gap-1">
                {project.client?.phone && (
                  <>
                    <a href={`tel:${project.client.phone}`} className="p-1 rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors" title={t("اتصال", "Call")}>
                      <Phone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    </a>
                    <a href={`https://wa.me/${project.client.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="WhatsApp">
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </a>
                    <span className="font-medium text-slate-900 dark:text-white text-xs" dir="ltr">{project.client.phone}</span>
                  </>
                )}
                {!project.client?.phone && <span className="text-slate-400">—</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contractor Card — Executor */}
        <Card className="border-slate-200 dark:border-slate-700/50" style={{ borderInlineStartWidth: "4px", borderInlineStartColor: "#f59e0b" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <HardHat className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <span className="text-slate-900 dark:text-white">{t("المقاول", "Contractor")}</span>
                <p className="text-[10px] text-slate-400 font-normal">{t("المنفذ للمشروع", "Project Executor")}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {project.contractor ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("الشركة", "Company")}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{project.contractor.companyName || project.contractor.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("جهة الاتصال", "Contact")}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{project.contractor.contactPerson || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("التخصص", "Category")}</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">{getContractorCategoryLabel(project.contractor.category, isAr)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t("التقييم", "Rating")}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn("h-3 w-3", star <= (project.contractor?.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600")}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("السجل التجاري", "CR Number")}</span>
                  <span className="font-medium text-slate-900 dark:text-white" dir="ltr">{project.contractor.crNumber || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t("الهاتف", "Phone")}</span>
                  <div className="flex items-center gap-1">
                    {project.contractor.phone && (
                      <>
                        <a href={`tel:${project.contractor.phone}`} className="p-1 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <Phone className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </a>
                        <a href={`https://wa.me/${project.contractor.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </a>
                        <span className="font-medium text-slate-900 dark:text-white text-xs" dir="ltr">{project.contractor.phone}</span>
                      </>
                    )}
                    {!project.contractor.phone && <span className="text-slate-400">—</span>}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-2">
                  <HardHat className="h-5 w-5 text-amber-300 dark:text-amber-600" />
                </div>
                <p className="text-xs text-slate-400">{t("لم يتم تحديد مقاول", "No contractor assigned")}</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">{t("يمكنك تعيين مقاول من صفحة العطاءات", "Assign a contractor from the Bids page")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Info Card */}
        <Card className="border-slate-200 dark:border-slate-700/50" style={{ borderInlineStartWidth: "4px", borderInlineStartColor: "#3b82f6" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              {t("معلومات المشروع", "Project Info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t("رقم المشروع", "Project No.")}</span>
              <span className="font-medium text-slate-900 dark:text-white">#{project.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("الموقع", "Location")}</span>
              <span className="font-medium text-slate-900 dark:text-white">{project.location || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("رقم القطعة", "Plot No.")}</span>
              <span className="font-medium text-slate-900 dark:text-white">{project.plotNumber || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t("النوع", "Type")}</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {project.type === "villa" ? t("فيلا", "Villa") :
                 project.type === "building" ? t("مبنى", "Building") :
                 project.type === "commercial" ? t("تجاري", "Commercial") :
                 t("صناعي", "Industrial")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-teal-500" />
            {t("مراحل المشروع", "Project Lifecycle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-0 min-w-max">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isActive = idx === Math.floor((project.progress / 100) * PIPELINE_STAGES.length);
                const isCompleted = idx < Math.floor((project.progress / 100) * PIPELINE_STAGES.length);
                return (
                  <div key={stage.key} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5 w-24">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                        isActive ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20 animate-pulse" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <stage.icon className="h-4 w-4" />}
                      </div>
                      <span className={cn("text-[10px] text-center font-medium", isActive || isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                        {isAr ? stage.labelAr : stage.labelEn}
                      </span>
                    </div>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <div className={cn("w-8 h-1 rounded-full mx-1", isCompleted ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700")} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team List with Status */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-teal-500" />
            {t("فريق العمل", "Project Team")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(project.assignments.length > 0 ? project.assignments.map(a => ({ id: a.id, name: a.user?.name || "", role: a.role, status: "active" as const })) : MOCK_TEAM).map((member) => (
              <div key={member.id} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all",
                member.status === "active" ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              )}>
                <div className="relative">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center",
                    member.status === "active" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <span className={cn("text-xs font-bold", member.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900",
                    member.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] border-0", member.status === "active"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                )}>
                  {member.status === "active" ? t("نشط", "Active") : t("خامل", "Idle")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Recent Updates + Quick Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Updates */}
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-blue-500" />
              {t("آخر التحديثات", "Recent Updates")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_ACTIVITY.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300">{isAr ? item.actionAr : item.actionEn}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.user} · {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Documents */}
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                {t("مستندات سريعة", "Quick Documents")}
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-teal-600 hover:text-teal-700 gap-1">
                {t("عرض الكل", "View All")}
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOCK_DOCUMENTS.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{isAr ? doc.nameAr : doc.nameEn}</p>
                    <p className="text-[10px] text-slate-400">{doc.size} · {doc.date}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===== WORKFLOW TAB =====
function WorkflowTab({ projectId, language }: { projectId: string; language: "ar" | "en" }) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);

  const { data: workflow, isLoading, refetch } = useQuery({
    queryKey: ["project-workflow", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/workflow`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return data.workflow as WorkflowData | null;
    },
    enabled: !!projectId,
  });

  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/workflow/init`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { refetch(); toast.success(t("تم إنشاء سير العمل", "Workflow initialized")); },
    onError: () => toast.error(t("فشل إنشاء سير العمل", "Failed to initialize")),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ stepId, action, notes }: { stepId: string; action: string; notes?: string }) => {
      const stage = workflow?.stages?.[selectedStageIdx];
      const res = await fetch(`/api/projects/${projectId}/workflow/stages/${stage?.id}/steps/${stepId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: "system", notes }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { refetch(); toast.success(t("تم تنفيذ الإجراء", "Action executed")); },
    onError: () => toast.error(t("فشل تنفيذ الإجراء", "Action failed")),
  });

  const stages = workflow?.stages || [];
  const currentStage = stages[selectedStageIdx];
  const progressPct = workflow?.progress || 0;

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500 text-white border-emerald-500";
      case "in_progress": return "bg-teal-500 text-white border-teal-500 ring-2 ring-teal-200";
      case "pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300";
      default: return "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200";
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] border-0">{t("مكتمل", "Done")}</Badge>;
      case "in_progress": return <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 text-[10px] border-0">{t("قيد التنفيذ", "In Progress")}</Badge>;
      case "pending": return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] border-0">{t("بانتظار", "Pending")}</Badge>;
      case "returned": return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] border-0">{t("معاد", "Returned")}</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] border-0">{t("مقفل", "Locked")}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  if (!workflow) {
    return (
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="py-16 text-center">
          <GitBranch className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{t("سير العمل", "Workflow")}</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
            {t("لم يتم إنشاء سير العمل لهذا المشروع بعد. اضغط لإنشاء سير عمل تلقائي من القالب الافتراضي.", "Workflow has not been created yet. Click to initialize from the default template.")}
          </p>
          <Button onClick={() => initMutation.mutate()} disabled={initMutation.isPending} className="bg-teal-600 hover:bg-teal-700 gap-2">
            <Play className="h-4 w-4" />
            {initMutation.isPending ? t("جارٍ الإنشاء...", "Creating...") : t("إنشاء سير العمل", "Initialize Workflow")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card className="border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{workflow.template?.name || t("سير العمل", "Workflow")}</h3>
                <p className="text-xs text-white/70">{t("المرحلة الحالية", "Current Stage")}: {stages.find(s => s.status === "in_progress" || s.status === "pending")?.name || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-end">
                <span className="text-2xl font-bold">{Math.round(progressPct)}%</span>
                <p className="text-[10px] text-white/60">{t("الإنجاز", "Progress")}</p>
              </div>
            </div>
          </div>
          <Progress value={progressPct} className="h-1.5 mt-3 bg-white/20" />
        </div>
      </Card>

      {/* Horizontal Stage Pipeline */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="p-4">
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-1 min-w-max">
              {stages.map((stage, idx) => {
                const isActive = idx === selectedStageIdx;
                return (
                  <React.Fragment key={stage.id}>
                    <button
                      onClick={() => setSelectedStageIdx(idx)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                        getStageStatusColor(stage.status),
                        isActive && "ring-2 ring-offset-1 dark:ring-offset-slate-900"
                      )}
                    >
                      {stage.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                       stage.status === "in_progress" ? <Clock className="h-3.5 w-3.5" /> :
                       <span className="w-3.5 h-3.5 rounded-full border-2 border-current opacity-50" />}
                      <span>{isAr ? stage.name : stage.nameEn || stage.name}</span>
                    </button>
                    {idx < stages.length - 1 && (
                      <div className={cn("w-4 h-0.5 rounded", stage.status === "completed" ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700")} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Stage Steps */}
      {currentStage && (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", currentStage.status === "completed" ? "bg-emerald-100 text-emerald-600" : "bg-teal-100 text-teal-600")}>
                  {currentStage.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div>
                  <span>{isAr ? currentStage.name : currentStage.nameEn || currentStage.name}</span>
                  <p className="text-[10px] text-slate-400 font-normal">
                    {t("المرحلة", "Stage")} {selectedStageIdx + 1}/{stages.length}
                    {currentStage.dueDate && ` • ${t("الموعد", "Due")}: ${new Date(currentStage.dueDate).toLocaleDateString(isAr ? "ar-AE" : "en-US")}`}
                  </p>
                </div>
              </CardTitle>
              {getStageStatusBadge(currentStage.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentStage.steps.map((step) => (
                <div key={step.id} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  step.status === "completed" ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50" :
                  step.status === "in_progress" ? "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/50" :
                  step.status === "pending" ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" :
                  "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    step.status === "completed" ? "bg-emerald-100 text-emerald-600" :
                    step.status === "in_progress" ? "bg-teal-100 text-teal-600" :
                    step.status === "pending" ? "bg-amber-100 text-amber-600" :
                    "bg-slate-100 text-slate-400"
                  )}>
                    {step.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> :
                     step.status === "in_progress" ? <Play className="h-3.5 w-3.5" /> :
                     step.status === "returned" ? <RotateCcw className="h-4 w-4" /> :
                     <Circle className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {isAr ? step.name : step.nameEn || step.name}
                      </span>
                      {getStepStatusBadge(step.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {step.assignee && <span className="text-[10px] text-slate-400">{step.assignee.name}</span>}
                      {step.assignedRole && !step.assignee && <span className="text-[10px] text-slate-400 italic">{step.assignedRole}</span>}
                      {step.dueDate && <span className="text-[10px] text-slate-400">{new Date(step.dueDate).toLocaleDateString(isAr ? "ar-AE" : "en-US")}</span>}
                    </div>
                    {step.returnReason && <p className="text-[10px] text-red-500 mt-1">{step.returnReason}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {step.status === "pending" && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 bg-teal-600 text-white border-0 hover:bg-teal-700"
                        onClick={() => actionMutation.mutate({ stepId: step.id, action: "start" })}>
                        <Play className="h-3 w-3" />{t("بدء", "Start")}
                      </Button>
                    )}
                    {step.status === "in_progress" && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 bg-emerald-600 text-white border-0 hover:bg-emerald-700"
                        onClick={() => actionMutation.mutate({ stepId: step.id, action: "complete" })}>
                        <CheckCircle2 className="h-3 w-3" />{t("إكمال", "Complete")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t("المراحل", "Stages")} value={`${stages.filter(s => s.status === "completed").length}/${stages.length}`} icon={GitBranch} color="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" />
        <StatCard label={t("الخطوات", "Steps")} value={`${workflow.progressData?.completedSteps || 0}/${workflow.progressData?.totalSteps || 0}`} icon={CheckSquare} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label={t("المكتمل", "Completed")} value={`${Math.round(progressPct)}%`} icon={TrendingUp} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard label={t("الحالة", "Status")} value={workflow.status === "completed" ? t("مكتمل", "Done") : t("نشط", "Active")} icon={Activity} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>
    </div>
  );
}

// ===== CONTRACTOR RFQ TAB =====
function ContractorRFQTab({ projectId, language }: { projectId: string; language: "ar" | "en" }) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [activeSub, setActiveSub] = useState("rfq");
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const quoteInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  const { data: bids, isLoading, refetch } = useQuery({
    queryKey: ["project-bids-rfq", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/bids?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return (data.bids || data || []) as ContractorRFQBid[];
    },
    enabled: !!projectId,
  });

  const { data: contractors } = useQuery({
    queryKey: ["contractors-list"],
    queryFn: async () => {
      const res = await fetch("/api/contractors");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return data.contractors || data || [];
    },
  });

  const rfqMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/contractor-rfq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorIds: selectedContractors }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { refetch(); setSelectedContractors([]); toast.success(t("تم إرسال طلب عرض السعر", "RFQ sent")); },
    onError: () => toast.error(t("فشل الإرسال", "Failed to send")),
  });

  const uploadQuoteMutation = useMutation({
    mutationFn: async ({ bidId, file }: { bidId: string; file: File }) => {
      const formData = new FormData();
      formData.append("quoteFile", file);
      const res = await fetch(`/api/projects/${projectId}/contractor-rfq/${bidId}/upload-quote`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { refetch(); toast.success(t("تم رفع العرض", "Quote uploaded")); },
    onError: () => toast.error(t("فشل رفع العرض", "Failed to upload")),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/contractor-rfq/analyze`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => { refetch(); toast.success(t("تم التحليل", "Analysis complete")); },
    onError: () => toast.error(t("فشل التحليل", "Analysis failed")),
  });

  const awardMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const res = await fetch(`/api/projects/${projectId}/contractor-rfq/${bidId}/award`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { refetch(); toast.success(t("تمت الترسية", "Bid awarded")); },
    onError: () => toast.error(t("فشلت الترسية", "Failed to award")),
  });

  const uploadContractMutation = useMutation({
    mutationFn: async ({ bidId, file }: { bidId: string; file: File }) => {
      const formData = new FormData();
      formData.append("contractFile", file);
      const res = await fetch(`/api/projects/${projectId}/contractor-rfq/${bidId}/upload-contract`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { refetch(); toast.success(t("تم رفع العقد", "Contract uploaded")); },
    onError: () => toast.error(t("فشل رفع العقد", "Failed to upload contract")),
  });

  const rfqBids = bids?.filter(b => b.rfqSentAt) || [];
  const quotesReceived = rfqBids.filter(b => b.quoteFile).length;
  const awardedBid = rfqBids.find(b => b.isAwarded);

  const rfqSubTabs = [
    { id: "rfq", icon: Send, labelAr: "اختيار المقاولين", labelEn: "Select" },
    { id: "quotes", icon: FileText, labelAr: "إدارة العروض", labelEn: "Quotes" },
    { id: "compare", icon: BarChart3, labelAr: "تحليل بالذكاء الاصطناعي", labelEn: "AI Compare" },
    { id: "award", icon: Award, labelAr: "الترسية", labelEn: "Award" },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card className="border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 flex items-center gap-2">
              {rfqSubTabs.map((st, idx) => (
                <React.Fragment key={st.id}>
                  <button onClick={() => setActiveSub(st.id)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      (rfqSubTabs.findIndex(s => s.id === activeSub) >= idx || st.id === activeSub)
                        ? "bg-teal-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                    )}>
                    {rfqSubTabs.findIndex(s => s.id === activeSub) > idx ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                  </button>
                  {idx < rfqSubTabs.length - 1 && (
                    <div className={cn("flex-1 h-1 rounded", rfqSubTabs.findIndex(s => s.id === activeSub) > idx ? "bg-teal-400" : "bg-slate-200 dark:bg-slate-700")} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 text-xs">
            {rfqSubTabs.map((st) => (
              <button key={st.id} onClick={() => setActiveSub(st.id)}
                className={cn("px-2 py-1 rounded transition-all", activeSub === st.id ? "text-teal-600 font-semibold" : "text-slate-400 hover:text-slate-600")}>
                {isAr ? st.labelAr : st.labelEn}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RFQ - Select Contractors */}
      {activeSub === "rfq" && (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-500" />
              {t("اختيار المقاولين", "Select Contractors")}
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 text-[10px] border-0 ms-2">
                {selectedContractors.length} {t("محدد", "selected")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {(contractors || []).map((c: { id: string; name: string; companyName: string; category: string; rating: number; phone: string }) => (
                <label key={c.id} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  selectedContractors.includes(c.id)
                    ? "bg-teal-50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                )}>
                  <input type="checkbox" checked={selectedContractors.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedContractors([...selectedContractors, c.id]);
                      else setSelectedContractors(selectedContractors.filter(id => id !== c.id));
                    }}
                    className="rounded border-slate-300" />
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <HardHat className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{c.companyName || c.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{getContractorCategoryLabel(c.category, isAr)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />{c.rating}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => rfqMutation.mutate()} disabled={selectedContractors.length === 0 || rfqMutation.isPending}
                className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2 shadow-lg shadow-teal-600/20">
                <Send className="h-4 w-4" />
                {rfqMutation.isPending ? t("جارٍ الإرسال...", "Sending...") : t("إرسال طلب عرض سعر", "Send RFQ")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotes Management */}
      {activeSub === "quotes" && (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              {t("إدارة العروض", "Quote Management")}
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] border-0 ms-2">
                {quotesReceived}/{rfqBids.length} {t("مستلم", "received")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rfqBids.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Send className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">{t("لم يتم إرسال طلبات بعد", "No RFQs sent yet")}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rfqBids.map((bid) => (
                  <div key={bid.id} className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    bid.isAwarded ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800" :
                    "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  )}>
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <HardHat className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">{bid.contractorName}</span>
                        {bid.isAwarded && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] border-0">{t("الفائز", "Winner")}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <Badge className={cn(
                          "text-[9px] border-0",
                          bid.rfqStatus === "sent" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          bid.rfqStatus === "received" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          bid.rfqStatus === "reviewing" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                          bid.rfqStatus === "awarded" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}>{bid.rfqStatus}</Badge>
                        {bid.quoteFile && <span className="text-emerald-500">✓ {t("عرض مرفوع", "Quote uploaded")}</span>}
                        {bid.amount > 0 && <span>{bid.amount.toLocaleString()} {isAr ? "د.إ" : "AED"}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input ref={quoteInputRef} type="file" accept=".pdf" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadQuoteMutation.mutate({ bidId: bid.id, file });
                          e.target.value = "";
                        }} />
                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1"
                        onClick={() => quoteInputRef.current?.click()}>
                        <Upload className="h-3 w-3" />{t("رفع عرض", "Upload")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Compare */}
      {activeSub === "compare" && (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              {t("تحليل بالذكاء الاصطناعي", "AI Analysis")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotesReceived < 2 ? (
              <div className="text-center py-12 text-slate-400">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">{t("يرجى رفع عرضين على الأقل للمقارنة", "Upload at least 2 quotes to compare")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white gap-2">
                  <Sparkles className="h-4 w-4" />
                  {analyzeMutation.isPending ? t("جارٍ التحليل...", "Analyzing...") : t("تحليل بالذكاء الاصطناعي", "Analyze with AI")}
                </Button>
                {rfqBids.filter(b => b.aiAnalysis).length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800/50">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">{t("نتيجة التحليل", "Analysis Result")}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">{rfqBids.find(b => b.aiAnalysis)?.aiAnalysis}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Award */}
      {activeSub === "award" && (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" />
              {t("الترسية", "Award")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {awardedBid ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t("تمت الترسية", "Awarded")}</p>
                      <p className="text-xs text-slate-600">{awardedBid.contractorName}</p>
                    </div>
                  </div>
                </div>
                {!awardedBid.contractFile && (
                  <div className="flex items-center gap-2">
                    <input ref={contractInputRef} type="file" accept=".pdf" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadContractMutation.mutate({ bidId: awardedBid.id, file });
                        e.target.value = "";
                      }} />
                    <Button onClick={() => contractInputRef.current?.click()}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Upload className="h-4 w-4" />
                      {t("رفع العقد", "Upload Contract")}
                    </Button>
                  </div>
                )}
                {awardedBid.contractFile && (
                  <p className="text-xs text-emerald-600">✓ {t("تم رفع العقد", "Contract uploaded")}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">{t("اختر المقاول الفائز من العروض المستلمة", "Select the winning contractor from received bids")}</p>
                {rfqBids.filter(b => b.quoteFile).map((bid) => (
                  <div key={bid.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                      <p className="text-xs font-medium">{bid.contractorName}</p>
                      {bid.amount > 0 && <p className="text-[10px] text-slate-400">{bid.amount.toLocaleString()} {isAr ? "د.إ" : "AED"}</p>}
                    </div>
                    <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]"
                      onClick={() => awardMutation.mutate(bid.id)} disabled={awardMutation.isPending}>
                      <Award className="h-3 w-3" />{t("ترسية", "Award")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
    const subTabsMap: Record<string, typeof designSubTabs> = {
      design: designSubTabs,
      municipality: municipalitySubTabs,
      boq: boqSubTabs,
      contractor: contractorSubTabs,
      supervision: supervisionSubTabs,
      financial: financialSubTabs,
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
      case "design": return designSubTabs;
      case "municipality": return municipalitySubTabs;
      case "boq": return boqSubTabs;
      case "contractor": return contractorSubTabs;
      case "supervision": return supervisionSubTabs;
      case "financial": return financialSubTabs;
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
                  {t("العميل", "Client")}: {project.client?.name}{project.client?.company ? ` — ${project.client.company}` : ""}
                  {project.contractor ? (
                    <span className="ms-3">| {t("المقاول", "Contractor")}: {project.contractor.companyName || project.contractor.name}</span>
                  ) : null}
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

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="mt-4">
          <WorkflowTab projectId={currentProjectId || ''} language={language} />
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="mt-4">
          <SubTabsNav 
            tabs={designSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="space-y-4">
            {/* Approval Chain — shown on all design sub-tabs */}
            <Card className="border-slate-200 dark:border-slate-700/50 overflow-hidden">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-500" />{t("سلسلة الاعتماد", "Approval Chain")}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {APPROVAL_CHAIN.map((step, idx) => (
                    <React.Fragment key={step.key}>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{isAr ? step.labelAr : step.labelEn}</span>
                      </div>
                      {idx < APPROVAL_CHAIN.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step Tables per Discipline — shown on all design sub-tabs */}
            <Card className="border-slate-200 dark:border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-teal-500" />
                  {t("جدول خطوات التخصصات", "Discipline Steps Table")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {DESIGN_DISCIPLINES.map((discipline) => {
                  const DisciplineIcon = discipline.icon;
                  const completedSteps = discipline.steps.filter(s => s.status === "approved").length;
                  const totalSteps = discipline.steps.length;
                  const progressPct = Math.round((completedSteps / totalSteps) * 100);

                  return (
                    <div key={discipline.id} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                      {/* Section Header with Progress */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${discipline.color}15`, color: discipline.color }}>
                          <DisciplineIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{isAr ? discipline.nameAr : discipline.nameEn}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">{completedSteps}/{totalSteps}</span>
                          <div className="w-24">
                            <Progress value={progressPct} className="h-1.5 bg-slate-200 dark:bg-slate-700" />
                          </div>
                          <span className="text-sm font-bold" style={{ color: discipline.color }}>{progressPct}%</span>
                        </div>
                      </div>

                      {/* Steps Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              <th className="text-start p-2.5 text-slate-500 font-medium w-8">#</th>
                              <th className="text-start p-2.5 text-slate-500 font-medium">{t("الخطوة", "Step")}</th>
                              <th className="text-start p-2.5 text-slate-500 font-medium w-36">{t("المسؤول", "Assignee")}</th>
                              <th className="text-start p-2.5 text-slate-500 font-medium w-28">{t("الحالة", "Status")}</th>
                              <th className="text-start p-2.5 text-slate-500 font-medium w-28">{t("التاريخ", "Date")}</th>
                              <th className="text-start p-2.5 text-slate-500 font-medium w-24">{t("ملفات", "Files")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {discipline.steps.map((step, idx) => (
                              <tr key={step.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="p-2.5 text-slate-400">{idx + 1}</td>
                                <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">{isAr ? step.nameAr : step.nameEn}</td>
                                <td className="p-2.5">
                                  <div className="relative">
                                    <select
                                      className="w-full text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 appearance-none cursor-pointer pr-6"
                                      value={step.assignee}
                                      onChange={() => {}}
                                    >
                                      <option value="">{t("اختر...", "Select...")}</option>
                                      <option value="ahmed">أحمد محمد</option>
                                      <option value="sara">سارة أحمد</option>
                                      <option value="khalid">خالد علي</option>
                                      <option value="fatma">فاطمة حسن</option>
                                    </select>
                                    <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                                  </div>
                                </td>
                                <td className="p-2.5">
                                  <select
                                    className="w-full text-xs px-2 py-1.5 rounded-md border-0 font-medium cursor-pointer"
                                    style={{ backgroundColor: DESIGN_STEP_STATUS_COLORS[step.status]?.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-100', color: DESIGN_STEP_STATUS_COLORS[step.status]?.split(' ').find(c => c.startsWith('text-')) || 'text-slate-500' }}
                                    value={step.status}
                                    onChange={() => {}}
                                  >
                                    <option value="not-started">{isAr ? "لم يبدأ" : "Not Started"}</option>
                                    <option value="in-progress">{isAr ? "قيد التنفيذ" : "In Progress"}</option>
                                    <option value="submitted">{isAr ? "مقدم" : "Submitted"}</option>
                                    <option value="approved">{isAr ? "معتمد" : "Approved"}</option>
                                  </select>
                                </td>
                                <td className="p-2.5 text-slate-400">{step.date || "—"}</td>
                                <td className="p-2.5">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-teal-600">
                                    <Upload className="h-3.5 w-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Supervisor Assignment */}
                      <div className="flex items-center gap-3 p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                        <UserCheck className="h-4 w-4 text-slate-400" />
                        <span className="text-xs text-slate-500">{t("المشرف:", "Supervisor:")}</span>
                        <div className="relative flex-1 max-w-[200px]">
                          <select className="w-full text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 appearance-none cursor-pointer pr-6">
                            <option value="">{t("اختر مشرف...", "Select supervisor...")}</option>
                            <option value="lead1">أحمد محمد</option>
                            <option value="lead2">سارة أحمد</option>
                          </select>
                          <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {activeSubTab === "architectural" && (
              <>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("خط أنابيب التصميم المعماري", "Architectural Design Pipeline")}</CardTitle></CardHeader>
                  <CardContent>
                    <DesignPipeline department="architectural" stages={project.stages || []} language={language} />
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label={t("الإنجاز", "Progress")} value={`${Math.round(project.stages?.filter((s) => s.department === "architectural" && s.status === "APPROVED").length / Math.max(project.stages?.filter((s) => s.department === "architectural").length, 1) * 100 || 0)}%`} icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
                  <StatCard label={t("مكتمل", "Completed")} value={`${project.stages?.filter((s) => s.department === "architectural" && s.status === "APPROVED").length || 0}/${project.stages?.filter((s) => s.department === "architectural").length || 0}`} icon={CheckCircle2} color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" />
                  <StatCard label={t("قيد التنفيذ", "In Progress")} value={project.stages?.filter((s) => s.department === "architectural" && s.status === "IN_PROGRESS").length || 0} icon={Clock} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
                  <StatCard label={t("عدد الرفوض", "Rejections")} value={0} icon={XCircle} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
                </div>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("مراحل القسم المعماري", "Architectural Stages")}</CardTitle></CardHeader>
                  <CardContent>
                    {project.stages?.filter((s) => s.department === "architectural").length > 0 ? (
                      <StageStepper stages={project.stages.filter((s) => s.department === "architectural")} language={language} />
                    ) : (
                      <div className="text-center py-8 text-slate-500"><Building2 className="h-10 w-10 mx-auto text-slate-300 mb-3" /><p>{t("لا توجد مراحل", "No stages defined")}</p></div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            {activeSubTab === "structural" && (
              <>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("خط أنابيب التصميم الإنشائي", "Structural Design Pipeline")}</CardTitle></CardHeader>
                  <CardContent>
                    <DesignPipeline department="structural" stages={project.stages || []} language={language} />
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label={t("الإنجاز", "Progress")} value={`${Math.round(project.stages?.filter((s) => s.department === "structural" && s.status === "APPROVED").length / Math.max(project.stages?.filter((s) => s.department === "structural").length, 1) * 100 || 0)}%`} icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
                  <StatCard label={t("مكتمل", "Completed")} value={`${project.stages?.filter((s) => s.department === "structural" && s.status === "APPROVED").length || 0}/${project.stages?.filter((s) => s.department === "structural").length || 0}`} icon={CheckCircle2} color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" />
                  <StatCard label={t("قيد التنفيذ", "In Progress")} value={project.stages?.filter((s) => s.department === "structural" && s.status === "IN_PROGRESS").length || 0} icon={Clock} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
                  <StatCard label={t("عدد الرفوض", "Rejections")} value={0} icon={XCircle} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
                </div>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("مراحل القسم الإنشائي", "Structural Stages")}</CardTitle></CardHeader>
                  <CardContent>
                    {project.stages?.filter((s) => s.department === "structural").length > 0 ? (
                      <StageStepper stages={project.stages.filter((s) => s.department === "structural")} language={language} />
                    ) : (
                      <div className="text-center py-8 text-slate-500"><HardHat className="h-10 w-10 mx-auto text-slate-300 mb-3" /><p>{t("لا توجد مراحل", "No stages defined")}</p></div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            {activeSubTab === "mep" && (
              <>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("خط أنابيب التصميم الكهربائي والميكانيك", "MEP Design Pipeline")}</CardTitle></CardHeader>
                  <CardContent>
                    <DesignPipeline department="mep_electrical" stages={project.stages || []} language={language} />
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label={t("الإنجاز", "Progress")} value={`${Math.round(project.stages?.filter((s) => (s.department === "mep_electrical" || s.department === "mep_plumbing" || s.department === "mep_water") && s.status === "APPROVED").length / Math.max(project.stages?.filter((s) => s.department === "mep_electrical" || s.department === "mep_plumbing" || s.department === "mep_water").length, 1) * 100 || 0)}%`} icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
                  <StatCard label={t("مكتمل", "Completed")} value={`${project.stages?.filter((s) => (s.department === "mep_electrical" || s.department === "mep_plumbing" || s.department === "mep_water") && s.status === "APPROVED").length || 0}/${project.stages?.filter((s) => s.department === "mep_electrical" || s.department === "mep_plumbing" || s.department === "mep_water").length || 0}`} icon={CheckCircle2} color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" />
                  <StatCard label={t("قيد التنفيذ", "In Progress")} value={project.stages?.filter((s) => (s.department === "mep_electrical" || s.department === "mep_plumbing" || s.department === "mep_water") && s.status === "IN_PROGRESS").length || 0} icon={Clock} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
                  <StatCard label={t("عدد الرفوض", "Rejections")} value={0} icon={XCircle} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
                </div>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("مراحل الكهربائي والميكانيك", "MEP Stages")}</CardTitle></CardHeader>
                  <CardContent>
                    {project.stages?.filter((s) => s.department === "mep_electrical" || s.department === "mep_plumbing" || s.department === "mep_water").length > 0 ? (
                      <StageStepper stages={project.stages.filter((s) => s.department === "mep_electrical" || s.department === "mep_plumbing" || s.department === "mep_water")} language={language} />
                    ) : (
                      <div className="text-center py-8 text-slate-500"><Zap className="h-10 w-10 mx-auto text-slate-300 mb-3" /><p>{t("لا توجد مراحل", "No stages defined")}</p></div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            {activeSubTab === "civil-defense" && (
              <>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("خط أنابيب تصميم الدفاع المدني", "Civil Defense Design Pipeline")}</CardTitle></CardHeader>
                  <CardContent>
                    <DesignPipeline department="mep_civil_defense" stages={project.stages || []} language={language} />
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label={t("الإنجاز", "Progress")} value={`${Math.round(project.stages?.filter((s) => s.department === "mep_civil_defense" && s.status === "APPROVED").length / Math.max(project.stages?.filter((s) => s.department === "mep_civil_defense").length, 1) * 100 || 0)}%`} icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
                  <StatCard label={t("مكتمل", "Completed")} value={`${project.stages?.filter((s) => s.department === "mep_civil_defense" && s.status === "APPROVED").length || 0}/${project.stages?.filter((s) => s.department === "mep_civil_defense").length || 0}`} icon={CheckCircle2} color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" />
                  <StatCard label={t("قيد التنفيذ", "In Progress")} value={project.stages?.filter((s) => s.department === "mep_civil_defense" && s.status === "IN_PROGRESS").length || 0} icon={Clock} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
                  <StatCard label={t("عدد الرفوض", "Rejections")} value={0} icon={XCircle} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
                </div>
                <Card className="border-slate-200 dark:border-slate-700/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("مراحل الدفاع المدني", "Civil Defense Stages")}</CardTitle></CardHeader>
                  <CardContent>
                    {project.stages?.filter((s) => s.department === "mep_civil_defense").length > 0 ? (
                      <StageStepper stages={project.stages.filter((s) => s.department === "mep_civil_defense")} language={language} />
                    ) : (
                      <div className="text-center py-8 text-slate-500"><ShieldAlert className="h-10 w-10 mx-auto text-slate-300 mb-3" /><p>{t("لا توجد مراحل", "No stages defined")}</p></div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Municipality Tab */}
        <TabsContent value="municipality" className="mt-4">
          <SubTabsNav 
            tabs={municipalitySubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="space-y-4">
            {/* Prerequisites Checklist — shown on license sub-tab */}
            {activeSubTab === "license" && (
              <Card className="border-slate-200 dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-teal-500" />
                    {t("قائمة المتطلبات", "Prerequisites Checklist")}
                    <Badge variant="outline" className="text-[10px] border-0 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 ms-2">
                      {(() => {
                        const checked = MUNICIPALITY_PREREQUISITES.filter(p => {
                          if (p.dependsOn === "external") return false;
                          return project.stages?.some(s => s.department === p.dependsOn && s.status === "APPROVED");
                        }).length;
                        return `${checked}/${MUNICIPALITY_PREREQUISITES.length}`;
                      })()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {MUNICIPALITY_PREREQUISITES.map((item) => {
                      const isChecked = item.dependsOn === "external"
                        ? false
                        : project.stages?.some(s => s.department === item.dependsOn && s.status === "APPROVED") || false;
                      return (
                        <div key={item.id} className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          isChecked
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        )}>
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                            isChecked
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-slate-300 dark:border-slate-600"
                          )}>
                            {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-medium", isChecked ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300")}>
                              {isAr ? item.labelAr : item.labelEn}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {item.dependsOn === "external" ? t("مطلوب يدوياً", "Manual upload required") : `${t("يعتمد على", "Depends on")} ${DESIGN_DISCIPLINES.find(d => d.id === item.dependsOn)?.nameAr || item.dependsOn}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              {activeSubTab === "license" && (
                <>
                  <Card className="border-slate-200 dark:border-slate-700/50 mb-4">
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("حالة الرخصة", "License Status")}</CardTitle></CardHeader>
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
                        <div className="text-center py-8 text-slate-500"><Landmark className="h-10 w-10 mx-auto text-slate-300 mb-3" /><p>{t("لا توجد موافقات", "No approvals tracked")}</p></div>
                      )}
                    </CardContent>
                  </Card>

                  {/* License Stages Table */}
                  <Card className="border-slate-200 dark:border-slate-700/50">
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t("مراحل الرخصة البلدية", "Municipality License Stages")}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="text-start p-2.5 text-slate-500 font-medium">{t("المرحلة", "Stage")}</th>
                              <th className="text-start p-2.5 text-slate-500 font-medium w-28">{t("الحالة", "Status")}</th>
                              <th className="text-start p-2.5 text-slate-500 font-medium w-28">{t("تاريخ التقديم", "Submitted")}</th>
                              <th className="text-start p-2.5 text-slate-500 font-medium w-28">{t("تاريخ الاعتماد", "Approved")}</th>
                              <th className="text-start p-2.5 text-slate-500 font-medium w-20">{t("ملاحظات", "Notes")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { stageAr: "تقديم الطلب", stageEn: "Application Submission", status: project.govApprovals?.[0]?.status || "PENDING", submitted: project.govApprovals?.[0]?.submissionDate, approved: project.govApprovals?.[0]?.approvalDate },
                              { stageAr: "مراجعة البلدية", stageEn: "Municipality Review", status: "PENDING", submitted: null, approved: null },
                              { stageAr: "الاعتماد / الرفض", stageEn: "Approval / Rejection", status: "NOT_STARTED", submitted: null, approved: null },
                            ].map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50">
                                <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">{isAr ? row.stageAr : row.stageEn}</td>
                                <td className="p-2.5"><StatusBadge status={row.status} language={language} /></td>
                                <td className="p-2.5 text-slate-400">{row.submitted ? new Date(row.submitted).toLocaleDateString(isAr ? "ar-AE" : "en-US") : "—"}</td>
                                <td className="p-2.5 text-slate-400">{row.approved ? new Date(row.approved).toLocaleDateString(isAr ? "ar-AE" : "en-US") : "—"}</td>
                                <td className="p-2.5 text-slate-400">—</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document Section */}
                  <Card className="border-slate-200 dark:border-slate-700/50 mt-4">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <FileUp className="h-4 w-4 text-amber-500" />
                          {t("مستندات البلدية", "Municipality Documents")}
                        </CardTitle>
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                          <Upload className="h-3 w-3" />
                          {t("رفع مستند", "Upload Document")}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6 text-slate-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">{t("لا توجد مستندات مرفوعة", "No documents uploaded")}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              {activeSubTab === "correspondence" && <MunicipalityCorrespondencePage language={language} projectId={currentProjectId || undefined} />}
              {activeSubTab === "approved-drawings" && <DocumentsPage language={language} projectId={currentProjectId || undefined} />}
            </div>
          </div>
        </TabsContent>

        {/* BOQ Tab */}
        <TabsContent value="boq" className="mt-4">
          <SubTabsNav 
            tabs={boqSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            {activeSubTab === "boq" && <BOQPage language={language} projectId={currentProjectId || undefined} />}
            {activeSubTab === "specs" && <DocumentsPage language={language} projectId={currentProjectId || undefined} />}
          </div>
        </TabsContent>

        {/* Contractor Tab */}
        <TabsContent value="contractor" className="mt-4">
          <ContractorRFQTab projectId={currentProjectId || ''} language={language} />
        </TabsContent>

        {/* Supervision Tab */}
        <TabsContent value="supervision" className="mt-4">
          <SubTabsNav 
            tabs={supervisionSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div>
            {(activeSubTab === "checklists" || activeSubTab === "violations") && <SupervisionPage language={language} projectId={currentProjectId || undefined} />}
            {activeSubTab === "inspections" && <InspectionsPage language={language} projectId={currentProjectId || undefined} />}
            {activeSubTab === "completion" && (
              <Card className="border-slate-200 dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    {t("شهادة الإنجاز", "Completion Certificate")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-400">
                    <Award className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("شهادة الإنجاز", "Completion Certificate")}</h3>
                    <p className="text-sm max-w-md mx-auto">{t("سيتم إنشاء شهادة الإنجاز عند اكتمال جميع مراحل المشروع بنجاح", "Completion certificate will be generated upon successful completion of all project stages")}</p>
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{t("إنجاز المعماري", "Architectural Completion")}: {project.progress}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <TasksKanban language={language} projectId={currentProjectId || undefined} />
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="mt-4">
          <SubTabsNav 
            tabs={financialSubTabs} 
            activeSubTab={activeSubTab} 
            onSubTabChange={handleSubTabChange}
            language={language}
          />
          <div className="space-y-4">
            {/* Contract Value Summary */}
            <Card className="border-slate-200 dark:border-slate-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white">
                <h3 className="text-sm font-semibold mb-3">{t("ملخص قيمة العقد", "Contract Value Summary")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-white/70">{t("إجمالي العقد", "Total Contract")}</p>
                    <p className="text-lg font-bold tabular-nums">{project.budget.toLocaleString()} <span className="text-xs font-normal">AED</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">{t("إجمالي المدفوع", "Total Paid")}</p>
                    <p className="text-lg font-bold tabular-nums">{project.invoices?.reduce((s, i) => s + i.paidAmount, 0).toLocaleString() || 0} <span className="text-xs font-normal">AED</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">{t("المتبقي", "Total Remaining")}</p>
                    <p className="text-lg font-bold tabular-nums">{Math.max(project.budget - (project.invoices?.reduce((s, i) => s + i.paidAmount, 0) || 0), 0).toLocaleString()} <span className="text-xs font-normal">AED</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">{t("نسبة التحصيل", "% Collected")}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold tabular-nums">{project.budget > 0 ? Math.round(((project.invoices?.reduce((s, i) => s + i.paidAmount, 0) || 0) / project.budget) * 100) : 0}%</p>
                      <Progress value={project.budget > 0 ? Math.round(((project.invoices?.reduce((s, i) => s + i.paidAmount, 0) || 0) / project.budget) * 100) : 0} className="h-2 bg-white/20 flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Schedule Table */}
            <Card className="border-slate-200 dark:border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-teal-500" />
                    {t("جدول الدفعات", "Payment Schedule")}
                  </CardTitle>
                  <Button size="sm" className="h-7 gap-1 text-xs bg-teal-600 hover:bg-teal-700 text-white">
                    <Plus className="h-3 w-3" />
                    {t("إضافة مرحلة دفع", "Add Payment Milestone")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-start p-2.5 text-slate-500 font-medium">{t("المرحلة", "Milestone")}</th>
                        <th className="text-start p-2.5 text-slate-500 font-medium">{t("المبلغ", "Amount")}</th>
                        <th className="text-start p-2.5 text-slate-500 font-medium">{t("النسبة", "%")}</th>
                        <th className="text-start p-2.5 text-slate-500 font-medium">{t("تاريخ الاستحقاق", "Due Date")}</th>
                        <th className="text-start p-2.5 text-slate-500 font-medium">{t("الحالة", "Status")}</th>
                        <th className="text-start p-2.5 text-slate-500 font-medium">{t("تاريخ الدفع", "Paid Date")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { milestoneAr: "دفعة مقدمة", milestoneEn: "Advance Payment", amount: project.budget * 0.2, pct: 20, dueDate: project.startDate, status: "paid", paidDate: project.startDate },
                        { milestoneAr: "إتمام التصميم", milestoneEn: "Design Completion", amount: project.budget * 0.15, pct: 15, dueDate: null, status: "pending", paidDate: null },
                        { milestoneAr: "اعتماد البلدية", milestoneEn: "Municipality Approval", amount: project.budget * 0.1, pct: 10, dueDate: null, status: "NOT_STARTED", paidDate: null },
                        { milestoneAr: "إتمام الهيكل", milestoneEn: "Structure Completion", amount: project.budget * 0.25, pct: 25, dueDate: null, status: "NOT_STARTED", paidDate: null },
                        { milestoneAr: "التشطيبات", milestoneEn: "Finishing Works", amount: project.budget * 0.2, pct: 20, dueDate: null, status: "NOT_STARTED", paidDate: null },
                        { milestoneAr: "التسليم النهائي", milestoneEn: "Final Handover", amount: project.budget * 0.1, pct: 10, dueDate: project.endDate, status: "NOT_STARTED", paidDate: null },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">{isAr ? row.milestoneAr : row.milestoneEn}</td>
                          <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{row.amount.toLocaleString()} AED</td>
                          <td className="p-2.5 text-slate-500">{row.pct}%</td>
                          <td className="p-2.5 text-slate-400">{row.dueDate ? new Date(row.dueDate).toLocaleDateString(isAr ? "ar-AE" : "en-US") : "—"}</td>
                          <td className="p-2.5">
                            <StatusBadge status={row.status === "paid" ? "APPROVED" : row.status === "pending" ? "SUBMITTED" : "NOT_STARTED"} language={language} />
                          </td>
                          <td className="p-2.5 text-slate-400">{row.paidDate ? new Date(row.paidDate).toLocaleDateString(isAr ? "ar-AE" : "en-US") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{t("المجموع", "Total")}</td>
                        <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-white">{project.budget.toLocaleString()} AED</td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">100%</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              {activeSubTab === "invoices" && <InvoicesPage language={language} projectId={currentProjectId || undefined} />}
              {activeSubTab === "payments" && <PaymentsPage language={language} projectId={currentProjectId || undefined} />}
              {activeSubTab === "budgets" && <BudgetsPage language={language} projectId={currentProjectId || undefined} />}
              {activeSubTab === "proposals" && <ProposalsPage language={language} projectId={currentProjectId || undefined} />}
            </div>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <DocumentsPage language={language} projectId={currentProjectId || undefined} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating AI Button - Opens AI Assistant */}
      <button
        onClick={() => {
          const { setCurrentPage } = useNavStore.getState();
          setCurrentPage("ai-assistant");
        }}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-xl shadow-teal-500/30 flex items-center justify-center transition-all hover:scale-110 group"
        title={t("المساعد الذكي", "AI Assistant")}
      >
        <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
      </button>
    </div>
  );
}
