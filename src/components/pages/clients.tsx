"use client";

import { useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, getErrorMessage, type ClientFormData } from "@/lib/validations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastFeedback } from "@/hooks/use-toast-feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  FileSignature,
  Users,
  X,
  UserCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Language =====
function getLangSnapshot(): "ar" | "en" {
  if (typeof window === "undefined") return "ar";
  return (localStorage.getItem("blueprint-lang") as "ar" | "en") || "ar";
}
function getLangServerSnapshot(): "ar" | "en" { return "ar"; }
function subscribeLang(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("blueprint-lang-change", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("blueprint-lang-change", cb);
  };
}
function useLang() {
  return useSyncExternalStore(subscribeLang, getLangSnapshot, getLangServerSnapshot);
}

// ===== Types =====
interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  creditLimit: number;
  creditUsed: number;
  paymentTerms: string;
  _count: { projects: number; invoices: number; contracts: number };
  projects?: ClientProject[];
  invoices?: ClientInvoice[];
  contracts?: ClientContract[];
  interactions?: ClientInteraction[];
}

interface ClientProject {
  id: string;
  number: string;
  name: string;
  nameEn: string;
  status: string;
  type: string;
}

interface ClientInvoice {
  id: string;
  number: string;
  total: number;
  paidAmount: number;
  remaining: number;
  status: string;
  issueDate: string;
  dueDate: string;
}

