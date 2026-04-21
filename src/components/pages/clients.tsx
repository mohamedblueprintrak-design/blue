"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  MessageCircle,
  Upload,
  Globe,
  User,
  Landmark,
  Home,
  Briefcase,
  Megaphone,
  Share2,
  Footprints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

// ===== Constants =====
const NATIONALITIES = [
  { value: "emirati", ar: "إماراتي", en: "Emirati" },
  { value: "saudi", ar: "سعودي", en: "Saudi" },
  { value: "kuwaiti", ar: "كويتي", en: "Kuwaiti" },
  { value: "bahraini", ar: "بحريني", en: "Bahraini" },
  { value: "omani", ar: "عماني", en: "Omani" },
  { value: "qatari", ar: "قطري", en: "Qatari" },
  { value: "jordanian", ar: "أردني", en: "Jordanian" },
  { value: "egyptian", ar: "مصري", en: "Egyptian" },
  { value: "syrian", ar: "سوري", en: "Syrian" },
  { value: "lebanese", ar: "لبناني", en: "Lebanese" },
  { value: "iraqi", ar: "عراقي", en: "Iraqi" },
  { value: "yemeni", ar: "يمني", en: "Yemeni" },
  { value: "sudanese", ar: "سوداني", en: "Sudanese" },
  { value: "moroccan", ar: "مغربي", en: "Moroccan" },
  { value: "tunisian", ar: "تونسي", en: "Tunisian" },
  { value: "algerian", ar: "جزائري", en: "Algerian" },
  { value: "libyan", ar: "ليبي", en: "Libyan" },
  { value: "palestinian", ar: "فلسطيني", en: "Palestinian" },
  { value: "indian", ar: "هندي", en: "Indian" },
  { value: "pakistani", ar: "باكستاني", en: "Pakistani" },
  { value: "bangladeshi", ar: "بنجلاديشي", en: "Bangladeshi" },
  { value: "filipino", ar: "فلبيني", en: "Filipino" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const EMIRATES = [
  { value: "abu_dhabi", ar: "أبو ظبي", en: "Abu Dhabi" },
  { value: "dubai", ar: "دبي", en: "Dubai" },
  { value: "sharjah", ar: "الشارقة", en: "Sharjah" },
  { value: "ajman", ar: "عجمان", en: "Ajman" },
  { value: "umm_al_quwain", ar: "أم القيوين", en: "Umm Al Quwain" },
  { value: "ras_al_khaimah", ar: "رأس الخيمة", en: "Ras Al Khaimah" },
  { value: "fujairah", ar: "الفجيرة", en: "Fujairah" },
];

const SERVICES = [
  { value: "consultation", ar: "استشارة هندسية", en: "Consultation" },
  { value: "architectural_design", ar: "تصميم معماري", en: "Architectural Design" },
  { value: "structural_design", ar: "تصميم إنشائي", en: "Structural Design" },
  { value: "mep_design", ar: "تصميم MEP", en: "MEP Design" },
  { value: "municipality_license", ar: "استخراج ترخيص بلدي", en: "Municipality License" },
  { value: "construction_supervision", ar: "إشراف على التنفيذ", en: "Construction Supervision" },
  { value: "engineering_inspection", ar: "فحص هندسي", en: "Engineering Inspection" },
  { value: "project_management", ar: "إدارة مشاريع", en: "Project Management" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const PROJECT_TYPES = [
  { value: "villa", ar: "فيلا", en: "Villa" },
  { value: "apartment", ar: "شقة", en: "Apartment" },
  { value: "commercial", ar: "تجاري", en: "Commercial" },
  { value: "industrial", ar: "صناعي", en: "Industrial" },
  { value: "residential_building", ar: "عمارة سكنية", en: "Residential Building" },
  { value: "medical", ar: "طبي", en: "Medical" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const LAND_PROJECT_TYPES = ["villa", "commercial", "industrial", "residential_building"];

const REFERRAL_SOURCES = [
  { value: "social_media", ar: "وسائل التواصل الاجتماعي", en: "Social Media", icon: Globe },
  { value: "referral", ar: "إحالة من عميل", en: "Client Referral", icon: Share2 },
  { value: "website", ar: "الموقع الإلكتروني", en: "Website", icon: Globe },
  { value: "walk_in", ar: "زيارة مباشرة", en: "Walk-in", icon: Footprints },
  { value: "advertisement", ar: "إعلان", en: "Advertisement", icon: Megaphone },
  { value: "other", ar: "أخرى", en: "Other", icon: MessageCircle },
];

const SERVICE_LABELS: Record<string, { ar: string; en: string }> = {};
SERVICES.forEach((s) => { SERVICE_LABELS[s.value] = { ar: s.ar, en: s.en }; });

const PROJECT_TYPE_LABELS: Record<string, { ar: string; en: string }> = {};
PROJECT_TYPES.forEach((p) => { PROJECT_TYPE_LABELS[p.value] = { ar: p.ar, en: p.en }; });

const REFERRAL_LABELS: Record<string, { ar: string; en: string }> = {};
REFERRAL_SOURCES.forEach((r) => { REFERRAL_LABELS[r.value] = { ar: r.ar, en: r.en }; });

const CLIENT_TYPE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  individual: { ar: "فرد", en: "Individual", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
  company: { ar: "شركة", en: "Company", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300" },
  government: { ar: "حكومة", en: "Government", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
};

// ===== Types =====
interface Client {
  id: string;
  name: string;
  nameEn?: string;
  company: string;
  companyEn?: string;
  clientType?: string;
  idNumber?: string;
  nationality?: string;
  idPhoto?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  extraPhone?: string;
  address: string;
  fullAddress?: string;
  taxNumber: string;
  creditLimit: number;
  creditUsed: number;
  paymentTerms: string;
  servicesWanted?: string;
  projectType?: string;
  landLocation?: string;
  landArea?: string;
  plotNumber?: string;
  planNumber?: string;
  landDocuments?: string;
  notes?: string;
  referralSource?: string;
  referralDetail?: string;
  _count: { projects: number; invoices: number; contracts: number };
  projects?: ClientProject[];
  invoices?: ClientInvoice[];
  contracts?: ClientContract[];
  interactions?: ClientInteraction[];
  serviceType?: string;
  serviceNotes?: string;
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

interface FullAddressData {
  emirate?: string;
  city?: string;
  area?: string;
  street?: string;
  building?: string;
  unit?: string;
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

function parseFullAddress(json: string | undefined | null): FullAddressData {
  if (!json) return {};
  try { return JSON.parse(json); } catch { return {}; }
}

function parseServicesWanted(json: string | undefined | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

function parseLandDocuments(json: string | undefined | null): { type: string; path: string }[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

function getNationalityLabel(val: string | undefined, ar: boolean): string {
  if (!val) return "";
  const found = NATIONALITIES.find((n) => n.value === val);
  return found ? (ar ? found.ar : found.en) : val;
}

// ===== Main Clients Component =====
interface ClientsPageProps {
  language: "ar" | "en";
  projectId?: string;
  initialTab?: "list" | "create";
}

export default function ClientsPage({ language, projectId, initialTab }: ClientsPageProps) {
  const ar = language === "ar";
  const queryClient = useQueryClient();
  const toast = useToastFeedback({ ar });
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form state for new fields (not in Zod schema, managed via local state)
  const [formClientType, setFormClientType] = useState<string>("individual");
  const [formServices, setFormServices] = useState<string[]>([]);
  const [formProjectType, setFormProjectType] = useState<string>("");
  const [formReferralSource, setFormReferralSource] = useState<string>("");
  const [formAddress, setFormAddress] = useState<FullAddressData>({});

  // Auto-open create dialog on initialTab
  useEffect(() => {
    if (initialTab === "create") {
      resetLocalForm();
      setShowAddDialog(true);
    }
  }, [initialTab]);

  const resetLocalForm = useCallback(() => {
    setFormClientType("individual");
    setFormServices([]);
    setFormProjectType("");
    setFormReferralSource("");
    setFormAddress({});
  }, []);

  // Form
  const emptyForm: ClientFormData = {
    name: "", company: "", email: "", phone: "", address: "",
    taxNumber: "", creditLimit: "0", paymentTerms: "",
    serviceType: "", serviceNotes: "",
  };
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: emptyForm,
  });
  const { register, handleSubmit: rhfHandleSubmit, formState: { errors }, reset, watch, setValue } = form;

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["clients", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/clients${projectId ? `?projectId=${projectId}` : ''}`);
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
    mutationFn: async (data: Record<string, unknown>) => {
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
      resetLocalForm();
      toast.created(ar ? "العميل" : "Client");
    },
    onError: () => {
      toast.error(ar ? "إنشاء العميل" : "Create client");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
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
      resetLocalForm();
      toast.updated(ar ? "العميل" : "Client");
    },
    onError: () => {
      toast.error(ar ? "تحديث العميل" : "Update client");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error('Failed to delete');
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
      serviceType: client.serviceType || "",
      serviceNotes: client.serviceNotes || "",
    });
    // Populate local form state from client data
    setFormClientType(client.clientType || "individual");
    setFormServices(parseServicesWanted(client.servicesWanted));
    setFormProjectType(client.projectType || "");
    setFormReferralSource(client.referralSource || "");
    setFormAddress(parseFullAddress(client.fullAddress));
  };

  const openAddDialog = () => {
    reset(emptyForm);
    resetLocalForm();
    setShowAddDialog(true);
  };

  const handleSave = (data: ClientFormData) => {
    const payload: Record<string, unknown> = {
      ...data,
      clientType: formClientType,
      nameEn: (watch as any)("nameEn") || "",
      companyEn: (watch as any)("companyEn") || "",
      idNumber: (watch as any)("idNumber") || "",
      nationality: (watch as any)("nationality") || "",
      whatsapp: (watch as any)("whatsapp") || "",
      extraPhone: (watch as any)("extraPhone") || "",
      fullAddress: JSON.stringify(formAddress),
      servicesWanted: JSON.stringify(formServices),
      projectType: formProjectType,
      notes: (watch as any)("notes") || "",
      referralSource: formReferralSource,
      referralDetail: (watch as any)("referralDetail") || "",
      landLocation: (watch as any)("landLocation") || "",
      landArea: (watch as any)("landArea") || "",
      plotNumber: (watch as any)("plotNumber") || "",
      planNumber: (watch as any)("planNumber") || "",
    };

    if (editClient) {
      updateMutation.mutate({ id: editClient.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleService = (service: string) => {
    setFormServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  // Filter clients
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const showLandSection = LAND_PROJECT_TYPES.includes(formProjectType);

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

        {/* Add/Edit Dialog - Full Screen with Tabs */}
        <Dialog
          open={showAddDialog || !!editClient}
          onOpenChange={(open) => {
            if (!open) { setShowAddDialog(false); setEditClient(null); reset(); resetLocalForm(); }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle>
                {editClient ? (ar ? "تعديل عميل" : "Edit Client") : (ar ? "عميل جديد" : "New Client")}
              </DialogTitle>
              <DialogDescription>
                {editClient
                  ? (ar ? "تعديل بيانات العميل" : "Edit client information")
                  : (ar ? "إضافة عميل جديد" : "Add a new client")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={rhfHandleSubmit(handleSave as any)} className="flex-1 overflow-hidden flex flex-col">
              <Tabs defaultValue="basic" dir={ar ? "rtl" : "ltr"} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full grid grid-cols-5 shrink-0 h-9 bg-slate-100 dark:bg-slate-800">
                  <TabsTrigger value="basic" className="text-xs gap-1">
                    {ar ? "الأساسية" : "Basic"}
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="text-xs gap-1">
                    {ar ? "الاتصال" : "Contact"}
                  </TabsTrigger>
                  <TabsTrigger value="services" className="text-xs gap-1">
                    {ar ? "الخدمات" : "Services"}
                  </TabsTrigger>
                  <TabsTrigger value="land" className="text-xs gap-1">
                    {ar ? "الأرض" : "Land"}
                  </TabsTrigger>
                  <TabsTrigger value="referral" className="text-xs gap-1">
                    {ar ? "المصدر" : "Referral"}
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 mt-3">
                  {/* ===== Section 1: Basic Info ===== */}
                  <TabsContent value="basic" className="space-y-4 px-1">
                    {/* Client Type */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{ar ? "نوع العميل" : "Client Type"} *</Label>
                      <RadioGroup
                        value={formClientType}
                        onValueChange={setFormClientType}
                        className="flex gap-4"
                        dir={ar ? "rtl" : "ltr"}
                      >
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                          <RadioGroupItem value="individual" id="type-individual" />
                          <Label htmlFor="type-individual" className="text-sm cursor-pointer flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-sky-500" />
                            {ar ? "فرد" : "Individual"}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                          <RadioGroupItem value="company" id="type-company" />
                          <Label htmlFor="type-company" className="text-sm cursor-pointer flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-violet-500" />
                            {ar ? "شركة" : "Company"}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                          <RadioGroupItem value="government" id="type-government" />
                          <Label htmlFor="type-government" className="text-sm cursor-pointer flex items-center gap-1.5">
                            <Landmark className="h-3.5 w-3.5 text-amber-500" />
                            {ar ? "حكومة" : "Government"}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Name Arabic + English */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">{ar ? "الاسم (عربي)" : "Name (Arabic)"} *</Label>
                        <Input
                          {...register("name")}
                          placeholder={ar ? "اسم العميل بالعربي" : "Client name in Arabic"}
                          dir="rtl"
                          className={cn(errors.name && "border-red-500 focus:ring-red-500/20 focus:border-red-500")}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.name.message || "", ar)}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">{ar ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                        <Input
                          {...(register as any)("nameEn")}
                          placeholder={ar ? "اسم العميل بالإنجليزي" : "Client name in English"}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Company Name - shown for company/government */}
                    {(formClientType === "company" || formClientType === "government") && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">{ar ? "اسم الجهة (عربي)" : "Organization (Arabic)"}</Label>
                          <Input
                            {...register("company")}
                            placeholder={ar ? "اسم الشركة/الجهة" : "Company/Organization name"}
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">{ar ? "اسم الجهة (إنجليزي)" : "Organization (English)"}</Label>
                          <Input
                            {...(register as any)("companyEn")}
                            placeholder={ar ? "اسم الشركة بالإنجليزي" : "Organization in English"}
                            dir="ltr"
                          />
                        </div>
                      </div>
                    )}

                    {/* ID / Commercial Registration */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">
                          {formClientType === "individual"
                            ? (ar ? "رقم الهوية الإماراتية" : "UAE ID Number")
                            : (ar ? "السجل التجاري" : "Commercial Registration")}
                        </Label>
                        <Input
                          {...(register as any)("idNumber")}
                          placeholder={formClientType === "individual" ? "784-XXXX-XXXXXXX-X" : "CR-XXXXX"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">{ar ? "الجنسية" : "Nationality"}</Label>
                        <Select
                          value={(watch as any)("nationality") || ""}
                          onValueChange={(v) => setValue("nationality" as any, v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={ar ? "اختر الجنسية..." : "Select nationality..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {NATIONALITIES.map((n) => (
                              <SelectItem key={n.value} value={n.value}>
                                {ar ? n.ar : n.en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* ID Photo Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm">{ar ? "صورة الهوية" : "ID Photo"}</Label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {(watch as any)("idPhoto") ? (
                            <div className="w-16 h-16 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="h-6 w-6 text-teal-500" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                              <Upload className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 h-8 text-xs rounded-lg"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/jpeg,image/png,image/webp";
                              input.onchange = () => {
                                if (input.files && input.files[0]) {
                                  const file = input.files[0];
                                  // Validate file size (max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert(ar ? "حجم الملف يجب أن يكون أقل من 5 ميجابايت" : "File size must be less than 5MB");
                                    return;
                                  }
                                  setValue("idPhoto" as any, file.name);
                                }
                              };
                              input.click();
                            }}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {ar ? "اختيار ملف" : "Choose File"}
                          </Button>
                          {(watch as any)("idPhoto") && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {(watch as any)("idPhoto")}
                            </span>
                          )}
                          <p className="text-[10px] text-slate-400">
                            {ar ? "JPG, PNG أو WebP - حد أقصى 5 ميجابايت" : "JPG, PNG or WebP - Max 5MB"}
                          </p>
                        </div>
                      </div>
                      <input type="hidden" {...(register as any)("idPhoto")} />
                    </div>

                    {/* Credit Limit & Payment Terms */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">{ar ? "حد الائتمان" : "Credit Limit"} ({ar ? "د.إ" : "AED"})</Label>
                        <Input type="number" {...register("creditLimit")} placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">{ar ? "شروط الدفع" : "Payment Terms"}</Label>
                        <Input {...register("paymentTerms")} placeholder={ar ? "مثال: 30 يوم" : "e.g., Net 30"} />
                      </div>
                    </div>

                    {/* Tax Number */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">{ar ? "الرقم الضريبي" : "Tax Number"}</Label>
                        <Input {...register("taxNumber")} placeholder={ar ? "الرقم الضريبي" : "Tax number"} />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ===== Section 2: Contact Info ===== */}
                  <TabsContent value="contact" className="space-y-4 px-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">{ar ? "البريد الإلكتروني" : "Email"}</Label>
                        <Input
                          type="email"
                          {...register("email")}
                          placeholder="email@example.com"
                          className={cn(errors.email && "border-red-500 focus:ring-red-500/20 focus:border-red-500")}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.email.message || "", ar)}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">{ar ? "رقم الهاتف" : "Mobile Phone"} *</Label>
                        <Input
                          {...register("phone")}
                          placeholder="+971 XX XXX XXXX"
                          className={cn(errors.phone && "border-red-500 focus:ring-red-500/20 focus:border-red-500")}
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{getErrorMessage(errors.phone.message || "", ar)}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-1.5">
                          <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                          {ar ? "رقم الواتساب" : "WhatsApp Number"}
                        </Label>
                        <Input
                          {...(register as any)("whatsapp")}
                          placeholder="+971 XX XXX XXXX"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">{ar ? "هاتف إضافي" : "Extra Phone"}</Label>
                        <Input
                          {...(register as any)("extraPhone")}
                          placeholder="+971 XX XXX XXXX"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Full Address */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                        {ar ? "العنوان التفصيلي" : "Full Address"}
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">{ar ? "الإمارة" : "Emirate"}</Label>
                          <Select
                            value={formAddress.emirate || ""}
                            onValueChange={(v) => setFormAddress((p) => ({ ...p, emirate: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={ar ? "اختر الإمارة..." : "Select emirate..."} />
                            </SelectTrigger>
                            <SelectContent>
                              {EMIRATES.map((e) => (
                                <SelectItem key={e.value} value={e.value}>
                                  {ar ? e.ar : e.en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">{ar ? "المدينة" : "City"}</Label>
                          <Input
                            value={formAddress.city || ""}
                            onChange={(e) => setFormAddress((p) => ({ ...p, city: e.target.value }))}
                            placeholder={ar ? "المدينة" : "City"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">{ar ? "المنطقة" : "Area"}</Label>
                          <Input
                            value={formAddress.area || ""}
                            onChange={(e) => setFormAddress((p) => ({ ...p, area: e.target.value }))}
                            placeholder={ar ? "المنطقة" : "Area"}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">{ar ? "الشارع" : "Street"}</Label>
                          <Input
                            value={formAddress.street || ""}
                            onChange={(e) => setFormAddress((p) => ({ ...p, street: e.target.value }))}
                            placeholder={ar ? "الشارع" : "Street"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">{ar ? "المبنى" : "Building"}</Label>
                          <Input
                            value={formAddress.building || ""}
                            onChange={(e) => setFormAddress((p) => ({ ...p, building: e.target.value }))}
                            placeholder={ar ? "رقم المبنى" : "Building No."}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">{ar ? "الوحدة / الشقة" : "Unit / Apt"}</Label>
                          <Input
                            value={formAddress.unit || ""}
                            onChange={(e) => setFormAddress((p) => ({ ...p, unit: e.target.value }))}
                            placeholder={ar ? "رقم الوحدة" : "Unit No."}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Simple address (legacy) */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">{ar ? "عنوان مبسط (اختياري)" : "Simple address (optional)"}</Label>
                      <Input {...register("address")} placeholder={ar ? "عنوان العميل" : "Client address"} />
                    </div>
                  </TabsContent>

                  {/* ===== Section 3: Services ===== */}
                  <TabsContent value="services" className="space-y-4 px-1">
                    {/* Services Wanted as Checkboxes */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{ar ? "الخدمات المطلوبة" : "Services Wanted"}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {SERVICES.map((service) => (
                          <div
                            key={service.value}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors",
                              formServices.includes(service.value)
                                ? "border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/30"
                                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                            onClick={() => toggleService(service.value)}
                          >
                            <Checkbox
                              checked={formServices.includes(service.value)}
                              onCheckedChange={() => toggleService(service.value)}
                            />
                            <Label className="text-sm cursor-pointer flex-1 select-none">
                              {ar ? service.ar : service.en}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Project Type */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{ar ? "نوع المشروع" : "Project Type"}</Label>
                      <RadioGroup
                        value={formProjectType}
                        onValueChange={setFormProjectType}
                        className="grid grid-cols-4 gap-2"
                        dir={ar ? "rtl" : "ltr"}
                      >
                        {PROJECT_TYPES.map((pt) => (
                          <div
                            key={pt.value}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                              formProjectType === pt.value
                                ? "border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/30"
                                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                          >
                            <RadioGroupItem value={pt.value} id={`pt-${pt.value}`} />
                            <Label htmlFor={`pt-${pt.value}`} className="text-xs cursor-pointer select-none">
                              {ar ? pt.ar : pt.en}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <Separator />

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{ar ? "ملاحظات / تفاصيل" : "Notes / Details"}</Label>
                      <textarea
                        {...(register as any)("notes")}
                        placeholder={ar ? "وصف تفصيلي لما يريد العميل..." : "Describe what the client needs..."}
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                      />
                    </div>

                    {/* Legacy fields: Service Type + Notes */}
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">{ar ? "الغرض من التواصل (قديم)" : "Purpose of Visit (legacy)"}</Label>
                      <Select
                        value={watch("serviceType") || ""}
                        onValueChange={(v) => setValue("serviceType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={ar ? "اختر الغرض..." : "Select purpose..."} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">{ar ? "استشارة هندسية" : "Engineering Consultation"}</SelectItem>
                          <SelectItem value="design">{ar ? "تصميم (معماري/إنشائي/MEP)" : "Design (Arch/Struct/MEP)"}</SelectItem>
                          <SelectItem value="license">{ar ? "استخراج ترخيص بلدي" : "Municipality License"}</SelectItem>
                          <SelectItem value="supervision">{ar ? "إشراف على التنفيذ" : "Construction Supervision"}</SelectItem>
                          <SelectItem value="inspection">{ar ? "فحص هندسي" : "Engineering Inspection"}</SelectItem>
                          <SelectItem value="other">{ar ? "أخرى" : "Other"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">{ar ? "تفاصيل إضافية (قديم)" : "Additional Details (legacy)"}</Label>
                      <textarea
                        {...register("serviceNotes")}
                        placeholder={ar ? "وصف تفصيلي..." : "Describe in detail..."}
                        rows={2}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                      />
                    </div>
                  </TabsContent>

                  {/* ===== Section 4: Land Details ===== */}
                  <TabsContent value="land" className="space-y-4 px-1">
                    {showLandSection ? (
                      <>
                        <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                          {ar
                            ? "تفاصيل الأرض مطلوبة لنوع المشروع المحدد (فيلا / تجاري / صناعي / عمارة سكنية)"
                            : "Land details are needed for the selected project type (Villa / Commercial / Industrial / Residential Building)"}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">{ar ? "موقع الأرض" : "Land Location"}</Label>
                            <Input {...(register as any)("landLocation")} placeholder={ar ? "وصف موقع الأرض" : "Land location description"} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">{ar ? "مساحة الأرض" : "Land Area"}</Label>
                            <div className="flex gap-2">
                              <Input {...(register as any)("landArea")} placeholder={ar ? "المساحة" : "Area"} className="flex-1" />
                              <Select defaultValue="sqm">
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sqm">m²</SelectItem>
                                  <SelectItem value="sqft">ft²</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">{ar ? "رقم القطعة" : "Plot Number"}</Label>
                            <Input {...(register as any)("plotNumber")} placeholder={ar ? "رقم القطعة" : "Plot number"} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">{ar ? "رقم المخطط" : "Plan Number"}</Label>
                            <Input {...(register as any)("planNumber")} placeholder={ar ? "رقم المخطط" : "Plan number"} />
                          </div>
                        </div>

                        <Separator />

                        {/* Land Documents Upload Area */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">{ar ? "مستندات الأرض" : "Land Documents"}</Label>
                          <p className="text-xs text-slate-400">
                            {ar
                              ? "المسح، خريطة الموقع، صك الملكية، صور الموقع"
                              : "Survey, site map, ownership deed, site photos"}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { key: "survey", ar: "مسح الأرض", en: "Land Survey" },
                              { key: "map", ar: "خريطة الموقع", en: "Site Map" },
                              { key: "deed", ar: "صك الملكية", en: "Ownership Deed" },
                              { key: "photos", ar: "صور الموقع", en: "Site Photos" },
                            ].map((doc) => (
                              <div
                                key={doc.key}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-600 transition-colors cursor-pointer"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.onchange = () => {
                                    // Placeholder: just logs the filename
                                    if (input.files && input.files[0]) {
                                      console.log(doc.key, input.files[0].name);
                                    }
                                  };
                                  input.click();
                                }}
                              >
                                <Upload className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs text-slate-500">{ar ? doc.ar : doc.en}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                          <Home className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                          {ar ? "تفاصيل الأرض غير مطلوبة" : "Land details not required"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {ar
                            ? "تفاصيل الأرض تظهر فقط لمشاريع الفلل، التجارية، الصناعية، والعمائر السكنية"
                            : "Land details are shown only for Villa, Commercial, Industrial, and Residential Building projects"}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            const servicesTab = document.querySelector('[value="services"]');
                            if (servicesTab) (servicesTab as HTMLElement).click();
                          }}
                        >
                          {ar ? "اختر نوع مشروع" : "Select a project type"}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* ===== Section 5: Referral ===== */}
                  <TabsContent value="referral" className="space-y-4 px-1">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{ar ? "مصدر العميل" : "Referral Source"}</Label>
                      <RadioGroup
                        value={formReferralSource}
                        onValueChange={setFormReferralSource}
                        className="grid grid-cols-2 gap-2"
                        dir={ar ? "rtl" : "ltr"}
                      >
                        {REFERRAL_SOURCES.map((source) => {
                          const IconComp = source.icon;
                          return (
                            <div
                              key={source.value}
                              className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors",
                                formReferralSource === source.value
                                  ? "border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/30"
                                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              )}
                            >
                              <RadioGroupItem value={source.value} id={`ref-${source.value}`} />
                              <IconComp className="h-4 w-4 text-slate-400" />
                              <Label htmlFor={`ref-${source.value}`} className="text-sm cursor-pointer select-none">
                                {ar ? source.ar : source.en}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>

                    {(formReferralSource === "other" || formReferralSource === "referral") && (
                      <div className="space-y-2">
                        <Label className="text-sm">
                          {formReferralSource === "other"
                            ? (ar ? "تفاصيل أخرى" : "Other Details")
                            : (ar ? "اسم العميل المُحيل" : "Referring Client Name")}
                        </Label>
                        <Input
                          {...(register as any)("referralDetail")}
                          placeholder={
                            formReferralSource === "other"
                              ? (ar ? "اذكر المصدر..." : "Specify source...")
                              : (ar ? "اسم العميل المحيل..." : "Referring client name...")
                          }
                        />
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              {/* Footer - fixed at bottom */}
              <DialogFooter className="shrink-0 pt-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowAddDialog(false); setEditClient(null); reset(); resetLocalForm(); }}
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

  const services = parseServicesWanted(client.servicesWanted);
  const fullAddr = parseFullAddress(client.fullAddress);
  const landDocs = parseLandDocuments(client.landDocuments);
  const clientTypeConfig = CLIENT_TYPE_LABELS[client.clientType || ""] || CLIENT_TYPE_LABELS.individual;
  const projectTypeLabel = PROJECT_TYPE_LABELS[client.projectType || ""];
  const referralLabel = REFERRAL_LABELS[client.referralSource || ""];

  // Build formatted address string
  const addrParts = [fullAddr.emirate, fullAddr.city, fullAddr.area, fullAddr.street, fullAddr.building, fullAddr.unit].filter(Boolean);
  const formattedAddr = addrParts.join(" - ");
  const emirateLabel = fullAddr.emirate ? EMIRATES.find((e) => e.value === fullAddr.emirate) : null;

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
          <div className="flex items-center gap-2">
            {client.clientType && (
              <Badge className={cn("text-[10px] h-5 border-0", clientTypeConfig.color)}>
                {ar ? clientTypeConfig.ar : clientTypeConfig.en}
              </Badge>
            )}
            <span className="text-xs text-teal-100">
              {ar ? "تفاصيل العميل" : "Client Details"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold text-white shrink-0 border-2 border-white/30">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">{client.name}</h3>
            {(client.nameEn || client.company) && (
              <p className="text-xs text-teal-100 truncate">{client.nameEn || client.company}</p>
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
          {/* Contact Info with WhatsApp + Call buttons */}
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
            {/* Action buttons: WhatsApp + Call */}
            <div className="flex gap-2 pt-1">
              {(client.whatsapp || client.phone) && (
                <a
                  href={`https://wa.me/${(client.whatsapp || client.phone || "").replace(/[^0-9+]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
                >
                  <MessageCircle className="h-3 w-3" />
                  {ar ? "واتساب" : "WhatsApp"}
                </a>
              )}
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  {ar ? "اتصال" : "Call"}
                </a>
              )}
            </div>
            {client.whatsapp && client.phone && client.whatsapp !== client.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-6 h-6 rounded-md bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-3 w-3 text-green-500" />
                </div>
                <span className="text-green-600 dark:text-green-400">{client.whatsapp}</span>
              </div>
            )}
            {client.extraPhone && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Phone className="h-3 w-3 text-slate-500" />
                </div>
                <span>{client.extraPhone}</span>
              </div>
            )}
          </div>

          {/* Address section */}
          {(formattedAddr || client.address) && (
            <>
              <Separator />
              <div className="space-y-2">
                {formattedAddr ? (
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      {emirateLabel && (
                        <span className="text-teal-600 dark:text-teal-400 font-medium block">
                          {ar ? emirateLabel.ar : emirateLabel.en}
                        </span>
                      )}
                      <span className="truncate">{formattedAddr}</span>
                    </div>
                  </div>
                ) : client.address ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <MapPin className="h-3 w-3 text-slate-500" />
                    </div>
                    <span className="truncate">{client.address}</span>
                  </div>
                ) : null}
              </div>
            </>
          )}

          {/* ID & Nationality */}
          {(client.idNumber || client.nationality) && (
            <div className="space-y-2">
              {client.idNumber && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <FileSignature className="h-3 w-3 text-slate-500" />
                  </div>
                  <span>{ar ? "رقم الهوية:" : "ID:"} {client.idNumber}</span>
                </div>
              )}
              {client.nationality && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Globe className="h-3 w-3 text-slate-500" />
                  </div>
                  <span>{ar ? "الجنسية:" : "Nationality:"} {getNationalityLabel(client.nationality, ar)}</span>
                </div>
              )}
            </div>
          )}

          {/* Services Wanted as Badges */}
          {services.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 block">{ar ? "الخدمات المطلوبة" : "Services Wanted"}</span>
                <div className="flex flex-wrap gap-1">
                  {services.map((svc) => {
                    const label = SERVICE_LABELS[svc];
                    return (
                      <Badge key={svc} variant="secondary" className="text-[10px] h-5">
                        {label ? (ar ? label.ar : label.en) : svc}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Project Type */}
          {projectTypeLabel && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 block">{ar ? "نوع المشروع" : "Project Type"}</span>
              <Badge className={cn("text-[10px] h-5", "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300")}>
                <Home className="h-3 w-3 me-1" />
                {ar ? projectTypeLabel.ar : projectTypeLabel.en}
              </Badge>
            </div>
          )}

          {/* Land Details */}
          {LAND_PROJECT_TYPES.includes(client.projectType || "") && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-medium block">
                  {ar ? "تفاصيل الأرض" : "Land Details"}
                </span>
                {client.landLocation && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{client.landLocation}</span>
                  </div>
                )}
                {client.landArea && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="h-3 w-3 text-slate-400" />
                    <span>{ar ? "المساحة:" : "Area:"} {client.landArea}</span>
                  </div>
                )}
                {client.plotNumber && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="h-3 w-3 text-slate-400" />
                    <span>{ar ? "رقم القطعة:" : "Plot:"} {client.plotNumber}</span>
                  </div>
                )}
                {client.planNumber && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="h-3 w-3 text-slate-400" />
                    <span>{ar ? "رقم المخطط:" : "Plan:"} {client.planNumber}</span>
                  </div>
                )}
                {landDocs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {landDocs.map((doc, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] h-4">
                        <FileText className="h-2.5 w-2.5 me-0.5" />
                        {doc.type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Referral Source */}
          {referralLabel && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 block">{ar ? "مصدر العميل" : "Referral Source"}</span>
                <Badge className="text-[10px] h-5 bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                  {ar ? referralLabel.ar : referralLabel.en}
                </Badge>
                {client.referralDetail && (
                  <p className="text-xs text-slate-500">{client.referralDetail}</p>
                )}
              </div>
            </>
          )}

          {/* Service Type Badge (legacy) */}
          {client.serviceType && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0">
                  <FileText className="h-3 w-3 text-teal-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 block">{ar ? "الغرض" : "Purpose"}</span>
                  <span className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                    {ar
                      ? { consultation: "استشارة هندسية", design: "تصميم", license: "استخراج ترخيص", supervision: "إشراف على التنفيذ", inspection: "فحص هندسي", other: "أخرى" }[client.serviceType] || client.serviceType
                      : { consultation: "Engineering Consultation", design: "Design", license: "License", supervision: "Supervision", inspection: "Inspection", other: "Other" }[client.serviceType] || client.serviceType}
                  </span>
                </div>
              </div>
              {client.serviceNotes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ms-8 line-clamp-2">{client.serviceNotes}</p>
              )}
            </div>
          )}

          {/* Tax / Terms */}
          {(client.taxNumber || client.paymentTerms) && (
            <div className="space-y-2">
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
          )}

          {/* Notes */}
          {client.notes && (
            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-1">{ar ? "ملاحظات" : "Notes"}</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">{client.notes}</p>
            </div>
          )}

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
