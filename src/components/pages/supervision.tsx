"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  ClipboardCheck,
  Eye,
  Trash2,
  MoreHorizontal,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  Sun,
  HardHat,
  ArrowUpDown,
  X,
  FileWarning,
  ShieldCheck,
  ShieldAlert,
  Thermometer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Types =====
interface ChecklistItem {
  id: string;
  checklistId: string;
  category: string;
  description: string;
  specification: string;
  isChecked: boolean;
  compliant: boolean;
  notes: string;
  photoUrl: string;
  createdAt: string;
}

interface Violation {
  id: string;
  checklistId: string;
  projectId: string;
  type: string;
  severity: string;
  description: string;
  contractorName: string;
  deadline: string | null;
  status: string;
  photoBefore: string;
  photoAfter: string;
  resolutionNotes: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; nameEn: string; number: string } | null;
}

interface SupervisionChecklist {
  id: string;
  projectId: string;
  stage: string;
  title: string;
  visitDate: string;
  engineerId: string | null;
  weather: string;
  temperature: string;
  workerCount: number;
  contractorName: string;
  progressOverall: number;
  notes: string;
  status: string;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; nameEn: string; number: string } | null;
  items: ChecklistItem[];
  violations: Violation[];
}

interface ProjectOption { id: string; name: string; nameEn: string; number: string; }

// ===== Stage Config =====
const STAGES = [
  { key: "excavation", ar: "الحفر والأساسات", en: "Excavation & Foundation" },
  { key: "structure", ar: "الهيكل", en: "Structure" },
  { key: "masonry", ar: "البناء", en: "Masonry" },
  { key: "finishing", ar: "التشطيبات", en: "Finishing" },
  { key: "handover", ar: "التسليم", en: "Handover" },
];

const STAGE_TEMPLATES: Record<string, { category: string; description: string; specification: string }[]> = {
  excavation: [
    { category: "أعمال الحفر", description: "عمق الحفر مطابق للمخطط", specification: "طبقاً للمخططات الإنشائية" },
    { category: "أعمال الحفر", description: "اتساع القواعد صحيح", specification: "طبقاً للمخططات الإنشائية" },
    { category: "الأساسات", description: "تسليح القواعد مطابق", specification: "قطر وعدد الحديد طبقاً للمخطط" },
    { category: "الأساسات", description: "صب القواعد", specification: "خرسانة مسلحة C35" },
    { category: "أعمال التسوية", description: "تسوية أرضية القواعد", specification: "طبقة رمل 10 سم" },
    { category: "السلامة", description: "حفرات السياج والحماية", specification: "حماية بلاستيكية حول الحفرات" },
  ],
  structure: [
    { category: "الأعمدة", description: "تسليح الأعمدة مطابق", specification: "قطر وعدد الحديد" },
    { category: "الأعمدة", description: "صب الأعمدة", specification: "خرسانة مسلحة C40" },
    { category: "الأسقف", description: "تسليح الأسقف مطابق", specification: "طبقاً للمخطط الإنشائي" },
    { category: "الأسقف", description: "صب الأسقف", specification: "خرسانة مسلحة C35" },
    { category: "الجدران الحاملة", description: "أعمال البلوك الحامل", specification: "بلوك إسمنتي معتمد" },
    { category: "السلامة", description: "سقالات ودعامات آمنة", specification: "معتمدة من مهندس السلامة" },
  ],
  masonry: [
    { category: "البناء", description: "مطابقة محاور الجدران", specification: "طبقاً للمخطط المعماري" },
    { category: "البناء", description: "أعمال الطوب والبلوك", specification: "نوع وقوة البلوك" },
    { category: "الملاط", description: "خلطة الملاط", specification: "نسبة الأسمنت:الرمل" },
    { category: "العزل", description: "عزل الرطوبة", specification: "مادة العزل المعتمدة" },
    { category: "أعمال المياه", description: "تمديدات السباكة الأولية", specification: "طبقاً لمخطط MEP" },
    { category: "السلامة", description: "استخدام معدات الوقاية", specification: "خوذة وقفازات" },
  ],
  finishing: [
    { category: "الدهانات", description: "معجون وتسوية الجدران", specification: "سطح ناعم جاهز للدهان" },
    { category: "الدهانات", description: "أعمال الدهان", specification: "درجتان على الأقل" },
    { category: "البلاط", description: "بلاط الأرضيات", specification: "مطابق للمخطط ونوعية المواد" },
    { category: "البلاط", description: "بلاط الحوائط", specification: "مطابق للمخطط" },
    { category: "الكهرباء", description: "الأعمال الكهربائية", specification: "طبقاً لمخطط MEP" },
    { category: "المكيفات", description: "تمديدات التكييف", specification: "طبقاً لمخطط MEP" },
  ],
  handover: [
    { category: "المعينة", description: "فحص المبنى كاملاً", specification: "قائمة المعاينة النهائية" },
    { category: "الوثائق", description: "استلام كروكات الأساسات", specification: "جميع الكروكات المطلوبة" },
    { category: "الاختبارات", description: "اختبارات ضغط الخرسانة", specification: "تقرير المختبر" },
    { category: "النظافة", description: "نظافة الموقع والمبنى", specification: "جاهزية للتسليم" },
    { category: "الموافقات", description: "الموافقات الحكومية", specification: "شهادة الإنجاز" },
  ],
};

