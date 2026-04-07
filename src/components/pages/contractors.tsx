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
  Plus,
  Search,
  Trash2,
  Users,
  Star,
  X,
  Gavel,
  ClipboardCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Award,
  TrendingUp,
  Edit3,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Types =====
interface ContractorItem {
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

interface ContractorDetail extends ContractorItem {
  bids: {
    id: string;
    projectId: string;
    contractorName: string;
    amount: number;
    status: string;
    createdAt: string;
    project: { id: string; name: string; nameEn: string; number: string };
  }[];
}

interface ProjectOption { id: string; name: string; nameEn: string; number: string; }

// ===== Helpers =====
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

function getStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string }> = {
    submitted: { ar: "مقدم", en: "Submitted", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
    under_review: { ar: "قيد المراجعة", en: "Under Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
    accepted: { ar: "مقبول", en: "Accepted", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
    rejected: { ar: "مرفوض", en: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  };
  return configs[status] || configs.submitted;
}

function formatCurrency(amount: number, ar: boolean) {
  return `${amount.toLocaleString(ar ? "ar-AE" : "en-US")} ${ar ? "د.إ" : "AED"}`;
}

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

const emptyForm = {
  name: "", nameEn: "", companyName: "", companyEn: "", contactPerson: "",
  phone: "", email: "", address: "", crNumber: "", licenseNumber: "",
  licenseExpiry: "", category: "civil", rating: "3", specialties: "",
  experience: "", bankName: "", bankAccount: "", iban: "", notes: "",
};

// ===== Main Component =====
interface ContractorsPageProps { language: "ar" | "en"; projectId?: string; }

export default function ContractorsPage({ language, projectId }: ContractorsPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const isEditing = !!editingId;

  // Fetch contractors
  const { data: contractors = [], isLoading } = useQuery<ContractorItem[]>({
    queryKey: ["contractors-page", projectId, search, categoryFilter],
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

  // Fetch selected contractor detail
  const { data: detail } = useQuery<ContractorDetail>({
    queryKey: ["contractor-detail-page", selectedContractor],
    queryFn: async () => {
      const res = await fetch(`/api/contractors/${selectedContractor}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedContractor,
  });

  // Create / Update
  const saveMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      if (editingId) {
        const res = await fetch(`/api/contractors/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed");
        return res.json();
      } else {
        const res = await fetch("/api/contractors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors-page"] });
      queryClient.invalidateQueries({ queryKey: ["contractor-detail-page"] });
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      setShowDialog(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/contractors/${id}`, { method: "DELETE" }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors-page"] });
      queryClient.invalidateQueries({ queryKey: ["contractor-detail-page"] });
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      setSelectedContractor(null);
    },
  });

  // Stats
  const totalContractors = contractors.length;
  const avgRating = totalContractors > 0
    ? (contractors.reduce((s, c) => s + c.rating, 0) / totalContractors).toFixed(1)
    : "0";
  const totalBids = contractors.reduce((s, c) => s + c._count.bids, 0);
  const topCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    contractors.forEach((c) => { if (c.category) counts[c.category] = (counts[c.category] || 0) + 1; });
    const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return max ? getCategoryConfig(max[0]) : null;
  }, [contractors]);

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
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Users className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{ar ? "المقاولين" : "Contractors"}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {totalContractors} {ar ? "مقاول" : "contractors"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "بحث..." : "Search..."}
              className="ps-9 h-8 text-sm rounded-lg"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
              <SelectItem value="civil">{ar ? "أشغال مدنية" : "Civil"}</SelectItem>
              <SelectItem value="electrical">{ar ? "كهرباء" : "Electrical"}</SelectItem>
              <SelectItem value="mep">MEP</SelectItem>
              <SelectItem value="finishing">{ar ? "تشطيبات" : "Finishing"}</SelectItem>
              <SelectItem value="plumbing">{ar ? "سباكة" : "Plumbing"}</SelectItem>
              <SelectItem value="hvac">{ar ? "تكييف" : "HVAC"}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
            onClick={() => { setFormData(emptyForm); setEditingId(null); setShowDialog(true); }}
          >
            <Plus className="h-3.5 w-3.5 me-1" />{ar ? "إضافة مقاول" : "Add Contractor"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Users className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-slate-100">{ar ? "إجمالي المقاولين" : "Total Contractors"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{totalContractors}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Star className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-amber-100">{ar ? "متوسط التقييم" : "Avg Rating"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tabular-nums">{avgRating}</span>
              <RatingStars rating={Math.round(Number(avgRating))} />
            </div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Gavel className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-teal-100">{ar ? "إجمالي العطاءات" : "Total Bids"}</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{totalBids}</div>
          </div>
        </Card>
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Building2 className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs text-purple-100">{ar ? "الأكثر تخصصاً" : "Top Category"}</span>
            </div>
            <div className="text-sm font-bold text-white">
              {topCategory ? (ar ? topCategory.ar : topCategory.en) : (ar ? "—" : "—")}
            </div>
          </div>
        </Card>
      </div>

      {/* Grid + Detail */}
      <div className="flex gap-4">
        <div className={`flex-1 ${selectedContractor ? "hidden lg:block" : ""}`}>
          {contractors.length === 0 ? (
            <div className="text-center py-16 text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{ar ? "لا يوجد مقاولين" : "No contractors found"}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-lg"
                onClick={() => { setFormData(emptyForm); setEditingId(null); setShowDialog(true); }}
              >
                <Plus className="h-3.5 w-3.5 me-1" />{ar ? "إضافة مقاول" : "Add Contractor"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {contractors.map((c) => {
                const catConf = getCategoryConfig(c.category);
                const isSelected = selectedContractor === c.id;
                return (
                  <Card
                    key={c.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all overflow-hidden border-slate-200 dark:border-slate-700/50",
                      isSelected && "ring-2 ring-teal-500 border-teal-500"
                    )}
                    onClick={() => setSelectedContractor(c.id)}
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
                          {c.specialties.split(",").slice(0, 3).map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">
                              {s.trim()}
                            </Badge>
                          ))}
                          {c.specialties.split(",").length > 3 && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              +{c.specialties.split(",").length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1">
                          <Gavel className="h-3 w-3" />{c._count.bids}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3" />{c._count.evaluations}
                        </span>
                        {c.phone && (
                          <span className="flex items-center gap-1 ms-auto" dir="ltr">
                            <Phone className="h-3 w-3" />{c.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedContractor && detail && (
          <div className="w-full lg:w-[400px] flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-white/80" />
                  <h3 className="text-sm font-semibold text-white">{ar ? "ملف المقاول" : "Contractor Profile"}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => {
                      setFormData({
                        name: detail.name, nameEn: detail.nameEn, companyName: detail.companyName,
                        companyEn: detail.companyEn, contactPerson: detail.contactPerson,
                        phone: detail.phone, email: detail.email, address: detail.address,
                        crNumber: detail.crNumber, licenseNumber: detail.licenseNumber,
                        licenseExpiry: detail.licenseExpiry || "", category: detail.category,
                        rating: String(detail.rating), specialties: detail.specialties,
                        experience: detail.experience, bankName: detail.bankName,
                        bankAccount: detail.bankAccount, iban: detail.iban, notes: detail.notes,
                      });
                      setEditingId(detail.id);
                      setShowDialog(true);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setSelectedContractor(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <ScrollArea className="h-[300px] lg:h-[calc(100vh-340px)]">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {ar ? detail.name : detail.nameEn || detail.name}
                  </h4>
                  {detail.companyName && (
                    <p className="text-sm text-slate-500">{ar ? detail.companyName : detail.companyEn || detail.companyName}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <RatingStars rating={detail.rating} size="md" />
                    <span className="text-xs text-slate-400">{detail.rating}/5</span>
                  </div>
                  <Badge className={cn("text-[10px]", getCategoryConfig(detail.category).color)}>
                    {ar ? getCategoryConfig(detail.category).ar : getCategoryConfig(detail.category).en}
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {detail.contactPerson && (
                    <div className="flex items-start gap-2.5">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{ar ? "جهة الاتصال" : "Contact"}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300">{detail.contactPerson}</span>
                      </div>
                    </div>
                  )}
                  {detail.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300" dir="ltr">{detail.phone}</span>
                    </div>
                  )}
                  {detail.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300" dir="ltr">{detail.email}</span>
                    </div>
                  )}
                  {detail.address && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{detail.address}</span>
                    </div>
                  )}
                  {detail.crNumber && (
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{ar ? "السجل التجاري" : "CR"}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{detail.crNumber}</span>
                      </div>
                    </div>
                  )}
                  {detail.licenseNumber && (
                    <div className="flex items-center gap-2.5">
                      <Award className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{ar ? "الترخيص" : "License"}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{detail.licenseNumber}</span>
                        {detail.licenseExpiry && (
                          <span className="text-[10px] text-slate-400 block ms-4">
                            {ar ? "ينتهي: " : "Expires: "}{new Date(detail.licenseExpiry).toLocaleDateString(ar ? "ar-AE" : "en-US")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {detail.experience && (
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{ar ? "الخبرة" : "Experience"}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300">{detail.experience}</span>
                      </div>
                    </div>
                  )}
                  {detail.specialties && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {detail.specialties.split(",").map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">{s.trim()}</Badge>
                      ))}
                    </div>
                  )}
                  {detail.notes && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">{ar ? "ملاحظات" : "Notes"}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{detail.notes}</p>
                    </div>
                  )}
                </div>

                {/* Bids */}
                {detail.bids && detail.bids.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <Gavel className="h-3.5 w-3.5" />
                      {ar ? `العطاءات (${detail.bids.length})` : `Bids (${detail.bids.length})`}
                    </h5>
                    <div className="space-y-1.5">
                      {detail.bids.slice(0, 5).map((b) => {
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

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-red-500 hover:text-red-600 rounded-lg"
                  onClick={() => {
                    if (confirm(ar ? "حذف المقاول؟" : "Delete contractor?")) {
                      deleteMutation.mutate(detail.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 me-1" />{ar ? "حذف" : "Delete"}
                </Button>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setEditingId(null); setFormData(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? <Edit3 className="h-5 w-5 text-amber-600" /> : <Users className="h-5 w-5 text-teal-600" />}
              {isEditing ? (ar ? "تعديل مقاول" : "Edit Contractor") : (ar ? "إضافة مقاول جديد" : "Add New Contractor")}
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
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingId(null); setFormData(emptyForm); }}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.name || saveMutation.isPending}
            >
              {saveMutation.isPending ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
