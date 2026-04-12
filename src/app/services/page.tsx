"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  { step: 1, title: "الاستشارة الأولية", desc: "نستمع لاحتياجاتك ونفهم متطلبات مشروعك في اجتماع مجاني" },
  { step: 2, title: "دراسة الموقع", desc: "نقوم بزيارة ميدانية للموقع وتقييم المتطلبات والتحديات" },
  { step: 3, title: "التصميم والتخطيط", desc: "نعمل على إعداد التصاميم والمخططات بالتنسيق معك" },
  { step: 4, title: "الموافقات الحكومية", desc: "نتولى جميع إجراءات الترخيص والموافقات من الجهات المعنية" },
  { step: 5, title: "التنفيذ والمتابعة", desc: "نشرف على التنفيذ مع تقارير دورية وتحديثات مستمرة" },
  { step: 6, title: "التسليم", desc: "نسلم المشروع وفقاً لأعلى معايير الجودة والسلامة" },
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
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function ServicesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="services-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#services-grid)" />
            </svg>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial="hidden" animate="visible">
              <motion.div variants={fadeInUp} custom={0}>
                <span className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 text-teal-400 text-sm font-medium mb-4">
                  <Building2 className="w-4 h-4" />
                  خدماتنا
                </span>
              </motion.div>
              <motion.h1 variants={fadeInUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                خدمات هندسية شاملة
              </motion.h1>
              <motion.p variants={fadeInUp} custom={2} className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                نغطي جميع مراحل المشروع من التصميم حتى التسليم بخبرة احترافية
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Services Detail */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {SERVICES_DETAIL.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    custom={0}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed mb-4">{service.desc}</p>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {service.features.map((feature) => (
                              <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                                {feature}
                              </div>
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
        <section className="py-16 sm:py-20 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.div variants={fadeInUp} custom={0} className="text-center mb-12">
                <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                  <ListOrdered className="w-4 h-4" />
                  كيف نعمل
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  منهجية عملنا
                </h2>
                <p className="mt-2 text-slate-500">
                  نتبع منهجية واضحة ومجربة لضمان نجاح مشاريع عملائنا
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} custom={1} className="relative">
                {/* Vertical line */}
                <div className="absolute start-5 sm:start-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-cyan-500 to-teal-500 hidden sm:block" />

                <div className="space-y-6">
                  {PROCESS_STEPS.map((step, i) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="flex items-start gap-4 sm:gap-6 relative"
                    >
                      <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 text-white font-bold text-sm sm:text-lg z-10">
                        {step.step}
                      </div>
                      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex-1">
                        <h4 className="text-base font-bold text-slate-900">{step.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.div variants={fadeInUp} custom={0} className="text-center mb-10">
                <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                  الأسئلة الشائعة
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  أسئلة متكررة
                </h2>
              </motion.div>

              <motion.div variants={fadeInUp} custom={1} className="space-y-3">
                {FAQS.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div key={i} className="border border-slate-200/80 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="w-full flex items-center justify-between p-5 text-right cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-semibold text-slate-900">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-teal-500 shrink-0 me-3" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 me-3" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-teal-500 to-cyan-600">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              جاهز لبدء مشروعك؟
            </h2>
            <p className="text-teal-100 mb-8 max-w-xl mx-auto">
              تواصل معنا الآن واحصل على استشارة مجانية وعرض سعر خلال 24 ساعة
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/quote">
                <Button className="w-full sm:w-auto px-8 h-12 bg-white text-teal-600 hover:bg-teal-50 shadow-lg rounded-xl text-base font-semibold">
                  طلب عرض سعر
                  <ArrowLeft className="w-4 h-4 ms-2 rotate-180" />
                </Button>
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
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
