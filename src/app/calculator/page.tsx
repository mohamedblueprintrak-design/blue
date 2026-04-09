"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calculator,
  Building2,
  HardHat,
  Store,
  Factory,
  Layers,
  BarChart3,
  DollarSign,
  FileCheck,
  Shield,
  Eye,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PublicHeader from "@/components/layout/public-header";
import PublicFooter from "@/components/layout/public-footer";

// RAK Market Pricing Data (AED)
interface PricingData {
  designPerSqm: { min: number; max: number };
  municipalityFees: { min: number; max: number };
  civilDefenseFees: { min: number; max: number };
  supervisionPercent: { min: number; max: number };
}

const BUILDING_TYPES = [
  { value: "villa", label: "فيلا", icon: Building2 },
  { value: "apartment", label: "عمارة سكنية", icon: Building2 },
  { value: "commercial", label: "تجاري", icon: Store },
  { value: "industrial", label: "صناعي", icon: Factory },
];

const AREA_RANGES: Record<string, { label: string; avgSqm: number }> = {
  "less-300": { label: "أقل من 300 م²", avgSqm: 250 },
  "300-500": { label: "300 - 500 م²", avgSqm: 400 },
  "500-1000": { label: "500 - 1,000 م²", avgSqm: 750 },
  "1000+": { label: "أكثر من 1,000 م²", avgSqm: 1500 },
};

const FLOOR_OPTIONS = [
  { value: "1", label: "دور واحد" },
  { value: "2", label: "دوران" },
  { value: "3", label: "3 أدوار" },
  { value: "4", label: "4 أدوار" },
  { value: "5+", label: "5+ أدوار" },
];

const FINISH_LEVELS = [
  { value: "standard", label: "عادي", multiplier: 1.0 },
  { value: "semi-luxury", label: "فاخر جزئي", multiplier: 1.3 },
  { value: "luxury", label: "فاخر", multiplier: 1.6 },
  { value: "super-luxury", label: "سوبر لوكس", multiplier: 2.0 },
];

