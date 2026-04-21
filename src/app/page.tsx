"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/hooks/use-lang";
import Image from "next/image";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
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
  ArrowUpRight,
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
  { href: "#services", label: "خدماتنا", labelEn: "Services" },
  { href: "#projects", label: "مشاريعنا", labelEn: "Projects" },
  { href: "#about", label: "من نحن", labelEn: "About" },
  { href: "/calculator", label: "حاسبة التكاليف", labelEn: "Calculator" },
];

// ==================== PROJECTS DATA ====================
const PROJECTS = [
  {
    id: 1,
    title: "برج الأعمال التجاري",
    titleEn: "Commercial Business Tower",
    category: "تجاري",
    categoryEn: "Commercial",
    image: "/project-1.png",
    year: "2024",
    location: "رأس الخيمة",
    locationEn: "Ras Al Khaimah",
  },
  {
    id: 2,
    title: "فيلا الواحة السكنية",
    titleEn: "Oasis Residential Villa",
    category: "سكني",
    categoryEn: "Residential",
    image: "/project-2.png",
    year: "2024",
    location: "رأس الخيمة",
    locationEn: "Ras Al Khaimah",
  },
  {
    id: 3,
    title: "مشروع البناء المتكامل",
    titleEn: "Integrated Construction Project",
    category: "إنشائي",
    categoryEn: "Structural",
    image: "/project-3.png",
    year: "2023",
    location: "رأس الخيمة",
    locationEn: "Ras Al Khaimah",
  },
  {
    id: 4,
    title: "تصميم مكاتب عصرية",
    titleEn: "Modern Office Design",
    category: "تصميم داخلي",
    categoryEn: "Interior Design",
    image: "/project-4.png",
    year: "2024",
    location: "رأس الخيمة",
    locationEn: "Ras Al Khaimah",
  },
  {
    id: 5,
    title: "مجمع طبي متخصص",
    titleEn: "Specialized Medical Complex",
    category: "صحي",
    categoryEn: "Healthcare",
    image: "/project-5.png",
    year: "2023",
    location: "رأس الخيمة",
    locationEn: "Ras Al Khaimah",
  },
  {
    id: 6,
    title: "مركز تسوق حديث",
    titleEn: "Modern Shopping Center",
    category: "تجاري",
    categoryEn: "Commercial",
    image: "/project-6.png",
    year: "2024",
    location: "رأس الخيمة",
    locationEn: "Ras Al Khaimah",
  },
];

// ==================== SERVICES DATA ====================
const SERVICES = [
  {
    icon: Building2,
    title: "التصميم المعماري",
    titleEn: "Architectural Design",
    desc: "تصاميم معمارية إبداعية ومبتكرة تتوافق مع أعلى معايير الجودة ومتطلبات بلدية رأس الخيمة",
    descEn: "Creative and innovative architectural designs that comply with the highest quality standards",
  },
  {
    icon: HardHat,
    title: "التصميم الإنشائي",
    titleEn: "Structural Design",
    desc: "تصاميم إنشائية دقيقة وموثوقة تضمن سلامة وأمان المباني",
    descEn: "Precise and reliable structural designs ensuring safety and security",
  },
  {
    icon: Zap,
    title: "التصميم الكهروميكانيكي",
    titleEn: "MEP Design",
    desc: "تصاميم متكاملة للأنظمة الكهربائية والميكانيكية والسباكة وأنظمة مكافحة الحريق",
    descEn: "Comprehensive designs for electrical, mechanical, plumbing, and fire fighting systems",
  },
  {
    icon: FileCheck,
    title: "رخص البلدية",
    titleEn: "Municipality Licenses",
    desc: "استخراج رخص البناء من بلدية رأس الخيمة بخطوات سلسة ومتابعة مستمرة",
    descEn: "Obtaining building permits from RAK Municipality with smooth procedures",
  },
  {
    icon: Eye,
    title: "الإشراف على التنفيذ",
    titleEn: "Construction Supervision",
    desc: "إشراف هندسي دقيق على جميع مراحل التنفيذ لضمان أعلى معايير الجودة",
    descEn: "Precise engineering supervision across all execution phases",
  },
  {
    icon: ClipboardCheck,
    title: "الاستشارات الهندسية",
    titleEn: "Engineering Consultation",
    desc: "تقديم استشارات هندسية متخصصة في جميع المجالات المدنية والمعمارية والإنشائية",
    descEn: "Specialized engineering consultation services in all civil, architectural, and structural fields",
  },
];

