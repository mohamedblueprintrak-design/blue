"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastFeedback } from "@/hooks/use-toast-feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  FileText,
  CreditCard,
  ShoppingCart,
  RefreshCw,
  CalendarOff,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus,
  Eye,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Loader2,
  AlertCircle,
  CircleDot,
  Check,
  SkipForward,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Types =====
interface Approval {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  status: string;
  requestedBy: string;
  assignedTo: string;
  step: number;
  totalSteps: number;
  amount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Helpers =====
function formatCurrency(amount: number, ar: boolean) {
  return `${amount.toLocaleString(ar ? "ar-AE" : "en-US")} ${ar ? "د.إ" : "AED"}`;
}

function timeAgo(dateStr: string, ar: boolean): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (ar) {
    if (minutes < 1) return "الآن";
    if (minutes === 1) return "منذ دقيقة";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours === 1) return "منذ ساعة";
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days === 1) return "أمس";
    if (days < 7) return `منذ ${days} يوم`;
    return new Date(dateStr).toLocaleDateString("ar-AE");
  }
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US");
}

function getEntityTypeIcon(type: string) {
  switch (type) {
    case "invoice": return FileText;
    case "payment": return CreditCard;
    case "purchase_order": return ShoppingCart;
    case "change_order": return RefreshCw;
    case "leave": return CalendarOff;
    default: return FileText;
  }
}

function getEntityTypeBadgeColor(type: string) {
  const colors: Record<string, string> = {
    invoice: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    payment: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    purchase_order: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    change_order: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    leave: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  };
  return colors[type] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function getEntityTypeLabel(type: string, ar: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    invoice: { ar: "فاتورة", en: "Invoice" },
    payment: { ar: "دفعة", en: "Payment" },
    purchase_order: { ar: "أمر شراء", en: "Purchase Order" },
    change_order: { ar: "أمر تغيير", en: "Change Order" },
    leave: { ar: "إجازة", en: "Leave" },
  };
  return labels[type]?.[ar ? "ar" : "en"] || type;
}

function getStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string; bgColor: string; dot: string }> = {
    pending: { ar: "معلّقة", en: "Pending", color: "text-amber-700 dark:text-amber-300", bgColor: "bg-amber-100 dark:bg-amber-900/40", dot: "bg-amber-500" },
    approved: { ar: "معتمدة", en: "Approved", color: "text-emerald-700 dark:text-emerald-300", bgColor: "bg-emerald-100 dark:bg-emerald-900/40", dot: "bg-emerald-500" },
    rejected: { ar: "مرفوضة", en: "Rejected", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/40", dot: "bg-red-500" },
    cancelled: { ar: "ملغاة", en: "Cancelled", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800/40", dot: "bg-slate-400" },
  };
  return configs[status] || configs.pending;
}

function getHashColor(name: string): string {
  const colors = [
    "bg-teal-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500",
    "bg-violet-500", "bg-rose-500", "bg-sky-500", "bg-lime-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getHashRing(name: string): string {
  const colors = [
    "ring-teal-200 dark:ring-teal-800",
    "ring-cyan-200 dark:ring-cyan-800",
    "ring-emerald-200 dark:ring-emerald-800",
    "ring-amber-200 dark:ring-amber-800",
    "ring-violet-200 dark:ring-violet-800",
    "ring-rose-200 dark:ring-rose-800",
    "ring-sky-200 dark:ring-sky-800",
    "ring-lime-200 dark:ring-lime-800",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ===== Filter Config =====
const statusFilterTabs = ["all", "pending", "approved", "rejected", "cancelled"] as const;
type StatusFilterTab = (typeof statusFilterTabs)[number];

function getFilterLabel(tab: StatusFilterTab, ar: boolean) {
  const labels: Record<StatusFilterTab, { ar: string; en: string }> = {
    all: { ar: "الكل", en: "All" },
    pending: { ar: "معلّقة", en: "Pending" },
    approved: { ar: "معتمدة", en: "Approved" },
    rejected: { ar: "مرفوضة", en: "Rejected" },
    cancelled: { ar: "ملغاة", en: "Cancelled" },
  };
  return labels[tab][ar ? "ar" : "en"];
}

const entityFilters = ["all", "invoice", "payment", "purchase_order", "change_order", "leave"] as const;
type EntityFilter = (typeof entityFilters)[number];

function getEntityFilterLabel(f: EntityFilter, ar: boolean) {
  if (f === "all") return ar ? "الكل" : "All";
  return getEntityTypeLabel(f, ar);
}

const dateFilters = ["all", "week", "month", "quarter"] as const;
type DateFilter = (typeof dateFilters)[number];

function getDateFilterLabel(f: DateFilter, ar: boolean) {
  const labels: Record<DateFilter, { ar: string; en: string }> = {
    all: { ar: "الكل", en: "All Time" },
    week: { ar: "هذا الأسبوع", en: "This Week" },
    month: { ar: "هذا الشهر", en: "This Month" },
    quarter: { ar: "هذا الربع", en: "This Quarter" },
  };
  return labels[f][ar ? "ar" : "en"];
}

function getDateThreshold(f: DateFilter): number | null {
  const now = Date.now();
  switch (f) {
    case "week": return now - 7 * 86400000;
    case "month": return now - 30 * 86400000;
    case "quarter": return now - 90 * 86400000;
    default: return null;
  }
}

// ===== Mock users for assigned-to dropdown =====
const mockUsers = [
  { id: "u1", name: "أحمد المنصوري", nameEn: "Ahmed Al Mansouri" },
  { id: "u2", name: "سارة الحربي", nameEn: "Sara Al Harbi" },
  { id: "u3", name: "محمد الشامسي", nameEn: "Mohammed Al Shamsi" },
  { id: "u4", name: "فاطمة الكعبي", nameEn: "Fatima Al Kaabi" },
  { id: "u5", name: "خالد الرشيدي", nameEn: "Khalid Al Rashidi" },
];

// ===== Main Component =====
interface ApprovalsPageProps {
  language: "ar" | "en";
}

export default function ApprovalsPage({ language }: ApprovalsPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar });

  // Filter states
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterTab>("all");
  const [activeEntityFilter, setActiveEntityFilter] = useState<EntityFilter>("all");
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilter>("all");

  // UI states
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [requestInfoId, setRequestInfoId] = useState<string | null>(null);
  const [requestInfoText, setRequestInfoText] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    entityType: "",
    entityId: "",
    title: "",
    description: "",
    assignedTo: "",
    totalSteps: "1",
    amount: "",
    priority: "normal",
  });

  // Fetch pending count
  const { data: pendingData } = useQuery({
    queryKey: ["approvals-pending-count"],
    queryFn: async () => {
      const res = await fetch("/api/approvals/pending");
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    refetchInterval: 30000,
  });
  const pendingCount = pendingData?.count ?? 0;

  // Fetch all approvals (client-side filtering)
  const { data: approvals = [], isLoading } = useQuery<Approval[]>({
    queryKey: ["approvals"],
    queryFn: async () => {
      const res = await fetch("/api/approvals");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch single approval for detail panel
  const { data: selectedApproval } = useQuery<Approval>({
    queryKey: ["approval-detail", selectedApprovalId],
    queryFn: async () => {
      if (!selectedApprovalId) return null;
      const res = await fetch(`/api/approvals/${selectedApprovalId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedApprovalId,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", notes }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["approval-detail"] });
      toast.showSuccess(ar ? "تمت الموافقة" : "Approved");
    },
    onError: () => toast.error(ar ? "الموافقة" : "Approve"),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", notes }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["approval-detail"] });
      setRejectingId(null);
      setRejectReason("");
      toast.showSuccess(ar ? "تم الرفض" : "Rejected");
    },
    onError: () => toast.error(ar ? "الرفض" : "Reject"),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: data.entityType,
          entityId: data.entityId || "new",
          title: data.title,
          description: data.description,
          requestedBy: ar ? "أحمد المنصوري" : "Ahmed Al Mansouri",
          assignedTo: data.assignedTo,
          totalSteps: parseInt(data.totalSteps) || 1,
          step: 1,
          amount: parseFloat(data.amount) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-pending-count"] });
      setShowCreateDialog(false);
      setCreateForm({
        entityType: "",
        entityId: "",
        title: "",
        description: "",
        assignedTo: "",
        totalSteps: "1",
        amount: "",
        priority: "normal",
      });
      toast.created(ar ? "طلب موافقة" : "Approval request");
    },
    onError: () => toast.error(ar ? "إنشاء طلب الموافقة" : "Create approval request"),
  });

  // ===== Computed values =====
  const dateThreshold = getDateThreshold(activeDateFilter);

  const filteredApprovals = useMemo(() => {
    let result = approvals;

    // Status filter
    if (activeStatusFilter !== "all") {
      result = result.filter((a) => a.status === activeStatusFilter);
    }

    // Entity type filter
    if (activeEntityFilter !== "all") {
      result = result.filter((a) => a.entityType === activeEntityFilter);
    }

    // Date filter
    if (dateThreshold) {
      result = result.filter((a) => new Date(a.createdAt).getTime() >= dateThreshold);
    }

    return result;
  }, [approvals, activeStatusFilter, activeEntityFilter, dateThreshold]);

  // Summary stats
  const totalCount = approvals.length;
  const pendingItems = approvals.filter((a) => a.status === "pending");
  const approvedItems = approvals.filter((a) => a.status === "approved");
  const rejectedItems = approvals.filter((a) => a.status === "rejected");

  // This month approved
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const approvedThisMonth = approvedItems.filter((a) => new Date(a.updatedAt).getTime() >= monthStart);

  // Status counts for filter tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: totalCount, pending: pendingItems.length, approved: approvedItems.length, rejected: rejectedItems.length, cancelled: approvals.filter((a) => a.status === "cancelled").length };
    return counts;
  }, [totalCount, pendingItems.length, approvedItems.length, rejectedItems.length, approvals]);

  // ===== Loading State =====
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ===== HEADER SECTION ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/20">
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {ar ? "مركز الموافقات" : "Approval Center"}
              </h2>
              {pendingCount > 0 && (
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <Badge className="relative bg-amber-500 text-white text-[10px] h-5 min-w-[20px] px-1.5 border-0 flex items-center justify-center">
                    {pendingCount}
                  </Badge>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {ar
                ? `${totalCount} طلب موافقة · ${pendingCount} بانتظار الإجراء`
                : `${totalCount} approval requests · ${pendingCount} pending action`}
            </p>
          </div>
        </div>

        {/* New Approval Request Button */}
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm shadow-md shadow-teal-500/20 border-0 h-9 px-4"
        >
          <Plus className="h-4 w-4" />
          {ar ? "طلب موافقة جديد" : "New Approval Request"}
        </Button>
      </div>

      {/* ===== SUMMARY STAT CARDS (4 in a row) ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Approvals */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden rounded-xl hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-default">
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-600 dark:to-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <ClipboardCheck className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="flex items-center gap-0.5 text-[10px] text-slate-200">
                <Minus className="h-2.5 w-2.5" />
                {ar ? "ثابت" : "Stable"}
              </span>
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">{totalCount}</div>
            <p className="text-[11px] text-slate-200 mt-0.5">{ar ? "إجمالي الموافقات" : "Total Approvals"}</p>
          </div>
        </Card>

        {/* Pending */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden rounded-xl hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-default">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 p-4 relative">
            {pendingCount > 0 && (
              <div className="absolute top-3 right-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5 text-white" />
              </div>
              {pendingCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-100">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {ar ? "بحاجة إجراء" : "Needs action"}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">{pendingCount}</div>
            <p className="text-[11px] text-amber-100 mt-0.5">{ar ? "بانتظار الموافقة" : "Pending"}</p>
          </div>
        </Card>

        {/* Approved This Month */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden rounded-xl hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-default">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-100">
                <TrendingUp className="h-2.5 w-2.5" />
                {ar ? "هذا الشهر" : "This month"}
              </span>
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">{approvedThisMonth.length}</div>
            <p className="text-[11px] text-emerald-100 mt-0.5">{ar ? "معتمدة هذا الشهر" : "Approved This Month"}</p>
          </div>
        </Card>

        {/* Rejected */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden rounded-xl hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-default">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <XCircle className="h-3.5 w-3.5 text-white" />
              </div>
              {rejectedItems.length > 0 ? (
                <span className="flex items-center gap-0.5 text-[10px] text-red-100">
                  <TrendingDown className="h-2.5 w-2.5" />
                  {rejectedItems.length}
                </span>
              ) : (
                <span className="text-[10px] text-red-100">{ar ? "لا يوجد" : "None"}</span>
              )}
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">{rejectedItems.length}</div>
            <p className="text-[11px] text-red-100 mt-0.5">{ar ? "مرفوضة" : "Rejected"}</p>
          </div>
        </Card>
      </div>

      {/* ===== STATUS FILTER TABS ===== */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 gap-0.5 overflow-x-auto scrollbar-none">
        {statusFilterTabs.map((tab) => {
          const isActive = activeStatusFilter === tab;
          const count = statusCounts[tab] || 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveStatusFilter(tab)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                isActive
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {tab === "pending" && pendingCount > 0 && isActive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
              )}
              {getFilterLabel(tab, ar)}
              {count > 0 && (
                <span className={cn(
                  "h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                  isActive
                    ? tab === "pending"
                      ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                      : tab === "approved"
                        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                        : tab === "rejected"
                          ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                          : "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===== FILTER ROW (Entity Type + Date Range) ===== */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Entity type filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {entityFilters.map((f) => {
            const isActive = activeEntityFilter === f;
            const Icon = f === "all" ? ClipboardCheck : getEntityTypeIcon(f);
            return (
              <button
                key={f}
                onClick={() => setActiveEntityFilter(f)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 shrink-0",
                  isActive
                    ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <Icon className="h-3 w-3" />
                {getEntityFilterLabel(f, ar)}
              </button>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Date range filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {dateFilters.map((f) => {
            const isActive = activeDateFilter === f;
            return (
              <button
                key={f}
                onClick={() => setActiveDateFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 shrink-0 border",
                  isActive
                    ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {getDateFilterLabel(f, ar)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== APPROVAL CARDS LIST ===== */}
      {filteredApprovals.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-5">
            <ClipboardCheck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {ar ? "لا توجد طلبات موافقة" : "No approvals found"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
            {ar
              ? "لا توجد طلبات تطابق الفلاتر المحددة. جرّب تغيير الفلاتر أو أنشئ طلب جديد."
              : "No approval requests match the selected filters. Try changing filters or create a new request."}
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0 shadow-md shadow-teal-500/20"
          >
            <Plus className="h-4 w-4" />
            {ar ? "إنشاء طلب جديد" : "Create New Request"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-460px)] overflow-y-auto custom-scrollbar pr-1">
          {filteredApprovals.map((approval) => {
            const TypeIcon = getEntityTypeIcon(approval.entityType);
            const sc = getStatusConfig(approval.status);
            const isPending = approval.status === "pending";
            const showRejectForm = rejectingId === approval.id;
            const showInfoForm = requestInfoId === approval.id;
            const progressPct = approval.totalSteps > 1
              ? approval.status === "approved"
                ? 100
                : (approval.step / approval.totalSteps) * 100
              : approval.status === "approved" ? 100 : 50;

            return (
              <Card
                key={approval.id}
                className={cn(
                  "border rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden",
                  isPending && "border-amber-200 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700",
                  approval.status === "approved" && "border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700",
                  approval.status === "rejected" && "border-red-200 dark:border-red-800/40 hover:border-red-300 dark:hover:border-red-700",
                  approval.status === "cancelled" && "border-slate-200 dark:border-slate-700/50",
                )}
                onClick={() => setSelectedApprovalId(approval.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Entity Type Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      isPending && "bg-amber-100 dark:bg-amber-900/30",
                      approval.status === "approved" && "bg-emerald-100 dark:bg-emerald-900/30",
                      approval.status === "rejected" && "bg-red-100 dark:bg-red-900/30",
                      approval.status === "cancelled" && "bg-slate-100 dark:bg-slate-800/50",
                    )}>
                      <TypeIcon className={cn(
                        "h-5 w-5",
                        isPending && "text-amber-600 dark:text-amber-400",
                        approval.status === "approved" && "text-emerald-600 dark:text-emerald-400",
                        approval.status === "rejected" && "text-red-600 dark:text-red-400",
                        approval.status === "cancelled" && "text-slate-500 dark:text-slate-400",
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Badges Row */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                          getEntityTypeBadgeColor(approval.entityType)
                        )}>
                          {getEntityTypeLabel(approval.entityType, ar)}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                          sc.bgColor, sc.color
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                          {ar ? sc.ar : sc.en}
                        </span>
                        {isPending && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 ms-auto">
                          {timeAgo(approval.createdAt, ar)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 truncate">
                        {approval.title}
                      </h3>

                      {/* Description */}
                      {approval.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
                          {approval.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-2.5">
                        {/* Requested By */}
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 ring-2 ring-white dark:ring-slate-900", getHashColor(approval.requestedBy))}>
                            {approval.requestedBy.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {ar ? "الطالب" : "From"}: {approval.requestedBy}
                          </span>
                        </div>

                        {/* Assigned To */}
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 ring-2 ring-white dark:ring-slate-900", getHashColor(approval.assignedTo))}>
                            {approval.assignedTo.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {ar ? "المسند إليه" : "To"}: {approval.assignedTo}
                          </span>
                        </div>

                        {/* Amount */}
                        {approval.amount > 0 && (
                          <span className="text-[11px] font-mono tabular-nums font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-md">
                            {formatCurrency(approval.amount, ar)}
                          </span>
                        )}
                      </div>

                      {/* Step Progress */}
                      {approval.totalSteps > 1 && (
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {ar ? `الخطوة ${approval.step} من ${approval.totalSteps}` : `Step ${approval.step} of ${approval.totalSteps}`}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden max-w-[140px]">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                approval.status === "approved" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                                approval.status === "rejected" ? "bg-red-500" :
                                "bg-gradient-to-r from-amber-400 to-amber-500"
                              )}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          {/* Mini step indicators */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: approval.totalSteps }, (_, i) => i + 1).map((s) => (
                              <div
                                key={s}
                                className={cn(
                                  "w-2 h-2 rounded-full transition-colors",
                                  approval.status === "approved"
                                    ? "bg-emerald-500"
                                    : approval.status === "rejected"
                                      ? s <= approval.step ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"
                                      : s < approval.step
                                        ? "bg-emerald-500"
                                        : s === approval.step
                                          ? "bg-amber-500"
                                          : "bg-slate-200 dark:bg-slate-700"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes (non-pending) */}
                      {approval.notes && !isPending && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 mb-2.5 border border-slate-100 dark:border-slate-800">
                          <span className="font-semibold">{ar ? "ملاحظات" : "Notes"}: </span>
                          {approval.notes}
                        </div>
                      )}

                      {/* Reject Form */}
                      {showRejectForm && (
                        <div className="mb-3 space-y-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/40">
                          <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={ar ? "سبب الرفض..." : "Reason for rejection..."}
                            className="text-xs h-20 resize-none rounded-lg border-red-200 dark:border-red-800/40 focus-visible:ring-red-300"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-7 bg-red-600 hover:bg-red-700 text-white text-xs border-0"
                              disabled={!rejectReason.trim() || rejectMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectMutation.mutate({ id: approval.id, notes: rejectReason });
                              }}
                            >
                              {rejectMutation.isPending ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <XCircle className="h-3 w-3 me-1" />}
                              {ar ? "تأكيد الرفض" : "Confirm Reject"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                            >
                              {ar ? "إلغاء" : "Cancel"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Request Info Form */}
                      {showInfoForm && (
                        <div className="mb-3 space-y-2 p-3 bg-sky-50 dark:bg-sky-900/10 rounded-lg border border-sky-200 dark:border-sky-800/40">
                          <Textarea
                            value={requestInfoText}
                            onChange={(e) => setRequestInfoText(e.target.value)}
                            placeholder={ar ? "المعلومات المطلوبة..." : "Information requested..."}
                            className="text-xs h-20 resize-none rounded-lg border-sky-200 dark:border-sky-800/40 focus-visible:ring-sky-300"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-7 bg-sky-600 hover:bg-sky-700 text-white text-xs border-0"
                              disabled={!requestInfoText.trim()}
                              onClick={(e) => {
                                e.stopPropagation();
                                approveMutation.mutate({
                                  id: approval.id,
                                  notes: requestInfoText,
                                });
                                setRequestInfoId(null);
                                setRequestInfoText("");
                              }}
                            >
                              <MessageSquare className="h-3 w-3 me-1" />
                              {ar ? "إرسال" : "Send"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRequestInfoId(null);
                                setRequestInfoText("");
                              }}
                            >
                              {ar ? "إلغاء" : "Cancel"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isPending && !showRejectForm && !showInfoForm && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-sm shadow-emerald-600/20 border-0 gap-1"
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate({ id: approval.id })}
                            >
                              {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                              {ar ? "موافقة" : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 bg-red-600 hover:bg-red-700 text-white text-xs shadow-sm shadow-red-600/20 border-0 gap-1"
                              onClick={() => setRejectingId(approval.id)}
                            >
                              <XCircle className="h-3 w-3" />
                              {ar ? "رفض" : "Reject"}
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 bg-sky-600 hover:bg-sky-700 text-white text-xs shadow-sm shadow-sky-600/20 border-0 gap-1"
                              onClick={() => setRequestInfoId(approval.id)}
                            >
                              <MessageSquare className="h-3 w-3" />
                              {ar ? "طلب معلومات" : "Request Info"}
                            </Button>
                          </>
                        )}
                        {!isPending && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            onClick={() => setSelectedApprovalId(approval.id)}
                          >
                            <Eye className="h-3 w-3" />
                            {ar ? "عرض التفاصيل" : "View Details"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== CREATE APPROVAL DIALOG ===== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              {ar ? "طلب موافقة جديد" : "New Approval Request"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {ar ? "أنشئ طلب موافقة جديد للمراجعة والموافقة" : "Create a new approval request for review"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Entity Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {ar ? "نوع الكيان" : "Entity Type"} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={createForm.entityType}
                onValueChange={(v) => setCreateForm((prev) => ({ ...prev, entityType: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={ar ? "اختر النوع..." : "Select type..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">{ar ? "فاتورة" : "Invoice"}</SelectItem>
                  <SelectItem value="payment">{ar ? "دفعة" : "Payment"}</SelectItem>
                  <SelectItem value="purchase_order">{ar ? "أمر شراء" : "Purchase Order"}</SelectItem>
                  <SelectItem value="change_order">{ar ? "أمر تغيير" : "Change Order"}</SelectItem>
                  <SelectItem value="leave">{ar ? "إجازة" : "Leave"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {ar ? "العنوان" : "Title"} <span className="text-red-500">*</span>
              </Label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={ar ? "عنوان طلب الموافقة..." : "Approval request title..."}
                className="text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {ar ? "الوصف" : "Description"}
              </Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={ar ? "وصف تفصيلي للطلب..." : "Detailed description..."}
                className="text-sm h-20 resize-none"
              />
            </div>

            {/* Assigned To + Steps - side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {ar ? "المسند إليه" : "Assigned To"} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={createForm.assignedTo}
                  onValueChange={(v) => setCreateForm((prev) => ({ ...prev, assignedTo: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={ar ? "اختر..." : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white", getHashColor(u.name))}>
                            {u.name.charAt(0)}
                          </div>
                          {ar ? u.name : u.nameEn}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {ar ? "عدد خطوات الموافقة" : "Approval Steps"}
                </Label>
                <Select
                  value={createForm.totalSteps}
                  onValueChange={(v) => setCreateForm((prev) => ({ ...prev, totalSteps: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{ar ? "خطوة واحدة" : "1 Step"}</SelectItem>
                    <SelectItem value="2">{ar ? "خطوتان" : "2 Steps"}</SelectItem>
                    <SelectItem value="3">{ar ? "3 خطوات" : "3 Steps"}</SelectItem>
                    <SelectItem value="4">{ar ? "4 خطوات" : "4 Steps"}</SelectItem>
                    <SelectItem value="5">{ar ? "5 خطوات" : "5 Steps"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {ar ? "المبلغ (د.إ)" : "Amount (AED)"}
              </Label>
              <Input
                type="number"
                value={createForm.amount}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder={ar ? "0.00" : "0.00"}
                className="text-sm font-mono tabular-nums"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {ar ? "الأولوية" : "Priority"}
              </Label>
              <div className="flex items-center gap-2">
                {(["low", "normal", "high", "urgent"] as const).map((p) => {
                  const pLabels: Record<string, { ar: string; en: string }> = {
                    low: { ar: "منخفضة", en: "Low" },
                    normal: { ar: "عادية", en: "Normal" },
                    high: { ar: "عالية", en: "High" },
                    urgent: { ar: "عاجل", en: "Urgent" },
                  };
                  const pColors: Record<string, string> = {
                    low: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
                    normal: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800",
                    high: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                    urgent: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
                  };
                  const isActive = createForm.priority === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setCreateForm((prev) => ({ ...prev, priority: p }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border",
                        isActive
                          ? cn(pColors[p], "ring-2 ring-offset-1 ring-current dark:ring-offset-slate-900 scale-[1.02]")
                          : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      {p === "urgent" && <AlertCircle className="h-3 w-3 inline me-1" />}
                      {pLabels[p][ar ? "ar" : "en"]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="text-sm"
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={!createForm.entityType || !createForm.title || !createForm.assignedTo || createMutation.isPending}
              className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0 shadow-md shadow-teal-500/20 text-sm"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {ar ? "إنشاء الطلب" : "Create Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== APPROVAL DETAIL PANEL (Slide-out from right) ===== */}
      <Sheet open={!!selectedApprovalId} onOpenChange={(open) => !open && setSelectedApprovalId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 overflow-hidden">
          {selectedApproval && (
            <>
              {/* Gradient Header */}
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-5 text-white">
                <SheetHeader className="text-start space-y-0">
                  <SheetTitle className="text-white text-base font-bold">{selectedApproval.title}</SheetTitle>
                  <SheetDescription className="text-slate-300 text-xs mt-1">
                    {selectedApproval.description || (ar ? "لا يوجد وصف" : "No description")}
                  </SheetDescription>
                </SheetHeader>

                {/* Status + Type badges */}
                <div className="flex items-center gap-2 mt-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    getEntityTypeBadgeColor(selectedApproval.entityType)
                  )}>
                    {getEntityTypeLabel(selectedApproval.entityType, ar)}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    getStatusConfig(selectedApproval.status).bgColor,
                    getStatusConfig(selectedApproval.status).color
                  )}>
                    {ar ? getStatusConfig(selectedApproval.status).ar : getStatusConfig(selectedApproval.status).en}
                  </span>
                  {selectedApproval.amount > 0 && (
                    <span className="ms-auto text-xs font-mono tabular-nums font-medium text-emerald-300">
                      {formatCurrency(selectedApproval.amount, ar)}
                    </span>
                  )}
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="p-4 space-y-5">
                  {/* Key Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{ar ? "الطالب" : "Requested By"}</p>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white", getHashColor(selectedApproval.requestedBy))}>
                          {selectedApproval.requestedBy.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-900 dark:text-white truncate">{selectedApproval.requestedBy}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{ar ? "المسند إليه" : "Assigned To"}</p>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white", getHashColor(selectedApproval.assignedTo))}>
                          {selectedApproval.assignedTo.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-900 dark:text-white truncate">{selectedApproval.assignedTo}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{ar ? "تاريخ الإنشاء" : "Created"}</p>
                      <span className="text-xs font-medium text-slate-900 dark:text-white">
                        {new Date(selectedApproval.createdAt).toLocaleDateString(ar ? "ar-AE" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{ar ? "آخر تحديث" : "Updated"}</p>
                      <span className="text-xs font-medium text-slate-900 dark:text-white">
                        {timeAgo(selectedApproval.updatedAt, ar)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* ===== APPROVAL CHAIN VISUALIZATION ===== */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-teal-500" />
                      {ar ? "سلسلة الموافقة" : "Approval Chain"}
                    </h4>

                    <div className="relative">
                      {/* Vertical timeline line */}
                      {selectedApproval.totalSteps > 1 && (
                        <div className="absolute start-3 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700" />
                      )}

                      <div className="space-y-0">
                        {Array.from({ length: selectedApproval.totalSteps }, (_, i) => i + 1).map((stepNum) => {
                          // Determine step status
                          let stepStatus: "completed" | "current" | "pending" | "rejected" = "pending";
                          if (selectedApproval.status === "approved") {
                            stepStatus = "completed";
                          } else if (selectedApproval.status === "rejected" && stepNum === selectedApproval.step) {
                            stepStatus = "rejected";
                          } else if (stepNum < selectedApproval.step) {
                            stepStatus = "completed";
                          } else if (stepNum === selectedApproval.step) {
                            stepStatus = selectedApproval.status === "rejected" ? "rejected" : "current";
                          }

                          const stepLabels: Record<string, { ar: string; en: string }> = {
                            1: { ar: "المراجعة الأولى", en: "First Review" },
                            2: { ar: "الموافقة الإدارية", en: "Management Approval" },
                            3: { ar: "المراجعة المالية", en: "Financial Review" },
                            4: { ar: "الموافقة النهائية", en: "Final Approval" },
                            5: { ar: "التوقيع النهائي", en: "Final Sign-off" },
                          };
                          const stepLabel = stepLabels[stepNum]?.[ar ? "ar" : "en"] || (ar ? `الخطوة ${stepNum}` : `Step ${stepNum}`);

                          return (
                            <div key={stepNum} className="flex items-start gap-3 py-2.5">
                              {/* Step circle */}
                              <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-bold border-2",
                                stepStatus === "completed" && "bg-emerald-500 border-emerald-500 text-white",
                                stepStatus === "current" && "bg-white dark:bg-slate-900 border-2 border-teal-500 text-teal-600 dark:text-teal-400 ring-2 ring-teal-200 dark:ring-teal-800",
                                stepStatus === "pending" && "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-400",
                                stepStatus === "rejected" && "bg-red-500 border-red-500 text-white",
                              )}>
                                {stepStatus === "completed" ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : stepStatus === "rejected" ? (
                                  <XCircle className="h-3.5 w-3.5" />
                                ) : stepStatus === "current" ? (
                                  <CircleDot className="h-3.5 w-3.5" />
                                ) : (
                                  stepNum
                                )}
                              </div>

                              {/* Step info */}
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className={cn(
                                  "text-xs font-semibold",
                                  stepStatus === "pending" && "text-slate-400 dark:text-slate-500",
                                  stepStatus === "current" && "text-teal-700 dark:text-teal-300",
                                  stepStatus === "completed" && "text-emerald-700 dark:text-emerald-300",
                                  stepStatus === "rejected" && "text-red-700 dark:text-red-300",
                                )}>
                                  {stepLabel}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {stepStatus === "completed" && (ar ? "تمت الموافقة" : "Approved")}
                                  {stepStatus === "current" && (ar ? `بانتظار ${selectedApproval.assignedTo}` : `Pending with ${selectedApproval.assignedTo}`)}
                                  {stepStatus === "pending" && (ar ? "بانتظار المرحلة السابقة" : "Awaiting previous step")}
                                  {stepStatus === "rejected" && (ar ? "مرفوضة" : "Rejected")}
                                </p>
                                {stepStatus === "completed" && (
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    {timeAgo(selectedApproval.updatedAt, ar)}
                                  </p>
                                )}
                              </div>

                              {/* Status badge */}
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-medium shrink-0 mt-0.5",
                                stepStatus === "completed" && "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                                stepStatus === "current" && "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
                                stepStatus === "pending" && "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                                stepStatus === "rejected" && "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
                              )}>
                                {stepStatus === "completed" && (ar ? "مكتمل" : "Done")}
                                {stepStatus === "current" && (ar ? "حالي" : "Current")}
                                {stepStatus === "pending" && (ar ? "في الانتظار" : "Waiting")}
                                {stepStatus === "rejected" && (ar ? "مرفوض" : "Rejected")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ===== NOTES / COMMENTS SECTION ===== */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-teal-500" />
                      {ar ? "الملاحظات" : "Notes & Comments"}
                    </h4>
                    {selectedApproval.notes ? (
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white", getHashColor(selectedApproval.assignedTo))}>
                            {selectedApproval.assignedTo.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {selectedApproval.assignedTo}
                          </span>
                          <span className="text-[10px] text-slate-400 ms-auto">
                            {timeAgo(selectedApproval.updatedAt, ar)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {selectedApproval.notes}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">{ar ? "لا توجد ملاحظات" : "No notes yet"}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* ===== ACTIVITY LOG ===== */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-teal-500" />
                      {ar ? "سجل النشاط" : "Activity Log"}
                    </h4>
                    <div className="space-y-2">
                      {/* Created event */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Plus className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">{selectedApproval.requestedBy}</span>
                            {" "}{ar ? "أنشأ طلب الموافقة" : "created the approval request"}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {timeAgo(selectedApproval.createdAt, ar)}
                          </p>
                        </div>
                      </div>

                      {/* Step progression events */}
                      {selectedApproval.step > 1 && selectedApproval.status !== "rejected" && (
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                            <SkipForward className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">{selectedApproval.assignedTo}</span>
                              {" "}{ar ? "أعتمد الخطوة" : "approved step"} {selectedApproval.step - 1}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {ar ? "تم التوجيه للخطوة التالية" : "Forwarded to next step"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Final status event */}
                      {selectedApproval.status === "approved" && (
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">{selectedApproval.assignedTo}</span>
                              {" "}{ar ? "أعتمد الطلب نهائياً" : "approved the request"}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {timeAgo(selectedApproval.updatedAt, ar)}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedApproval.status === "rejected" && (
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-0.5">
                            <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">{selectedApproval.assignedTo}</span>
                              {" "}{ar ? "رفض الطلب" : "rejected the request"}
                            </p>
                            {selectedApproval.notes && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                                &ldquo;{selectedApproval.notes}&rdquo;
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {timeAgo(selectedApproval.updatedAt, ar)}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedApproval.status === "cancelled" && (
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                            <Ban className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300">
                              {ar ? "تم إلغاء الطلب" : "Request was cancelled"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
