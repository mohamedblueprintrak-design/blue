"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastFeedback } from "@/hooks/use-toast-feedback";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, getErrorMessage, type InvoiceFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Receipt,
  DollarSign,
  Clock,
  X,
  CheckCircle2,
  Wallet,
  FileWarning,
  Printer,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-utils";

// ===== Types =====
interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  remaining: number;
  status: string;
  clientId: string;
  projectId: string;
  client: { id: string; name: string; company: string };
  project: { id: string; name: string; nameEn: string; number: string };
  items: InvoiceItem[];
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
function formatCurrency(amount: number, ar: boolean) {
  return `${amount.toLocaleString(ar ? "ar-AE" : "en-US")} ${ar ? "د.إ" : "AED"}`;
}

function getStatusConfig(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string }> = {
    draft: { ar: "مسودة", en: "Draft", color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300" },
    sent: { ar: "مرسلة", en: "Sent", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300" },
    partially_paid: { ar: "مدفوعة جزئياً", en: "Partial", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300" },
    paid: { ar: "مدفوعة", en: "Paid", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300" },
    overdue: { ar: "متأخرة", en: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300" },
    cancelled: { ar: "ملغاة", en: "Cancelled", color: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400" },
  };
  return configs[status] || configs.draft;
}

function getEmptyLineItem(): InvoiceItem {
  return { description: "", quantity: 1, unitPrice: 0, total: 0 };
}

// ===== Main Component =====
interface InvoicesPageProps {
  language: "ar" | "en";
  projectId?: string;
}

export default function InvoicesPage({ language, projectId }: InvoicesPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const emptyForm = {
    number: "", clientId: "", projectId: projectId || "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    status: "draft" as string,
    items: [getEmptyLineItem()],
  };

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      number: "",
      clientId: "",
      projectId: projectId || "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "draft",
    },
  });
  const { register, handleSubmit: rhfHandleSubmit, formState: { errors }, reset, setValue, watch } = form;
  const [formData, setFormData] = useState(emptyForm);

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices${projectId ? `?projectId=${projectId}` : ''}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<ClientOption[]>({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) return [];
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const tax = subtotal * 0.05;
      const total = subtotal + tax;
      const items = data.items.map((i) => ({ ...i, total: i.quantity * i.unitPrice }));
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, items, subtotal, tax, total }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId] });
      setShowDialog(false);
      setFormData(emptyForm);
      toast.created(ar ? "الفاتورة" : "Invoice");
    },
    onError: () => {
      toast.error(ar ? "إنشاء الفاتورة" : "Create invoice");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyForm }) => {
      const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const tax = subtotal * 0.05;
      const total = subtotal + tax;
      const items = data.items.map((i) => ({ ...i, total: i.quantity * i.unitPrice }));
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, items, subtotal, tax, total }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId] });
      setEditInvoice(null);
      setFormData(emptyForm);
      toast.updated(ar ? "الفاتورة" : "Invoice");
    },
    onError: () => {
      toast.error(ar ? "تحديث الفاتورة" : "Update invoice");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId] });
      toast.deleted(ar ? "الفاتورة" : "Invoice");
    },
    onError: () => {
      toast.error(ar ? "حذف الفاتورة" : "Delete invoice");
    },
  });

  // Filter
  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client.name.toLowerCase().includes(search.toLowerCase()) ||
      (ar ? inv.project.name : inv.project.nameEn || inv.project.name).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedFiltered = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // PDF Export handler
  const handleExportPDF = (inv: Invoice) => {
    generateInvoicePDF({
      number: inv.number,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      subtotal: inv.subtotal,
      tax: inv.tax,
      total: inv.total,
      clientName: inv.client.name,
      clientCompany: inv.client.company,
      projectName: ar ? inv.project.name : inv.project.nameEn || inv.project.name,
      items: inv.items,
      status: inv.status,
    });
    toast.showSuccess(ar ? "تم تصدير الفاتورة PDF" : "Invoice PDF exported");
  };

  // Summary calculations
  const totalInvoices = filtered.reduce((s, i) => s + i.total, 0);
  const totalPaid = filtered.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = filtered.reduce((s, i) => s + i.remaining, 0);
  const overdueCount = filtered.filter((i) => i.status === "overdue").length;
  const paidCount = filtered.filter((i) => i.status === "paid").length;
  const pendingCount = filtered.filter((i) => i.status === "sent" || i.status === "partially_paid").length;
  const totalCount = filtered.length || 1;

  // Donut chart calculations (CSS conic-gradient)
  const paidPct = (paidCount / totalCount) * 360;
  const pendingPct = (pendingCount / totalCount) * 360;
  const overduePct = (overdueCount / totalCount) * 360;

  function getAmountColor(inv: Invoice) {
    if (inv.status === "overdue") return "text-red-600 dark:text-red-400";
    if (inv.status === "paid") return "text-emerald-600 dark:text-emerald-400";
    if (inv.status === "sent" || inv.status === "partially_paid") return "text-amber-600 dark:text-amber-400";
    return "text-slate-700 dark:text-slate-300";
  }

  // Form helpers
  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    reset({
      number: inv.number,
      clientId: inv.clientId,
      projectId: inv.projectId,
      issueDate: inv.issueDate.split("T")[0],
      dueDate: inv.dueDate.split("T")[0],
      status: inv.status,
    });
    setFormData({
      number: inv.number,
      clientId: inv.clientId,
      projectId: inv.projectId,
      issueDate: inv.issueDate.split("T")[0],
      dueDate: inv.dueDate.split("T")[0],
      status: inv.status,
      items: inv.items.length > 0 ? inv.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })) : [getEmptyLineItem()],
    });
  };

  const updateLineItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    newItems[idx].total = newItems[idx].quantity * newItems[idx].unitPrice;
    setFormData({ ...formData, items: newItems });
  };

  const addLineItem = () => setFormData({ ...formData, items: [...formData.items, getEmptyLineItem()] });
  const removeLineItem = (idx: number) => {
    if (formData.items.length <= 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });
  };

  const calcSubtotal = formData.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const calcTax = calcSubtotal * 0.05;
  const calcTotal = calcSubtotal + calcTax;

  const handleSave = (data: InvoiceFormData) => {
    const payload = { ...data, items: formData.items };
    if (editInvoice) {
      updateMutation.mutate({ id: editInvoice.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="py-0 gap-0"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Receipt className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{ar ? "الفواتير" : "Invoices"}</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {invoices.length} {ar ? "فاتورة" : "invoices"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder={ar ? "بحث..." : "Search..."} className="ps-9 h-8 text-sm rounded-lg" />
            </div>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "الكل" : "All"}</SelectItem>
                <SelectItem value="draft">{ar ? "مسودة" : "Draft"}</SelectItem>
                <SelectItem value="sent">{ar ? "مرسلة" : "Sent"}</SelectItem>
                <SelectItem value="partially_paid">{ar ? "جزئية" : "Partial"}</SelectItem>
                <SelectItem value="paid">{ar ? "مدفوعة" : "Paid"}</SelectItem>
                <SelectItem value="overdue">{ar ? "متأخرة" : "Overdue"}</SelectItem>
                <SelectItem value="cancelled">{ar ? "ملغاة" : "Cancelled"}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20" onClick={() => { reset(); setFormData(emptyForm); setShowDialog(true); }}>
              <Plus className="h-3.5 w-3.5 me-1" />{ar ? "فاتورة جديدة" : "New Invoice"}
            </Button>
          </div>
        </div>

        {/* Mini Donut Chart - Payment Status Distribution */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-3 shadow-sm">
          <div
            className="relative w-12 h-12 rounded-full shrink-0"
            style={{
              background: `conic-gradient(
                #10b981 0deg ${paidPct}deg,
                #f59e0b ${paidPct}deg ${paidPct + pendingPct}deg,
                #ef4444 ${paidPct + pendingPct}deg ${paidPct + pendingPct + overduePct}deg,
                #e2e8f0 ${paidPct + pendingPct + overduePct}deg 360deg
              )`,
            }}
          >
            <div className="absolute inset-[3px] rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">{filtered.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{ar ? "مدفوعة" : "Paid"}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{paidCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{ar ? "معلّقة" : "Pending"}</span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{ar ? "متأخرة" : "Overdue"}</span>
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 tabular-nums">{overdueCount}</span>
            </div>
          </div>
        </div>

        {/* Summary Cards with Gradient Backgrounds */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total */}
          <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Receipt className="h-3.5 w-3.5 text-white" /></div>
                <span className="text-xs text-teal-100">{ar ? "إجمالي الفواتير" : "Total Invoices"}</span>
              </div>
              <div className="text-xl font-bold text-white tabular-nums">{formatCurrency(totalInvoices, ar)}</div>
            </div>
          </Card>

          {/* Collected */}
          <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Wallet className="h-3.5 w-3.5 text-white" /></div>
                <span className="text-xs text-emerald-100">{ar ? "إجمالي المحصل" : "Total Collected"}</span>
              </div>
              <div className="text-xl font-bold text-white tabular-nums">{formatCurrency(totalPaid, ar)}</div>
            </div>
          </Card>

          {/* Outstanding */}
          <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><Clock className="h-3.5 w-3.5 text-white" /></div>
                <span className="text-xs text-amber-100">{ar ? "المتبقي" : "Outstanding"}</span>
              </div>
              <div className="text-xl font-bold text-white tabular-nums">{formatCurrency(totalOutstanding, ar)}</div>
            </div>
          </Card>

          {/* Overdue */}
          <Card className="py-0 gap-0 border-0 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm"><FileWarning className="h-3.5 w-3.5 text-white" /></div>
                <span className="text-xs text-red-100">{ar ? "متأخرة" : "Overdue"}</span>
              </div>
              <div className="text-xl font-bold text-white tabular-nums">{overdueCount}</div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm relative">
          <ScrollArea className="max-h-[calc(100vh-340px)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                  <TableHead className="text-xs font-semibold">{ar ? "الرقم" : "No."}</TableHead>
                  <TableHead className="text-xs font-semibold">{ar ? "العميل" : "Client"}</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">{ar ? "المشروع" : "Project"}</TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">{ar ? "تاريخ الإصدار" : "Issue"}</TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">{ar ? "تاريخ الاستحقاق" : "Due"}</TableHead>
                  <TableHead className="text-xs font-semibold text-start">{ar ? "المجموع" : "Total"}</TableHead>
                  <TableHead className="text-xs font-semibold text-start hidden sm:table-cell">{ar ? "الضريبة 5%" : "Tax 5%"}</TableHead>
                  <TableHead className="text-xs font-semibold text-start">{ar ? "الإجمالي" : "Grand Total"}</TableHead>
                  <TableHead className="text-xs font-semibold text-start hidden sm:table-cell">{ar ? "المدفوع" : "Paid"}</TableHead>
                  <TableHead className="text-xs font-semibold text-start">{ar ? "المتبقي" : "Remaining"}</TableHead>
                  <TableHead className="text-xs font-semibold">{ar ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-xs font-semibold text-end">{ar ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFiltered.map((inv, idx) => {
                  const sc = getStatusConfig(inv.status);
                  return (
                    <TableRow
                      key={inv.id}
                      className={cn(
                        "transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                        idx % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-slate-50/50 dark:bg-slate-800/20"
                      )}
                    >
                      <TableCell className="font-mono text-xs text-slate-500">{inv.number || "—"}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-900 dark:text-white max-w-[150px] truncate">{inv.client.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-slate-500">{ar ? inv.project.name : inv.project.nameEn || inv.project.name}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-slate-500">{new Date(inv.issueDate).toLocaleDateString(ar ? "ar-AE" : "en-US")}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-slate-500">{new Date(inv.dueDate).toLocaleDateString(ar ? "ar-AE" : "en-US")}</TableCell>
                      <TableCell className={cn("text-xs text-start tabular-nums font-mono", getAmountColor(inv))}>{formatCurrency(inv.subtotal, ar)}</TableCell>
                      <TableCell className={cn("text-xs text-start tabular-nums font-mono hidden sm:table-cell", getAmountColor(inv))}>{formatCurrency(inv.tax, ar)}</TableCell>
                      <TableCell className={cn("text-xs text-start font-medium tabular-nums font-mono", getAmountColor(inv))}>{formatCurrency(inv.total, ar)}</TableCell>
                      <TableCell className="text-xs text-start text-emerald-600 dark:text-emerald-400 tabular-nums font-mono hidden sm:table-cell">{formatCurrency(inv.paidAmount, ar)}</TableCell>
                      <TableCell className={cn("text-xs text-start font-medium tabular-nums font-mono", inv.remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>{formatCurrency(inv.remaining, ar)}</TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", sc.color)}>
                          {ar ? sc.ar : sc.en}
                        </span>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center gap-0.5 justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:text-slate-400" onClick={() => setPrintInvoice(inv)}><Printer className="h-3.5 w-3.5" /></Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{ar ? "طباعة" : "Print"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:text-slate-400" onClick={() => handleExportPDF(inv)}><FileText className="h-3.5 w-3.5" /></Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{ar ? "تصدير PDF" : "Export PDF"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inv)}><Pencil className="h-3.5 w-3.5" /></Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{ar ? "تعديل" : "Edit"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => { if (confirm(ar ? "حذف الفاتورة؟" : "Delete invoice?")) deleteMutation.mutate(inv.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{ar ? "حذف" : "Delete"}</TooltipContent>
                          </Tooltip>
                          {inv.status === "draft" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-teal-600 hover:text-teal-700"
                                  onClick={() => {
                                    fetch("/api/approvals", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        entityType: "invoice",
                                        entityId: inv.id,
                                        title: `${ar ? "موافقة فاتورة" : "Invoice approval"} - ${inv.number}`,
                                        description: inv.client.name,
                                        requestedBy: "المستخدم الحالي",
                                        assignedTo: "المدير",
                                        amount: inv.total,
                                      }),
                                    }).then(() => {
                                      toast.showSuccess(ar ? "تم إرسال طلب الموافقة" : "Approval request sent");
                                    });
                                  }}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">{ar ? "طلب موافقة" : "Request Approval"}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12 text-slate-400">
                      {ar ? "لا توجد فواتير" : "No invoices found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {ar ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                <span className="ms-2">({filtered.length} {ar ? "فاتورة" : "invoices"})</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      className={cn(
                        "h-7 w-7 text-xs",
                        currentPage === pageNum
                          ? "bg-teal-600 hover:bg-teal-700 text-white border-teal-600"
                          : ""
                      )}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          {/* Quick Total Floating Badge */}
          {filtered.length > 5 && (
            <div className="absolute bottom-3 end-3 z-10 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-teal-600/30 flex items-center gap-2">
              <Receipt className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">{ar ? "الإجمالي" : "Total"}</span>
              <span className="text-sm font-bold tabular-nums font-mono">{formatCurrency(totalInvoices, ar)}</span>
            </div>
          )}
        </div>

        {/* Print Invoice Dialog */}
        {printInvoice && (
          <Dialog open={!!printInvoice} onOpenChange={(open) => { if (!open) setPrintInvoice(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-teal-500" />
                  {ar ? "طباعة الفاتورة" : "Print Invoice"} — {printInvoice.number}
                </DialogTitle>
              </DialogHeader>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                <InvoicePrintContent invoice={printInvoice} ar={ar} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPrintInvoice(null)}>
                  {ar ? "إغلاق" : "Close"}
                </Button>
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  {ar ? "طباعة" : "Print"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Hidden Print Content */}
        {printInvoice && (
          <div className="print-only">
            <InvoicePrintContent invoice={printInvoice} ar={ar} />
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog || !!editInvoice} onOpenChange={(open) => { if (!open) { setShowDialog(false); setEditInvoice(null); reset(); setFormData(emptyForm); } }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editInvoice ? (ar ? "تعديل فاتورة" : "Edit Invoice") : (ar ? "فاتورة جديدة" : "New Invoice")}</DialogTitle>
              <DialogDescription>{editInvoice ? (ar ? "تعديل بيانات الفاتورة" : "Update invoice details") : (ar ? "إنشاء فاتورة جديدة" : "Create a new invoice")}</DialogDescription>
            </DialogHeader>

            <form onSubmit={rhfHandleSubmit(handleSave)} className="space-y-4">
              {/* Top row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{ar ? "رقم الفاتورة" : "Invoice No."} *</Label>
                  <Input {...register("number")} placeholder="INV-001" className="h-8 text-sm rounded-lg" />
                  {errors.number && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.number.message || "", ar)}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{ar ? "العميل" : "Client"} *</Label>
                  <Select value={watch("clientId")} onValueChange={(v) => { setValue("clientId", v); setFormData({ ...formData, clientId: v }); }}>
                    <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue placeholder={ar ? "اختر عميل" : "Select client"} /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {errors.clientId && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.clientId.message || "", ar)}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{ar ? "المشروع" : "Project"} *</Label>
                  <Select value={watch("projectId")} onValueChange={(v) => { setValue("projectId", v); setFormData({ ...formData, projectId: v }); }}>
                    <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue placeholder={ar ? "اختر مشروع" : "Select project"} /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{ar ? p.name : p.nameEn || p.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {errors.projectId && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.projectId.message || "", ar)}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{ar ? "الحالة" : "Status"}</Label>
                  <Select value={watch("status")} onValueChange={(v) => { setValue("status", v); setFormData({ ...formData, status: v }); }}>
                    <SelectTrigger className="h-8 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{ar ? "مسودة" : "Draft"}</SelectItem>
                      <SelectItem value="sent">{ar ? "مرسلة" : "Sent"}</SelectItem>
                      <SelectItem value="partially_paid">{ar ? "جزئية" : "Partially Paid"}</SelectItem>
                      <SelectItem value="paid">{ar ? "مدفوعة" : "Paid"}</SelectItem>
                      <SelectItem value="cancelled">{ar ? "ملغاة" : "Cancelled"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates - two columns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{ar ? "تاريخ الإصدار" : "Issue Date"} *</Label>
                  <Input type="date" {...register("issueDate")} className="h-8 text-sm rounded-lg" />
                  {errors.issueDate && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.issueDate.message || "", ar)}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{ar ? "تاريخ الاستحقاق" : "Due Date"} *</Label>
                  <Input type="date" {...register("dueDate")} className="h-8 text-sm rounded-lg" />
                  {errors.dueDate && <p className="text-red-500 text-xs mt-1">{getErrorMessage(errors.dueDate.message || "", ar)}</p>}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">{ar ? "بنود الفاتورة" : "Line Items"}</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={addLineItem}><Plus className="h-3 w-3 me-1" />{ar ? "إضافة بند" : "Add Item"}</Button>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-xs">{ar ? "الوصف" : "Description"}</TableHead>
                        <TableHead className="text-xs w-24">{ar ? "الكمية" : "Qty"}</TableHead>
                        <TableHead className="text-xs w-28">{ar ? "سعر الوحدة" : "Unit Price"}</TableHead>
                        <TableHead className="text-xs w-28 text-start">{ar ? "الإجمالي" : "Total"}</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, idx) => (
                        <TableRow key={idx} className={cn(
                          "transition-colors hover:bg-teal-50/50 dark:hover:bg-teal-950/10",
                          idx % 2 === 0
                            ? "bg-white dark:bg-slate-900"
                            : "bg-slate-50/50 dark:bg-slate-800/20"
                        )}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                                idx % 2 === 0
                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                              )}>
                                {idx + 1}
                              </span>
                              <Input value={item.description} onChange={(e) => updateLineItem(idx, "description", e.target.value)} placeholder={ar ? "وصف البند" : "Item description"} className="h-8 text-xs rounded-lg" />
                            </div>
                          </TableCell>
                          <TableCell><Input type="number" value={item.quantity} onChange={(e) => updateLineItem(idx, "quantity", parseFloat(e.target.value) || 0)} className="h-8 text-xs tabular-nums font-mono rounded-lg" /></TableCell>
                          <TableCell><Input type="number" value={item.unitPrice} onChange={(e) => updateLineItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="h-8 text-xs tabular-nums font-mono rounded-lg" /></TableCell>
                          <TableCell className="text-start text-sm font-medium tabular-nums font-mono">{formatCurrency(item.quantity * item.unitPrice, ar)}</TableCell>
                          <TableCell>
                            {formData.items.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeLineItem(idx)}><X className="h-3.5 w-3.5" /></Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals - Real-time Summary */}
              <div className="flex justify-end">
                <div className="w-72 rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{ar ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span className="tabular-nums font-mono text-slate-700 dark:text-slate-300">{formatCurrency(calcSubtotal, ar)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{ar ? "الضريبة (5%)" : "Tax (5%)"}</span>
                    <span className="tabular-nums font-mono text-slate-700 dark:text-slate-300">{formatCurrency(calcTax, ar)}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2.5">
                    <div className="flex justify-between text-base font-bold">
                      <span>{ar ? "الإجمالي" : "Total"}</span>
                      <span className="text-teal-600 dark:text-teal-400 tabular-nums font-mono">{formatCurrency(calcTotal, ar)}</span>
                    </div>
                  </div>
                  {calcTotal > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <DollarSign className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400">
                        {ar ? "شامل ضريبة القيمة المضافة" : "Inclusive of VAT"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); setEditInvoice(null); reset(); setFormData(emptyForm); }}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
              </Button>
            </DialogFooter>
          </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ===== Invoice Print Content =====
function InvoicePrintContent({ invoice, ar }: { invoice: Invoice; ar: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 space-y-5" dir={ar ? "rtl" : "ltr"}>
      {/* Company Header */}
      <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold">BluePrint</div>
            <div className="text-xs text-slate-500">{ar ? "نظام إدارة مكاتب الاستشارات الهندسية" : "Engineering Consultancy Management"}</div>
            <div className="text-xs text-slate-400 mt-0.5">{ar ? "الإمارات العربية المتحدة" : "United Arab Emirates"}</div>
          </div>
        </div>
        <div className="text-end">
          <div className="text-xs text-slate-500">{ar ? "فاتورة ضريبية" : "Tax Invoice"}</div>
          <div className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">{invoice.number}</div>
        </div>
      </div>

      {/* Dates & Client Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{ar ? "معلومات العميل" : "Client Info"}</div>
          <div className="text-sm font-semibold">{invoice.client.name}</div>
          {invoice.client.company && <div className="text-xs text-slate-500">{invoice.client.company}</div>}
          <div className="text-xs text-slate-400 mt-1">{ar ? "المشروع" : "Project"}: {ar ? invoice.project.name : invoice.project.nameEn || invoice.project.name}</div>
        </div>
        <div className="space-y-1 text-end">
          <div className="text-xs">
            <span className="text-slate-500">{ar ? "تاريخ الإصدار" : "Issue Date"}: </span>
            <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString(ar ? "ar-AE" : "en-US")}</span>
          </div>
          <div className="text-xs">
            <span className="text-slate-500">{ar ? "تاريخ الاستحقاق" : "Due Date"}: </span>
            <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString(ar ? "ar-AE" : "en-US")}</span>
          </div>
          <div className="text-xs">
            <span className="text-slate-500">{ar ? "الحالة" : "Status"}: </span>
            <span className="font-medium">{getStatusConfig(invoice.status)[ar ? "ar" : "en"]}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-3 py-2 text-start text-xs font-semibold text-slate-600 dark:text-slate-300">{ar ? "الوصف" : "Description"}</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 w-16">{ar ? "الكمية" : "Qty"}</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 w-24">{ar ? "سعر الوحدة" : "Unit Price"}</th>
              <th className="px-3 py-2 text-end text-xs font-semibold text-slate-600 dark:text-slate-300 w-28">{ar ? "الإجمالي" : "Total"}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50 dark:bg-slate-800/20" : ""}>
                <td className="px-3 py-2">{item.description}</td>
                <td className="px-3 py-2 text-center font-mono tabular-nums">{item.quantity}</td>
                <td className="px-3 py-2 text-center font-mono tabular-nums">{item.unitPrice.toLocaleString()} AED</td>
                <td className="px-3 py-2 text-end font-mono tabular-nums font-medium">{item.total.toLocaleString()} AED</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{ar ? "المجموع الفرعي" : "Subtotal"}</span>
            <span className="font-mono tabular-nums">{invoice.subtotal.toLocaleString()} AED</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{ar ? "ضريبة القيمة المضافة (5%)" : "VAT (5%)"}</span>
            <span className="font-mono tabular-nums">{invoice.tax.toLocaleString()} AED</span>
          </div>
          <div className="border-t-2 border-teal-500 dark:border-teal-400 pt-1.5 flex justify-between text-base font-bold">
            <span>{ar ? "الإجمالي" : "Total"}</span>
            <span className="text-teal-600 dark:text-teal-400 font-mono tabular-nums">{invoice.total.toLocaleString()} AED</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {ar ? "شكراً لتعاملكم معنا" : "Thank you for your business"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          BluePrint — {ar ? "الإمارات العربية المتحدة" : "United Arab Emirates"}
        </p>
      </div>
    </div>
  );
}
