"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Types =====
interface BidItem {
  id: string;
  contractorName: string;
  contractorContact: string;
  amount: number;
  status: string;
  notes: string;
  projectId: string;
  createdAt: string;
  deadline: string | null;
  competitorAmount: number | null;
  project: { id: string; name: string; nameEn: string; number: string };
}

interface ProjectOption { id: string; name: string; nameEn: string; number: string; }

// ===== Helpers =====
function formatCurrency(amount: number, ar: boolean) {
  return `${amount.toLocaleString(ar ? "ar-AE" : "en-US")} ${ar ? "د.إ" : "AED"}`;
}

function getStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string; gradient: string }> = {
    submitted: { ar: "مقدم", en: "Submitted", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300", gradient: "from-sky-500 to-sky-600" },
    under_review: { ar: "قيد المراجعة", en: "Under Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300", gradient: "from-amber-500 to-amber-600" },
    accepted: { ar: "مقبول", en: "Accepted", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300", gradient: "from-emerald-500 to-emerald-600" },
    rejected: { ar: "مرفوض", en: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", gradient: "from-red-500 to-red-600" },
  };
  return configs[status] || configs.submitted;
}

// ===== Deadline Countdown Component =====
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

// ===== Main Component =====
interface BidsPageProps { language: "ar" | "en"; }

export default function BidsPage({ language }: BidsPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showDetail, setShowDetail] = useState<BidItem | null>(null);

  const emptyForm = {
    projectId: "", contractorName: "", contractorContact: "",
    amount: "", notes: "", status: "submitted" as string,
  };
  const [formData, setFormData] = useState(emptyForm);

  // Fetch bids
  const { data: bids = [], isLoading } = useQuery<BidItem[]>({
    queryKey: ["bids"],
    queryFn: async () => {
      const res = await fetch("/api/bids");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery<ProjectOption[]>({
    queryKey: ["projects-list"],
    queryFn: async () => { const res = await fetch("/api/projects-simple"); if (!res.ok) return []; return res.json(); },
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
  const totalBids = filtered.reduce((s, b) => s + b.amount, 0);
  const wonCount = filtered.filter((b) => b.status === "accepted").length;
  const lostCount = filtered.filter((b) => b.status === "rejected").length;
  const winRate = filtered.length > 0 ? ((wonCount / filtered.length) * 100).toFixed(1) : "0";
  const wonAmount = filtered.filter((b) => b.status === "accepted").reduce((s, b) => s + b.amount, 0);

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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{ar ? "العطاءات" : "Bids"}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {bids.length} {ar ? "عطاء" : "bids"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
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
          <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20" onClick={() => { setFormData(emptyForm); setShowDialog(true); }}>
            <Plus className="h-3.5 w-3.5 me-1" />{ar ? "عطاء جديد" : "New Bid"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Bids */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Gavel className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-amber-100">{ar ? "إجمالي العطاءات" : "Total Bids"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{filtered.length}</div>
            <p className="text-[10px] text-white/60 mt-1 font-mono">{formatCurrency(totalBids, ar)}</p>
          </div>
        </Card>

        {/* Won */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Trophy className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-emerald-100">{ar ? "فازت" : "Won"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{wonCount}</div>
            <p className="text-[10px] text-white/60 mt-1 font-mono">{formatCurrency(wonAmount, ar)}</p>
          </div>
        </Card>

        {/* Lost */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><RejectIcon className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-red-100">{ar ? "خسرت" : "Lost"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{lostCount}</div>
            <p className="text-[10px] text-white/60 mt-1 font-mono">
              {formatCurrency(filtered.filter((b) => b.status === "rejected").reduce((s, b) => s + b.amount, 0), ar)}
            </p>
          </div>
        </Card>

        {/* Win Rate */}
        <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/50"><TrendingUp className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{ar ? "نسبة الفوز" : "Win Rate"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xl font-bold tabular-nums",
                parseFloat(winRate) >= 50
                  ? "text-emerald-600 dark:text-emerald-400"
                  : parseFloat(winRate) >= 30
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
              )}>
                {winRate}%
              </span>
              {/* Win rate visual indicator */}
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    parseFloat(winRate) >= 50
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : parseFloat(winRate) >= 30
                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                        : "bg-gradient-to-r from-red-400 to-red-500"
                  )}
                  style={{ width: `${Math.min(parseFloat(winRate), 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={`flex-1 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm ${showDetail ? "hidden lg:block" : ""}`}>
          <ScrollArea className="max-h-[calc(100vh-380px)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                  <TableHead className="text-xs font-semibold">{ar ? "المشروع" : "Project"}</TableHead>
                  <TableHead className="text-xs font-semibold">{ar ? "المقاول" : "Contractor"}</TableHead>
                  <TableHead className="text-xs font-semibold text-end">{ar ? "المبلغ" : "Amount"}</TableHead>
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
                        idx % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-slate-50/50 dark:bg-slate-800/20",
                        showDetail?.id === bid.id && "bg-teal-50/50 dark:bg-teal-950/20"
                      )}
                      onClick={() => setShowDetail(bid)}
                    >
                      <TableCell className="text-sm font-medium text-slate-900 dark:text-white">{ar ? bid.project.name : bid.project.nameEn || bid.project.name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm text-slate-900 dark:text-white">{bid.contractorName}</div>
                          {bid.contractorContact && <div className="text-xs text-slate-400">{bid.contractorContact}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-900 dark:text-white text-end font-mono tabular-nums">{formatCurrency(bid.amount, ar)}</TableCell>
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
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">{ar ? "لا توجد عطاءات" : "No bids found"}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Detail Panel */}
        {showDetail && (
          <div className="w-full lg:w-[380px] flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{ar ? "تفاصيل العطاء" : "Bid Details"}</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden text-white/80 hover:text-white hover:bg-white/10" onClick={() => setShowDetail(null)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <ScrollArea className="h-[300px] lg:h-[calc(100vh-380px)]">
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

                  {/* Competitor comparison */}
                  {showDetail.competitorAmount && showDetail.competitorAmount > 0 && (
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
                      <span className="text-xs text-slate-400">{ar ? "مقارنة الأسعار" : "Price Comparison"}</span>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600 dark:text-slate-300">{ar ? "عرضنا" : "Our Bid"}</span>
                          <span className="text-xs font-medium font-mono tabular-nums text-teal-600 dark:text-teal-400">{formatCurrency(showDetail.amount, ar)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600 dark:text-slate-300">{ar ? "المنافس" : "Competitor"}</span>
                          <span className="text-xs font-medium font-mono tabular-nums text-slate-500">{formatCurrency(showDetail.competitorAmount, ar)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs text-slate-500">{ar ? "الفرق" : "Difference"}</span>
                          <span className={cn(
                            "text-xs font-bold font-mono tabular-nums",
                            showDetail.amount <= showDetail.competitorAmount
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-500"
                          )}>
                            {showDetail.amount <= showDetail.competitorAmount ? "↓ " : "↑ "}
                            {formatCurrency(Math.abs(showDetail.amount - showDetail.competitorAmount), ar)}
                          </span>
                        </div>
                      </div>
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
                      <div className="mt-1">
                        <DeadlineBadge deadline={showDetail.deadline} ar={ar} />
                      </div>
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

                <Button variant="outline" size="sm" className="w-full h-8 text-red-500 hover:text-red-600 mt-2 rounded-lg" onClick={() => {
                  if (confirm(ar ? "حذف العطاء؟" : "Delete bid?")) deleteMutation.mutate(showDetail.id);
                }}>
                  <Trash2 className="h-3.5 w-3.5 me-1" />{ar ? "حذف" : "Delete"}
                </Button>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

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
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "المبلغ (د.إ)" : "Amount (AED)"}</Label>
              <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0" className="h-8 text-sm tabular-nums font-mono rounded-lg" />
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
    </div>
  );
}
