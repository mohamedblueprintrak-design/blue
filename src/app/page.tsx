"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Building2,
  Compass,
  HardHat,
  FileCheck,
  Shield,
  Eye,
  ClipboardCheck,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  ArrowUp,
  Users,
  Award,
  Clock,
  Zap,
  Calculator,
  MessageCircle,
  ChevronDown,
  Star,
  CheckCircle2,
  Menu,
  X,
  Target,
  Settings,
  BarChart3,
  Headphones,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LogoImage from "@/components/ui/logo-image";

// ==================== NAVIGATION ====================
const NAV_LINKS = [
  { href: "#", label: "الرئيسية" },
  { href: "#services", label: "خدماتنا" },
  { href: "#about", label: "من نحن" },
  { href: "/calculator", label: "حاسبة التكاليف" },
  { href: "/quote", label: "طلب عرض سعر" },
];

// ==================== SERVICES DATA ====================
const SERVICES = [
  {
    icon: Building2,
    title: "التصميم المعماري",
    titleEn: "Architectural Design",
    desc: "تصاميم معمارية إبداعية ومبتكرة تتوافق مع أعلى معايير الجودة ومتطلبات بلدية رأس الخيمة",
  },
  {
    icon: HardHat,
    title: "التصميم الإنشائي",
    titleEn: "Structural Design",
    desc: "تصاميم إنشائية دقيقة وموثوقة تضمن سلامة وأمان المباني لجميع أنواع المشاريع السكنية والتجارية",
  },
  {
    icon: Zap,
    title: "التصميم الكهروميكانيكي",
    titleEn: "MEP Design",
    desc: "تصاميم متكاملة للأنظمة الكهربائية والميكانيكية والسباكة وأنظمة مكافحة الحريق",
  },
  {
    icon: FileCheck,
    title: "رخص البلدية",
    titleEn: "Municipality Licenses",
    desc: "استخراج رخص البناء من بلدية رأس الخيمة بخطوات سلسة ومتابعة مستمرة حتى الموافقة النهائية",
  },
  {
    icon: Eye,
    title: "الإشراف على التنفيذ",
    titleEn: "Construction Supervision",
    desc: "إشراف هندسي دقيق على جميع مراحل التنفيذ لضمان أعلى معايير الجودة والمطابقة للمخططات",
  },
  {
    icon: ClipboardCheck,
    title: "الاستشارات الهندسية",
    titleEn: "Engineering Consultation",
    desc: "تقديم استشارات هندسية متخصصة في جميع المجالات المدنية والمعمارية والإنشائية",
  },
];

// ==================== STATS ====================
const STATS = [
  { value: 250, label: "مشروع مكتمل", icon: Building2, suffix: "+" },
  { value: 180, label: "عميل راضٍ", icon: Users, suffix: "+" },
  { value: 6, label: "تخصصات هندسية", icon: Award, suffix: "" },
  { value: 50, label: "مشروع قيد التنفيذ", icon: Compass, suffix: "+" },
];

// ==================== WHY CHOOSE US ====================
const WHY_US = [
  {
    icon: Users,
    title: "فريق مهني متخصص",
    desc: "مهندسون معتمدون ذوو خبرات واسعة ومتنوعة في مشاريع رأس الخيمة والإمارات، يقدمون أعلى مستويات الجودة والإتقان",
  },
  {
    icon: FileCheck,
    title: "خبرة في الموافقات الحكومية",
    desc: "علاقات مميزة مع البلدية والدفاع المدني وجهات الترخيص لضمان سرعة الإنجاز",
  },
  {
    icon: Zap,
    title: "نهج رقمي متطور",
    desc: "نستخدم أحدث التقنيات والبرامج الهندسية لإدارة المشاريع والتواصل مع العملاء بكفاءة",
  },
  {
    icon: Star,
    title: "أسعار تنافسية",
    desc: "أسعار شفافة وعادلة مع الحفاظ على أعلى مستويات الجودة في جميع مراحل العمل",
  },
  {
    icon: Target,
    title: "التزام بالمواعيد",
    desc: "التزام صارم بجدول المواعيد الزمنية وتسليم المشاريع في الوقت المحدد دون تأخير",
  },
  {
    icon: Headphones,
    title: "دعم متواصل",
    desc: "فريق خدمة عملاء متاح على مدار الساعة للإجابة على استفساراتكم ومتابعة مشاريعكم",
  },
];

