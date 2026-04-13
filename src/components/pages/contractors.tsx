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
  Calendar,
  ArrowRight,
  Banknote,
  Briefcase,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

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
  classification: string;
  establishmentDate: string | null;
  workerCount: number;
  engineerCount: number;
  tradeLicense: string;
  tradeLicenseExpiry: string | null;
  vatNumber: string;
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
    general: { ar: "عام", en: "General", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
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

function RatingStars({ rating, size = "sm", interactive = false, onRate }: { rating: number; size?: "sm" | "md"; interactive?: boolean; onRate?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size === "sm" ? "h-3 w-3" : "h-4 w-4",
            i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-600",
            interactive && "cursor-pointer hover:scale-110 transition-transform"
          )}
          onClick={interactive && onRate ? () => onRate(i) : undefined}
        />
      ))}
    </div>
  );
}

const emptyForm = {
  name: "", nameEn: "", companyName: "", companyEn: "", contactPerson: "",
  phone: "", email: "", address: "", crNumber: "", licenseNumber: "",
  licenseExpiry: "", classification: "", establishmentDate: "", workerCount: "", engineerCount: "",
  tradeLicense: "", tradeLicenseExpiry: "", vatNumber: "", category: "civil", rating: "3", specialties: "",
  experience: "", bankName: "", bankAccount: "", iban: "", notes: "",
};

// ===== Section Header (shared across form sections) =====
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
      <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
    </div>
  );
}

