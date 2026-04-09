"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Building2,
  HardHat,
  FileText,
  User,
  Phone,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  ClipboardCheck,
  Eye,
  KeyRound,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PublicHeader from "@/components/layout/public-header";
import PublicFooter from "@/components/layout/public-footer";

const SERVICE_TYPES = [
  { value: "design", label: "خدمة تصميم", icon: Building2, desc: "تصميم معماري أو إنشائي أو MEP" },
  { value: "supervision", label: "إشراف تنفيذ", icon: Eye, desc: "إشراف هندسي على أعمال التنفيذ" },
  { value: "inspection", label: "فحص هندسي", icon: ClipboardCheck, desc: "فحص المباني والتقييمات الإنشائية" },
  { value: "licensing", label: "ترخيص", icon: FileText, desc: "رخص بلدية ودفاع مدني" },
  { value: "turnkey", label: "مشروع متكامل", icon: KeyRound, desc: "من التصميم حتى التسليم" },
];

const BUILDING_TYPES = [
  { value: "villa", label: "فيلا", icon: Building2 },
  { value: "apartment", label: "عمارة سكنية", icon: Building2 },
  { value: "commercial", label: "تجاري", icon: HardHat },
  { value: "industrial", label: "صناعي", icon: HardHat },
  { value: "other", label: "أخرى", icon: FileText },
];