// ===== Helpers =====
function getStatusBadge(status: string, ar: boolean) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: ar ? "مسودة" : "Draft", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    submitted: { label: ar ? "مُقدّم" : "Submitted", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    approved: { label: ar ? "معتمد" : "Approved", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  };
  const info = map[status] || map.draft;
  return <Badge className={cn("text-[10px] h-5 border-0", info.className)}>{info.label}</Badge>;
}

function getViolationStatusBadge(status: string, ar: boolean) {
  const map: Record<string, { label: string; className: string; icon: typeof AlertCircle }> = {
    open: { label: ar ? "مفتوح" : "Open", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
    in_progress: { label: ar ? "قيد المعالجة" : "In Progress", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    resolved: { label: ar ? "تم الحل" : "Resolved", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
    closed: { label: ar ? "مغلق" : "Closed", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", icon: XCircle },
  };
  const info = map[status] || map.open;
  const Icon = info.icon;
  return (
    <Badge className={cn("text-[10px] h-5 border-0 flex items-center gap-1", info.className)}>
      <Icon className="h-3 w-3" />
      {info.label}
    </Badge>
  );
}

function getSeverityBadge(severity: string, ar: boolean) {
  const map: Record<string, { label: string; className: string }> = {
    low: { label: ar ? "منخفض" : "Low", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    medium: { label: ar ? "متوسط" : "Medium", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    high: { label: ar ? "مرتفع" : "High", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    critical: { label: ar ? "حرج" : "Critical", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  };
  const info = map[severity] || map.low;
  return <Badge className={cn("text-[10px] h-5 border-0", info.className)}>{info.label}</Badge>;
}

// ===== Main Component =====
interface SupervisionProps { language: "ar" | "en"; projectId?: string; }

export default function Supervision({ language, projectId }: SupervisionProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("checklists");
  const [selectedStage, setSelectedStage] = useState("all");
  const [filterProject, setFilterProject] = useState<string>(projectId || "all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewChecklist, setViewChecklist] = useState<SupervisionChecklist | null>(null);
  const [violationFilterStatus, setViolationFilterStatus] = useState<string>("all");
  const [violationFilterSeverity, setViolationFilterSeverity] = useState<string>("all");



  // Queries
  const { data: checklists = [], isLoading: checklistsLoading } = useQuery<SupervisionChecklist[]>({
    queryKey: ["supervision-checklists", filterProject, selectedStage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterProject !== "all") params.set("projectId", filterProject);
      if (selectedStage !== "all") params.set("stage", selectedStage);
      const res = await fetch(`/api/supervision-checklists?${params}`);
      if (!res.ok) throw new Error("Failed to fetch checklists");
      return res.json();
    },
  });

  const { data: allViolations = [], isLoading: violationsLoading } = useQuery<Violation[]>({
    queryKey: ["violations-list", filterProject, violationFilterStatus, violationFilterSeverity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterProject !== "all") params.set("projectId", filterProject);
      if (violationFilterStatus !== "all") params.set("status", violationFilterStatus);
      if (violationFilterSeverity !== "all") params.set("severity", violationFilterSeverity);
      const res = await fetch(`/api/violations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch violations");
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery<ProjectOption[]>({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const res = await fetch("/api/projects-simple");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/supervision-checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create checklist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision-checklists"] });
      queryClient.invalidateQueries({ queryKey: ["violations-list"] });
      setShowCreateDialog(false);
      resetCreateForm();
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/supervision-checklists/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supervision-checklists"] }),
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/supervision-checklists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update checklist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision-checklists"] });
    },
  });

  const updateViolationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/violations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update violation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violations-list"] });
      queryClient.invalidateQueries({ queryKey: ["supervision-checklists"] });
    },
  });

  const deleteViolationMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/violations/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violations-list"] });
    },
  });

  // Create form state
  const [createForm, setCreateForm] = useState({
    projectId: "",
    stage: "",
    title: "",
    visitDate: new Date().toISOString().split("T")[0],
    weather: "sunny",
    temperature: "",
    workerCount: "",
    contractorName: "",
    progressOverall: 0,
    concreteProgress: 0,
    masonryProgress: 0,
    electricalProgress: 0,
    plumbingProgress: 0,
    notes: "",
  });
  const [createItems, setCreateItems] = useState<{ category: string; description: string; specification: string; isChecked: boolean; compliant: boolean; notes: string }[]>([]);
  const [createViolations, setCreateViolations] = useState<{ type: string; severity: string; description: string; contractorName: string; deadline: string }[]>([]);

  const resetCreateForm = () => {
    setCreateForm({
      projectId: projectId || (filterProject !== "all" ? filterProject : ""),
      stage: selectedStage !== "all" ? selectedStage : "",
      title: "",
      visitDate: new Date().toISOString().split("T")[0],
      weather: "sunny",
      temperature: "",
      workerCount: "",
      contractorName: "",
      progressOverall: 0,
      concreteProgress: 0,
      masonryProgress: 0,
      electricalProgress: 0,
      plumbingProgress: 0,
      notes: "",
    });
    setCreateItems([]);
    setCreateViolations([]);
  };

  const loadStageTemplate = (stage: string) => {
    const templates = STAGE_TEMPLATES[stage] || [];
    setCreateItems(templates.map(t => ({
      category: t.category,
      description: t.description,
      specification: t.specification,
      isChecked: false,
      compliant: true,
      notes: "",
    })));
  };

  // Stats
  const totalVisits = checklists.length;
  const openViolations = allViolations.filter(v => v.status === "open" || v.status === "in_progress").length;
  const resolvedViolations = allViolations.filter(v => v.status === "resolved" || v.status === "closed").length;
  const avgProgress = checklists.length > 0
    ? Math.round(checklists.reduce((sum, c) => sum + c.progressOverall, 0) / checklists.length)
    : 0;

  const filteredChecklists = selectedStage === "all" ? checklists : checklists.filter(c => c.stage === selectedStage);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <ClipboardCheck className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{ar ? "الإشراف على التنفيذ" : "Site Supervision"}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {totalVisits} {ar ? "زيارة إشرافية" : "supervision visits"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
          {!projectId && (
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg">
                <Filter className="h-3 w-3 me-1 text-slate-400" />
                <SelectValue placeholder={ar ? "المشروع" : "Project"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "جميع المشاريع" : "All Projects"}</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{ar ? p.name : p.nameEn || p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20" onClick={() => { resetCreateForm(); setShowCreateDialog(true); }}>
            <Plus className="h-3.5 w-3.5 me-1" />{ar ? "قائمة مراجعة جديدة" : "New Checklist"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-100 dark:border-teal-900/30">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{ar ? "إجمالي الزيارات" : "Total Visits"}</span>
          </div>
          <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{totalVisits}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{ar ? "المخالفات المفتوحة" : "Open Violations"}</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{openViolations}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{ar ? "المخالفات المحلولة" : "Resolved"}</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resolvedViolations}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpDown className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{ar ? "نسبة الإنجاز" : "Avg Progress"}</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgProgress}%</div>
          <Progress value={avgProgress} className="h-1.5 mt-2 bg-blue-100 dark:bg-blue-900/30" />
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800 h-9">
          <TabsTrigger value="checklists" className="text-xs h-7 px-3 gap-1.5">
            <ClipboardCheck className="h-3 w-3" />
            {ar ? "قوائم المراجعة" : "Checklists"}
          </TabsTrigger>
          <TabsTrigger value="violations" className="text-xs h-7 px-3 gap-1.5">
            <FileWarning className="h-3 w-3" />
            {ar ? "المخالفات" : "Violations"}
            {openViolations > 0 && (
              <Badge className="h-4 w-4 p-0 text-[9px] bg-red-500 text-white border-0 rounded-full flex items-center justify-center">
                {openViolations}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== CHECKLISTS TAB ===== */}
        <TabsContent value="checklists" className="mt-4 space-y-4">
          {/* Stage Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedStage("all")}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                selectedStage === "all"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {ar ? "الكل" : "All"}
            </button>
            {STAGES.map((stage) => (
              <button
                key={stage.key}
                onClick={() => setSelectedStage(stage.key)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                  selectedStage === stage.key
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {ar ? stage.ar : stage.en}
              </button>
            ))}
          </div>

          {/* Checklist List */}
          {checklistsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : filteredChecklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <ClipboardCheck className="h-9 w-9 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="absolute -bottom-1 -end-1 w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center border-2 border-white dark:border-slate-950">
                  <Plus className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{ar ? "لا توجد قوائم مراجعة" : "No checklists found"}</h3>
              <p className="text-sm text-slate-500 mb-4 max-w-xs">
                {ar ? "ابدأ بإنشاء قائمة مراجعة جديدة لمتابعة سير العمل" : "Create a new supervision checklist to track work progress"}
              </p>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20" onClick={() => { resetCreateForm(); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4 me-1.5" />
                {ar ? "قائمة مراجعة جديدة" : "New Checklist"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto">
              {filteredChecklists.map((checklist) => {
                const checkedCount = checklist.items.filter(i => i.isChecked).length;
                const totalCount = checklist.items.length;
                const violationCount = checklist.violations.length;
                const stageLabel = STAGES.find(s => s.key === checklist.stage);
                const hasNonCompliant = checklist.items.some(i => !i.compliant && i.isChecked);

                return (
                  <Card key={checklist.id} className={cn(
                    "p-4 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow group cursor-pointer",
                    hasNonCompliant ? "border-orange-200 dark:border-orange-800/50" : "border-slate-200 dark:border-slate-700/50"
                  )} onClick={() => setViewChecklist(checklist)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {stageLabel && (
                          <Badge variant="outline" className="text-[10px] h-5 border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400">
                            {ar ? stageLabel.ar : stageLabel.en}
                          </Badge>
                        )}
                        {getStatusBadge(checklist.status, ar)}
                        {violationCount > 0 && (
                          <Badge variant="outline" className="text-[10px] h-5 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-2.5 w-2.5 me-0.5" />
                            {violationCount} {ar ? "مخالفة" : "violations"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setViewChecklist(checklist); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={ar ? "start" : "end"} className="w-36">
                            {checklist.status === "draft" && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateChecklistMutation.mutate({ id: checklist.id, data: { status: "submitted" } }); }}>
                                <CheckCircle2 className="h-3.5 w-3.5 me-2 text-blue-500" />
                                {ar ? "تقديم" : "Submit"}
                              </DropdownMenuItem>
                            )}
                            {checklist.status === "submitted" && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateChecklistMutation.mutate({ id: checklist.id, data: { status: "approved" } }); }}>
                                <ShieldCheck className="h-3.5 w-3.5 me-2 text-emerald-500" />
                                {ar ? "اعتماد" : "Approve"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={(e) => { e.stopPropagation(); if (confirm(ar ? "هل أنت متأكد من الحذف؟" : "Delete this checklist?")) deleteChecklistMutation.mutate(checklist.id); }}>
                              <Trash2 className="h-3.5 w-3.5 me-2" />
                              {ar ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">
                      {checklist.title || (ar ? "قائمة مراجعة" : "Checklist")}
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(checklist.visitDate).toLocaleDateString(ar ? "ar-AE" : "en-US")}
                      </span>
                      {checklist.contractorName && (
                        <span className="flex items-center gap-1">
                          <HardHat className="h-3 w-3" />
                          {checklist.contractorName}
                        </span>
                      )}
                      {checklist.workerCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {checklist.workerCount}
                        </span>
                      )}
                      {checklist.weather && (
                        <span className="flex items-center gap-1">
                          <Sun className="h-3 w-3" />
                          {checklist.weather}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Progress
                        value={totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}
                        className={cn("h-1.5 flex-1", hasNonCompliant ? "bg-orange-100 dark:bg-orange-900/30 [&>div]:bg-orange-500" : "bg-slate-100 dark:bg-slate-800")}
                      />
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                        {checkedCount}/{totalCount}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== VIOLATIONS TAB ===== */}
        <TabsContent value="violations" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={violationFilterStatus} onValueChange={setViolationFilterStatus}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg">
                <Filter className="h-3 w-3 me-1 text-slate-400" />
                <SelectValue placeholder={ar ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "جميع الحالات" : "All Status"}</SelectItem>
                <SelectItem value="open">{ar ? "مفتوح" : "Open"}</SelectItem>
                <SelectItem value="in_progress">{ar ? "قيد المعالجة" : "In Progress"}</SelectItem>
                <SelectItem value="resolved">{ar ? "تم الحل" : "Resolved"}</SelectItem>
                <SelectItem value="closed">{ar ? "مغلق" : "Closed"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={violationFilterSeverity} onValueChange={setViolationFilterSeverity}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg">
                <SelectValue placeholder={ar ? "الخطورة" : "Severity"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "جميع المستويات" : "All Severity"}</SelectItem>
                <SelectItem value="low">{ar ? "منخفض" : "Low"}</SelectItem>
                <SelectItem value="medium">{ar ? "متوسط" : "Medium"}</SelectItem>
                <SelectItem value="high">{ar ? "مرتفع" : "High"}</SelectItem>
                <SelectItem value="critical">{ar ? "حرج" : "Critical"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Violations Table */}
          {violationsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : allViolations.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-50 dark:from-emerald-900/30 dark:to-green-950/20 flex items-center justify-center mb-3">
                <ShieldCheck className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{ar ? "لا توجد مخالفات" : "No violations found"}</h3>
              <p className="text-sm text-slate-500">{ar ? "لم يتم تسجيل أي مخالفات حتى الآن" : "No violations have been recorded yet"}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="max-h-[calc(100vh-380px)] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-[11px] h-8">{ar ? "النوع" : "Type"}</TableHead>
                      <TableHead className="text-[11px] h-8">{ar ? "الوصف" : "Description"}</TableHead>
                      <TableHead className="text-[11px] h-8">{ar ? "الخطورة" : "Severity"}</TableHead>
                      <TableHead className="text-[11px] h-8">{ar ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-[11px] h-8">{ar ? "المقاول" : "Contractor"}</TableHead>
                      <TableHead className="text-[11px] h-8">{ar ? "الموعد النهائي" : "Deadline"}</TableHead>
                      <TableHead className="text-[11px] h-8 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allViolations.map((violation) => (
                      <TableRow key={violation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell className="text-xs py-2.5">
                          <Badge variant="outline" className="text-[9px] h-5">
                            {ar ? ({safety: "سلامة", quality: "جودة", specification: "مواصفات", environmental: "بيئة"} as Record<string, string>)[violation.type] || violation.type : violation.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs py-2.5 max-w-[200px]">
                          <p className="line-clamp-2 text-slate-700 dark:text-slate-300">{violation.description}</p>
                        </TableCell>
                        <TableCell className="text-xs py-2.5">{getSeverityBadge(violation.severity, ar)}</TableCell>
                        <TableCell className="text-xs py-2.5">
                          <Select
                            value={violation.status}
                            onValueChange={(v) => updateViolationMutation.mutate({ id: violation.id, data: { status: v } })}
                          >
                            <SelectTrigger className={cn("h-6 w-auto border-0 p-0 text-[10px] font-medium bg-transparent shadow-none focus:ring-0")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">{ar ? "مفتوح" : "Open"}</SelectItem>
                              <SelectItem value="in_progress">{ar ? "قيد المعالجة" : "In Progress"}</SelectItem>
                              <SelectItem value="resolved">{ar ? "تم الحل" : "Resolved"}</SelectItem>
                              <SelectItem value="closed">{ar ? "مغلق" : "Closed"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs py-2.5 text-slate-500">{violation.contractorName || "-"}</TableCell>
                        <TableCell className="text-xs py-2.5 text-slate-500">
                          {violation.deadline ? new Date(violation.deadline).toLocaleDateString(ar ? "ar-AE" : "en-US") : "-"}
                        </TableCell>
                        <TableCell className="text-xs py-2.5">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-red-500" onClick={() => deleteViolationMutation.mutate(violation.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== CREATE CHECKLIST DIALOG ===== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ar ? "قائمة مراجعة جديدة" : "New Supervision Checklist"}</DialogTitle>
            <DialogDescription>{ar ? "إنشاء قائمة مراجعة إشرافية جديدة" : "Create a new supervision checklist"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{ar ? "المشروع *" : "Project *"}</Label>
                <Select value={createForm.projectId} onValueChange={(v) => setCreateForm({ ...createForm, projectId: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={ar ? "اختر مشروع" : "Select project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{ar ? p.name : p.nameEn || p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{ar ? "المرحلة *" : "Stage *"}</Label>
                <Select value={createForm.stage} onValueChange={(v) => { setCreateForm({ ...createForm, stage: v }); loadStageTemplate(v); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={ar ? "اختر مرحلة" : "Select stage"} />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{ar ? s.ar : s.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{ar ? "العنوان" : "Title"}</Label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder={ar ? "عنوان الزيارة" : "Visit title"}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{ar ? "التاريخ *" : "Date *"}</Label>
                <Input
                  type="date"
                  value={createForm.visitDate}
                  onChange={(e) => setCreateForm({ ...createForm, visitDate: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{ar ? "الطقس" : "Weather"}</Label>
                <Select value={createForm.weather} onValueChange={(v) => setCreateForm({ ...createForm, weather: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">{ar ? "مشمس" : "Sunny"}</SelectItem>
                    <SelectItem value="cloudy">{ar ? "غائم" : "Cloudy"}</SelectItem>
                    <SelectItem value="rainy">{ar ? "ممطر" : "Rainy"}</SelectItem>
                    <SelectItem value="hot">{ar ? "حار" : "Hot"}</SelectItem>
                    <SelectItem value="windy">{ar ? "عاصف" : "Windy"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{ar ? "درجة الحرارة" : "Temperature"}</Label>
                <Input
                  value={createForm.temperature}
                  onChange={(e) => setCreateForm({ ...createForm, temperature: e.target.value })}
                  placeholder="°C"
                  className="h-9 text-sm"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{ar ? "عدد العمال" : "Workers"}</Label>
                <Input
                  type="number"
                  min={0}
                  value={createForm.workerCount}
                  onChange={(e) => setCreateForm({ ...createForm, workerCount: e.target.value })}
                  placeholder="0"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{ar ? "اسم المقاول" : "Contractor Name"}</Label>
              <Input
                value={createForm.contractorName}
                onChange={(e) => setCreateForm({ ...createForm, contractorName: e.target.value })}
                placeholder={ar ? "اسم المقاول" : "Contractor name"}
                className="h-9 text-sm"
              />
            </div>

            {/* Progress Sliders */}
            <Separator />
            <div className="space-y-3">
              <Label className="text-xs font-semibold">{ar ? "نسب الإنجاز" : "Progress"}</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "concreteProgress", ar: "الخرسانة", en: "Concrete" },
                  { key: "masonryProgress", ar: "البناء", en: "Masonry" },
                  { key: "electricalProgress", ar: "الكهرباء", en: "Electrical" },
                  { key: "plumbingProgress", ar: "السباكة", en: "Plumbing" },
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">{ar ? item.ar : item.en}</span>
                      <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400">{createForm[item.key as keyof typeof createForm] as number}%</span>
                    </div>
                    <Slider
                      value={[createForm[item.key as keyof typeof createForm] as number]}
                      onValueChange={([v]) => setCreateForm({ ...createForm, [item.key]: v })}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist Items */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{ar ? "بنود المراجعة" : "Checklist Items"} ({createItems.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => setCreateItems([...createItems, { category: "", description: "", specification: "", isChecked: false, compliant: true, notes: "" }])}
                >
                  <Plus className="h-3 w-3 me-1" />{ar ? "إضافة بند" : "Add Item"}
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {createItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={item.isChecked}
                        onCheckedChange={(c) => {
                          const updated = [...createItems];
                          updated[idx] = { ...updated[idx], isChecked: !!c };
                          setCreateItems(updated);
                        }}
                        className="h-4 w-4"
                      />
                      <Input
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...createItems];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setCreateItems(updated);
                        }}
                        placeholder={ar ? "وصف البند" : "Item description"}
                        className="h-8 text-xs flex-1"
                      />
                      <Select
                        value={item.category}
                        onValueChange={(v) => {
                          const updated = [...createItems];
                          updated[idx] = { ...updated[idx], category: v };
                          setCreateItems(updated);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[100px] text-xs">
                          <SelectValue placeholder={ar ? "الفئة" : "Category"} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set(createItems.map(i => i.category).filter(Boolean))).map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                          <SelectItem value="السلامة">{ar ? "السلامة" : "Safety"}</SelectItem>
                          <SelectItem value="الجودة">{ar ? "الجودة" : "Quality"}</SelectItem>
                          <SelectItem value="المواصفات">{ar ? "المواصفات" : "Specs"}</SelectItem>
                          <SelectItem value="أخرى">{ar ? "أخرى" : "Other"}</SelectItem>
                        </SelectContent>
                      </Select>
                      {item.isChecked && (
                        <Select
                          value={item.compliant ? "yes" : "no"}
                          onValueChange={(v) => {
                            const updated = [...createItems];
                            updated[idx] = { ...updated[idx], compliant: v === "yes" };
                            setCreateItems(updated);
                          }}
                        >
                          <SelectTrigger className={cn("h-8 w-[80px] text-xs border-0", item.compliant ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">{ar ? "مطابق" : "OK"}</SelectItem>
                            <SelectItem value="no">{ar ? "غير مطابق" : "Non-Compliant"}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <button className="p-1 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setCreateItems(createItems.filter((_, i) => i !== idx))}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Violations */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{ar ? "المخالفات" : "Violations"} ({createViolations.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => setCreateViolations([...createViolations, { type: "safety", severity: "low", description: "", contractorName: "", deadline: "" }])}
                >
                  <Plus className="h-3 w-3 me-1" />{ar ? "إضافة مخالفة" : "Add Violation"}
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {createViolations.map((v, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <Textarea
                        value={v.description}
                        onChange={(e) => {
                          const updated = [...createViolations];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setCreateViolations(updated);
                        }}
                        placeholder={ar ? "وصف المخالفة" : "Violation description"}
                        className="min-h-[36px] text-xs flex-1 resize-none"
                        rows={1}
                      />
                      <Select
                        value={v.severity}
                        onValueChange={(s) => {
                          const updated = [...createViolations];
                          updated[idx] = { ...updated[idx], severity: s };
                          setCreateViolations(updated);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[80px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{ar ? "منخفض" : "Low"}</SelectItem>
                          <SelectItem value="medium">{ar ? "متوسط" : "Medium"}</SelectItem>
                          <SelectItem value="high">{ar ? "مرتفع" : "High"}</SelectItem>
                          <SelectItem value="critical">{ar ? "حرج" : "Critical"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <button className="p-1 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setCreateViolations(createViolations.filter((_, i) => i !== idx))}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <Separator />
            <div className="space-y-1.5">
              <Label className="text-xs">{ar ? "ملاحظات عامة" : "General Notes"}</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder={ar ? "ملاحظات إضافية" : "Additional notes"}
                className="text-sm"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetCreateForm(); }}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => {
                const totalProgress = [
                  createForm.concreteProgress,
                  createForm.masonryProgress,
                  createForm.electricalProgress,
                  createForm.plumbingProgress,
                ].reduce((a, b) => a + b, 0) / 4;
                createMutation.mutate({
                  ...createForm,
                  progressOverall: totalProgress,
                  items: createItems,
                  violations: createViolations.map(v => ({ ...v, contractorName: v.contractorName || createForm.contractorName })),
                });
              }}
              disabled={!createForm.projectId || !createForm.visitDate || createMutation.isPending}
            >
              {createMutation.isPending ? (ar ? "جارٍ الإنشاء..." : "Creating...") : (ar ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== VIEW CHECKLIST DIALOG ===== */}
      <Dialog open={!!viewChecklist} onOpenChange={(open) => { if (!open) setViewChecklist(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewChecklist && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewChecklist.title || (ar ? "قائمة مراجعة" : "Checklist")}
                  {getStatusBadge(viewChecklist.status, ar)}
                </DialogTitle>
                <DialogDescription>
                  {viewChecklist.project ? (ar ? viewChecklist.project.name : viewChecklist.project.nameEn || viewChecklist.project.name) : ""} - {new Date(viewChecklist.visitDate).toLocaleDateString(ar ? "ar-AE" : "en-US")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <InfoPill icon={<Sun className="h-3.5 w-3.5" />} label={ar ? "الطقس" : "Weather"} value={viewChecklist.weather || "-"} />
                  <InfoPill icon={<Thermometer className="h-3.5 w-3.5" />} label={ar ? "الحرارة" : "Temp"} value={viewChecklist.temperature ? `${viewChecklist.temperature}°C` : "-"} />
                  <InfoPill icon={<Users className="h-3.5 w-3.5" />} label={ar ? "العمال" : "Workers"} value={viewChecklist.workerCount > 0 ? String(viewChecklist.workerCount) : "-"} />
                  <InfoPill icon={<HardHat className="h-3.5 w-3.5" />} label={ar ? "المقاول" : "Contractor"} value={viewChecklist.contractorName || "-"} />
                </div>

                {/* Overall Progress */}
                <Card className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-100 dark:border-teal-900/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{ar ? "نسبة الإنجاز الكلية" : "Overall Progress"}</span>
                    <span className="text-lg font-bold text-teal-700 dark:text-teal-300">{Math.round(viewChecklist.progressOverall)}%</span>
                  </div>
                  <Progress value={viewChecklist.progressOverall} className="h-2 bg-teal-100 dark:bg-teal-900/30" />
                </Card>

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    {ar ? "بنود المراجعة" : "Checklist Items"} ({viewChecklist.items.length})
                  </h4>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {viewChecklist.items.map((item) => (
                      <div key={item.id} className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border",
                        item.isChecked && item.compliant ? "border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-950/10" :
                        item.isChecked && !item.compliant ? "border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-950/10" :
                        "border-slate-200 dark:border-slate-700/50"
                      )}>
                        <div className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center shrink-0",
                          item.isChecked ? (item.compliant ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "border border-slate-300 dark:border-slate-600"
                        )}>
                          {item.isChecked && (item.compliant ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-1">{item.description}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{item.specification}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] h-5 shrink-0">{item.category}</Badge>
                      </div>
                    ))}
                    {viewChecklist.items.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">{ar ? "لا توجد بنود" : "No items"}</p>
                    )}
                  </div>
                </div>

                {/* Violations in this checklist */}
                {viewChecklist.violations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" />
                      {ar ? "المخالفات" : "Violations"} ({viewChecklist.violations.length})
                    </h4>
                    <div className="space-y-1.5">
                      {viewChecklist.violations.map((v) => (
                        <div key={v.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-red-200 dark:border-red-800/30 bg-red-50/30 dark:bg-red-950/10">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{v.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getSeverityBadge(v.severity, ar)}
                              {getViolationStatusBadge(v.status, ar)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewChecklist.notes && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">{ar ? "ملاحظات" : "Notes"}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{viewChecklist.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                {viewChecklist.status === "draft" && (
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { updateChecklistMutation.mutate({ id: viewChecklist.id, data: { status: "submitted" } }); setViewChecklist(null); }}>
                    {ar ? "تقديم" : "Submit"}
                  </Button>
                )}
                {viewChecklist.status === "submitted" && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { updateChecklistMutation.mutate({ id: viewChecklist.id, data: { status: "approved" } }); setViewChecklist(null); }}>
                    <ShieldCheck className="h-4 w-4 me-1" />{ar ? "اعتماد" : "Approve"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Sub Components =====
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">{label}</p>
        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-none mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
