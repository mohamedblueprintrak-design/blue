"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastFeedback } from "@/hooks/use-toast-feedback";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  PenTool,
  Plus,
  Filter,
  Trash2,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Upload,
  Layers,
  History,
  ClipboardCheck,
  GitCompareArrows,
  Sparkles,
  BarChart3,
} from "lucide-react";

// ===== Types =====
interface DesignPhaseItem {
  id: string;
  projectId: string;
  phase: string;
  phaseNameAr: string;
  phaseNameEn: string;
  status: string;
  designerId: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  revisionCount: number;
  notes: string;
  clientApproval: boolean;
  createdAt: string;
  drawings: { id: string; status: string; clashDetected: boolean }[];
  project: { id: string; name: string; nameEn: string; number: string } | null;
}

interface DesignDrawingItem {
  id: string;
  designPhaseId: string;
  title: string;
  drawingNumber: string;
  discipline: string;
  version: number;
  filePath: string;
  fileSize: number;
  status: string;
  reviewedBy: string | null;
  reviewNotes: string;
  reviewedAt: string | null;
  clashDetected: boolean;
  clashNotes: string;
  uploadedById: string | null;
  createdAt: string;
  designPhase: { id: string; phase: string; phaseNameAr: string; phaseNameEn: string };
  revisions: DesignRevisionItem[];
}

interface DesignRevisionItem {
  id: string;
  drawingId: string;
  version: number;
  filePath: string;
  changeNotes: string;
  uploadedById: string | null;
  createdAt: string;
}

interface ProjectOption { id: string; name: string; nameEn: string; number: string; }

// ===== Phase Config =====
const PHASE_ORDER = ["concept", "schematic", "development", "construction_docs", "as_built"];

