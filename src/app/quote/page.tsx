"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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
  Sparkles,
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
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const TOTAL_STEPS = 5;

// Parallax Background Component
function ParallaxBackground() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  return (
    <div ref={ref} className="fixed inset-0 -z-10">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <Image
          src="/quote-bg.png"
          alt="Engineering Blueprint"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/95" />
      </motion.div>
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="quote-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#quote-grid)" />
        </svg>
      </div>
      {/* Floating Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 start-20 w-64 h-64 rounded-full bg-teal-500/20 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-40 end-20 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl"
      />
    </div>
  );
}

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
      <div className="min-h-screen flex flex-col">
        <ParallaxBackground />
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-md w-full text-center bg-white/95 backdrop-blur-md rounded-3xl p-10 shadow-2xl border border-white/20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/30"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-slate-900 mb-3"
            >
              تم إرسال طلبك بنجاح!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-500 mb-2"
            >
              سنتواصل معك خلال <span className="font-semibold text-teal-600">24 ساعة</span>
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-slate-400 mb-8"
            >
              رقم الطلب سيتم إرساله على هاتفك والبريد الإلكتروني
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto rounded-xl h-11">
                  العودة للرئيسية
                </Button>
              </Link>
              <Link href="/calculator">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl h-11 shadow-lg shadow-teal-500/20">
                  <Calculator className="w-4 h-4 me-1.5" />
                  حاسبة التكاليف
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const StepIcon = getStepIcon();

  return (
    <div className="min-h-screen flex flex-col">
      <ParallaxBackground />
      <PublicHeader />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Progress Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center mb-8"
          >
            <motion.div variants={fadeInUp} custom={0} className="inline-flex items-center gap-2 bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 text-teal-400 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" />
              طلب عرض سعر
            </motion.div>
            <motion.h1 variants={fadeInUp} custom={1} className="text-2xl sm:text-3xl font-bold text-white">
              احصل على عرض سعر مخصص
            </motion.h1>
            <motion.p variants={fadeInUp} custom={2} className="text-slate-400 mt-2">
              أجب على بضعة أسئلة وسنقدم لك عرض سعر خلال 24 ساعة
            </motion.p>
          </motion.div>

          {/* Step Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">الخطوة {step} من {TOTAL_STEPS}</span>
              <span className="text-sm text-teal-400 flex items-center gap-1.5">
                <StepIcon className="w-4 h-4" />
                {getStepLabel()}
              </span>
            </div>
            <div className="h-2 bg-slate-800/50 backdrop-blur-sm rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full relative"
                initial={{ width: "20%" }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
            {/* Step indicators */}
            <div className="flex justify-between mt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    s <= step ? "bg-teal-500" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Form Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20"
            >
              {/* Step 1: Service Type */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-white" />
                    </div>
                    ما نوع الخدمة التي تحتاجها؟
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    {SERVICE_TYPES.map((s, i) => {
                      const Icon = s.icon;
                      const isSelected = serviceType === s.value;
                      return (
                        <motion.button
                          key={s.value}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => setServiceType(s.value)}
                          className={`p-4 rounded-2xl border-2 text-right transition-all duration-300 cursor-pointer group ${
                            isSelected
                              ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-lg shadow-teal-500/10"
                              : "border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isSelected 
                                ? "bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md shadow-teal-500/20" 
                                : "bg-slate-100 group-hover:bg-teal-100"
                            }`}>
                              <Icon className={`w-6 h-6 transition-colors ${isSelected ? "text-white" : "text-slate-500 group-hover:text-teal-600"}`} />
                            </div>
                            <div>
                              <div className={`font-semibold text-sm transition-colors ${isSelected ? "text-teal-700" : "text-slate-900"}`}>
                                {s.label}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Building Type */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    ما نوع المبنى؟
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {BUILDING_TYPES.map((b, i) => {
                      const Icon = b.icon;
                      const isSelected = buildingType === b.value;
                      return (
                        <motion.button
                          key={b.value}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => setBuildingType(b.value)}
                          className={`p-5 rounded-2xl border-2 text-center transition-all duration-300 cursor-pointer group ${
                            isSelected
                              ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-lg shadow-teal-500/10"
                              : "border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-md"
                          }`}
                        >
                          <Icon className={`w-10 h-10 mx-auto mb-3 transition-all duration-300 ${
                            isSelected 
                              ? "text-teal-500 scale-110" 
                              : "text-slate-400 group-hover:text-teal-500 group-hover:scale-105"
                          }`} />
                          <div className={`text-sm font-medium transition-colors ${isSelected ? "text-teal-700" : "text-slate-700"}`}>
                            {b.label}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Site Details */}
              {step === 3 && (
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="space-y-5"
                >
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                      <Calculator className="w-4 h-4 text-white" />
                    </div>
                    تفاصيل الموقع
                  </h2>

                  <motion.div variants={fadeInUp} custom={0} className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">المساحة (متر مربع)</Label>
                    <Select value={area} onValueChange={setArea}>
                      <SelectTrigger className="w-full h-12 border-slate-200 rounded-xl hover:border-teal-300 transition-colors">
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
                  </motion.div>

                  <motion.div variants={fadeInUp} custom={1} className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">عدد الأدوار</Label>
                    <Select value={floors} onValueChange={setFloors}>
                      <SelectTrigger className="w-full h-12 border-slate-200 rounded-xl hover:border-teal-300 transition-colors">
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
                  </motion.div>

                  <motion.div variants={fadeInUp} custom={2} className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">المنطقة في رأس الخيمة</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="w-full h-12 border-slate-200 rounded-xl hover:border-teal-300 transition-colors">
                        <SelectValue placeholder="اختر المنطقة" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 4: Contact Info */}
              {step === 4 && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="space-y-5"
                >
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    بيانات التواصل
                  </h2>

                  <motion.div variants={fadeInUp} custom={0} className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">الاسم الكامل *</Label>
                    <Input
                      placeholder="أدخل اسمك الكامل"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                  </motion.div>

                  <motion.div variants={fadeInUp} custom={1} className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">رقم الهاتف *</Label>
                    <div className="relative">
                      <Phone className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="+971 XX XXX XXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        dir="ltr"
                        className="h-12 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-left ps-12 transition-all"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={fadeInUp} custom={2} className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        dir="ltr"
                        className="h-12 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-left ps-12 transition-all"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={fadeInUp} custom={3} className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">ملاحظات إضافية</Label>
                    <textarea
                      placeholder="أي تفاصيل إضافية عن مشروعك..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none outline-none transition-all"
                    />
                  </motion.div>
                </motion.div>
              )}

              {/* Step 5: Review & Submit */}
              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
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
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                      >
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span className="text-sm font-medium text-slate-900">{item.value}</span>
                      </motion.div>
                    ))}
                  </div>

                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-50 rounded-xl"
                    >
                      <span className="text-xs text-slate-500">ملاحظات: </span>
                      <span className="text-sm text-slate-700">{message}</span>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between mt-6 gap-4"
          >
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-slate-300 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-11"
              >
                <ArrowRight className="w-4 h-4 me-1.5" />
                السابق
              </Button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20 rounded-xl h-11 px-8 disabled:opacity-50"
                >
                  التالي
                  <ArrowLeft className="w-4 h-4 ms-1.5 rotate-180" />
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20 rounded-xl h-11 px-8"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      جاري الإرسال...
                    </span>
                  ) : (
                    <>
                      إرسال الطلب
                      <Sparkles className="w-4 h-4 ms-1.5" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
