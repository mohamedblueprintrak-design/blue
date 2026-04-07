"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Compass,
  HardHat,
  FileCheck,
  Shield,
  Eye,
  ClipboardCheck,
  KeyRound,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
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
    desc: "تصاميم معمارية إبداعية تتوافق مع معايير بلدية رأس الخيمة واهتمامات العملاء",
  },
  {
    icon: HardHat,
    title: "التصميم الإنشائي",
    desc: "تصاميم إنشائية دقيقة وموثوقة تضمن سلامة وأمان المباني لجميع أنواع المشاريع",
  },
  {
    icon: Zap,
    title: "التصميم الكهربائي والميكانيكي",
    desc: "تصاميم MEP متكاملة تشمل الكهرباء والميكانيك والسباكة وأنظمة الحريق",
  },
  {
    icon: FileCheck,
    title: "رخص البلدية",
    desc: "استخراج رخص البناء من بلدية رأس الخيمة بخطوات سلسة ومتابعة مستمرة",
  },
  {
    icon: Shield,
    title: "رخص الدفاع المدني",
    desc: "الحصول على موافقات الدفاع المدني وشهادات السلامة المطلوبة لجميع المشاريع",
  },
  {
    icon: Eye,
    title: "إشراف التنفيذ",
    desc: "إشراف هندسي دقيق على جميع مراحل التنفيذ لضمان أعلى معايير الجودة",
  },
  {
    icon: ClipboardCheck,
    title: "الفحص الهندسي",
    desc: "فحوصات هندسية شاملة للمباني القائمة والمشاريع تحت التنفيذ",
  },
  {
    icon: KeyRound,
    title: "مشاريع المفاتيح",
    desc: "مشاريع متكاملة من التصميم حتى التسليم بالمفتاح بإدارة واحدة",
  },
];

// ==================== STATS ====================
const STATS = [
  { value: "+200", label: "مشروع مكتمل", icon: Building2 },
  { value: "+150", label: "عميل راضٍ", icon: Users },
  { value: "+15", label: "سنة خبرة", icon: Award },
  { value: "6", label: "تخصصات هندسية", icon: Compass },
];

// ==================== WHY CHOOSE US ====================
const WHY_US = [
  {
    icon: Users,
    title: "فريق مهني متخصص",
    desc: "مهندسون معتمدون بخبرة واسعة في مشاريع رأس الخيمة",
  },
  {
    icon: FileCheck,
    title: "خبرة في الموافقات الحكومية",
    desc: "علاقات مميزة مع البلدية والدفاع المدني والجهات المعنية",
  },
  {
    icon: Zap,
    title: "نهج رقمي متطور",
    desc: "نستخدم أحدث التقنيات لإدارة المشاريع والتواصل مع العملاء",
  },
  {
    icon: Star,
    title: "أسعار تنافسية",
    desc: "أسعار شفافة ومنافسة مع جودة عالية لا تُضاهى",
  },
];