// ==================== TESTIMONIALS ====================
const TESTIMONIALS = [
  {
    name: "خالد المنصوري",
    nameEn: "Khalid Al Mansouri",
    role: "صاحب فيلا",
    text: "تجربة ممتازة من البداية للنهاية. فريق BluePrint محترف جداً في التصميم والتعامل مع البلدية. تم إنجاز مشروع فيلتي قبل الموعد المحدد بـ أسبوعين.",
    rating: 5,
  },
  {
    name: "سارة الحربي",
    nameEn: "Sara Al Harbi",
    role: "مديرة شركة",
    text: "نظام إدارة المشاريع الخاص بهم سهل جداً. أقدر أتابع تقدم مشروعي لحظة بلحظة. التطبيق ساعدنا كثيراً في التواصل مع فريق الهندسة.",
    rating: 5,
  },
  {
    name: "عبدالله الرمحي",
    nameEn: "Abdullah Al Ramahi",
    role: "مستثمر عقاري",
    text: "أفضل مكتب استشارات تعاملت معه في رأس الخيمة. جودة التصميم الإنشائي ممتازة وخدمة ما بعد التسليم مميزة. أنصح بهم بشدة.",
    rating: 5,
  },
];

// ==================== COUNTER HOOK ====================
function useCounter(end: number, duration: number = 2000, startOnView: boolean = false) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const shouldStart = startOnView ? isInView : true;

  useEffect(() => {
    if (!shouldStart) return;
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [shouldStart, end, duration]);

  return { count, ref };
}

// ==================== ANIMATION VARIANTS ====================
 
