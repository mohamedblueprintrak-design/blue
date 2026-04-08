"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  MessageCircle,
  Download,
  CheckCircle2,
  Circle,
  AlertCircle,
  CreditCard,
  ChevronLeft,
  Shield,
  Eye,
  Calendar,
  User,
  ArrowRight,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import LogoImage from "@/components/ui/logo-image";

// ===== Types =====
type PortalView = "login" | "dashboard" | "documents" | "communications" | "payments";

interface MockProject {
  number: string;
  name: string;
  nameEn: string;
  type: string;
  typeEn: string;
  progress: number;
  currentStage: string;
  startDate: string;
  endDate: string;
  clientName: string;
  managerName: string;
  managerPhone: string;
}

interface MockDocument {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  categoryEn: string;
  date: string;
  size: string;
  type: string;
}

interface MockCommunication {
  id: string;
  type: string;
  typeEn: string;
  date: string;
  subject: string;
  subjectEn: string;
  description: string;
  descriptionEn: string;
  outcome: string;
  outcomeEn: string;
}

interface MockInvoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  statusEn: string;
  description: string;
  descriptionEn: string;
}

// ===== Mock Data =====
const MOCK_PROJECTS: Record<string, { phone: string; project: MockProject }> = {
  "PRJ-2024-001": {
    phone: "0501234567",
    project: {
      number: "PRJ-2024-001",
      name: "فيلا الأحلام - أم القيوين",
      nameEn: "Dream Villa - Umm Al Quwain",
      type: "فيلا سكنية",
      typeEn: "Residential Villa",
      progress: 68,
      currentStage: "construction",
      startDate: "2024-03-15",
      endDate: "2025-02-28",
      clientName: "أحمد محمد الشامسي",
      managerName: "م. خالد الرشيدي",
      managerPhone: "+971501234567",
    },
  },
  "PRJ-2024-005": {
    phone: "0559876543",
    project: {
      number: "PRJ-2024-005",
      name: "مجمع النور التجاري",
      nameEn: "Al Noor Commercial Complex",
      type: "مبنى تجاري",
      typeEn: "Commercial Building",
      progress: 35,
      currentStage: "municipality",
      startDate: "2024-06-01",
      endDate: "2025-09-30",
      clientName: "شركة النور للاستثمار",
      managerName: "م. فاطمة الزيودي",
      managerPhone: "+971559876543",
    },
  },
  "PRJ-2024-008": {
    phone: "0561112233",
    project: {
      number: "PRJ-2024-008",
      name: "مستشفى الشفاء",
      nameEn: "Al Shifa Hospital",
      type: "مبنى طبي",
      typeEn: "Medical Building",
      progress: 12,
      currentStage: "design",
      startDate: "2024-09-01",
      endDate: "2026-06-30",
      clientName: "مؤسسة الشفاء الصحية",
      managerName: "م. عبدالله المنصوري",
      managerPhone: "+971561112233",
    },
  },
};

const MOCK_DOCUMENTS: MockDocument[] = [
  { id: "1", title: "المخططات المعمارية المعتمدة", titleEn: "Approved Architectural Drawings", category: "مخططات", categoryEn: "Drawings", date: "2024-11-15", size: "4.2 MB", type: "drawing" },
  { id: "2", title: "المخططات الإنشائية", titleEn: "Structural Drawings", category: "مخططات", categoryEn: "Drawings", date: "2024-11-10", size: "3.8 MB", type: "drawing" },
  { id: "3", title: "مخططات MEP", titleEn: "MEP Drawings", category: "مخططات", categoryEn: "Drawings", date: "2024-10-28", size: "5.1 MB", type: "drawing" },
  { id: "4", title: "عقد التصميم الهندسي", titleEn: "Engineering Design Contract", category: "عقود", categoryEn: "Contracts", date: "2024-03-10", size: "1.2 MB", type: "contract" },
  { id: "5", title: "تقرير التقدم الشهري - نوفمبر", titleEn: "Monthly Progress Report - Nov", category: "تقارير", categoryEn: "Reports", date: "2024-12-01", size: "2.3 MB", type: "report" },
  { id: "6", title: "موافقة البلدية على المخططات", titleEn: "Municipality Drawing Approval", category: "تراخيص", categoryEn: "Licenses", date: "2024-08-20", size: "0.8 MB", type: "license" },
  { id: "7", title: "دفتر المواصفات", titleEn: "Specifications Book", category: "عقود", categoryEn: "Contracts", date: "2024-03-10", size: "6.7 MB", type: "contract" },
  { id: "8", title: "تقرير التقدم الشهري - أكتوبر", titleEn: "Monthly Progress Report - Oct", category: "تقارير", categoryEn: "Reports", date: "2024-11-01", size: "2.1 MB", type: "report" },
];