// Base pricing per sqm per building type (AED)
const BASE_PRICING: Record<string, PricingData> = {
  villa: {
    designPerSqm: { min: 35, max: 55 },
    municipalityFees: { min: 8000, max: 15000 },
    civilDefenseFees: { min: 3000, max: 6000 },
    supervisionPercent: { min: 4, max: 7 },
  },
  apartment: {
    designPerSqm: { min: 25, max: 40 },
    municipalityFees: { min: 15000, max: 35000 },
    civilDefenseFees: { min: 8000, max: 18000 },
    supervisionPercent: { min: 3, max: 6 },
  },
  commercial: {
    designPerSqm: { min: 45, max: 75 },
    municipalityFees: { min: 20000, max: 50000 },
    civilDefenseFees: { min: 10000, max: 25000 },
    supervisionPercent: { min: 5, max: 8 },
  },
  industrial: {
    designPerSqm: { min: 20, max: 35 },
    municipalityFees: { min: 15000, max: 40000 },
    civilDefenseFees: { min: 12000, max: 30000 },
    supervisionPercent: { min: 4, max: 7 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

function formatAED(value: number) {
  return new Intl.NumberFormat("ar-AE", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + " درهم";
}

export default function CalculatorPage() {
  const [buildingType, setBuildingType] = useState("villa");
  const [areaRange, setAreaRange] = useState("300-500");
  const [floors, setFloors] = useState("1");
  const [showResult, setShowResult] = useState(false);
  const [finishLevel, setFinishLevel] = useState("standard");

  const floorMultiplier = floors === "5+" ? 1.5 : parseFloat(floors) * 0.7 + 0.3;
  const finishMultiplier = FINISH_LEVELS.find(f => f.value === finishLevel)?.multiplier || 1.0;
  const areaData = AREA_RANGES[areaRange];
  const pricing = BASE_PRICING[buildingType];

  const calculation = useMemo(() => {
    if (!areaData || !pricing) return null;

    const sqm = areaData.avgSqm;

    // Design Cost
    const designMin = Math.round(sqm * pricing.designPerSqm.min * finishMultiplier * Math.min(floorMultiplier, 2.5));
    const designMax = Math.round(sqm * pricing.designPerSqm.max * finishMultiplier * Math.min(floorMultiplier, 2.5));

    // Municipality Fees (scaled with area and floors)
    const muniMin = Math.round(pricing.municipalityFees.min * (1 + (sqm - 250) / 1000) * Math.min(floorMultiplier, 2));
    const muniMax = Math.round(pricing.municipalityFees.max * (1 + (sqm - 250) / 1000) * Math.min(floorMultiplier, 2));

    // Civil Defense Fees
    const civilMin = Math.round(pricing.civilDefenseFees.min * (1 + (sqm - 250) / 2000) * Math.min(floorMultiplier, 2));
    const civilMax = Math.round(pricing.civilDefenseFees.max * (1 + (sqm - 250) / 2000) * Math.min(floorMultiplier, 2));

    // Supervision (percentage of design)
    const supervMin = Math.round(designMin * pricing.supervisionPercent.min / 100);
    const supervMax = Math.round(designMax * pricing.supervisionPercent.max / 100);

    // Total
    const totalMin = designMin + muniMin + civilMin + supervMin;
    const totalMax = designMax + muniMax + civilMax + supervMax;

    return {
      design: { min: designMin, max: designMax },
      municipality: { min: muniMin, max: muniMax },
      civilDefense: { min: civilMin, max: civilMax },
      supervision: { min: supervMin, max: supervMax },
      total: { min: totalMin, max: totalMax },
    };
  }, [buildingType, areaRange, floors, finishLevel]);

  const breakdown = [
    {
      label: "تكلفة التصميم الهندسي",
      icon: FileCheck,
      color: "from-teal-500 to-teal-600",
      data: calculation?.design,
    },
    {
      label: "رسوم البلدية",
      icon: Shield,
      color: "from-blue-500 to-blue-600",
      data: calculation?.municipality,
    },
    {
      label: "رسوم الدفاع المدني",
      icon: HardHat,
      color: "from-amber-500 to-amber-600",
      data: calculation?.civilDefense,
    },
    {
      label: "تكلفة الإشراف على التنفيذ",
      icon: Eye,
      color: "from-purple-500 to-purple-600",
      data: calculation?.supervision,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Calculator className="w-4 h-4" />
              حاسبة التكاليف
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              تقدير تكلفة مشروعك
            </h1>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto">
              أدخل تفاصيل مشروعك واحصل على تقدير تقريبي لتكاليف التصميم والترخيص في رأس الخيمة
            </p>
          </div>

          {/* Calculator Form */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/80 space-y-5">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-500" />
                  تفاصيل المشروع
                </h2>

                {/* Building Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">نوع المبنى</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUILDING_TYPES.map((b) => {
                      const Icon = b.icon;
                      const isSelected = buildingType === b.value;
                      return (
                        <button
                          key={b.value}
                          onClick={() => { setBuildingType(b.value); setShowResult(false); }}
                          className={`p-3 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer text-xs ${
                            isSelected
                              ? "border-teal-500 bg-teal-50"
                              : "border-slate-200 hover:border-teal-300"
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-1 ${isSelected ? "text-teal-500" : "text-slate-400"}`} />
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Area Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">نطاق المساحة</label>
                  <Select value={areaRange} onValueChange={(v) => { setAreaRange(v); setShowResult(false); }}>
                    <SelectTrigger className="w-full h-11 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AREA_RANGES).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Floors */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">عدد الأدوار</label>
                  <Select value={floors} onValueChange={(v) => { setFloors(v); setShowResult(false); }}>
                    <SelectTrigger className="w-full h-11 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FLOOR_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Finish Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">مستوى التشطيب</label>
                  <Select value={finishLevel} onValueChange={(v) => { setFinishLevel(v); setShowResult(false); }}>
                    <SelectTrigger className="w-full h-11 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINISH_LEVELS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => setShowResult(true)}
                  className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/20 rounded-xl text-base"
                >
                  <BarChart3 className="w-5 h-5 me-2" />
                  احسب التكلفة
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {showResult && calculation ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {/* Total Card */}
                  <motion.div
                    variants={fadeInUp}
                    custom={0}
                    className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl shadow-teal-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-teal-100 text-sm">التكلفة التقديرية الإجمالية</span>
                      <DollarSign className="w-5 h-5 text-teal-200" />
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold mb-1">
                      {formatAED(calculation.total.min)} - {formatAED(calculation.total.max)}
                    </div>
                    <p className="text-teal-200 text-sm">
                      للمساحة التقريبية {areaData.label} ({areaData.avgSqm} م²)
                    </p>
                  </motion.div>

                  {/* Breakdown */}
                  {breakdown.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        variants={fadeInUp}
                        custom={i + 1}
                        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-4"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">{item.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.data ? `${formatAED(item.data.min)} - ${formatAED(item.data.max)}` : "-"}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {item.data ? formatAED(Math.round((item.data.min + item.data.max) / 2)) : "-"}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Disclaimer */}
                  <motion.div variants={fadeInUp} custom={6} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-amber-800">تنبيه مهم</div>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        هذه الأرقام تقديرية فقط بناءً على متوسط أسعار السوق في رأس الخيمة.
                        التكلفة الفعلية تعتمد على تفاصيل المشروع ومتطلبات البلدية والدفاع المدني.
                        للحصول على عرض سعر دقيق، يرجى <Link href="/quote" className="underline font-medium hover:text-amber-900">طلب عرض سعر</Link>.
                      </p>
                    </div>
                  </motion.div>

                  {/* CTA */}
                  <motion.div variants={fadeInUp} custom={7} className="flex flex-col sm:flex-row gap-3">
                    <Link href="/quote" className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20">
                        طلب عرض سعر مفصل
                      </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                      <Button variant="outline" className="w-full border-slate-200">
                        العودة للرئيسية
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-2xl p-10 shadow-lg border border-slate-200/80 text-center">
                  <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-teal-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    جاهز لحساب التكلفة؟
                  </h3>
                  <p className="text-sm text-slate-500">
                    أدخل تفاصيل مشروعك ثم اضغط &quot;احسب التكلفة&quot; للحصول على تقدير فوري
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
