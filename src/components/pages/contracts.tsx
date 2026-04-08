"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastFeedback } from "@/hooks/use-toast-feedback";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contractSchema, getErrorMessage, type ContractFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Calendar,
  Building2,
  FileText,
  User,
  FileSignature,
  DollarSign,
  TrendingUp,
  Sparkles,
  Inbox,
} from "lucide-react";

// ===== Types =====
interface ContractItem {
  id: string;
  number: string;
  title: string;
  value: number;
  type: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  clientId: string;
  projectId: string;
  client: { id: string; name: string; company: string };
  project: { id: string; name: string; nameEn: string; number: string };
  _count: { amendments: number };
}

interface ContractDetail extends ContractItem {
  amendments: Amendment[];
  client: { id: string; name: string; company: string; email: string; phone: string };
  project: { id: string; name: string; nameEn: string; number: string; status: string; type: string };
}

interface Amendment {
  id: string;
  number: string;
  description: string;
  date: string;
  status: string;
}

interface ProjectOption {
  id: string;
  name: string;
  nameEn: string;
  number: string;
}

interface ClientOption {
  id: string;
  name: string;
  company: string;
}

// ===== Helpers =====
function getStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string; pill: string }> = {
    draft: {
      ar: "مسودة", en: "Draft",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      pill: "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300",
    },
    pending_signature: {
      ar: "بانتظار التوقيع", en: "Pending Signature",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
      pill: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 dark:from-amber-900/50 dark:to-amber-800/50 dark:text-amber-300",
    },
    active: {
      ar: "نشط", en: "Active",
      color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
      pill: "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 dark:from-emerald-900/50 dark:to-emerald-800/50 dark:text-emerald-300",
    },
    expired: {
      ar: "منتهي", en: "Expired",
      color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      pill: "bg-gradient-to-r from-red-100 to-red-200 text-red-700 dark:from-red-900/50 dark:to-red-800/50 dark:text-red-300",
    },
    completed: {
      ar: "مكتمل", en: "Completed",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      pill: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-300",
    },
  };
  return configs[status] || configs.draft;
}

function getTypeLabel(type: string, ar: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    engineering_services: { ar: "خدمات هندسية", en: "Engineering Services" },
    construction: { ar: "بناء", en: "Construction" },
    consulting: { ar: "استشارات", en: "Consulting" },
    maintenance: { ar: "صيانة", en: "Maintenance" },
  };
  return ar ? (labels[type]?.ar || type) : (labels[type]?.en || type);
}

function getAmendmentStatus(status: string, ar: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    pending: { ar: "معلّق", en: "Pending" },
    approved: { ar: "معتمد", en: "Approved" },
    rejected: { ar: "مرفوض", en: "Rejected" },
  };
  return ar ? (labels[status]?.ar || status) : (labels[status]?.en || status);
}

// ===== Main Contracts Component =====
interface ContractsPageProps {
  language: "ar" | "en";
  projectId?: string;
}

