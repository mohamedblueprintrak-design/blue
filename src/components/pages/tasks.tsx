"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastFeedback } from "@/hooks/use-toast-feedback";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, getErrorMessage, type TaskFormData } from "@/lib/validations";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Calendar,
  AlertCircle,

  Clock,
  ListChecks,
 Building2,
  MoreHorizontal,
  Trash2,
  GripVertical,
  Landmark,
  Filter,
  LayoutList,
 CheckSquare,
 X,
 ArrowRightLeft,
 Flag,
 Trash,
 CheckCheck,
 Layers,
 ListFilter,
 MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import TaskComments from "@/components/pages/task-comments";
import { cn } from "@/lib/utils";

// ===== Types =====
interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  progress: number;
  assigneeId: string | null;
  projectId: string | null;
  assignee: { id: string; name: string; email: string; avatar: string } | null;
  project: { id: string; name: string; nameEn: string; number: string } | null;
  dueDate: string | null;
  startDate: string | null;
  isGovernmental: boolean;
  slaDays: number | null;
  createdAt: string;
  _count?: { subtasks: number; completedSubtasks: number };
  commentCount?: number;
}

interface ProjectOption {
  id: string;
  name: string;
  nameEn: string;
  number: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

// ===== Kanban Columns =====
const COLUMNS = [
  { id: "todo", borderAccent: "border-s-slate-400", bg: "bg-slate-50/80 dark:bg-slate-800/40", border: "border-slate-200 dark:border-slate-700" },
  { id: "in_progress", borderAccent: "border-s-amber-400", bg: "bg-amber-50/60 dark:bg-amber-950/20", border: "border-amber-200/80 dark:border-amber-800/60" },
  { id: "review", borderAccent: "border-s-blue-400", bg: "bg-blue-50/60 dark:bg-blue-950/20", border: "border-blue-200/80 dark:border-blue-800/60" },
  { id: "done", borderAccent: "border-s-emerald-400", bg: "bg-emerald-50/60 dark:bg-emerald-950/20", border: "border-emerald-200/80 dark:border-emerald-800/60" },
  { id: "cancelled", borderAccent: "border-s-red-400", bg: "bg-red-50/60 dark:bg-red-950/20", border: "border-red-200/80 dark:border-red-800/60" },
] as const;

function getColumnLabel(colId: string, ar: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    todo: { ar: "للتنفيذ", en: "To Do" },
    in_progress: { ar: "قيد التنفيذ", en: "In Progress" },
    review: { ar: "مراجعة", en: "Review" },
    done: { ar: "مكتمل", en: "Done" },
    cancelled: { ar: "ملغي", en: "Cancelled" },
  };
  return ar ? labels[colId]?.ar || colId : labels[colId]?.en || colId;
}