const MOCK_COMMUNICATIONS: MockCommunication[] = [
  { id: "1", type: "اجتماع", typeEn: "Meeting", date: "2024-12-05", subject: "اجتماع مراجعة التصميم", subjectEn: "Design Review Meeting", description: "تم مراجعة المخططات المعمارية النهائية مع العميل ومناقشة التعديلات المطلوبة", descriptionEn: "Final architectural drawings reviewed with client and discussed required modifications", outcome: "تم اعتماد المخططات مع بعض التعديلات الطفيفة", outcomeEn: "Drawings approved with minor modifications" },
  { id: "2", type: "مكالمة", typeEn: "Call", date: "2024-11-28", subject: "متابعة رخصة البناء", subjectEn: "Building License Follow-up", description: "تم الاتصال بالعميل لإبلاغه عن تقدم إجراءات رخصة البناء في البلدية", descriptionEn: "Client contacted to inform about building license progress at municipality", outcome: "في انتظار موافقة الدفاع المدني", outcomeEn: "Awaiting Civil Defense approval" },
  { id: "3", type: "بريد إلكتروني", typeEn: "Email", date: "2024-11-20", subject: "إرسال المخططات المحدثة", subjectEn: "Updated Drawings Sent", description: "تم إرسال نسخة محدثة من المخططات المعمارية والإنشائية", descriptionEn: "Updated architectural and structural drawings sent", outcome: "تم الاستلام والتأكيد", outcomeEn: "Received and confirmed" },
  { id: "4", type: "اجتماع", typeEn: "Meeting", date: "2024-11-15", subject: "اجتماع بدء المشروع", subjectEn: "Project Kickoff Meeting", description: "اجتماع تأسيسي لمناقشة جدول المشروع ونطاق العمل والمتطلبات", descriptionEn: "Foundational meeting to discuss project schedule, scope, and requirements", outcome: "تم اعتماد الجدول الزمني", outcomeEn: "Schedule approved" },
  { id: "5", type: "مكالمة", typeEn: "Call", date: "2024-11-10", subject: "استيضاح المتطلبات", subjectEn: "Requirements Clarification", description: "اتصال لمناقشة تفاصيل التصميم الداخلي والمواد المطلوبة", descriptionEn: "Call to discuss interior design details and required materials", outcome: "سيتم تزويد قائمة المواد", outcomeEn: "Materials list will be provided" },
  { id: "6", type: "بريد إلكتروني", typeEn: "Email", date: "2024-10-25", subject: "عرض أسعار الخدمات الإضافية", subjectEn: "Additional Services Quotation", description: "إرسال عرض أسعار خدمات التصميم الكهروميكانيكي", descriptionEn: "MEP design services quotation sent", outcome: "بانتظار الرد", outcomeEn: "Awaiting response" },
];

const MOCK_INVOICES: MockInvoice[] = [
  { id: "1", number: "INV-2024-001", date: "2024-03-15", dueDate: "2024-04-15", amount: 45000, paidAmount: 45000, status: "مدفوعة", statusEn: "Paid", description: "الدفعة الأولى - التصميم المعماري", descriptionEn: "First Payment - Architectural Design" },
  { id: "2", number: "INV-2024-002", date: "2024-06-15", dueDate: "2024-07-15", amount: 35000, paidAmount: 35000, status: "مدفوعة", statusEn: "Paid", description: "الدفعة الثانية - التصميم الإنشائي", descriptionEn: "Second Payment - Structural Design" },
  { id: "3", number: "INV-2024-003", date: "2024-09-15", dueDate: "2024-10-15", amount: 30000, paidAmount: 30000, status: "مدفوعة", statusEn: "Paid", description: "الدفعة الثالثة - تصميم MEP", descriptionEn: "Third Payment - MEP Design" },
  { id: "4", number: "INV-2024-004", date: "2024-12-01", dueDate: "2025-01-01", amount: 25000, paidAmount: 0, status: "قيد الاستحقاق", statusEn: "Pending", description: "الدفعة الرابعة - الإشراف على التنفيذ", descriptionEn: "Fourth Payment - Construction Supervision" },
  { id: "5", number: "INV-2024-005", date: "2024-12-01", dueDate: "2025-01-01", amount: 8000, paidAmount: 0, status: "قيد الاستحقاق", statusEn: "Pending", description: "رسوم ترخيص البلدية", descriptionEn: "Municipality License Fees" },
];