const LOCATIONS = [
  "النخيل",
  "الحمرية",
  "المنصورة",
  "المعيرض",
  "الرفاع",
  "القرية",
  "شعم",
  "الع القري",
  "ماريان",
  "الدام",
  "أخرى",
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const TOTAL_STEPS = 5;

export default function QuotePage() {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [area, setArea] = useState("");
  const [floors, setFloors] = useState("1");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canProceed = () => {
    switch (step) {
      case 1: return !!serviceType;
      case 2: return !!buildingType;
      case 3: return !!area && !!location;
      case 4: return !!name && !!phone;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          serviceType,
          buildingType,
          area,
          floors: parseInt(floors) || 1,
          location,
          message,
        }),
      });
      setSubmitted(true);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const getStepLabel = () => {
    switch (step) {
      case 1: return "نوع الخدمة";
      case 2: return "نوع المبنى";
      case 3: return "تفاصيل الموقع";
      case 4: return "بيانات التواصل";
      case 5: return "مراجعة وإرسال";
      default: return "";
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1: return ClipboardList;
      case 2: return Building2;
      case 3: return Calculator;
      case 4: return User;
      case 5: return CheckCircle2;
      default: return ClipboardList;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center bg-white rounded-2xl p-10 shadow-xl"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">تم إرسال طلبك بنجاح!</h2>
            <p className="text-slate-500 mb-2">
              سنتواصل معك خلال <span className="font-semibold text-teal-600">24 ساعة</span>
            </p>
            <p className="text-sm text-slate-400 mb-8">
              رقم الطلب سيتم إرساله على هاتفك والبريد الإلكتروني
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  العودة للرئيسية
                </Button>
              </Link>
              <Link href="/calculator">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                  <Calculator className="w-4 h-4 me-1.5" />
                  حاسبة التكاليف
                </Button>
              </Link>
            </div>
          </motion.div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Progress Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" />
              طلب عرض سعر
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              احصل على عرض سعر مخصص
            </h1>
            <p className="text-slate-500 mt-2">
              أجب على بضعة أسئلة وسنقدم لك عرض سعر خلال 24 ساعة
            </p>
          </div>

          {/* Step Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">الخطوة {step} من {TOTAL_STEPS}</span>
              <span className="text-sm text-slate-500">{getStepLabel()}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                initial={{ width: "20%" }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Form Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/80"
            >
              {/* Step 1: Service Type */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-teal-500" />
                    ما نوع الخدمة التي تحتاجها؟
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    {SERVICE_TYPES.map((s) => {
                      const Icon = s.icon;
                      const isSelected = serviceType === s.value;
                      return (
                        <button
                          key={s.value}
                          onClick={() => setServiceType(s.value)}
                          className={`p-4 rounded-xl border-2 text-right transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10"
                              : "border-slate-200 hover:border-teal-300 hover:bg-teal-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-teal-500" : "bg-slate-100"}`}>
                              <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                            </div>
                            <div>
                              <div className={`font-semibold text-sm ${isSelected ? "text-teal-700" : "text-slate-900"}`}>
                                {s.label}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Building Type */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-500" />
                    ما نوع المبنى؟
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {BUILDING_TYPES.map((b) => {
                      const Icon = b.icon;
                      const isSelected = buildingType === b.value;
                      return (
                        <button
                          key={b.value}
                          onClick={() => setBuildingType(b.value)}
                          className={`p-5 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10"
                              : "border-slate-200 hover:border-teal-300 hover:bg-teal-50/50"
                          }`}
                        >
                          <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? "text-teal-500" : "text-slate-400"}`} />
                          <div className={`text-sm font-medium ${isSelected ? "text-teal-700" : "text-slate-700"}`}>
                            {b.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Site Details */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-teal-500" />
                    تفاصيل الموقع
                  </h2>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">المساحة (متر مربع)</Label>
                    <Select value={area} onValueChange={setArea}>
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder="اختر نطاق المساحة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="less-300">أقل من 300 م²</SelectItem>
                        <SelectItem value="300-500">300 - 500 م²</SelectItem>
                        <SelectItem value="500-1000">500 - 1,000 م²</SelectItem>
                        <SelectItem value="1000-2000">1,000 - 2,000 م²</SelectItem>
                        <SelectItem value="2000+">أكثر من 2,000 م²</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">عدد الأدوار</Label>
                    <Select value={floors} onValueChange={setFloors}>
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">دور واحد (أرضي)</SelectItem>
                        <SelectItem value="2">دوران</SelectItem>
                        <SelectItem value="3">3 أدوار</SelectItem>
                        <SelectItem value="4">4 أدوار</SelectItem>
                        <SelectItem value="5+">5 أدوار أو أكثر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">المنطقة في رأس الخيمة</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder="اختر المنطقة" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 4: Contact Info */}
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-500" />
                    بيانات التواصل
                  </h2>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">الاسم الكامل *</Label>
                    <Input
                      placeholder="أدخل اسمك الكامل"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">رقم الهاتف *</Label>
                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="+971 XX XXX XXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        dir="ltr"
                        className="h-11 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-left ps-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        dir="ltr"
                        className="h-11 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-left ps-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">ملاحظات إضافية</Label>
                    <textarea
                      placeholder="أي تفاصيل إضافية عن مشروعك..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    مراجعة طلبك
                  </h2>
                  <p className="text-sm text-slate-500">
                    تأكد من صحة البيانات قبل الإرسال
                  </p>

                  <div className="space-y-3">
                    {[
                      { label: "نوع الخدمة", value: SERVICE_TYPES.find(s => s.value === serviceType)?.label },
                      { label: "نوع المبنى", value: BUILDING_TYPES.find(b => b.value === buildingType)?.label },
                      { label: "المساحة", value: area },
                      { label: "عدد الأدوار", value: floors === "5+" ? "5+" : `${floors} أدوار` },
                      { label: "المنطقة", value: location },
                      { label: "الاسم", value: name },
                      { label: "الهاتف", value: phone },
                      { label: "البريد الإلكتروني", value: email || "لم يُحدد" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span className="text-sm font-medium text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {message && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500">ملاحظات: </span>
                      <span className="text-sm text-slate-700">{message}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 gap-4">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-slate-200"
              >
                <ArrowRight className="w-4 h-4 me-1.5" />
                السابق
              </Button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20"
              >
                التالي
                <ArrowLeft className="w-4 h-4 ms-1.5 rotate-180" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20"
              >
                {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
                <CheckCircle2 className="w-4 h-4 ms-1.5" />
              </Button>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
