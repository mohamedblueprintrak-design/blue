"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Building2,
  HardHat,
  Zap,
  FileCheck,
  Shield,
  Eye,
  ClipboardCheck,
  KeyRound,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowLeft,
  ListOrdered,
  Phone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/layout/public-header";
import PublicFooter from "@/components/layout/public-footer";

const SERVICES_DETAIL = [
  {
    icon: Building2,
    title: "التصميم المعماري",
    desc: "نقدم تصاميم معمارية إبداعية ومبتكرة تراعي احتياجات العملاء ومتطلبات بلدية رأس الخيمة. تشمل خدماتنا التصميم المفاهيمي والتصميم التفصيلي وثلاثي الأبعاد.",
    features: [
      "المخططات المعمارية التفصيلية",
      "تصميم واجهات المباني",
      "نماذج ثلاثية الأبعاد",
      "مخططات الأثاث والتجهيزات",
      "تصاميم المناظر الطبيعية",
      "مخططات الإسقاط والقطاعات",
    ],
  },
  {
    icon: HardHat,
    title: "التصميم الإنشائي",
    desc: "تصاميم إنشائية دقيقة وموثوقة تضمن سلامة وأمان المباني. نستخدم أحدث البرامج والتقنيات لإعداد الحسابات الإنشائية ومخططات التسليح.",
    features: [
      "الحسابات الإنشائية",
      "مخططات التسليح التفصيلية",
      "تصميم الأساسات",
      "تصميم الهيكل الخرساني والفولاذي",
      "تقارير الجيوتقنية",
      "دراسات الحمل الزلزالي",
    ],
  },
  {
    icon: Zap,
    title: "التصميم الكهربائي والميكانيكي",
    desc: "تصاميم MEP متكاملة تشمل أنظمة الكهرباء والتكييف والسباكة والغاز وأنظمة مكافحة الحريق، وفقاً لمعايير الدفاع المدني وبلدية رأس الخيمة.",
    features: [
      "تصميم الأنظمة الكهربائية",
      "تصميم أنظمة التكييف (HVAC)",
      "تصميم أنظمة السباكة والصرف الصحي",
      "تصميم أنظمة إطفاء الحريق",
      "تصميم أنظمة المراقبة والأمن",
      "تصميم أنظمة الاتصالات",
    ],
  },
  {
    icon: FileCheck,
    title: "رخص البلدية",
    desc: "خدمة شاملة لاستخراج رخص البناء من بلدية رأس الخيمة. نتولى جميع إجراءات التقديم والمتابعة حتى الحصول على الموافقة.",
    features: [
      "مراجعة المخططات والتأكد من توافقها",
      "إعداد مستندات التقديم",
      "متابعة إجراءات الموافقة",
      "معالجة ملاحظات البلدية",
      "الحصول على رخصة البناء",
      "تجديد الرخص المعمارية",
    ],
  },
  {
    icon: Shield,
    title: "رخص الدفاع المدني",
    desc: "نحصل على موافقات الدفاع المدني وشهادات السلامة لجميع أنواع المشاريع، مع ضمان التوافق الكامل مع متطلبات السلامة.",
    features: [
      "تصميم أنظمة السلامة",
      "إعداد ملفات الدفاع المدني",
      "متابعة إجراءات الموافقة",
      "فحص الأنظمة وتجربتها",
      "الحصول على شهادة الإنجاز",
      "تحديث شهادات السلامة",
    ],
  },
  {
    icon: Eye,
    title: "إشراف التنفيذ",
    desc: "إشراف هندسي دقيق على جميع مراحل التنفيذ لضمان تنفيذ المخططات بالشكل المطلوب وتحقيق أعلى معايير الجودة والسلامة.",
    features: [
      "إعداد خطة الإشراف",
      "مراجعة أعمال المقاولين",
      "ضبط جودة المواد",
      "إعداد تقارير دورية",
      "مراجعة المستخلصات",
      "تسليم المشروع",
    ],
  },
  {
    icon: ClipboardCheck,
    title: "الفحص الهندسي",
    desc: "فحوصات هندسية شاملة للمباني القائمة والمشاريع تحت التنفيذ، مع تقديم تقارير مفصلة وتوصيات فنية دقيقة.",
    features: [
      "الفحص البصري والميداني",
      "اختبارات الخرسانة",
      "فحص التسليح",
      "فحص الأنظمة الكهربائية والميكانيكية",
      "تقييم سلامة المبنى",
      "تقارير فنية مفصلة",
    ],
  },
  {
    icon: KeyRound,
    title: "مشاريع المفاتيح",
    desc: "مشاريع متكاملة من التصميم حتى التسليم بالمفتاح. نتولى إدارة المشروع بالكامل من التخطيط والتصميم حتى البناء والتشطيب والتسليم.",
    features: [
      "دراسة الجدوى",
      "التصميم الكامل",
      "إدارة المقاولات",
      "إشراف التنفيذ",
      "التشطيب والتجهيز",
      "التسليم بالمفتاح",
    ],
  },
];

