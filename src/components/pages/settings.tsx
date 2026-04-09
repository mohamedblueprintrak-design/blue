"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Palette,
  Bell,
  Shield,
  CreditCard,
  Plug,
  Save,
  Upload,
  Globe,
  Sun,
  Moon,
  Check,
  Clock,
  Smartphone,
  MapPin,
  Trash2,
  AlertTriangle,
  User,
  Key,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  language: "ar" | "en";
}

const WORKING_DAYS = [
  { key: "sat", ar: "السبت", en: "Saturday" },
  { key: "sun", ar: "الأحد", en: "Sunday" },
  { key: "mon", ar: "الاثنين", en: "Monday" },
  { key: "tue", ar: "الثلاثاء", en: "Tuesday" },
  { key: "wed", ar: "الأربعاء", en: "Wednesday" },
  { key: "thu", ar: "الخميس", en: "Thursday" },
  { key: "fri", ar: "الجمعة", en: "Friday" },
];

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Building2;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="h-0.5 w-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full" />
    </div>
  );
}

export default function SettingsPage({ language: lang }: Props) {
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => fetch("/api/settings/company").then((r) => r.json()),
  });

  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [notifSettings, setNotifSettings] = useState({
    projectUpdates: true,
    taskDeadlines: true,
    invoiceReminders: true,
    meetingReminders: true,
    siteVisitAlerts: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync form data when settings load
  useState(() => {
    if (settings) {
      setFormData({
        name: settings.name || "",
        nameEn: settings.nameEn || "",
        email: settings.email || "",
        phone: settings.phone || "",
        address: settings.address || "",
        taxNumber: settings.taxNumber || "",
        currency: settings.currency || "AED",
        timezone: settings.timezone || "Asia/Dubai",
        workingHours: settings.workingHours || "08:00-17:00",
      });
      setWorkingDays((settings.workingDays || "").split(",").filter(Boolean));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      setSaved(true);
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => {
      setSaving(false);
    },
  });

  const handleSave = () => {
    setSaving(true);
    updateMutation.mutate({
      ...formData,
      workingDays: workingDays.join(","),
    });
  };

  const toggleWorkingDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const updateField = (key: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const accentColors = [
    { name: "Teal", value: "teal", color: "bg-teal-500" },
    { name: "Blue", value: "blue", color: "bg-blue-500" },
    { name: "Violet", value: "violet", color: "bg-violet-500" },
    { name: "Rose", value: "rose", color: "bg-rose-500" },
    { name: "Amber", value: "amber", color: "bg-amber-500" },
    { name: "Emerald", value: "emerald", color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Tabs defaultValue="company" dir={isAr ? "rtl" : "ltr"} className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="company" className="text-xs px-2 py-2.5 gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "الشركة" : "Company"}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs px-2 py-2.5 gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "المظهر" : "Theme"}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs px-2 py-2.5 gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "الإشعارات" : "Alerts"}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs px-2 py-2.5 gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "الأمان" : "Security"}</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs px-2 py-2.5 gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "الفواتير" : "Billing"}</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs px-2 py-2.5 gap-1.5">
            <Plug className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "الربط" : "Integrations"}</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="company" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={Building2}
                title={isAr ? "معلومات الشركة" : "Company Information"}
                subtitle={isAr ? "تحديث بيانات الشركة الأساسية والشعار" : "Update core company information and logo"}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "اسم الشركة (عربي)" : "Company Name (Arabic)"}
                  </Label>
                  <Input
                    value={(formData.name as string) || settings?.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    dir="rtl"
                    placeholder={isAr ? "مكتب الاستشارات الهندسية" : "Engineering Consultancy"}
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "اسم الشركة (إنجليزي)" : "Company Name (English)"}
                  </Label>
                  <Input
                    value={(formData.nameEn as string) || settings?.nameEn || ""}
                    onChange={(e) => updateField("nameEn", e.target.value)}
                    dir="ltr"
                    placeholder="Engineering Consultancy Office"
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "البريد الإلكتروني" : "Email"}
                  </Label>
                  <Input
                    type="email"
                    value={(formData.email as string) || settings?.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    dir="ltr"
                    placeholder="info@blueprint.ae"
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "رقم الهاتف" : "Phone"}
                  </Label>
                  <Input
                    value={(formData.phone as string) || settings?.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    dir="ltr"
                    placeholder="+971..."
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {isAr ? "العنوان" : "Address"}
                </Label>
                <Input
                  value={(formData.address as string) || settings?.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder={isAr ? "العنوان الكامل" : "Full address"}
                  className="h-10 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "الرقم الضريبي" : "Tax Number"}
                  </Label>
                  <Input
                    value={(formData.taxNumber as string) || settings?.taxNumber || ""}
                    onChange={(e) => updateField("taxNumber", e.target.value)}
                    placeholder={isAr ? "الرقم الضريبي" : "Tax Registration Number"}
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "العملة" : "Currency"}
                  </Label>
                  <Input
                    value={(formData.currency as string) || settings?.currency || "AED"}
                    onChange={(e) => updateField("currency", e.target.value)}
                    dir="ltr"
                    disabled
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "المنطقة الزمنية" : "Timezone"}
                  </Label>
                  <div className="relative">
                    <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={(formData.timezone as string) || settings?.timezone || "Asia/Dubai"}
                      onChange={(e) => updateField("timezone", e.target.value)}
                      className="ps-9 h-10 rounded-lg"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "ساعات العمل" : "Working Hours"}
                  </Label>
                  <div className="relative">
                    <Clock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={(formData.workingHours as string) || settings?.workingHours || "08:00-17:00"}
                      onChange={(e) => updateField("workingHours", e.target.value)}
                      className="ps-9 h-10 rounded-lg"
                      dir="ltr"
                      placeholder="08:00-17:00"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Logo Upload Area */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {isAr ? "شعار الشركة" : "Company Logo"}
                </Label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-teal-400 hover:bg-teal-50/30 dark:hover:bg-teal-950/10 transition-all cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                    <Upload className="h-7 w-7 text-slate-400 group-hover:text-teal-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {isAr ? "اسحب الشعار هنا أو انقر للرفع" : "Drag logo here or click to upload"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      PNG, JPG, SVG — {isAr ? "الحد الأقصى 2MB" : "Max 2MB"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Working Days */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {isAr ? "أيام العمل" : "Working Days"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {WORKING_DAYS.map((day) => {
                    const isSelected = workingDays.includes(day.key);
                    return (
                      <Button
                        key={day.key}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleWorkingDay(day.key)}
                        className={cn(
                          "h-9 rounded-lg transition-all",
                          isSelected
                            ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-500/20"
                            : "text-slate-600 dark:text-slate-400 hover:border-teal-300"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 me-1.5" />}
                        {isAr ? day.ar : day.en}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-teal-600 hover:bg-teal-700 text-white min-w-32 h-10 rounded-lg shadow-sm shadow-teal-500/20"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isAr ? "جاري الحفظ..." : "Saving..."}
                    </span>
                  ) : saved ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      {isAr ? "تم الحفظ!" : "Saved!"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {isAr ? "حفظ التغييرات" : "Save Changes"}
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={Palette}
                title={isAr ? "المظهر والتخصيص" : "Appearance & Customization"}
                subtitle={isAr ? "تخصيص سمة اللون واللغة واتجاه النص" : "Customize color theme, language, and text direction"}
              />

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-900 dark:text-white">
                  {isAr ? "السمة" : "Theme"}
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "light", icon: Sun, label: isAr ? "فاتح" : "Light", color: "bg-white border-slate-200 dark:border-slate-600" },
                    { key: "dark", icon: Moon, label: isAr ? "داكن" : "Dark", color: "bg-slate-900 border-slate-700" },
                  ].map((themeOption) => {
                    const isActive = theme === themeOption.key;
                    return (
                      <button
                        key={themeOption.key}
                        onClick={() => setTheme(themeOption.key)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-sm cursor-pointer",
                          isActive
                            ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-sm shadow-teal-500/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-teal-300"
                        )}
                      >
                        <div className={cn("w-14 h-10 rounded-lg border flex items-center justify-center", themeOption.color)}>
                          <themeOption.icon className={cn("h-5 w-5", isActive ? "text-teal-500" : "text-slate-600 dark:text-slate-300")} />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{themeOption.label}</span>
                        {isActive && (
                          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 text-[10px] h-5 px-1.5 border-0">
                            {isAr ? "نشط" : "Active"}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Accent Color Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-900 dark:text-white">
                  {isAr ? "لون التمييز" : "Accent Color"}
                </Label>
                <div className="flex items-center gap-3">
                  {accentColors.map((c) => (
                    <button
                      key={c.value}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all hover:scale-110",
                        c.color,
                        c.value === "teal" && "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-teal-500 shadow-lg shadow-teal-500/30"
                      )}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-900 dark:text-white">
                  {isAr ? "اللغة" : "Language"}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "ar", label: "العربية", sublabel: "Arabic (RTL)", active: isAr },
                    { key: "en", label: "English", sublabel: "English (LTR)", active: !isAr },
                  ].map((langOption) => (
                    <button
                      key={langOption.key}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-sm",
                        langOption.active
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-teal-300"
                      )}
                    >
                      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold">
                        {langOption.key === "ar" ? "ع" : "En"}
                      </div>
                      <div className="text-start">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{langOption.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{langOption.sublabel}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-900 dark:text-white">
                  {isAr ? "اتجاه النص" : "Text Direction"}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "rtl", label: isAr ? "من اليمين لليسار" : "Right to Left", icon: "←", active: isAr },
                    { key: "ltr", label: isAr ? "من اليسار لليمين" : "Left to Right", icon: "→", active: !isAr },
                  ].map((dir) => (
                    <button
                      key={dir.key}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-sm",
                        dir.active
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-teal-300"
                      )}
                    >
                      <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">{dir.icon}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{dir.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={Bell}
                title={isAr ? "تفضيلات الإشعارات" : "Notification Preferences"}
                subtitle={isAr ? "اختر الإشعارات التي تريد استلامها" : "Choose which notifications you want to receive"}
              />

              <div className="space-y-3">
                {[
                  {
                    key: "projectUpdates" as const,
                    title: isAr ? "تحديثات المشاريع" : "Project Updates",
                    desc: isAr
                      ? "إشعارات عند تغيير حالة المشروع أو التقدم"
                      : "Notifications when project status or progress changes",
                    icon: Building2,
                    color: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
                  },
                  {
                    key: "taskDeadlines" as const,
                    title: isAr ? "مواعيد المهام النهائية" : "Task Deadlines",
                    desc: isAr
                      ? "تذكيرات قبل تواريخ استحقاق المهام"
                      : "Reminders before task due dates",
                    icon: Clock,
                    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
                  },
                  {
                    key: "invoiceReminders" as const,
                    title: isAr ? "تذكيرات الفواتير" : "Invoice Reminders",
                    desc: isAr
                      ? "تنبيهات عند اقتراب مواعيد استحقاق الفواتير"
                      : "Alerts when invoice due dates approach",
                    icon: CreditCard,
                    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                  },
                  {
                    key: "meetingReminders" as const,
                    title: isAr ? "تذكيرات الاجتماعات" : "Meeting Reminders",
                    desc: isAr
                      ? "تذكيرات قبل الاجتماعات المجدولة"
                      : "Reminders before scheduled meetings",
                    icon: MapPin,
                    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
                  },
                  {
                    key: "siteVisitAlerts" as const,
                    title: isAr ? "تنبيهات زيارات الموقع" : "Site Visit Alerts",
                    desc: isAr
                      ? "إشعارات عند جدولة زيارات موقع جديدة"
                      : "Notifications when new site visits are scheduled",
                    icon: Smartphone,
                    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.color)}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifSettings[item.key]}
                      onCheckedChange={(checked) =>
                        setNotifSettings((prev) => ({ ...prev, [item.key]: checked }))
                      }
                      className="data-[state=checked]:bg-teal-600"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={Key}
                title={isAr ? "تغيير كلمة المرور" : "Change Password"}
                subtitle={isAr ? "تأكد من استخدام كلمة مرور قوية" : "Make sure to use a strong password"}
              />
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "كلمة المرور الحالية" : "Current Password"}
                  </Label>
                  <div className="relative">
                    <Key className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="password" placeholder="••••••••" className="ps-9 h-10 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "كلمة المرور الجديدة" : "New Password"}
                  </Label>
                  <div className="relative">
                    <Shield className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="password" placeholder="••••••••" className="ps-9 h-10 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                  </Label>
                  <div className="relative">
                    <Check className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="password" placeholder="••••••••" className="ps-9 h-10 rounded-lg" />
                  </div>
                </div>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white h-10 rounded-lg shadow-sm shadow-teal-500/20">
                  {isAr ? "تحديث كلمة المرور" : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={Smartphone}
                title={isAr ? "الجلسات النشطة" : "Active Sessions"}
                subtitle={isAr ? "إدارة الأجهزة المسجلة الدخول" : "Manage logged-in devices"}
              />
              <div className="space-y-3">
                {[
                  {
                    device: isAr ? "Chrome على macOS" : "Chrome on macOS",
                    location: isAr ? "دبي، الإمارات" : "Dubai, UAE",
                    time: isAr ? "نشط الآن" : "Active now",
                    current: true,
                  },
                  {
                    device: isAr ? "Safari على iPhone" : "Safari on iPhone",
                    location: isAr ? "دبي، الإمارات" : "Dubai, UAE",
                    time: isAr ? "منذ ساعتين" : "2 hours ago",
                    current: false,
                  },
                ].map((session, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          {session.device}
                          {session.current && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[10px] h-5 px-1.5 border-0">
                              {isAr ? "الحالي" : "Current"}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {session.location} · {session.time}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button variant="outline" size="sm" className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 rounded-lg border-red-200 dark:border-red-800">
                        <LogOut className="h-3.5 w-3.5 me-1.5" />
                        {isAr ? "إنهاء" : "Revoke"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900/50">
            <CardContent className="p-6">
              <div className="space-y-1 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-red-700 dark:text-red-400">
                      {isAr ? "منطقة الخطر" : "Danger Zone"}
                    </h3>
                    <p className="text-xs text-red-500 dark:text-red-400/70">
                      {isAr ? "إجراءات لا يمكن التراجع عنها" : "Irreversible and destructive actions"}
                    </p>
                  </div>
                </div>
                <div className="h-0.5 w-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mt-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {isAr ? "حذف الحساب" : "Delete Account"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr ? "حذف الحساب وجميع البيانات نهائياً" : "Permanently delete account and all data"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs text-red-600 hover:text-white hover:bg-red-600 h-8 rounded-lg border-red-200 dark:border-red-800">
                    <Trash2 className="h-3.5 w-3.5 me-1.5" />
                    {isAr ? "حذف" : "Delete"}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {isAr ? "مسح جميع البيانات" : "Clear All Data"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr ? "حذف جميع المشاريع والمهام والسجلات" : "Remove all projects, tasks, and records"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs text-red-600 hover:text-white hover:bg-red-600 h-8 rounded-lg border-red-200 dark:border-red-800">
                    <Trash2 className="h-3.5 w-3.5 me-1.5" />
                    {isAr ? "مسح الكل" : "Clear All"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={CreditCard}
                title={isAr ? "الاشتراك والفوترة" : "Billing & Subscription"}
                subtitle={isAr ? "إدارة خطتك والاشتراك" : "Manage your plan and subscription"}
              />

              <div className="rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 p-5 text-white shadow-lg shadow-teal-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm opacity-80">
                    {isAr ? "الخطة الحالية" : "Current Plan"}
                  </span>
                  <Badge className="bg-white/20 text-white border-0">
                    {isAr ? "احترافي" : "Professional"}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-1">
                  {isAr ? "خطة احترافية" : "Professional Plan"}
                </h3>
                <p className="text-sm opacity-80 mb-4">
                  {isAr
                    ? "يدعم حتى 50 مستخدم ومشاريع غير محدودة"
                    : "Up to 50 users and unlimited projects"}
                </p>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" className="bg-white/20 text-white border-0 hover:bg-white/30 rounded-lg">
                    {isAr ? "ترقية الخطة" : "Upgrade Plan"}
                  </Button>
                  <Button variant="secondary" size="sm" className="bg-white/20 text-white border-0 hover:bg-white/30 rounded-lg">
                    {isAr ? "إدارة الفوترة" : "Manage Billing"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {[
                  { label: isAr ? "المستخدمون" : "Users", value: "8/50", icon: User, color: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" },
                  { label: isAr ? "المشاريع" : "Projects", value: "5", icon: Building2, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
                  { label: isAr ? "التخزين" : "Storage", value: "2.4 GB", icon: CreditCard, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
                  { label: isAr ? "API" : "API Calls", value: "1,240", icon: Plug, color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
                  >
                    <div className={cn("w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center", stat.color)}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={Plug}
                title={isAr ? "التكاملات والربط" : "Integrations"}
                subtitle={isAr ? "ربط مع تطبيقات وخدمات خارجية" : "Connect with external apps and services"}
              />
              <div className="space-y-3">
                {[
                  {
                    name: "Slack",
                    desc: isAr ? "إرسال الإشعارات إلى قنوات Slack" : "Send notifications to Slack channels",
                    color: "bg-purple-50 dark:bg-purple-950 text-purple-600",
                    icon: "💬",
                    soon: true,
                  },
                  {
                    name: "Google Drive",
                    desc: isAr ? "ربط المستندات مع Google Drive" : "Link documents with Google Drive",
                    color: "bg-blue-50 dark:bg-blue-950 text-blue-600",
                    icon: "📁",
                    soon: true,
                  },
                  {
                    name: "Dropbox",
                    desc: isAr ? "مزامنة الملفات مع Dropbox" : "Sync files with Dropbox",
                    color: "bg-sky-50 dark:bg-sky-950 text-sky-600",
                    icon: "📦",
                    soon: true,
                  },
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl", integration.color)}>
                        {integration.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          {integration.name}
                          {integration.soon && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px] h-5 px-1.5 border-0">
                              {isAr ? "قريباً" : "Coming Soon"}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{integration.desc}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled className="h-8 rounded-lg">
                      {isAr ? "قريباً" : "Coming Soon"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