const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// ==================== i18n HELPER (Arabic-only landing page) ====================
function isAr(ar: string, _en: string): string {
  return ar;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formType, setFormType] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track scroll position for back-to-top button
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const statsCounter0 = useCounter(STATS[0].value, 2000, true);
  const statsCounter1 = useCounter(STATS[1].value, 2000, true);
  const statsCounter2 = useCounter(STATS[2].value, 2000, true);
  const statsCounter3 = useCounter(STATS[3].value, 1500, true);
  const statCounters = [statsCounter0, statsCounter1, statsCounter2, statsCounter3];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          email: formEmail,
          serviceType: formType,
          message: formMessage,
        }),
      });
      setFormSuccess(true);
      setFormName("");
      setFormPhone("");
      setFormEmail("");
      setFormType("");
      setFormMessage("");
      setTimeout(() => setFormSuccess(false), 5000);
    } catch {
      // silent
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <LogoImage size={40} />
              <div>
                <h1 className="text-lg font-bold text-slate-900">BluePrint</h1>
                <p className="text-[10px] text-teal-600 font-medium">
                  مكتب الاستشارات الهندسية
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="px-3 py-2 text-sm text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/dashboard">
                <Button className="mr-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/20">
                  لوحة التحكم
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-teal-600 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full mt-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                    لوحة التحكم
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
          <div className="absolute inset-0 opacity-[0.04]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
          </div>
          <div className="absolute top-20 -start-20 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute bottom-10 -end-20 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 text-teal-400 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                رأس الخيمة - الإمارات العربية المتحدة
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeInUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
            >
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                BluePrint
              </span>
              <br />
              مكتب الاستشارات الهندسية
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl text-slate-300 font-medium">
                في رأس الخيمة
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              custom={2}
              className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              نقدم خدمات هندسية شاملة من التصميم حتى التسليم، بفريق متخصص ذو خبرات واسعة في سوق رأس الخيمة. نلتزم بأعلى معايير الجودة ومطابقة الأنظمة والمتطلبات لكل مشروع.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              custom={3}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/quote">
                <Button className="w-full sm:w-auto px-8 h-12 text-base bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-xl shadow-teal-500/25 rounded-xl">
                  <Calculator className="w-5 h-5 me-2" />
                  طلب عرض سعر
                </Button>
              </Link>
              <a href="tel:+971501611234">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto px-8 h-12 text-base border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl"
                >
                  <Phone className="w-5 h-5 me-2" />
                  اتصل بنا
                </Button>
              </a>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={fadeInUp}
              custom={4}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm"
            >
              {[
                { label: "+250 مشروع", icon: Building2 },
                { label: "+180 عميل", icon: Users },
                { label: "فريق متخصص", icon: Award },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-teal-400/80">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 50L48 45C96 40 192 30 288 28C384 26 480 32 576 40C672 48 768 58 864 55C960 52 1056 36 1152 30C1248 24 1344 28 1392 30L1440 32V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ===== STATS SECTION WITH COUNTER ANIMATION ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              const counter = statCounters[i];
              return (
                <motion.div
                  key={stat.label}
                  ref={counter.ref}
                  variants={fadeInUp}
                  custom={i}
                  className="text-center p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100/50 hover:shadow-xl hover:shadow-teal-200/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 mb-4 shadow-lg shadow-teal-500/20">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 tabular-nums">
                    {counter.count}{stat.suffix}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section id="services" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Compass className="w-4 h-4" />
              خدماتنا
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              حلول هندسية شاملة
            </h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              نقدم مجموعة متكاملة من الخدمات الهندسية التي تغطي جميع مراحل المشروع من الفكرة حتى التسليم النهائي
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {SERVICES.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.titleEn}
                  variants={fadeInUp}
                  custom={i}
                  className="group p-6 bg-white rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-teal-500/20">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{service.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section id="about" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              لماذا نحن
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              لماذا تختار BluePrint؟
            </h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              نحن شريكك الهندسي الموثوق في رأس الخيمة - نجمع المشاريع بكل احترافية
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {WHY_US.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  custom={i}
                  className="text-center p-8 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 mb-4">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              آراء العملاء
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              ماذا يقول عملاؤنا عنّا
            </h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              ثقة عملائنا هي أكبر شهادة على جودة خدماتنا الهندسية
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                variants={fadeInUp}
                custom={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== CTA / CONTACT SECTION ===== */}
      <section id="contact" className="py-16 sm:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>
        </div>
        <div className="absolute top-0 -start-32 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 -end-32 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} custom={0}>
                <span className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 text-teal-400 text-sm font-medium mb-6">
                  <MessageCircle className="w-4 h-4" />
                  تواصل معنا
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  ابدأ مشروعك الآن
                </h2>
                <p className="mt-4 text-slate-400 leading-relaxed max-w-lg">
                  أخبرنا عن مشروعك وسنقدم لك استشارة مجانية وعرض سعر تفصيلي خلال 24 ساعة. فريقنا المتخصص جاهز لمساعدتك.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} custom={1} className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{isAr("اتصل بنا", "Call Us")}</div>
                    <div className="text-slate-400 text-sm mt-1" dir="ltr">+971 50 161 1234</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{isAr("البريد الإلكتروني", "Email")}</div>
                    <div className="text-slate-400 text-sm mt-1">info.blueprintrak@gmail.com</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{isAr("العنوان", "Address")}</div>
                    <div className="text-slate-400 text-sm mt-1">{isAr("رأس الخيمة - الإمارات العربية المتحدة", "Ras Al Khaimah - UAE")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{isAr("ساعات العمل", "Working Hours")}</div>
                    <div className="text-slate-400 text-sm mt-1">{isAr("الأحد - الخميس: 8:30 ص - 2:00 م / 5:00 م - 8:30 م", "Sun - Thu: 8:30 AM - 2:00 PM / 5:00 PM - 8:30 PM")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{isAr("الجمعة", "Friday")}</div>
                    <div className="text-slate-400 text-sm mt-1">{isAr("8:00 ص - 12:00 م", "8:00 AM - 12:00 PM")}</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl"
            >
              {formSuccess ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-16 h-16 text-teal-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {isAr("تم إرسال طلبك بنجاح!", "Request Sent Successfully!")}
                  </h3>
                  <p className="text-slate-500">
                    {isAr("سنتواصل معك خلال 24 ساعة", "We'll get back to you within 24 hours")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {isAr("طلب استشارة مجانية", "Free Consultation Request")}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {isAr("املأ النموذج أدناه وسنعود إليك قريباً", "Fill the form below and we'll get back to you soon")}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 text-sm">{isAr("الاسم الكامل", "Full Name")}</Label>
                      <Input
                        placeholder={isAr("أدخل اسمك", "Enter your name")}
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                        className="h-11 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 text-sm">{isAr("رقم الهاتف", "Phone Number")}</Label>
                      <Input
                        placeholder="+971 XX XXX XXXX"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        required
                        dir="ltr"
                        className="h-11 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-left"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">{isAr("البريد الإلكتروني", "Email")}</Label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      dir="ltr"
                      className="h-11 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-left"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">{isAr("نوع الخدمة", "Service Type")}</Label>
                    <Select value={formType} onValueChange={setFormType} required>
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder={isAr("اختر نوع الخدمة", "Select service type")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="design">{isAr("خدمة تصميم", "Design Service")}</SelectItem>
                        <SelectItem value="supervision">{isAr("إشراف تنفيذ", "Construction Supervision")}</SelectItem>
                        <SelectItem value="inspection">{isAr("فحص هندسي", "Engineering Inspection")}</SelectItem>
                        <SelectItem value="licensing">{isAr("ترخيص", "Licensing")}</SelectItem>
                        <SelectItem value="turnkey">{isAr("مشروع متكامل", "Turnkey Project")}</SelectItem>
                        <SelectItem value="other">{isAr("أخرى", "Other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">{isAr("رسالتك", "Your Message")}</Label>
                    <Textarea
                      placeholder={isAr("اكتب تفاصيل مشروعك هنا...", "Describe your project details...")}
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      rows={3}
                      className="border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/20 rounded-xl text-base font-semibold"
                  >
                    {formSubmitting
                      ? isAr("جاري الإرسال...", "Sending...")
                      : <>
                        {isAr("إرسال الطلب", "Submit Request")}
                        <ArrowLeft className="w-4 h-4 ms-2 rotate-180" />
                      </>
                    }
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-slate-800">
            {/* Company */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <LogoImage size={40} />
                <div>
                  <h3 className="text-lg font-bold">BluePrint</h3>
                  <p className="text-xs text-slate-400">{isAr("مكتب الاستشارات الهندسية", "Engineering Consultancy")}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isAr(
                  "مكتب هندسي متخصص في رأس الخيمة يقدم خدمات التصميم والترخيص والإشراف الهندسي بأعلى معايير الجودة",
                  "Specialized engineering consultancy in Ras Al Khaimah offering design, licensing, and construction supervision services"
                )}
              </p>
              {/* Social Media */}
              <div className="flex items-center gap-3 mt-4">
                <a href="https://wa.me/971501611234" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-emerald-600 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/20" title="واتساب">
                  <MessageCircle className="w-4 h-4 text-slate-400 hover:text-white" />
                </a>
                <a href="mailto:info.blueprintrak@gmail.com" className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20" title="البريد الإلكتروني">
                  <Mail className="w-4 h-4 text-slate-400 hover:text-white" />
                </a>
                <a href="tel:+971501611234" className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-teal-600 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-teal-500/20" title="اتصال">
                  <Phone className="w-4 h-4 text-slate-400 hover:text-white" />
                </a>
                <a href="#" className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-sky-600 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-sky-500/20" title="انستغرام">
                  <Globe className="w-4 h-4 text-slate-400 hover:text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-sm mb-4">{isAr("روابط سريعة", "Quick Links")}</h4>
              <ul className="space-y-2.5">
                <li><Link href="#services" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{isAr("خدماتنا", "Services")}</Link></li>
                <li><Link href="#about" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{isAr("من نحن", "About Us")}</Link></li>
                <li><Link href="/calculator" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{isAr("حاسبة التكاليف", "Cost Calculator")}</Link></li>
                <li><Link href="/quote" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{isAr("طلب عرض سعر", "Request Quote")}</Link></li>
                <li><Link href="/dashboard" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{isAr("لوحة التحكم", "Dashboard")}</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold text-sm mb-4">{isAr("خدماتنا", "Our Services")}</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-slate-400">{isAr("التصميم المعماري", "Architectural Design")}</span></li>
                <li><span className="text-sm text-slate-400">{isAr("التصميم الإنشائي", "Structural Design")}</span></li>
                <li><span className="text-sm text-slate-400">{isAr("التصميم الكهروميكانيكي", "MEP Design")}</span></li>
                <li><span className="text-sm text-slate-400">{isAr("رخص البلدية والدفاع المدني", "Municipality & Civil Defense")}</span></li>
                <li><span className="text-sm text-slate-400">{isAr("إشراف التنفيذ", "Construction Supervision")}</span></li>
                <li><span className="text-sm text-slate-400">{isAr("الاستشارات الهندسية", "Engineering Consultation")}</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-sm mb-4">{isAr("تواصل معنا", "Contact Us")}</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
                  {isAr("رأس الخيمة - الإمارات", "Ras Al Khaimah - UAE")}
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                  <span dir="ltr">+971 50 161 1234</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="w-4 h-4 text-teal-500 shrink-0" />
                  info.blueprintrak@gmail.com
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4 text-teal-500 shrink-0" />
                  {isAr("الأحد - الخميس: 8:30-2 / 5-8:30", "Sun - Thu: 8:30-2 / 5-8:30")}
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4 text-teal-500 shrink-0" />
                  {isAr("الجمعة: 8:00 ص - 12:00 م", "Friday: 8:00 AM - 12:00 PM")}
                </li>
              </ul>
            </div>
          </div>

          {/* Certifications / Trust */}
          <div className="pt-8 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Shield className="w-4 h-4 text-teal-500" />
                {isAr("معتمد من البلدية", "Municipality Approved")}
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Globe className="w-4 h-4 text-teal-500" />
                ISO 9001:2015
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Settings className="w-4 h-4 text-teal-500" />
                {isAr("عضو جمعية المهندسين الإمارات", "UAE Society of Engineers")}
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <BarChart3 className="w-4 h-4 text-teal-500" />
                {isAr("تصنيف فئة أ", "Grade A Classified")}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} BluePrint Engineering Consultancy. {isAr("جميع الحقوق محفوظة.", "All rights reserved.")}
          </div>
        </div>
      </footer>

      {/* ===== FLOATING WHATSAPP ===== */}
      <a
        href="https://wa.me/971501611234?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%D8%8C%D8%8C%D8%8C%D8%8C%D8%8C%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%D9%83%D9%85"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-[60] w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-110 group"
        aria-label="تواصل عبر واتساب"
      >
        <MessageCircle className="w-7 h-7 text-white" />
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
      </a>

      {/* ===== SCROLL TO TOP ===== */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 end-6 z-50 w-12 h-12 bg-teal-600 hover:bg-teal-700 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20 transition-all duration-300 ${showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        aria-label="العودة للأعلى"
      >
        <ChevronDown className="w-5 h-5 text-white rotate-180" />
      </button>
    </div>
  );
}