export default function ContractsPage({ language, projectId }: ContractsPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editContract, setEditContract] = useState<ContractItem | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);

  const emptyForm = {
    number: "", title: "", clientId: "", projectId: projectId || "",
    value: "0", type: "engineering_services", startDate: "", endDate: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: emptyForm,
  });
  const { register, handleSubmit: rhfHandleSubmit, formState: { errors }, reset, setValue, watch } = form;

  // Fetch contracts
  const { data: contracts = [], isLoading } = useQuery<ContractItem[]>({
    queryKey: ["contracts", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/contracts${projectId ? `?projectId=${projectId}` : ''}`);
      if (!res.ok) throw new Error("Failed to fetch contracts");
      return res.json();
    },
  });

  // Fetch contract detail
  const { data: contractDetail } = useQuery<ContractDetail>({
    queryKey: ["contract-detail", selectedContract?.id],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${selectedContract!.id}`);
      if (!res.ok) throw new Error("Failed to fetch contract detail");
      return res.json();
    },
    enabled: !!selectedContract,
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery<ClientOption[]>({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((c: { id: string; name: string; company: string }) => ({
        id: c.id, name: c.name, company: c.company,
      }));
    },
  });

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery<ProjectOption[]>({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const res = await fetch("/api/projects-simple");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create contract");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", projectId] });
      setShowAddDialog(false);
      setFormData(emptyForm);
      toast.created(ar ? "العقد" : "Contract");
    },
    onError: () => {
      toast.error(ar ? "إنشاء العقد" : "Create contract");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update contract");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", projectId] });
      queryClient.invalidateQueries({ queryKey: ["contract-detail"] });
      setEditContract(null);
      setFormData(emptyForm);
      toast.updated(ar ? "العقد" : "Contract");
    },
    onError: () => {
      toast.error(ar ? "تحديث العقد" : "Update contract");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", projectId] });
      setSelectedContract(null);
      toast.deleted(ar ? "العقد" : "Contract");
    },
    onError: () => {
      toast.error(ar ? "حذف العقد" : "Delete contract");
    },
  });

  const openEditDialog = (contract: ContractItem) => {
    setEditContract(contract);
    const values = {
      number: contract.number,
      title: contract.title,
      clientId: contract.clientId,
      projectId: contract.projectId,
      value: String(contract.value),
      type: contract.type,
      startDate: contract.startDate ? contract.startDate.split("T")[0] : "",
      endDate: contract.endDate ? contract.endDate.split("T")[0] : "",
    };
    setFormData(values);
    reset(values);
  };

  const openAddDialog = () => {
    setFormData(emptyForm);
    reset(emptyForm);
    setShowAddDialog(true);
  };

  const handleSave = (data: ContractFormData) => {
    if (editContract) {
      updateMutation.mutate({ id: editContract.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filter contracts
  const filteredContracts = contracts.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.number.toLowerCase().includes(search.toLowerCase()) ||
      c.client.name.toLowerCase().includes(search.toLowerCase()) ||
      c.project.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Calculate totals
  const totalValue = filteredContracts.reduce((sum, c) => sum + c.value, 0);
  const activeValue = filteredContracts
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <FileSignature className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {ar ? "العقود" : "Contracts"}
              </h2>
              <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5">
                {contracts.length}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {ar ? "إدارة وتتبع العقود" : "Manage and track contracts"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "بحث في العقود..." : "Search contracts..."}
              className="ps-9 h-8 text-sm rounded-lg"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg">
              <SelectValue placeholder={ar ? "الحالة" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
              <SelectItem value="draft">{ar ? "مسودة" : "Draft"}</SelectItem>
              <SelectItem value="pending_signature">{ar ? "بانتظار التوقيع" : "Pending"}</SelectItem>
              <SelectItem value="active">{ar ? "نشط" : "Active"}</SelectItem>
              <SelectItem value="expired">{ar ? "منتهي" : "Expired"}</SelectItem>
              <SelectItem value="completed">{ar ? "مكتمل" : "Completed"}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20"
            onClick={openAddDialog}
          >
            <Plus className="h-3.5 w-3.5 me-1" />
            {ar ? "عقد جديد" : "New Contract"}
          </Button>
        </div>
      </div>

      {/* Summary Cards with Gradient Backgrounds */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Contracts */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <FileText className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{ar ? "إجمالي العقود" : "Total Contracts"}</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {filteredContracts.length}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {ar ? `${contracts.length} عقد مسجل` : `${contracts.length} registered`}
            </p>
          </div>
        </Card>

        {/* Total Value */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <DollarSign className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-xs text-teal-600 dark:text-teal-400">{ar ? "إجمالي القيمة" : "Total Value"}</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {formatCurrency(totalValue, ar)}
            </div>
            <p className="text-[10px] text-teal-500/60 dark:text-teal-400/60 mt-1">
              {ar ? "جميع العقود" : "All contracts"}
            </p>
          </div>
        </Card>

        {/* Active Contracts */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">{ar ? "العقود النشطة" : "Active Contracts"}</span>
            </div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
              {contracts.filter((c) => c.status === "active").length}
            </div>
            <p className="text-[10px] text-emerald-500/60 dark:text-emerald-400/60 mt-1">
              {ar ? "قيد التنفيذ" : "In progress"}
            </p>
          </div>
        </Card>

        {/* Active Value */}
        <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xs text-violet-600 dark:text-violet-400">{ar ? "قيمة النشطة" : "Active Value"}</span>
            </div>
            <div className="text-xl font-bold text-violet-700 dark:text-violet-300 font-mono tabular-nums">
              {formatCurrency(activeValue, ar)}
            </div>
            <p className="text-[10px] text-violet-500/60 dark:text-violet-400/60 mt-1">
              {ar ? "عقود سارية المفعول" : "Active value"}
            </p>
          </div>
        </Card>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={cn(
          "flex-1 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm",
          selectedContract && "hidden lg:block"
        )}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                <TableHead className="text-xs font-semibold">{ar ? "الرقم" : "No."}</TableHead>
                <TableHead className="text-xs font-semibold">{ar ? "العنوان" : "Title"}</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">{ar ? "العميل" : "Client"}</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">{ar ? "المشروع" : "Project"}</TableHead>
                <TableHead className="text-xs font-semibold">{ar ? "القيمة" : "Value"}</TableHead>
                <TableHead className="text-xs font-semibold hidden sm:table-cell">{ar ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-xs font-semibold text-start">{ar ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract, idx) => {
                const statusCfg = getStatusConfig(contract.status);
                return (
                  <TableRow
                    key={contract.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "even:bg-slate-50/50 dark:even:bg-slate-800/20",
                      selectedContract?.id === contract.id && "bg-teal-50/50 dark:bg-teal-950/20"
                    )}
                    onClick={() => setSelectedContract(contract)}
                  >
                    <TableCell className="font-mono text-xs text-slate-500">
                      {contract.number || "—"}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                      {contract.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-600 dark:text-slate-300 text-xs">
                      {contract.client.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-500 text-xs">
                      {ar ? contract.project.name : contract.project.nameEn || contract.project.name}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white text-sm font-mono tabular-nums">
                      <span className="text-slate-400 dark:text-slate-500">{ar ? "د.إ" : "AED"} </span>{contract.value.toLocaleString(ar ? "ar-AE" : "en-US")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium",
                        statusCfg.pill
                      )}>
                        {ar ? statusCfg.ar : statusCfg.en}
                      </span>
                    </TableCell>
                    <TableCell className="text-start">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(contract); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(ar ? `حذف العقد "${contract.title}"؟` : `Delete "${contract.title}"?`)) {
                              deleteMutation.mutate(contract.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredContracts.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Inbox className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {ar ? "لا توجد عقود" : "No contracts found"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {ar ? "أضف عقدًا جديدًا للبدء" : "Add a new contract to get started"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                        onClick={openAddDialog}
                      >
                        <Plus className="h-3.5 w-3.5 me-1" />
                        {ar ? "عقد جديد" : "New Contract"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detail Panel */}
        {selectedContract && contractDetail && (
          <ContractDetailPanel
            contract={contractDetail}
            ar={ar}
            onClose={() => setSelectedContract(null)}
            onEdit={() => openEditDialog(selectedContract)}
          />
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || !!editContract}
        onOpenChange={(open) => {
          if (!open) { setShowAddDialog(false); setEditContract(null); setFormData(emptyForm); }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editContract ? (ar ? "تعديل عقد" : "Edit Contract") : (ar ? "عقد جديد" : "New Contract")}
            </DialogTitle>
            <DialogDescription>
              {editContract
                ? (ar ? "تعديل بيانات العقد" : "Edit contract information")
                : (ar ? "إضافة عقد جديد" : "Add a new contract")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={rhfHandleSubmit(handleSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "رقم العقد" : "Contract No."} *</Label>
                <Input
                  {...register("number")}
                  placeholder={ar ? "رقم العقد" : "Contract number"}
                  className={cn("h-8 text-sm rounded-lg", errors.number && "border-red-500")}
                />
                {errors.number && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.number.message || "", ar)}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "العنوان" : "Title"} *</Label>
                <Input
                  {...register("title")}
                  placeholder={ar ? "عنوان العقد" : "Contract title"}
                  className={cn("h-8 text-sm rounded-lg", errors.title && "border-red-500")}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.title.message || "", ar)}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "العميل" : "Client"} *</Label>
                <Select
                  value={watch("clientId")}
                  onValueChange={(v) => setValue("clientId", v)}
                >
                  <SelectTrigger className={cn("h-8 text-sm rounded-lg", errors.clientId && "border-red-500")}>
                    <SelectValue placeholder={ar ? "اختر عميل" : "Select client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.clientId.message || "", ar)}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "المشروع" : "Project"} *</Label>
                <Select
                  value={watch("projectId")}
                  onValueChange={(v) => setValue("projectId", v)}
                >
                  <SelectTrigger className={cn("h-8 text-sm rounded-lg", errors.projectId && "border-red-500")}>
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
                {errors.projectId && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.projectId.message || "", ar)}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "القيمة (د.إ)" : "Value (AED)"} *</Label>
                <Input
                  type="number"
                  {...register("value")}
                  placeholder="0"
                  className={cn("h-8 text-sm font-mono tabular-nums rounded-lg", errors.value && "border-red-500")}
                />
                {errors.value && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.value.message || "", ar)}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "النوع" : "Type"}</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(v) => setValue("type", v)}
                >
                  <SelectTrigger className="h-8 text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering_services">{ar ? "خدمات هندسية" : "Engineering Services"}</SelectItem>
                    <SelectItem value="construction">{ar ? "بناء" : "Construction"}</SelectItem>
                    <SelectItem value="consulting">{ar ? "استشارات" : "Consulting"}</SelectItem>
                    <SelectItem value="maintenance">{ar ? "صيانة" : "Maintenance"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "تاريخ البدء" : "Start Date"}</Label>
                <Input
                  type="date"
                  {...register("startDate")}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "تاريخ الانتهاء" : "End Date"}</Label>
                <Input
                  type="date"
                  {...register("endDate")}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
            </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => { setShowAddDialog(false); setEditContract(null); setFormData(emptyForm); reset(); }}
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending)
                ? (ar ? "جارٍ الحفظ..." : "Saving...")
                : (ar ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Contract Detail Panel =====
function ContractDetailPanel({ contract, ar, onClose, onEdit }: { contract: ContractDetail; ar: boolean; onClose: () => void; onEdit: () => void }) {
  const statusCfg = getStatusConfig(contract.status);

  return (
    <div className="w-full lg:w-[420px] flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {ar ? "تفاصيل العقد" : "Contract Details"}
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 lg:hidden" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="p-4 space-y-4">
          {/* Contract Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex-1 truncate">
                {contract.title}
              </h4>
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                statusCfg.pill
              )}>
                {ar ? statusCfg.ar : statusCfg.en}
              </span>
            </div>

            {/* Contract Value - Teal Accent */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                <span className="text-xs text-teal-600 dark:text-teal-400">
                  {ar ? "قيمة العقد" : "Contract Value"}
                </span>
              </div>
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-300 font-mono tabular-nums">
                {contract.value.toLocaleString(ar ? "ar-AE" : "en-US")} <span className="text-sm font-medium">{ar ? "د.إ" : "AED"}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              {contract.number && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{ar ? "رقم العقد" : "No."}</span>
                    <span className="font-mono text-xs">{contract.number}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{ar ? "العميل" : "Client"}</span>
                  <span className="text-xs">{contract.client.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{ar ? "المشروع" : "Project"}</span>
                  <span className="text-xs">{ar ? contract.project.name : contract.project.nameEn || contract.project.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 block">{ar ? "المدة" : "Duration"}</span>
                  <span className="text-xs">
                    {contract.startDate && (
                      <>{new Date(contract.startDate).toLocaleDateString(ar ? "ar-AE" : "en-US")}
                      {contract.endDate && (
                        <> — {new Date(contract.endDate).toLocaleDateString(ar ? "ar-AE" : "en-US")}</>
                      )}</>
                    )}
                    {!contract.startDate && (ar ? "غير محدد" : "Not specified")}
                  </span>
                </div>
              </div>
              {/* Contract Timeline Visual */}
              {contract.startDate && contract.endDate && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1.5">
                    <span>{new Date(contract.startDate).toLocaleDateString(ar ? "ar-AE" : "en-US", { month: "short", year: "2-digit" })}</span>
                    <span>{new Date(contract.endDate).toLocaleDateString(ar ? "ar-AE" : "en-US", { month: "short", year: "2-digit" })}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {/* Full bar */}
                    <div className={cn(
                      "absolute inset-y-0 start-0 rounded-full",
                      contract.status === "expired"
                        ? "bg-red-200 dark:bg-red-900/40"
                        : contract.status === "completed"
                          ? "bg-emerald-200 dark:bg-emerald-900/40"
                          : "bg-teal-200 dark:bg-teal-900/40"
                    )} />
                    {/* Elapsed portion */}
                    {(() => {
                      const start = new Date(contract.startDate).getTime();
                      const end = new Date(contract.endDate).getTime();
                      const now = Date.now();
                      const elapsed = Math.min(Math.max((now - start) / (end - start), 0), 1);
                      return (
                        <div
                          className={cn(
                            "absolute inset-y-0 start-0 rounded-full transition-all",
                            contract.status === "expired"
                              ? "bg-red-500"
                              : contract.status === "completed"
                                ? "bg-emerald-500"
                                : "bg-teal-500"
                          )}
                          style={{ width: `${elapsed * 100}%` }}
                        />
                      );
                    })()}
                    {/* Today marker */}
                    {(() => {
                      const start = new Date(contract.startDate).getTime();
                      const end = new Date(contract.endDate).getTime();
                      const now = Date.now();
                      const pct = Math.min(Math.max((now - start) / (end - start), 0), 1);
                      if (pct > 0 && pct < 1) {
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10"
                            style={{ left: `${pct * 100}%` }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs rounded-full">
                  {getTypeLabel(contract.type, ar)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Amendments Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                {ar ? "التعديلات" : "Amendments"}
              </h5>
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                contract._count?.amendments > 2
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              )}>
                {contract._count?.amendments || 0}
              </span>
            </div>
            {contract.amendments.length > 0 ? (
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute start-[15px] top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-700" />
                {contract.amendments.map((amendment, idx) => (
                  <div
                    key={amendment.id}
                    className="relative ps-10 pb-4 last:pb-0"
                  >
                    {/* Numbered circle */}
                    <div className={cn(
                      "absolute start-0 top-0.5 w-[31px] h-[31px] rounded-full flex items-center justify-center text-[10px] font-bold z-10 border-2",
                      amendment.status === "approved"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800"
                        : amendment.status === "rejected"
                          ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800"
                          : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {amendment.number || (ar ? `تعديل ${idx + 1}` : `Amendment ${idx + 1}`)}
                        </span>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                          amendment.status === "approved"
                            ? "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 dark:from-emerald-900/50 dark:to-emerald-800/50 dark:text-emerald-300"
                            : amendment.status === "rejected"
                              ? "bg-gradient-to-r from-red-100 to-red-200 text-red-700 dark:from-red-900/50 dark:to-red-800/50 dark:text-red-300"
                              : "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 dark:from-amber-900/50 dark:to-amber-800/50 dark:text-amber-300"
                        )}>
                          {getAmendmentStatus(amendment.status, ar)}
                        </span>
                      </div>
                      {amendment.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {amendment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(amendment.date).toLocaleDateString(ar ? "ar-AE" : "en-US")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {ar ? "لا توجد تعديلات" : "No amendments"}
                </p>
                <p className="text-[10px] text-slate-400/60 dark:text-slate-500/60 mt-0.5">
                  {ar ? "ستظهر التعديلات هنا عند إضافتها" : "Amendments will appear here when added"}
                </p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