// ===== Stage Config =====
const STAGES = [
  { key: "design", ar: "التصميم", en: "Design", color: "bg-blue-500" },
  { key: "municipality", ar: "البلدية", en: "Municipality", color: "bg-amber-500" },
  { key: "construction", ar: "التنفيذ", en: "Construction", color: "bg-teal-500" },
  { key: "handover", ar: "التسليم", en: "Handover", color: "bg-emerald-500" },
];

const MILESTONES = [
  { ar: "بداية المشروع", en: "Project Start", icon: CheckCircle2 },
  { ar: "المخططات المعمارية", en: "Architectural Drawings", icon: CheckCircle2 },
  { ar: "المخططات الإنشائية", en: "Structural Drawings", icon: CheckCircle2 },
  { ar: "تصميم MEP", en: "MEP Design", icon: CheckCircle2 },
  { ar: "موافقة البلدية", en: "Municipality Approval", icon: CheckCircle2 },
  { ar: "بداية التنفيذ", en: "Construction Start", icon: CheckCircle2 },
  { ar: "أعمال الهيكل", en: "Structural Work", icon: Circle },
  { ar: "أعمال التشطيبات", en: "Finishing Work", icon: Circle },
  { ar: "الفحص النهائي", en: "Final Inspection", icon: Circle },
  { ar: "التسليم", en: "Handover", icon: Circle },
];

// ===== Helpers =====
function formatCurrency(amount: number) {
  return `${amount.toLocaleString("ar-AE")} د.إ`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-AE", { year: "numeric", month: "long", day: "numeric" });
}

function getStageIndex(stageKey: string) {
  return STAGES.findIndex((s) => s.key === stageKey);
}

function getCommIcon(type: string) {
  switch (type) {
    case "اجتماع":
    case "Meeting":
      return User;
    case "مكالمة":
    case "Call":
      return Phone;
    case "بريد إلكتروني":
    case "Email":
      return Mail;
    default:
      return MessageCircle;
  }
}

