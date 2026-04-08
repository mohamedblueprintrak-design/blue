"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavStore } from "@/store/nav-store";
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
  Layers,
  ArrowRight,
} from "lucide-react";

// ===== Language Hook =====
function getLangSnapshot(): "ar" | "en" {
  if (typeof window === "undefined") return "ar";
  return (localStorage.getItem("blueprint-lang") as "ar" | "en") || "ar";
}
function getLangServerSnapshot(): "ar" | "en" { return "ar"; }
function subscribeLang(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("blueprint-lang-change", cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener("blueprint-lang-change", cb); };
}
function useLang() { return useSyncExternalStore(subscribeLang, getLangSnapshot, getLangServerSnapshot); }

// ===== Types =====
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

// ===== Type Configuration =====
const typeConfig: Record<string, {
  icon: typeof Bell;
  color: string;
  bg: string;
  dot: string;
  ar: string;
  en: string;
  tab: string;
}> = {
  project_update: {
    icon: Building2, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/30",
    dot: "bg-teal-500", ar: "تحديث مشروع", en: "Project Update", tab: "all",
  },
  task_due: {
    icon: CheckSquare, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30",
    dot: "bg-blue-500", ar: "مهمة مستحقة", en: "Task Due", tab: "tasks",
  },
  task_assigned: {
    icon: CheckSquare, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30",
    dot: "bg-blue-500", ar: "تعيين مهمة", en: "Task Assigned", tab: "tasks",
  },
  task_completed: {
    icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30",
    dot: "bg-emerald-500", ar: "إتمام مهمة", en: "Task Completed", tab: "tasks",
  },
  invoice_overdue: {
    icon: Wallet, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30",
    dot: "bg-amber-500", ar: "فاتورة متأخرة", en: "Invoice Overdue", tab: "all",
  },
  approval_needed: {
    icon: Bell, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/30",
    dot: "bg-violet-500", ar: "موافقة مطلوبة", en: "Approval Needed", tab: "approvals",
  },
  approval_status: {
    icon: CheckCircle, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/30",
    dot: "bg-violet-500", ar: "حالة موافقة", en: "Approval Status", tab: "approvals",
  },
  meeting_reminder: {
    icon: CalendarDays, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/30",
    dot: "bg-violet-500", ar: "تذكير اجتماع", en: "Meeting Reminder", tab: "all",
  },
  site_visit: {
    icon: MapPin, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/30",
    dot: "bg-teal-500", ar: "زيارة موقع", en: "Site Visit", tab: "all",
  },
  system: {
    icon: MonitorCheck, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/30",
    dot: "bg-slate-400", ar: "نظام", en: "System", tab: "system",
  },
};

const tabConfig: Record<string, { types: string[]; ar: string; en: string; icon: typeof Bell }> = {
  all: { types: [], ar: "الكل", en: "All", icon: Layers },
  unread: { types: [], ar: "غير مقروء", en: "Unread", icon: Eye },
  tasks: { types: ["task_due", "task_assigned", "task_completed"], ar: "المهام", en: "Tasks", icon: CheckSquare },
  approvals: { types: ["approval_needed", "approval_status"], ar: "الموافقات", en: "Approvals", icon: Bell },
  system: { types: ["system"], ar: "النظام", en: "System", icon: MonitorCheck },
};

// ===== Main Component =====
interface Props {
  language?: "ar" | "en";
  projectId?: string;
}