const PHASE_CONFIG: Record<string, { labelAr: string; labelEn: string; icon: string }> = {
  concept: { labelAr: "مفهوم", labelEn: "Concept", icon: "💡" },
  schematic: { labelAr: "تصميم أولي", labelEn: "Schematic", icon: "📐" },
  development: { labelAr: "تطوير التصميم", labelEn: "Development", icon: "🏗️" },
  construction_docs: { labelAr: "مستندات التنفيذ", labelEn: "Construction Docs", icon: "📋" },
  as_built: { labelAr: "كما بُني", labelEn: "As-Built", icon: "✅" },
};

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; color: string; dotColor: string }> = {
  not_started: { labelAr: "لم يبدأ", labelEn: "Not Started", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dotColor: "bg-slate-400" },
  in_progress: { labelAr: "قيد التنفيذ", labelEn: "In Progress", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300", dotColor: "bg-amber-500" },
  under_review: { labelAr: "قيد المراجعة", labelEn: "Under Review", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300", dotColor: "bg-blue-500" },
  approved: { labelAr: "معتمد", labelEn: "Approved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300", dotColor: "bg-emerald-500" },
  revision: { labelAr: "تعديل مطلوب", labelEn: "Revision", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", dotColor: "bg-red-500" },
};

const DRAWING_STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; color: string }> = {
  draft: { labelAr: "مسودة", labelEn: "Draft", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  under_review: { labelAr: "قيد المراجعة", labelEn: "Under Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  approved: { labelAr: "معتمد", labelEn: "Approved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  rejected: { labelAr: "مرفوض", labelEn: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  superseded: { labelAr: "مُستبدل", labelEn: "Superseded", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500" },
};

const DISCIPLINE_CONFIG: Record<string, { labelAr: string; labelEn: string }> = {
  architectural: { labelAr: "معماري", labelEn: "Architectural" },
  structural: { labelAr: "إنشائي", labelEn: "Structural" },
  electrical: { labelAr: "كهربائي", labelEn: "Electrical" },
  plumbing: { labelAr: "سباكة", labelEn: "Plumbing" },
  hvac: { labelAr: "تكييف", labelEn: "HVAC" },
  fire: { labelAr: "حريق", labelEn: "Fire Protection" },
};

const REVIEW_CHECKLIST = [
  { id: "dimensions", labelAr: "الأبعاد صحيحة", labelEn: "Dimensions are correct" },
  { id: "setbacks", labelAr: "الارتدادات مطابقة", labelEn: "Setbacks are compliant" },
  { id: "floors", labelAr: "عدد الأدوار مطابق", labelEn: "Floor count matches" },
  { id: "areas", labelAr: "المساحات صحيحة", labelEn: "Areas are correct" },
  { id: "civil_defense", labelAr: "اشتراطات الدفاع المدني", labelEn: "Civil defense requirements" },
  { id: "building_code", labelAr: "كود البناء", labelEn: "Building code compliance" },
];

// ===== Helpers =====
function formatDate(dateStr: string | null, ar: boolean): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(ar ? "ar-AE" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ===== Main Component =====
interface DesignManagementProps { language: "ar" | "en"; }

export default function DesignManagement({ language }: DesignManagementProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar });

  const [filterProject, setFilterProject] = useState<string>("all");
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [showAddPhaseDialog, setShowAddPhaseDialog] = useState(false);
  const [showAddDrawingDialog, setShowAddDrawingDialog] = useState(false);
  const [showDrawingDetail, setShowDrawingDetail] = useState<DesignDrawingItem | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState<DesignDrawingItem | null>(null);
  const [reviewChecklist, setReviewChecklist] = useState<Record<string, boolean>>({});
  const [reviewNotesText, setReviewNotesText] = useState("");
  const [clashFlag, setClashFlag] = useState(false);
  const [clashNotesText, setClashNotesText] = useState("");

  // Queries
  const { data: phases = [], isLoading: phasesLoading } = useQuery<DesignPhaseItem[]>({
    queryKey: ["design-phases", filterProject],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterProject !== "all") params.set("projectId", filterProject);
      const res = await fetch(`/api/design-phases?${params}`);
      if (!res.ok) throw new Error("Failed to fetch design phases");
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

  const { data: drawings = [], isLoading: drawingsLoading } = useQuery<DesignDrawingItem[]>({
    queryKey: ["design-drawings", selectedPhaseId],
    queryFn: async () => {
      if (!selectedPhaseId) return [];
      const res = await fetch(`/api/design-drawings?designPhaseId=${selectedPhaseId}`);
      if (!res.ok) throw new Error("Failed to fetch drawings");
      return res.json();
    },
    enabled: !!selectedPhaseId,
  });

  // Mutations
  const createPhaseMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/design-phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-phases"] });
      setShowAddPhaseDialog(false);
      toast.created(ar ? "المرحلة" : "Phase");
    },
    onError: () => toast.error(ar ? "إنشاء المرحلة" : "Create phase"),
  });

  const updatePhaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/design-phases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-phases"] });
      toast.updated(ar ? "المرحلة" : "Phase");
    },
    onError: () => toast.error(ar ? "تحديث المرحلة" : "Update phase"),
  });

  const deletePhaseMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/design-phases/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-phases"] });
      if (selectedPhaseId) setSelectedPhaseId(null);
      toast.deleted(ar ? "المرحلة" : "Phase");
    },
    onError: () => toast.error(ar ? "حذف المرحلة" : "Delete phase"),
  });

  const createDrawingMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/design-drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-drawings"] });
      queryClient.invalidateQueries({ queryKey: ["design-phases"] });
      setShowAddDrawingDialog(false);
      toast.created(ar ? "الرسم" : "Drawing");
    },
    onError: () => toast.error(ar ? "إنشاء الرسم" : "Create drawing"),
  });

  const updateDrawingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/design-drawings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-drawings"] });
      queryClient.invalidateQueries({ queryKey: ["design-phases"] });
      toast.updated(ar ? "الرسم" : "Drawing");
    },
    onError: () => toast.error(ar ? "تحديث الرسم" : "Update drawing"),
  });

  const deleteDrawingMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/design-drawings/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-drawings"] });
      queryClient.invalidateQueries({ queryKey: ["design-phases"] });
      setShowDrawingDetail(null);
      toast.deleted(ar ? "الرسم" : "Drawing");
    },
    onError: () => toast.error(ar ? "حذف الرسم" : "Delete drawing"),
  });

  // Review dialog open handler
  const openReviewDialog = (drawing: DesignDrawingItem) => {
    setShowReviewDialog(drawing);
    setReviewChecklist({});
    setReviewNotesText("");
    setClashFlag(drawing.clashDetected);
    setClashNotesText(drawing.clashNotes);
  };

  const submitReview = () => {
    if (!showReviewDialog) return;
    const allChecked = Object.values(reviewChecklist).every(Boolean);
    const newStatus = allChecked ? "approved" : "rejected";

    updateDrawingMutation.mutate({
      id: showReviewDialog.id,
      data: {
        status: newStatus,
        reviewNotes: reviewNotesText,
        reviewedAt: new Date().toISOString(),
        clashDetected: clashFlag,
        clashNotes: clashNotesText,
        ...(allChecked ? { version: showReviewDialog.version + 1 } : {}),
      },
    });
    setShowReviewDialog(null);
  };

  // Statistics
  const allDrawings = phases.flatMap((p) => p.drawings || []);
  const totalDrawings = drawings.length;
  const reviewedCount = drawings.filter((d) => d.status === "approved").length;
  const needsRevisionCount = drawings.filter((d) => d.status === "rejected").length;
  const clashCount = drawings.filter((d) => d.clashDetected).length;

  // Add drawing form state
  const [newDrawing, setNewDrawing] = useState({
    title: "",
    drawingNumber: "",
    discipline: "",
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <PenTool className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {ar ? "إدارة التصاميم" : "Design Management"}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {phases.length} {ar ? "مرحلة تصميمية" : "design phases"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[180px] h-8 text-xs rounded-lg">
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
          <Button
            size="sm"
            className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20"
            onClick={() => setShowAddPhaseDialog(true)}
          >
            <Plus className="h-3.5 w-3.5 me-1" />
            {ar ? "مرحلة جديدة" : "New Phase"}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Layers className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ar ? "إجمالي الرسومات" : "Total Drawings"}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{totalDrawings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ar ? "تمت المراجعة" : "Reviewed"}</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{reviewedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ar ? "محتاجة تعديل" : "Needs Revision"}</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{needsRevisionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <GitCompareArrows className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ar ? "تعارضات" : "Clashes"}</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">{clashCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Pipeline Visualization */}
      <Card className="border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {ar ? "خط أنابيب مراحل التصميم" : "Design Phase Pipeline"}
            </h3>
          </div>

          {phasesLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
              {ar ? "جارٍ التحميل..." : "Loading..."}
            </div>
          ) : (
            <div className="relative">
              {/* Horizontal scroll for phases */}
              <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
                {PHASE_ORDER.map((phaseKey, idx) => {
                  const phase = phases.find((p) => p.phase === phaseKey);
                  const config = PHASE_CONFIG[phaseKey];
                  const isSelected = selectedPhaseId === phase?.id;
                  const status = phase ? (STATUS_CONFIG[phase.status] || STATUS_CONFIG.not_started) : STATUS_CONFIG.not_started;
                  const drawingCount = phase?.drawings?.length || 0;

                  return (
                    <div key={phaseKey} className="flex items-center gap-2 min-w-0 flex-shrink-0">
                      {idx > 0 && (
                        <div className="flex items-center text-slate-300 dark:text-slate-600 mx-1">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      )}
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => phase && setSelectedPhaseId(isSelected ? null : phase.id)}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all min-w-[130px] hover:shadow-md cursor-pointer",
                                isSelected
                                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-lg shadow-teal-500/10"
                                  : phase
                                    ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-300"
                                    : "border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
                              )}
                            >
                              <span className="text-xl">{config.icon}</span>
                              <span className={cn(
                                "text-xs font-semibold text-center leading-tight",
                                phase ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                              )}>
                                {ar ? config.labelAr : config.labelEn}
                              </span>
                              {phase && (
                                <>
                                  <span className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                                    status.color
                                  )}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full", status.dotColor)} />
                                    {ar ? status.labelAr : status.labelEn}
                                  </span>
                                  {drawingCount > 0 && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                                      {drawingCount} {ar ? "رسم" : "drw"}
                                    </span>
                                  )}
                                  {phase.revisionCount > 0 && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium tabular-nums">
                                      {phase.revisionCount}x {ar ? "تعديل" : "rev"}
                                    </span>
                                  )}
                                </>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="text-xs font-medium">
                              {ar ? config.labelAr : config.labelEn}
                              {phase && ` — ${ar ? status.labelAr : status.labelEn}`}
                            </p>
                            {phase?.dueDate && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {ar ? "الاستحقاق" : "Due"}: {formatDate(phase.dueDate, ar)}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawings Table (when phase is selected) */}
      {selectedPhaseId && (
        <Card className="border-slate-200 dark:border-slate-700/50 overflow-hidden">
          <CardContent className="p-0">
            {/* Drawings header */}
            <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {ar ? "رسومات المرحلة" : "Phase Drawings"}
                </h3>
                <Badge variant="secondary" className="text-[10px] tabular-nums">
                  {drawings.length}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/30"
                onClick={() => setShowAddDrawingDialog(true)}
              >
                <Upload className="h-3 w-3 me-1" />
                {ar ? "رفع رسم" : "Upload Drawing"}
              </Button>
            </div>

            {drawingsLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                {ar ? "جارٍ التحميل..." : "Loading..."}
              </div>
            ) : drawings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Layers className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {ar ? "لا توجد رسومات" : "No drawings"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ar ? "ابدأ برفع أول رسم لهذه المرحلة" : "Upload the first drawing for this phase"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                      <TableHead className="text-xs font-semibold">{ar ? "رقم الرسم" : "Drawing #"}</TableHead>
                      <TableHead className="text-xs font-semibold">{ar ? "العنوان" : "Title"}</TableHead>
                      <TableHead className="text-xs font-semibold">{ar ? "التخصص" : "Discipline"}</TableHead>
                      <TableHead className="text-xs font-semibold text-center">{ar ? "الإصدار" : "Version"}</TableHead>
                      <TableHead className="text-xs font-semibold">{ar ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-xs font-semibold">{ar ? "التعارض" : "Clash"}</TableHead>
                      <TableHead className="text-xs font-semibold">{ar ? "المراجعة" : "Review"}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drawings.map((drawing) => {
                      const stCfg = DRAWING_STATUS_CONFIG[drawing.status] || DRAWING_STATUS_CONFIG.draft;
                      const discCfg = DISCIPLINE_CONFIG[drawing.discipline] || { labelAr: drawing.discipline, labelEn: drawing.discipline };
                      return (
                        <TableRow
                          key={drawing.id}
                          className={cn(
                            "group even:bg-slate-50/50 dark:even:bg-slate-800/20 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            drawing.clashDetected && "border-s-red-300 border-s-4 dark:border-s-red-700",
                          )}
                        >
                          <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                            {drawing.drawingNumber || "-"}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => setShowDrawingDetail(drawing)}
                              className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline text-start"
                            >
                              {drawing.title}
                            </button>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                            {ar ? discCfg.labelAr : discCfg.labelEn}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center min-w-[28px] h-6 rounded-md px-1.5 font-mono tabular-nums",
                              drawing.version >= 3
                                ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 font-bold"
                                : drawing.version >= 2
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 font-semibold"
                                  : "text-slate-600 dark:text-slate-400"
                            )}>
                              V{drawing.version}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", stCfg.color)}>
                              {ar ? stCfg.labelAr : stCfg.labelEn}
                            </span>
                          </TableCell>
                          <TableCell>
                            {drawing.clashDetected ? (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 gap-0.5">
                                      <AlertTriangle className="h-2.5 w-2.5" />
                                      {ar ? "تعارض" : "Clash"}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-[10px] max-w-[200px]">{drawing.clashNotes || (ar ? "يوجد تعارض" : "Clash detected")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 dark:text-slate-400 max-w-[100px] truncate">
                            {drawing.reviewedBy || "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={ar ? "start" : "end"} className="w-40">
                                <DropdownMenuItem onClick={() => setShowDrawingDetail(drawing)}>
                                  <Eye className="h-3.5 w-3.5 me-2" />
                                  {ar ? "التفاصيل" : "Details"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openReviewDialog(drawing)}>
                                  <ClipboardCheck className="h-3.5 w-3.5 me-2" />
                                  {ar ? "مراجعة" : "Review"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => {
                                    if (confirm(ar ? "هل أنت متأكد من الحذف؟" : "Delete this drawing?")) {
                                      deleteDrawingMutation.mutate(drawing.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 me-2" />
                                  {ar ? "حذف" : "Delete"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
      )}

      {/* ===== Add Phase Dialog ===== */}
      <Dialog open={showAddPhaseDialog} onOpenChange={setShowAddPhaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ar ? "إضافة مرحلة تصميمية" : "Add Design Phase"}</DialogTitle>
            <DialogDescription>
              {ar ? "اختر المرحلة والمشروع" : "Select phase and project"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">{ar ? "المشروع" : "Project"} *</Label>
              <Select
                value={filterProject !== "all" ? filterProject : ""}
                onValueChange={(v) => setFilterProject(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={ar ? "اختر مشروع" : "Select project"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {ar ? p.name : p.nameEn || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{ar ? "المرحلة" : "Phase"} *</Label>
              <Select
                value=""
                onValueChange={(v) => {
                  const existing = phases.find((p) => p.phase === v);
                  if (existing) {
                    toast.error(ar ? "هذه المرحلة موجودة بالفعل" : "Phase already exists");
                    return;
                  }
                  const config = PHASE_CONFIG[v];
                  createPhaseMutation.mutate({
                    projectId: filterProject !== "all" ? filterProject : projects[0]?.id,
                    phase: v,
                    phaseNameAr: config?.labelAr || "",
                    phaseNameEn: config?.labelEn || "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={ar ? "اختر المرحلة" : "Select phase"} />
                </SelectTrigger>
                <SelectContent>
                  {PHASE_ORDER.filter((pk) => !phases.some((p) => p.phase === pk)).map((pk) => {
                    const cfg = PHASE_CONFIG[pk];
                    return (
                      <SelectItem key={pk} value={pk}>
                        <span className="flex items-center gap-2">
                          <span>{cfg.icon}</span>
                          {ar ? cfg.labelAr : cfg.labelEn}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPhaseDialog(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Add Drawing Dialog ===== */}
      <Dialog open={showAddDrawingDialog} onOpenChange={setShowAddDrawingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ar ? "رفع رسم جديد" : "Upload New Drawing"}</DialogTitle>
            <DialogDescription>
              {ar ? "أدخل بيانات الرسم الجديد" : "Enter new drawing details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">{ar ? "العنوان" : "Title"} *</Label>
              <Input
                value={newDrawing.title}
                onChange={(e) => setNewDrawing({ ...newDrawing, title: e.target.value })}
                placeholder={ar ? "مثال: مخطط الطابق الأرضي" : "e.g., Ground Floor Plan"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "رقم الرسم" : "Drawing #"}</Label>
                <Input
                  value={newDrawing.drawingNumber}
                  onChange={(e) => setNewDrawing({ ...newDrawing, drawingNumber: e.target.value })}
                  placeholder={ar ? "A-001" : "A-001"}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "التخصص" : "Discipline"}</Label>
                <Select
                  value={newDrawing.discipline}
                  onValueChange={(v) => setNewDrawing({ ...newDrawing, discipline: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ar ? "اختر" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISCIPLINE_CONFIG).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {ar ? val.labelAr : val.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDrawingDialog(false); setNewDrawing({ title: "", drawingNumber: "", discipline: "" }); }}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={!newDrawing.title || !selectedPhaseId || createDrawingMutation.isPending}
              onClick={() => {
                createDrawingMutation.mutate({
                  designPhaseId: selectedPhaseId,
                  title: newDrawing.title,
                  drawingNumber: newDrawing.drawingNumber,
                  discipline: newDrawing.discipline,
                });
                setNewDrawing({ title: "", drawingNumber: "", discipline: "" });
              }}
            >
              {createDrawingMutation.isPending
                ? (ar ? "جارٍ الإنشاء..." : "Creating...")
                : (ar ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Drawing Detail Dialog ===== */}
      <Dialog open={!!showDrawingDetail} onOpenChange={() => setShowDrawingDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {showDrawingDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  {showDrawingDetail.title}
                </DialogTitle>
                <DialogDescription>
                  {showDrawingDetail.drawingNumber && (
                    <span className="font-mono" dir="ltr">{showDrawingDetail.drawingNumber}</span>
                  )}
                  {" — "}
                  {ar
                    ? DISCIPLINE_CONFIG[showDrawingDetail.discipline]?.labelAr || showDrawingDetail.discipline
                    : DISCIPLINE_CONFIG[showDrawingDetail.discipline]?.labelEn || showDrawingDetail.discipline
                  }
                </DialogDescription>
              </DialogHeader>

              {/* Drawing Preview Placeholder */}
              <div className="w-full h-48 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2">
                <Eye className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {ar ? "معاينة الرسم" : "Drawing Preview"}
                </span>
                <span className="text-[10px] text-slate-300 dark:text-slate-600">
                  {showDrawingDetail.filePath
                    ? (ar ? "ملف: " : "File: ") + showDrawingDetail.filePath
                    : (ar ? "لم يتم رفع ملف بعد" : "No file uploaded yet")
                  }
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{ar ? "الحالة" : "Status"}</p>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", DRAWING_STATUS_CONFIG[showDrawingDetail.status]?.color)}>
                    {ar ? DRAWING_STATUS_CONFIG[showDrawingDetail.status]?.labelAr : DRAWING_STATUS_CONFIG[showDrawingDetail.status]?.labelEn}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{ar ? "الإصدار" : "Version"}</p>
                  <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">V{showDrawingDetail.version}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{ar ? "التعارض" : "Clash"}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", showDrawingDetail.clashDetected ? "bg-red-500" : "bg-emerald-500")} />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      {showDrawingDetail.clashDetected ? (ar ? "يوجد تعارض" : "Detected") : (ar ? "لا يوجد" : "None")}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{ar ? "المراجع" : "Reviewer"}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{showDrawingDetail.reviewedBy || "-"}</p>
                </div>
              </div>

              {/* Version History */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-4 w-4 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {ar ? "سجل الإصدارات" : "Version History"}
                  </h4>
                </div>
                {showDrawingDetail.revisions.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p className="text-xs text-slate-400">{ar ? "لا توجد مراجعات سابقة" : "No previous revisions"}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {showDrawingDetail.revisions.map((rev) => (
                      <div key={rev.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
                        <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">V{rev.version}</span>
                        <span className="text-slate-600 dark:text-slate-400 flex-1 truncate">{rev.changeNotes || "-"}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums">{formatDate(rev.createdAt, ar)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Notes */}
              {showDrawingDetail.reviewNotes && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-slate-500" />
                    {ar ? "ملاحظات المراجعة" : "Review Notes"}
                  </h4>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{showDrawingDetail.reviewNotes}</p>
                  </div>
                </div>
              )}

              {/* Clash Notes */}
              {showDrawingDetail.clashDetected && showDrawingDetail.clashNotes && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    {ar ? "تفاصيل التعارض" : "Clash Details"}
                  </h4>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                    <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">{showDrawingDetail.clashNotes}</p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => openReviewDialog(showDrawingDetail)}>
                  <ClipboardCheck className="h-3.5 w-3.5 me-1" />
                  {ar ? "مراجعة" : "Review"}
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    if (confirm(ar ? "هل أنت متأكد من الحذف؟" : "Delete this drawing?")) {
                      deleteDrawingMutation.mutate(showDrawingDetail.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 me-1" />
                  {ar ? "حذف" : "Delete"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Review Dialog ===== */}
      <Dialog open={!!showReviewDialog} onOpenChange={() => setShowReviewDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {showReviewDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  {ar ? "مراجعة الرسم" : "Review Drawing"}
                </DialogTitle>
                <DialogDescription>
                  {showReviewDialog.title}
                  <span className="font-mono ms-2 text-xs" dir="ltr">V{showReviewDialog.version}</span>
                </DialogDescription>
              </DialogHeader>

              {/* Review Checklist */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {ar ? "قائمة فحص المراجعة" : "Review Checklist"}
                </h4>
                <div className="space-y-2">
                  {REVIEW_CHECKLIST.map((item) => (
                    <label
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer",
                        reviewChecklist[item.id]
                          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/10"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <Checkbox
                        checked={reviewChecklist[item.id] || false}
                        onCheckedChange={(checked) =>
                          setReviewChecklist((prev) => ({ ...prev, [item.id]: !!checked }))
                        }
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {ar ? item.labelAr : item.labelEn}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Clash Detection */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <GitCompareArrows className="h-4 w-4 text-red-500" />
                  {ar ? "كشف التعارضات" : "Clash Detection"}
                </h4>
                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer mb-3">
                  <Checkbox
                    checked={clashFlag}
                    onCheckedChange={(checked) => setClashFlag(!!checked)}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {ar ? "يوجد تعارض" : "Clash detected"}
                  </span>
                </label>
                {clashFlag && (
                  <Textarea
                    value={clashNotesText}
                    onChange={(e) => setClashNotesText(e.target.value)}
                    placeholder={ar ? "صف التعارض المكتشف..." : "Describe the detected clash..."}
                    className="min-h-[60px] text-sm"
                  />
                )}
              </div>

              <Separator />

              {/* Review Notes */}
              <div>
                <Label className="text-sm mb-2 block">{ar ? "ملاحظات المراجعة" : "Review Notes"}</Label>
                <Textarea
                  value={reviewNotesText}
                  onChange={(e) => setReviewNotesText(e.target.value)}
                  placeholder={ar ? "أضف ملاحظاتك هنا..." : "Add your review notes..."}
                  className="min-h-[80px] text-sm"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowReviewDialog(null)}>
                  {ar ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => {
                    updateDrawingMutation.mutate({
                      id: showReviewDialog.id,
                      data: {
                        status: "rejected",
                        reviewNotes: reviewNotesText,
                        reviewedAt: new Date().toISOString(),
                        clashDetected: clashFlag,
                        clashNotes: clashNotesText,
                      },
                    });
                    setShowReviewDialog(null);
                  }}
                  disabled={updateDrawingMutation.isPending}
                >
                  <XCircle className="h-3.5 w-3.5 me-1" />
                  {ar ? "رفض" : "Reject"}
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={submitReview}
                  disabled={updateDrawingMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                  {ar ? "اعتماد" : "Approve"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