function getDocTypeColor(type: string) {
  switch (type) {
    case "drawing":
      return "bg-blue-100 text-blue-700";
    case "contract":
      return "bg-purple-100 text-purple-700";
    case "report":
      return "bg-amber-100 text-amber-700";
    case "license":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getInvoiceStatusColor(status: string) {
  switch (status) {
    case "مدفوعة":
    case "Paid":
      return "bg-emerald-100 text-emerald-700";
    case "قيد الاستحقاق":
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "متأخرة":
    case "Overdue":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

// ===== Progress Ring =====
function ProgressRing({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900 tabular-nums">{progress}%</span>
        <span className="text-[10px] text-slate-500">التقدم</span>
      </div>
    </div>
  );
}

// ===== Main Portal Page =====
export default function PortalPage() {
  const [projectNumber, setProjectNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [view, setView] = useState<PortalView>("login");
  const [activeProject, setActiveProject] = useState<MockProject | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<PortalView>("dashboard");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    // Simulate API call
    setTimeout(() => {
      const entry = MOCK_PROJECTS[projectNumber.trim()];
      if (entry && entry.phone === phone.trim()) {
        setActiveProject(entry.project);
        setView("dashboard");
        setActiveSection("dashboard");
      } else {
        setLoginError("رقم المشروع أو رقم الهاتف غير صحيح");
      }
      setLoginLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setView("login");
    setActiveProject(null);
    setProjectNumber("");
    setPhone("");
    setLoginError("");
    setActiveSection("dashboard");
  };

  // ===== LOGIN VIEW =====
  if (view === "login" || !activeProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30" dir="rtl">
        {/* Header */}
        <header className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <LogoImage size={36} />
                <div>
                  <h1 className="text-lg font-bold text-slate-900">BluePrint</h1>
                  <p className="text-[10px] text-teal-600 font-medium">مكتب الاستشارات الهندسية</p>
                </div>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="text-slate-600 hover:text-teal-600 text-sm">
                  <ChevronLeft className="h-4 w-4 me-1" />
                  الرئيسية
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Login Card */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 mb-4 shadow-lg shadow-teal-500/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">بوابة العملاء</h2>
              <p className="text-slate-500 text-sm">أدخل رقم المشروع ورقم الهاتف المسجل للوصول إلى معلومات مشروعك</p>
            </div>

            <Card className="border-slate-200 shadow-lg shadow-slate-200/50">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">رقم المشروع</Label>
                    <Input
                      value={projectNumber}
                      onChange={(e) => setProjectNumber(e.target.value)}
                      placeholder="مثال: PRJ-2024-001"
                      className="h-11 text-sm border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">رقم الهاتف</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="h-11 text-sm border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      dir="ltr"
                      required
                    />
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {loginError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/20 rounded-xl text-base font-semibold"
                  >
                    {loginLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري التحقق...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        دخول
                        <ArrowRight className="h-4 w-4 rotate-180" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 text-center">
                    للتجربة: رقم المشروع <span className="font-mono text-teal-600" dir="ltr">PRJ-2024-001</span> | الهاتف <span className="font-mono text-teal-600" dir="ltr">0501234567</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Office Contact */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-sm text-slate-500">هل تحتاج مساعدة؟</p>
              <div className="flex items-center justify-center gap-4">
                <a href="tel:+97171234567" className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700">
                  <Phone className="h-3.5 w-3.5" />
                  <span dir="ltr">+971 7 123 4567</span>
                </a>
                <a
                  href="https://wa.me/97171234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  واتساب
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} BluePrint Engineering Consultancy. جميع الحقوق محفوظة.
          </p>
        </footer>
      </div>
    );
  }

  // ===== DASHBOARD VIEW =====
  const navItems: { key: PortalView; ar: string; icon: React.ElementType }[] = [
    { key: "dashboard", ar: "نظرة عامة", icon: Building2 },
    { key: "documents", ar: "المستندات", icon: FileText },
    { key: "communications", ar: "التواصل", icon: MessageCircle },
    { key: "payments", ar: "المدفوعات", icon: CreditCard },
  ];

  const currentStageIndex = getStageIndex(activeProject.currentStage);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <LogoImage size={32} />
                <span className="font-bold text-slate-900 text-sm hidden sm:inline">BluePrint</span>
              </Link>
              <Separator orientation="vertical" className="h-6 bg-slate-200" />
              <span className="text-xs text-slate-500 font-mono" dir="ltr">{activeProject.number}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-red-500 text-xs"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 me-1" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                  isActive ? "text-teal-600" : "text-slate-400"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.ar}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {/* Desktop Nav Tabs */}
        <div className="hidden md:flex items-center gap-1 mb-6 p-1 bg-white rounded-xl border border-slate-200 w-fit">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.ar}
              </button>
            );
          })}
        </div>

        {/* Dashboard Section */}
        {activeSection === "dashboard" && (
          <div className="space-y-6">
            {/* Project Info Card */}
            <Card className="border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono bg-white/20 text-white/80 px-2 py-0.5 rounded" dir="ltr">
                        {activeProject.number}
                      </span>
                      <Badge className="bg-teal-500/20 text-teal-300 border-0 text-[10px]">
                        {activeProject.type}
                      </Badge>
                    </div>
                    <h2 className="text-lg font-bold text-white">{activeProject.name}</h2>
                    <p className="text-xs text-slate-300 mt-0.5">{activeProject.clientName}</p>
                  </div>
                  <div className="hidden sm:block">
                    <ProgressRing progress={activeProject.progress} size={90} strokeWidth={6} />
                  </div>
                </div>
                {/* Mobile progress */}
                <div className="sm:hidden mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300">التقدم</span>
                    <span className="text-teal-400 font-bold">{activeProject.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-teal-400 to-cyan-400 rounded-full transition-all duration-1000"
                      style={{ width: `${activeProject.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stage Pipeline */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">مراحل المشروع</h3>
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  {STAGES.map((stage, idx) => {
                    const isComplete = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    return (
                      <div key={stage.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all",
                              isComplete && "bg-teal-500 border-teal-500 text-white",
                              isCurrent && "bg-teal-50 border-teal-500 text-teal-600 ring-4 ring-teal-100",
                              !isComplete && !isCurrent && "bg-slate-50 border-slate-200 text-slate-300"
                            )}
                          >
                            {isComplete ? (
                              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                            ) : (
                              <span className="text-sm font-bold">{idx + 1}</span>
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-[10px] sm:text-xs mt-1.5 font-medium text-center",
                              isCurrent ? "text-teal-600" : isComplete ? "text-slate-700" : "text-slate-300"
                            )}
                          >
                            {stage.ar}
                          </span>
                          {isCurrent && (
                            <Badge className="mt-1 bg-teal-100 text-teal-700 border-0 text-[9px] px-1.5">
                              الحالية
                            </Badge>
                          )}
                        </div>
                        {idx < STAGES.length - 1 && (
                          <div
                            className={cn(
                              "h-0.5 flex-1 -mt-4 sm:mt-5 mx-1",
                              idx < currentStageIndex ? "bg-teal-500" : "bg-slate-200"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-blue-100">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">الجدول الزمني</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">البداية</span>
                      <span className="text-slate-700 font-medium">{formatDate(activeProject.startDate)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">التسليم المتوقع</span>
                      <span className="text-slate-700 font-medium">{formatDate(activeProject.endDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-teal-100">
                      <User className="h-4 w-4 text-teal-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">مدير المشروع</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-800">{activeProject.managerName}</p>
                    <a
                      href={`tel:${activeProject.managerPhone}`}
                      className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700"
                      dir="ltr"
                    >
                      <Phone className="h-3 w-3" />
                      {activeProject.managerPhone}
                    </a>
                    <a
                      href={`https://wa.me/${activeProject.managerPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700"
                    >
                      <MessageCircle className="h-3 w-3" />
                      واتساب
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-purple-100">
                      <Building2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">معلومات المشروع</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">النوع</span>
                      <span className="text-slate-700 font-medium">{activeProject.type}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">رقم المشروع</span>
                      <span className="text-slate-700 font-mono" dir="ltr">{activeProject.number}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Milestones */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">المعالم الرئيسية</h3>
                <div className="relative">
                  {MILESTONES.map((milestone, idx) => {
                    const isComplete = idx < 6; // First 6 are complete
                    const Icon = milestone.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3 relative pb-4 last:pb-0">
                        {/* Timeline line */}
                        {idx < MILESTONES.length - 1 && (
                          <div className="absolute start-[11px] top-6 bottom-0 w-0.5">
                            <div className={cn("h-full", isComplete ? "bg-teal-400" : "bg-slate-200")} />
                          </div>
                        )}
                        <Icon
                          className={cn(
                            "h-6 w-6 shrink-0 rounded-full mt-0.5",
                            isComplete ? "text-teal-500 fill-teal-50" : "text-slate-300"
                          )}
                        />
                        <div>
                          <span
                            className={cn(
                              "text-sm",
                              isComplete ? "text-slate-700 font-medium" : "text-slate-400"
                            )}
                          >
                            {milestone.ar}
                          </span>
                          {isComplete && (
                            <span className="text-[10px] text-teal-600 me-2">تم الإنجاز</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card className="border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white">
                <h3 className="text-base font-bold mb-4">تواصل معنا</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a href="tel:+97171234567" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors">
                    <Phone className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-xs text-white/70">الهاتف</p>
                      <p className="text-sm font-medium" dir="ltr">+971 7 123 4567</p>
                    </div>
                  </a>
                  <a href="mailto:info@blueprint.ae" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors">
                    <Mail className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-xs text-white/70">البريد الإلكتروني</p>
                      <p className="text-sm font-medium">info@blueprint.ae</p>
                    </div>
                  </a>
                  <a
                    href="https://wa.me/971501234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-green-500/30 hover:bg-green-500/40 rounded-lg p-3 transition-colors border border-green-400/30"
                  >
                    <MessageCircle className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-xs text-white/70">تواصل مع مدير المشروع</p>
                      <p className="text-sm font-medium">{activeProject.managerName}</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                    <MapPin className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-xs text-white/70">العنوان</p>
                      <p className="text-sm font-medium">رأس الخيمة - الإمارات</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Documents Section */}
        {activeSection === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">المستندات</h2>
              <Badge variant="secondary" className="text-xs">{MOCK_DOCUMENTS.length} مستند</Badge>
            </div>
            <div className="space-y-2">
              {MOCK_DOCUMENTS.map((doc) => (
                <Card key={doc.id} className="border-slate-200 hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn("p-2 rounded-lg shrink-0", getDocTypeColor(doc.type))}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-slate-800 truncate">{doc.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400">{formatDate(doc.date)}</span>
                            <span className="text-[10px] text-slate-300">|</span>
                            <span className="text-[10px] text-slate-400">{doc.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={cn("text-[10px]", getDocTypeColor(doc.type))}>{doc.category}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-50">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Communications Section */}
        {activeSection === "communications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">سجل التواصل</h2>
              <Badge variant="secondary" className="text-xs">{MOCK_COMMUNICATIONS.length} تواصل</Badge>
            </div>
            <div className="space-y-3">
              {MOCK_COMMUNICATIONS.map((comm) => {
                const CommIcon = getCommIcon(comm.type);
                const commTypeColor =
                  comm.type === "اجتماع" || comm.type === "Meeting"
                    ? "bg-blue-100 text-blue-600"
                    : comm.type === "مكالمة" || comm.type === "Call"
                    ? "bg-green-100 text-green-600"
                    : "bg-purple-100 text-purple-600";
                return (
                  <Card key={comm.id} className="border-slate-200 hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", commTypeColor)}>
                          <CommIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-slate-800">{comm.subject}</h4>
                              <Badge className={cn("text-[9px]", commTypeColor)}>{comm.type}</Badge>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">{formatDate(comm.date)}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mb-2">{comm.description}</p>
                          {comm.outcome && (
                            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-slate-50">
                              <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[10px] text-slate-400 block">النتيجة</span>
                                <span className="text-xs text-slate-600">{comm.outcome}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Payments Section */}
        {activeSection === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">ملخص المدفوعات</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{MOCK_INVOICES.length} فاتورة</Badge>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-3">
                  <span className="text-[10px] text-slate-200">إجمالي الفواتير</span>
                  <div className="text-lg font-bold text-white tabular-nums mt-1">
                    {formatCurrency(MOCK_INVOICES.reduce((s, i) => s + i.amount, 0))}
                  </div>
                </div>
              </Card>
              <Card className="border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3">
                  <span className="text-[10px] text-emerald-100">المدفوع</span>
                  <div className="text-lg font-bold text-white tabular-nums mt-1">
                    {formatCurrency(MOCK_INVOICES.reduce((s, i) => s + i.paidAmount, 0))}
                  </div>
                </div>
              </Card>
              <Card className="border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3">
                  <span className="text-[10px] text-amber-100">المتبقي</span>
                  <div className="text-lg font-bold text-white tabular-nums mt-1">
                    {formatCurrency(MOCK_INVOICES.reduce((s, i) => s + (i.amount - i.paidAmount), 0))}
                  </div>
                </div>
              </Card>
              <Card className="border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-3">
                  <span className="text-[10px] text-teal-100">نسبة السداد</span>
                  <div className="text-lg font-bold text-white tabular-nums mt-1">
                    {Math.round(
                      (MOCK_INVOICES.reduce((s, i) => s + i.paidAmount, 0) /
                        MOCK_INVOICES.reduce((s, i) => s + i.amount, 0)) *
                        100
                    )}
                    %
                  </div>
                </div>
              </Card>
            </div>

            {/* Invoice List */}
            <div className="space-y-2">
              {MOCK_INVOICES.map((invoice) => {
                const paid = invoice.paidAmount >= invoice.amount;
                return (
                  <Card key={invoice.id} className="border-slate-200 hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-slate-800">{invoice.description}</h4>
                            <Badge className={cn("text-[10px]", getInvoiceStatusColor(invoice.status))}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="font-mono" dir="ltr">{invoice.number}</span>
                            <span>|</span>
                            <span>{formatDate(invoice.date)}</span>
                            <span>|</span>
                            <span>الاستحقاق: {formatDate(invoice.dueDate)}</span>
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <div className="text-sm font-bold text-slate-800 tabular-nums">{formatCurrency(invoice.amount)}</div>
                          {!paid && (
                            <div className="text-[10px] text-amber-600 font-medium">متبقي: {formatCurrency(invoice.amount - invoice.paidAmount)}</div>
                          )}
                          {paid && (
                            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 justify-end">
                              <CheckCircle2 className="h-3 w-3" />
                              مدفوعة
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Progress bar for each invoice */}
                      {!paid && (
                        <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${(invoice.paidAmount / invoice.amount) * 100}%` }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
