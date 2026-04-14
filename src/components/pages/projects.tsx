"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, getErrorMessage, type ProjectFormData } from "@/lib/validations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastFeedback } from "@/hooks/use-toast-feedback";
import { useAuthStore } from "@/store/auth-store";
import { useNavStore } from "@/store/nav-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

// Dynamic import for MapPicker to avoid SSR crash (react-leaflet requires window)
const MapPicker = dynamic(() => import("@/components/ui/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-sm" style={{ height: "300px" }}>
      جارٍ تحميل الخريطة...
    </div>
  ),
});
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Download,
  GitCompareArrows,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Wallet,
  Calendar,
  Tag,
  Eye,
  X,
  CheckCircle2,
  CheckSquare,
  Clock,
  MessageSquare,
  ArrowUpRight,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  HardHat,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { exportToCSV } from "@/lib/export-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// ===== TYPES =====
interface ClientBrief {
  id: string;
  name: string;
  company: string;
}

interface ProjectRow {
  id: string;
  number: string;
  name: string;
  nameEn: string;
  location: string;
  plotNumber: string;
  type: string;
  status: string;
  progress: number;
  budget: number;
  client: ClientBrief;
  contractor: { id: string; name: string; companyName: string; category: string } | null;
  createdAt: string;
  _count: { tasks: number; stages: number; invoices: number };
}

