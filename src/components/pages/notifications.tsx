"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToastFeedback } from "@/hooks/use-toast-feedback";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  CalendarDays,
  MapPin,
  CheckCheck,
  Loader2,
  Inbox,
  Building2,
  CheckSquare,
  Wallet,
  X,
  Eye,
  BellOff,
  Trash2,
  ListChecks,
  FolderKanban,
  LayoutList,
  MonitorCheck,
  Filter,
  Layers,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Props {
  language: "ar" | "en";
  projectId?: string;
}

interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType: string;
  relatedEntityId: string;
  createdAt: string;
}

// Hash-based avatar color palette
const avatarColors = [
  "bg-teal-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-blue-500",
];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getAvatarInitial(str: string) {
  return str.charAt(0).toUpperCase();
}

// Type configuration with distinct icons and colors
const typeConfig: Record<string, {
  icon: typeof Bell;
  color: string;
  bg: string;
  border: string;
  dot: string;
  ar: string;
  en: string;
  important: boolean;
  category: string;
}> = {
  project_update: {
    icon: Building2,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-900/30",
    border: "border-s-teal-500",
    dot: "bg-teal-500",
    ar: "تحديث مشروع",
    en: "Project Update",
    important: false,
    category: "projects",
  },
  task_due: {
    icon: CheckSquare,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-s-blue-500",
    dot: "bg-blue-500",
    ar: "مهمة مستحقة",
    en: "Task Due",
    important: true,
    category: "tasks",
  },
  invoice_overdue: {
    icon: Wallet,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-s-amber-500",
    dot: "bg-amber-500",
    ar: "فاتورة متأخرة",
    en: "Invoice Overdue",
    important: true,
    category: "financial",
  },
  approval_needed: {
    icon: Bell,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    border: "border-s-violet-500",
    dot: "bg-violet-500",
    ar: "موافقة مطلوبة",
    en: "Approval Needed",
    important: false,
    category: "tasks",
  },
  meeting_reminder: {
    icon: CalendarDays,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    border: "border-s-violet-500",
    dot: "bg-violet-500",
    ar: "تذكير اجتماع",
    en: "Meeting Reminder",
    important: false,
    category: "projects",
  },
  site_visit: {
    icon: MapPin,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-900/30",
    border: "border-s-teal-500",
    dot: "bg-teal-500",
    ar: "زيارة موقع",
    en: "Site Visit",
    important: false,
    category: "projects",
  },
};

// Category sidebar config
const categoryConfig: Record<string, {
  icon: typeof Bell;
  ar: string;
  en: string;
  color: string;
  types: string[];
}> = {
  all: { icon: Layers, ar: "الكل", en: "All", color: "text-slate-600 dark:text-slate-300", types: [] },
  tasks: { icon: CheckSquare, ar: "المهام", en: "Tasks", color: "text-blue-600 dark:text-blue-400", types: ["task_due", "approval_needed"] },
  projects: { icon: FolderKanban, ar: "المشاريع", en: "Projects", color: "text-teal-600 dark:text-teal-400", types: ["project_update", "meeting_reminder", "site_visit"] },
  financial: { icon: Wallet, ar: "المالية", en: "Financial", color: "text-amber-600 dark:text-amber-400", types: ["invoice_overdue"] },
  system: { icon: MonitorCheck, ar: "النظام", en: "System", color: "text-violet-600 dark:text-violet-400", types: [] },
};