// ===== Full-Page Create Form =====
function ContractorCreateForm({
  ar,
  formData,
  setFormData,
  saveMutation,
  onCancel,
}: {
  ar: boolean;
  formData: typeof emptyForm;
  setFormData: (d: typeof emptyForm) => void;
  saveMutation: { isPending: boolean; mutate: (data: typeof emptyForm) => void };
  onCancel: () => void;
}) {
  const update = (field: string, value: string) => setFormData({ ...formData, [field]: value });

  const inputCls = "h-9 text-sm rounded-lg border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
  const labelCls = "text-xs font-medium text-slate-600 dark:text-slate-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <Users className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {ar ? "إضافة مقاول جديد" : "Add New Contractor"}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {ar ? "أدخل بيانات المقاول بالكامل" : "Enter the complete contractor profile"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-slate-500" onClick={onCancel}>
          <X className="h-4 w-4 me-1" />{ar ? "إلغاء" : "Cancel"}
        </Button>
      </div>

      {/* Section 1: Basic Info */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="p-5 space-y-4">
          <SectionHeader icon={Building2} title={ar ? "المعلومات الأساسية" : "Basic Information"} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "اسم الشركة (عربي)" : "Company Name (Ar)"} <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => update("name", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "اسم الشركة (إنجليزي)" : "Company Name (En)"}</Label>
              <Input value={formData.nameEn} onChange={(e) => update("nameEn", e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "التخصص" : "Category"} <span className="text-red-500">*</span></Label>
              <Select value={formData.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger className={cn(inputCls)}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">{ar ? "أشغال مدنية" : "Civil"}</SelectItem>
                  <SelectItem value="electrical">{ar ? "كهرباء" : "Electrical"}</SelectItem>
                  <SelectItem value="mep">MEP</SelectItem>
                  <SelectItem value="finishing">{ar ? "تشطيبات" : "Finishing"}</SelectItem>
                  <SelectItem value="plumbing">{ar ? "سباكة" : "Plumbing"}</SelectItem>
                  <SelectItem value="hvac">{ar ? "تكييف" : "HVAC"}</SelectItem>
                  <SelectItem value="general">{ar ? "عام" : "General"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "جهة الاتصال" : "Contact Person"}</Label>
              <Input value={formData.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "الهاتف" : "Phone"}</Label>
              <Input value={formData.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "البريد الإلكتروني" : "Email"}</Label>
              <Input value={formData.email} onChange={(e) => update("email", e.target.value)} className={inputCls} dir="ltr" type="email" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Company Details */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="p-5 space-y-4">
          <SectionHeader icon={Award} title={ar ? "تفاصيل الشركة" : "Company Details"} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "رقم السجل التجاري" : "CR Number"}</Label>
              <Input value={formData.crNumber} onChange={(e) => update("crNumber", e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "رقم الترخيص" : "License Number"}</Label>
              <Input value={formData.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "انتهاء الترخيص" : "License Expiry"}</Label>
              <Input type="date" value={formData.licenseExpiry} onChange={(e) => update("licenseExpiry", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "تصنيف المقاول" : "Classification"}</Label>
              <Select value={formData.classification} onValueChange={(v) => update("classification", v)}>
                <SelectTrigger className={cn(inputCls)}><SelectValue placeholder={ar ? "اختر التصنيف" : "Select classification"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">{ar ? "الدرجة الأولى" : "1st Class"}</SelectItem>
                  <SelectItem value="second">{ar ? "الدرجة الثانية" : "2nd Class"}</SelectItem>
                  <SelectItem value="third">{ar ? "الدرجة الثالثة" : "3rd Class"}</SelectItem>
                  <SelectItem value="fourth">{ar ? "الدرجة الرابعة" : "4th Class"}</SelectItem>
                  <SelectItem value="fifth">{ar ? "الدرجة الخامسة" : "5th Class"}</SelectItem>
                  <SelectItem value="special">{ar ? "فئة خاصة" : "Special Category"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "تاريخ التأسيس" : "Establishment Date"}</Label>
              <Input type="date" value={formData.establishmentDate} onChange={(e) => update("establishmentDate", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "عدد العمال" : "Number of Workers"}</Label>
              <Input type="number" value={formData.workerCount} onChange={(e) => update("workerCount", e.target.value)} className={inputCls} min="0" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "عدد المهندسين" : "Number of Engineers"}</Label>
              <Input type="number" value={formData.engineerCount} onChange={(e) => update("engineerCount", e.target.value)} className={inputCls} min="0" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "رقم السجل التجاري" : "Trade License Number"}</Label>
              <Input value={formData.tradeLicense} onChange={(e) => update("tradeLicense", e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "انتهاء السجل التجاري" : "Trade License Expiry"}</Label>
              <Input type="date" value={formData.tradeLicenseExpiry} onChange={(e) => update("tradeLicenseExpiry", e.target.value)} className={inputCls} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Financial */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="p-5 space-y-4">
          <SectionHeader icon={Banknote} title={ar ? "المعلومات المالية" : "Financial Information"} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "الرقم الضريبي (VAT)" : "VAT Registration No."}</Label>
              <Input value={formData.vatNumber} onChange={(e) => update("vatNumber", e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "اسم البنك" : "Bank Name"}</Label>
              <Input value={formData.bankName} onChange={(e) => update("bankName", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>IBAN</Label>
              <Input value={formData.iban} onChange={(e) => update("iban", e.target.value)} className={cn(inputCls, "font-mono")} dir="ltr" placeholder="AE00 0000 0000 0000 0000 000" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Additional */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="p-5 space-y-4">
          <SectionHeader icon={Sparkles} title={ar ? "معلومات إضافية" : "Additional Information"} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rating - Interactive Stars */}
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "التقييم" : "Rating"}</Label>
              <div className="flex items-center gap-3">
                <RatingStars
                  rating={Number(formData.rating)}
                  size="md"
                  interactive
                  onRate={(r) => update("rating", String(r))}
                />
                <span className="text-sm text-slate-500">{formData.rating}/5</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>{ar ? "التخصصات" : "Specialties"}</Label>
              <Input
                value={formData.specialties}
                onChange={(e) => update("specialties", e.target.value)}
                className={inputCls}
                placeholder={ar ? "مفصولة بفواصل (مثال: فيلات، مباني)" : "Comma-separated (e.g., Villas, Buildings)"}
              />
              {formData.specialties && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {formData.specialties.split(",").filter(Boolean).map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{s.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className={labelCls}>{ar ? "وصف الخبرة" : "Experience Description"}</Label>
              <Textarea
                value={formData.experience}
                onChange={(e) => update("experience", e.target.value)}
                className={cn(inputCls, "min-h-[80px]")}
                placeholder={ar ? "نبذة عن خبرة المقاول ومشاريعه السابقة..." : "Brief about the contractor's experience and past projects..."}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => update("notes", e.target.value)}
                className={cn(inputCls, "min-h-[60px]")}
                placeholder={ar ? "أي ملاحظات إضافية..." : "Any additional notes..."}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-6">
        <Button variant="outline" className="h-9 rounded-lg" onClick={onCancel}>
          {ar ? "إلغاء" : "Cancel"}
        </Button>
        <Button
          className="h-9 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20 min-w-[120px]"
          onClick={() => saveMutation.mutate(formData)}
          disabled={!formData.name || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {ar ? "جارٍ الحفظ..." : "Saving..."}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {ar ? "إضافة المقاول" : "Add Contractor"}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ===== RFQs View (Request for Quotations) =====
interface RFQItem {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  category: string;
  deadline: string;
  status: "draft" | "sent" | "in_review" | "awarded" | "cancelled";
  createdAt: string;
  contractorIds: string[];
  responseCount: number;
}

function getRFQStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string }> = {
    draft: { ar: "مسودة", en: "Draft", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    sent: { ar: "مرسل", en: "Sent", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
    in_review: { ar: "قيد المراجعة", en: "In Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
    awarded: { ar: "تم الترسية", en: "Awarded", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
    cancelled: { ar: "ملغي", en: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  };
  return configs[status] || configs.draft;
}

// Demo RFQ data for initial display
const DEMO_RFQS: RFQItem[] = [
  {
    id: "rfq-001",
    title: "أعمال الحفر والأساسات - فيلا فاخرة",
    description: "طلب تسعير لأعمال الحفر وتأسيس الأساسات لمشروع فيلا فاخرة في المنطقة الأولى بدبي",
    projectId: "prj-001",
    projectName: "فيلا فاخرة - المنطقة الأولى",
    category: "civil",
    deadline: "2024-06-15",
    status: "sent",
    createdAt: "2024-05-01",
    contractorIds: ["c1", "c2"],
    responseCount: 2,
  },
  {
    id: "rfq-002",
    title: "أعمال التكييف المركزي - مبنى سكني",
    description: "طلب تسعير لتوريد وتركيب نظام التكييف المركزي للمبنى السكني متعدد الطوابق",
    projectId: "prj-002",
    projectName: "مبنى سكني متعدد الطوابق",
    category: "hvac",
    deadline: "2024-07-01",
    status: "in_review",
    createdAt: "2024-05-10",
    contractorIds: ["c3"],
    responseCount: 1,
  },
  {
    id: "rfq-003",
    title: "أعمال التشطيبات الداخلية - مجمع تجاري",
    description: "طلب تسعير لأعمال التشطيبات الداخلية للمجمع التجاري في المنطقة الحرة",
    projectId: "prj-003",
    projectName: "مجمع تجاري - المنطقة الحرة",
    category: "finishing",
    deadline: "2024-08-15",
    status: "draft",
    createdAt: "2024-05-20",
    contractorIds: [],
    responseCount: 0,
  },
];

function RFQsView({ ar, contractors, onBack, projectId }: {
  ar: boolean;
  contractors: ContractorItem[];
  onBack: () => void;
  projectId?: string;
}) {
  const [rfqs] = useState<RFQItem[]>(DEMO_RFQS);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRFQ, setNewRFQ] = useState({
    title: "",
    description: "",
    category: "civil",
    deadline: "",
  });

  const filteredRFQs = rfqs.filter((r) => statusFilter === "all" || r.status === statusFilter);

  const statusCounts = rfqs.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const inputCls = "h-9 text-sm rounded-lg border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Gavel className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{ar ? "طلبات العطاءات" : "Request for Quotations"}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{ar ? "إدارة طلبات العطاءات للمقاولين" : "Manage RFQs for contractors"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-3.5 w-3.5 me-1" />
            {ar ? "طلب عطاء جديد" : "New RFQ"}
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={onBack}>
            <ArrowRight className="h-3.5 w-3.5 me-1 rotate-180" />
            {ar ? "العودة للقائمة" : "Back to List"}
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "all", ar: "الكل", en: "All" },
          { value: "draft", ar: "مسودة", en: "Draft" },
          { value: "sent", ar: "مرسل", en: "Sent" },
          { value: "in_review", ar: "قيد المراجعة", en: "In Review" },
          { value: "awarded", ar: "تم الترسية", en: "Awarded" },
          { value: "cancelled", ar: "ملغي", en: "Cancelled" },
        ].map((s) => (
          <Button
            key={s.value}
            variant={statusFilter === s.value ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-7 text-xs rounded-lg",
              statusFilter === s.value
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "border-slate-200 dark:border-slate-700"
            )}
            onClick={() => setStatusFilter(s.value)}
          >
            {ar ? s.ar : s.en}
            <span className="ms-1 text-[10px] opacity-70">
              ({s.value === "all" ? rfqs.length : (statusCounts[s.value] || 0)})
            </span>
          </Button>
        ))}
      </div>

      {/* RFQ List */}
      {filteredRFQs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
          <Gavel className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">{ar ? "لا توجد طلبات عطاء" : "No RFQs Found"}</p>
          <p className="text-xs text-slate-400">{ar ? "أنشئ طلب عطاء جديد للبدء" : "Create a new RFQ to get started"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRFQs.map((rfq) => {
            const statusConf = getRFQStatusConfig(rfq.status);
            const catConf = getCategoryConfig(rfq.category);
            return (
              <Card key={rfq.id} className="border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-all overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rfq.title}</h4>
                        <Badge className={cn("text-[10px]", statusConf.color)}>{ar ? statusConf.ar : statusConf.en}</Badge>
                        <Badge className={cn("text-[10px]", catConf.color)}>{ar ? catConf.ar : catConf.en}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{rfq.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {rfq.projectName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {ar ? "الموعد النهائي" : "Deadline"}: {rfq.deadline}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {rfq.responseCount} {ar ? "استجابة" : "responses"}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg flex-shrink-0">
                      {ar ? "عرض التفاصيل" : "View Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create RFQ Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-4.5 w-4.5 text-teal-600" />
              {ar ? "طلب عطاء جديد" : "New Request for Quotation"}
            </DialogTitle>
            <DialogDescription>
              {ar ? "أنشئ طلب عطاء جديد وأرسله للمقاولين المؤهلين" : "Create a new RFQ and send it to qualified contractors"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{ar ? "عنوان الطلب" : "RFQ Title"} <span className="text-red-500">*</span></Label>
              <Input
                value={newRFQ.title}
                onChange={(e) => setNewRFQ({ ...newRFQ, title: e.target.value })}
                className={inputCls}
                placeholder={ar ? "مثال: أعمال الحفر والأساسات" : "e.g., Excavation and Foundation Works"}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{ar ? "الوصف" : "Description"} <span className="text-red-500">*</span></Label>
              <Textarea
                value={newRFQ.description}
                onChange={(e) => setNewRFQ({ ...newRFQ, description: e.target.value })}
                className={cn(inputCls, "min-h-[80px]")}
                placeholder={ar ? "وصف تفصيلي لمتطلبات العطاء..." : "Detailed description of the RFQ requirements..."}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{ar ? "الفئة" : "Category"}</Label>
                <Select value={newRFQ.category} onValueChange={(v) => setNewRFQ({ ...newRFQ, category: v })}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
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
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{ar ? "الموعد النهائي" : "Deadline"}</Label>
                <Input
                  type="date"
                  value={newRFQ.deadline}
                  onChange={(e) => setNewRFQ({ ...newRFQ, deadline: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{ar ? "المقاولون المختارون" : "Selected Contractors"}</Label>
              <div className="text-xs text-slate-400 mb-1">
                {ar ? `${contractors.length} مقاول متاح` : `${contractors.length} contractors available`}
              </div>
              <div className="max-h-[120px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                {contractors.slice(0, 5).map((c) => (
                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">{ar ? c.name : c.nameEn || c.name}</span>
                    <Badge className={cn("text-[9px] ms-auto", getCategoryConfig(c.category).color)}>
                      {ar ? getCategoryConfig(c.category).ar : getCategoryConfig(c.category).en}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-9 rounded-lg" onClick={() => setShowCreateDialog(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              className="h-9 bg-teal-600 hover:bg-teal-700 text-white rounded-lg min-w-[120px]"
              disabled={!newRFQ.title || !newRFQ.description}
              onClick={() => {
                // In production this would call the API
                setShowCreateDialog(false);
                setNewRFQ({ title: "", description: "", category: "civil", deadline: "" });
              }}
            >
              {ar ? "إرسال الطلب" : "Submit RFQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Main Component =====
interface ContractorsPageProps { language: "ar" | "en"; projectId?: string; initialTab?: "list" | "create" | "rfqs"; }

export default function ContractorsPage({ language, projectId, initialTab }: ContractorsPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [activeView, setActiveView] = useState<"list" | "create" | "rfqs">(initialTab || "list");

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
      if (activeView === "create") {
        setActiveView("list");
      }
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

  // ===== Full-Page Create View =====
  if (activeView === "create" && !isEditing) {
    return (
      <ContractorCreateForm
        ar={ar}
        formData={formData}
        setFormData={setFormData}
        saveMutation={saveMutation}
        onCancel={() => { setFormData(emptyForm); setActiveView("list"); }}
      />
    );
  }

  // ===== RFQs View =====
  if (activeView === "rfqs") {
    return (
      <RFQsView ar={ar} contractors={contractors} onBack={() => setActiveView("list")} projectId={projectId} />
    );
  }

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
                        licenseExpiry: detail.licenseExpiry || "",
                        classification: detail.classification,
                        establishmentDate: detail.establishmentDate || "",
                        workerCount: String(detail.workerCount),
                        engineerCount: String(detail.engineerCount),
                        tradeLicense: detail.tradeLicense,
                        tradeLicenseExpiry: detail.tradeLicenseExpiry || "",
                        vatNumber: detail.vatNumber,
                        category: detail.category,
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
                  {detail.classification && (
                    <div className="flex items-center gap-2.5">
                      <Award className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{ar ? "التصنيف" : "Classification"}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300">{detail.classification}</span>
                      </div>
                    </div>
                  )}
                  {(detail.workerCount > 0 || detail.engineerCount > 0) && (
                    <div className="flex items-center gap-2.5">
                      <Users className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{ar ? "القوى العاملة" : "Workforce"}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          {detail.workerCount} {ar ? "عامل" : "workers"} / {detail.engineerCount} {ar ? "مهندس" : "engineers"}
                        </span>
                      </div>
                    </div>
                  )}
                  {detail.tradeLicense && (
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{ar ? "السجل التجاري" : "Trade License"}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{detail.tradeLicense}</span>
                        {detail.tradeLicenseExpiry && (
                          <span className="text-[10px] text-slate-400 block ms-4">
                            {ar ? "ينتهي: " : "Expires: "}{new Date(detail.tradeLicenseExpiry).toLocaleDateString(ar ? "ar-AE" : "en-US")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {detail.vatNumber && (
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{ar ? "الرقم الضريبي" : "VAT No."}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{detail.vatNumber}</span>
                      </div>
                    </div>
                  )}
                  {detail.establishmentDate && (
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{ar ? "تاريخ التأسيس" : "Established"}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          {new Date(detail.establishmentDate).toLocaleDateString(ar ? "ar-AE" : "en-US")}
                        </span>
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
              <Label className="text-xs">{ar ? "تصنيف المقاول" : "Classification"}</Label>
              <Select value={formData.classification} onValueChange={(v) => setFormData({ ...formData, classification: v })}>
                <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue placeholder={ar ? "اختر التصنيف" : "Select classification"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">{ar ? "الدرجة الأولى" : "1st Class"}</SelectItem>
                  <SelectItem value="second">{ar ? "الدرجة الثانية" : "2nd Class"}</SelectItem>
                  <SelectItem value="third">{ar ? "الدرجة الثالثة" : "3rd Class"}</SelectItem>
                  <SelectItem value="fourth">{ar ? "الدرجة الرابعة" : "4th Class"}</SelectItem>
                  <SelectItem value="fifth">{ar ? "الدرجة الخامسة" : "5th Class"}</SelectItem>
                  <SelectItem value="special">{ar ? "فئة خاصة" : "Special Category"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "تاريخ التأسيس" : "Established"}</Label>
              <Input type="date" value={formData.establishmentDate} onChange={(e) => setFormData({ ...formData, establishmentDate: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "عدد العمال" : "Workers"}</Label>
              <Input type="number" value={formData.workerCount} onChange={(e) => setFormData({ ...formData, workerCount: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "عدد المهندسين" : "Engineers"}</Label>
              <Input type="number" value={formData.engineerCount} onChange={(e) => setFormData({ ...formData, engineerCount: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "رقم السجل التجاري" : "Trade License"}</Label>
              <Input value={formData.tradeLicense} onChange={(e) => setFormData({ ...formData, tradeLicense: e.target.value })} className="h-8 text-sm rounded-lg" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "انتهاء السجل التجاري" : "Trade License Expiry"}</Label>
              <Input type="date" value={formData.tradeLicenseExpiry} onChange={(e) => setFormData({ ...formData, tradeLicenseExpiry: e.target.value })} className="h-8 text-sm rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{ar ? "الرقم الضريبي" : "VAT Number"}</Label>
              <Input value={formData.vatNumber} onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })} className="h-8 text-sm rounded-lg" dir="ltr" />
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