export default function NotificationsPage({ projectId }: Props) {
  const lang = useLang();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const setCurrentPage = useNavStore((s) => s.setCurrentPage);
  const setCurrentProjectId = useNavStore((s) => s.setCurrentProjectId);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);

  // Fetch notifications
  const { data, isLoading } = useQuery<{
    notifications: NotificationRecord[];
    unreadCount: number;
  }>({
    queryKey: ["notifications", projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const rawNotifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Fetch unread count separately for header badge
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/count");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const liveUnreadCount = countData?.count ?? unreadCount;

  // Apply tab filtering
  const notifications = useMemo(() => {
    const tab = tabConfig[activeTab];
    if (!tab) return rawNotifications;

    if (activeTab === "unread") {
      return rawNotifications.filter((n) => !n.isRead);
    }
    if (activeTab === "all") {
      return rawNotifications;
    }
    return rawNotifications.filter((n) => tab.types.includes(n.type));
  }, [rawNotifications, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rawNotifications.length, unread: rawNotifications.filter((n) => !n.isRead).length };
    Object.entries(tabConfig).forEach(([key, cfg]) => {
      if (key !== "all" && key !== "unread") {
        counts[key] = rawNotifications.filter((n) => cfg.types.includes(n.type)).length;
      }
    });
    return counts;
  }, [rawNotifications]);

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
      setConfirmMarkAll(false);
    },
  });

  // Delete single notification
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  // Navigate to related entity
  const handleNotificationClick = (notif: NotificationRecord) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.relatedEntityType && notif.relatedEntityId) {
      const navMap: Record<string, { page: string; id?: string }> = {
        project: { page: "project-detail", id: notif.relatedEntityId },
        task: { page: "tasks" },
        invoice: { page: "invoices" },
        approval: { page: "approvals" },
        meeting: { page: "meetings" },
        document: { page: "documents" },
        rfi: { page: "rfi" },
        submittal: { page: "submittals" },
      };
      const nav = navMap[notif.relatedEntityType];
      if (nav) {
        setCurrentPage(nav.page);
        if (nav.id) {
          setCurrentProjectId(nav.id);
        }
      }
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return isAr ? "الآن" : "Just now";
    if (diffMin < 60) {
      return isAr
        ? (diffMin === 1 ? "منذ دقيقة" : `منذ ${diffMin} دقائق`)
        : (diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`);
    }
    if (diffHours < 24) {
      return isAr
        ? (diffHours === 1 ? "منذ ساعة" : `منذ ${diffHours} ساعة`)
        : (diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`);
    }
    if (diffDays === 1) return isAr ? "أمس" : "yesterday";
    if (diffDays < 7) {
      return isAr
        ? (diffDays === 2 ? "منذ يومين" : `منذ ${diffDays} أيام`)
        : `${diffDays} days ago`;
    }
    return date.toLocaleDateString(isAr ? "ar-AE" : "en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-9 flex-1 rounded-lg" />)}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl border animate-pulse">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            {liveUnreadCount > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {liveUnreadCount} {isAr ? "إشعار غير مقروء" : "unread notification"}
                {liveUnreadCount > 1 ? (isAr ? "" : "s") : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveUnreadCount > 0 && (
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
                  ? `تعيين الكل كمقروء (${liveUnreadCount})`
                  : `Mark All Read (${liveUnreadCount})`}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5 overflow-x-auto">
        {Object.entries(tabConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isActive = activeTab === key;
          const count = tabCounts[key] || 0;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                isActive
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-teal-600 dark:text-teal-400" : "")} />
              {isAr ? cfg.ar : cfg.en}
              {count > 0 && (
                <span className={cn(
                  "h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                  isActive
                    ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                    : key === "unread"
                      ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="p-12 text-center border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-4">
            <BellOff className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {isAr ? "ممتاز! كل شيء جاهز" : "All caught up!"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === "unread"
              ? isAr ? "جميع الإشعارات تمت قراءتها." : "All notifications have been read."
              : isAr ? "لا توجد إشعارات حالياً." : "No notifications right now."}
          </p>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-14rem)]">
          <div className="space-y-2">
            {notifications.map((notif, index) => {
              const config = typeConfig[notif.type] || {
                icon: Bell, color: "text-slate-500 dark:text-slate-400",
                bg: "bg-slate-50 dark:bg-slate-800", dot: "bg-slate-400",
                ar: notif.type, en: notif.type, tab: "system",
              };
              const Icon = config.icon;

              return (
                <div
                  key={notif.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
                >
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl transition-all duration-150 cursor-pointer",
                      notif.isRead
                        ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        : "bg-teal-50/30 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/30 hover:bg-teal-50/50 dark:hover:bg-teal-950/20"
                    )}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {/* Type Icon */}
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      config.bg
                    )}>
                      <Icon className={cn("h-4 w-4", config.color)} />
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
                        {!notif.isRead && (
                          <span className="relative flex h-2 w-2">
                            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.dot)} />
                            <span className={cn("relative inline-flex rounded-full h-2 w-2", config.dot)} />
                          </span>
                        )}
                        {notif.relatedEntityType && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700">
                            {notif.relatedEntityType}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notif.id); }}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={isAr ? "تعيين كمقروء" : "Mark as read"}
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400 hover:text-teal-500 dark:hover:text-teal-400" />
                        </button>
                      )}
                      {notif.relatedEntityType && notif.relatedEntityId && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNotificationClick(notif); }}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={isAr ? "فتح" : "Open"}
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id); }}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isAr ? "إزالة" : "Dismiss"}
                      >
                        <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400" />
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
  );
}