function getPriorityConfig(priority: string) {
  const configs: Record<string, { label: string; labelEn: string; color: string; topBorder: string; gradient: string }> = {
    normal: { label: "عادي", labelEn: "Normal", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", topBorder: "border-t-slate-400", gradient: "" },
    medium: { label: "متوسط", labelEn: "Medium", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300", topBorder: "border-t-amber-400", gradient: "bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/10 dark:to-slate-900" },
    high: { label: "عالي", labelEn: "High", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300", topBorder: "border-t-orange-500", gradient: "bg-gradient-to-b from-orange-50/50 to-white dark:from-orange-950/10 dark:to-slate-900" },
    urgent: { label: "عاجل", labelEn: "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", topBorder: "border-t-red-500", gradient: "bg-gradient-to-b from-red-50/50 to-white dark:from-red-950/10 dark:to-slate-900" },
  };
  return configs[priority] || configs.normal;
}

// ===== Filter Chips =====
interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

function FilterChip({ label, active, onClick, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        active
          ? "bg-teal-600 text-white shadow-sm shadow-teal-600/25"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          "text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full",
          active ? "bg-teal-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

// ===== Droppable Column =====
function DroppableColumn({
  id, tasks, activeId, ar, onAddTask, bulkMode, selectedIds, onToggleSelect, onToggleSelectAll, onOpenComments
}: {
  id: string; tasks: TaskItem[]; activeId: string | null; ar: boolean; onAddTask: (status: string) => void; bulkMode?: boolean; selectedIds?: Set<string>; onToggleSelect?: (id: string) => void; onToggleSelectAll?: () => void; onOpenComments?: (task: TaskItem) => void;
}) {
  const col = COLUMNS.find((c) => c.id === id)!;
  const { setNodeRef, isOver } = useDroppable({ id });
  const taskCount = tasks.filter((t) => t.id !== activeId).length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-[300px] md:w-[320px] rounded-xl border-s-4 border transition-all",
        col.borderAccent,
        col.bg,
        col.border,
        "shadow-sm",
        isOver && "ring-2 ring-teal-400/50 scale-[1.01] shadow-md"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        {bulkMode && (
          <button
            onClick={onToggleSelectAll}
            className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
          >
            <Checkbox
              checked={tasks.length > 0 && tasks.every((t) => selectedIds?.has(t.id))}
              onCheckedChange={onToggleSelectAll}
              className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
            />
          </button>
        )}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex-1">
          {getColumnLabel(id, ar)}
        </h3>
        <Badge
          variant="secondary"
          className="text-[10px] h-5 min-w-[20px] justify-center bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300"
        >
          {taskCount}
        </Badge>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAddTask(id)}
                className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {ar ? `إضافة مهمة إلى "${getColumnLabel(id, ar)}"` : `Add task to "${getColumnLabel(id, ar)}"`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Separator />

      {/* Column Tasks */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-340px)] overflow-y-auto scrollbar-thin">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} ar={ar} bulkMode={bulkMode} selected={selectedIds?.has(task.id) || false} onToggle={onToggleSelect} onOpenComments={onOpenComments} />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-20 text-xs text-slate-400 dark:text-slate-500 gap-1">
              <LayoutList className="h-5 w-5" />
              <span>{ar ? "لا توجد مهام" : "No tasks"}</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ===== Sortable Task Card =====
function SortableTaskCard({ task, ar, bulkMode, selected, onToggle, onOpenComments }: { task: TaskItem; ar: boolean; bulkMode?: boolean; selected?: boolean; onToggle?: (id: string) => void; onOpenComments?: (task: TaskItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const now = new Date();
  const isApproaching = dueDate
    ? dueDate.getTime() - now.getTime() < 2 * 86400000 && dueDate.getTime() > now.getTime()
    : false;
  const isOverdue = dueDate ? dueDate.getTime() < now.getTime() : false;

  // SLA calculation
  let slaRemaining: number | null = null;
  let slaOverdue = false;
  let slaApproaching = false;
  if (task.isGovernmental && task.slaDays && task.startDate) {
    const start = new Date(task.startDate);
    const deadline = new Date(start.getTime() + task.slaDays * 86400000);
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
    slaRemaining = diff;
    slaOverdue = diff < 0;
    slaApproaching = diff >= 0 && diff < 3;
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={() => !bulkMode && onOpenComments?.(task)}
      className={cn(
        "py-0 gap-0 border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900",
        "hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group",
        "border-t-2",
        priorityConfig.topBorder,
        priorityConfig.gradient || "bg-white dark:bg-slate-900",
        bulkMode && selected && "ring-2 ring-teal-400 ring-offset-1 dark:ring-offset-slate-900"
      )}
    >
      <div className="p-3">
        {/* Bulk checkbox */}
        {bulkMode && (
          <div className="absolute top-2 start-2 z-10">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggle?.(task.id)}
              className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 h-4 w-4"
            />
          </div>
        )}
        {/* Top: Priority + Government + Actions */}
        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5", priorityConfig.color)}>
            {ar ? priorityConfig.label : priorityConfig.labelEn}
          </Badge>
          {task.isGovernmental && (
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] h-5 px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                slaApproaching && !slaOverdue && "animate-pulse"
              )}
            >
              <Landmark className="h-3 w-3 me-1" />
              {ar ? "حكومي" : "Gov"}
              {slaApproaching && !slaOverdue && (
                <Clock className="h-2.5 w-2.5 ms-1" />
              )}
            </Badge>
          )}
          <div className="flex-1" />
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <TaskActionsDropdown taskId={task.id} taskTitle={task.title} ar={ar} onOpenComments={() => onOpenComments?.(task)} />
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2 leading-relaxed">
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        {/* Progress bar */}
        {task.progress > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-slate-400">{ar ? "التقدم" : "Progress"}</span>
              <span className="text-[10px] text-slate-400 font-medium">{Math.round(task.progress)}%</span>
            </div>
            <Progress value={task.progress} className="h-1.5" />
          </div>
        )}

        {/* Subtasks count */}
        {task._count && task._count.subtasks > 0 && (
          <div className="flex items-center gap-1 mb-2 text-xs text-slate-500 dark:text-slate-400">
            <ListChecks className="h-3 w-3" />
            <span>{task._count.completedSubtasks}/{task._count.subtasks}</span>
          </div>
        )}

        {/* Comment count badge */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenComments?.(task);
          }}
          className={cn(
            "inline-flex items-center gap-1 mb-2 text-xs rounded-full px-2 py-0.5 transition-colors",
            (task.commentCount ?? 0) > 0
              ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30"
              : "text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          <MessageSquare className="h-3 w-3" />
          <span>{task.commentCount ?? 0}</span>
        </button>

        {/* Due date */}
        {dueDate && (
          <div className={cn(
            "flex items-center gap-1 text-xs mb-2",
            isOverdue
              ? "text-red-600 dark:text-red-400 font-medium"
              : isApproaching
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-500 dark:text-slate-400"
          )}>
            <Calendar className="h-3 w-3" />
            <span>{dueDate.toLocaleDateString(ar ? "ar-AE" : "en-US")}</span>
            {isOverdue && (
              <span className="font-semibold">({ar ? "متأخر!" : "Overdue!"})</span>
            )}
            {isApproaching && !isOverdue && (
              <span className="text-amber-500 font-medium">({ar ? "قريباً" : "Soon"})</span>
            )}
          </div>
        )}

        {/* SLA Warning */}
        {slaRemaining !== null && (
          <div className={cn(
            "flex items-center gap-1 text-xs mb-2",
            slaOverdue
              ? "text-red-600 dark:text-red-400"
              : slaApproaching
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-500 dark:text-slate-400"
          )}>
            <Clock className={cn("h-3 w-3", slaApproaching && !slaOverdue && "animate-pulse")} />
            {slaOverdue ? (
              <span className="font-medium">{ar ? `تجاوز بـ ${Math.abs(slaRemaining)} يوم` : `Overdue by ${Math.abs(slaRemaining)} days`}</span>
            ) : (
              <span>{ar ? `${slaRemaining} يوم متبقي SLA` : `${slaRemaining} days SLA left`}</span>
            )}
            {slaOverdue && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1 ms-1">
                {ar ? "تجاوز!" : "Overdue!"}
              </Badge>
            )}
          </div>
        )}

        <Separator className="my-2" />

        {/* Bottom: Assignee + Project */}
        <div className="flex items-center justify-between">
          {task.assignee ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-[8px] bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                  {task.assignee.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400">{ar ? "غير محدد" : "Unassigned"}</div>
          )}
          {task.project && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{ar ? task.project.name : task.project.nameEn || task.project.name}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ===== Task Actions Dropdown =====
function TaskActionsDropdown({ taskId, taskTitle, ar, onOpenComments }: { taskId: string; taskTitle: string; ar: boolean; onOpenComments?: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar });
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.deleted(ar ? "المهمة" : "Task");
    },
    onError: () => {
      toast.error(ar ? "حذف المهمة" : "Delete task");
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={ar ? "start" : "end"} className="w-40">
        {onOpenComments && (
          <DropdownMenuItem
            className="text-teal-600 dark:text-teal-400 focus:text-teal-600"
            onClick={() => onOpenComments()}
          >
            <MessageSquare className="h-3.5 w-3.5 me-2" />
            {ar ? "التعليقات" : "Comments"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-red-600 dark:text-red-400 focus:text-red-600"
          onClick={() => {
            if (confirm(ar ? `هل أنت متأكد من حذف "${taskTitle}"؟` : `Delete "${taskTitle}"?`)) {
              deleteMutation.mutate();
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5 me-2" />
          {ar ? "حذف" : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ===== Main Tasks Component =====
interface TasksKanbanProps {
  language: "ar" | "en";
  projectId?: string;
}

export default function TasksKanban({ language, projectId }: TasksKanbanProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [commentTask, setCommentTask] = useState<TaskItem | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [filterProject, setFilterProject] = useState<string>(projectId || "all");
  useEffect(() => {
    if (projectId) setFilterProject(projectId);
  }, [projectId]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<string>("all");
  const [defaultStatus, setDefaultStatus] = useState<string>("todo");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<TaskItem[]>({
    queryKey: ["tasks", projectId, filterProject, filterAssignee],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterProject !== "all") params.set("projectId", filterProject);
      if (filterAssignee !== "all") params.set("assigneeId", filterAssignee);
      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  // Fetch projects for filters and dropdowns
  const { data: projects = [] } = useQuery<ProjectOption[]>({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const res = await fetch("/api/projects-simple");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch users for dropdowns
  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ["users-list"],
    queryFn: async () => {
      const res = await fetch("/api/users-simple");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error(ar ? "تحديث حالة المهمة" : "Update task status");
 },
  });

  // Update task priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error(ar ? "تحديث أولوية المهمة" : "Update task priority");
 },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, { method: "DELETE" })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
      toast.deleted(ar ? "المهام المحددة" : "Selected tasks");
 },
    onError: () => {
      toast.error(ar ? "حذف المهام" : "Delete tasks");
 },
  });

  // Bulk status change
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
 })));
 },
 onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    setSelectedIds(new Set());
    toast.showSuccess(ar ? "تم تغيير حالة المهام" : "Task status changed");
 },
 onError: () => {
    toast.error(ar ? "تغيير الحالة" : "Change status");
 },
 });

  // Bulk priority change
  const bulkPriorityMutation = useMutation({
    mutationFn: async ({ ids, priority }: { ids: string[]; priority: string }) => {
      await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
 })));
 },
 onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    setSelectedIds(new Set());
    toast.showSuccess(ar ? "تم تغيير أولوية المهام" : "Task priority changed");
 },
 onError: () => {
    toast.error(ar ? "تغيير الأولوية" : "Change priority");
 },
 });

  // Bulk select helpers
  const toggleBulkSelect = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleSelectAllInColumn = (status: string) => {
    const columnTasks = filteredTasks.filter((t) => t.status === status);
    const allSelected = columnTasks.every((t) => selectedIds.has(t.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
    if (allSelected) {
        columnTasks.forEach((t) => next.delete(t.id));
 } else {
        columnTasks.forEach((t) => next.add(t.id));
 }
      return next;
    });
  };

  const clearBulkSelection = () => setSelectedIds(new Set());

  const exitBulkMode = () => {
 setBulkMode(false);
 setSelectedIds(new Set());
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowAddDialog(false);
      reset();
      toast.created(ar ? "المهمة" : "Task");
    },
    onError: () => {
      toast.error(ar ? "إنشاء المهمة" : "Create task");
    },
  });

  // Form
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      projectId: projectId || "",
      assigneeId: "",
      priority: "normal",
      status: "todo",
      startDate: "",
      dueDate: "",
      isGovernmental: false,
      slaDays: "",
    },
  });
  const { register, handleSubmit: rhfHandleSubmit, formState: { errors }, reset, setValue, watch } = form;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
    setActiveTask(tasks.find((t) => t.id === id) || null);
  }, [tasks]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveTask(null);

      if (!over) return;

      const taskId = String(active.id);
      const currentTask = tasks.find((t) => t.id === taskId);

      // Check if dropped directly on a column
      const targetColumn = COLUMNS.find((c) => c.id === over.id);

      if (targetColumn) {
        if (currentTask && currentTask.status !== targetColumn.id) {
          updateStatusMutation.mutate({ id: taskId, status: targetColumn.id });
        }
      } else {
        // Dropped on a task card - derive target column from that card's status
        const overTask = tasks.find((t) => t.id === over.id);
        if (overTask && currentTask && currentTask.status !== overTask.status) {
          updateStatusMutation.mutate({ id: taskId, status: overTask.status });
        }
      }
    },
    [tasks, updateStatusMutation]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
  }, []);

  const handleAddTask = (status: string) => {
    setDefaultStatus(status);
    reset({ title: "", description: "", projectId: projectId || "", assigneeId: "", priority: "normal", status, startDate: "", dueDate: "", isGovernmental: false, slaDays: "" });
    setShowAddDialog(true);
  };

  const handleOpenComments = (task: TaskItem) => {
    setCommentTask(task);
  };

  // Quick filter logic
  const now = new Date();
  const getQuickFilteredTasks = () => {
    switch (quickFilter) {
      case "urgent":
        return tasks.filter((t) => t.priority === "urgent");
      case "overdue":
        return tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);
      case "governmental":
        return tasks.filter((t) => t.isGovernmental);
      default:
        return tasks;
    }
  };

  const filteredTasks = getQuickFilteredTasks();

  const urgentCount = tasks.filter((t) => t.priority === "urgent").length;
  const overdueCount = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;
  const govCount = tasks.filter((t) => t.isGovernmental).length;

  // Group tasks by status
  const tasksByStatus: Record<string, TaskItem[]> = {};
  COLUMNS.forEach((col) => {
    tasksByStatus[col.id] = filteredTasks.filter((t) => t.status === col.id);
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <ListChecks className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {ar ? "المهام" : "Tasks"}
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {tasks.length} {ar ? "مهمة إجمالاً" : "total tasks"}
                </p>
              </div>
            </div>
            <div className="sm:ms-auto flex items-center gap-2">
              <Button
                size="sm"
                variant={bulkMode ? "default" : "outline"}
                className={cn(
                  "h-8 rounded-lg shadow-sm",
                  bulkMode
                    ? "bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/20"
                    : "text-slate-600 dark:text-slate-300"
                )}
                onClick={() => { if (bulkMode) exitBulkMode(); else setBulkMode(true); }}
              >
                <CheckSquare className={cn("h-3.5 w-3.5 me-1", bulkMode && "me-0")} />
                {bulkMode
                  ? (ar ? "إلغاء التحديد" : "Cancel")
                  : (ar ? "تحديد متعدد" : "Bulk Select")}
              </Button>
              <Button
                size="sm"
                className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20"
                onClick={() => handleAddTask("todo")}
              >
                <Plus className="h-3.5 w-3.5 me-1" />
                {ar ? "إضافة مهمة" : "Add Task"}
              </Button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip
              label={ar ? "الكل" : "All"}
              active={quickFilter === "all"}
              onClick={() => setQuickFilter("all")}
              count={tasks.length}
            />
            <FilterChip
              label={ar ? "عاجل" : "Urgent"}
              active={quickFilter === "urgent"}
              onClick={() => setQuickFilter("urgent")}
              count={urgentCount}
            />
            <FilterChip
              label={ar ? "متأخر" : "Overdue"}
              active={quickFilter === "overdue"}
              onClick={() => setQuickFilter("overdue")}
              count={overdueCount}
            />
            <FilterChip
              label={ar ? "حكومي" : "Governmental"}
              active={quickFilter === "governmental"}
              onClick={() => setQuickFilter("governmental")}
              count={govCount}
            />

            {/* Dropdown filters */}
            <div className="flex items-center gap-2 ms-auto">
              {!projectId && (
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-[140px] h-7 text-[11px] border-slate-200 dark:border-slate-700 rounded-lg">
                  <SelectValue placeholder={ar ? "المشروع" : "Project"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ar ? "جميع المشاريع" : "All Projects"}</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {ar ? p.name : p.nameEn || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              )}
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-[140px] h-7 text-[11px] border-slate-200 dark:border-slate-700 rounded-lg">
                  <SelectValue placeholder={ar ? "المسؤول" : "Assignee"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            {ar ? "جارٍ التحميل..." : "Loading..."}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((col) => (
                <DroppableColumn
                  key={col.id}
                  id={col.id}
                  tasks={tasksByStatus[col.id]}
                  activeId={activeId}
                  ar={ar}
                  onAddTask={handleAddTask}
                  bulkMode={bulkMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleBulkSelect}
                  onToggleSelectAll={() => toggleSelectAllInColumn(col.id)}
                  onOpenComments={handleOpenComments}
                />
              ))}
            </div>

            {/* Floating Bulk Action Bar */}
            {bulkMode && selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
                <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 border border-slate-700 dark:border-slate-600 rounded-full px-3 py-2 shadow-xl">
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
                    <CheckCheck className="h-3.5 w-3.5 text-teal-400" />
                    <span className="text-xs font-bold text-white tabular-nums">{selectedIds.size}</span>
                  </div>

                  <Separator orientation="vertical" className="h-6 bg-slate-700 dark:bg-slate-600" />

                  {/* Change Status */}
                  <Select onValueChange={(val) => bulkStatusMutation.mutate({ ids: Array.from(selectedIds), status: val })} disabled={bulkStatusMutation.isPending}>
                    <SelectTrigger className="h-8 w-[110px] text-[11px] border-0 bg-white/10 text-white hover:bg-white/20 rounded-lg">
                      <ArrowRightLeft className="h-3 w-3 me-1" />
                      {ar ? "الحالة" : "Status"}
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{getColumnLabel(c.id, ar)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Change Priority */}
                  <Select onValueChange={(val) => bulkPriorityMutation.mutate({ ids: Array.from(selectedIds), priority: val })} disabled={bulkPriorityMutation.isPending}>
                    <SelectTrigger className="h-8 w-[110px] text-[11px] border-0 bg-white/10 text-white hover:bg-white/20 rounded-lg">
                      <Flag className="h-3 w-3 me-1" />
                      {ar ? "الأولوية" : "Priority"}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{ar ? "عادي" : "Normal"}</SelectItem>
                      <SelectItem value="medium">{ar ? "متوسط" : "Medium"}</SelectItem>
                      <SelectItem value="high">{ar ? "عالي" : "High"}</SelectItem>
                      <SelectItem value="urgent">{ar ? "عاجل" : "Urgent"}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Separator orientation="vertical" className="h-6 bg-slate-700 dark:bg-slate-600" />

                  {/* Delete */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                    onClick={() => {
                      if (confirm(ar ? `حذف ${selectedIds.size} مهمة؟` : `Delete ${selectedIds.size} tasks?`)) {
                        bulkDeleteMutation.mutate(Array.from(selectedIds));
 }
                    }}
                    disabled={bulkDeleteMutation.isPending}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>

                  <Separator orientation="vertical" className="h-6 bg-slate-700 dark:bg-slate-600" />

                  {/* Cancel */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                    onClick={clearBulkSelection}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            <DragOverlay>
              {activeTask && <TaskCardOverlay task={activeTask} ar={ar} />}
            </DragOverlay>
          </DndContext>
        )}

        {/* Add Task Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{ar ? "مهمة جديدة" : "New Task"}</DialogTitle>
              <DialogDescription>
                {ar ? "إضافة مهمة جديدة إلى لوحة المهام" : "Add a new task to the board"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={rhfHandleSubmit((data) => createTaskMutation.mutate({ ...data, status: defaultStatus }))} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "العنوان" : "Title"} *</Label>
                <Input
                  {...register("title")}
                  placeholder={ar ? "أدخل عنوان المهمة" : "Enter task title"}
                  className={cn(errors.title && "border-red-500 focus:ring-red-500/20 focus:border-red-500")}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.title.message || "", ar)}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "الوصف" : "Description"}</Label>
                <Textarea
                  {...register("description")}
                  placeholder={ar ? "وصف المهمة (اختياري)" : "Task description (optional)"}
                  rows={3}
                />
              </div>

              {/* Project + Assignee */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "المشروع" : "Project"}</Label>
                  <Select
                    // eslint-disable-next-line react-hooks/incompatible-library
                    value={watch("projectId")}
                    onValueChange={(v) => setValue("projectId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={ar ? "اختر مشروع" : "Select project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {ar ? p.name : p.nameEn || p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "المسؤول" : "Assignee"}</Label>
                  <Select
                    value={watch("assigneeId")}
                    onValueChange={(v) => setValue("assigneeId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={ar ? "اختر مسؤول" : "Select assignee"} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Priority + Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "الأولوية" : "Priority"}</Label>
                  <Select
                    value={watch("priority")}
                    onValueChange={(v) => setValue("priority", v)}
                  >
                    <SelectTrigger className={cn(errors.priority && "border-red-500 focus:ring-red-500/20")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{ar ? "عادي" : "Normal"}</SelectItem>
                      <SelectItem value="medium">{ar ? "متوسط" : "Medium"}</SelectItem>
                      <SelectItem value="high">{ar ? "عالي" : "High"}</SelectItem>
                      <SelectItem value="urgent">{ar ? "عاجل" : "Urgent"}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.priority.message || "", ar)}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "تاريخ البدء" : "Start Date"}</Label>
                  <Input
                    type="date"
                    {...register("startDate")}
                    className={cn(errors.startDate && "border-red-500 focus:ring-red-500/20 focus:border-red-500")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "تاريخ الاستحقاق" : "Due Date"}</Label>
                  <Input
                    type="date"
                    {...register("dueDate")}
                    className={cn(errors.dueDate && "border-red-500 focus:ring-red-500/20 focus:border-red-500")}
                  />
                </div>
              </div>

              <Separator />

              {/* Governmental + SLA */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={watch("isGovernmental")}
                  onCheckedChange={(checked) =>
                    setValue("isGovernmental", !!checked)
                  }
                />
                <Label className="text-sm cursor-pointer">
                  {ar ? "مهمة حكومية" : "Governmental Task"}
                </Label>
              </div>

              {watch("isGovernmental") && (
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "أيام SLA" : "SLA Days"}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={watch("slaDays") || ""}
                    onChange={(e) => setValue("slaDays", e.target.value)}
                    placeholder={ar ? "عدد أيام المستوى الخدمي" : "Number of SLA days"}
                  />
                </div>
              )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                type="submit"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending
                  ? ar ? "جارٍ الإنشاء..." : "Creating..."
                  : ar ? "إنشاء" : "Create"}
              </Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Task Detail + Comments Sheet */}
        <Sheet open={!!commentTask} onOpenChange={(open) => { if (!open) setCommentTask(null); }}>
          <SheetContent side="left" className={cn(
            "w-[400px] sm:w-[440px] p-0 flex flex-col",
            "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50"
          )}>
            {commentTask && (
              <>
                <SheetHeader className="p-4 pb-0">
                  <SheetTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 line-clamp-1">
                    <ListChecks className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="truncate">{commentTask.title}</span>
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      getPriorityConfig(commentTask.priority).color
                    )}>
                      {ar ? getPriorityConfig(commentTask.priority).label : getPriorityConfig(commentTask.priority).labelEn}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {getColumnLabel(commentTask.status, ar)}
                    </span>
                    {commentTask.project && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {ar ? commentTask.project.name : (commentTask.project.nameEn || commentTask.project.name)}
                      </span>
                    )}
                  </SheetDescription>
                </SheetHeader>

                <div className="border-b border-slate-100 dark:border-slate-800 my-2" />

                <div className="flex-1 min-h-0 p-4">
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      {ar ? "التعليقات" : "Comments"}
                    </h4>
                  </div>
                  <TaskComments taskId={commentTask.id} language={language} />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

// ===== Drag Overlay Card =====
function TaskCardOverlay({ task, ar }: { task: TaskItem; ar: boolean }) {
  const priorityConfig = getPriorityConfig(task.priority);
  return (
    <Card className="py-0 gap-0 border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-xl rotate-2 w-[300px] border-t-2 border-white dark:border-slate-900">
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5", priorityConfig.color)}>
            {ar ? priorityConfig.label : priorityConfig.labelEn}
          </Badge>
          {task.isGovernmental && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <Landmark className="h-3 w-3 me-1" />
              {ar ? "حكومي" : "Gov"}
            </Badge>
          )}
        </div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
            {task.description}
          </p>
        )}
      </div>
    </Card>
  );
}
