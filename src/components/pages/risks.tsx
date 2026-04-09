"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  ShieldAlert,
  Eye,
  Trash2,
  Filter,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Activity,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Types =====
interface RiskItem {
  id: string;
  projectId: string;
  title: string;
  category: string;
  probability: number;
  impact: number;
  score: number;
  mitigationPlan: string;
  strategy: string;
  status: string;
  createdAt: string;
  project: { id: string; name: string; nameEn: string; number: string } | null;
  actions: RiskAction[];
}

interface RiskAction {
  id: string;
  description: string;
  assigneeId: string | null;
  dueDate: string | null;
  completed: boolean;
  assignee: { id: string; name: string } | null;
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
}

// ===== Helpers =====
const categories = [
  { value: "technical", ar: "تقني", en: "Technical", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  { value: "financial", ar: "مالي", en: "Financial", color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
  { value: "schedule", ar: "جدول زمني", en: "Schedule", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  { value: "external", ar: "خارجي", en: "External", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
  { value: "safety", ar: "سلامة", en: "Safety", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  { value: "environmental", ar: "بيئي", en: "Environmental", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300" },
];

const strategies = [
  { value: "avoid", ar: "تجنب", en: "Avoid", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  { value: "mitigate", ar: "تخفيف", en: "Mitigate", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  { value: "transfer", ar: "نقل", en: "Transfer", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
  { value: "accept", ar: "قبول", en: "Accept", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
];

function getCategoryBadge(category: string, ar: boolean) {
  const cat = categories.find((c) => c.value === category);
  return (
    <Badge variant="secondary" className={`text-[10px] h-5 ${cat?.color || ""}`}>
      {cat ? (ar ? cat.ar : cat.en) : category}
    </Badge>
  );
}

function getStrategyBadge(strategy: string, ar: boolean) {
  const strat = strategies.find((s) => s.value === strategy);
  return (
    <Badge variant="secondary" className={`text-[10px] h-5 ${strat?.color || ""}`}>
      {strat ? (ar ? strat.ar : strat.en) : strategy}
    </Badge>
  );
}

function getStatusBadge(status: string, ar: boolean) {
  const configs: Record<string, { label: string; labelEn: string; color: string }> = {
    open: { label: "مفتوح", labelEn: "Open", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
    mitigating: { label: "قيد التخفيف", labelEn: "Mitigating", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
    resolved: { label: "تم الحل", labelEn: "Resolved", color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
    closed: { label: "مغلق", labelEn: "Closed", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  };
  const cfg = configs[status] || configs.open;
  return (
    <Badge variant="secondary" className={`text-[10px] h-5 ${cfg.color}`}>
      {ar ? cfg.label : cfg.labelEn}
    </Badge>
  );
}

function getScoreColor(score: number) {
  if (score <= 4) return "bg-green-500";
  if (score <= 9) return "bg-yellow-500";
  if (score <= 15) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number) {
  if (score <= 4) return "text-green-700 dark:text-green-400";
  if (score <= 9) return "text-yellow-700 dark:text-yellow-400";
  if (score <= 15) return "text-orange-700 dark:text-orange-400";
  return "text-red-700 dark:text-red-400";
}

function getMatrixCellColor(prob: number, impact: number) {
  const score = prob * impact;
  if (score <= 4) return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/50";
  if (score <= 9) return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800/50";
  if (score <= 15) return "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/50";
  return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/50";
}

function getMatrixDotColor(prob: number, impact: number) {
  const score = prob * impact;
  if (score <= 4) return "bg-green-600";
  if (score <= 9) return "bg-yellow-600";
  if (score <= 15) return "bg-orange-600";
  return "bg-red-600";
}

// ===== Main Component =====
interface RisksProps {
  language: "ar" | "en";
  projectId?: string;
}

export default function Risks({ language, projectId }: RisksProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Fetch risks
  const { data: risks = [], isLoading } = useQuery<RiskItem[]>({
    queryKey: ["risks", filterProject, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterProject !== "all") params.set("projectId", filterProject);
      const res = await fetch(`/api/risks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch risks");
      return res.json();
    },
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<ProjectOption[]>({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const res = await fetch("/api/projects-simple");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch users
  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ["users-simple"],
    queryFn: async () => {
      const res = await fetch("/api/users-simple");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create risk");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks"] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/risks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks"] });
    },
  });

  // Toggle action completion mutation
  const toggleActionMutation = useMutation({
    mutationFn: async ({ actionId, completed }: { actionId: string; completed: boolean }) => {
      const res = await fetch(`/api/risks/actions/${actionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("Failed to update action");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks"] });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/risks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update risk");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks"] });
    },
  });

  // Auto-set project filter from props
  useEffect(() => {
    if (projectId) setFilterProject(projectId);
  }, [projectId]);

  const [formData, setFormData] = useState({
    projectId: projectId || "",
    title: "",
    category: "technical",
    probability: 3,
    impact: 3,
    mitigationPlan: "",
    strategy: "mitigate",
    assigneeId: "",
  });

  const [newActions, setNewActions] = useState<Array<{ description: string; assigneeId: string; dueDate: string }>>([]);

  const resetForm = () => {
    setFormData({
      projectId: projectId || (filterProject !== "all" ? filterProject : ""),
      title: "",
      category: "technical",
      probability: 3,
      impact: 3,
      mitigationPlan: "",
      strategy: "mitigate",
      assigneeId: "",
    });
    setNewActions([]);
  };

  const addNewAction = () => {
    setNewActions([...newActions, { description: "", assigneeId: "", dueDate: "" }]);
  };

  const removeNewAction = (index: number) => {
    setNewActions(newActions.filter((_, i) => i !== index));
  };

  const updateNewAction = (index: number, field: string, value: string) => {
    const updated = [...newActions];
    updated[index] = { ...updated[index], [field]: value };
    setNewActions(updated);
  };

  const score = formData.probability * formData.impact;

  // Filter risks by category on client side
  const filteredRisks = filterCategory === "all"
    ? risks
    : risks.filter((r) => r.category === filterCategory);

  // Risk matrix data
  const matrixData = risks.reduce<Record<string, RiskItem[]>>((acc, risk) => {
    const key = `${risk.probability}-${risk.impact}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(risk);
    return acc;
  }, {});

  // Stats
  const totalRisks = risks.length;
  const criticalRisks = risks.filter((r) => r.score >= 16).length;
  const highRisks = risks.filter((r) => r.score >= 10 && r.score < 16).length;
  const openRisks = risks.filter((r) => r.status === "open").length;

  const probLabels = [5, 4, 3, 2, 1];
  const impactLabels = [1, 2, 3, 4, 5];
  const probTexts = ar
    ? ["مؤكد تقريباً", "محتمل جداً", "محتمل", "غير محتمل", "نادر"]
    : ["Almost Certain", "Likely", "Possible", "Unlikely", "Rare"];
  const impactTexts = ar
    ? ["ضئيل", "ثانوي", "متوسط", "كبير", "كارثي"]
    : ["Insignificant", "Minor", "Moderate", "Major", "Catastrophic"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {ar ? "إدارة المخاطر" : "Risk Management"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {ar ? `إجمالي ${risks.length} خطر` : `${risks.length} total risks`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!projectId && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <Filter className="h-3 w-3 me-1 text-slate-400" />
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

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder={ar ? "التصنيف" : "Category"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>{ar ? c.ar : c.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="h-8 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-3.5 w-3.5 me-1" />
            {ar ? "خطر جديد" : "New Risk"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ar ? "إجمالي المخاطر" : "Total Risks"}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{totalRisks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Target className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ar ? "عالي / حرج" : "High / Critical"}</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">{criticalRisks + highRisks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ar ? "تم التخفيف" : "Mitigated"}</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{risks.filter(r => r.status === "resolved" || r.status === "closed").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution Bar */}
      {risks.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
            {(() => {
              const low = risks.filter(r => r.score <= 4).length;
              const medium = risks.filter(r => r.score >= 5 && r.score <= 9).length;
              const high = risks.filter(r => r.score >= 10 && r.score <= 15).length;
              const critical = risks.filter(r => r.score >= 16).length;
              const total = risks.length || 1;
              return (
                <>
                  {low > 0 && <div className="bg-green-500 h-full" style={{width: `${(low/total)*100}%`}} />}
                  {medium > 0 && <div className="bg-yellow-500 h-full" style={{width: `${(medium/total)*100}%`}} />}
                  {high > 0 && <div className="bg-orange-500 h-full" style={{width: `${(high/total)*100}%`}} />}
                  {critical > 0 && <div className="bg-red-500 h-full" style={{width: `${(critical/total)*100}%`}} />}
                </>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            {[{color: "bg-green-500", label: ar ? "منخفض" : "Low"}, {color: "bg-yellow-500", label: ar ? "متوسط" : "Medium"}, {color: "bg-orange-500", label: ar ? "عالي" : "High"}, {color: "bg-red-500", label: ar ? "حرج" : "Critical"}].map(item => (
              <div key={item.label} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Trend Mini Chart */}
      {risks.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {ar ? "توزيع المخاطر" : "Risk Distribution"}
              </h3>
            </div>
            <div className="flex items-end gap-2 h-20">
              {["technical", "financial", "schedule", "external", "safety", "environmental"].map((cat) => {
                const count = risks.filter(r => r.category === cat).length;
                const maxCount = Math.max(...["technical", "financial", "schedule", "external", "safety", "environmental"].map(c => risks.filter(r => r.category === c).length), 1);
                const catCfg = categories.find(c => c.value === cat);
                const barColors: Record<string, string> = {
                  technical: "bg-blue-500",
                  financial: "bg-green-500",
                  schedule: "bg-amber-500",
                  external: "bg-purple-500",
                  safety: "bg-red-500",
                  environmental: "bg-teal-500",
                };
                return (
                  <div key={cat} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">{count}</span>
                    <div className="w-full rounded-t-sm bg-slate-100 dark:bg-slate-800 relative" style={{height: "56px"}}>
                      <div className={cn("absolute bottom-0 w-full rounded-t-sm", barColors[cat])} style={{height: `${(count/maxCount)*100}%`, minHeight: count > 0 ? "4px" : "0"}} />
                    </div>
                    <span className="text-[8px] text-slate-400 text-center leading-tight">{catCfg ? (ar ? catCfg.ar : catCfg.en) : cat}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Matrix */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {ar ? "مصفوفة المخاطر" : "Risk Matrix"}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[420px]">
            <div className="flex">
              {/* Y-axis */}
              <div className="flex flex-col shrink-0">
                <div className="h-6"></div>
                {probLabels.map((prob, idx) => (
                  <div key={prob} className="h-14 flex items-center justify-end pe-2">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">{prob}</span>
                      <span className="text-[8px] text-slate-400 block">{probTexts[idx]}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1">
                {/* Header row */}
                <div className="grid grid-cols-5 gap-1 h-6">
                  {impactLabels.map((impact, idx) => (
                    <div key={impact} className="text-center">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{impact}</span>
                      <span className="text-[8px] text-slate-400 block">{impactTexts[idx]}</span>
                    </div>
                  ))}
                </div>
                {/* Data rows */}
                {probLabels.map((prob) => (
                  <div key={prob} className="grid grid-cols-5 gap-1 mb-1">
                    {impactLabels.map((impact) => {
                      const key = `${prob}-${impact}`;
                      const cellRisks = matrixData[key] || [];
                      const scoreVal = prob * impact;
                      return (
                        <div
                          key={key}
                          className={`relative h-14 rounded-md border flex flex-col items-center justify-center transition-all hover:scale-[1.02] cursor-pointer ${getMatrixCellColor(prob, impact)}`}
                          onClick={() => {
                            if (cellRisks[0]) {
                              setSelectedRisk(cellRisks[0]);
                              setShowDetailDialog(true);
                            }
                          }}
                        >
                          <span className="text-xs font-bold text-slate-500/70">{scoreVal}</span>
                          {cellRisks.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {cellRisks.slice(0, 4).map((r) => (
                                <div
                                  key={r.id}
                                  className={`w-2.5 h-2.5 rounded-full ${getMatrixDotColor(prob, impact)} ring-1 ring-white dark:ring-slate-900`}
                                  title={r.title}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {[
            { label: ar ? "منخفض (1-4)" : "Low (1-4)", color: "bg-green-500" },
            { label: ar ? "متوسط (5-9)" : "Medium (5-9)", color: "bg-yellow-500" },
            { label: ar ? "عالي (10-15)" : "High (10-15)", color: "bg-orange-500" },
            { label: ar ? "حرج (16-25)" : "Critical (16-25)", color: "bg-red-500" },
          ].map((legend) => (
            <div key={legend.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${legend.color}`} />
              <span className="text-[10px] text-slate-500">{legend.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Risks Table */}
      {isLoading ? (
        <Card className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            ))}
          </div>
        </Card>
      ) : filteredRisks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <ShieldAlert className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            {ar ? "لا توجد مخاطر" : "No risks"}
          </h3>
          <p className="text-sm text-slate-500">
            {ar ? "ابدأ بإضافة خطر جديد" : "Start by adding a new risk"}
          </p>
        </div>
      ) : (
        <Card className="border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-500px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                  <TableHead className="text-xs font-semibold py-2.5 px-3">{ar ? "العنوان" : "Title"}</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 hidden lg:table-cell">{ar ? "المشروع" : "Project"}</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3">{ar ? "التصنيف" : "Category"}</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-center">{ar ? "احتمالية" : "Prob"}</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-center">{ar ? "تأثير" : "Impact"}</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 text-center">{ar ? "الدرجة" : "Score"}</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3">{ar ? "الاستراتيجية" : "Strategy"}</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3">{ar ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 px-3 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRisks.map((risk) => (
                  <TableRow
                    key={risk.id}
                    className={cn("group even:bg-slate-50/50 dark:even:bg-slate-800/20 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", risk.score >= 16 && "border-s-2 border-s-red-200 dark:border-s-red-800/50")}
                    onClick={() => { setSelectedRisk(risk); setShowDetailDialog(true); }}
                  >
                    <TableCell className="py-2.5 px-3">
                      <span className="text-xs font-medium truncate max-w-[180px] block">{risk.title}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 hidden lg:table-cell">
                      <span className="text-xs truncate max-w-[120px] block">
                        {risk.project ? (ar ? risk.project.name : risk.project.nameEn || risk.project.name) : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      {getCategoryBadge(risk.category, ar)}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {Array.from({length: 5}).map((_, i) => (
                          <div key={i} className={`w-1.5 h-3 rounded-sm ${i < risk.probability ? (risk.probability >= 4 ? "bg-red-500" : risk.probability >= 3 ? "bg-amber-500" : "bg-green-500") : "bg-slate-200 dark:bg-slate-700"}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {Array.from({length: 5}).map((_, i) => (
                          <div key={i} className={`w-1.5 h-3 rounded-sm ${i < risk.impact ? (risk.impact >= 4 ? "bg-red-500" : risk.impact >= 3 ? "bg-amber-500" : "bg-green-500") : "bg-slate-200 dark:bg-slate-700"}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-center">
                      <Badge className={`text-[10px] h-6 w-8 flex items-center justify-center font-bold ${getScoreColor(risk.score)} text-white border-0`}>
                        {risk.score}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      {getStrategyBadge(risk.strategy, ar)}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      {getStatusBadge(risk.status, ar)}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 text-slate-400 hover:text-slate-600" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={ar ? "start" : "end"} className="w-36">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedRisk(risk); setShowDetailDialog(true); }}>
                            <Eye className="h-3.5 w-3.5 me-2" />
                            {ar ? "عرض" : "View"}
                          </DropdownMenuItem>
                          {risk.status === "open" && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: risk.id, status: "mitigating" }); }}>
                              <ShieldAlert className="h-3.5 w-3.5 me-2" />
                              {ar ? "بدء التخفيف" : "Mitigate"}
                            </DropdownMenuItem>
                          )}
                          {(risk.status === "open" || risk.status === "mitigating") && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: risk.id, status: "resolved" }); }}>
                              <TrendingDown className="h-3.5 w-3.5 me-2" />
                              {ar ? "حل" : "Resolve"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(ar ? "هل أنت متأكد من الحذف؟" : "Delete this risk?")) {
                                deleteMutation.mutate(risk.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 me-2" />
                            {ar ? "حذف" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-teal-500" />
              {ar ? "خطر جديد" : "New Risk"}
            </DialogTitle>
            <DialogDescription>
              {ar ? "تسجيل خطر جديد وتحديد استراتيجية المعالجة" : "Register a new risk and define mitigation strategy"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "المشروع *" : "Project *"}</Label>
                <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder={ar ? "اختر مشروع" : "Select project"} /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{ar ? p.name : p.nameEn || p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "التصنيف" : "Category"}</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{ar ? c.ar : c.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{ar ? "عنوان الخطر *" : "Risk Title *"}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={ar ? "وصف الخطر" : "Risk description"}
              />
            </div>

            {/* Probability & Impact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{ar ? "الاحتمالية" : "Probability"}</Label>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formData.probability}</span>
                </div>
                <Slider
                  value={[formData.probability]}
                  onValueChange={([v]) => setFormData({ ...formData, probability: v })}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-[8px] text-slate-400 mt-1">
                  <span>{ar ? "نادر" : "Rare"}</span>
                  <span>{ar ? "مؤكد تقريباً" : "Almost Certain"}</span>
                </div>
              </div>
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{ar ? "التأثير" : "Impact"}</Label>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formData.impact}</span>
                </div>
                <Slider
                  value={[formData.impact]}
                  onValueChange={([v]) => setFormData({ ...formData, impact: v })}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-[8px] text-slate-400 mt-1">
                  <span>{ar ? "ضئيل" : "Insignificant"}</span>
                  <span>{ar ? "كارثي" : "Catastrophic"}</span>
                </div>
              </div>
            </div>

            {/* Score Display */}
            <div className={`flex items-center justify-center p-3 rounded-lg ${getScoreColor(score)} bg-opacity-10`}>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreTextColor(score)}`}>{score}</div>
                <div className="text-xs text-slate-500">{ar ? "درجة الخطر" : "Risk Score"}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "الاستراتيجية" : "Strategy"}</Label>
                <Select value={formData.strategy} onValueChange={(v) => setFormData({ ...formData, strategy: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {strategies.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{ar ? s.ar : s.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "المسؤول" : "Assignee"}</Label>
                <Select value={formData.assigneeId} onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}>
                  <SelectTrigger><SelectValue placeholder={ar ? "اختر مسؤول" : "Select assignee"} /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{ar ? "خطة التخفيف" : "Mitigation Plan"}</Label>
              <Textarea
                value={formData.mitigationPlan}
                onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })}
                placeholder={ar ? "وصف خطة تخفيف الخطر" : "Describe the risk mitigation plan"}
                rows={3}
              />
            </div>

            <Separator />

            {/* Action Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {ar ? "بنود العمل" : "Action Items"}
                </Label>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addNewAction}>
                  <Plus className="h-3 w-3 me-1" />
                  {ar ? "إضافة بند" : "Add Action"}
                </Button>
              </div>
              {newActions.length === 0 ? (
                <div className="text-center py-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-xs text-slate-400">{ar ? "لم يتم إضافة بنود عمل" : "No action items"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {newActions.map((action, index) => (
                    <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          {ar ? "بند عمل" : "Action"} {index + 1}
                        </span>
                        <button onClick={() => removeNewAction(index)} className="p-0.5 text-slate-400 hover:text-red-500">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          className="h-7 text-xs sm:col-span-2"
                          value={action.description}
                          onChange={(e) => updateNewAction(index, "description", e.target.value)}
                          placeholder={ar ? "وصف الإجراء" : "Action description"}
                        />
                        <Select value={action.assigneeId} onValueChange={(v) => updateNewAction(index, "assigneeId", v)}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder={ar ? "مسؤول" : "Assignee"} />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => createMutation.mutate({ ...formData, actions: newActions })}
              disabled={!formData.projectId || !formData.title || createMutation.isPending}
            >
              {createMutation.isPending ? (ar ? "جارٍ الإنشاء..." : "Creating...") : (ar ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRisk && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-teal-500" />
                  {selectedRisk.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedRisk.project ? (ar ? selectedRisk.project.name : selectedRisk.project.nameEn || selectedRisk.project.name) : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Risk Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-500">{ar ? "الاحتمالية" : "Probability"}</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedRisk.probability}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-500">{ar ? "التأثير" : "Impact"}</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedRisk.impact}</div>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${getScoreColor(selectedRisk.score)} bg-opacity-20`}>
                    <div className="text-[10px] text-slate-500">{ar ? "الدرجة" : "Score"}</div>
                    <Badge className={`text-sm font-bold ${getScoreColor(selectedRisk.score)} text-white border-0 h-7`}>
                      {selectedRisk.score}
                    </Badge>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-500">{ar ? "الحالة" : "Status"}</div>
                    <div className="mt-1">{getStatusBadge(selectedRisk.status, ar)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {getCategoryBadge(selectedRisk.category, ar)}
                  {getStrategyBadge(selectedRisk.strategy, ar)}
                </div>

                {selectedRisk.mitigationPlan && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {ar ? "خطة التخفيف" : "Mitigation Plan"}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      {selectedRisk.mitigationPlan}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Action Items */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {ar ? "بنود العمل" : "Action Items"} ({selectedRisk.actions.length})
                  </Label>

                  {selectedRisk.actions.length === 0 ? (
                    <div className="text-center py-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-slate-400">{ar ? "لا توجد بنود عمل" : "No action items"}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRisk.actions.map((action) => (
                        <div
                          key={action.id}
                          className={`p-3 rounded-lg border ${
                            action.completed
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50"
                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={action.completed}
                              onCheckedChange={(checked) => {
                                toggleActionMutation.mutate({ actionId: action.id, completed: checked === true });
                              }}
                              className="mt-0.5 h-4 w-4"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${action.completed ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>
                                {action.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {action.assignee && (
                                  <span className="text-[10px] text-slate-500">
                                    {action.assignee.name}
                                  </span>
                                )}
                                {action.dueDate && (
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(action.dueDate).toLocaleDateString(ar ? "ar-AE" : "en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

