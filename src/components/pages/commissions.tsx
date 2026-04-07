"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  Gift,
  Megaphone,
  Users,
  TrendingUp,
  MoreVertical,
  Wallet,
  Clock,
  BadgeCheck,
  Trash2,
  Edit2,
  UserPlus,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Types =====
interface CommissionItem {
  id: string;
  userId: string;
  projectId: string | null;
  type: string;
  amount: number;
  currency: string;
  percentage: number;
  baseAmount: number;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  description: string;
  paidDate: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  project: { id: string; name: string; nameEn: string; number: string } | null;
  approver: { id: string; name: string } | null;
}

interface ReferralItem {
  id: string;
  referrerId: string;
  referredName: string;
  referredPhone: string;
  referredEmail: string;
  projectId: string | null;
  status: string;
  discountGiven: number;
  rewardAmount: number;
  notes: string;
  createdAt: string;
  referrer: { id: string; name: string; email: string };
  project: { id: string; name: string; nameEn: string; number: string } | null;
}

interface CampaignItem {
  id: string;
  name: string;
  type: string;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  notes: string;
  createdAt: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface ProjectOption {
  id: string;
  name: string;
  nameEn: string;
  number: string;
}

// ===== Helpers =====
function formatCurrency(amount: number, ar: boolean) {
  return `${amount.toLocaleString(ar ? "ar-AE" : "en-US")} ${ar ? "د.إ" : "AED"}`;
}

function getCommissionStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string }> = {
    pending: { ar: "معلّق", en: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
    approved: { ar: "معتمد", en: "Approved", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
    paid: { ar: "مدفوع", en: "Paid", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
    cancelled: { ar: "ملغي", en: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  };
  return configs[status] || configs.pending;
}

function getReferralStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string }> = {
    pending: { ar: "معلّق", en: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
    converted: { ar: "تم التحويل", en: "Converted", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
    rewarded: { ar: "تم المكافأة", en: "Rewarded", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
    expired: { ar: "منتهي", en: "Expired", color: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400" },
  };
  return configs[status] || configs.pending;
}

function getCampaignStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string }> = {
    active: { ar: "نشط", en: "Active", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
    paused: { ar: "متوقف", en: "Paused", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
    completed: { ar: "مكتمل", en: "Completed", color: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400" },
  };
  return configs[status] || configs.active;
}

function getCommissionTypeConfig(type: string) {
  const configs: Record<string, { ar: string; en: string }> = {
    project_referral: { ar: "إحالة مشروع", en: "Project Referral" },
    completion_bonus: { ar: "مكافأة إنجاز", en: "Completion Bonus" },
    client_satisfaction: { ar: "رضا العميل", en: "Client Satisfaction" },
    performance: { ar: "أداء مميز", en: "Performance" },
  };
  return configs[type] || { ar: type, en: type };
}

function getCampaignTypeConfig(type: string) {
  const configs: Record<string, { ar: string; en: string }> = {
    social_media: { ar: "وسائل التواصل", en: "Social Media" },
    google_ads: { ar: "إعلانات جوجل", en: "Google Ads" },
    referral: { ar: "إحالات", en: "Referral" },
    direct: { ar: "مباشر", en: "Direct" },
    exhibition: { ar: "معارض", en: "Exhibition" },
  };
  return configs[type] || { ar: type, en: type };
}

// ===== Main Component =====
interface CommissionsPageProps {
  language: "ar" | "en";
}

export default function CommissionsPage({ language }: CommissionsPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("commissions");

  // Shared fetches
  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ["users-list-commissions"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery<ProjectOption[]>({
    queryKey: ["projects-list-commissions"],
    queryFn: async () => {
      const res = await fetch("/api/projects-simple");
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <Gift className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{ar ? "العمولات والإحالات" : "Commissions & Referrals"}</h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {ar ? "إدارة العمولات والإحالات والحملات التسويقية" : "Manage commissions, referrals and marketing campaigns"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800/50 h-9 p-1">
          <TabsTrigger value="commissions" className="text-xs gap-1.5 h-7 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
            <DollarSign className="h-3.5 w-3.5" />
            {ar ? "العمولات" : "Commissions"}
          </TabsTrigger>
          <TabsTrigger value="referrals" className="text-xs gap-1.5 h-7 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
            <UserPlus className="h-3.5 w-3.5" />
            {ar ? "الإحالات" : "Referrals"}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs gap-1.5 h-7 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
            <Megaphone className="h-3.5 w-3.5" />
            {ar ? "الحملات التسويقية" : "Campaigns"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commissions">
          <CommissionsTab language={language} users={users} projects={projects} />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralsTab language={language} users={users} projects={projects} />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsTab language={language} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== COMMISSIONS TAB =====
function CommissionsTab({ language, users, projects }: { language: "ar" | "en"; users: UserOption[]; projects: ProjectOption[] }) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);

  const emptyForm = {
    userId: "", projectId: "", type: "project_referral", amount: "", percentage: "", baseAmount: "", description: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  const { data: commissions = [], isLoading } = useQuery<CommissionItem[]>({
    queryKey: ["commissions"],
    queryFn: async () => {
      const res = await fetch("/api/commissions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      setShowDialog(false);
      setFormData(emptyForm);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/commissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/commissions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });

  const filtered = commissions.filter((c) => {
    const matchSearch =
      c.user.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.project && (ar ? c.project.name : c.project.nameEn || c.project.name).toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Summary
  const totalPaid = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const totalPending = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0);
  const totalApproved = commissions.filter((c) => c.status === "approved").reduce((s, c) => s + c.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Card key={i} className="py-0 gap-0"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><CheckCircle className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-emerald-100">{ar ? "المدفوع" : "Paid"}</span>
            </div>
            <div className="text-lg font-bold text-white font-mono tabular-nums">{formatCurrency(totalPaid, ar)}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Clock className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-amber-100">{ar ? "المعلّق" : "Pending"}</span>
            </div>
            <div className="text-lg font-bold text-white font-mono tabular-nums">{formatCurrency(totalPending, ar)}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-sky-500 to-cyan-600 dark:from-sky-600 dark:to-cyan-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><BadgeCheck className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-sky-100">{ar ? "المعتمد" : "Approved"}</span>
            </div>
            <div className="text-lg font-bold text-white font-mono tabular-nums">{formatCurrency(totalApproved, ar)}</div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ar ? "بحث..." : "Search..."} className="ps-9 h-8 text-sm rounded-lg" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
            <SelectItem value="pending">{ar ? "معلّق" : "Pending"}</SelectItem>
            <SelectItem value="approved">{ar ? "معتمد" : "Approved"}</SelectItem>
            <SelectItem value="paid">{ar ? "مدفوع" : "Paid"}</SelectItem>
            <SelectItem value="cancelled">{ar ? "ملغي" : "Cancelled"}</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20" onClick={() => { setFormData(emptyForm); setShowDialog(true); }}>
          <Plus className="h-3.5 w-3.5 me-1" />{ar ? "عمولة جديدة" : "New Commission"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <ScrollArea className="max-h-[calc(100vh-380px)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                <TableHead className="text-xs font-semibold">{ar ? "الموظف" : "Employee"}</TableHead>
                <TableHead className="text-xs font-semibold">{ar ? "النوع" : "Type"}</TableHead>
                <TableHead className="text-xs font-semibold text-end">{ar ? "المبلغ" : "Amount"}</TableHead>
                <TableHead className="text-xs font-semibold text-end">{ar ? "النسبة" : "%"}</TableHead>
                <TableHead className="text-xs font-semibold">{ar ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-xs font-semibold hidden lg:table-cell">{ar ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="text-xs font-semibold text-start">{ar ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, idx) => {
                const sc = getCommissionStatusConfig(c.status);
                const tc = getCommissionTypeConfig(c.type);
                return (
                  <TableRow key={c.id} className={cn("transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50", idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <TableCell className="text-sm font-medium text-slate-900 dark:text-white">{c.user.name}</TableCell>
                    <TableCell className="text-xs text-slate-500">{ar ? tc.ar : tc.en}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-900 dark:text-white text-end font-mono tabular-nums">{formatCurrency(c.amount, ar)}</TableCell>
                    <TableCell className="text-xs text-slate-500 text-end font-mono tabular-nums">{c.percentage}%</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", sc.color)}>
                        {ar ? sc.ar : sc.en}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString(ar ? "ar-AE" : "en-US")}</TableCell>
                    <TableCell className="text-start">
                      <div className="flex items-center gap-1">
                        {c.status === "pending" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30" onClick={() => statusMutation.mutate({ id: c.id, status: "approved" })}>
                            <CheckCircle className="h-3 w-3 me-0.5" />{ar ? "اعتماد" : "Approve"}
                          </Button>
                        )}
                        {c.status === "approved" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => statusMutation.mutate({ id: c.id, status: "paid" })}>
                            <Wallet className="h-3 w-3 me-0.5" />{ar ? "دفع" : "Pay"}
                          </Button>
                        )}
                        {(c.status === "pending" || c.status === "approved") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={ar ? "start" : "end"}>
                              <DropdownMenuItem className="text-red-500" onClick={() => deleteMutation.mutate(c.id)}>
                                <Trash2 className="h-3.5 w-3.5 me-1.5" />{ar ? "حذف" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    {ar ? "لا توجد عمولات" : "No commissions found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Create Commission Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setFormData(emptyForm); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{ar ? "عمولة جديدة" : "New Commission"}</DialogTitle>
            <DialogDescription>{ar ? "إضافة عمولة جديدة للموظف" : "Add a new commission for employee"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "الموظف" : "Employee"} *</Label>
                <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                  <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue placeholder={ar ? "اختر موظف" : "Select employee"} /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "النوع" : "Type"}</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_referral">{ar ? "إحالة مشروع" : "Project Referral"}</SelectItem>
                    <SelectItem value="completion_bonus">{ar ? "مكافأة إنجاز" : "Completion Bonus"}</SelectItem>
                    <SelectItem value="client_satisfaction">{ar ? "رضا العميل" : "Client Satisfaction"}</SelectItem>
                    <SelectItem value="performance">{ar ? "أداء مميز" : "Performance"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "المشروع" : "Project"}</Label>
              <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue placeholder={ar ? "اختر مشروع" : "Select project"} /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{ar ? p.name : p.nameEn || p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "المبلغ (د.إ)" : "Amount (AED)"}</Label>
                <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0" className="h-8 text-sm tabular-nums font-mono rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "النسبة %" : "Percentage %"}</Label>
                <Input type="number" value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} placeholder="0" className="h-8 text-sm tabular-nums font-mono rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "المبلغ الأساسي" : "Base Amount"}</Label>
                <Input type="number" value={formData.baseAmount} onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })} placeholder="0" className="h-8 text-sm tabular-nums font-mono rounded-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "الوصف" : "Description"}</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={ar ? "وصف العمولة" : "Commission description"} className="text-sm min-h-[60px] rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setFormData(emptyForm); }}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => createMutation.mutate(formData)} disabled={!formData.userId || !formData.amount || createMutation.isPending}>
              {createMutation.isPending ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== REFERRALS TAB =====
function ReferralsTab({ language, users, projects }: { language: "ar" | "en"; users: UserOption[]; projects: ProjectOption[] }) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);

  const emptyForm = { referrerId: "", referredName: "", referredPhone: "", referredEmail: "", projectId: "", notes: "" };
  const [formData, setFormData] = useState(emptyForm);

  const { data: referrals = [], isLoading } = useQuery<ReferralItem[]>({
    queryKey: ["referrals"],
    queryFn: async () => {
      const res = await fetch("/api/referrals");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      setShowDialog(false);
      setFormData(emptyForm);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/referrals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/referrals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });

  const filtered = referrals.filter((r) => {
    const matchSearch =
      r.referrer.name.toLowerCase().includes(search.toLowerCase()) ||
      r.referredName.toLowerCase().includes(search.toLowerCase()) ||
      r.referredEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRewards = referrals.filter((r) => r.status === "rewarded").reduce((s, r) => s + r.rewardAmount, 0);
  const activeReferrals = referrals.filter((r) => r.status === "pending" || r.status === "converted").length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => <Card key={i} className="py-0 gap-0"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 dark:from-teal-600 dark:to-cyan-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Users className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-teal-100">{ar ? "الإحالات النشطة" : "Active Referrals"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{activeReferrals}</div>
            <p className="text-[10px] text-white/60 mt-1">{referrals.length} {ar ? "إحالة إجمالاً" : "total referrals"}</p>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Gift className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-violet-100">{ar ? "إجمالي المكافآت" : "Total Rewards"}</span>
            </div>
            <div className="text-xl font-bold text-white font-mono tabular-nums">{formatCurrency(totalRewards, ar)}</div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ar ? "بحث..." : "Search..."} className="ps-9 h-8 text-sm rounded-lg" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
            <SelectItem value="pending">{ar ? "معلّق" : "Pending"}</SelectItem>
            <SelectItem value="converted">{ar ? "تم التحويل" : "Converted"}</SelectItem>
            <SelectItem value="rewarded">{ar ? "تم المكافأة" : "Rewarded"}</SelectItem>
            <SelectItem value="expired">{ar ? "منتهي" : "Expired"}</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20" onClick={() => { setFormData(emptyForm); setShowDialog(true); }}>
          <Plus className="h-3.5 w-3.5 me-1" />{ar ? "إحالة جديدة" : "New Referral"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <ScrollArea className="max-h-[calc(100vh-380px)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                <TableHead className="text-xs font-semibold">{ar ? "المحيل" : "Referrer"}</TableHead>
                <TableHead className="text-xs font-semibold">{ar ? "اسم المُحال" : "Referred"}</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">{ar ? "المشروع" : "Project"}</TableHead>
                <TableHead className="text-xs font-semibold">{ar ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-xs font-semibold text-end">{ar ? "المكافأة" : "Reward"}</TableHead>
                <TableHead className="text-xs font-semibold text-start">{ar ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, idx) => {
                const sc = getReferralStatusConfig(r.status);
                return (
                  <TableRow key={r.id} className={cn("transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50", idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <TableCell className="text-sm font-medium text-slate-900 dark:text-white">{r.referrer.name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{r.referredName || "—"}</p>
                        <p className="text-[10px] text-slate-400">{r.referredPhone || r.referredEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-slate-500">{r.project ? (ar ? r.project.name : r.project.nameEn || r.project.name) : "—"}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", sc.color)}>
                        {ar ? sc.ar : sc.en}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-900 dark:text-white text-end font-mono tabular-nums">
                      {r.rewardAmount > 0 ? formatCurrency(r.rewardAmount, ar) : "—"}
                    </TableCell>
                    <TableCell className="text-start">
                      <div className="flex items-center gap-1">
                        {r.status === "pending" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30" onClick={() => statusMutation.mutate({ id: r.id, status: "converted" })}>
                            <ArrowUpRight className="h-3 w-3 me-0.5" />{ar ? "تحويل" : "Convert"}
                          </Button>
                        )}
                        {r.status === "converted" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => statusMutation.mutate({ id: r.id, status: "rewarded" })}>
                            <Gift className="h-3 w-3 me-0.5" />{ar ? "مكافأة" : "Reward"}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400"><MoreVertical className="h-3.5 w-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={ar ? "start" : "end"}>
                            {r.status === "pending" && (
                              <DropdownMenuItem onClick={() => statusMutation.mutate({ id: r.id, status: "expired" })}>
                                <XCircle className="h-3.5 w-3.5 me-1.5 text-slate-400" />{ar ? "انتهاء" : "Expire"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-500" onClick={() => deleteMutation.mutate(r.id)}>
                              <Trash2 className="h-3.5 w-3.5 me-1.5" />{ar ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    {ar ? "لا توجد إحالات" : "No referrals found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Create Referral Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setFormData(emptyForm); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{ar ? "إحالة جديدة" : "New Referral"}</DialogTitle>
            <DialogDescription>{ar ? "إضافة إحالة عميل جديد" : "Add a new client referral"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "المحيل" : "Referrer"} *</Label>
              <Select value={formData.referrerId} onValueChange={(v) => setFormData({ ...formData, referrerId: v })}>
                <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue placeholder={ar ? "اختر المحيل" : "Select referrer"} /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "اسم المُحال" : "Referred Name"} *</Label>
                <Input value={formData.referredName} onChange={(e) => setFormData({ ...formData, referredName: e.target.value })} placeholder={ar ? "اسم العميل المحال" : "Referred client name"} className="h-8 text-sm rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "الهاتف" : "Phone"}</Label>
                <Input value={formData.referredPhone} onChange={(e) => setFormData({ ...formData, referredPhone: e.target.value })} placeholder="+971 XX XXX XXXX" dir="ltr" className="h-8 text-sm rounded-lg text-left" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "البريد الإلكتروني" : "Email"}</Label>
                <Input type="email" value={formData.referredEmail} onChange={(e) => setFormData({ ...formData, referredEmail: e.target.value })} placeholder="email@example.com" dir="ltr" className="h-8 text-sm rounded-lg text-left" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "المشروع" : "Project"}</Label>
                <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                  <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue placeholder={ar ? "اختر مشروع" : "Select project"} /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{ar ? p.name : p.nameEn || p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder={ar ? "ملاحظات إضافية" : "Additional notes"} className="text-sm min-h-[60px] rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setFormData(emptyForm); }}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => createMutation.mutate(formData)} disabled={!formData.referrerId || !formData.referredName || createMutation.isPending}>
              {createMutation.isPending ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== CAMPAIGNS TAB =====
function CampaignsTab({ language }: { language: "ar" | "en" }) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const emptyForm = { name: "", type: "social_media", budget: "", startDate: "", endDate: "", notes: "" };
  const [formData, setFormData] = useState(emptyForm);

  const { data: campaigns = [], isLoading } = useQuery<CampaignItem[]>({
    queryKey: ["marketing-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/marketing-campaigns");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await fetch("/api/marketing-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      setShowDialog(false);
      setFormData(emptyForm);
      setEditId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/marketing-campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/marketing-campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    },
  });

  const handleEdit = (c: CampaignItem) => {
    setEditId(c.id);
    setFormData({
      name: c.name,
      type: c.type,
      budget: String(c.budget),
      startDate: c.startDate ? c.startDate.split("T")[0] : "",
      endDate: c.endDate ? c.endDate.split("T")[0] : "",
      notes: c.notes,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editId) {
      updateMutation.mutate({
        id: editId,
        data: {
          name: formData.name,
          type: formData.type,
          budget: parseFloat(formData.budget) || 0,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          notes: formData.notes,
        },
      });
      setShowDialog(false);
      setEditId(null);
      setFormData(emptyForm);
    } else {
      createMutation.mutate(formData);
    }
  };

  // Summary
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Card key={i} className="py-0 gap-0"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 dark:from-teal-600 dark:to-cyan-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Megaphone className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-teal-100">{ar ? "الحملات" : "Campaigns"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{campaigns.length}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><DollarSign className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-amber-100">{ar ? "الميزانية" : "Budget"}</span>
            </div>
            <div className="text-xl font-bold text-white font-mono tabular-nums">{formatCurrency(totalBudget, ar)}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 dark:from-sky-600 dark:to-blue-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Target className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-sky-100">{ar ? "العملاء المحتملين" : "Leads"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{totalLeads}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><TrendingUp className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-emerald-100">{ar ? "التحويلات" : "Conversions"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{totalConversions}</div>
            <p className="text-[10px] text-white/60 mt-1">
              {totalLeads > 0 ? `${((totalConversions / totalLeads) * 100).toFixed(1)}%` : "—"} {ar ? "معدل التحويل" : "Conv. Rate"}
            </p>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20" onClick={() => { setFormData(emptyForm); setEditId(null); setShowDialog(true); }}>
          <Plus className="h-3.5 w-3.5 me-1" />{ar ? "حملة جديدة" : "New Campaign"}
        </Button>
      </div>

      {/* Campaign Cards Grid */}
      {campaigns.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">{ar ? "لا توجد حملات تسويقية" : "No marketing campaigns yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const sc = getCampaignStatusConfig(c.status);
            const tc = getCampaignTypeConfig(c.type);
            const roi = c.spent > 0 ? (((c.conversions * 5000) - c.spent) / c.spent * 100) : 0;
            const budgetPercent = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;

            return (
              <Card key={c.id} className="border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.name}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">{ar ? tc.ar : tc.en}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ms-2">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", sc.color)}>
                        {ar ? sc.ar : sc.en}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={ar ? "start" : "end"}>
                          <DropdownMenuItem onClick={() => handleEdit(c)}>
                            <Edit2 className="h-3.5 w-3.5 me-1.5" />{ar ? "تعديل" : "Edit"}
                          </DropdownMenuItem>
                          {c.status === "active" && (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: c.id, data: { status: "paused" } })}>
                              <Clock className="h-3.5 w-3.5 me-1.5" />{ar ? "إيقاف" : "Pause"}
                            </DropdownMenuItem>
                          )}
                          {c.status === "paused" && (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: c.id, data: { status: "active" } })}>
                              <ArrowUpRight className="h-3.5 w-3.5 me-1.5" />{ar ? "تفعيل" : "Activate"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-500" onClick={() => deleteMutation.mutate(c.id)}>
                            <Trash2 className="h-3.5 w-3.5 me-1.5" />{ar ? "حذف" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">{ar ? "المصروف من الميزانية" : "Budget Spent"}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">{budgetPercent.toFixed(0)}%</span>
                    </div>
                    <Progress value={budgetPercent} className="h-1.5" />
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-mono tabular-nums">{formatCurrency(c.spent, ar)}</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono tabular-nums">{formatCurrency(c.budget, ar)}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums">{c.leads}</p>
                      <p className="text-[9px] text-slate-500">{ar ? "محتملين" : "Leads"}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{c.conversions}</p>
                      <p className="text-[9px] text-slate-500">{ar ? "تحويلات" : "Conv."}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className={cn("text-lg font-bold tabular-nums", roi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                        {roi >= 0 ? "+" : ""}{roi.toFixed(0)}%
                      </p>
                      <p className="text-[9px] text-slate-500">ROI</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setFormData(emptyForm); setEditId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? (ar ? "تعديل حملة" : "Edit Campaign") : (ar ? "حملة جديدة" : "New Campaign")}</DialogTitle>
            <DialogDescription>{editId ? (ar ? "تعديل بيانات الحملة" : "Update campaign details") : (ar ? "إضافة حملة تسويقية جديدة" : "Add a new marketing campaign")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "اسم الحملة" : "Campaign Name"} *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={ar ? "اسم الحملة" : "Campaign name"} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "النوع" : "Type"}</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_media">{ar ? "وسائل التواصل" : "Social Media"}</SelectItem>
                    <SelectItem value="google_ads">{ar ? "إعلانات جوجل" : "Google Ads"}</SelectItem>
                    <SelectItem value="referral">{ar ? "إحالات" : "Referral"}</SelectItem>
                    <SelectItem value="direct">{ar ? "مباشر" : "Direct"}</SelectItem>
                    <SelectItem value="exhibition">{ar ? "معارض" : "Exhibition"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "الميزانية (د.إ)" : "Budget (AED)"}</Label>
                <Input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="0" className="h-8 text-sm tabular-nums font-mono rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "تاريخ البداية" : "Start Date"}</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="h-8 text-sm rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{ar ? "تاريخ النهاية" : "End Date"}</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="h-8 text-sm rounded-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder={ar ? "ملاحظات" : "Notes"} className="text-sm min-h-[60px] rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setFormData(emptyForm); setEditId(null); }}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave} disabled={!formData.name || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
