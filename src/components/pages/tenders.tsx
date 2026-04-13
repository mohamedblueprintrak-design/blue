"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastFeedback } from "@/hooks/use-toast-feedback";
import { useLang } from "@/hooks/use-lang";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Calendar,
  Building2,
  FileText,
  Gavel,
  Timer,
  TrendingUp,
  Trophy,
  XCircle,
  Clock,
  User,
  MapPin,
  Globe,
  Inbox,
  AlertCircle,
} from "lucide-react";

// ===== Types =====
interface TenderItem {
  id: string;
  tenderNumber: string;
  title: string;
  authority: string;
  projectType: string;
  description: string;
  estimatedBudget: number;
  currency: string;
  closingDate: string | null;
  submissionDate: string | null;
  qualifications: string;
  requiredDocs: string;
  status: string;
  winnerName: string;
  lostReason: string;
  competitorAnalysis: string;
  notes: string;
  source: string;
  sourceUrl: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUser: { id: string; name: string; email: string } | null;
  _count: { documents: number };
}

interface TenderDetail extends TenderItem {
  documents: TenderDoc[];
}

interface TenderDoc {
  id: string;
  tenderId: string;
  name: string;
  fileType: string;
  filePath: string;
  uploadedAt: string;
}

interface TendersResponse {
  tenders: TenderItem[];
  total: number;
  page: number;
  limit: number;
}

// ===== Helpers =====
function getStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string; pill: string }> = {
    identified: {
      ar: "مُحدّدة", en: "Identified",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      pill: "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300",
    },
    preparing: {
      ar: "قيد التحضير", en: "Preparing",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
      pill: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 dark:from-amber-900/50 dark:to-amber-800/50 dark:text-amber-300",
    },
    submitted: {
      ar: "مقدّمة", en: "Submitted",
      color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
      pill: "bg-gradient-to-r from-sky-100 to-sky-200 text-sky-700 dark:from-sky-900/50 dark:to-sky-800/50 dark:text-sky-300",
    },
    qualified: {
      ar: "مؤهّلة", en: "Qualified",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
      pill: "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/50 dark:to-purple-800/50 dark:text-purple-300",
    },
    won: {
      ar: "فُزنا", en: "Won",
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
      pill: "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 dark:from-emerald-900/50 dark:to-emerald-800/50 dark:text-emerald-300",
    },
    lost: {
      ar: "خسرنا", en: "Lost",
      color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      pill: "bg-gradient-to-r from-red-100 to-red-200 text-red-700 dark:from-red-900/50 dark:to-red-800/50 dark:text-red-300",
    },
  };
  return configs[status] || configs.identified;
}

function getAuthorityConfig(auth: string) {
  const configs: Record<string, { ar: string; en: string }> = {
    "rak_municipality": { ar: "بلدية رأس الخيمة", en: "RAK Municipality" },
    "rak_properties": { ar: "RAK Properties", en: "RAK Properties" },
    "al_hamra": { ar: "الحمراء", en: "Al Hamra" },
    "marjan": { ar: "مرجان", en: "Marjan" },
    "rakez": { ar: "RAKEZ", en: "RAKEZ" },
    "private": { ar: "خاصة", en: "Private" },
  };
  return configs[auth] || { ar: auth, en: auth };
}

function getProjectTypeLabel(type: string, ar: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    villa: { ar: "فيلا", en: "Villa" },
    building: { ar: "مبنى", en: "Building" },
    infrastructure: { ar: "بنية تحتية", en: "Infrastructure" },
    road: { ar: "طريق", en: "Road" },
    landscape: { ar: "تنسيق مواقع", en: "Landscape" },
  };
  return ar ? (labels[type]?.ar || type) : (labels[type]?.en || type);
}

// ===== Countdown Component =====
function ClosingCountdown({ closingDate, ar }: { closingDate: string | null; ar: boolean }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!closingDate) return null;

  const target = new Date(closingDate).getTime();
  const diffMs = target - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
        <XCircle className="h-3 w-3" />
        {ar ? `انتهى منذ ${Math.abs(diffDays)} يوم` : `${Math.abs(diffDays)}d overdue`}
      </span>
    );
  }

  if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 animate-pulse">
        <AlertCircle className="h-3 w-3" />
        {ar ? "ينتهي اليوم" : "Ends today"}
      </span>
    );
  }

  if (diffDays <= 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 animate-pulse">
        <Timer className="h-3 w-3" />
        {ar ? `${diffDays} يوم متبقي` : `${diffDays}d left`}
      </span>
    );
  }

  if (diffDays <= 14) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
        <Timer className="h-3 w-3" />
        {ar ? `${diffDays} يوم` : `${diffDays}d`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      <Timer className="h-3 w-3" />
      {ar ? `${diffDays} يوم` : `${diffDays}d`}
    </span>
  );
}