const PROCESS_STEPS = [
  { step: 1, title: "الاستشارة الأولية", desc: "نستمع لاحتياجاتك ونفهم متطلبات مشروعك في اجتماع مجاني", icon: Building2 },
  { step: 2, title: "دراسة الموقع", desc: "نقوم بزيارة ميدانية للموقع وتقييم المتطلبات والتحديات", icon: Eye },
  { step: 3, title: "التصميم والتخطيط", desc: "نعمل على إعداد التصاميم والمخططات بالتنسيق معك", icon: HardHat },
  { step: 4, title: "الموافقات الحكومية", desc: "نتولى جميع إجراءات الترخيص والموافقات من الجهات المعنية", icon: FileCheck },
  { step: 5, title: "التنفيذ والمتابعة", desc: "نشرف على التنفيذ مع تقارير دورية وتحديثات مستمرة", icon: ClipboardCheck },
  { step: 6, title: "التسليم", desc: "نسلم المشروع وفقاً لأعلى معايير الجودة والسلامة", icon: CheckCircle2 },
];

const FAQS = [
  {
    q: "كم تستغرق عملية التصميم المعماري؟",
    a: "تختلف المدة حسب حجم المشروع ونوعه. عادةً ما تستغرق فيلا سكنية من 3 إلى 6 أسابيع، بينما قد تحتاج المشاريع التجارية الكبيرة إلى 2-3 أشهر.",
  },
  {
    q: "ما هي الرسوم المطلوبة لاستخراج رخصة البناء؟",
    a: "تختلف الرسوم حسب نوع المشروع ومساحته. نقدم استشارة مجانية لتحديد التكاليف المتوقعة. يمكنك استخدام حاسبة التكاليف على موقعنا للحصول على تقدير.",
  },
  {
    q: "هل تقدمون خدمات لمناطق خارج رأس الخيمة؟",
    a: "نعم، نقدم خدماتنا في جميع إمارات الدولة، لكن تركيزنا الأساسي في رأس الخيمة حيث نمتلك خبرة واسعة بالمتطلبات المحلية.",
  },
  {
    q: "كيف يمكنني طلب عرض سعر؟",
    a: "يمكنك ملء نموذج طلب عرض السعر على موقعنا أو التواصل معنا عبر الهاتف أو الواتساب. سنقدم لك عرض سعر مفصل خلال 24 ساعة.",
  },
  {
    q: "ما أنواع المشاريع التي تتعاملون معها؟",
    a: "نتعامل مع جميع أنواع المشاريع: الفلل السكنية، العمارات، المباني التجارية، المنشآت الصناعية، المباني الحكومية، والمشاريع الخاصة.",
  },
];

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
    transition: { staggerChildren: 0.1 },
  },
};

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
          src="/services-bg.png"
          alt="Engineering Team"
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
            <pattern id="services-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#services-grid)" />
        </svg>
      </div>
      {/* Floating Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 end-32 w-64 h-64 rounded-full bg-teal-500/20 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-40 start-32 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl"
      />
    </div>
  );
}

// Marquee Component
function ServicesMarquee() {
  const services = [
    "تصميم معماري",
    "تصميم إنشائي",
    "تصميم كهروميكانيكي",
    "رخص البلدية",
    "رخص الدفاع المدني",
    "إشراف التنفيذ",
    "فحص هندسي",
    "مشاريع المفاتيح",
  ];

  return (
    <div className="relative py-6 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-teal-600/50 via-transparent to-cyan-500/50 animate-pulse" />
      
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...services, ...services, ...services, ...services].map((service, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 text-white/90 font-medium"
          >
            <span>{service}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function ServicesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <ParallaxBackground />
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} custom={0}>
                <span className="inline-flex items-center gap-2 bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 rounded-full px-4 py-1.5 text-teal-400 text-sm font-medium mb-4">
                  <Building2 className="w-4 h-4" />
                  خدماتنا
                </span>
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                custom={1}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
              >
                خدمات هندسية شاملة
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
              >
                نغطي جميع مراحل المشروع من التصميم حتى التسليم بخبرة احترافية
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Marquee */}
        <ServicesMarquee />

        {/* Services Detail */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {SERVICES_DETAIL.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeInUp}
                    custom={0}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white/95 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-teal-500/10"
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex items-start gap-5">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20 transition-transform duration-300"
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed mb-4">{service.desc}</p>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {service.features.map((feature, fi) => (
                              <motion.div
                                key={feature}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: fi * 0.05 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-2 text-sm text-slate-600"
                              >
                                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                                {feature}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How We Work */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeInUp} custom={0} className="text-center mb-12">
                <span className="inline-flex items-center gap-2 bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 text-teal-400 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                  <ListOrdered className="w-4 h-4" />
                  كيف نعمل
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  منهجية عملنا
                </h2>
                <p className="mt-2 text-slate-400">
                  نتبع منهجية واضحة ومجربة لضمان نجاح مشاريع عملائنا
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} custom={1} className="relative">
                {/* Vertical line */}
                <div className="absolute start-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-cyan-500 to-teal-500 hidden sm:block" />

                <div className="space-y-6">
                  {PROCESS_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="flex items-start gap-5 sm:gap-6 relative group"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 text-white font-bold text-lg z-10 shadow-lg shadow-teal-500/20"
                        >
                          <Icon className="w-7 h-7" />
                        </motion.div>
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/20 shadow-lg flex-1 group-hover:shadow-xl group-hover:shadow-teal-500/5 transition-all duration-300">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">
                              {step.step}
                            </span>
                            <h4 className="text-base font-bold text-slate-900">{step.title}</h4>
                          </div>
                          <p className="text-sm text-slate-500">{step.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeInUp} custom={0} className="text-center mb-10">
                <span className="inline-flex items-center gap-2 bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 text-teal-400 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                  الأسئلة الشائعة
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  أسئلة متكررة
                </h2>
              </motion.div>

              <motion.div variants={fadeInUp} custom={1} className="space-y-3">
                {FAQS.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-lg"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="w-full flex items-center justify-between p-5 text-right cursor-pointer hover:bg-teal-50/50 transition-colors"
                      >
                        <span className="text-sm font-semibold text-slate-900">{faq.q}</span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 me-3"
                        >
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-teal-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-teal-600" />
                          )}
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600" />
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cta-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="15" cy="15" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-pattern)" />
            </svg>
          </div>
          
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.h2
                variants={fadeInUp}
                custom={0}
                className="text-2xl sm:text-3xl font-bold text-white mb-4"
              >
                جاهز لبدء مشروعك؟
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                custom={1}
                className="text-teal-100 mb-8 max-w-xl mx-auto"
              >
                تواصل معنا الآن واحصل على استشارة مجانية وعرض سعر خلال 24 ساعة
              </motion.p>
              <motion.div
                variants={fadeInUp}
                custom={2}
                className="flex flex-col sm:flex-row gap-3 justify-center"
              >
                <Link href="/quote">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="w-full sm:w-auto px-8 h-12 bg-white text-teal-600 hover:bg-teal-50 shadow-lg rounded-xl text-base font-semibold">
                      <Sparkles className="w-4 h-4 me-2" />
                      طلب عرض سعر
                    </Button>
                  </motion.div>
                </Link>
                <a href="tel:+971501611234">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto px-8 h-12 border-white/30 text-white hover:bg-white/10 rounded-xl text-base"
                  >
                    <Phone className="w-4 h-4 me-2" />
                    اتصل بنا
                  </Button>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