interface ClientContract {
  id: string;
  number: string;
  title: string;
  value: number;
  type: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface ClientInteraction {
  id: string;
  type: string;
  date: string;
  subject: string;
  description: string;
  outcome: string;
  projectId: string;
}

// ===== Helpers =====
function getContractStatusBadge(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string }> = {
    draft: { ar: "مسودة", en: "Draft", color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300" },
    pending_signature: { ar: "بانتظار التوقيع", en: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300" },
    active: { ar: "نشط", en: "Active", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300" },
    expired: { ar: "منتهي", en: "Expired", color: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300" },
    completed: { ar: "مكتمل", en: "Completed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300" },
  };
  return configs[status] || configs.draft;
}

function getInvoiceStatusBadge(status: string) {
  const configs: Record<string, { ar: string; en: string; color: string }> = {
    draft: { ar: "مسودة", en: "Draft", color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300" },
    sent: { ar: "مرسلة", en: "Sent", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300" },
    partially_paid: { ar: "مدفوعة جزئياً", en: "Partial", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300" },
    paid: { ar: "مدفوعة", en: "Paid", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300" },
    overdue: { ar: "متأخرة", en: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300" },
    cancelled: { ar: "ملغاة", en: "Cancelled", color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300" },
  };
  return configs[status] || configs.draft;
}

function getInteractionIcon(type: string) {
  switch (type) {
    case "meeting": return Users;
    case "call": return Phone;
    case "email": return Mail;
    default: return FileText;
  }
}

function formatCurrency(amount: number, ar: boolean) {
  return `${amount.toLocaleString(ar ? "ar-AE" : "en-US")} ${ar ? "د.إ" : "AED"}`;
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300",
    "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",
    "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
    "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300",
    "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ===== Main Clients Component =====
interface ClientsPageProps {
  language: "ar" | "en";
}

export default function ClientsPage({ language }: ClientsPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar });
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form
  const emptyForm: ClientFormData = {
    name: "", company: "", email: "", phone: "", address: "",
    taxNumber: "", creditLimit: "0", paymentTerms: "",
  };
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyForm,
  });
  const { register, handleSubmit: rhfHandleSubmit, formState: { errors }, reset } = form;

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  // Fetch client detail
  const { data: clientDetail } = useQuery<Client>({
    queryKey: ["client-detail", selectedClient?.id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${selectedClient!.id}`);
      if (!res.ok) throw new Error("Failed to fetch client detail");
      return res.json();
    },
    enabled: !!selectedClient,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create client");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setShowAddDialog(false);
      reset();
      toast.created(ar ? "العميل" : "Client");
    },
    onError: () => {
      toast.error(ar ? "إنشاء العميل" : "Create client");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update client");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-detail"] });
      setEditClient(null);
      reset();
      toast.updated(ar ? "العميل" : "Client");
    },
    onError: () => {
      toast.error(ar ? "تحديث العميل" : "Update client");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSelectedClient(null);
      toast.deleted(ar ? "العميل" : "Client");
    },
    onError: () => {
      toast.error(ar ? "حذف العميل" : "Delete client");
    },
  });

  const openEditDialog = (client: Client) => {
    setEditClient(client);
    reset({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      taxNumber: client.taxNumber,
      creditLimit: String(client.creditLimit),
      paymentTerms: client.paymentTerms,
    });
  };

  const openAddDialog = () => {
    reset();
    setShowAddDialog(true);
  };

  const handleSave = (data: ClientFormData) => {
    if (editClient) {
      updateMutation.mutate({ id: editClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filter clients
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <UserCircle className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {ar ? "العملاء" : "Clients"}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {clients.length} {ar ? "عميل" : "clients"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ar ? "بحث عن عميل..." : "Search clients..."}
                className="ps-9 h-8 text-sm rounded-lg"
              />
            </div>
            <Button
              size="sm"
              className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm shadow-teal-600/20"
              onClick={openAddDialog}
            >
              <Plus className="h-3.5 w-3.5 me-1" />
              {ar ? "عميل جديد" : "New Client"}
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Table */}
          <div className={cn("flex-1 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm", selectedClient ? "hidden lg:block" : "")}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-50/80 dark:bg-slate-800/50">
                  <TableHead className="text-xs font-semibold">{ar ? "الاسم" : "Name"}</TableHead>
                  <TableHead className="text-xs font-semibold">{ar ? "الشركة" : "Company"}</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">{ar ? "البريد" : "Email"}</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">{ar ? "الهاتف" : "Phone"}</TableHead>
                  <TableHead className="text-xs font-semibold hidden sm:table-cell">{ar ? "المشاريع" : "Projects"}</TableHead>
                  <TableHead className="text-xs font-semibold hidden sm:table-cell">{ar ? "حد الائتمان" : "Credit"}</TableHead>
                  <TableHead className="text-xs font-semibold text-end">{ar ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client, idx) => {
                  const creditPct = client.creditLimit > 0 ? Math.min((client.creditUsed / client.creditLimit) * 100, 100) : 0;
                  return (
                    <TableRow
                      key={client.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                        idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20",
                        selectedClient?.id === client.id && "bg-teal-50/50 dark:bg-teal-950/20"
                      )}
                      onClick={() => setSelectedClient(client)}
                    >
                      {/* Avatar + Name */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", getAvatarColor(client.name))}>
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {client.name}
                            </div>
                            {client.company && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                {client.company}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                        {client.company || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-500 text-xs">
                        {client.email || "—"}
                      </TableCell>
                      {/* Clickable phone */}
                      <TableCell className="hidden md:table-cell text-xs">
                        {client.phone ? (
                          <a
                            href={`tel:${client.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {client._count.projects}
                        </Badge>
                      </TableCell>
                      {/* Credit limit progress bar */}
                      <TableCell className="hidden sm:table-cell">
                        <div className="w-24 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 dark:text-slate-400 tabular-nums font-mono">
                              {formatCurrency(client.creditUsed, ar)}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">
                              / {formatCurrency(client.creditLimit, ar)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                creditPct >= 80 ? "bg-red-500" : creditPct >= 50 ? "bg-amber-500" : "bg-teal-500"
                              )}
                              style={{ width: `${creditPct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center gap-0.5 justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{ar ? "عرض" : "View"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); openEditDialog(client); }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{ar ? "تعديل" : "Edit"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(ar ? `حذف العميل "${client.name}"؟` : `Delete "${client.name}"?`)) {
                                    deleteMutation.mutate(client.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{ar ? "حذف" : "Delete"}</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredClients.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      {ar ? "لا يوجد عملاء" : "No clients found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Detail Panel */}
          {selectedClient && clientDetail && (
            <ClientDetailPanel
              client={clientDetail}
              ar={ar}
              onClose={() => setSelectedClient(null)}
              onEdit={() => openEditDialog(selectedClient)}
            />
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog
          open={showAddDialog || !!editClient}
          onOpenChange={(open) => {
            if (!open) { setShowAddDialog(false); setEditClient(null); reset(); }
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editClient ? (ar ? "تعديل عميل" : "Edit Client") : (ar ? "عميل جديد" : "New Client")}
              </DialogTitle>
              <DialogDescription>
                {editClient
                  ? (ar ? "تعديل بيانات العميل" : "Edit client information")
                  : (ar ? "إضافة عميل جديد" : "Add a new client")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={rhfHandleSubmit(handleSave)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "الاسم" : "Name"} *</Label>
                  <Input {...register("name")} placeholder={ar ? "اسم العميل" : "Client name"} className={cn(errors.name && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} />
                  {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.name.message || "", ar)}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "الشركة" : "Company"}</Label>
                  <Input {...register("company")} placeholder={ar ? "اسم الشركة" : "Company name"} className={cn(errors.company && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} />
                  {errors.company && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.company.message || "", ar)}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "البريد" : "Email"}</Label>
                  <Input type="email" {...register("email")} placeholder="email@example.com" className={cn(errors.email && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} />
                  {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.email.message || "", ar)}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "الهاتف" : "Phone"}</Label>
                  <Input {...register("phone")} placeholder="+971 XX XXX XXXX" className={cn(errors.phone && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.phone.message || "", ar)}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "العنوان" : "Address"}</Label>
                <Input {...register("address")} placeholder={ar ? "عنوان العميل" : "Client address"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "الرقم الضريبي" : "Tax Number"}</Label>
                  <Input {...register("taxNumber")} placeholder={ar ? "الرقم الضريبي" : "Tax number"} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{ar ? "حد الائتمان" : "Credit Limit"} ({ar ? "د.إ" : "AED"})</Label>
                  <Input type="number" {...register("creditLimit")} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{ar ? "شروط الدفع" : "Payment Terms"}</Label>
                <Input {...register("paymentTerms")} placeholder={ar ? "مثال: 30 يوم" : "e.g., Net 30"} />
              </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowAddDialog(false); setEditClient(null); reset(); }}
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white"
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
    </TooltipProvider>
  );
}

// ===== Client Detail Panel =====
function ClientDetailPanel({ client, ar, onClose, onEdit }: { client: Client; ar: boolean; onClose: () => void; onEdit: () => void }) {
  const creditPct = client.creditLimit > 0 ? Math.min((client.creditUsed / client.creditLimit) * 100, 100) : 0;

  return (
    <div className="w-full lg:w-[420px] flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Header Card with avatar */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-700 dark:to-teal-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 lg:hidden" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <span className="text-xs text-teal-100">
            {ar ? "تفاصيل العميل" : "Client Details"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold text-white shrink-0 border-2 border-white/30">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">{client.name}</h3>
            {client.company && (
              <p className="text-xs text-teal-100 truncate">{client.company}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge className="text-[10px] h-5 bg-white/20 text-white border-0 hover:bg-white/30">
                {client._count.projects} {ar ? "مشاريع" : "projects"}
              </Badge>
              <Badge className="text-[10px] h-5 bg-white/20 text-white border-0 hover:bg-white/30">
                {client._count.invoices} {ar ? "فواتير" : "invoices"}
              </Badge>
              <Badge className="text-[10px] h-5 bg-white/20 text-white border-0 hover:bg-white/30">
                {client._count.contracts} {ar ? "عقود" : "contracts"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Credit bar */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            {ar ? "حد الائتمان" : "Credit Limit"}
          </span>
          <span className="text-[10px] text-slate-500 tabular-nums font-mono">
            {formatCurrency(client.creditUsed, ar)} / {formatCurrency(client.creditLimit, ar)}
          </span>
        </div>
        <Progress
          value={creditPct}
          className={cn(
            "h-1.5",
            creditPct >= 80 && "[&>div]:bg-red-500",
            creditPct >= 50 && creditPct < 80 && "[&>div]:bg-amber-500",
            creditPct < 50 && "[&>div]:bg-teal-500"
          )}
        />
      </div>

      <ScrollArea className="h-[calc(100vh-340px)]">
        <div className="p-4 space-y-4">
          {/* Contact Info */}
          <div className="space-y-2">
            {client.email && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Mail className="h-3 w-3 text-slate-500" />
                </div>
                <a href={`mailto:${client.email}`} className="truncate text-teal-600 dark:text-teal-400 hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Phone className="h-3 w-3 text-slate-500" />
                </div>
                <a href={`tel:${client.phone}`} className="text-teal-600 dark:text-teal-400 hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <MapPin className="h-3 w-3 text-slate-500" />
                </div>
                <span className="truncate">{client.address}</span>
              </div>
            )}
            {client.taxNumber && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <FileText className="h-3 w-3 text-slate-500" />
                </div>
                <span>{ar ? "ض.ر:" : "TRN:"} {client.taxNumber}</span>
              </div>
            )}
            {client.paymentTerms && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <CreditCard className="h-3 w-3 text-slate-500" />
                </div>
                <span>{ar ? "شروط الدفع:" : "Terms:"} {client.paymentTerms}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Tabs with count badges */}
          <Tabs defaultValue="projects" dir={ar ? "rtl" : "ltr"}>
            <TabsList className="grid w-full grid-cols-4 h-9 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger value="projects" className="text-xs gap-1">
                {ar ? "المشاريع" : "Projects"}
                <span className="bg-slate-200 dark:bg-slate-700 text-[9px] px-1 rounded-full">{client._count.projects}</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="text-xs gap-1">
                {ar ? "الفواتير" : "Invoices"}
                <span className="bg-slate-200 dark:bg-slate-700 text-[9px] px-1 rounded-full">{client._count.invoices}</span>
              </TabsTrigger>
              <TabsTrigger value="contracts" className="text-xs gap-1">
                {ar ? "العقود" : "Contracts"}
                <span className="bg-slate-200 dark:bg-slate-700 text-[9px] px-1 rounded-full">{client._count.contracts}</span>
              </TabsTrigger>
              <TabsTrigger value="interactions" className="text-xs gap-1">
                {ar ? "التواصل" : "Log"}
                {client.interactions && (
                  <span className="bg-slate-200 dark:bg-slate-700 text-[9px] px-1 rounded-full">{client.interactions.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Projects Tab */}
            <TabsContent value="projects" className="mt-3 space-y-2">
              {client.projects && client.projects.length > 0 ? (
                client.projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {ar ? project.name : project.nameEn || project.name}
                      </div>
                      <div className="text-xs text-slate-400">{project.number}</div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5 flex-shrink-0">
                      {project.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  {ar ? "لا توجد مشاريع" : "No projects"}
                </p>
              )}
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="mt-3 space-y-2">
              {client.invoices && client.invoices.length > 0 ? (
                client.invoices.map((inv) => {
                  const statusCfg = getInvoiceStatusBadge(inv.status);
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{inv.number}</div>
                        <div className="text-xs text-slate-500 tabular-nums font-mono">{formatCurrency(inv.total, ar)}</div>
                      </div>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0", statusCfg.color)}>
                        {ar ? statusCfg.ar : statusCfg.en}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  {ar ? "لا توجد فواتير" : "No invoices"}
                </p>
              )}
            </TabsContent>

            {/* Contracts Tab */}
            <TabsContent value="contracts" className="mt-3 space-y-2">
              {client.contracts && client.contracts.length > 0 ? (
                client.contracts.map((con) => {
                  const statusCfg = getContractStatusBadge(con.status);
                  return (
                    <div key={con.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{con.title}</div>
                        <div className="text-xs text-slate-500 tabular-nums font-mono">{formatCurrency(con.value, ar)}</div>
                      </div>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0", statusCfg.color)}>
                        {ar ? statusCfg.ar : statusCfg.en}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  {ar ? "لا توجد عقود" : "No contracts"}
                </p>
              )}
            </TabsContent>

            {/* Interactions Tab */}
            <TabsContent value="interactions" className="mt-3 space-y-2">
              {client.interactions && client.interactions.length > 0 ? (
                client.interactions.map((interaction) => {
                  const Icon = getInteractionIcon(interaction.type);
                  const typeLabels: Record<string, { ar: string; en: string }> = {
                    meeting: { ar: "اجتماع", en: "Meeting" },
                    call: { ar: "مكالمة", en: "Call" },
                    email: { ar: "بريد إلكتروني", en: "Email" },
                  };
                  return (
                    <div key={interaction.id} className="flex gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-900 dark:text-white">
                            {ar ? typeLabels[interaction.type]?.ar : typeLabels[interaction.type]?.en}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(interaction.date).toLocaleDateString(ar ? "ar-AE" : "en-US")}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                          {interaction.subject}
                        </div>
                        {interaction.description && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{interaction.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  {ar ? "لا توجد تفاعلات" : "No interactions"}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
