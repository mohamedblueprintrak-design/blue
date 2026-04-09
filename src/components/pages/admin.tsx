"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Activity,
  Zap,
  Plus,
  Search,
  Edit,
  Trash2,
  ShieldCheck,
  MoreHorizontal,
  Filter,
  Database,
  HardDrive,
  Server,
  Clock,
  ArrowUpRight,
  DatabaseBackup,
  RefreshCw,
  UserPlus,
  CircleDot,
  Download,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  language: "ar" | "en";
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  department: string;
  position: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface ActivityRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string; role: string };
}

const roleLabels: Record<string, { ar: string; en: string }> = {
  admin: { ar: "مدير النظام", en: "System Admin" },
  manager: { ar: "المدير", en: "Manager" },
  project_manager: { ar: "مدير مشاريع", en: "Project Manager" },
  engineer: { ar: "مهندس", en: "Engineer" },
  draftsman: { ar: "مساح", en: "Draftsman" },
  accountant: { ar: "محاسب", en: "Accountant" },
  hr: { ar: "موارد بشرية", en: "HR" },
  secretary: { ar: "سكرتارية", en: "Secretary" },
  viewer: { ar: "مشاهد", en: "Viewer" },
};

const roleColors: Record<string, string> = {
  admin: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  manager: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  project_manager: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  engineer: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  draftsman: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  accountant: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  hr: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  secretary: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  viewer: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const actionLabels: Record<string, { ar: string; en: string }> = {
  create: { ar: "إنشاء", en: "Create" },
  update: { ar: "تحديث", en: "Update" },
  delete: { ar: "حذف", en: "Delete" },
  approve: { ar: "موافقة", en: "Approve" },
  reject: { ar: "رفض", en: "Reject" },
  login: { ar: "تسجيل دخول", en: "Login" },
};

const entityLabels: Record<string, { ar: string; en: string }> = {
  project: { ar: "مشروع", en: "Project" },
  task: { ar: "مهمة", en: "Task" },
  invoice: { ar: "فاتورة", en: "Invoice" },
  contract: { ar: "عقد", en: "Contract" },
  client: { ar: "عميل", en: "Client" },
  employee: { ar: "موظف", en: "Employee" },
  payment: { ar: "دفعة", en: "Payment" },
  site_visit: { ar: "زيارة موقع", en: "Site Visit" },
  leave: { ar: "إجازة", en: "Leave" },
  document: { ar: "مستند", en: "Document" },
};

const avatarColors = [
  "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300",
  "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
  "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300",
  "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300",
  "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
  "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ===== Backup & Restore Tab Component =====
interface BackupRestoreTabProps {
  isAr: boolean;
  queryClient: ReturnType<typeof useQueryClient>;
  restoreDialogOpen: boolean;
  setRestoreDialogOpen: (open: boolean) => void;
  restoreTarget: string | null;
  setRestoreTarget: (target: string | null) => void;
}

interface BackupRecord {
  id: string;
  filename: string;
  timestamp: string;
  size: number;
  status: string;
}

function BackupRestoreTab({ isAr, queryClient, restoreDialogOpen, setRestoreDialogOpen, restoreTarget, setRestoreTarget }: BackupRestoreTabProps) {
  const { toast } = useToast();

  const { data: backupData, isLoading: backupsLoading, refetch } = useQuery<{
    backups: BackupRecord[];
    stats: { totalBackups: number; totalSize: number; oldestBackup?: string; newestBackup?: string };
  }>({
    queryKey: ["admin-backups"],
    queryFn: () => fetch("/api/backup").then((r) => r.json().then((d) => d.data)),
  });

  const backups = backupData?.backups || [];
  const stats = backupData?.stats;

  const createBackupMutation = useMutation({
    mutationFn: () => fetch("/api/backup", { method: "POST" }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: isAr ? "تم بنجاح" : "Success",
          description: isAr ? "تم إنشاء النسخة الاحتياطية بنجاح" : "Backup created successfully",
        });
        refetch();
      } else {
        toast({
          title: isAr ? "خطأ" : "Error",
          description: data.error || (isAr ? "فشل في إنشاء النسخة الاحتياطية" : "Failed to create backup"),
          variant: "destructive",
        });
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (filename: string) =>
      fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setRestoreDialogOpen(false);
      setRestoreTarget(null);
      if (data.success) {
        toast({
          title: isAr ? "تم بنجاح" : "Success",
          description: isAr ? "تم استعادة النسخة الاحتياطية بنجاح. قد تحتاج لتحديث الصفحة." : "Backup restored successfully. You may need to refresh the page.",
        });
      } else {
        toast({
          title: isAr ? "خطأ" : "Error",
          description: data.error || (isAr ? "فشل في استعادة النسخة الاحتياطية" : "Failed to restore backup"),
          variant: "destructive",
        });
      }
    },
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <TabsContent value="backup" className="mt-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <DatabaseBackup className="h-5 w-5 text-teal-600" />
                {isAr ? "النسخ الاحتياطي والاستعادة" : "Backup & Restore"}
              </CardTitle>
              <Button
                onClick={() => createBackupMutation.mutate()}
                disabled={createBackupMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 rounded-lg shadow-sm shadow-teal-500/20"
              >
                {createBackupMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isAr ? "إنشاء نسخة احتياطية" : "Create Backup"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? "إجمالي النسخ" : "Total Backups"}</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{stats.totalBackups}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? "الحجم الإجمالي" : "Total Size"}</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{formatSize(stats.totalSize)}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? "أحدث نسخة" : "Newest"}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {stats.newestBackup ? formatDate(stats.newestBackup) : (isAr ? "—" : "—")}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? "أقدم نسخة" : "Oldest"}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {stats.oldestBackup ? formatDate(stats.oldestBackup) : (isAr ? "—" : "—")}
                  </p>
                </div>
              </div>
            )}

            {/* Backup List */}
            {backupsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DatabaseBackup className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? "لا توجد نسخ احتياطية" : "No backups yet"}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {isAr ? "أنشئ أول نسخة احتياطية لحماية بياناتك" : "Create your first backup to protect your data"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {backups.map((backup, idx) => (
                  <div
                    key={backup.id}
                    className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors",
                      "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30",
                      idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0">
                        <DatabaseBackup className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate" dir="ltr">
                          {backup.filename}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-500">{formatDate(backup.timestamp)}</span>
                          <span className="text-xs text-slate-400 font-mono">{formatSize(backup.size)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs rounded-lg border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
                      onClick={() => {
                        setRestoreTarget(backup.filename);
                        setRestoreDialogOpen(true);
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {isAr ? "استعادة" : "Restore"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="max-w-md" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {isAr ? "تأكيد الاستعادة" : "Confirm Restore"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                {isAr
                  ? "تحذير: سيتم استبدال قاعدة البيانات الحالية بالنسخة الاحتياطية المحددة. هذا الإجراء لا يمكن التراجع عنه."
                  : "Warning: The current database will be replaced with the selected backup. This action cannot be undone."}
              </p>
            </div>
            {restoreTarget && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">{isAr ? "الملف:" : "File:"}</span>{" "}
                <span className="font-mono" dir="ltr">{restoreTarget}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={() => restoreTarget && restoreMutation.mutate(restoreTarget)}
                disabled={restoreMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 rounded-lg"
              >
                {restoreMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 me-2" />
                )}
                {isAr ? "نعم، استعادة النسخة" : "Yes, Restore"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setRestoreDialogOpen(false); setRestoreTarget(null); }}
                className="flex-1 h-10 rounded-lg"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminPanel({ language: lang }: Props) {
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "viewer",
    department: "",
    position: "",
    phone: "",
  });
  const [userSearch, setUserSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<UserRecord[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  });

  // Fetch activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityRecord[]>({
    queryKey: ["activity-log", activityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activityFilter !== "all") params.set("actionType", activityFilter);
      return fetch(`/api/activity-log?${params}`).then((r) => r.json());
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: typeof newUser) =>
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setAddUserOpen(false);
      setNewUser({ name: "", email: "", role: "viewer", department: "", position: "", phone: "" });
    },
  });

  // Toggle user active
  const toggleUserMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/users/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearch.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} ${isAr ? "أيام" : "d"}`;
    if (hours > 0) return `${hours} ${isAr ? "ساعات" : "h"}`;
    return isAr ? "الآن" : "Now";
  };

  const activeUsers = users.filter((u) => u.isActive).length;

  // Mock system stats
  const systemHealth = [
    { label: isAr ? "وحدة المعالجة" : "CPU", value: 23, color: "bg-emerald-500" },
    { label: isAr ? "الذاكرة" : "Memory", value: 61, color: "bg-amber-500" },
    { label: isAr ? "التخزين" : "Disk", value: 45, color: "bg-blue-500" },
    { label: isAr ? "الشبكة" : "Network", value: 12, color: "bg-emerald-500" },
  ];

  // Mock automation rules
  const automations = [
    {
      id: "1",
      trigger: isAr ? "عند إنشاء مهمة جديدة" : "When a new task is created",
      action: isAr ? "إرسال إشعار لفريق المشروع" : "Send notification to project team",
      enabled: true,
    },
    {
      id: "2",
      trigger: isAr ? "عند اقتراب موعد استحقاق الفاتورة" : "When invoice due date is approaching",
      action: isAr ? "إرسال تذكير للعميل" : "Send reminder to client",
      enabled: true,
    },
    {
      id: "3",
      trigger: isAr ? "عند تغيير حالة المهمة إلى مكتملة" : "When task status changes to Done",
      action: isAr ? "تحديث نسبة تقدم المشروع" : "Update project progress percentage",
      enabled: true,
    },
    {
      id: "4",
      trigger: isAr ? "عند تقديم طلب إجازة" : "When a leave request is submitted",
      action: isAr ? "إرسال إشعار للمدير المباشر" : "Notify direct manager",
      enabled: false,
    },
    {
      id: "5",
      trigger: isAr ? "عند تسجيل حضور متأخر" : "When late attendance is recorded",
      action: isAr ? "تسجيل خصم تلقائي" : "Auto-record deduction",
      enabled: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? "إجمالي المستخدمين" : "Total Users"}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {users.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CircleDot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? "الجلسات النشطة" : "Active Sessions"}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {activeUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Server className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? "صحة النظام" : "System Health"}
                </p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {isAr ? "ممتاز" : "Excellent"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? "التخزين المستخدم" : "Storage Used"}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  2.4 GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="users" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between mb-3">
              <TabsList className="grid grid-cols-4 w-fit gap-1 p-1 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="users" className="gap-1.5 px-4">
                  <Users className="h-4 w-4" />
                  {isAr ? "المستخدمون" : "Users"}
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-1.5 px-4">
                  <Activity className="h-4 w-4" />
                  {isAr ? "سجل النشاط" : "Activity"}
                </TabsTrigger>
                <TabsTrigger value="automation" className="gap-1.5 px-4">
                  <Zap className="h-4 w-4" />
                  {isAr ? "الأتمتة" : "Autom."}
                </TabsTrigger>
                <TabsTrigger value="backup" className="gap-1.5 px-4">
                  <DatabaseBackup className="h-4 w-4" />
                  {isAr ? "النسخ الاحتياطي" : "Backup"}
                </TabsTrigger>
              </TabsList>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg">
                  <DatabaseBackup className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isAr ? "نسخ احتياطي" : "Backup"}</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isAr ? "مسح ذاكرة" : "Clear Cache"}</span>
                </Button>
              </div>
            </div>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-teal-600" />
                      {isAr ? "إدارة المستخدمين" : "User Management"}
                      <Badge variant="secondary" className="text-xs">
                        {users.length} {isAr ? "مستخدم" : "users"}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder={isAr ? "بحث عن مستخدم..." : "Search users..."}
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="ps-9 w-56 h-9 rounded-lg text-sm"
                        />
                      </div>
                      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 rounded-lg shadow-sm shadow-teal-500/20">
                            <UserPlus className="h-4 w-4" />
                            {isAr ? "إضافة مستخدم" : "Add User"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md" dir={isAr ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{isAr ? "إضافة مستخدم جديد" : "Add New User"}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{isAr ? "الاسم" : "Name"}</Label>
                              <Input
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                placeholder={isAr ? "أحمد محمد" : "Ahmed Mohamed"}
                                className="h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                              <Input
                                type="email"
                                dir="ltr"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="user@blueprint.ae"
                                className="h-10 rounded-lg"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">{isAr ? "الدور" : "Role"}</Label>
                                <Select
                                  value={newUser.role}
                                  onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                                >
                                  <SelectTrigger className="h-10 rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(roleLabels).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>
                                        {isAr ? label.ar : label.en}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">{isAr ? "القسم" : "Department"}</Label>
                                <Input
                                  value={newUser.department}
                                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                  placeholder={isAr ? "الهندسة" : "Engineering"}
                                  className="h-10 rounded-lg"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{isAr ? "المنصب" : "Position"}</Label>
                              <Input
                                value={newUser.position}
                                onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                                placeholder={isAr ? "مهندس أول" : "Senior Engineer"}
                                className="h-10 rounded-lg"
                              />
                            </div>
                            <Button
                              onClick={() => createUserMutation.mutate(newUser)}
                              disabled={createUserMutation.isPending || !newUser.name || !newUser.email}
                              className="w-full bg-teal-600 hover:bg-teal-700 text-white h-10 rounded-lg shadow-sm shadow-teal-500/20"
                            >
                              {isAr ? "إضافة المستخدم" : "Add User"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                            <TableHead className="text-xs font-semibold">{isAr ? "المستخدم" : "User"}</TableHead>
                            <TableHead className="text-xs font-semibold hidden md:table-cell">{isAr ? "الدور" : "Role"}</TableHead>
                            <TableHead className="text-xs font-semibold hidden lg:table-cell">{isAr ? "القسم" : "Department"}</TableHead>
                            <TableHead className="text-xs font-semibold hidden lg:table-cell">{isAr ? "آخر دخول" : "Last Login"}</TableHead>
                            <TableHead className="text-xs font-semibold">{isAr ? "الحالة" : "Status"}</TableHead>
                            <TableHead className="text-xs font-semibold text-end">{isAr ? "إجراءات" : "Actions"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user, idx) => (
                            <TableRow
                              key={user.id}
                              className={cn(
                                "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                                idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
                              )}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback className={cn("text-xs font-semibold", getAvatarColor(user.name))}>
                                        {user.name.charAt(0)?.toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div
                                      className={cn(
                                        "absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900",
                                        user.isActive ? "bg-emerald-500" : "bg-slate-400"
                                      )}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500 truncate" dir="ltr">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Select
                                  value={user.role}
                                  onValueChange={(v) => updateRoleMutation.mutate({ id: user.id, role: v })}
                                >
                                  <SelectTrigger className="h-8 w-36 text-xs rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(roleLabels).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>
                                        {isAr ? label.ar : label.en}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-sm text-slate-600 dark:text-slate-400">
                                {user.department || "—"}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {user.lastLogin ? formatTime(user.lastLogin) : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900",
                                    user.isActive ? "bg-emerald-500" : "bg-slate-400"
                                  )} />
                                  <Badge
                                    className={cn(
                                      "text-[10px] h-5 px-1.5 font-medium border-0",
                                      user.isActive
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                    )}
                                  >
                                    {user.isActive
                                      ? isAr ? "نشط" : "Active"
                                      : isAr ? "معطل" : "Disabled"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={isAr ? "start" : "end"}>
                                    <DropdownMenuItem className="gap-2">
                                      <Edit className="h-3.5 w-3.5" />
                                      {isAr ? "تعديل" : "Edit"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-2 text-red-600 dark:text-red-400"
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      {isAr ? "حذف" : "Delete"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Log Tab */}
            <TabsContent value="activity" className="mt-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-teal-600" />
                      {isAr ? "سجل النشاط" : "Activity Log"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <Select value={activityFilter} onValueChange={setActivityFilter}>
                        <SelectTrigger className="w-40 h-9 text-xs rounded-lg">
                          <SelectValue placeholder={isAr ? "جميع الإجراءات" : "All Actions"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                          {Object.entries(actionLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {isAr ? label.ar : label.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-sm text-slate-500">
                        {isAr ? "لا توجد أنشطة مسجلة" : "No activities recorded"}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                            <TableHead className="text-xs font-semibold">{isAr ? "المستخدم" : "User"}</TableHead>
                            <TableHead className="text-xs font-semibold">{isAr ? "الإجراء" : "Action"}</TableHead>
                            <TableHead className="text-xs font-semibold hidden md:table-cell">{isAr ? "الكيان" : "Entity"}</TableHead>
                            <TableHead className="text-xs font-semibold hidden lg:table-cell">{isAr ? "التفاصيل" : "Details"}</TableHead>
                            <TableHead className="text-xs font-semibold">{isAr ? "التاريخ" : "Date"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activities.map((act, idx) => {
                            const actionInfo = actionLabels[act.action] || { ar: act.action, en: act.action };
                            const entityInfo = entityLabels[act.entityType] || { ar: act.entityType, en: act.entityType };
                            const actionColors: Record<string, string> = {
                              create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
                              update: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                              delete: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                              approve: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
                              reject: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
                            };
                            return (
                              <TableRow
                                key={act.id}
                                className={cn(
                                  "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                                  idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
                                )}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      <AvatarFallback className={cn("text-[10px] font-semibold", getAvatarColor(act.user?.name || ""))}>
                                        {act.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm truncate max-w-32 text-slate-900 dark:text-white">{act.user?.name || "—"}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn("text-[10px] h-5 px-1.5 border-0 font-medium", actionColors[act.action] || "bg-slate-100 text-slate-700")}>
                                    {isAr ? actionInfo.ar : actionInfo.en}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-slate-600 dark:text-slate-400">
                                  {isAr ? entityInfo.ar : entityInfo.en}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-xs text-slate-500 max-w-48 truncate">
                                  {act.details || "—"}
                                </TableCell>
                                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                  {formatTime(act.createdAt)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backup & Restore Tab */}
            <BackupRestoreTab isAr={isAr} queryClient={queryClient}
              restoreDialogOpen={restoreDialogOpen}
              setRestoreDialogOpen={setRestoreDialogOpen}
              restoreTarget={restoreTarget}
              setRestoreTarget={setRestoreTarget}
            />

            {/* Automation Tab */}
            <TabsContent value="automation" className="mt-2">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {isAr ? "قواعد الأتمتة" : "Automation Rules"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isAr ? "تكوين الإجراءات التلقائية" : "Configure automatic actions"}
                      </p>
                    </div>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full ms-3" />
                  </div>
                  <div className="space-y-3">
                    {automations.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0">
                            <Zap className="h-4 w-4 text-amber-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{rule.trigger}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <ArrowUpRight className="h-3 w-3 text-slate-400" />
                              <span className="truncate">{rule.action}</span>
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          className="data-[state=checked]:bg-teal-600"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar: System Health + Mini Activity Timeline */}
        <div className="hidden lg:flex flex-col gap-4">
          {/* System Health */}
          <Card className="border-slate-200 dark:border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Server className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {isAr ? "صحة النظام" : "System Health"}
                </h3>
              </div>
              <div className="space-y-3">
                {systemHealth.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">{item.value}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", item.color)}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mini Activity Timeline */}
          <Card className="border-slate-200 dark:border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {isAr ? "آخر النشاطات" : "Recent Activity"}
                </h3>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((act, idx) => {
                    const actionInfo = actionLabels[act.action] || { ar: act.action, en: act.action };
                    const actionColorMap: Record<string, string> = {
                      create: "bg-emerald-500",
                      update: "bg-blue-500",
                      delete: "bg-red-500",
                      approve: "bg-teal-500",
                      reject: "bg-orange-500",
                    };
                    return (
                      <div key={act.id} className="flex items-start gap-2.5">
                        <div className="relative flex flex-col items-center">
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", actionColorMap[act.action] || "bg-slate-400")} />
                          {idx < Math.min(activities.length, 5) - 1 && (
                            <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pb-3">
                          <p className="text-xs text-slate-900 dark:text-white font-medium truncate">
                            {act.user?.name || isAr ? "مستخدم" : "User"}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {isAr ? actionInfo.ar : actionInfo.en} {act.entityType ? `— ${isAr ? entityLabels[act.entityType]?.ar || act.entityType : entityLabels[act.entityType]?.en || act.entityType}` : ""}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatTime(act.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Activity className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500">
                      {isAr ? "لا توجد أنشطة" : "No activities"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
