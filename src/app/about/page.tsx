"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Target,
  Eye,
  Award,
  Users,
  Clock,
  CheckCircle2,
  Shield,
  Briefcase,
  GraduationCap,
  MapPin,
} from "lucide-react";
import PublicHeader from "@/components/layout/public-header";
import PublicFooter from "@/components/layout/public-footer";

const TEAM_MEMBERS = [
  { name: "م. جراح الطير", title: "المدير العام ومؤسس المكتب", specialty: "هندسة مدنية - إدارة مشاريع" },
  { name: "دينا الجاعلي", title: "مديرة قسم التصميم المعماري", specialty: "تصميم معماري" },
  { name: "م. شريف صبري", title: "مدير قسم التصميم الإنشائي", specialty: "هندسة إنشائية" },
];

const LICENSES = [
  { title: "رخصة مكتب استشارات هندسية", authority: "بلدية رأس الخيمة", icon: Building2 },
  { title: "عضوية جمعية المهندسين الإماراتية", authority: "جمعية المهندسين - الإمارات", icon: GraduationCap },
  { title: "اعتماد مزاولة المهنة", authority: "وزارة التغيير المناخي والبيئة", icon: Shield },
  { title: "شهادة الأيزو ISO 9001:2015", authority: "إدارة الجودة", icon: Award },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="about-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#about-grid)" />
            </svg>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial="hidden" animate="visible">
              <motion.div variants={fadeInUp} custom={0}>
                <span className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 text-teal-400 text-sm font-medium mb-4">
                  <Briefcase className="w-4 h-4" />
                  قصتنا
                </span>
              </motion.div>
              <motion.h1 variants={fadeInUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                من نحن
              </motion.h1>
              <motion.p variants={fadeInUp} custom={2} className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
مكتب استشارات هندسية متخصص في تقديم الحلول الهندسية المتميزة في رأس الخيمة
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.h2 variants={fadeInUp} custom={0} className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
                قصة BluePrint
              </motion.h2>
              <motion.div variants={fadeInUp} custom={1} className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  تأسس مكتب BluePrint للاستشارات الهندسية في رأس الخيمة عام 2025 برؤية واضحة: تقديم خدمات هندسية عالية الجودة تجمع بين الإبداع والدقة والموثوقية.
                </p>
                <p>
                  نسعى لأن نكون من أبرز مكاتب الاستشارات الهندسية في إمارة رأس الخيمة، ونعمل على تقديم أفضل الحلول الهندسية لمشاريع متنوعة تشمل الفلل السكنية والمجمعات التجارية والمنشآت الصناعية.
                </p>
                <p>
                  نحن نؤمن بأن كل مشروع هو فرصة لترك بصمة إيجابية في نسيج العمران في رأس الخيمة. لذلك نحرص على تقديم خدمات تتجاوز توقعات عملائنا، مع الالتزام بأعلى معايير الجودة والسلامة والاستدامة.
                </p>
              </motion.div>

              {/* Stats */}
              <motion.div variants={fadeInUp} custom={2} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
                {[
                  { value: "2025", label: "سنة التأسيس", icon: Clock },
                  { value: "6", label: "تخصصات هندسية", icon: Building2 },
                  { value: "RAK", label: "رأس الخيمة", icon: MapPin },
                  { value: "ISO", label: "ISO 9001:2015", icon: GraduationCap },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <Icon className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                      <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} custom={0} className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">رسالتنا</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  تقديم خدمات استشارية هندسية متميزة تلبي احتياجات عملائنا وتتجاوز توقعاتهم، مع الالتزام بأعلى معايير الجودة والابتكار في كل مشروع نعمل عليه.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">رؤيتنا</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  أن نكون المكتب الاستشاري الهندسي الأول في رأس الخيمة والإمارات، ونلعب دوراً محورياً في تطوير البنية التحتية والعمران بطريقة مستدامة ومبتكرة.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.div variants={fadeInUp} custom={0} className="text-center mb-12">
                <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                  <Users className="w-4 h-4" />
                  فريقنا
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  فريق من الخبراء والمتخصصين
                </h2>
                <p className="mt-2 text-slate-500">
                  مهندسون معتمدون بخبرات متنوعة ومتميزة
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} custom={1} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {TEAM_MEMBERS.map((member, i) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Photo placeholder */}
                    <div className="h-32 bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                        {member.name.charAt(member.name.indexOf(" ") + 1)}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold text-slate-900">{member.name}</h3>
                      <p className="text-sm text-teal-600 font-medium mt-1">{member.title}</p>
                      <p className="text-xs text-slate-500 mt-2">{member.specialty}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Licenses */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.div variants={fadeInUp} custom={0} className="text-center mb-10">
                <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                  <Award className="w-4 h-4" />
                  التراخيص والشهادات
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  اعتمادات وشهاداتنا
                </h2>
              </motion.div>

              <motion.div variants={fadeInUp} custom={1} className="grid sm:grid-cols-2 gap-4">
                {LICENSES.map((license) => {
                  const Icon = license.icon;
                  return (
                    <div key={license.title} className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{license.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{license.authority}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
