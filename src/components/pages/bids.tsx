"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Trash2,
  Gavel,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Trophy,
  XCircle as RejectIcon,
  Timer,
  TrendingUp,
  Star,
  Users,
  BarChart3,
  ClipboardCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Award,
  ArrowUpDown,
  Edit3,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

// ===== Types =====
interface ContractorBasic {
  id: string;
  name: string;
  nameEn: string;
  companyName: string;
  companyEn: string;
  category: string;
  rating: number;
  _count: { bids: number; evaluations: number };
}

interface EvaluationItem {
  id: string;
  contractorId: string;
  projectId: string;
  bidId: string | null;
  criteria: string;
  score: number;
  maxScore: number;
  weight: number;
  notes: string;
  evaluatedBy: string;
  createdAt: string;
}

interface BidItem {
  id: string;
  contractorName: string;
  contractorContact: string;
  contractorId: string | null;
  amount: number;
  status: string;
  notes: string;
  projectId: string;
  createdAt: string;
  deadline: string | null;
  technicalScore: number;
  financialScore: number;
  totalScore: number;
  evaluationNotes: string;
  project: { id: string; name: string; nameEn: string; number: string };
  contractor: ContractorBasic | null;
  evaluations: EvaluationItem[];
}

interface ContractorFull {
  id: string;
  name: string;
  nameEn: string;
  companyName: string;
  companyEn: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  crNumber: string;
  licenseNumber: string;
  licenseExpiry: string | null;
  category: string;
  rating: number;
  specialties: string;
  experience: string;
  bankName: string;
  bankAccount: string;
  iban: string;
  isActive: boolean;
  notes: string;
  _count: { bids: number; evaluations: number };
}

interface ProjectOption { id: string; name: string; nameEn: string; number: string; }

// ===== Helpers =====

function getStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string; gradient: string }> = {
    submitted: { ar: "مقدم", en: "Submitted", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300", gradient: "from-sky-500 to-sky-600" },
    under_review: { ar: "قيد المراجعة", en: "Under Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300", gradient: "from-amber-500 to-amber-600" },
    accepted: { ar: "مقبول", en: "Accepted", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300", gradient: "from-emerald-500 to-emerald-600" },
    rejected: { ar: "مرفوض", en: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", gradient: "from-red-500 to-red-600" },
  };
  return configs[status] || configs.submitted;
}

function getCategoryConfig(cat: string) {
  const configs: Record<string, { ar: string; en: string; color: string }> = {
    civil: { ar: "أشغال مدنية", en: "Civil", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
    electrical: { ar: "كهرباء", en: "Electrical", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" },
    mep: { ar: "MEP", en: "MEP", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
    finishing: { ar: "تشطيبات", en: "Finishing", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300" },
    plumbing: { ar: "سباكة", en: "Plumbing", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300" },
    hvac: { ar: "تكييف", en: "HVAC", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300" },
  };
  return configs[cat] || { ar: cat, en: cat, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
}

const EVALUATION_CRITERIA = [
  { key: "experience", ar: "الخبرة", en: "Experience", weight: 30 },
  { key: "financial", ar: "القدرة المالية", en: "Financial Capacity", weight: 25 },
  { key: "technical", ar: "القدرة التقنية", en: "Technical Capability", weight: 25 },
  { key: "past_performance", ar: "الأداء السابق", en: "Past Performance", weight: 20 },
];

function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size === "sm" ? "h-3 w-3" : "h-4 w-4",
            i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-600"
          )}
        />
      ))}
    </div>
  );
}

// ===== Deadline Countdown =====
function DeadlineBadge({ deadline, ar }: { deadline: string | null; ar: boolean }) {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
        <XCircle className="h-3 w-3" />
        {ar ? `انتهى منذ ${Math.abs(diffDays)} يوم` : `${Math.abs(diffDays)}d overdue`}
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
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      <Timer className="h-3 w-3" />
      {ar ? `${diffDays} يوم` : `${diffDays}d`}
    </span>
  );
}

// ===== Evaluation Dialog =====
function EvaluationDialog({
  bid,
  ar,
  open,
  onClose,
}: {
  bid: BidItem;
  ar: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [evaluatorName, setEvaluatorName] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: existingEvals = [] } = useQuery<EvaluationItem[]>({
    queryKey: ["bid-evaluations", bid.id],
    queryFn: async () => {
      const res = await fetch(`/api/bids/${bid.id}/evaluate`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  // Derive scores from existing evaluations
  const effectiveScores = useMemo(() => {
    if (Object.keys(scores).length > 0) return scores;
    if (existingEvals.length === 0) return scores;
    const init: Record<string, number> = {};
    existingEvals.forEach((ev) => { init[ev.criteria] = ev.score; });
    return init;
  }, [existingEvals, scores]);

  const totalWeighted = useMemo(() => {
    let total = 0;
    EVALUATION_CRITERIA.forEach((c) => {
      const score = effectiveScores[c.key] || 0;
      total += (score * c.weight) / 100;
    });
    return Math.round(total * 10) / 10;
  }, [effectiveScores]);

  const chartData = useMemo(() => {
    return EVALUATION_CRITERIA.map((c) => ({
      criteria: ar ? c.ar : c.en,
      score: effectiveScores[c.key] || 0,
      fullMark: 100,
    }));
  }, [effectiveScores, ar]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const evaluations = EVALUATION_CRITERIA.map((c) => ({
        criteria: c.key,
        score: effectiveScores[c.key] || 0,
        maxScore: 100,
        weight: c.weight,
        notes: "",
      }));
      const res = await fetch(`/api/bids/${bid.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluations,
          evaluatedBy: evaluatorName || "System",
          technicalScore: scores.technical || 0,
          financialScore: scores.financial || 0,
          evaluationNotes: notes,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["bid-evaluations", bid.id] });
      setSaved(true);
      setTimeout(() => { onClose(); setSaved(false); }, 1200);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-teal-600" />
            {ar ? `تقييم عطاء - ${bid.contractorName}` : `Evaluate Bid - ${bid.contractorName}`}
          </DialogTitle>
          <DialogDescription>
            {ar ? "قم بتسجيل الدرجات لكل معيار تقييم" : "Score each evaluation criterion (0-100)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Evaluator */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <UserCheck className="h-3 w-3" />
              {ar ? "المُقيّم" : "Evaluator"}
            </Label>
            <Input
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder={ar ? "اسم المُقيّم" : "Evaluator name"}
              className="h-8 text-sm rounded-lg"
            />
          </div>

          {/* Score Inputs */}
          <div className="space-y-3">
            {EVALUATION_CRITERIA.map((c) => (
              <div key={c.key} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {ar ? c.ar : c.en}
                    </span>
                    <span className="text-xs text-slate-400 ms-2">({c.weight}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={effectiveScores[c.key] ?? ""}
                      onChange={(e) => setScores({ ...scores, [c.key]: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      className="w-20 h-7 text-sm text-center rounded-lg font-mono"
                      placeholder="0"
                    />
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                </div>
                <Progress
                  value={effectiveScores[c.key] || 0}
                  className={cn(
                    "h-1.5",
                    (effectiveScores[c.key] || 0) >= 70 ? "[&>div]:bg-emerald-500" :
                    (effectiveScores[c.key] || 0) >= 40 ? "[&>div]:bg-amber-500" :
                    "[&>div]:bg-red-500"
                  )}
                />
              </div>
            ))}
          </div>

          {/* Total Score */}
          <div className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70">{ar ? "المجموع المرجح" : "Weighted Total"}</p>
                <p className="text-3xl font-bold tabular-nums">{totalWeighted}</p>
              </div>
              <div className="text-4xl font-bold text-white/20">/ 100</div>
            </div>
          </div>

          {/* Radar Chart */}
          {Object.keys(effectiveScores).length > 0 && (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="var(--color-slate-200)" />
                  <PolarAngleAxis dataKey="criteria" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name={ar ? "الدرجات" : "Scores"} dataKey="score" stroke="var(--color-teal-500)" fill="var(--color-teal-500)" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs">{ar ? "ملاحظات التقييم" : "Evaluation Notes"}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={ar ? "أضف ملاحظات التقييم..." : "Add evaluation notes..."}
              className="text-sm min-h-[60px] rounded-lg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            className={cn(
              "rounded-lg text-white",
              saved
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-teal-600 hover:bg-teal-700"
            )}
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || saved}
          >
            {saved ? (
              <><CheckCircle className="h-3.5 w-3.5 me-1" />{ar ? "تم الحفظ" : "Saved"}</>
            ) : saveMutation.isPending ? (
              ar ? "جارٍ الحفظ..." : "Saving..."
            ) : (
              <><ClipboardCheck className="h-3.5 w-3.5 me-1" />{ar ? "حفظ التقييم" : "Save Evaluation"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Contractors Sub-tab =====
function ContractorsTab({
  ar,
  projectId,
  onSelectContractor,
}: {
  ar: boolean;
  projectId?: string;
  onSelectContractor: (c: ContractorFull) => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "", nameEn: "", companyName: "", companyEn: "", contactPerson: "",
    phone: "", email: "", address: "", crNumber: "", licenseNumber: "",
    licenseExpiry: "", category: "civil", rating: "3", specialties: "",
    experience: "", bankName: "", bankAccount: "", iban: "", notes: "",
  });

  const emptyForm = {
    name: "", nameEn: "", companyName: "", companyEn: "", contactPerson: "",
    phone: "", email: "", address: "", crNumber: "", licenseNumber: "",
    licenseExpiry: "", category: "civil", rating: "3", specialties: "",
    experience: "", bankName: "", bankAccount: "", iban: "", notes: "",
  };

  const { data: contractors = [], isLoading } = useQuery<ContractorFull[]>({
    queryKey: ["contractors", projectId, search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      if (search) params.set("search", search);
      if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/contractors?${params.toString()}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await fetch("/api/contractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      setShowDialog(false);
      setFormData(emptyForm);
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden"><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ar ? "بحث بالمقاولين..." : "Search contractors..."}
            className="ps-9 h-8 text-sm rounded-lg"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "جميع التخصصات" : "All Categories"}</SelectItem>
            <SelectItem value="civil">{ar ? "أشغال مدنية" : "Civil"}</SelectItem>
            <SelectItem value="electrical">{ar ? "كهرباء" : "Electrical"}</SelectItem>
            <SelectItem value="mep">{ar ? "MEP" : "MEP"}</SelectItem>
            <SelectItem value="finishing">{ar ? "تشطيبات" : "Finishing"}</SelectItem>
            <SelectItem value="plumbing">{ar ? "سباكة" : "Plumbing"}</SelectItem>
            <SelectItem value="hvac">{ar ? "تكييف" : "HVAC"}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
          onClick={() => { setFormData(emptyForm); setShowDialog(true); }}
        >
          <Plus className="h-3.5 w-3.5 me-1" />{ar ? "إضافة مقاول" : "Add Contractor"}
        </Button>
      </div>

      {/* Grid */}
      {contractors.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{ar ? "لا يوجد مقاولين" : "No contractors found"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractors.map((c) => {
            const catConf = getCategoryConfig(c.category);
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden border-slate-200 dark:border-slate-700/50"
                onClick={() => onSelectContractor(c)}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {ar ? c.name : c.nameEn || c.name}
                      </h4>
                      {c.companyName && (
                        <p className="text-xs text-slate-500 truncate">{ar ? c.companyName : c.companyEn || c.companyName}</p>
                      )}
                    </div>
                    <Badge className={cn("text-[10px] flex-shrink-0 ms-2", catConf.color)}>
                      {ar ? catConf.ar : catConf.en}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <RatingStars rating={c.rating} />
                    <span className="text-xs text-slate-400">{c.rating}/5</span>
                  </div>
                  {c.specialties && (
                    <div className="flex flex-wrap gap-1">
                      {c.specialties.split(",").map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">
                          {s.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Gavel className="h-3 w-3" />{c._count.bids}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3 w-3" />{c._count.evaluations}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Contractor Dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) { setShowDialog(false); setFormData(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              {ar ? "إضافة مقاول جديد" : "Add New Contractor"}
            </DialogTitle>
            <DialogDescription>{ar ? "ملف المقاول الكامل" : "Complete contractor profile"}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs">{ar ? "الاسم (عربي)" : "Name (Ar)"} *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs">{ar ? "الاسم (إنجليزي)" : "Name (En)"}</Label>
              <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} className="h-8 text-sm rounded-lg" dir="ltr" />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs">{ar ? "اسم الشركة (عربي)" : "Company (Ar)"}</Label>
              <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs">{ar ? "اسم الشركة (إنجليزي)" : "Company (En)"}</Label>
              <Input value={formData.companyEn} onChange={(e) => setFormData({ ...formData, companyEn: e.target.value })} className="h-8 text-sm rounded-lg" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "التخصص" : "Category"}</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">{ar ? "أشغال مدنية" : "Civil"}</SelectItem>
                  <SelectItem value="electrical">{ar ? "كهرباء" : "Electrical"}</SelectItem>
                  <SelectItem value="mep">MEP</SelectItem>
                  <SelectItem value="finishing">{ar ? "تشطيبات" : "Finishing"}</SelectItem>
                  <SelectItem value="plumbing">{ar ? "سباكة" : "Plumbing"}</SelectItem>
                  <SelectItem value="hvac">{ar ? "تكييف" : "HVAC"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "التقييم (1-5)" : "Rating (1-5)"}</Label>
              <Select value={formData.rating} onValueChange={(v) => setFormData({ ...formData, rating: v })}>
                <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={String(r)}>{r} ★</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "جهة الاتصال" : "Contact Person"}</Label>
              <Input value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "الهاتف" : "Phone"}</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-8 text-sm rounded-lg" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "البريد الإلكتروني" : "Email"}</Label>
              <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-8 text-sm rounded-lg" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "العنوان" : "Address"}</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "رقم السجل التجاري" : "CR Number"}</Label>
              <Input value={formData.crNumber} onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })} className="h-8 text-sm rounded-lg" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "رقم الترخيص" : "License Number"}</Label>
              <Input value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} className="h-8 text-sm rounded-lg" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "انتهاء الترخيص" : "License Expiry"}</Label>
              <Input type="date" value={formData.licenseExpiry} onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "الخبرة" : "Experience"}</Label>
              <Input value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} placeholder={ar ? "سنوات الخبرة" : "Years of experience"} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">{ar ? "التخصصات" : "Specialties"}</Label>
              <Input value={formData.specialties} onChange={(e) => setFormData({ ...formData, specialties: e.target.value })} placeholder={ar ? "مفصولة بفواصل" : "Comma-separated"} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "البنك" : "Bank Name"}</Label>
              <Input value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IBAN</Label>
              <Input value={formData.iban} onChange={(e) => setFormData({ ...formData, iban: e.target.value })} className="h-8 text-sm rounded-lg font-mono" dir="ltr" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">{ar ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="text-sm min-h-[50px] rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setFormData(emptyForm); }}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Comparison Matrix =====
function ComparisonMatrix({
  bids,
  ar,
}: {
  bids: BidItem[];
  ar: boolean;
}) {
  const [sortBy, setSortBy] = useState<"totalScore" | "amount" | "technicalScore">("totalScore");

  const sorted = useMemo(() => {
    return [...bids].sort((a, b) => {
      if (sortBy === "amount") return b.amount - a.amount;
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    });
  }, [bids, sortBy]);

  const topBid = sorted.length > 0 && sorted[0].totalScore > 0 ? sorted[0] : null;

  const chartData = useMemo(() => {
    return sorted.map((b) => ({
      name: b.contractorName.substring(0, 15),
      [ar ? "فني" : "Tech"]: b.technicalScore,
      [ar ? "مالي" : "Fin"]: b.financialScore,
      [ar ? "إجمالي" : "Total"]: Math.round(b.totalScore),
    }));
  }, [sorted, ar]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">{ar ? "ترتيب حسب:" : "Sort by:"}</span>
        <div className="flex gap-1.5">
          {[
            { key: "totalScore" as const, ar: "المجموع", en: "Total" },
            { key: "technicalScore" as const, ar: "فني", en: "Technical" },
            { key: "amount" as const, ar: "المبلغ", en: "Amount" },
          ].map((s) => (
            <Button
              key={s.key}
              variant={sortBy === s.key ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-xs rounded-lg",
                sortBy === s.key ? "bg-teal-600 hover:bg-teal-700 text-white" : ""
              )}
              onClick={() => setSortBy(s.key)}
            >
              <ArrowUpDown className="h-3 w-3 me-1" />
              {ar ? s.ar : s.en}
            </Button>
          ))}
        </div>
      </div>

      {/* Criteria Legend */}
      <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {ar ? "معايير التقييم:" : "Evaluation Criteria:"}
        </span>
        {EVALUATION_CRITERIA.map((c) => (
          <Badge key={c.key} variant="secondary" className="text-[10px]">
            {ar ? c.ar : c.en} ({c.weight}%)
          </Badge>
        ))}
      </div>

      {/* Chart */}
      {sorted.length > 0 && sorted.some((b) => b.totalScore > 0) && (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold text-slate-500 mb-3">
              {ar ? "مقارنة بصرية" : "Visual Comparison"}
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-100)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(value: number) => [`${value}`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey={ar ? "فني" : "Tech"} fill="var(--color-amber-500)" radius={[0, 2, 2, 0]} barSize={12} />
                  <Bar dataKey={ar ? "مالي" : "Fin"} fill="var(--color-cyan-500)" radius={[0, 2, 2, 0]} barSize={12} />
                  <Bar dataKey={ar ? "إجمالي" : "Total"} fill="var(--color-teal-600)" radius={[0, 2, 2, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden">
        <ScrollArea className="max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                <TableHead className="text-xs font-semibold w-8">#</TableHead>
                <TableHead className="text-xs font-semibold">{ar ? "المقاول" : "Contractor"}</TableHead>
                <TableHead className="text-xs font-semibold text-end">{ar ? "المبلغ" : "Amount"}</TableHead>
                <TableHead className="text-xs font-semibold text-end">{ar ? "فني" : "Technical"}</TableHead>
                <TableHead className="text-xs font-semibold text-end">{ar ? "مالي" : "Financial"}</TableHead>
                <TableHead className="text-xs font-semibold text-end">{ar ? "المجموع" : "Total"}</TableHead>
                <TableHead className="text-xs font-semibold">{ar ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-xs font-semibold">{ar ? "التوصية" : "Recommend"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((bid, idx) => {
                const sc = getStatusConfig(bid.status);
                const isTop = topBid && bid.id === topBid.id && bid.totalScore > 0;
                return (
                  <TableRow
                    key={bid.id}
                    className={cn(
                      "transition-colors",
                      idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20",
                      isTop && "bg-teal-50/50 dark:bg-teal-950/20"
                    )}
                  >
                    <TableCell className="text-xs font-bold text-slate-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isTop && <Trophy className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                        <div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{bid.contractorName}</span>
                          {bid.contractor && (
                            <div className="text-[10px] text-slate-400">{ar ? bid.contractor.companyName : bid.contractor.companyEn || bid.contractor.companyName}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium font-mono tabular-nums text-end">
                      {formatCurrency(bid.amount, ar)}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-xs font-bold tabular-nums", bid.technicalScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : bid.technicalScore >= 40 ? "text-amber-600" : "text-red-500")}>
                          {bid.technicalScore}
                        </span>
                        <Progress value={bid.technicalScore} className="w-16 h-1 [&>div]:bg-amber-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-xs font-bold tabular-nums", bid.financialScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : bid.financialScore >= 40 ? "text-amber-600" : "text-red-500")}>
                          {bid.financialScore}
                        </span>
                        <Progress value={bid.financialScore} className="w-16 h-1 [&>div]:bg-cyan-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-sm font-bold tabular-nums", bid.totalScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : bid.totalScore >= 40 ? "text-amber-600" : "text-red-500")}>
                          {Math.round(bid.totalScore)}
                        </span>
                        <Progress value={bid.totalScore} className="w-20 h-1.5 [&>div]:bg-teal-500" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", sc.color)}>
                        {ar ? sc.ar : sc.en}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isTop && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[10px]">
                          <Award className="h-3 w-3 me-1" />
                          {ar ? "مُوصى به" : "Recommended"}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                    {ar ? "لا توجد عطاءات للمقارنة" : "No bids to compare"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}

// ===== Contractor Detail Panel =====
function ContractorDetailPanel({
  contractorId,
  ar,
  onClose,
}: {
  contractorId: string;
  ar: boolean;
  onClose: () => void;
}) {
  const { data: contractor, isLoading } = useQuery<ContractorFull & { bids: BidItem[] }>({
    queryKey: ["contractor-detail", contractorId],
    queryFn: async () => {
      const res = await fetch(`/api/contractors/${contractorId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!contractorId,
  });

  if (isLoading) {
    return (
      <div className="w-full lg:w-[400px] flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 px-4 py-3">
          <Skeleton className="h-5 w-32 bg-white/20" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
        </div>
      </div>
    );
  }

  if (!contractor) return null;

  const catConf = getCategoryConfig(contractor.category);

  return (
    <div className="w-full lg:w-[400px] flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-white/80" />
            <h3 className="text-sm font-semibold text-white">{ar ? "ملف المقاول" : "Contractor Profile"}</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[300px] lg:h-[calc(100vh-340px)]">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {ar ? contractor.name : contractor.nameEn || contractor.name}
            </h4>
            {contractor.companyName && (
              <p className="text-sm text-slate-500">{ar ? contractor.companyName : contractor.companyEn || contractor.companyName}</p>
            )}
            <div className="flex items-center gap-2">
              <RatingStars rating={contractor.rating} size="md" />
              <span className="text-xs text-slate-400">{contractor.rating}/5</span>
            </div>
            <Badge className={cn("text-[10px]", catConf.color)}>{ar ? catConf.ar : catConf.en}</Badge>
          </div>

          {/* Details */}
          <div className="space-y-2.5">
            {contractor.contactPerson && (
              <div className="flex items-start gap-2.5">
                <UserCheck className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">{ar ? "جهة الاتصال" : "Contact"}</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">{contractor.contactPerson}</span>
                </div>
              </div>
            )}
            {contractor.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-700 dark:text-slate-300" dir="ltr">{contractor.phone}</span>
              </div>
            )}
            {contractor.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-700 dark:text-slate-300" dir="ltr">{contractor.email}</span>
              </div>
            )}
            {contractor.address && (
              <div className="flex items-center gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-700 dark:text-slate-300">{contractor.address}</span>
              </div>
            )}
            {contractor.crNumber && (
              <div className="flex items-center gap-2.5">
                <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">{ar ? "السجل التجاري" : "CR"}</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{contractor.crNumber}</span>
                </div>
              </div>
            )}
            {contractor.licenseNumber && (
              <div className="flex items-center gap-2.5">
                <Award className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">{ar ? "الترخيص" : "License"}</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{contractor.licenseNumber}</span>
                  {contractor.licenseExpiry && (
                    <span className="text-[10px] text-slate-400 block ms-4">
                      {ar ? "ينتهي: " : "Expires: "}{new Date(contractor.licenseExpiry).toLocaleDateString(ar ? "ar-AE" : "en-US")}
                    </span>
                  )}
                </div>
              </div>
            )}
            {contractor.experience && (
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">{ar ? "الخبرة" : "Experience"}</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">{contractor.experience}</span>
                </div>
              </div>
            )}
            {contractor.specialties && (
              <div className="flex flex-wrap gap-1 pt-1">
                {contractor.specialties.split(",").map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">{s.trim()}</Badge>
                ))}
              </div>
            )}
            {contractor.notes && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400">{ar ? "ملاحظات" : "Notes"}</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{contractor.notes}</p>
              </div>
            )}
          </div>

          {/* Contractor Bids */}
          {contractor.bids && contractor.bids.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Gavel className="h-3.5 w-3.5" />
                {ar ? `العطاءات (${contractor.bids.length})` : `Bids (${contractor.bids.length})`}
              </h5>
              <div className="space-y-1.5">
                {contractor.bids.slice(0, 5).map((b) => {
                  const sc = getStatusConfig(b.status);
                  return (
                    <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {ar ? b.project.name : b.project.nameEn || b.project.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono tabular-nums">{formatCurrency(b.amount, ar)}</p>
                      </div>
                      <Badge className={cn("text-[9px]", sc.color)}>{ar ? sc.ar : sc.en}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ===== Main Component =====
interface BidsPageProps { language: "ar" | "en"; projectId?: string; }

export default function BidsPage({ language, projectId }: BidsPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showDetail, setShowDetail] = useState<BidItem | null>(null);
  const [activeTab, setActiveTab] = useState("bids");
  const [evaluateBid, setEvaluateBid] = useState<BidItem | null>(null);
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);
  const [contractorSearch, setContractorSearch] = useState("");

  const emptyForm = {
    projectId: projectId || "", contractorName: "", contractorContact: "",
    amount: "", notes: "", status: "submitted" as string, contractorId: "", deadline: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  // Fetch bids
  const { data: bids = [], isLoading } = useQuery<BidItem[]>({
    queryKey: ["bids", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/bids${projectId ? `?projectId=${projectId}` : ''}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery<ProjectOption[]>({
    queryKey: ["projects-list"],
    queryFn: async () => { const res = await fetch("/api/projects-simple"); if (!res.ok) return []; return res.json(); },
  });

  // Fetch contractors for dropdown in bid form
  const { data: contractorsList = [] } = useQuery<ContractorFull[]>({
    queryKey: ["contractors-list"],
    queryFn: async () => { const res = await fetch("/api/contractors"); if (!res.ok) return []; return res.json(); },
  });

  // Create
  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await fetch("/api/bids", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bids"] }); setShowDialog(false); setFormData(emptyForm); },
  });

  // Update status
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/bids/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bids"] }); },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/bids/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bids"] }); setShowDetail(null); },
  });

  // Filter
  const filtered = bids.filter((b) => {
    const matchSearch =
      b.contractorName.toLowerCase().includes(search.toLowerCase()) ||
      (ar ? b.project.name : b.project.nameEn || b.project.name).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Summary
  const wonCount = filtered.filter((b) => b.status === "accepted").length;
  const lostCount = filtered.filter((b) => b.status === "rejected").length;
  const winRate = filtered.length > 0 ? ((wonCount / filtered.length) * 100).toFixed(1) : "0";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="py-0 gap-0"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Gavel className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{ar ? "العطاءات والمقاولين" : "Bids & Contractors"}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {bids.length} {ar ? "عطاء" : "bids"} • {contractorsList.length} {ar ? "مقاول" : "contractors"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
          <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20" onClick={() => { setFormData(emptyForm); setShowDialog(true); }}>
            <Plus className="h-3.5 w-3.5 me-1" />{ar ? "عطاء جديد" : "New Bid"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Gavel className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-amber-100">{ar ? "إجمالي العطاءات" : "Total Bids"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{filtered.length}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Trophy className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-emerald-100">{ar ? "فازت" : "Won"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{wonCount}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><RejectIcon className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-red-100">{ar ? "خسرت" : "Lost"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{lostCount}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/50"><TrendingUp className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{ar ? "نسبة الفوز" : "Win Rate"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xl font-bold tabular-nums",
                parseFloat(winRate) >= 50 ? "text-emerald-600 dark:text-emerald-400" :
                parseFloat(winRate) >= 30 ? "text-amber-600 dark:text-amber-400" :
                "text-red-600 dark:text-red-400"
              )}>
                {winRate}%
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    parseFloat(winRate) >= 50 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                    parseFloat(winRate) >= 30 ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                    "bg-gradient-to-r from-red-400 to-red-500"
                  )}
                  style={{ width: `${Math.min(parseFloat(winRate), 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setShowDetail(null); setSelectedContractorId(null); }}>
        <TabsList className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 h-auto">
          <TabsTrigger
            value="bids"
            className={cn(
              "text-xs rounded-md px-4 py-2 transition-all",
              activeTab === "bids" && "bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400"
            )}
          >
            <Gavel className="h-3.5 w-3.5 me-1.5" />
            {ar ? "العطاءات" : "Bids"}
          </TabsTrigger>
          <TabsTrigger
            value="contractors"
            className={cn(
              "text-xs rounded-md px-4 py-2 transition-all",
              activeTab === "contractors" && "bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400"
            )}
          >
            <Users className="h-3.5 w-3.5 me-1.5" />
            {ar ? "المقاولين" : "Contractors"}
          </TabsTrigger>
          <TabsTrigger
            value="matrix"
            className={cn(
              "text-xs rounded-md px-4 py-2 transition-all",
              activeTab === "matrix" && "bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5 me-1.5" />
            {ar ? "مصفوفة المقارنة" : "Comparison Matrix"}
          </TabsTrigger>
        </TabsList>

        {/* Bids Tab */}
        <TabsContent value="bids" className="mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ar ? "بحث..." : "Search..."} className="ps-9 h-8 text-sm rounded-lg" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
                <SelectItem value="submitted">{ar ? "مقدم" : "Submitted"}</SelectItem>
                <SelectItem value="under_review">{ar ? "قيد المراجعة" : "Under Review"}</SelectItem>
                <SelectItem value="accepted">{ar ? "مقبول" : "Accepted"}</SelectItem>
                <SelectItem value="rejected">{ar ? "مرفوض" : "Rejected"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            {/* Table */}
            <div className={`flex-1 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm ${showDetail ? "hidden lg:block" : ""}`}>
              <ScrollArea className="max-h-[calc(100vh-420px)]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                      <TableHead className="text-xs font-semibold">{ar ? "المشروع" : "Project"}</TableHead>
                      <TableHead className="text-xs font-semibold">{ar ? "المقاول" : "Contractor"}</TableHead>
                      <TableHead className="text-xs font-semibold text-end">{ar ? "المبلغ" : "Amount"}</TableHead>
                      <TableHead className="text-xs font-semibold text-end">{ar ? "التقييم" : "Score"}</TableHead>
                      <TableHead className="text-xs font-semibold">{ar ? "الموعد" : "Deadline"}</TableHead>
                      <TableHead className="text-xs font-semibold">{ar ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-xs font-semibold text-start">{ar ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((bid, idx) => {
                      const sc = getStatusConfig(bid.status);
                      return (
                        <TableRow
                          key={bid.id}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20",
                            showDetail?.id === bid.id && "bg-teal-50/50 dark:bg-teal-950/20"
                          )}
                          onClick={() => setShowDetail(bid)}
                        >
                          <TableCell className="text-sm font-medium text-slate-900 dark:text-white">
                            {ar ? bid.project.name : bid.project.nameEn || bid.project.name}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm text-slate-900 dark:text-white">{bid.contractorName}</div>
                              {bid.contractor && (
                                <span className="text-[10px] text-teal-600 dark:text-teal-400">{ar ? bid.contractor.companyName : bid.contractor.companyEn || bid.contractor.companyName}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-900 dark:text-white text-end font-mono tabular-nums">
                            {formatCurrency(bid.amount, ar)}
                          </TableCell>
                          <TableCell className="text-end">
                            {bid.totalScore > 0 ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className={cn(
                                  "text-xs font-bold tabular-nums",
                                  bid.totalScore >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                                  bid.totalScore >= 40 ? "text-amber-600" : "text-red-500"
                                )}>
                                  {Math.round(bid.totalScore)}
                                </span>
                                <Progress value={bid.totalScore} className="w-14 h-1 [&>div]:bg-teal-500" />
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DeadlineBadge deadline={bid.deadline} ar={ar} />
                          </TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", sc.color)}>
                              {ar ? sc.ar : sc.en}
                            </span>
                          </TableCell>
                          <TableCell className="text-start">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setShowDetail(bid); }}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={(e) => { e.stopPropagation(); setEvaluateBid(bid); }} title={ar ? "تقييم" : "Evaluate"}>
                                <ClipboardCheck className="h-3.5 w-3.5" />
                              </Button>
                              {(bid.status === "submitted" || bid.status === "under_review") && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: bid.id, status: "accepted" }); }}><CheckCircle className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: bid.id, status: "rejected" }); }}><XCircle className="h-3.5 w-3.5" /></Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-400">{ar ? "لا توجد عطاءات" : "No bids found"}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Detail Panel */}
            {showDetail && (
              <div className="w-full lg:w-[380px] flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{ar ? "تفاصيل العطاء" : "Bid Details"}</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setShowDetail(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[300px] lg:h-[calc(100vh-420px)]">
                  <div className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-slate-400">{ar ? "المشروع" : "Project"}</span>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{ar ? showDetail.project.name : showDetail.project.nameEn || showDetail.project.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">{ar ? "المقاول" : "Contractor"}</span>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{showDetail.contractorName}</p>
                        {showDetail.contractorContact && <p className="text-xs text-slate-500 mt-0.5" dir="ltr">{showDetail.contractorContact}</p>}
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">{ar ? "المبلغ" : "Amount"}</span>
                        <p className="text-lg font-bold text-teal-600 dark:text-teal-400 tabular-nums font-mono">{formatCurrency(showDetail.amount, ar)}</p>
                      </div>

                      {/* Scores */}
                      {showDetail.totalScore > 0 && (
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
                          <span className="text-xs font-semibold text-slate-500">{ar ? "التقييم" : "Evaluation"}</span>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-[10px] text-slate-400">{ar ? "فني" : "Tech"}</p>
                              <p className="text-sm font-bold text-amber-600 tabular-nums">{showDetail.technicalScore}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400">{ar ? "مالي" : "Fin"}</p>
                              <p className="text-sm font-bold text-cyan-600 tabular-nums">{showDetail.financialScore}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400">{ar ? "إجمالي" : "Total"}</p>
                              <p className="text-sm font-bold text-teal-600 tabular-nums">{Math.round(showDetail.totalScore)}</p>
                            </div>
                          </div>
                          <Progress value={showDetail.totalScore} className="h-2 [&>div]:bg-teal-500" />
                        </div>
                      )}

                      <div>
                        <span className="text-xs text-slate-400">{ar ? "الحالة" : "Status"}</span>
                        <div className="mt-1">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", getStatusConfig(showDetail.status).color)}>
                            {ar ? getStatusConfig(showDetail.status).ar : getStatusConfig(showDetail.status).en}
                          </span>
                        </div>
                      </div>

                      {showDetail.deadline && (
                        <div>
                          <span className="text-xs text-slate-400">{ar ? "الموعد النهائي" : "Deadline"}</span>
                          <div className="mt-1"><DeadlineBadge deadline={showDetail.deadline} ar={ar} /></div>
                        </div>
                      )}

                      {showDetail.evaluationNotes && (
                        <div>
                          <span className="text-xs text-slate-400">{ar ? "ملاحظات التقييم" : "Eval Notes"}</span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{showDetail.evaluationNotes}</p>
                        </div>
                      )}

                      {showDetail.notes && (
                        <div>
                          <span className="text-xs text-slate-400">{ar ? "ملاحظات" : "Notes"}</span>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{showDetail.notes}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-slate-400">{ar ? "تاريخ التقديم" : "Submitted"}</span>
                        <p className="text-sm text-slate-500">{new Date(showDetail.createdAt).toLocaleDateString(ar ? "ar-AE" : "en-US")}</p>
                      </div>
                    </div>

                    {(showDetail.status === "submitted" || showDetail.status === "under_review") && (
                      <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={() => statusMutation.mutate({ id: showDetail.id, status: "accepted" })}>
                          <CheckCircle className="h-3.5 w-3.5 me-1" />{ar ? "قبول" : "Accept"}
                        </Button>
                        <Button size="sm" className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg" onClick={() => statusMutation.mutate({ id: showDetail.id, status: "rejected" })}>
                          <XCircle className="h-3.5 w-3.5 me-1" />{ar ? "رفض" : "Reject"}
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 rounded-lg" onClick={() => setEvaluateBid(showDetail)}>
                        <ClipboardCheck className="h-3.5 w-3.5 me-1" />{ar ? "تقييم" : "Evaluate"}
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-red-500 hover:text-red-600 rounded-lg" onClick={() => {
                        if (confirm(ar ? "حذف العطاء؟" : "Delete bid?")) deleteMutation.mutate(showDetail.id);
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Contractors Tab */}
        <TabsContent value="contractors" className="mt-4">
          <div className="flex gap-4">
            <div className={`flex-1 ${selectedContractorId ? "hidden lg:block" : ""}`}>
              <ContractorsTab
                ar={ar}
                projectId={projectId}
                onSelectContractor={(c) => setSelectedContractorId(c.id)}
              />
            </div>
            {selectedContractorId && (
              <ContractorDetailPanel
                contractorId={selectedContractorId}
                ar={ar}
                onClose={() => setSelectedContractorId(null)}
              />
            )}
          </div>
        </TabsContent>

        {/* Comparison Matrix Tab */}
        <TabsContent value="matrix" className="mt-4">
          <ComparisonMatrix bids={projectId ? filtered : bids} ar={ar} />
        </TabsContent>
      </Tabs>

      {/* Add Bid Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setFormData(emptyForm); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{ar ? "عطاء جديد" : "New Bid"}</DialogTitle>
            <DialogDescription>{ar ? "إضافة عطاء جديد" : "Add a new bid"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "المشروع" : "Project"} *</Label>
              <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue placeholder={ar ? "اختر مشروع" : "Select project"} /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{ar ? p.name : p.nameEn || p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {/* Contractor link */}
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "ربط بمقاول (اختياري)" : "Link to Contractor (optional)"}</Label>
              <Select value={formData.contractorId} onValueChange={(v) => {
                const c = contractorsList.find((x) => x.id === v);
                setFormData({
                  ...formData,
                  contractorId: v,
                  contractorName: c ? (ar ? c.name : c.nameEn || c.name) : formData.contractorName,
                  contractorContact: c ? c.phone : formData.contractorContact,
                });
              }}>
                <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue placeholder={ar ? "اختر مقاول" : "Select contractor"} /></SelectTrigger>
                <SelectContent>
                  {contractorsList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{ar ? c.name : c.nameEn || c.name} — {ar ? c.companyName : c.companyEn || c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "اسم المقاول" : "Contractor Name"} *</Label>
                <Input value={formData.contractorName} onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })} placeholder={ar ? "اسم المقاول" : "Contractor name"} className="h-8 text-sm rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "التواصل" : "Contact"}</Label>
                <Input value={formData.contractorContact} onChange={(e) => setFormData({ ...formData, contractorContact: e.target.value })} placeholder={ar ? "رقم الهاتف أو البريد" : "Phone or email"} className="h-8 text-sm rounded-lg" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "المبلغ (د.إ)" : "Amount (AED)"}</Label>
                <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0" className="h-8 text-sm tabular-nums font-mono rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "الموعد النهائي" : "Deadline"}</Label>
                <Input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="h-8 text-sm rounded-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder={ar ? "ملاحظات إضافية" : "Additional notes"} className="text-sm min-h-[60px] rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setFormData(emptyForm); }}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg" onClick={() => createMutation.mutate(formData)} disabled={!formData.projectId || !formData.contractorName || createMutation.isPending}>
              {createMutation.isPending ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Dialog */}
      {evaluateBid && (
        <EvaluationDialog
          bid={evaluateBid}
          ar={ar}
          open={!!evaluateBid}
          onClose={() => setEvaluateBid(null)}
        />
      )}
    </div>
  );
}