// ===== STATUS CONFIGS =====
const statusConfig: Record<string, { ar: string; en: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string; dotColor: string }> = {
  active: { ar: "نشط", en: "Active", variant: "default", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200", dotColor: "bg-emerald-500" },
  completed: { ar: "مكتمل", en: "Completed", variant: "default", className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200", dotColor: "bg-teal-500" },
  delayed: { ar: "متأخر", en: "Delayed", variant: "destructive", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200", dotColor: "bg-red-500" },
  on_hold: { ar: "معلق", en: "On Hold", variant: "secondary", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200", dotColor: "bg-amber-500" },
  cancelled: { ar: "ملغى", en: "Cancelled", variant: "destructive", className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200", dotColor: "bg-slate-400" },
  design: { ar: "تصميم", en: "Design", variant: "default", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200", dotColor: "bg-violet-500" },
  submission: { ar: "تقديم", en: "Submission", variant: "default", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200", dotColor: "bg-sky-500" },
  approval: { ar: "اعتماد", en: "Approval", variant: "default", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200", dotColor: "bg-amber-500" },
  construction: { ar: "تنفيذ", en: "Construction", variant: "default", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200", dotColor: "bg-orange-500" },
};

const typeConfig: Record<string, { ar: string; en: string; color: string }> = {
  villa: { ar: "فيلا", en: "Villa", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  building: { ar: "مبنى", en: "Building", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  commercial: { ar: "تجاري", en: "Commercial", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  industrial: { ar: "صناعي", en: "Industrial", color: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" },
};

// ===== MAIN COMPONENT =====
interface ProjectsListProps {
  language: "ar" | "en";
}

export default function ProjectsList({ language }: ProjectsListProps) {
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { user } = useAuthStore();
  const { setCurrentProjectId, setCurrentPage, setCurrentProjectTab } = useNavStore();
  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar: isAr });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [quickViewProject, setQuickViewProject] = useState<ProjectRow | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      number: "",
      name: "",
      nameEn: "",
      clientId: "",
      contractorId: "",
      location: "",
      plotNumber: "",
      type: "villa",
      budget: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  });
  const { register, handleSubmit: rhfHandleSubmit, formState: { errors }, reset } = form;

  // Fetch projects
  const { data, isLoading } = useQuery({
    queryKey: ["projects", search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery({
    queryKey: ["clients-dropdown"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch contractors for dropdown
  const { data: contractorsData } = useQuery({
    queryKey: ["contractors-dropdown"],
    queryFn: async () => {
      const res = await fetch("/api/contractors");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, createdById: user?.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowAddDialog(false);
      reset();
      toast.created(isAr ? "المشروع" : "Project");
    },
    onError: () => {
      toast.error(isAr ? "إنشاء المشروع" : "Create project");
    },
  });

  const allProjects: ProjectRow[] = data?.projects || [];
  const totalPages = Math.max(1, Math.ceil(allProjects.length / PAGE_SIZE));
  const projects = allProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRowClick = (projectId: string) => {
    setCurrentProjectId(projectId);
    setCurrentPage("projects");
    setCurrentProjectTab("overview");
  };

  const onSubmit = (data: ProjectFormData) => {
    createMutation.mutate({
      ...data,
      budget: data.budget ? parseFloat(data.budget) : 0,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      latitude: mapLocation?.lat ?? null,
      longitude: mapLocation?.lng ?? null,
    });
  };

  // Comparison selection
  const MAX_COMPARE = 3;

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_COMPARE) return prev;
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === Math.min(projects.length, MAX_COMPARE)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.slice(0, MAX_COMPARE).map((p: ProjectRow) => p.id)));
    }
  }, [selectedIds.size, projects]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedProjects = useMemo(
    () => projects.filter((p: ProjectRow) => selectedIds.has(p.id)),
    [projects, selectedIds]
  );

  const compareProjects = selectedProjects.slice(0, MAX_COMPARE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t("المشاريع", "Projects")}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {allProjects.length} {t("مشروع", "projects")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size >= 2 && selectedIds.size <= MAX_COMPARE && (
            <Button
              variant="outline"
              onClick={() => setShowCompare(true)}
              className="text-teal-600 dark:text-teal-400 border-teal-300 dark:border-teal-700 gap-2 hover:bg-teal-50 dark:hover:bg-teal-950/30"
            >
              <GitCompareArrows className="h-4 w-4" />
              {t("مقارنة", "Compare")}
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-0 text-[10px] h-5 min-w-[20px] px-1 justify-center rounded-full">
                {selectedIds.size}
              </Badge>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              const statusLabels: Record<string, string> = {
                active: isAr ? "نشط" : "Active",
                completed: isAr ? "مكتمل" : "Completed",
                delayed: isAr ? "متأخر" : "Delayed",
                on_hold: isAr ? "معلق" : "On Hold",
                cancelled: isAr ? "ملغى" : "Cancelled",
                design: isAr ? "تصميم" : "Design",
                submission: isAr ? "تقديم" : "Submission",
                approval: isAr ? "اعتماد" : "Approval",
                construction: isAr ? "تنفيذ" : "Construction",
              };
              const typeLabels: Record<string, string> = {
                villa: isAr ? "فيلا" : "Villa",
                building: isAr ? "مبنى" : "Building",
                commercial: isAr ? "تجاري" : "Commercial",
                industrial: isAr ? "صناعي" : "Industrial",
              };
              exportToCSV(
                projects.map((p: ProjectRow) => ({
                  [t("الرقم", "No.")]: p.number,
                  [t("اسم المشروع", "Project Name")]: isAr ? p.name : p.nameEn || p.name,
                  [t("العميل", "Client")]: p.client?.name || "",
                  [t("المقاول", "Contractor")]: p.contractor?.companyName || p.contractor?.name || "",
                  [t("الموقع", "Location")]: p.location,
                  [t("النوع", "Type")]: typeLabels[p.type] || p.type,
                  [t("الحالة", "Status")]: statusLabels[p.status] || p.status,
                  [t("الإنجاز %", "Progress %")]: p.progress,
                  [t("الميزانية", "Budget")]: p.budget,
                })),
                isAr ? "المشاريع" : "projects"
              );
            }}
            className="text-slate-600 dark:text-slate-300 gap-2"
          >
            <Download className="h-4 w-4" />
            {t("تصدير", "Export")}
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("مشروع جديد", "New Project")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t("بحث في المشاريع...", "Search projects...")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="ps-9 bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-700/50 focus:border-teal-300 dark:focus:border-teal-700"
            />
          </div>
          {/* Pill-style Status Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
          {(["all", "active", "completed", "delayed", "on_hold", "design", "submission", "approval", "construction"] as const).map((s) => {
            const isActive = statusFilter === s;
            const labels: Record<string, { ar: string; en: string; dotColor: string }> = {
              all: { ar: "الكل", en: "All", dotColor: "bg-slate-400" },
              active: { ar: "نشط", en: "Active", dotColor: "bg-emerald-500" },
              completed: { ar: "مكتمل", en: "Completed", dotColor: "bg-teal-500" },
              delayed: { ar: "متأخر", en: "Delayed", dotColor: "bg-red-500" },
              on_hold: { ar: "معلق", en: "On Hold", dotColor: "bg-amber-500" },
              design: { ar: "تصميم", en: "Design", dotColor: "bg-violet-500" },
              submission: { ar: "تقديم", en: "Submission", dotColor: "bg-sky-500" },
              approval: { ar: "اعتماد", en: "Approval", dotColor: "bg-amber-500" },
              construction: { ar: "تنفيذ", en: "Construction", dotColor: "bg-orange-500" },
            };
            const lbl = labels[s];
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 shadow-sm"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? lbl.dotColor : "bg-transparent")} />
                {t(lbl.ar, lbl.en)}
              </button>
            );
          })}
        </div>
          {/* Type filter - keep select for compactness */}
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("النوع", "Type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("الكل", "All")}</SelectItem>
            <SelectItem value="villa">{t("فيلا", "Villa")}</SelectItem>
            <SelectItem value="building">{t("مبنى", "Building")}</SelectItem>
            <SelectItem value="commercial">{t("تجاري", "Commercial")}</SelectItem>
            <SelectItem value="industrial">{t("صناعي", "Industrial")}</SelectItem>
          </SelectContent>
        </Select>
        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200",
              viewMode === "table"
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 shadow-sm"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200",
              viewMode === "grid"
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 shadow-sm"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
        </div>
      </div>

      {/* Table / Grid View */}
      {viewMode === "table" ? (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={projects.length > 0 && selectedIds.size === projects.length}
                  onCheckedChange={toggleSelectAll}
                  className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                />
              </TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">{t("رقم المشروع", "No.")}</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">{t("اسم المشروع", "Project Name")}</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">{t("العميل", "Client")}</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold hidden lg:table-cell">{t("الموقع", "Location")}</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">{t("النوع", "Type")}</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">{t("الحالة", "Status")}</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold hidden md:table-cell">{t("الإنجاز", "Progress")}</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold hidden sm:table-cell">{t("الميزانية", "Budget")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className="font-medium text-sm">{t("لا توجد مشاريع", "No projects found")}</span>
                      <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">{t("أضف مشروعاً جديداً للبدء", "Add a new project to get started")}</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project: ProjectRow) => {
                const st = statusConfig[project.status] || statusConfig.active;
                const tp = typeConfig[project.type] || typeConfig.villa;
                const isSelected = selectedIds.has(project.id);
                const healthColor = project.status === "completed" ? "bg-emerald-500" : project.status === "delayed" ? "bg-red-500" : project.progress >= 50 ? "bg-amber-500" : "bg-emerald-500";
                const healthRing = project.status === "completed" ? "ring-emerald-200 dark:ring-emerald-800" : project.status === "delayed" ? "ring-red-200 dark:ring-red-800" : project.progress >= 50 ? "ring-amber-200 dark:ring-amber-800" : "ring-emerald-200 dark:ring-emerald-800";
                // Deterministic sparkline based on project id hash (no Math.random in render)
                const sparklineSeed = project.id.charCodeAt(0) % 10;
                const sparkline = [
                  Math.max(5, project.progress * 0.6 + (sparklineSeed % 7) * 4),
                  Math.max(5, project.progress * 0.8 + (sparklineSeed % 5) * 4),
                  Math.max(5, project.progress * 0.9 + (sparklineSeed % 3) * 3),
                  Math.max(5, project.progress),
                ];
                return (
                  <TableRow
                    key={project.id}
                    className={cn(
                      "cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-950/10 transition-all duration-200 hover:scale-[1.005] hover:shadow-lg",
                      isSelected && "bg-teal-50/60 dark:bg-teal-950/20"
                    )}
                    onClick={() => handleRowClick(project.id)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        disabled={!isSelected && selectedIds.size >= MAX_COMPARE}
                        onCheckedChange={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(project.id)) {
                              next.delete(project.id);
                            } else {
                              if (next.size >= MAX_COMPARE) return prev;
                              next.add(project.id);
                            }
                            return next;
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                        {project.number}
                        {project.plotNumber && (
                          <span className="block text-[10px] text-teal-600 dark:text-teal-400 font-medium font-sans">
                            {project.plotNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full ring-2 shrink-0", healthColor, healthRing)} />
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {isAr ? project.name : project.nameEn || project.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{project.client?.name || "—"}</span>
                        {project.contractor && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <HardHat className="h-2.5 w-2.5 text-amber-500" />
                            <span className="text-[11px] text-amber-600 dark:text-amber-400">{project.contractor.companyName || project.contractor.name}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[150px]">{project.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs font-medium border-0", tp.color)}>
                        {t(tp.ar, tp.en)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs font-medium", st.className)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full me-1.5 inline-block", st.dotColor, "animate-pulse")} />
                        {t(st.ar, st.en)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        {/* Mini sparkline bars */}
                        <div className="flex items-end gap-[2px] h-4">
                          {sparkline.map((h, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-[3px] rounded-full transition-all",
                                h >= 75 ? "bg-teal-400" : h >= 40 ? "bg-teal-300" : "bg-amber-400"
                              )}
                              style={{ height: `${Math.min(h, 100) * 0.16}px` }}
                            />
                          ))}
                        </div>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-l from-teal-500 to-cyan-400 transition-all duration-500" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-10 text-end tabular-nums">
                          {Math.round(project.progress)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {project.budget.toLocaleString()} <span className="text-xs text-slate-400">AED</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProject(project);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {/* Pagination */}
        {allProjects.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t(`صفحة ${page} من ${totalPages}`, `Page ${page} of ${totalPages}`)}
              <span className="ms-2">({allProjects.length} {t("مشاريع", "projects")})</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-7 w-7 text-xs",
                      page === pageNum
                        ? "bg-teal-600 hover:bg-teal-700 text-white border-teal-600"
                        : ""
                    )}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      ) : (
      /* Grid View */
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
              <Skeleton className="h-4 w-3/4 mb-3" />
              <Skeleton className="h-3 w-1/2 mb-4" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : projects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="text-center">
              <span className="font-medium text-sm">{t("لا توجد مشاريع", "No projects found")}</span>
              <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">{t("أضف مشروعاً جديداً للبدء", "Add a new project to get started")}</p>
            </div>
          </div>
        ) : (
          projects.map((project: ProjectRow) => {
            const st = statusConfig[project.status] || statusConfig.active;
            const tp = typeConfig[project.type] || typeConfig.villa;
            const healthColor = project.status === "completed" ? "bg-emerald-500" : project.status === "delayed" ? "bg-red-500" : project.progress >= 50 ? "bg-amber-500" : "bg-emerald-500";
            const healthRing = project.status === "completed" ? "ring-emerald-200 dark:ring-emerald-800" : project.status === "delayed" ? "ring-red-200 dark:ring-red-800" : project.progress >= 50 ? "ring-amber-200 dark:ring-amber-800" : "ring-emerald-200 dark:ring-emerald-800";
            // Deterministic sparkline based on project id hash (no Math.random in render)
            const sparklineSeed = project.id.charCodeAt(0) % 10;
            const sparkline = [
              Math.max(5, project.progress * 0.6 + (sparklineSeed % 7) * 4),
              Math.max(5, project.progress * 0.8 + (sparklineSeed % 5) * 4),
              Math.max(5, project.progress * 0.9 + (sparklineSeed % 3) * 3),
              Math.max(5, project.progress),
            ];
            return (
              <div
                key={project.id}
                className="rounded-xl border border-slate-200/70 dark:border-slate-700/40 bg-white dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1 hover:border-teal-200 dark:hover:border-teal-800/60 group"
                onClick={() => handleRowClick(project.id)}
              >
                {/* Gradient header */}
                <div className="bg-gradient-to-l from-teal-500/10 via-cyan-500/5 to-transparent dark:from-teal-500/5 dark:via-cyan-500/5 dark:to-transparent px-4 pt-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={cn("w-2.5 h-2.5 rounded-full ring-2 shrink-0", healthColor, healthRing)} />
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{isAr ? project.name : project.nameEn || project.name}</div>
                    </div>
                    <span className={cn("shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ms-2", st.className)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full me-1 inline-block", st.dotColor)} />
                      {t(st.ar, st.en)}
                    </span>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-mono">{project.number}</div>
                  {project.plotNumber && (
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mb-3 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {project.plotNumber}
                    </div>
                  )}
                  {/* Progress */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-end gap-[2px] h-4">
                      {sparkline.map((h, i) => (
                        <div key={i} className={cn("w-[3px] rounded-full", h >= 75 ? "bg-teal-400" : h >= 40 ? "bg-teal-300" : "bg-amber-400")} style={{ height: `${Math.min(h, 100) * 0.16}px` }} />
                      ))}
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-l from-teal-500 to-cyan-400 transition-all duration-500" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">{Math.round(project.progress)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{project.location}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{project.budget.toLocaleString()} AED</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <Badge variant="outline" className={cn("text-[9px] border-0", tp.color)}>{t(tp.ar, tp.en)}</Badge>
                    <span className="text-[9px] text-slate-400">{project.client?.name || "—"}</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                      <CheckCircle2 className="h-3 w-3" />
                      {project._count?.tasks || 0}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {/* Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {t(
            `إجمالي ${allProjects.length} مشروع`,
            `${allProjects.length} projects total`
          )}
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={clearSelection}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {isAr ? "إلغاء التحديد" : "Clear selection"} ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Floating Compare Button */}
      {selectedIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
          <Button
            onClick={() => setShowCompare(true)}
            disabled={selectedIds.size > MAX_COMPARE}
            className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-xl shadow-teal-500/30 rounded-full px-6 h-12 gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitCompareArrows className="h-4 w-4" />
            {selectedIds.size > MAX_COMPARE
              ? t(`يمكنك مقارنة ${MAX_COMPARE} مشاريع فقط`, `Max ${MAX_COMPARE} projects for comparison`)
              : t("مقارنة المشاريع", "Compare Projects")}
            <Badge className="bg-white/20 text-white border-0 text-xs h-5 min-w-[20px] justify-center rounded-full">
              {Math.min(selectedIds.size, MAX_COMPARE)}
            </Badge>
          </Button>
        </div>
      )}

      {/* Project Comparison Dialog */}
      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className={cn("max-h-[90vh] overflow-y-auto", compareProjects.length === 3 ? "max-w-5xl" : "max-w-3xl")}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5 text-teal-500" />
                {t("مقارنة المشاريع", "Project Comparison")}
              </DialogTitle>
              <Badge variant="secondary" className="text-xs">
                {compareProjects.length} {t("مشروع", "projects")}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Project headers */}
            <div className={cn("grid gap-3", compareProjects.length === 3 ? "grid-cols-[140px_repeat(3,1fr)]" : "grid-cols-[140px_repeat(2,1fr)]")}>
              <div />
              {compareProjects.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {isAr ? p.name : p.nameEn || p.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{p.number}</div>
                </div>
              ))}
            </div>

            {/* Comparison rows */}
            <ComparisonTable
              projects={compareProjects}
              isAr={isAr}
              t={t}
              statusConfig={statusConfig}
              typeConfig={typeConfig}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompare(false)}>
              {t("إغلاق", "Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Project Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { reset(); setMapLocation(null); } setShowAddDialog(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("مشروع جديد", "New Project")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={rhfHandleSubmit(onSubmit as any)} className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("رقم المشروع", "Project Number")}</Label>
                <Input {...register("number")} placeholder={t("PRJ-001", "PRJ-001")} className={cn(errors.number && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} />
                {errors.number && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.number.message || "", isAr)}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t("النوع", "Type")}</Label>
                {/* eslint-disable-next-line react-hooks/incompatible-library */}
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v)}>
                  <SelectTrigger className={cn(errors.type && "border-red-500 focus:ring-red-500/20")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="villa">{t("فيلا", "Villa")}</SelectItem>
                    <SelectItem value="building">{t("مبنى", "Building")}</SelectItem>
                    <SelectItem value="commercial">{t("تجاري", "Commercial")}</SelectItem>
                    <SelectItem value="industrial">{t("صناعي", "Industrial")}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.type.message || "", isAr)}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("اسم المشروع (عربي)", "Project Name (Arabic)")}</Label>
              <Input {...register("name")} placeholder={isAr ? "اسم المشروع بالعربي" : "Project name in Arabic"} dir="rtl" className={cn(errors.name && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} />
              {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.name.message || "", isAr)}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("اسم المشروع (إنجليزي)", "Project Name (English)")}</Label>
              <Input {...register("nameEn")} placeholder={isAr ? "Project name in English" : "Project name in English"} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{t("العميل", "Client")}</Label>
              <Select value={form.watch("clientId")} onValueChange={(v) => form.setValue("clientId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("اختر العميل", "Select client")} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(clientsData) ? clientsData : []).map((c: { id: string; name: string; company: string }) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.company ? `— ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.clientId.message || "", isAr)}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <HardHat className="h-3.5 w-3.5 text-amber-500" />
                {t("المقاول (اختياري)", "Contractor (Optional)")}
              </Label>
              <Select value={form.watch("contractorId") || ""} onValueChange={(v) => form.setValue("contractorId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("اختر المقاول المنفذ", "Select executing contractor")} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(contractorsData) ? contractorsData : []).map((c: { id: string; name: string; companyName: string; category: string }) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName || c.name} {c.category ? `— ${c.category}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("الموقع", "Location")}</Label>
              <Input {...register("location")} placeholder={isAr ? "رأس الخيمة" : "Ras Al Khaimah"} className={cn(errors.location && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} />
              {errors.location && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.location.message || "", isAr)}</p>}
            </div>
            <div className="space-y-2">
              <MapPicker
                value={mapLocation}
                onChange={(v) => setMapLocation(v)}
                label={t("موقع المشروع على الخريطة", "Project Location on Map")}
                height="250px"
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "رقم القسيمة" : "Plot Number"}</Label>
              <Input {...register("plotNumber")} placeholder={isAr ? "مثال: RKN-LOT-4521" : "e.g. RKN-LOT-4521"} />
            </div>
            <div className="space-y-2">
              <Label>{t("الميزانية (AED)", "Budget (AED)")}</Label>
              <Input type="number" {...register("budget")} placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("تاريخ البدء", "Start Date")}</Label>
                <Input type="date" {...register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label>{t("تاريخ الانتهاء", "End Date")}</Label>
                <Input type="date" {...register("endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("الوصف", "Description")}</Label>
              <Textarea {...register("description")} rows={3} placeholder={t("وصف المشروع...", "Project description...")} />
            </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); setShowAddDialog(false); }}>
              {t("إلغاء", "Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {createMutation.isPending
                ? t("جارٍ الحفظ...", "Saving...")
                : t("إنشاء المشروع", "Create Project")}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ===== Quick View Panel =====
function ProjectQuickView({
  project,
  isAr,
  t,
  onClose,
  onOpenFull,
  statusConfig: stCfg,
  typeConfig: tpCfg,
}: {
  project: ProjectRow;
  isAr: boolean;
  t: (ar: string, en: string) => string;
  onClose: () => void;
  onOpenFull: () => void;
  statusConfig: Record<string, { ar: string; en: string; variant: string; className: string }>;
  typeConfig: Record<string, { ar: string; en: string; color: string }>;
}) {
  const st = stCfg[project.status] || stCfg.active;
  const tp = tpCfg[project.type] || tpCfg.villa;

  const mockActivities = [
    { id: "1", text: isAr ? "تم إنشاء المشروع" : "Project created", time: project.createdAt, color: "bg-teal-500", icon: <CheckCircle2 className="h-3 w-3" /> },
    { id: "2", text: isAr ? "تعيين الفريق الأولي" : "Initial team assigned", time: project.createdAt, color: "bg-blue-500", icon: <Users className="h-3 w-3" /> },
    { id: "3", text: isAr ? "بدء مرحلة التصميم" : "Design phase started", time: project.createdAt, color: "bg-amber-500", icon: <Activity className="h-3 w-3" /> },
    { id: "4", text: isAr ? "مراجعة المخططات" : "Drawing review", time: project.createdAt, color: "bg-violet-500", icon: <MessageSquare className="h-3 w-3" /> },
    { id: "5", text: isAr ? "تحديث التقدم" : "Progress updated", time: project.createdAt, color: "bg-emerald-500", icon: <ArrowUpRight className="h-3 w-3" /> },
  ];

  const mockTeam = [
    { name: isAr ? "أحمد المنصوري" : "Ahmed M.", color: "bg-teal-500" },
    { name: isAr ? "فاطمة الشامسي" : "Fatima S.", color: "bg-amber-500" },
    { name: isAr ? "محمد الكعبي" : "Mohammed K.", color: "bg-blue-500" },
    { name: isAr ? "سارة البلوشي" : "Sara B.", color: "bg-violet-500" },
  ];

  const progressColor = project.progress >= 80 ? "text-emerald-500" : project.progress >= 50 ? "text-teal-500" : project.progress >= 25 ? "text-amber-500" : "text-red-500";
  const progressStroke = project.progress >= 80 ? "#10b981" : project.progress >= 50 ? "#133371" : project.progress >= 25 ? "#f59e0b" : "#ef4444";
  const ringRadius = 28;
  const ringCircumference = ringRadius * 2 * Math.PI;
  const ringOffset = ringCircumference - (project.progress / 100) * ringCircumference;

  return (
    <div className="flex flex-col h-full">
      {/* Header gradient */}
      <div className="bg-gradient-to-l from-teal-600 to-teal-700 dark:from-teal-800 dark:to-teal-900 p-5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-white/70">
            {t("عرض سريع", "Quick View")}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          {isAr ? project.name : project.nameEn || project.name}
        </h3>
        <p className="text-sm text-white/70 font-mono">{project.number}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full", st.className)}>
            {t(st.ar, st.en)}
          </span>
          <span className={cn("inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full", tp.color)}>
            {t(tp.ar, tp.en)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
        {/* Mini Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Progress */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
            <div className="relative shrink-0">
              <svg width={64} height={64} className="-rotate-90">
                <circle cx={32} cy={32} r={ringRadius} fill="none" stroke="currentColor" strokeWidth={4} className="text-slate-200 dark:text-slate-700" />
                <circle cx={32} cy={32} r={ringRadius} fill="none" stroke={progressStroke} strokeWidth={4} strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} className="transition-all duration-700" />
              </svg>
              <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold rotate-0", progressColor)}>
                {Math.round(project.progress)}%
              </span>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("الإنجاز", "Progress")}</p>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-2">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("الميزانية", "Budget")}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {project.budget.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">AED</span>
            </p>
          </div>

          {/* Tasks */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-2">
              <CheckSquare className="h-4 w-4 text-white" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("المهام", "Tasks")}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{project._count?.tasks || 0}</p>
          </div>

          {/* Client */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-2">
              <Users className="h-4 w-4 text-white" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("العميل", "Client")}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{project.client?.name || "—"}</p>
          </div>
        </div>

        {/* Team Members */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">{t("فريق المشروع", "Project Team")}</h4>
          <div className="flex items-center gap-1">
            {mockTeam.map((member, idx) => (
              <div key={idx} className="relative" style={{ zIndex: mockTeam.length - idx }}>
                <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-900" style={{ marginInlineStart: idx > 0 ? "-6px" : "0" }}>
                  <AvatarFallback className={cn("text-white text-[10px] font-semibold", member.color)}>
                    {member.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
            <span className="text-[11px] text-slate-400 dark:text-slate-500 ms-2">{mockTeam.length} {t("عضو", "members")}</span>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">{t("النشاط الأخير", "Recent Activity")}</h4>
          <div className="space-y-0">
            <div className="absolute start-[15px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
            {mockActivities.map((item, idx) => (
              <div key={item.id} className="relative flex items-start gap-3 pb-3 last:pb-0">
                <div className={cn("relative z-10 h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-white", item.color)}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.text}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(item.time).toLocaleDateString(isAr ? "ar-AE" : "en-US", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 space-y-2">
        <Button
          onClick={onOpenFull}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2"
        >
          {t("فتح العرض الكامل", "Open Full View")}
          <ArrowUpRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full"
        >
          {t("إغلاق", "Close")}
        </Button>
      </div>
    </div>
  );
}

// ===== Comparison Table =====
function ComparisonTable({
  projects,
  isAr,
  t,
  statusConfig,
  typeConfig,
}: {
  projects: ProjectRow[];
  isAr: boolean;
  t: (ar: string, en: string) => string;
  statusConfig: Record<string, { ar: string; en: string; variant: string; className: string }>;
  typeConfig: Record<string, { ar: string; en: string; color: string }>;
}) {
  if (projects.length < 2) return null;

  const gridCols = projects.length === 3
    ? "grid-cols-[140px_repeat(3,1fr)]"
    : "grid-cols-[140px_repeat(2,1fr)]";

  const rows = [
    {
      label: t("العميل", "Client"),
      icon: <Users className="h-3.5 w-3.5" />,
      values: projects.map((p) => p.client?.name || "—"),
      type: "text" as const,
    },
    {
      label: t("الحالة", "Status"),
      icon: <Activity className="h-3.5 w-3.5" />,
      values: projects.map((p) => statusConfig[p.status]?.ar || p.status),
      type: "text" as const,
    },
    {
      label: t("الإنجاز", "Progress"),
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      values: projects.map((p) => p.progress),
      type: "progress" as const,
    },
    {
      label: t("الميزانية", "Budget"),
      icon: <Wallet className="h-3.5 w-3.5" />,
      values: projects.map((p) => p.budget),
      type: "currency" as const,
    },
    {
      label: t("تاريخ البدء", "Start Date"),
      icon: <Calendar className="h-3.5 w-3.5" />,
      values: projects.map((p) => p.createdAt),
      type: "date" as const,
    },
    {
      label: t("تاريخ الانتهاء", "End Date"),
      icon: <Calendar className="h-3.5 w-3.5" />,
      values: projects.map((p) => p.createdAt),
      type: "date" as const,
      isEndDate: true,
    },
    {
      label: t("النوع", "Type"),
      icon: <Tag className="h-3.5 w-3.5" />,
      values: projects.map((p) => typeConfig[p.type]?.ar || p.type),
      type: "text" as const,
    },
    {
      label: t("الموقع", "Location"),
      icon: <MapPin className="h-3.5 w-3.5" />,
      values: projects.map((p) => p.location || "—"),
      type: "text" as const,
    },
  ];

  const maxProgress = Math.max(...projects.map((p) => p.progress));
  const minProgress = Math.min(...projects.map((p) => p.progress));

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {rows.map((row, idx) => {
        const isDifferent = row.type !== "text"
          ? true
          : new Set(row.values).size > 1;
        return (
          <div
            key={idx}
            className={cn(
              "grid gap-0",
              gridCols,
              idx % 2 === 0
                ? "bg-white dark:bg-slate-900"
                : "bg-slate-50/50 dark:bg-slate-800/30"
            )}
          >
            {/* Label */}
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 border-e border-slate-200 dark:border-slate-700">
              {row.icon}
              {row.label}
            </div>

            {/* Values */}
            {row.type === "progress" ? (
              projects.map((p, i) => {
                const val = p.progress;
                const isBest = isDifferent && val === maxProgress && maxProgress !== minProgress;
                const isWorst = isDifferent && val === minProgress && maxProgress !== minProgress;
                return (
                  <div key={i} className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Progress value={val} className="h-2 flex-1" />
                      <span className={cn(
                        "text-xs font-semibold tabular-nums w-10 text-end",
                        isBest
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isWorst
                          ? "text-red-500 dark:text-red-400"
                          : "text-slate-600 dark:text-slate-400"
                      )}>
                        {Math.round(val)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : row.type === "currency" ? (
              projects.map((p, i) => {
                const val = p.budget;
                const maxBudget = Math.max(...projects.map((pp) => pp.budget));
                const minBudget = Math.min(...projects.map((pp) => pp.budget));
                const isBest = isDifferent && val === maxBudget && maxBudget !== minBudget;
                const isWorst = isDifferent && val === minBudget && maxBudget !== minBudget;
                return (
                  <div key={i} className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {isDifferent && (
                        isBest
                          ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                          : isWorst
                          ? <TrendingDown className="h-3 w-3 text-red-400" />
                          : null
                      )}
                      <span className={cn(
                        "text-sm font-medium tabular-nums font-mono",
                        isBest
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isWorst
                          ? "text-red-500 dark:text-red-400"
                          : "text-slate-700 dark:text-slate-300"
                      )}>
                        {val.toLocaleString()} AED
                      </span>
                    </div>
                  </div>
                );
              })
            ) : row.type === "date" ? (
              projects.map((p, i) => {
                const val = p.createdAt;
                const dates = projects.map((pp) => new Date(pp.createdAt).getTime());
                const maxDate = Math.max(...dates);
                const minDate = Math.min(...dates);
                const curDate = new Date(val).getTime();
                const isEndDate = "isEndDate" in row && row.isEndDate;
                const isBest = isDifferent && !isEndDate
                  ? curDate === minDate
                  : isDifferent && isEndDate
                  ? curDate === maxDate
                  : false;
                const isWorst = isDifferent && !isEndDate
                  ? curDate === maxDate && maxDate !== minDate
                  : isDifferent && isEndDate
                  ? curDate === minDate && maxDate !== minDate
                  : false;
                return (
                  <div key={i} className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {isDifferent && (
                        isBest
                          ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                          : isWorst
                          ? <TrendingDown className="h-3 w-3 text-red-400" />
                          : null
                      )}
                      <span className={cn(
                        "text-sm",
                        isBest
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : isWorst
                          ? "text-red-500 dark:text-red-400 font-medium"
                          : "text-slate-700 dark:text-slate-300"
                      )}>
                        {isEndDate
                          ? t("غير محدد", "Not set")
                          : new Date(val).toLocaleDateString(isAr ? "ar-AE" : "en-US")}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              row.values.map((val, i) => (
                <div key={i} className="px-3 py-2.5">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {val}
                  </span>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
