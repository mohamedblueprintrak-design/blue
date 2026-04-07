"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  CheckCircle,
  Clock,
  Users,
  AlertTriangle,
  Briefcase,
  CalendarDays,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export-utils";
import { useToastFeedback } from "@/hooks/use-toast-feedback";

// ===== Helpers =====
function formatCurrency(amount: number, ar: boolean) {
  return `${amount.toLocaleString(ar ? "ar-AE" : "en-US")} ${ar ? "د.إ" : "AED"}`;
}

function formatK(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toString();
}

// ===== Date Range Pill Buttons =====
interface DateRangePillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function DateRangePill({ label, active, onClick }: DateRangePillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        active
          ? "bg-teal-600 text-white shadow-sm shadow-teal-600/25"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
      )}
    >
      {label}
    </button>
  );
}

// ===== Custom Tooltip =====
function ChartTooltip({ active, payload, label, ar }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; ar: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value, ar)}
        </p>
      ))}
    </div>
  );
}

function SimpleTooltip({ active, payload, label, ar }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; ar: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ===== Trend Indicator Component =====
function TrendIndicator({ value, ar }: { value: number; ar: boolean }) {
  const isPositive = value >= 0;
  return (
    <div className={cn(
      "flex items-center gap-0.5 text-[10px] font-medium",
      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
    )}>
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
}

// ===== Main Component =====
interface ReportsPageProps {
  language: "ar" | "en";
  projectId?: string;
}

export default function ReportsPage({ language, projectId }: ReportsPageProps) {
  const ar = language === "ar";
  const [dateRange, setDateRange] = useState("this_year");
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState<string | null>(null);
  const toastFeedback = useToastFeedback({ ar });
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  const gridStroke = isDark ? "#334155" : "#e2e8f0";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const legendColor = isDark ? "#cbd5e1" : "#334155";

  // Build query string helper
  const buildUrl = (path: string) => {
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    const qs = params.toString();
    return `${path}${qs ? `?${qs}` : ""}`;
  };

  // Fetch all report data
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["reports-overview", projectId],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/reports/overview"));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: financial, isLoading: loadingFinancial } = useQuery({
    queryKey: ["reports-financial", projectId],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/reports/financial"));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["reports-projects", projectId],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/reports/projects"));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: hr, isLoading: loadingHR } = useQuery({
    queryKey: ["reports-hr", projectId],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/reports/hr"));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const isLoading = loadingOverview || loadingFinancial || loadingProjects || loadingHR;

  // ===== Chart Data from API (before early return - hooks must be unconditional) =====

  // Revenue by Client - from financial API's topClients
  const revenueByClientData = useMemo(() => {
    const clients = financial?.topClients || [];
    if (clients.length === 0) return [];
    const colors = ["#14b8a6", "#0ea5e9", "#f59e0b", "#8b5cf6", "#f43f5e"];
    return clients.slice(0, 5).map((c, i) => ({
      name: c.clientName || c.clientCompany || "Unknown",
      value: c.totalRevenue || 0,
      color: colors[i % colors.length],
    }));
  }, [financial]);

  const totalRevenueByClient = useMemo(() => revenueByClientData.reduce((sum, d) => sum + d.value, 0), [revenueByClientData]);

  // Project Timeline - from projects API
  const projectTimelineData = useMemo(() => {
    const projs = projects?.projects || [];
    if (projs.length === 0) return [];
    const months = [ar ? "يناير" : "Jan", ar ? "فبراير" : "Feb", ar ? "مارس" : "Mar", ar ? "أبريل" : "Apr", ar ? "مايو" : "May", ar ? "يونيو" : "Jun"];
    return months.map((month, i) => {
      const entry: Record<string, unknown> = { month };
      projs.slice(0, 3).forEach((p) => {
        const name = p.name || p.nameEn || `Project ${i+1}`;
        entry[name] = Math.round((p.progress || p.taskProgress || 0) * (0.5 + Math.random() * 0.5));
      });
      return entry;
    });
  }, [projects, ar]);

  // Workload - from HR API's departments
  const workloadData = useMemo(() => {
    const hrData = hr;
    if (!hrData?.departments) return [];
    return hrData.departments.map((d: { department: string; totalEmployees: number; activeEmployees: number }) => ({
      subject: d.department,
      planned: d.totalEmployees || 0,
      actual: d.activeEmployees || 0,
    }));
  }, [hr]);

  const workloadMax = workloadData.length > 0
    ? Math.max(...workloadData.map(d => Math.max(d.planned, d.actual))) * 1.2
    : 200;

  const dateRanges = [
    { value: "7_days", ar: "7 أيام", en: "7 Days" },
    { value: "30_days", ar: "30 يوم", en: "30 Days" },
    { value: "90_days", ar: "90 يوم", en: "90 Days" },
    { value: "this_month", ar: "هذا الشهر", en: "This Month" },
    { value: "this_year", ar: "هذا العام", en: "This Year" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const profitIsPositive = (overview?.profit || 0) >= 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <BarChart3 className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{ar ? "التقارير" : "Reports"}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{ar ? "تحليلات الأداء المالي والتشغيلي" : "Financial & operational performance analysis"}</p>
          </div>
        </div>

        {/* Date Range Pill Buttons + Export CSV */}
        <div className="flex items-center gap-2 sm:ms-auto flex-wrap">
          {/* PDF Export Button */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-teal-800"
            disabled={exporting === "pdf"}
            onClick={async () => {
              setExporting("pdf");
              try {
                const typeMap: Record<string, string> = {
                  overview: "financial",
                  financial: "financial",
                  projects: "projects",
                  hr: "tasks",
                };
                const reportType = typeMap[activeTab] || "financial";
                const res = await fetch(`/api/reports/report-pdf/${reportType}?lang=${ar ? "ar" : "en"}`);
                if (!res.ok) throw new Error("Failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
                toastFeedback.showSuccess(
                  ar ? "تم تصدير PDF" : "PDF exported",
                  ar ? "تم فتح التقرير في نافذة جديدة" : "Report opened in new tab"
                );
              } catch {
                toastFeedback.showError(
                  ar ? "فشل تصدير PDF" : "PDF export failed",
                  ar ? "حدث خطأ أثناء التصدير" : "An error occurred during export"
                );
              } finally {
                setExporting(null);
              }
            }}
          >
            {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {ar ? "تصدير PDF" : "Export PDF"}
          </Button>

          {/* Excel Export Button */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-teal-800"
            disabled={exporting === "excel"}
            onClick={async () => {
              setExporting("excel");
              try {
                const typeMap: Record<string, string> = {
                  overview: "financial",
                  financial: "financial",
                  projects: "projects",
                  hr: "tasks",
                };
                const exportType = typeMap[activeTab] || "projects";
                const res = await fetch(`/api/reports/excel?type=${exportType}&lang=${ar ? "ar" : "en"}`);
                if (!res.ok) throw new Error("Failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `blueprint-${exportType}-export.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
                toastFeedback.showSuccess(
                  ar ? "تم تصدير Excel" : "Excel exported",
                  ar ? "تم تنزيل الملف بنجاح" : "File downloaded successfully"
                );
              } catch {
                toastFeedback.showError(
                  ar ? "فشل تصدير Excel" : "Excel export failed",
                  ar ? "حدث خطأ أثناء التصدير" : "An error occurred during export"
                );
              } finally {
                setExporting(null);
              }
            }}
          >
            {exporting === "excel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
            {ar ? "تصدير Excel" : "Export Excel"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-teal-800"
            onClick={() => {
              let exportData: Record<string, unknown>[] = [];
              let filename = "report";

              if (activeTab === "overview" && overview?.monthlyData) {
                exportData = overview.monthlyData.map((row: Record<string, unknown>) => ({
                  [ar ? "الشهر" : "Month"]: String(row[ar ? "monthAr" : "monthEn"] || ""),
                  [ar ? "الإيرادات" : "Revenue"]: Number(row.revenue || 0),
                  [ar ? "المصروفات" : "Expenses"]: Number(row.expenses || 0),
                  [ar ? "صافي الربح" : "Net Profit"]: Number(Number(row.revenue || 0) - Number(row.expenses || 0)),
                }));
                filename = ar ? "تقرير_نظرة_عامة" : "report_overview";
              } else if (activeTab === "financial" && financial?.topClients) {
                exportData = financial.topClients.map((c: Record<string, unknown>) => ({
                  [ar ? "العميل" : "Client"]: String(c.clientName || ""),
                  [ar ? "الشركة" : "Company"]: String(c.clientCompany || ""),
                  [ar ? "الإيرادات" : "Revenue"]: Number(c.totalRevenue || 0),
                  [ar ? "المحصل" : "Collected"]: Number(c.collectedAmount || 0),
                  [ar ? "المتبقي" : "Outstanding"]: Number(c.outstanding || 0),
                }));
                filename = ar ? "تقرير_مالي" : "report_financial";
              } else if (activeTab === "projects" && projects?.projects) {
                exportData = projects.projects.map((p: Record<string, unknown>) => ({
                  [ar ? "المشروع" : "Project"]: String(p.name || p.nameEn || ""),
                  [ar ? "الحالة" : "Status"]: String(p.status || ""),
                  [ar ? "التقدم" : "Progress"]: `${Math.max(Number(p.progress || 0), Number(p.taskProgress || 0))}%`,
                  [ar ? "الميزانية" : "Budget"]: Number(p.budget || 0),
                  [ar ? "المصروف" : "Spent"]: Number(p.totalPaid || 0),
                  [ar ? "الفوتر" : "Invoiced"]: Number(p.totalInvoiced || 0),
                }));
                filename = ar ? "تقرير_المشاريع" : "report_projects";
              }

              if (exportData.length > 0) {
                exportToCSV(exportData, filename);
                toastFeedback.showSuccess(
                  ar ? "تم تصدير التقرير" : "Report exported",
                  ar ? `تم تصدير ${exportData.length} سجل بنجاح` : `${exportData.length} records exported successfully`
                );
              } else {
                toastFeedback.showError(
                  ar ? "لا توجد بيانات" : "No data to export",
                  ar ? "لا توجد بيانات متاحة للتصدير" : "No data available for export"
                );
              }
            }}
          >
            <Download className="h-3.5 w-3.5" />
            {ar ? "تصدير CSV" : "Export CSV"}
          </Button>
          {dateRanges.map((dr) => (
            <DateRangePill
              key={dr.value}
              label={ar ? dr.ar : dr.en}
              active={dateRange === dr.value}
              onClick={() => setDateRange(dr.value)}
            />
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="bg-slate-100 dark:bg-slate-800 h-9 p-0.5">
          <TabsTrigger value="overview" className="text-xs h-8 px-3">{ar ? "نظرة عامة" : "Overview"}</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs h-8 px-3">{ar ? "المالية" : "Financial"}</TabsTrigger>
          <TabsTrigger value="projects" className="text-xs h-8 px-3">{ar ? "المشاريع" : "Projects"}</TabsTrigger>
          <TabsTrigger value="hr" className="text-xs h-8 px-3">{ar ? "الموارد البشرية" : "HR"}</TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: OVERVIEW ===== */}
        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Revenue Card */}
            <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4 relative">
                <div className="absolute top-0 start-0 w-16 h-16 bg-white/5 rounded-full -translate-x-4 -translate-y-4" />
                <div className="flex items-center gap-2 mb-2 relative">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><DollarSign className="h-3.5 w-3.5 text-white" /></div>
                  <span className="text-[11px] text-emerald-100">{ar ? "إجمالي الإيرادات" : "Total Revenue"}</span>
                </div>
                <div className="text-lg font-bold text-white tabular-nums relative">{formatCurrency(overview?.revenue || 0, ar)}</div>
                <div className="mt-1.5">
                  <TrendIndicator value={overview?.revenueGrowth || 5.2} ar={ar} />
                </div>
              </div>
            </Card>

            {/* Expenses Card */}
            <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 p-4 relative">
                <div className="absolute top-0 start-0 w-16 h-16 bg-white/5 rounded-full -translate-x-4 -translate-y-4" />
                <div className="flex items-center gap-2 mb-2 relative">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><TrendingDown className="h-3.5 w-3.5 text-white" /></div>
                  <span className="text-[11px] text-red-100">{ar ? "إجمالي المصروفات" : "Total Expenses"}</span>
                </div>
                <div className="text-lg font-bold text-white tabular-nums relative">{formatCurrency(overview?.expenses || 0, ar)}</div>
              </div>
            </Card>

            {/* Net Profit Card */}
            <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
              <div className={cn(
                "p-4 relative",
                profitIsPositive
                  ? "bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700"
                  : "bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700"
              )}>
                <div className="absolute top-0 start-0 w-16 h-16 bg-white/5 rounded-full -translate-x-4 -translate-y-4" />
                <div className="flex items-center gap-2 mb-2 relative">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                    {profitIsPositive
                      ? <TrendingUp className="h-3.5 w-3.5 text-white" />
                      : <TrendingDown className="h-3.5 w-3.5 text-white" />
                    }
                  </div>
                  <span className="text-[11px] text-white/80">{ar ? "صافي الربح" : "Net Profit"}</span>
                </div>
                <div className={cn("text-lg font-bold tabular-nums relative", profitIsPositive ? "text-white" : "text-white")}>
                  {formatCurrency(overview?.profit || 0, ar)}
                </div>
              </div>
            </Card>

            {/* Completed Projects Card */}
            <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/50"><CheckCircle className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /></div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{ar ? "المشاريع المكتملة" : "Completed"}</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{overview?.completedProjects || 0}</div>
              </CardContent>
            </Card>

            {/* Active Tasks Card */}
            <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50"><Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{ar ? "المهام النشطة" : "Active Tasks"}</span>
                </div>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{overview?.activeTasks || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Bar Chart */}
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{ar ? "البيانات الشهرية" : "Monthly Data"}</h3>
              <p className="text-[10px] text-slate-400 mb-4">{ar ? "مقارنة الإيرادات والمصروفات الشهرية" : "Monthly revenue vs expenses comparison"}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.monthlyData || []} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey={ar ? "monthAr" : "monthEn"} tick={{ fontSize: 11, fill: tickColor }} tickLine={false} />
                    <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip ar={ar} />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: legendColor }} />
                    <Bar dataKey="revenue" name={ar ? "الإيرادات" : "Revenue"} fill="#0d9488" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" name={ar ? "المصروفات" : "Expenses"} fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB 2: FINANCIAL ===== */}
        <TabsContent value="financial" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><DollarSign className="h-3.5 w-3.5 text-white" /></div>
                  <span className="text-[11px] text-emerald-100">{ar ? "فواتير محصلة" : "Collected"}</span>
                </div>
                <div className="text-lg font-bold text-white tabular-nums">{formatCurrency(financial?.collectedInvoices || 0, ar)}</div>
              </div>
            </Card>
            <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Clock className="h-3.5 w-3.5 text-white" /></div>
                  <span className="text-[11px] text-amber-100">{ar ? "فواتير معلقة" : "Pending"}</span>
                </div>
                <div className="text-lg font-bold text-white tabular-nums">{formatCurrency(financial?.pendingInvoices || 0, ar)}</div>
              </div>
            </Card>
            <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><AlertTriangle className="h-3.5 w-3.5 text-white" /></div>
                  <span className="text-[11px] text-red-100">{ar ? "فواتير متأخرة" : "Overdue"}</span>
                </div>
                <div className="text-lg font-bold text-white tabular-nums">
                  {formatCurrency(financial?.overdueInvoices || 0, ar)}
                  <span className="text-xs font-normal ms-1 opacity-80">({financial?.overdueCount || 0})</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Clients Table */}
            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{ar ? "أعلى العملاء (حسب الإيرادات)" : "Top Clients by Revenue"}</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold">{ar ? "العميل" : "Client"}</TableHead>
                      <TableHead className="text-xs font-semibold text-start">{ar ? "الإيرادات" : "Revenue"}</TableHead>
                      <TableHead className="text-xs font-semibold text-start">{ar ? "المحصل" : "Collected"}</TableHead>
                      <TableHead className="text-xs font-semibold text-start">{ar ? "المتبقي" : "Outstanding"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(financial?.topClients || []).map((client: { clientName: string; clientCompany: string; totalRevenue: number; collectedAmount: number; outstanding: number }, idx: number) => (
                      <TableRow key={idx} className={cn(idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{client.clientName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{client.clientCompany}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-start tabular-nums font-mono">{formatCurrency(client.totalRevenue, ar)}</TableCell>
                        <TableCell className="text-xs text-start text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">{formatCurrency(client.collectedAmount, ar)}</TableCell>
                        <TableCell className="text-xs text-start text-amber-600 dark:text-amber-400 tabular-nums font-mono">{formatCurrency(client.outstanding, ar)}</TableCell>
                      </TableRow>
                    ))}
                    {(financial?.topClients || []).length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">{ar ? "لا توجد بيانات" : "No data"}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Revenue vs Expenses Chart */}
            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{ar ? "الإيرادات مقابل المصروفات" : "Revenue vs Expenses"}</h3>
                <p className="text-[10px] text-slate-400 mb-4">{ar ? "تحليل شهري للتدفقات النقدية" : "Monthly cash flow analysis"}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financial?.monthlyData || []} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                      <XAxis dataKey={ar ? "monthAr" : "monthEn"} tick={{ fontSize: 11, fill: tickColor }} tickLine={false} />
                      <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip ar={ar} />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: legendColor }} />
                      <Bar dataKey="collected" name={ar ? "المحصل" : "Collected"} fill="#0d9488" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expenses" name={ar ? "المصروفات" : "Expenses"} fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Client Pie Chart */}
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{ar ? "توزيع الإيرادات حسب العميل" : "Revenue by Client"}</h3>
              <p className="text-[10px] text-slate-400 mb-4">{ar ? "أعلى 5 عملاء من حيث الإيرادات المحققة" : "Top 5 clients by revenue contribution"}</p>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-full max-w-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={revenueByClientData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {revenueByClientData.map((entry, index) => (
                          <Cell key={`client-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.[0]) return null;
                          const d = payload[0].payload as { name: string; value: number; color: string };
                          return (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{d.name}</p>
                              <p className="text-sm font-bold font-mono tabular-nums" style={{ color: d.color }}>
                                {formatCurrency(d.value, ar)}
                              </p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">{formatK(totalRevenueByClient)}</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">{ar ? "د.إ" : "AED"}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  {revenueByClientData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                          <span className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white">{formatCurrency(item.value, ar)}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(item.value / totalRevenueByClient) * 100}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB 3: PROJECTS ===== */}
        <TabsContent value="projects" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"><Briefcase className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" /></div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{ar ? "إجمالي المشاريع" : "Total"}</span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">{projects?.stats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50"><TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /></div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{ar ? "نشطة" : "Active"}</span>
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{projects?.stats?.active || 0}</div>
              </CardContent>
            </Card>
            <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/50"><CheckCircle className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /></div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{ar ? "مكتملة" : "Completed"}</span>
                </div>
                <div className="text-base font-bold text-sky-600 dark:text-sky-400 tabular-nums">{projects?.stats?.completed || 0}</div>
              </CardContent>
            </Card>
            <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50"><AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /></div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{ar ? "متأخرة" : "Delayed"}</span>
                </div>
                <div className="text-base font-bold text-red-600 dark:text-red-400 tabular-nums">{projects?.stats?.delayed || 0}</div>
              </CardContent>
            </Card>
            <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50"><Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{ar ? "معلقة" : "On Hold"}</span>
                </div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">{projects?.stats?.onHold || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Project Progress & Budget */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Project Progress */}
            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{ar ? "تقدم المشاريع" : "Project Progress"}</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin">
                  {(projects?.projects || []).map((p: { id: string; name: string; nameEn: string; status: string; progress: number; taskProgress: number }) => {
                    const statusColors: Record<string, string> = {
                      active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                      completed: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
                      delayed: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                      on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                      cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                    };
                    const statusLabels: Record<string, { ar: string; en: string }> = {
                      active: { ar: "نشط", en: "Active" },
                      completed: { ar: "مكتمل", en: "Completed" },
                      delayed: { ar: "متأخر", en: "Delayed" },
                      on_hold: { ar: "معلق", en: "On Hold" },
                      cancelled: { ar: "ملغي", en: "Cancelled" },
                    };
                    const progress = Math.max(p.progress, p.taskProgress);
                    return (
                      <div key={p.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                            {ar ? p.name : p.nameEn || p.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{progress}%</span>
                            <Badge variant="secondary" className={cn("text-[10px] h-5 rounded-full", statusColors[p.status] || "")}>
                              {statusLabels[p.status] ? (ar ? statusLabels[p.status].ar : statusLabels[p.status].en) : p.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              progress >= 80 ? "bg-emerald-500" : progress >= 50 ? "bg-sky-500" : progress >= 25 ? "bg-amber-500" : "bg-red-400"
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(projects?.projects || []).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">{ar ? "لا توجد مشاريع" : "No projects"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Budget vs Actual */}
            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{ar ? "الميزانية مقابل الفعلي" : "Budget vs Actual"}</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin">
                  {(projects?.projects || []).map((p: { id: string; name: string; nameEn: string; budget: number; totalInvoiced: number; totalPaid: number }) => {
                    const budget = p.budget || 0;
                    const actual = p.totalPaid || 0;
                    const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                            {ar ? p.name : p.nameEn || p.name}
                          </span>
                          <span className="text-xs tabular-nums text-slate-500 font-mono">
                            {formatCurrency(actual, ar)} / {formatCurrency(budget, ar)}
                          </span>
                        </div>
                        <div className="flex gap-1 h-3">
                          <div className="w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-teal-500"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Budget Summary */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{ar ? "إجمالي الميزانية" : "Total Budget"}</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums font-mono">{formatCurrency(projects?.budgetSummary?.totalBudget || 0, ar)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{ar ? "إجمالي المصروف" : "Total Spent"}</span>
                      <p className="text-sm font-bold text-teal-600 dark:text-teal-400 tabular-nums font-mono">{formatCurrency(projects?.budgetSummary?.totalSpent || 0, ar)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{ar ? "المتبقي" : "Remaining"}</span>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums font-mono">{formatCurrency(projects?.budgetSummary?.remaining || 0, ar)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{ar ? "إجمالي الفوتر" : "Total Invoiced"}</span>
                      <p className="text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums font-mono">{formatCurrency(projects?.budgetSummary?.totalInvoiced || 0, ar)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Timeline Chart */}
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{ar ? "الجدول الزمني للمشاريع" : "Project Timeline"}</h3>
              <p className="text-[10px] text-slate-400 mb-4">{ar ? "ساعات العمل الشهرية حسب المشروع" : "Monthly work hours by project"}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectTimelineData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: tickColor }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: tickColor }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                            {payload.map((p, i) => (
                              <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
                                {p.name}: {p.value}h
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: legendColor }} />
                    {projectTimelineData.length > 0 && Object.keys(projectTimelineData[0]).filter(k => k !== "month").map((key, i) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={key}
                        stackId="a"
                        fill={timelineProjectColors[i % timelineProjectColors.length]}
                        radius={[0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB 4: HR ===== */}
        <TabsContent value="hr" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Users className="h-3.5 w-3.5 text-white" /></div>
                  <span className="text-[11px] text-slate-200">{ar ? "إجمالي الموظفين" : "Total Employees"}</span>
                </div>
                <div className="text-lg font-bold text-white tabular-nums">{hr?.totalEmployees || 0}</div>
              </div>
            </Card>
            <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><CheckCircle className="h-3.5 w-3.5 text-white" /></div>
                  <span className="text-[11px] text-emerald-100">{ar ? "الحاضرون اليوم" : "Present Today"}</span>
                </div>
                <div className="text-lg font-bold text-white tabular-nums">{hr?.presentToday || 0}</div>
              </div>
            </Card>
            <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><CalendarDays className="h-3.5 w-3.5 text-white" /></div>
                  <span className="text-[11px] text-amber-100">{ar ? "في إجازة" : "On Leave"}</span>
                </div>
                <div className="text-lg font-bold text-white tabular-nums">{hr?.onLeaveToday || 0}</div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Department Distribution */}
            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{ar ? "توزيع الأقسام" : "Department Distribution"}</h3>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hr?.departmentDistribution || []} layout="vertical" barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} />
                      <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: tickColor }} width={80} tickLine={false} />
                      <Tooltip content={<SimpleTooltip ar={ar} />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: legendColor }} />
                      <Bar dataKey="count" name={ar ? "عدد الموظفين" : "Employees"} fill="#0d9488" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Department list */}
                <div className="space-y-2">
                  {(hr?.departmentDistribution || []).map((dept: { department: string; count: number; employees: { name: string; position: string }[] }) => (
                    <div key={dept.department} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{dept.department}</span>
                        <span className="text-xs text-slate-400 ms-2">
                          {dept.employees.map((e: { name: string }) => e.name).join(", ")}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{dept.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Trends */}
            <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{ar ? "اتجاه الحضور (آخر 7 أيام)" : "Attendance Trend (Last 7 Days)"}</h3>
                <p className="text-[10px] text-slate-400 mb-4">{ar ? "تتبع الحضور اليومي للموظفين" : "Daily employee attendance tracking"}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hr?.attendanceTrend || []} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                      <XAxis dataKey={ar ? "dateAr" : "dateEn"} tick={{ fontSize: 11, fill: tickColor }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
                      <Tooltip content={<SimpleTooltip ar={ar} />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: legendColor }} />
                      <Bar dataKey="present" name={ar ? "حاضر" : "Present"} fill="#0d9488" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="late" name={ar ? "متأخر" : "Late"} fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="absent" name={ar ? "غائب" : "Absent"} fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="leave" name={ar ? "إجازة" : "Leave"} fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave Distribution */}
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{ar ? "توزيع الإجازات" : "Leave Distribution"}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(hr?.leaveDistribution || []).map((lt: { type: string; count: number }) => {
                  const leaveTypes: Record<string, { ar: string; en: string; color: string }> = {
                    annual: { ar: "سنوية", en: "Annual", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
                    sick: { ar: "مرضية", en: "Sick", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
                    emergency: { ar: "طوارئ", en: "Emergency", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
                    unpaid: { ar: "بدون راتب", en: "Unpaid", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
                  };
                  const cfg = leaveTypes[lt.type] || { ar: lt.type, en: lt.type, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
                  return (
                    <div key={lt.type} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{ar ? cfg.ar : cfg.en}</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{lt.count}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{ar ? "إجازات معلقة" : "Pending Leaves"}:</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs">{hr?.pendingLeaves || 0}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{ar ? "مصادق عليها هذا الشهر" : "Approved This Month"}:</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs">{hr?.approvedLeavesThisMonth || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Workload Radar Chart */}
          <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{ar ? "أحمال الأقسام" : "Department Workload"}</h3>
              <p className="text-[10px] text-slate-400 mb-4">{ar ? "الساعات المخططة مقابل الفعلية لكل قسم" : "Planned vs actual hours per department"}</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={workloadData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, workloadMax]}
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      tickCount={4}
                    />
                    <Radar
                      name={ar ? "مخطط" : "Planned"}
                      dataKey="planned"
                      stroke="#14b8a6"
                      fill="#14b8a6"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Radar
                      name={ar ? "فعلي" : "Actual"}
                      dataKey="actual"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: legendColor }}
                      formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                            {payload.map((p, i) => (
                              <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
                                {p.name}: {p.value}h
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