// ==================== STATS ====================
const STATS = [
  { value: 250, label: "مشروع مكتمل", labelEn: "Projects Completed", icon: Building2, suffix: "+" },
  { value: 180, label: "عميل راضٍ", labelEn: "Satisfied Clients", icon: Users, suffix: "+" },
  { value: 6, label: "تخصصات هندسية", labelEn: "Engineering Disciplines", icon: Award, suffix: "" },
  { value: 50, label: "مشروع قيد التنفيذ", labelEn: "Ongoing Projects", icon: Compass, suffix: "+" },
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
      const eased = 1 - Math.pow(1 - progress, 3);
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

// ==================== ANIMATED TEXT COMPONENT ====================
function AnimatedText({ text, language }: { text: string; language: "ar" | "en" }) {
  const words = text.split(" ");
  
  return (
    <span className="inline">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// ==================== HERO VIDEO BACKGROUND ====================
function HeroVideoBackground() {
  const ref = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75;
    }
  }, []);

  return (
    <motion.div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.9) saturate(1.2)" }}
        >
          <source src="https://typefive.b-cdn.net/design-system-hero-new.mp4" type="video/mp4" />
          {/* Fallback: if CDN video fails, CSS gradient will show through the overlay */}
        </video>
        {/* Navy Blue Overlay - reduced for video visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628]/30 via-[#0A1628]/20 to-[#0A1628]/60" />
        {/* Subtle Blue Tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/5 via-transparent to-[#0F2557]/8" />
      </motion.div>
    </motion.div>
  );
}

// ==================== PROJECT CARD COMPONENT ====================
function ProjectCard({
  project,
  index,
  language,
}: {
  project: typeof PROJECTS[0];
  index: number;
  language: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" as const }}
      className="group relative overflow-hidden rounded-2xl cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={project.image}
          alt={t(project.title, project.titleEn)}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1D3A]/90 via-[#0B1D3A]/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        <div className="absolute top-4 start-4">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#0B1D3A]">
            {t(project.category, project.categoryEn)}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <ArrowUpRight className="w-5 h-5 text-[#0B1D3A]" />
        </motion.div>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.2 }}
        >
          <h3 className="text-xl font-bold text-white mb-2">
            {t(project.title, project.titleEn)}
          </h3>
          <div className="flex items-center gap-3 text-white/70 text-sm">
            <span>{project.year}</span>
            <span>•</span>
            <span>{t(project.location, project.locationEn)}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
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
  const [formError, setFormError] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { lang: language, t: tHook } = useLanguage();
  const [languageState, setLanguageState] = useState<"ar" | "en">(language);

  // Sync the hook's synchronous value with local state for toggle
  const currentLang = languageState || language;
  const t = (ar: string, en: string) => (currentLang === "ar" ? ar : en);

  useEffect(() => {
    setLanguageState(language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = currentLang === "ar" ? "en" : "ar";
    setLanguageState(newLang);
    localStorage.setItem("blueprint-lang", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
    window.dispatchEvent(new Event("blueprint-lang-change"));
  };

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
    setFormError("");
    try {
      const res = await fetch("/api/quote-requests", {
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
      if (!res.ok) {
        throw new Error(t("حدث خطأ أثناء إرسال الطلب", "An error occurred while submitting"));
      }
      setFormSuccess(true);
      setFormName("");
      setFormPhone("");
      setFormEmail("");
      setFormType("");
      setFormMessage("");
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("حدث خطأ غير متوقع", "An unexpected error occurred"));
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF]" dir={language === "ar" ? "rtl" : "ltr"} style={{ fontFamily: "var(--font-ibm-plex-arabic), var(--font-jakarta), system-ui, sans-serif" }}>
      {/* ===== HEADER - TYPEFIVE STYLE ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <LogoImage size={40} />
              <div>
                <h1 className="text-lg font-bold text-white">BluePrint</h1>
                <p className="text-[10px] text-blue-200/80 font-medium">
                  {t("مكتب الاستشارات الهندسية", "Engineering Consultancy")}
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 bg-white/[0.08] backdrop-blur-xl rounded-full px-2 border border-white/[0.12]">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href + link.labelEn}
                  href={link.href}
                  className="px-4 py-3 text-sm text-blue-100/80 hover:text-white transition-colors font-medium relative group"
                >
                  {t(link.label, link.labelEn)}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-4" />
                </Link>
              ))}
              <button
                onClick={toggleLanguage}
                className="px-3 py-2 text-xs font-medium text-blue-200/80 hover:text-white transition-colors"
              >
                {language === "ar" ? "EN" : "عربي"}
              </button>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/quote">
                <Button className="bg-gradient-to-r from-[#0F2557] to-[#1A4A8B] hover:from-[#1A4A8B] hover:to-[#2563EB] text-white rounded-full px-8 py-3 text-sm font-semibold tracking-wide shadow-[0_4px_20px_rgba(15,37,87,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_6px_30px_rgba(15,37,87,0.5)]">
                  {t("ابدأ مشروعك", "Start Your Project")}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white transition-colors"
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
              className="md:hidden bg-[#0A1628]/95 backdrop-blur-xl border-t border-[#1A4A8B]/20 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href + link.labelEn}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm text-blue-100 hover:text-white transition-colors font-medium"
                  >
                    {t(link.label, link.labelEn)}
                  </Link>
                ))}
                <Link href="/quote" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full mt-2 bg-white text-[#0B1D3A] rounded-full">
                    {t("ابدأ مشروعك", "Start Your Project")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ===== HERO SECTION - TYPEFIVE STYLE ===== */}
      <section className="relative pt-20 min-h-screen overflow-hidden">
        <HeroVideoBackground />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        {/* Glowing Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 -start-20 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-10 -end-20 w-96 h-96 rounded-full bg-[#1A4A8B]/20 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            {/* Heading - TypeFive Style */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" as const }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light text-white leading-[1.1] tracking-tight">
                <span className="block">{t("منزل لأحلامك.", "A home for your dreams.")}</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" as const }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-light text-blue-100/90 mt-4 leading-[1.15]" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.15)" }}>
                <AnimatedText 
                  text={t(
                    "نصمم ونبني بأعلى معايير الجودة والاحترافية",
                    "Design and build with the highest standards of quality and professionalism"
                  )}
                  language={language}
                />
              </h2>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" as const }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/quote">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full sm:w-auto px-10 h-14 text-base bg-white text-[#0A1628] hover:bg-blue-50 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.15),0_4px_20px_rgba(15,37,87,0.25)] transition-all duration-300 font-semibold tracking-wide">
                    {t("ابدأ مشروعك الآن", "Start Your Project Now")}
                    <ArrowUpRight className="w-5 h-5 ms-2" />
                  </Button>
                </motion.div>
              </Link>
              <a href="tel:+971501611234">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto px-10 h-14 text-base border-2 border-white/25 text-white hover:bg-white/15 hover:border-white/40 rounded-full backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 font-semibold tracking-wide"
                  >
                    <Phone className="w-5 h-5 me-2" />
                    {t("اتصل بنا", "Call Us")}
                  </Button>
                </motion.div>
              </a>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" as const }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm"
            >
              {[
                { labelAr: "+250 مشروع", labelEn: "+250 Projects", icon: Building2 },
                { labelAr: "+180 عميل", labelEn: "+180 Clients", icon: Users },
                { labelAr: "فريق متخصص", labelEn: "Specialized Team", icon: Award },
              ].map((item) => (
                <div key={item.labelEn} className="flex items-center gap-2 text-blue-200/70">
                  <item.icon className="w-4 h-4" />
                  <span>{t(item.labelAr, item.labelEn)}</span>
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
              fill="#F8FAFF"
            />
          </svg>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-16 sm:py-20 bg-[#F8FAFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              const counter = statCounters[i];
              return (
                <motion.div
                  key={stat.label}
                  ref={counter.ref}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-8 rounded-2xl bg-white border border-blue-100/50 shadow-[0_1px_3px_rgba(15,37,87,0.04)] hover:shadow-[0_12px_40px_rgba(15,37,87,0.1)] hover:-translate-y-1.5 transition-all duration-400"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F2557] to-[#1A4A8B] mb-4 shadow-[0_4px_12px_rgba(15,37,87,0.2)]">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-[#0A1628] tabular-nums font-[family-name:var(--font-jakarta)]">
                    {counter.count}
                    {stat.suffix}
                  </div>
                  <div className="text-sm text-[#4A6FA5] mt-1">{t(stat.label, stat.labelEn)}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== PROJECTS GRID ===== */}
      <section id="projects" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1A4A8B] rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Building2 className="w-4 h-4" />
              {t("أعمالنا", "Our Work")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A1628] tracking-tight">
              {t("مشاريع مميزة", "Featured Projects")}
            </h2>
            <p className="mt-3 text-[#4A6FA5] max-w-2xl mx-auto">
              {t(
                "نعرض لكم مجموعة من أبرز المشاريع التي قمنا بتنفيذها بكفاءة واحترافية عالية",
                "We present to you a selection of the most prominent projects we have executed"
              )}
            </p>
          </motion.div>

          {/* Projects Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECTS.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                language={language}
              />
            ))}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="px-8 h-12 border-2 border-[#0F2557]/20 text-[#0F2557] hover:bg-[#0F2557] hover:text-white hover:border-[#0F2557] rounded-full font-semibold tracking-wide transition-all duration-300"
              >
                {t("عرض جميع المشاريع", "View All Projects")}
                <ArrowUpRight className="w-4 h-4 ms-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section id="services" className="py-16 sm:py-24 bg-[#F8FAFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1A4A8B] rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Compass className="w-4 h-4" />
              {t("خدماتنا", "Services")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A1628] tracking-tight">
              {t("حلول هندسية شاملة", "Comprehensive Engineering Solutions")}
            </h2>
            <p className="mt-3 text-[#4A6FA5] max-w-2xl mx-auto">
              {t(
                "نقدم مجموعة متكاملة من الخدمات الهندسية التي تغطي جميع مراحل المشروع",
                "We offer an integrated suite of engineering services covering all project phases"
              )}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {SERVICES.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.titleEn}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-6 bg-white rounded-2xl border border-blue-100/50 hover:border-[#0F2557]/20 hover:shadow-[0_12px_40px_rgba(15,37,87,0.1)] transition-all duration-400 cursor-pointer hover:-translate-y-1.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F2557] to-[#1A4A8B] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_4px_12px_rgba(15,37,87,0.2)]">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0A1628] mb-2">{t(service.title, service.titleEn)}</h3>
                  <p className="text-sm text-[#4A6FA5] leading-relaxed">{t(service.desc, service.descEn)}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section id="about" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1A4A8B] rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Award className="w-4 h-4" />
              {t("من نحن", "About Us")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A1628] tracking-tight">
              {t("لماذا تختار BluePrint؟", "Why Choose BluePrint?")}
            </h2>
            <p className="mt-3 text-[#4A6FA5] max-w-2xl mx-auto">
              {t(
                "نحن شريكك الهندسي الموثوق في رأس الخيمة - نجمع بين الإبداع والدقة والموثوقية",
                "Your trusted engineering partner in Ras Al Khaimah - combining creativity, precision, and reliability"
              )}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Users,
                title: "فريق مهني متخصص",
                titleEn: "Specialized Professional Team",
                desc: "مهندسون معتمدون ذوو خبرات واسعة في مشاريع رأس الخيمة",
                descEn: "Certified engineers with extensive experience in RAK projects",
              },
              {
                icon: FileCheck,
                title: "خبرة في الموافقات الحكومية",
                titleEn: "Government Approvals Expertise",
                desc: "علاقات مميزة مع البلدية والدفاع المدني وجهات الترخيص",
                descEn: "Strong relationships with Municipality and licensing authorities",
              },
              {
                icon: Target,
                title: "التزام بالمواعيد",
                titleEn: "Commitment to Deadlines",
                desc: "التزام صارم بجدول المواعيد وتسليم المشاريع في الوقت المحدد",
                descEn: "Strict commitment to project timelines and on-schedule delivery",
              },
              {
                icon: Star,
                title: "أسعار تنافسية",
                titleEn: "Competitive Pricing",
                desc: "أسعار شفافة وعادلة مع الحفاظ على أعلى مستويات الجودة",
                descEn: "Transparent and fair pricing with highest quality standards",
              },
              {
                icon: Zap,
                title: "نهج رقمي متطور",
                titleEn: "Advanced Digital Approach",
                desc: "نستخدم أحدث التقنيات لإدارة المشاريع والتواصل مع العملاء",
                descEn: "We use the latest technologies for project management",
              },
              {
                icon: Headphones,
                title: "دعم متواصل",
                titleEn: "Continuous Support",
                desc: "فريق خدمة عملاء متاح للإجابة على استفساراتكم",
                descEn: "Customer service team available to answer your inquiries",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-8 rounded-2xl bg-gradient-to-b from-[#EFF6FF]/80 to-white border border-blue-100/40 hover:shadow-[0_12px_40px_rgba(15,37,87,0.1)] hover:-translate-y-1.5 transition-all duration-400"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] text-[#0F2557] mb-4 shadow-[0_2px_8px_rgba(15,37,87,0.08)]">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0A1628] mb-2">{t(item.title, item.titleEn)}</h3>
                  <p className="text-sm text-[#4A6FA5] leading-relaxed">{t(item.desc, item.descEn)}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-[#0A1628] via-[#0F2557] to-[#0A1628] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="contact-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contact-grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-blue-200 text-sm font-medium mb-6">
                <MessageCircle className="w-4 h-4" />
                {t("تواصل معنا", "Contact Us")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{t("ابدأ مشروعك الآن", "Start Your Project Now")}</h2>
              <p className="mt-4 text-blue-200/80 leading-relaxed max-w-lg">
                {t(
                  "أخبرنا عن مشروعك وسنقدم لك استشارة مجانية وعرض سعر تفصيلي خلال 24 ساعة",
                  "Tell us about your project and we'll provide a free consultation and detailed quote within 24 hours"
                )}
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{t("اتصل بنا", "Call Us")}</div>
                    <div className="text-blue-200 text-sm mt-1" dir="ltr">+971 50 161 1234</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{t("البريد الإلكتروني", "Email")}</div>
                    <div className="text-blue-200 text-sm mt-1">info.blueprintrak@gmail.com</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{t("العنوان", "Address")}</div>
                    <div className="text-blue-200 text-sm mt-1">{t("رأس الخيمة - الإمارات", "Ras Al Khaimah - UAE")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{t("ساعات العمل", "Working Hours")}</div>
                    <div className="text-blue-200 text-sm mt-1">{t("الأحد - الخميس: 8:30 ص - 2:00 م / 5:00 م - 8:30 م", "Sun - Thu: 8:30 AM - 2:00 PM / 5:00 PM - 8:30 PM")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{t("الجمعة", "Friday")}</div>
                    <div className="text-blue-200 text-sm mt-1">{t("8:00 ص - 12:00 م", "8:00 AM - 12:00 PM")}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl"
            >
              {formSuccess ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-16 h-16 text-[#0F2557] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#0A1628] mb-2">{t("تم إرسال طلبك بنجاح!", "Request Sent Successfully!")}</h3>
                  <p className="text-[#4A6FA5]">{t("سنتواصل معك خلال 24 ساعة", "We'll get back to you within 24 hours")}</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <h3 className="text-xl font-bold text-[#0A1628] mb-2">{t("طلب استشارة مجانية", "Free Consultation Request")}</h3>
                  <p className="text-sm text-[#4A6FA5] mb-4">{t("املأ النموذج وسنعود إليك قريباً", "Fill the form and we'll get back to you soon")}</p>

                  {formError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{formError}</div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#0A1628] text-sm">{t("الاسم الكامل", "Full Name")}</Label>
                      <Input
                        placeholder={t("أدخل اسمك", "Enter your name")}
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                        className="h-11 border-blue-100 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#0A1628] text-sm">{t("رقم الهاتف", "Phone Number")}</Label>
                      <Input
                        placeholder="+971 XX XXX XXXX"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        required
                        dir="ltr"
                        className="h-11 border-blue-100 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-left"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#0A1628] text-sm">{t("البريد الإلكتروني", "Email")}</Label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="h-11 border-blue-100 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#0A1628] text-sm">{t("نوع الخدمة", "Service Type")}</Label>
                    <Select value={formType} onValueChange={setFormType} required>
                      <SelectTrigger className="h-11 border-blue-100">
                        <SelectValue placeholder={t("اختر نوع الخدمة", "Select service type")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="architectural">{t("تصميم معماري", "Architectural Design")}</SelectItem>
                        <SelectItem value="structural">{t("تصميم إنشائي", "Structural Design")}</SelectItem>
                        <SelectItem value="mep">{t("تصميم كهروميكانيكي", "MEP Design")}</SelectItem>
                        <SelectItem value="permits">{t("رخص البلدية", "Municipality Permits")}</SelectItem>
                        <SelectItem value="supervision">{t("إشراف التنفيذ", "Construction Supervision")}</SelectItem>
                        <SelectItem value="consultation">{t("استشارة هندسية", "Engineering Consultation")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#0A1628] text-sm">{t("تفاصيل المشروع", "Project Details")}</Label>
                    <Textarea
                      placeholder={t("أخبرنا عن مشروعك...", "Tell us about your project...")}
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      rows={3}
                      className="border-blue-100 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-[#0F2557] to-[#1A4A8B] hover:from-[#1A4A8B] hover:to-[#2563EB] text-white rounded-full text-base font-semibold tracking-wide shadow-[0_4px_20px_rgba(15,37,87,0.3)] transition-all duration-300"
                  >
                    {formSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("جاري الإرسال...", "Sending...")}
                      </span>
                    ) : (
                      t("إرسال الطلب", "Submit Request")
                    )}
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#060E1F] py-12 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <LogoImage size={32} />
              <div>
                <h3 className="text-lg font-bold text-white">BluePrint</h3>
                <p className="text-xs text-blue-300/60">{t("مكتب الاستشارات الهندسية", "Engineering Consultancy")}</p>
              </div>
            </div>
            <p className="text-blue-200/40 text-sm">
              © {new Date().getFullYear()} BluePrint. {t("جميع الحقوق محفوظة.", "All rights reserved.")}
            </p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 end-8 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-[#0F2557] to-[#1A4A8B] text-white shadow-[0_4px_20px_rgba(15,37,87,0.4)] hover:shadow-[0_6px_30px_rgba(15,37,87,0.5)] hover:scale-110 transition-all duration-300 flex items-center justify-center"
          >
            <ArrowUpRight className="w-5 h-5 rotate-[-45deg]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