export default function NotificationsPage({ language: lang, projectId }: Props) {
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const toastFeedback = useToastFeedback({ ar: isAr });
  const [filter, setFilter] = useState<"all" | "unread" | "important">("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("notification-sound") !== "false";
    }
    return true;
  });
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);

  const { data, isLoading } = useQuery<{
    notifications: NotificationRecord[];
    unreadCount: number;
  }>({
    queryKey: ["notifications", projectId, filter],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("filter", filter === "important" ? "all" : filter);
      if (projectId) params.set("projectId", projectId);
      return fetch(`/api/notifications?${params.toString()}`).then((r) => r.json());
    },
  });

  const rawNotifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Apply client-side filter for "important" tab
  const filteredByImportance = filter === "important"
    ? rawNotifications.filter((n) => typeConfig[n.type]?.important)
    : rawNotifications;

  // Apply category filter
  const notifications = activeCategory === "all"
    ? filteredByImportance
    : filteredByImportance.filter((n) => {
        const cat = categoryConfig[activeCategory];
        return cat && cat.types.includes(n.type);
      });

  // Category counts
  const categoryCounts = useMemo(() => {
    const base = filter === "important" ? filteredByImportance : rawNotifications;
    const counts: Record<string, number> = { all: base.length };
    Object.entries(categoryConfig).forEach(([key, cfg]) => {
      if (key !== "all") {
        counts[key] = base.filter((n) => cfg.types.includes(n.type)).length;
      }
    });
    return counts;
  }, [rawNotifications, filter, filteredByImportance]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const importantUnreadCount = useMemo(() => {
    return rawNotifications.filter((n) => typeConfig[n.type]?.important && !n.isRead).length;
  }, [rawNotifications]);

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toastFeedback.showSuccess(
        isAr ? "تم تعيين الكل كمقروء" : "All marked as read",
        isAr ? `تم تعيين ${unreadCount} إشعار كمقروء` : `${unreadCount} notifications marked as read`
      );
      setSelectedIds(new Set());
      setShowFloatingBar(false);
      setConfirmMarkAll(false);
    },
  });

  const bulkMarkReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toastFeedback.showSuccess(
        isAr ? "تم تعيين المحدد كمقروء" : "Selected marked as read",
        isAr ? `تم تعيين ${selectedIds.size} إشعار كمقروء` : `${selectedIds.size} notifications marked as read`
      );
      setSelectedIds(new Set());
      setShowFloatingBar(false);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toastFeedback.deleted(isAr ? "الإشعارات المحددة" : "Selected notifications");
      setSelectedIds(new Set());
      setShowFloatingBar(false);
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setShowFloatingBar(next.size > 0);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
      setShowFloatingBar(false);
    } else {
      const allIds = notifications.map((n) => n.id);
      setSelectedIds(new Set(allIds));
      setShowFloatingBar(true);
    }
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem("notification-sound", String(newVal));
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return isAr ? "الآن" : "Just now";
    if (diffMin < 60) {
      if (isAr) {
        return diffMin === 1 ? "منذ دقيقة" : `منذ ${diffMin} دقائق`;
      }
      return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;
    }
    if (diffHours < 24) {
      if (isAr) {
        return diffHours === 1 ? "منذ ساعة" : `منذ ${diffHours} ساعة`;
      }
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }
    if (diffDays === 1) return isAr ? "أمس" : "yesterday";
    if (diffDays < 7) {
      if (isAr) {
        return diffDays === 2 ? "منذ يومين" : `منذ ${diffDays} أيام`;
      }
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString(isAr ? "ar-AE" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const filterTabs = [
    { key: "all" as const, ar: "الكل", en: "All", icon: Bell },
    { key: "unread" as const, ar: "غير مقروء", en: "Unread", icon: Eye },
    { key: "important" as const, ar: "مهم", en: "Important", icon: AlertTriangle },
  ];

  const isAllSelected = notifications.length > 0 && selectedIds.size === notifications.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < notifications.length;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <Bell className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isAr ? "الإشعارات" : "Notifications"}
            </h2>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount} {isAr ? "إشعار غير مقروء" : "unread notification"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title={soundEnabled ? (isAr ? "كتم الصوت" : "Mute") : (isAr ? "تشغيل الصوت" : "Unmute")}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </button>

          {/* Mark All Read - Teal Gradient Button */}
        {unreadCount > 0 && (
          <Button
            size="sm"
            onClick={() => {
              if (confirmMarkAll) {
                markAllReadMutation.mutate();
              } else {
                setConfirmMarkAll(true);
                setTimeout(() => setConfirmMarkAll(false), 3000);
              }
            }}
            disabled={markAllReadMutation.isPending}
            className={cn(
              "gap-1.5 text-xs h-9 px-4 text-white border-0 shadow-md transition-all",
              confirmMarkAll
                ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/20"
                : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-teal-500/20"
            )}
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            {confirmMarkAll
              ? isAr ? "تأكيد؟" : "Confirm?"
              : isAr
                ? `تعيين الكل كمقروء (${unreadCount})`
                : `Mark All Read (${unreadCount})`}
          </Button>
        )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-teal-600 dark:text-teal-400" : ""}`} />
              {isAr ? tab.ar : tab.en}
              {tab.key === "all" && unreadCount > 0 && (
                <span className={`h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  isActive
                    ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}>
                  {unreadCount}
                </span>
              )}
              {tab.key === "unread" && unreadCount > 0 && (
                <span className={`h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  isActive
                    ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                    : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                }`}>
                  {unreadCount}
                </span>
              )}
              {tab.key === "important" && importantUnreadCount > 0 && (
                <span className={`h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  isActive
                    ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                    : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                }`}>
                  {importantUnreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Sidebar + List */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Category Sidebar - Desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <Card className="p-3 rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 sticky top-4">
            <div className="flex items-center gap-2 mb-3 px-2">
              <LayoutList className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {isAr ? "الفئات" : "Categories"}
              </span>
            </div>
            <div className="space-y-1">
              {Object.entries(categoryConfig).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const isActive = activeCategory === key;
                const count = categoryCounts[key] || 0;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/30 text-teal-700 dark:text-teal-300 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? cfg.color : "text-slate-400 dark:text-slate-500")} />
                    <span className="flex-1 text-start">{isAr ? cfg.ar : cfg.en}</span>
                    <span className={cn(
                      "h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center",
                      isActive
                        ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </aside>

        {/* Category Chips - Mobile */}
        <div className="lg:hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {Object.entries(categoryConfig).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = activeCategory === key;
              const count = categoryCounts[key] || 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 shrink-0",
                    isActive
                      ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {isAr ? cfg.ar : cfg.en}
                  <span className={cn(
                    "h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            /* Enhanced Empty State */
            <Card className="p-12 text-center border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-4">
                <BellOff className="h-10 w-10 text-slate-300 dark:text-slate-600 animate-bounce-slow" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {isAr ? "ممتاز! كل شيء جاهز" : "All caught up!"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                {filter === "unread"
                  ? isAr
                    ? "جميع الإشعارات تمت قراءتها. الإشعارات الجديدة ستظهر هنا."
                    : "All notifications have been read. New ones will appear here."
                  : filter === "important"
                    ? isAr
                      ? "لا توجد إشعارات مهمة حالياً. أنت على اطلاع بكل شيء!"
                      : "No important notifications right now. You're all caught up!"
                    : isAr
                      ? "لا توجد إشعارات حالياً. الإشعارات الجديدة ستظهر هنا."
                      : "No notifications right now. New ones will appear here."}
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5" />
                  {isAr ? "المشاريع" : "Projects"}
                </span>
                <span className="text-slate-200 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1">
                  <CheckSquare className="h-3.5 w-3.5" />
                  {isAr ? "المهام" : "Tasks"}
                </span>
                <span className="text-slate-200 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  {isAr ? "المالية" : "Financial"}
                </span>
              </div>
            </Card>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-14rem)]">
              <div className="space-y-2">
                {/* Select All Header */}
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) {
                        (el as unknown as HTMLInputElement & { indeterminate: boolean }).indeterminate = isSomeSelected;
                      }
                    }}
                    onCheckedChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isAllSelected
                      ? isAr ? "إلغاء تحديد الكل" : "Deselect All"
                      : isAr ? `تحديد الكل (${notifications.length})` : `Select All (${notifications.length})`}
                  </span>
                </div>

                {notifications.map((notif, index) => {
                  const config = typeConfig[notif.type] || {
                    icon: Bell,
                    color: "text-slate-500 dark:text-slate-400",
                    bg: "bg-slate-50 dark:bg-slate-800",
                    border: "border-s-slate-400",
                    dot: "bg-slate-400",
                    ar: notif.type,
                    en: notif.type,
                    important: false,
                    category: "system",
                  };
                  const Icon = config.icon;
                  const senderName = notif.message.split(" ").slice(0, 2).join(" ") || notif.title;
                  const avatarColor = getAvatarColor(notif.id);
                  const avatarInitial = getAvatarInitial(senderName);
                  const isSelected = selectedIds.has(notif.id);

                  return (
                    <div
                      key={notif.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                    >
                      <div
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl transition-all duration-150",
                          config.important
                            ? "border-s-[4px] border-s-red-500"
                            : "border-s-[2px] border-s-teal-400 dark:border-s-teal-600",
                          isSelected
                            ? "bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/50 ring-1 ring-teal-200 dark:ring-teal-800/50"
                            : notif.isRead
                              ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              : "bg-teal-50/30 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/30 hover:bg-teal-50/50 dark:hover:bg-teal-950/20"
                        )}
                      >
                        {/* Checkbox */}
                        <div className="flex items-center pt-0.5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(notif.id)}
                            className="h-4 w-4"
                          />
                        </div>

                        {/* Sender Avatar */}
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                          avatarColor,
                          !notif.isRead && "ring-2 ring-teal-200 dark:ring-teal-800 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
                        )}>
                          {avatarInitial}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium leading-snug",
                            notif.isRead
                              ? "text-slate-600 dark:text-slate-400"
                              : "text-slate-900 dark:text-white"
                          )}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                              config.bg,
                              config.color
                            )}>
                              <Icon className="h-2.5 w-2.5" />
                              {isAr ? config.ar : config.en}
                            </span>
                            {config.important && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </div>

                        {/* Right side: unread dot + action buttons */}
                        <div className="flex items-center gap-1 shrink-0 self-center">
                          {!notif.isRead && (
                            <span className="relative flex h-2.5 w-2.5 ms-1">
                              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.dot)} />
                              <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", config.dot)} />
                            </span>
                          )}
                          {!notif.isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notif.id); }}
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                              title={isAr ? "تعيين كمقروء" : "Mark as read"}
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-500 dark:group-hover:text-teal-400" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); dismissMutation.mutate(notif.id); }}
                            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                            title={isAr ? "إزالة" : "Dismiss"}
                          >
                            <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-red-500 dark:group-hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {showFloatingBar && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <Card className="flex items-center gap-3 px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/30 border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                <ListChecks className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                {selectedIds.size}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? "محدد" : "selected"}
              </span>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => bulkMarkReadMutation.mutate(Array.from(selectedIds))}
              disabled={bulkMarkReadMutation.isPending}
              className="gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-300"
            >
              {bulkMarkReadMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {isAr ? "تعيين كمقروء" : "Mark Read"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              disabled={bulkDeleteMutation.isPending}
              className="gap-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {isAr ? "حذف المحدد" : "Delete Selected"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedIds(new Set()); setShowFloatingBar(false); }}
              className="gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