// ===== Empty Form =====
const emptyForm = {
  tenderNumber: "",
  title: "",
  authority: "",
  projectType: "villa",
  description: "",
  estimatedBudget: "0",
  currency: "AED",
  closingDate: "",
  submissionDate: "",
  qualifications: "",
  requiredDocs: "",
  status: "identified",
  winnerName: "",
  lostReason: "",
  competitorAnalysis: "",
  notes: "",
  source: "",
  sourceUrl: "",
  assignedTo: "",
};

// ===== Main Tenders Component =====
interface TendersPageProps {
  language: "ar" | "en";
}

export default function TendersPage({ language }: TendersPageProps) {
  const _ar = language === "ar";
  const lang = useLang();
  const isAr = lang === "ar";

  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar: isAr });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAuthority, setFilterAuthority] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTender, setEditTender] = useState<TenderItem | null>(null);
  const [selectedTender, setSelectedTender] = useState<TenderItem | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  // Fetch tenders
  const { data, isLoading } = useQuery<TendersResponse>({
    queryKey: ["tenders", filterStatus, filterAuthority, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);
      if (filterAuthority && filterAuthority !== "all") params.set("authority", filterAuthority);
      if (search) params.set("search", search);
      const res = await fetch(`/api/tenders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tenders");
      return res.json();
    },
  });

  const tenders = data?.tenders || [];
  const total = data?.total || 0;

  // Fetch tender detail
  const { data: tenderDetail } = useQuery<TenderDetail>({
    queryKey: ["tender-detail", selectedTender?.id],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${selectedTender!.id}`);
      if (!res.ok) throw new Error("Failed to fetch tender detail");
      return res.json();
    },
    enabled: !!selectedTender,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/tenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create tender");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      setShowAddDialog(false);
      setFormData(emptyForm);
      toast.created(isAr ? "المناقصة" : "Tender");
    },
    onError: () => {
      toast.error(isAr ? "إنشاء المناقصة" : "Create tender");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const res = await fetch(`/api/tenders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update tender");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      queryClient.invalidateQueries({ queryKey: ["tender-detail"] });
      setEditTender(null);
      setFormData(emptyForm);
      toast.updated(isAr ? "المناقصة" : "Tender");
    },
    onError: () => {
      toast.error(isAr ? "تحديث المناقصة" : "Update tender");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/tenders/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      setSelectedTender(null);
      toast.deleted(isAr ? "المناقصة" : "Tender");
    },
    onError: () => {
      toast.error(isAr ? "حذف المناقصة" : "Delete tender");
    },
  });

  const openEditDialog = (tender: TenderItem) => {
    setEditTender(tender);
    setFormData({
      tenderNumber: tender.tenderNumber,
      title: tender.title,
      authority: tender.authority,
      projectType: tender.projectType,
      description: tender.description,
      estimatedBudget: String(tender.estimatedBudget),
      currency: tender.currency,
      closingDate: tender.closingDate ? tender.closingDate.split("T")[0] : "",
      submissionDate: tender.submissionDate ? tender.submissionDate.split("T")[0] : "",
      qualifications: tender.qualifications,
      requiredDocs: tender.requiredDocs,
      status: tender.status,
      winnerName: tender.winnerName,
      lostReason: tender.lostReason,
      competitorAnalysis: tender.competitorAnalysis,
      notes: tender.notes,
      source: tender.source,
      sourceUrl: tender.sourceUrl,
      assignedTo: tender.assignedTo || "",
    });
  };

  const openAddDialog = () => {
    setFormData(emptyForm);
    setEditTender(null);
    setShowAddDialog(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;
    if (editTender) {
      updateMutation.mutate({ id: editTender.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Statistics
  const totalCount = tenders.length;
  const preparingCount = tenders.filter((t) => t.status === "preparing" || t.status === "submitted" || t.status === "identified").length;
  const wonCount = tenders.filter((t) => t.status === "won").length;
  const lostCount = tenders.filter((t) => t.status === "lost").length;
  const wonBudget = tenders.filter((t) => t.status === "won").reduce((sum, t) => sum + t.estimatedBudget, 0);

  const isLoadingData = isLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <Gavel className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? "المناقصات" : "Tenders"}
              </h2>
              <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5">
                {total}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isAr ? "إدارة وتتبع المناقصات" : "Manage and track tenders"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ms-auto flex-wrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "بحث في المناقصات..." : "Search tenders..."}
              className="ps-9 h-8 text-sm rounded-lg"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg">
              <SelectValue placeholder={isAr ? "الحالة" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
              <SelectItem value="identified">{isAr ? "مُحدّدة" : "Identified"}</SelectItem>
              <SelectItem value="preparing">{isAr ? "قيد التحضير" : "Preparing"}</SelectItem>
              <SelectItem value="submitted">{isAr ? "مقدّمة" : "Submitted"}</SelectItem>
              <SelectItem value="qualified">{isAr ? "مؤهّلة" : "Qualified"}</SelectItem>
              <SelectItem value="won">{isAr ? "فُزنا" : "Won"}</SelectItem>
              <SelectItem value="lost">{isAr ? "خسرنا" : "Lost"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAuthority} onValueChange={setFilterAuthority}>
            <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg">
              <SelectValue placeholder={isAr ? "الجهة" : "Authority"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الجهات" : "All Authorities"}</SelectItem>
              <SelectItem value="rak_municipality">{isAr ? "البلدية" : "Municipality"}</SelectItem>
              <SelectItem value="rak_properties">RAK Properties</SelectItem>
              <SelectItem value="al_hamra">{isAr ? "الحمراء" : "Al Hamra"}</SelectItem>
              <SelectItem value="marjan">{isAr ? "مرجان" : "Marjan"}</SelectItem>
              <SelectItem value="rakez">RAKEZ</SelectItem>
              <SelectItem value="private">{isAr ? "خاصة" : "Private"}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20"
            onClick={openAddDialog}
          >
            <Plus className="h-3.5 w-3.5 me-1" />
            {isAr ? "مناقصة جديدة" : "New Tender"}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <FileText className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{isAr ? "إجمالي المناقصات" : "Total Tenders"}</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {isLoadingData ? <Skeleton className="h-6 w-12" /> : totalCount}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {isAr ? `${total} مناقصة مسجلة` : `${total} registered tenders`}
            </p>
          </div>
        </Card>

        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400">{isAr ? "قيد التقديم" : "In Progress"}</span>
            </div>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
              {isLoadingData ? <Skeleton className="h-6 w-12" /> : preparingCount}
            </div>
            <p className="text-[10px] text-amber-500/60 dark:text-amber-400/60 mt-1">
              {isAr ? "قيد التحضير والتقديم" : "Preparing & submitting"}
            </p>
          </div>
        </Card>

        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <Trophy className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">{isAr ? "فُزنا" : "Won"}</span>
            </div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
              {isLoadingData ? <Skeleton className="h-6 w-12" /> : wonCount}
            </div>
            <p className="text-[10px] text-emerald-500/60 dark:text-emerald-400/60 mt-1">
              {wonCount > 0 ? formatCurrency(wonBudget, isAr) : (isAr ? "لا توجد" : "None yet")}
            </p>
          </div>
        </Card>

        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs text-red-600 dark:text-red-400">{isAr ? "خسرنا" : "Lost"}</span>
            </div>
            <div className="text-xl font-bold text-red-700 dark:text-red-300 tabular-nums">
              {isLoadingData ? <Skeleton className="h-6 w-12" /> : lostCount}
            </div>
            <p className="text-[10px] text-red-500/60 dark:text-red-400/60 mt-1">
              {isAr ? "مناقصات خاسرة" : "Lost tenders"}
            </p>
          </div>
        </Card>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={cn(
          "flex-1 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm",
          selectedTender && "hidden lg:block"
        )}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                <TableHead className="text-xs font-semibold">{isAr ? "الرقم" : "No."}</TableHead>
                <TableHead className="text-xs font-semibold">{isAr ? "العنوان" : "Title"}</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">{isAr ? "الجهة" : "Authority"}</TableHead>
                <TableHead className="text-xs font-semibold hidden sm:table-cell">{isAr ? "الميزانية" : "Budget"}</TableHead>
                <TableHead className="text-xs font-semibold hidden sm:table-cell">{isAr ? "الإغلاق" : "Closing"}</TableHead>
                <TableHead className="text-xs font-semibold hidden lg:table-cell">{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-xs font-semibold text-start">{isAr ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingData && (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              )}
              {!isLoadingData && tenders.map((tender, idx) => {
                const statusCfg = getStatusConfig(tender.status);
                const authCfg = getAuthorityConfig(tender.authority);
                return (
                  <TableRow
                    key={tender.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "even:bg-slate-50/50 dark:even:bg-slate-800/20",
                      selectedTender?.id === tender.id && "bg-teal-50/50 dark:bg-teal-950/20"
                    )}
                    onClick={() => setSelectedTender(tender)}
                  >
                    <TableCell className="font-mono text-xs text-slate-500">
                      {tender.tenderNumber || "—"}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                      {tender.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-600 dark:text-slate-300 text-xs">
                      {isAr ? authCfg.ar : authCfg.en}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-medium text-slate-900 dark:text-white text-sm font-mono tabular-nums">
                      <span className="text-slate-400 dark:text-slate-500">{tender.currency} </span>
                      {tender.estimatedBudget.toLocaleString(isAr ? "ar-AE" : "en-US")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-col gap-1">
                        {tender.closingDate && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(tender.closingDate).toLocaleDateString(isAr ? "ar-AE" : "en-US")}
                          </span>
                        )}
                        <ClosingCountdown closingDate={tender.closingDate} ar={isAr} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium",
                        statusCfg.pill
                      )}>
                        {isAr ? statusCfg.ar : statusCfg.en}
                      </span>
                    </TableCell>
                    <TableCell className="text-start">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); setSelectedTender(tender); }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(tender); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(isAr ? `حذف المناقصة "${tender.title}"؟` : `Delete "${tender.title}"?`)) {
                              deleteMutation.mutate(tender.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoadingData && tenders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Inbox className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {isAr ? "لا توجد مناقصات" : "No tenders found"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {isAr ? "أضف مناقصة جديدة للبدء" : "Add a new tender to get started"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                        onClick={openAddDialog}
                      >
                        <Plus className="h-3.5 w-3.5 me-1" />
                        {isAr ? "مناقصة جديدة" : "New Tender"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detail Panel */}
        {selectedTender && tenderDetail && (
          <TenderDetailPanel
            tender={tenderDetail}
            ar={isAr}
            onClose={() => setSelectedTender(null)}
            onEdit={() => openEditDialog(selectedTender)}
          />
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || !!editTender}
        onOpenChange={(open) => {
          if (!open) { setShowAddDialog(false); setEditTender(null); setFormData(emptyForm); }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTender ? (isAr ? "تعديل مناقصة" : "Edit Tender") : (isAr ? "مناقصة جديدة" : "New Tender")}
            </DialogTitle>
            <DialogDescription>
              {editTender
                ? (isAr ? "تعديل بيانات المناقصة" : "Edit tender information")
                : (isAr ? "إضافة مناقصة جديدة" : "Add a new tender")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "رقم المناقصة" : "Tender No."}</Label>
                <Input
                  value={formData.tenderNumber}
                  onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })}
                  placeholder={isAr ? "رقم المناقصة" : "Tender number"}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "العنوان" : "Title"} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={isAr ? "عنوان المناقصة" : "Tender title"}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "الجهة" : "Authority"}</Label>
                <Select
                  value={formData.authority}
                  onValueChange={(v) => setFormData({ ...formData, authority: v })}
                >
                  <SelectTrigger className="h-8 text-sm rounded-lg">
                    <SelectValue placeholder={isAr ? "اختر الجهة" : "Select authority"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rak_municipality">{isAr ? "بلدية رأس الخيمة" : "RAK Municipality"}</SelectItem>
                    <SelectItem value="rak_properties">RAK Properties</SelectItem>
                    <SelectItem value="al_hamra">{isAr ? "الحمراء" : "Al Hamra"}</SelectItem>
                    <SelectItem value="marjan">{isAr ? "مرجان" : "Marjan"}</SelectItem>
                    <SelectItem value="rakez">RAKEZ</SelectItem>
                    <SelectItem value="private">{isAr ? "خاصة" : "Private"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "نوع المشروع" : "Project Type"}</Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(v) => setFormData({ ...formData, projectType: v })}
                >
                  <SelectTrigger className="h-8 text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="villa">{isAr ? "فيلا" : "Villa"}</SelectItem>
                    <SelectItem value="building">{isAr ? "مبنى" : "Building"}</SelectItem>
                    <SelectItem value="infrastructure">{isAr ? "بنية تحتية" : "Infrastructure"}</SelectItem>
                    <SelectItem value="road">{isAr ? "طريق" : "Road"}</SelectItem>
                    <SelectItem value="landscape">{isAr ? "تنسيق مواقع" : "Landscape"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{isAr ? "الوصف" : "Description"}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isAr ? "وصف المناقصة..." : "Tender description..."}
                className="text-sm min-h-[60px] rounded-lg"
              />
            </div>

            {/* Budget & Dates */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "الميزانية التقديرية" : "Est. Budget"}</Label>
                <Input
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                  placeholder="0"
                  className="h-8 text-sm font-mono tabular-nums rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "تاريخ الإغلاق" : "Closing Date"}</Label>
                <Input
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "تاريخ التقديم" : "Submission Date"}</Label>
                <Input
                  type="date"
                  value={formData.submissionDate}
                  onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
            </div>

            {/* Status & Requirements */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "الحالة" : "Status"}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="h-8 text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identified">{isAr ? "مُحدّدة" : "Identified"}</SelectItem>
                    <SelectItem value="preparing">{isAr ? "قيد التحضير" : "Preparing"}</SelectItem>
                    <SelectItem value="submitted">{isAr ? "مقدّمة" : "Submitted"}</SelectItem>
                    <SelectItem value="qualified">{isAr ? "مؤهّلة" : "Qualified"}</SelectItem>
                    <SelectItem value="won">{isAr ? "فُزنا" : "Won"}</SelectItem>
                    <SelectItem value="lost">{isAr ? "خسرنا" : "Lost"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "المصدر" : "Source"}</Label>
                <Select
                  value={formData.source}
                  onValueChange={(v) => setFormData({ ...formData, source: v })}
                >
                  <SelectTrigger className="h-8 text-sm rounded-lg">
                    <SelectValue placeholder={isAr ? "اختر المصدر" : "Select source"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">{isAr ? "موقع إلكتروني" : "Website"}</SelectItem>
                    <SelectItem value="referral">{isAr ? "إحالة" : "Referral"}</SelectItem>
                    <SelectItem value="direct">{isAr ? "مباشر" : "Direct"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditional Fields */}
            {(formData.status === "won") && (
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "اسم الفائز" : "Winner Name"}</Label>
                <Input
                  value={formData.winnerName}
                  onChange={(e) => setFormData({ ...formData, winnerName: e.target.value })}
                  placeholder={isAr ? "اسم الفائز" : "Winner name"}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
            )}

            {(formData.status === "lost") && (
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "سبب الخسارة" : "Lost Reason"}</Label>
                <Textarea
                  value={formData.lostReason}
                  onChange={(e) => setFormData({ ...formData, lostReason: e.target.value })}
                  placeholder={isAr ? "سبب الخسارة..." : "Reason for losing..."}
                  className="text-sm min-h-[50px] rounded-lg"
                />
              </div>
            )}

            {/* Qualifications & Docs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "المؤهلات المطلوبة" : "Qualifications"}</Label>
                <Input
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder={isAr ? "مفصولة بفواصل" : "Comma-separated"}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? "المستندات المطلوبة" : "Required Docs"}</Label>
                <Input
                  value={formData.requiredDocs}
                  onChange={(e) => setFormData({ ...formData, requiredDocs: e.target.value })}
                  placeholder={isAr ? "مفصولة بفواصل" : "Comma-separated"}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm">{isAr ? "ملاحظات" : "Notes"}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={isAr ? "ملاحظات إضافية..." : "Additional notes..."}
                className="text-sm min-h-[50px] rounded-lg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => { setShowAddDialog(false); setEditTender(null); setFormData(emptyForm); }}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20"
              disabled={!formData.title.trim() || createMutation.isPending || updateMutation.isPending}
              onClick={handleSave}
            >
              {(createMutation.isPending || updateMutation.isPending)
                ? (isAr ? "جارٍ الحفظ..." : "Saving...")
                : (isAr ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Tender Detail Panel =====
function TenderDetailPanel({
  tender,
  ar,
  onClose,
  onEdit,
}: {
  tender: TenderDetail;
  ar: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const statusCfg = getStatusConfig(tender.status);
  const authCfg = getAuthorityConfig(tender.authority);

  return (
    <div className="w-full lg:w-[420px] flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {ar ? "تفاصيل المناقصة" : "Tender Details"}
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 lg:hidden" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-4 space-y-4">
          {/* Title & Status */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex-1">
                {tender.title}
              </h4>
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                statusCfg.pill
              )}>
                {ar ? statusCfg.ar : statusCfg.en}
              </span>
            </div>

            {/* Budget Card */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                <span className="text-xs text-teal-600 dark:text-teal-400">
                  {ar ? "الميزانية التقديرية" : "Estimated Budget"}
                </span>
              </div>
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-300 font-mono tabular-nums">
                {tender.estimatedBudget.toLocaleString(ar ? "ar-AE" : "en-US")} <span className="text-sm font-medium">{tender.currency}</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2.5 text-sm">
              {tender.tenderNumber && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{ar ? "رقم المناقصة" : "No."}</span>
                    <span className="font-mono text-xs">{tender.tenderNumber}</span>
                  </div>
                </div>
              )}

              {tender.authority && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{ar ? "الجهة" : "Authority"}</span>
                    <span className="text-xs">{ar ? authCfg.ar : authCfg.en}</span>
                  </div>
                </div>
              )}

              {tender.projectType && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{ar ? "نوع المشروع" : "Project Type"}</span>
                    <span className="text-xs">{getProjectTypeLabel(tender.projectType, ar)}</span>
                  </div>
                </div>
              )}

              {/* Closing Date */}
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 block">{ar ? "تاريخ الإغلاق" : "Closing Date"}</span>
                  {tender.closingDate ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {new Date(tender.closingDate).toLocaleDateString(ar ? "ar-AE" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      <ClosingCountdown closingDate={tender.closingDate} ar={ar} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">{ar ? "غير محدد" : "Not specified"}</span>
                  )}
                </div>
              </div>

              {/* Submission Date */}
              {tender.submissionDate && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{ar ? "تاريخ التقديم" : "Submission Date"}</span>
                    <span className="text-xs">
                      {new Date(tender.submissionDate).toLocaleDateString(ar ? "ar-AE" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              )}

              {/* Source */}
              {tender.source && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{ar ? "المصدر" : "Source"}</span>
                    <span className="text-xs">
                      {tender.source === "website" ? (ar ? "موقع إلكتروني" : "Website") :
                       tender.source === "referral" ? (ar ? "إحالة" : "Referral") :
                       tender.source === "direct" ? (ar ? "مباشر" : "Direct") : tender.source}
                    </span>
                  </div>
                </div>
              )}

              {/* Assigned To */}
              {tender.assignedUser && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{ar ? "المسؤول" : "Assigned To"}</span>
                    <span className="text-xs">{tender.assignedUser.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
            {tender.description && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ar ? "الوصف" : "Description"}</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {tender.description}
                </p>
              </div>
            )}

            {/* Qualifications */}
            {tender.qualifications && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ar ? "المؤهلات المطلوبة" : "Required Qualifications"}</h5>
                <div className="flex flex-wrap gap-1">
                  {tender.qualifications.split(",").map((q, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">
                      {q.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Required Documents */}
            {tender.requiredDocs && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ar ? "المستندات المطلوبة" : "Required Documents"}</h5>
                <div className="flex flex-wrap gap-1">
                  {tender.requiredDocs.split(",").map((d, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
                      {d.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Won Info */}
            {tender.status === "won" && tender.winnerName && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <Trophy className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">{ar ? "فائز" : "Winner"}</span>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-300">{tender.winnerName}</p>
              </div>
            )}

            {/* Lost Info */}
            {tender.status === "lost" && tender.lostReason && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">{ar ? "سبب الخسارة" : "Lost Reason"}</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-300">{tender.lostReason}</p>
              </div>
            )}

            {/* Notes */}
            {tender.notes && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ar ? "ملاحظات" : "Notes"}</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {tender.notes}
                </p>
              </div>
            )}

            {/* Documents count */}
            {tender._count?.documents > 0 && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">
                    {ar ? `${tender._count.documents} مستند مرفق` : `${tender._count.documents} attached document(s)`}
                  </span>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}