// ==================== ANIMATION VARIANTS ====================
const fadeInUp = {
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

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formType, setFormType] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

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
    <div className="min-h-screen bg-white">
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
              نقدم خدمات هندسية شاملة من التصميم حتى التسليم، بخبرة تتجاوز 15 عاماً في سوق رأس الخيمة
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
              <a href="tel:+97171234567">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto px-8 h-12 text-base border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl"
                >
                  <Phone className="w-5 h-5 me-2" />
                  اتصل بنا
                </Button>
              </a>
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

      {/* ===== STATS SECTION ===== */}
      <section className="py-12 sm:py-16 bg-white">
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
              return (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  custom={i}
                  className="text-center p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100/50"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
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
              نقدم مجموعة متكاملة من الخدمات الهندسية التي تغطي جميع مراحل المشروع
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {SERVICES.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  variants={fadeInUp}
                  custom={i}
                  className="group p-6 bg-white rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
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
              نحن شريكك الهندسي الموثوق في رأس الخيمة
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {WHY_US.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  custom={i}
                  className="text-center p-8 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/60"
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
                  أخبرنا عن مشروعك وسنقدم لك استشارة مجانية وعرض سعر تفصيلي خلال 24 ساعة
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} custom={1} className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">اتصل بنا</div>
                    <div className="text-slate-400 text-sm mt-1" dir="ltr">+971 7 123 4567</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">البريد الإلكتروني</div>
                    <div className="text-slate-400 text-sm mt-1">info@blueprint.ae</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">العنوان</div>
                    <div className="text-slate-400 text-sm mt-1">رأس الخيمة - الإمارات العربية المتحدة</div>
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
                    تم إرسال طلبك بنجاح!
                  </h3>
                  <p className="text-slate-500">
                    سنتواصل معك خلال 24 ساعة
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">طلب استشارة مجانية</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    املأ النموذج أدناه وسنعود إليك قريباً
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 text-sm">الاسم الكامل</Label>
                      <Input
                        placeholder="أدخل اسمك"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                        className="h-11 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 text-sm">رقم الهاتف</Label>
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
                    <Label className="text-slate-700 text-sm">البريد الإلكتروني</Label>
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
                    <Label className="text-slate-700 text-sm">نوع الخدمة</Label>
                    <Select value={formType} onValueChange={setFormType} required>
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder="اختر نوع الخدمة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="design">خدمة تصميم</SelectItem>
                        <SelectItem value="supervision">إشراف تنفيذ</SelectItem>
                        <SelectItem value="inspection">فحص هندسي</SelectItem>
                        <SelectItem value="licensing">ترخيص</SelectItem>
                        <SelectItem value="turnkey">مشروع متكامل</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">رسالتك</Label>
                    <Textarea
                      placeholder="اكتب تفاصيل مشروعك هنا..."
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      rows={3}
                      className="border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/20 rounded-xl text-base"
                  >
                    {formSubmitting ? (
                      "جاري الإرسال..."
                    ) : (
                      <>
                        إرسال الطلب
                        <ArrowLeft className="w-4 h-4 ms-2 rotate-180" />
                      </>
                    )}
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
                  <p className="text-xs text-slate-400">مكتب الاستشارات الهندسية</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                مكتب هندسي متخصص في رأس الخيمة يقدم خدمات التصميم والترخيص والإشراف الهندسي
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-sm mb-4">روابط سريعة</h4>
              <ul className="space-y-2.5">
                <li><Link href="#services" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">خدماتنا</Link></li>
                <li><Link href="/about" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">من نحن</Link></li>
                <li><Link href="/calculator" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">حاسبة التكاليف</Link></li>
                <li><Link href="/quote" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">طلب عرض سعر</Link></li>
                <li><Link href="/dashboard" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">لوحة التحكم</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold text-sm mb-4">خدماتنا</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-slate-400">التصميم المعماري</span></li>
                <li><span className="text-sm text-slate-400">التصميم الإنشائي</span></li>
                <li><span className="text-sm text-slate-400">التصميم الكهربائي والميكانيكي</span></li>
                <li><span className="text-sm text-slate-400">رخص البلدية والدفاع المدني</span></li>
                <li><span className="text-sm text-slate-400">إشراف التنفيذ</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-sm mb-4">تواصل معنا</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
                  رأس الخيمة - الإمارات
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                  <span dir="ltr">+971 7 123 4567</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="w-4 h-4 text-teal-500 shrink-0" />
                  info@blueprint.ae
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} BluePrint Engineering Consultancy. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

      {/* ===== FLOATING WHATSAPP ===== */}
      <a
        href="https://wa.me/97171234567?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%D9%83%D9%85"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-110 group"
        aria-label="تواصل عبر واتساب"
      >
        <MessageCircle className="w-7 h-7 text-white" />
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
      </a>
    </div>
  );
}
