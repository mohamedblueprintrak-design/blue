'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MapPin, Users, Calculator, Clock, Globe, MessageCircle,
  Phone, FileText, PenTool, Menu, X, Plus, Send,
  Play, Pause, Square, ChevronDown, ChevronUp,
  Building2, User, Calendar, TrendingUp, CheckCircle2,
  AlertTriangle, Timer, BarChart3, Download,
  ExternalLink, Video, Mail, PhoneCall, Copy,
  MoreVertical, Eye, Trash2, Filter, Search,
  Navigation, MapPinned, Car, Wrench, HardHat,
  ClipboardList, Archive, DollarSign, Percent
} from 'lucide-react'

// ===== OpenStreetMap Embed URL Builder =====
function buildMapUrl(center?: { lat: number; lng: number }): string {
  if (center) {
    const bbox = `${center.lng - 0.008},${center.lat - 0.008},${center.lng + 0.008},${center.lat + 0.008}`
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat},${center.lng}`
  }
  const markers = DEMO_PROJECTS.map(p => `marker=${p.lat},${p.lng}`).join('&')
  return `https://www.openstreetmap.org/export/embed.html?bbox=55.90,25.76,56.00,25.82&layer=mapnik&${markers}`
}

// ===== Props =====
interface FeaturesHubProps {
  language: 'ar' | 'en'
}

// ===== Types =====
type TabId = 'map' | 'visits' | 'boq' | 'time' | 'portal' | 'whatsapp' | 'communications' | 'design'

interface NavItem {
  id: TabId
  label: string
  icon: React.ReactNode
}

interface DemoProject {
  id: string
  name: string
  client: string
  status: 'active' | 'delayed' | 'completed' | 'on_hold'
  progress: number
  lat: number
  lng: number
  budget: number
  type: string
  startDate: string
  endDate: string
}

interface DemoEngineer {
  id: string
  name: string
  role: string
  phone: string
  avatar: string
}

interface DemoVisit {
  id: string
  engineerId: string
  projectId: string
  engineerName: string
  projectName: string
  date: string
  timeIn: string
  timeOut: string | null
  status: 'planned' | 'in-progress' | 'completed'
  lat: number
  lng: number
  notes: string
}

interface BOQItem {
  id: string
  description: string
  unit: string
  quantity: number
  unitCost: number
  category: 'civil' | 'structural' | 'mep' | 'finishing' | 'landscape'
  total: number
}

interface TimeEntry {
  id: string
  projectId: string
  projectName: string
  task: string
  date: string
  startTime: string
  endTime: string | null
  duration: number
  isBillable: boolean
  isTimerRunning: boolean
}

interface ClientInteraction {
  id: string
  clientId: string
  clientName: string
  projectId: string
  projectName: string
  type: 'meeting' | 'call' | 'email' | 'whatsapp'
  date: string
  subject: string
  description: string
  outcome: string
}

interface WhatsAppMessage {
  id: string
  contactName: string
  phone: string
  message: string
  timestamp: string
  direction: 'sent' | 'received'
  projectName: string
}

interface ClientProject {
  id: string
  name: string
  status: string
  progress: number
  milestones: { name: string; completed: boolean; date: string }[]
  documents: { name: string; type: string; date: string }[]
}

// ===== Demo Data =====
const RAK_CENTER: [number, number] = [25.7895, 55.9432]

const DEMO_PROJECTS: DemoProject[] = [
  { id: '1', name: 'فيلا المريعي', client: 'أحمد المريعي', status: 'active', progress: 65, lat: 25.7895, lng: 55.9432, budget: 2500000, type: 'فيلا', startDate: '2024-01-15', endDate: '2025-06-30' },
  { id: '2', name: 'برج النخيل', client: 'شركة النخيل للاستثمار', status: 'active', progress: 40, lat: 25.7950, lng: 55.9600, budget: 18000000, type: 'برج سكني', startDate: '2024-03-01', endDate: '2026-12-31' },
  { id: '3', name: 'مجمع الواحة التجاري', client: 'مجموعة الواحة', status: 'delayed', progress: 28, lat: 25.7700, lng: 55.9350, budget: 35000000, type: 'تجاري', startDate: '2023-09-01', endDate: '2025-09-01' },
  { id: '4', name: 'مدرسة الفلاح', client: 'وزارة التربية والتعليم', status: 'completed', progress: 100, lat: 25.8050, lng: 55.9700, budget: 12000000, type: 'مدرسة', startDate: '2022-06-01', endDate: '2024-01-15' },
  { id: '5', name: 'فيلا الشامسي', client: 'خالد الشامسي', status: 'on_hold', progress: 15, lat: 25.7820, lng: 55.9280, budget: 1800000, type: 'فيلا', startDate: '2024-06-01', endDate: '2025-03-30' },
  { id: '6', name: 'فندق الخليج', client: 'شركة الخليج للضيافة', status: 'active', progress: 55, lat: 25.7980, lng: 55.9550, budget: 45000000, type: 'فندق', startDate: '2023-12-01', endDate: '2026-06-01' },
  { id: '7', name: 'مركز الصحة', client: 'دائرة الصحة رأس الخيمة', status: 'active', progress: 72, lat: 25.8010, lng: 55.9380, budget: 8000000, type: 'طبي', startDate: '2024-02-01', endDate: '2025-04-30' },
  { id: '8', name: 'فيلا الكعبي', client: 'سالم الكعبي', status: 'completed', progress: 100, lat: 25.7760, lng: 55.9510, budget: 2200000, type: 'فيلا', startDate: '2023-03-01', endDate: '2024-06-30' },
]

const DEMO_ENGINEERS: DemoEngineer[] = [
  { id: 'e1', name: 'م. محمد العلي', role: 'مهندس معماري أول', phone: '+971501234567', avatar: '🏗️' },
  { id: 'e2', name: 'م. سارة الحوسني', role: 'مهندسة إنشائية', phone: '+971502345678', avatar: '📐' },
  { id: 'e3', name: 'م. خالد الرميثي', role: 'مهندس كهربائي', phone: '+971503456789', avatar: '⚡' },
  { id: 'e4', name: 'م. فاطمة الزيودي', role: 'مهندسة MEP', phone: '+971504567890', avatar: '🔧' },
  { id: 'e5', name: 'م. عبدالله الشامسي', role: 'مهندس مدني', phone: '+971505678901', avatar: '🏗️' },
]

const DEMO_VISITS: DemoVisit[] = [
  { id: 'v1', engineerId: 'e1', projectId: '1', engineerName: 'م. محمد العلي', projectName: 'فيلا المريعي', date: '2025-04-08', timeIn: '08:30', timeOut: '11:45', status: 'completed', lat: 25.7895, lng: 55.9432, notes: 'فحص أعمال الصب ومراجعة الارتدادات' },
  { id: 'v2', engineerId: 'e2', projectId: '2', engineerName: 'م. سارة الحوسني', projectName: 'برج النخيل', date: '2025-04-08', timeIn: '09:00', timeOut: '13:00', status: 'completed', lat: 25.7950, lng: 55.9600, notes: 'معاينة حديد التسليح في الدور الخامس' },
  { id: 'v3', engineerId: 'e3', projectId: '3', engineerName: 'م. خالد الرميثي', projectName: 'مجمع الواحة التجاري', date: '2025-04-08', timeIn: '10:00', timeOut: null, status: 'in-progress', lat: 25.7700, lng: 55.9350, notes: 'فحص التمديدات الكهربائية' },
  { id: 'v4', engineerId: 'e4', projectId: '6', engineerName: 'م. فاطمة الزيودي', projectName: 'فندق الخليج', date: '2025-04-09', timeIn: '08:00', timeOut: null, status: 'planned', lat: 25.7980, lng: 55.9550, notes: 'مراجعة تصاميم MEP' },
  { id: 'v5', engineerId: 'e5', projectId: '7', engineerName: 'م. عبدالله الشامسي', projectName: 'مركز الصحة', date: '2025-04-09', timeIn: '09:30', timeOut: null, status: 'planned', lat: 25.8010, lng: 55.9380, notes: 'فحص أعمال النجارة' },
  { id: 'v6', engineerId: 'e1', projectId: '5', engineerName: 'م. محمد العلي', projectName: 'فيلا الشامسي', date: '2025-04-07', timeIn: '07:45', timeOut: '10:30', status: 'completed', lat: 25.7820, lng: 55.9280, notes: 'فحص الموقع ومراجعة الأساسات' },
  { id: 'v7', engineerId: 'e2', projectId: '1', engineerName: 'م. سارة الحوسني', projectName: 'فيلا المريعي', date: '2025-04-05', timeIn: '08:00', timeOut: '12:00', status: 'completed', lat: 25.7895, lng: 55.9432, notes: 'اختبار الخرسانة' },
  { id: 'v8', engineerId: 'e3', projectId: '6', engineerName: 'م. خالد الرميثي', projectName: 'فندق الخليج', date: '2025-04-06', timeIn: '09:00', timeOut: '11:30', status: 'completed', lat: 25.7980, lng: 55.9550, notes: 'فحص لوحات التوزيع الكهربائي' },
]

const DEMO_BOQ_ITEMS: BOQItem[] = [
  { id: 'b1', description: 'حفر أساسات', unit: 'م³', quantity: 250, unitCost: 45, category: 'civil', total: 11250 },
  { id: 'b2', description: 'خرسانة عادية للأساسات', unit: 'م³', quantity: 180, unitCost: 280, category: 'civil', total: 50400 },
  { id: 'b3', description: 'خرسانة مسلحة', unit: 'م³', quantity: 320, unitCost: 420, category: 'structural', total: 134400 },
  { id: 'b4', description: 'حديد تسليح', unit: 'طن', quantity: 85, unitCost: 3200, category: 'structural', total: 272000 },
  { id: 'b5', description: 'تمديدات كهربائية', unit: 'نقطة', quantity: 150, unitCost: 350, category: 'mep', total: 52500 },
  { id: 'b6', description: 'تمديدات تكييف مركزي', unit: 'طن تبريد', quantity: 25, unitCost: 8500, category: 'mep', total: 212500 },
  { id: 'b7', description: 'بلاط أرضيات رخام', unit: 'م²', quantity: 450, unitCost: 280, category: 'finishing', total: 126000 },
  { id: 'b8', description: 'دهانات داخلية', unit: 'م²', quantity: 1200, unitCost: 35, category: 'finishing', total: 42000 },
  { id: 'b9', description: 'أشجار ونباتات زينة', unit: 'عدد', quantity: 35, unitCost: 1200, category: 'landscape', total: 42000 },
  { id: 'b10', description: 'نظام ري آلي', unit: 'محطة', quantity: 4, unitCost: 3500, category: 'landscape', total: 14000 },
]

const BOQ_AI_SUGGESTIONS: Record<string, { min: number; max: number; unit: string }> = {
  'حفر': { min: 35, max: 55, unit: '/م³' },
  'خرسانة عادية': { min: 250, max: 320, unit: '/م³' },
  'خرسانة مسلحة': { min: 380, max: 480, unit: '/م³' },
  'حديد تسليح': { min: 2800, max: 3600, unit: '/طن' },
  'بلاط': { min: 200, max: 380, unit: '/م²' },
  'دهانات': { min: 28, max: 45, unit: '/م²' },
  'تمديدات كهربائية': { min: 300, max: 450, unit: '/نقطة' },
  'تكييف': { min: 7000, max: 10000, unit: '/طن تبريد' },
}

const DEMO_TIME_ENTRIES: TimeEntry[] = [
  { id: 't1', projectId: '1', projectName: 'فيلا المريعي', task: 'مراجعة المخططات', date: '2025-04-08', startTime: '08:00', endTime: '12:00', duration: 4, isBillable: true, isTimerRunning: false },
  { id: 't2', projectId: '2', projectName: 'برج النخيل', task: 'تصميم هيكي', date: '2025-04-08', startTime: '12:30', endTime: '16:30', duration: 4, isBillable: true, isTimerRunning: false },
  { id: 't3', projectId: '3', projectName: 'مجمع الواحة التجاري', task: 'متابعة المقاول', date: '2025-04-07', startTime: '09:00', endTime: '11:00', duration: 2, isBillable: true, isTimerRunning: false },
  { id: 't4', projectId: '6', projectName: 'فندق الخليج', task: 'إعداد تقرير', date: '2025-04-07', startTime: '13:00', endTime: '15:00', duration: 2, isBillable: false, isTimerRunning: false },
  { id: 't5', projectId: '1', projectName: 'فيلا المريعي', task: 'زيارة موقع', date: '2025-04-06', startTime: '08:30', endTime: '11:30', duration: 3, isBillable: true, isTimerRunning: false },
  { id: 't6', projectId: '7', projectName: 'مركز الصحة', task: 'تنسيق مع البلدية', date: '2025-04-08', startTime: '10:00', endTime: null, duration: 0, isBillable: false, isTimerRunning: true },
]

const DEMO_CLIENTS: DemoProject[] = DEMO_PROJECTS

const DEMO_INTERACTIONS: ClientInteraction[] = [
  { id: 'c1', clientId: '1', clientName: 'أحمد المريعي', projectId: '1', projectName: 'فيلا المريعي', type: 'meeting', date: '2025-04-08', subject: 'مراجعة التصميم النهائي', description: 'تم عقد اجتماع لمراجعة التعديلات المطلوبة على التصميم الداخلي', outcome: 'تمت الموافقة على التعديلات' },
  { id: 'c2', clientId: '2', clientName: 'شركة النخيل للاستثمار', projectId: '2', projectName: 'برج النخيل', type: 'call', date: '2025-04-07', subject: 'متابعة حالة المشروع', description: 'اتصال هاتفي لمناقشة التأخير في تنفيذ الأعمال الإنشائية', outcome: 'طلب تعجيل المقاول' },
  { id: 'c3', clientId: '3', clientName: 'مجموعة الواحة', projectId: '3', projectName: 'مجمع الواحة التجاري', type: 'email', date: '2025-04-06', subject: 'إرسال المخططات المحدثة', description: 'تم إرسال نسخة محدثة من مخططات الطابق الثاني', outcome: 'بانتظار الرد' },
  { id: 'c4', clientId: '1', clientName: 'أحمد المريعي', projectId: '1', projectName: 'فيلا المريعي', type: 'whatsapp', date: '2025-04-05', subject: 'تأكيد موعد الزيارة', description: 'تأكيد موعد زيارة الموقع يوم الثلاثاء', outcome: 'تم التأكيد' },
  { id: 'c5', clientId: '6', clientName: 'شركة الخليج للضيافة', projectId: '6', projectName: 'فندق الخليج', type: 'meeting', date: '2025-04-04', subject: 'اجتماع لجنة المراجعة', description: 'اجتماع لمناقشة مخططات MEP مع فريق الفندق', outcome: 'تحتاج تعديلات على مسار التكييف' },
  { id: 'c6', clientId: '7', clientName: 'دائرة الصحة رأس الخيمة', projectId: '7', projectName: 'مركز الصحة', type: 'call', date: '2025-04-03', subject: 'استفسار عن التراخيص', description: 'اتصال بخصوص حالة طلب الترخيص من البلدية', outcome: 'الطلب قيد المراجعة' },
]

const DEMO_WHATSAPP_MESSAGES: WhatsAppMessage[] = [
  { id: 'w1', contactName: 'أحمد المريعي', phone: '+971501112233', message: 'السلام عليكم، متى يمكننا مراجعة التصميم المحدث؟', timestamp: '2025-04-08 10:30', direction: 'received', projectName: 'فيلا المريعي' },
  { id: 'w2', contactName: 'أحمد المريعي', phone: '+971501112233', message: 'وعليكم السلام، يمكننا يوم الخميس الساعة 10 صباحاً', timestamp: '2025-04-08 10:35', direction: 'sent', projectName: 'فيلا المريعي' },
  { id: 'w3', contactName: 'خالد الشامسي', phone: '+971502223344', message: 'أريد معرفة حالة المشروع', timestamp: '2025-04-07 14:20', direction: 'received', projectName: 'فيلا الشامسي' },
  { id: 'w4', contactName: 'خالد الشامسي', phone: '+971502223344', message: 'المشروع متوقف حالياً بانتظار الموافقة. سأرسل لكم التقرير قريباً', timestamp: '2025-04-07 14:45', direction: 'sent', projectName: 'فيلا الشامسي' },
  { id: 'w5', contactName: 'سالم الكعبي', phone: '+971503334455', message: 'شكراً لكم على العمل الممتاز! المشروع يبدو رائعاً', timestamp: '2025-04-06 09:00', direction: 'received', projectName: 'فيلا الكعبي' },
]

const DEMO_CLIENT_PROJECTS: ClientProject[] = [
  {
    id: '1', name: 'فيلا المريعي', status: 'active', progress: 65,
    milestones: [
      { name: 'التصميم المعماري', completed: true, date: '2024-03-01' },
      { name: 'التصميم الإنشائي', completed: true, date: '2024-04-15' },
      { name: 'ترخيص البناء', completed: true, date: '2024-06-01' },
      { name: 'أعمال الأساسات', completed: true, date: '2024-09-01' },
      { name: 'الهيكل الخرساني', completed: false, date: '2025-03-01' },
      { name: 'التشطيبات', completed: false, date: '2025-06-15' },
      { name: 'التسليم', completed: false, date: '2025-06-30' },
    ],
    documents: [
      { name: 'المخطط المعماري النهائي', type: 'pdf', date: '2024-03-01' },
      { name: 'دراسة الإنشاء', type: 'pdf', date: '2024-04-15' },
      { name: 'رخصة البناء', type: 'pdf', date: '2024-06-01' },
      { name: 'تقرير الزيارة الأخيرة', type: 'pdf', date: '2025-04-08' },
    ]
  }
]

// ===== Utility Functions =====
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount)
}

function formatDateAr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-500'
    case 'delayed': return 'bg-red-500'
    case 'completed': return 'bg-blue-500'
    case 'on_hold': return 'bg-amber-500'
    default: return 'bg-slate-400'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'نشط'
    case 'delayed': return 'متأخر'
    case 'completed': return 'مكتمل'
    case 'on_hold': return 'متوقف'
    default: return status
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700'
    case 'delayed': return 'bg-red-100 text-red-700'
    case 'completed': return 'bg-blue-100 text-blue-700'
    case 'on_hold': return 'bg-amber-100 text-amber-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function getVisitStatusLabel(status: string): string {
  switch (status) {
    case 'planned': return 'مخطط'
    case 'in-progress': return 'جاري الزيارة'
    case 'completed': return 'مكتمل'
    default: return status
  }
}

function getVisitStatusColor(status: string): string {
  switch (status) {
    case 'planned': return 'bg-slate-100 text-slate-700'
    case 'in-progress': return 'bg-amber-100 text-amber-700'
    case 'completed': return 'bg-emerald-100 text-emerald-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function getInteractionIcon(type: string) {
  switch (type) {
    case 'meeting': return <Users className="h-4 w-4" />
    case 'call': return <PhoneCall className="h-4 w-4" />
    case 'email': return <Mail className="h-4 w-4" />
    case 'whatsapp': return <MessageCircle className="h-4 w-4" />
    default: return <FileText className="h-4 w-4" />
  }
}

function getInteractionTypeLabel(type: string): string {
  switch (type) {
    case 'meeting': return 'اجتماع'
    case 'call': return 'مكالمة'
    case 'email': return 'بريد إلكتروني'
    case 'whatsapp': return 'واتساب'
    default: return type
  }
}

function getCategoryLabel(cat: string): string {
  switch (cat) {
    case 'civil': return 'مدني'
    case 'structural': return 'إنشائي'
    case 'mep': return 'MEP'
    case 'finishing': return 'تشطيبات'
    case 'landscape': return 'تنسيق مواقع'
    default: return cat
  }
}

function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'civil': return 'bg-amber-100 text-amber-700'
    case 'structural': return 'bg-red-100 text-red-700'
    case 'mep': return 'bg-blue-100 text-blue-700'
    case 'finishing': return 'bg-purple-100 text-purple-700'
    case 'landscape': return 'bg-green-100 text-green-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

// ===== NAVIGATION =====
const NAV_ITEMS: NavItem[] = [
  { id: 'map', label: 'خريطة المشاريع', icon: <MapPin className="h-5 w-5" /> },
  { id: 'visits', label: 'زيارات المهندسين', icon: <Car className="h-5 w-5" /> },
  { id: 'boq', label: 'حاسبة التكاليف', icon: <Calculator className="h-5 w-5" /> },
  { id: 'time', label: 'إدارة الوقت', icon: <Clock className="h-5 w-5" /> },
  { id: 'portal', label: 'بوابة العملاء', icon: <Globe className="h-5 w-5" /> },
  { id: 'whatsapp', label: 'واتساب', icon: <MessageCircle className="h-5 w-5" /> },
  { id: 'communications', label: 'سجل التواصل', icon: <Phone className="h-5 w-5" /> },
  { id: 'design', label: 'إدارة التصميم', icon: <PenTool className="h-5 w-5" /> },
]



// ===== MAIN COMPONENT =====
export default function FeaturesHub({ language }: FeaturesHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>('map')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<DemoProject | null>(null)
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [showAddBoqItem, setShowAddBoqItem] = useState(false)
  const [contingencyPercent, setContingencyPercent] = useState(10)
  const [whatsappSearch, setWhatsappSearch] = useState('')
  const [selectedWhatsappContact, setSelectedWhatsappContact] = useState<string | null>(null)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [newVisit, setNewVisit] = useState({ engineerId: '', projectId: '', date: '', timeIn: '', notes: '' })
  const [newInteraction, setNewInteraction] = useState({ clientId: '', projectId: '', type: 'meeting', date: '', subject: '', description: '', outcome: '' })
  const [boqItems, setBoqItems] = useState<BOQItem[]>(DEMO_BOQ_ITEMS)
  const [visits, setVisits] = useState<DemoVisit[]>(DEMO_VISITS)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(DEMO_TIME_ENTRIES)
  const [interactions, setInteractions] = useState<ClientInteraction[]>(DEMO_INTERACTIONS)
  const [newBoqItem, setNewBoqItem] = useState({ description: '', unit: 'م²', quantity: 0, unitCost: 0, category: 'civil' as BOQItem['category'] })
  const [commFilter, setCommFilter] = useState({ type: 'all', clientId: 'all' })
  const [activeTimer, setActiveTimer] = useState<string | null>('t6')
  const [timerSeconds, setTimerSeconds] = useState(0)

  // Timer logic
  useEffect(() => {
    if (!activeTimer) return
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTimer])

  const formatTimer = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  // Stats calculations
  const stats = useMemo(() => {
    const completedVisits = visits.filter(v => v.status === 'completed')
    const avgDuration = completedVisits.length > 0
      ? completedVisits.reduce((acc, v) => {
          if (v.timeIn && v.timeOut) {
            const [h1, m1] = v.timeIn.split(':').map(Number)
            const [h2, m2] = v.timeOut.split(':').map(Number)
            return acc + (h2 * 60 + m2) - (h1 * 60 + m1)
          }
          return acc
        }, 0) / completedVisits.length / 60
      : 0

    const totalBillable = timeEntries.filter(t => t.isBillable).reduce((acc, t) => acc + t.duration, 0)
    const totalNonBillable = timeEntries.filter(t => !t.isBillable).reduce((acc, t) => acc + t.duration, 0)

    return {
      totalVisitsThisMonth: visits.length,
      avgVisitDuration: avgDuration.toFixed(1),
      totalBillableHours: totalBillable,
      totalNonBillableHours: totalNonBillable,
      activeProjects: DEMO_PROJECTS.filter(p => p.status === 'active').length,
      delayedProjects: DEMO_PROJECTS.filter(p => p.status === 'delayed').length,
      completedProjects: DEMO_PROJECTS.filter(p => p.status === 'completed').length,
    }
  }, [visits, timeEntries])

  // BOQ calculations
  const boqStats = useMemo(() => {
    const subtotal = boqItems.reduce((acc, item) => acc + item.total, 0)
    const vat = subtotal * 0.05
    const contingency = subtotal * (contingencyPercent / 100)
    const grandTotal = subtotal + vat + contingency

    const byCategory = boqItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = 0
      acc[item.category] += item.total
      return acc
    }, {} as Record<string, number>)

    return { subtotal, vat, contingency, grandTotal, byCategory }
  }, [boqItems, contingencyPercent])

  // Project time allocation for pie chart
  const projectTimeAllocation = useMemo(() => {
    return timeEntries.reduce((acc, t) => {
      if (!acc[t.projectName]) acc[t.projectName] = 0
      acc[t.projectName] += t.duration
      return acc
    }, {} as Record<string, number>)
  }, [timeEntries])

  const pieColors = ['#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f97316']

  // WhatsApp contacts (unique from projects)
  const whatsappContacts = useMemo(() => {
    const contacts: { name: string; phone: string; projectName: string }[] = [
      { name: 'أحمد المريعي', phone: '+971501112233', projectName: 'فيلا المريعي' },
      { name: 'خالد الشامسي', phone: '+971502223344', projectName: 'فيلا الشامسي' },
      { name: 'سالم الكعبي', phone: '+971503334455', projectName: 'فيلا الكعبي' },
      { name: 'شركة النخيل', phone: '+971504445566', projectName: 'برج النخيل' },
      { name: 'مجموعة الواحة', phone: '+971505556677', projectName: 'مجمع الواحة التجاري' },
      { name: 'شركة الخليج', phone: '+971506667788', projectName: 'فندق الخليج' },
    ]
    return contacts.filter(c => c.name.includes(whatsappSearch) || c.projectName.includes(whatsappSearch))
  }, [whatsappSearch])

  const filteredInteractions = useMemo(() => {
    return interactions.filter(i => {
      if (commFilter.type !== 'all' && i.type !== commFilter.type) return false
      if (commFilter.clientId !== 'all' && i.clientId !== commFilter.clientId) return false
      return true
    })
  }, [interactions, commFilter])

  const whatsappTemplates = [
    'تحية طيبة، نود إعلامكم بأنه تم تحديث حالة المشروع.',
    'السلام عليكم، نود تأكيد موعد الزيارة الميدانية.',
    'مرحباً، تم إرسال المخططات المحدثة لمراجعتكم.',
    'تحية، نود طلب موافقتكم على التعديلات المقترحة.',
    'السلام عليكم، تقرير سير الأعمال لهذا الأسبوع.',
  ]

  const handleAddVisit = () => {
    const engineer = DEMO_ENGINEERS.find(e => e.id === newVisit.engineerId)
    const project = DEMO_PROJECTS.find(p => p.id === newVisit.projectId)
    if (!engineer || !project) return

    const visit: DemoVisit = {
      id: `v${Date.now()}`,
      engineerId: newVisit.engineerId,
      projectId: newVisit.projectId,
      engineerName: engineer.name,
      projectName: project.name,
      date: newVisit.date,
      timeIn: newVisit.timeIn,
      timeOut: null,
      status: 'planned',
      lat: project.lat,
      lng: project.lng,
      notes: newVisit.notes,
    }
    setVisits(prev => [visit, ...prev])
    setShowAddVisit(false)
    setNewVisit({ engineerId: '', projectId: '', date: '', timeIn: '', notes: '' })
  }

  const handleAddBoqItem = () => {
    const item: BOQItem = {
      id: `b${Date.now()}`,
      description: newBoqItem.description,
      unit: newBoqItem.unit,
      quantity: newBoqItem.quantity,
      unitCost: newBoqItem.unitCost,
      category: newBoqItem.category,
      total: newBoqItem.quantity * newBoqItem.unitCost,
    }
    setBoqItems(prev => [...prev, item])
    setShowAddBoqItem(false)
    setNewBoqItem({ description: '', unit: 'م²', quantity: 0, unitCost: 0, category: 'civil' })
  }

  const handleAddInteraction = () => {
    const client = DEMO_PROJECTS.find(p => p.id === newInteraction.clientId)
    const project = DEMO_PROJECTS.find(p => p.id === newInteraction.projectId)
    if (!client || !project) return
    const interaction: ClientInteraction = {
      id: `c${Date.now()}`,
      clientId: newInteraction.clientId,
      clientName: client.client,
      projectId: newInteraction.projectId,
      projectName: project.name,
      type: newInteraction.type as ClientInteraction['type'],
      date: newInteraction.date,
      subject: newInteraction.subject,
      description: newInteraction.description,
      outcome: newInteraction.outcome,
    }
    setInteractions(prev => [interaction, ...prev])
    setShowAddInteraction(false)
    setNewInteraction({ clientId: '', projectId: '', type: 'meeting', date: '', subject: '', description: '', outcome: '' })
  }

  const handleToggleTimer = (entryId: string) => {
    setTimeEntries(prev => prev.map(e => {
      if (e.id === entryId) {
        const isRunning = !e.isTimerRunning
        return { ...e, isTimerRunning: isRunning, endTime: isRunning ? null : (e.endTime || new Date().toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })) }
      }
      return { ...e, isTimerRunning: false, endTime: e.endTime || (e.isTimerRunning ? new Date().toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' }) : e.endTime) }
    }))
    setActiveTimer(prev => prev === entryId ? null : entryId)
  }

  // ===== RENDER SECTIONS =====

  // --- Map Section ---
  const renderMapSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">خريطة المشاريع</h2>
          <p className="text-sm text-slate-500">جميع مواقع المشاريع في رأس الخيمة</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['active', 'delayed', 'completed', 'on_hold'].map(status => (
            <Badge key={status} variant="outline" className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-accent">
              <span className={cn('w-2.5 h-2.5 rounded-full', getStatusColor(status))} />
              {getStatusLabel(status)} ({DEMO_PROJECTS.filter(p => p.status === status).length})
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">مشاريع نشطة</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.activeProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">مشاريع متأخرة</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.delayedProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">مشاريع مكتملة</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.completedProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">إجمالي الميزانية</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(DEMO_PROJECTS.reduce((a, p) => a + p.budget, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[500px] md:h-[600px] relative" style={{ direction: 'ltr' }}>
            {selectedProject ? (
              <>
                <iframe
                  src={buildMapUrl({ lat: selectedProject.lat, lng: selectedProject.lng })}
                  className="w-full h-full border-0"
                  title="خريطة المشروع"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm shadow-md"
                    onClick={() => setSelectedProject(null)}
                  >
                    <MapPin className="h-4 w-4 me-1" />
                    عرض الكل
                  </Button>
                </div>
              </>
            ) : (
              <iframe
                src={buildMapUrl()}
                className="w-full h-full border-0"
                title="خريطة جميع المشاريع"
                loading="lazy"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEMO_PROJECTS.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={cn('border-slate-200 dark:border-slate-700/50 hover:shadow-lg transition-shadow cursor-pointer', selectedProject?.id === project.id && 'ring-2 ring-teal-500')}
              onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', getStatusColor(project.status))} />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{project.name}</h3>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px]', getStatusBg(project.status))}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-3">{project.client} • {project.type}</p>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">التقدم</span>
                    <span className="font-medium text-slate-900 dark:text-white">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{formatCurrency(project.budget)}</span>
                  <span className="text-slate-400">{project.startDate} - {project.endDate}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // --- Visits Section ---
  const renderVisitsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">تتبع زيارات المهندسين</h2>
          <p className="text-sm text-slate-500">إدارة ومتابعة زيارات المواقع الميدانية</p>
        </div>
        <Button onClick={() => setShowAddVisit(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="h-4 w-4 me-2" /> زيارة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <MapPinned className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">إجمالي الزيارات</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalVisitsThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">متوسط المدة</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.avgVisitDuration} ساعة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Navigation className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">زيارات اليوم</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{visits.filter(v => v.date === '2025-04-08').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">مكتملة</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{visits.filter(v => v.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map with visits */}
      <Card className="border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[300px]">
            {mounted ? (
              <Suspense fallback={<MapLoading />}>
                <MapContainer center={RAK_CENTER} zoom={13} className="h-full w-full" style={{ direction: 'ltr' }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {visits.map((visit) => (
                    <Marker key={visit.id} position={[visit.lat, visit.lng]}>
                      <Popup>
                        <div dir="rtl" className="text-right min-w-[180px]">
                          <h3 className="font-bold text-sm">{visit.engineerName}</h3>
                          <p className="text-xs text-gray-600">{visit.projectName}</p>
                          <p className="text-xs text-gray-500 mt-1">{visit.date} • {visit.timeIn} - {visit.timeOut || '...'}</p>
                          <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full mt-1', getVisitStatusColor(visit.status))}>
                            {getVisitStatusLabel(visit.status)}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Suspense>
            ) : (
              <MapLoading />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visits per Engineer */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">الزيارات حسب المهندس</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEMO_ENGINEERS.map(eng => {
              const engVisits = visits.filter(v => v.engineerId === eng.id)
              return (
                <div key={eng.id} className="flex items-center gap-3">
                  <span className="text-xl">{eng.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{eng.name}</span>
                      <span className="text-xs text-slate-500">{engVisits.length} زيارة</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((engVisits.length / Math.max(...DEMO_ENGINEERS.map(e => visits.filter(v => v.engineerId === e.id).length))) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Visits List */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">سجل الزيارات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="text-xs">المهندس</TableHead>
                  <TableHead className="text-xs">المشروع</TableHead>
                  <TableHead className="text-xs">التاريخ</TableHead>
                  <TableHead className="text-xs">الوقت</TableHead>
                  <TableHead className="text-xs">الحالة</TableHead>
                  <TableHead className="text-xs">ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map(visit => (
                  <TableRow key={visit.id}>
                    <TableCell className="text-xs font-medium">{visit.engineerName}</TableCell>
                    <TableCell className="text-xs">{visit.projectName}</TableCell>
                    <TableCell className="text-xs">{visit.date}</TableCell>
                    <TableCell className="text-xs">{visit.timeIn} - {visit.timeOut || '...'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', getVisitStatusColor(visit.status))}>
                        {getVisitStatusLabel(visit.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{visit.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // --- BOQ Section ---
  const renderBoqSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">حاسبة تكاليف الكميات</h2>
          <p className="text-sm text-slate-500">حساب تفصيلي لتكاليف البناء مع ضريبة القيمة المضافة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50">
            <Download className="h-4 w-4 me-2" /> تصدير PDF
          </Button>
          <Button onClick={() => setShowAddBoqItem(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="h-4 w-4 me-2" /> بند جديد
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(boqStats.byCategory).map(([cat, total]) => (
          <Card key={cat} className="border-slate-200 dark:border-slate-700/50">
            <CardContent className="p-3">
              <Badge variant="outline" className={cn('text-[10px] mb-2', getCategoryColor(cat))}>
                {getCategoryLabel(cat)}
              </Badge>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* BOQ Table */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="text-xs">البند</TableHead>
                  <TableHead className="text-xs">الوصف</TableHead>
                  <TableHead className="text-xs">الفئة</TableHead>
                  <TableHead className="text-xs">الوحدة</TableHead>
                  <TableHead className="text-xs text-center">الكمية</TableHead>
                  <TableHead className="text-xs text-center">سعر الوحدة</TableHead>
                  <TableHead className="text-xs text-center">الإجمالي</TableHead>
                  <TableHead className="text-xs text-center">تقدير AI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boqItems.map(item => {
                  const aiSuggestion = Object.entries(BOQ_AI_SUGGESTIONS).find(([key]) => item.description.includes(key))
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-mono text-slate-400">{item.id.replace('b', 'BOQ-')}</TableCell>
                      <TableCell className="text-xs font-medium">{item.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', getCategoryColor(item.category))}>
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{item.unit}</TableCell>
                      <TableCell className="text-xs text-center tabular-nums">{item.quantity.toLocaleString('ar-AE')}</TableCell>
                      <TableCell className="text-xs text-center tabular-nums">{formatCurrency(item.unitCost)}</TableCell>
                      <TableCell className="text-xs text-center font-semibold tabular-nums">{formatCurrency(item.total)}</TableCell>
                      <TableCell className="text-xs text-center">
                        {aiSuggestion ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-[10px] text-teal-600 border-teal-300 cursor-help">
                                  {formatCurrency(aiSuggestion[1].min)} - {formatCurrency(aiSuggestion[1].max)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">نطاق السعر التقديري {aiSuggestion[1].unit}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : <span className="text-slate-300">-</span>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">المجموع الفرعي</span>
              <span className="text-lg font-bold tabular-nums">{formatCurrency(boqStats.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">ضريبة القيمة المضافة (5%)</span>
                <Badge variant="outline" className="text-[10px]">UAE VAT</Badge>
              </div>
              <span className="text-lg font-bold tabular-nums">{formatCurrency(boqStats.vat)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">احتياطي طوارئ</span>
                <Select value={String(contingencyPercent)} onValueChange={v => setContingencyPercent(Number(v))}>
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20].map(p => (
                      <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-lg font-bold tabular-nums">{formatCurrency(boqStats.contingency)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 dark:text-white">الإجمالي الكلي</span>
              <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">{formatCurrency(boqStats.grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // --- Time Management Section ---
  const renderTimeSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">إدارة الوقت</h2>
          <p className="text-sm text-slate-500">تتبع ساعات العمل على المشاريع</p>
        </div>
        {activeTimer && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono font-bold text-amber-700 dark:text-amber-400">{formatTimer(timerSeconds)}</span>
            <span className="text-xs text-amber-600 dark:text-amber-500">
              {timeEntries.find(t => t.id === activeTimer)?.projectName}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">إجمالي الساعات</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalBillableHours + stats.totalNonBillableHours} ساعة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">ساعات قابلة للفوترة</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalBillableHours} ساعة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">غير قابلة للفوترة</p>
                <p className="text-xl font-bold text-slate-600 dark:text-slate-400">{stats.totalNonBillableHours} ساعة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">مهام متأخرة</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart - Project Time Allocation */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">توزيع الوقت حسب المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-40 h-40 rounded-full flex-shrink-0 relative" style={{
              background: `conic-gradient(${Object.entries(projectTimeAllocation).map(([name, hours], i) => {
                const totalHours = Object.values(projectTimeAllocation).reduce((a, b) => a + b, 0)
                const startAngle = Object.entries(projectTimeAllocation).slice(0, i).reduce((acc, [, h]) => acc + (h / totalHours) * 360, 0)
                const endAngle = startAngle + (hours / totalHours) * 360
                return `${pieColors[i % pieColors.length]} ${startAngle}deg ${endAngle}deg`
              }).join(', ')})`
            }}>
              <div className="absolute inset-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{Object.values(projectTimeAllocation).reduce((a, b) => a + b, 0)}</p>
                  <p className="text-[10px] text-slate-500">ساعة</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {Object.entries(projectTimeAllocation).map(([name, hours], i) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400 flex-1 truncate">{name}</span>
                  <span className="text-xs font-medium tabular-nums">{hours} ساعة</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">سجل الوقت اليومي</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="text-xs">المشروع</TableHead>
                  <TableHead className="text-xs">المهمة</TableHead>
                  <TableHead className="text-xs">التاريخ</TableHead>
                  <TableHead className="text-xs">الوقت</TableHead>
                  <TableHead className="text-xs text-center">المدة</TableHead>
                  <TableHead className="text-xs">النوع</TableHead>
                  <TableHead className="text-xs text-center">تحكم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs font-medium">{entry.projectName}</TableCell>
                    <TableCell className="text-xs">{entry.task}</TableCell>
                    <TableCell className="text-xs">{entry.date}</TableCell>
                    <TableCell className="text-xs tabular-nums">{entry.startTime} - {entry.endTime || (entry.isTimerRunning ? formatTimer(timerSeconds) : '...')}</TableCell>
                    <TableCell className="text-xs text-center tabular-nums">{entry.duration || (entry.isTimerRunning ? `${Math.floor(timerSeconds / 3600)}:${Math.floor((timerSeconds % 3600) / 60)}` : '-')} ساعة</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', entry.isBillable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200')}>
                        {entry.isBillable ? 'قابل للفوترة' : 'غير قابل'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn('h-7 w-7 p-0', entry.isTimerRunning ? 'text-red-500 hover:text-red-700' : 'text-teal-500 hover:text-teal-700')}
                        onClick={() => handleToggleTimer(entry.id)}
                      >
                        {entry.isTimerRunning ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">ملخص الأسبوع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day, i) => {
              const dayHours = i < 3 ? [5, 4, 2][i] : i === 3 ? 8 : 0
              return (
                <div key={day} className="text-center">
                  <p className="text-[10px] text-slate-500 mb-1">{day}</p>
                  <div className={cn('w-full h-16 rounded-lg flex items-center justify-center text-xs font-bold', dayHours > 0 ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400')}>
                    {dayHours > 0 ? `${dayHours}h` : '-'}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // --- Client Portal Section ---
  const renderPortalSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">بوابة العميل</h2>
          <p className="text-sm text-slate-500">عرض حالة المشاريع والمعالم الرئيسية</p>
        </div>
        <Select defaultValue="1">
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEMO_PROJECTS.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.client}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {DEMO_CLIENT_PROJECTS.map(project => (
        <Card key={project.id} className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">{project.name}</CardTitle>
              <Badge className={cn('text-xs', getStatusBg(project.status))}>{getStatusLabel(project.status)}</Badge>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600">التقدم الكلي</span>
                <span className="font-bold">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-3" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Milestones */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-teal-600" />
                المعالم الرئيسية
              </h3>
              <div className="space-y-3">
                {project.milestones.map((ms, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', ms.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400')}>
                      {ms.completed ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className={cn('text-sm', ms.completed ? 'text-slate-900 dark:text-white' : 'text-slate-500')}>{ms.name}</p>
                      <p className="text-[10px] text-slate-400">{ms.date}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px]', ms.completed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500')}>
                      {ms.completed ? 'مكتمل' : 'قيد الانتظار'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Archive className="h-4 w-4 text-teal-600" />
                المستندات المشتركة
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {project.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <FileText className="h-4 w-4 text-teal-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">{doc.date} • {doc.type.toUpperCase()}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // --- WhatsApp Section ---
  const renderWhatsAppSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">واتساب</h2>
          <p className="text-sm text-slate-500">التواصل مع العملاء عبر واتساب</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Contact List */}
        <Card className="border-slate-200 dark:border-slate-700/50 flex flex-col">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="بحث في جهات الاتصال..."
                className="pr-9 h-9 text-sm"
                value={whatsappSearch}
                onChange={e => setWhatsappSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-3 space-y-1">
                {whatsappContacts.map(contact => (
                  <button
                    key={contact.phone}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-right',
                      selectedWhatsappContact === contact.phone ? 'bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                    onClick={() => setSelectedWhatsappContact(contact.phone)}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{contact.projectName}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="border-slate-200 dark:border-slate-700/50 lg:col-span-2 flex flex-col">
          <CardHeader className="pb-3 border-b">
            {selectedWhatsappContact ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{whatsappContacts.find(c => c.phone === selectedWhatsappContact)?.name}</p>
                    <p className="text-[10px] text-slate-500">{whatsappContacts.find(c => c.phone === selectedWhatsappContact)?.projectName}</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${selectedWhatsappContact?.replace('+', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs">
                    <ExternalLink className="h-3 w-3 me-1" />
                    فتح واتساب
                  </Button>
                </a>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center">اختر جهة اتصال للبدء</p>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {DEMO_WHATSAPP_MESSAGES
                  .filter(m => !selectedWhatsappContact || m.phone === selectedWhatsappContact)
                  .map(msg => (
                  <div key={msg.id} className={cn('flex', msg.direction === 'sent' ? 'justify-start' : 'justify-end')}>
                    <div className={cn('max-w-[70%] rounded-2xl px-4 py-2.5',
                      msg.direction === 'sent'
                        ? 'bg-emerald-500 text-white rounded-tr-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm'
                    )}>
                      {msg.direction === 'received' && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{msg.contactName}</p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className={cn('text-[10px] mt-1', msg.direction === 'sent' ? 'text-emerald-100' : 'text-slate-400')}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick Templates */}
            <div className="px-3 py-2 border-t">
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {whatsappTemplates.map((template, i) => (
                  <button
                    key={i}
                    className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900/20 dark:hover:text-teal-400 transition-colors whitespace-nowrap"
                    onClick={() => setWhatsappMessage(template)}
                  >
                    {template.substring(0, 40)}...
                  </button>
                ))}
              </div>
              {/* Input */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="اكتب رسالتك..."
                  className="flex-1 h-10 text-sm"
                  value={whatsappMessage}
                  onChange={e => setWhatsappMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && whatsappMessage.trim()) setWhatsappMessage('') }}
                />
                {selectedWhatsappContact && whatsappMessage.trim() && (
                  <a href={`https://wa.me/${selectedWhatsappContact.replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white px-4">
                      <Send className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // --- Communications Section ---
  const renderCommunicationsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">سجل التواصل مع العملاء</h2>
          <p className="text-sm text-slate-500">جميع التفاعلات والاجتماعات والمكالمات</p>
        </div>
        <div className="flex gap-2">
          <Select value={commFilter.type} onValueChange={v => setCommFilter(p => ({ ...p, type: v }))}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="meeting">اجتماعات</SelectItem>
              <SelectItem value="call">مكالمات</SelectItem>
              <SelectItem value="email">بريد إلكتروني</SelectItem>
              <SelectItem value="whatsapp">واتساب</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddInteraction(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="h-4 w-4 me-2" /> تسجيل تواصل
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['meeting', 'call', 'email', 'whatsapp'] as const).map(type => (
          <Card key={type} className="border-slate-200 dark:border-slate-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                type === 'meeting' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                type === 'call' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                type === 'email' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                'bg-green-100 dark:bg-green-900/30 text-green-600'
              )}>
                {getInteractionIcon(type)}
              </div>
              <div>
                <p className="text-xs text-slate-500">{getInteractionTypeLabel(type)}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{interactions.filter(i => i.type === type).length}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <div className="p-4 space-y-4">
              {filteredInteractions.map((interaction, idx) => (
                <motion.div
                  key={interaction.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                      interaction.type === 'meeting' ? 'bg-blue-100 text-blue-600' :
                      interaction.type === 'call' ? 'bg-emerald-100 text-emerald-600' :
                      interaction.type === 'email' ? 'bg-purple-100 text-purple-600' :
                      'bg-green-100 text-green-600'
                    )}>
                      {getInteractionIcon(interaction.type)}
                    </div>
                    {idx < filteredInteractions.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <Card className="border-slate-200 dark:border-slate-700/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{interaction.subject}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{interaction.clientName} • {interaction.projectName}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-[10px]">
                              {getInteractionTypeLabel(interaction.type)}
                            </Badge>
                            <span className="text-[10px] text-slate-400">{interaction.date}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{interaction.description}</p>
                        {interaction.outcome && (
                          <div className="flex items-start gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/10">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">{interaction.outcome}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // --- Design Management Section (placeholder) ---
  const renderDesignSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">إدارة التصميم</h2>
          <p className="text-sm text-slate-500">إدارة مراحل التصميم والرسومات الهندسية</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'المفهوم', icon: '💡', status: 'معتمد', color: 'bg-emerald-100 text-emerald-700' },
          { label: 'تصميم أولي', icon: '📐', status: 'قيد التنفيذ', color: 'bg-amber-100 text-amber-700' },
          { label: 'تطوير التصميم', icon: '🏗️', status: 'لم يبدأ', color: 'bg-slate-100 text-slate-600' },
          { label: 'مستندات التنفيذ', icon: '📋', status: 'لم يبدأ', color: 'bg-slate-100 text-slate-600' },
          { label: 'كما بُني', icon: '✅', status: 'لم يبدأ', color: 'bg-slate-100 text-slate-600' },
        ].map((phase, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-700/50 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">{phase.icon}</span>
              <p className="text-xs font-semibold mt-2 text-slate-900 dark:text-white">{phase.label}</p>
              <Badge variant="outline" className={cn('text-[10px] mt-2', phase.color)}>{phase.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border-slate-200 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">أحدث النشاطات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'تم رفع مخطط الطابق الثاني', project: 'فيلا المريعي', time: 'منذ ساعتين', type: 'upload' },
              { action: 'طلب مراجعة مخطط الواجهات', project: 'برج النخيل', time: 'منذ 4 ساعات', type: 'review' },
              { action: 'تم اعتماد مخطط الأساسات', project: 'فندق الخليج', time: 'منذ يوم', type: 'approve' },
              { action: 'تم رصد تعارض في التمديدات', project: 'مجمع الواحة التجاري', time: 'منذ يومين', type: 'clash' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                  item.type === 'upload' ? 'bg-blue-100 text-blue-600' :
                  item.type === 'review' ? 'bg-amber-100 text-amber-600' :
                  item.type === 'approve' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-red-100 text-red-600'
                )}>
                  {item.type === 'upload' ? <FileText className="h-4 w-4" /> :
                   item.type === 'review' ? <Eye className="h-4 w-4" /> :
                   item.type === 'approve' ? <CheckCircle2 className="h-4 w-4" /> :
                   <AlertTriangle className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">{item.action}</p>
                  <p className="text-[10px] text-slate-500">{item.project} • {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Design Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">حالة الرسومات حسب التخصص</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'معماري', total: 24, approved: 18, inReview: 4, draft: 2 },
                { name: 'إنشائي', total: 18, approved: 12, inReview: 4, draft: 2 },
                { name: 'كهربائي', total: 15, approved: 8, inReview: 5, draft: 2 },
                { name: 'سباكة', total: 12, approved: 6, inReview: 4, draft: 2 },
                { name: 'تكييف', total: 10, approved: 5, inReview: 3, draft: 2 },
              ].map(disc => (
                <div key={disc.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{disc.name}</span>
                    <span className="text-slate-500">{disc.approved}/{disc.total} معتمد</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 flex overflow-hidden">
                    <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${(disc.approved / disc.total) * 100}%` }} />
                    <div className="bg-amber-500 h-2 transition-all" style={{ width: `${(disc.inReview / disc.total) * 100}%` }} />
                    <div className="bg-slate-300 dark:bg-slate-600 h-2 transition-all" style={{ width: `${(disc.draft / disc.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-[10px] text-slate-500">معتمد</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500" /><span className="text-[10px] text-slate-500">قيد المراجعة</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-slate-300" /><span className="text-[10px] text-slate-500">مسودة</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">مؤشرات الأداء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">إجمالي الرسومات</p>
                    <p className="text-lg font-bold">79</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">نسبة الاعتماد</p>
                    <p className="text-lg font-bold text-emerald-600">62%</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">تعارضات مكتشفة</p>
                    <p className="text-lg font-bold text-red-600">3</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">متوسط التعديلات</p>
                    <p className="text-lg font-bold">2.3 لكل رسم</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // ===== RENDER CONTENT =====
  const renderContent = () => {
    switch (activeTab) {
      case 'map': return renderMapSection()
      case 'visits': return renderVisitsSection()
      case 'boq': return renderBoqSection()
      case 'time': return renderTimeSection()
      case 'portal': return renderPortalSection()
      case 'whatsapp': return renderWhatsAppSection()
      case 'communications': return renderCommunicationsSection()
      case 'design': return renderDesignSection()
      default: return renderMapSection()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-white dark:bg-slate-900 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm">بلو برنت</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
          {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          'fixed lg:sticky top-0 right-0 z-40 h-screen w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300',
          'lg:translate-x-0',
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}>
          {/* Logo */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-slate-900 dark:text-white">بلو برنت</h1>
                <p className="text-[10px] text-slate-500">مكتب الاستشارات الهندسية</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-3">
            <nav className="space-y-1 px-3">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                    activeTab === item.id
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <span className={cn(
                    'transition-colors',
                    activeTab === item.id ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <HardHat className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900 dark:text-white">م. عبدالله المنصوري</p>
                <p className="text-[10px] text-slate-500">مدير المكتب</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ===== DIALOGS ===== */}

      {/* Add Visit Dialog */}
      <Dialog open={showAddVisit} onOpenChange={setShowAddVisit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة زيارة جديدة</DialogTitle>
            <DialogDescription>تسجيل زيارة ميدانية للموقع</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المهندس *</Label>
              <Select value={newVisit.engineerId} onValueChange={v => setNewVisit(p => ({ ...p, engineerId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المهندس" /></SelectTrigger>
                <SelectContent>
                  {DEMO_ENGINEERS.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المشروع *</Label>
              <Select value={newVisit.projectId} onValueChange={v => setNewVisit(p => ({ ...p, projectId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                <SelectContent>
                  {DEMO_PROJECTS.filter(p => p.status === 'active' || p.status === 'delayed').map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>التاريخ *</Label>
                <Input type="date" value={newVisit.date} onChange={e => setNewVisit(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>وقت الوصول *</Label>
                <Input type="time" value={newVisit.timeIn} onChange={e => setNewVisit(p => ({ ...p, timeIn: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={newVisit.notes} onChange={e => setNewVisit(p => ({ ...p, notes: e.target.value }))} placeholder="أضف ملاحظات الزيارة..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVisit(false)}>إلغاء</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleAddVisit} disabled={!newVisit.engineerId || !newVisit.projectId || !newVisit.date}>
              إضافة الزيارة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add BOQ Item Dialog */}
      <Dialog open={showAddBoqItem} onOpenChange={setShowAddBoqItem}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة بند جديد</DialogTitle>
            <DialogDescription>أضف بند إلى قائمة الكميات</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>وصف البند *</Label>
              <Input value={newBoqItem.description} onChange={e => setNewBoqItem(p => ({ ...p, description: e.target.value }))} placeholder="مثال: بلاط أرضيات" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الفئة *</Label>
                <Select value={newBoqItem.category} onValueChange={v => setNewBoqItem(p => ({ ...p, category: v as BOQItem['category'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['civil', 'structural', 'mep', 'finishing', 'landscape'] as const).map(c => (
                      <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الوحدة *</Label>
                <Select value={newBoqItem.unit} onValueChange={v => setNewBoqItem(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['م²', 'م³', 'م.ط', 'طن', 'عدد', 'نقطة', 'محطة', 'كجم'].map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الكمية *</Label>
                <Input type="number" value={newBoqItem.quantity} onChange={e => setNewBoqItem(p => ({ ...p, quantity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>سعر الوحدة (درهم) *</Label>
                <Input type="number" value={newBoqItem.unitCost} onChange={e => setNewBoqItem(p => ({ ...p, unitCost: Number(e.target.value) }))} />
              </div>
            </div>
            {newBoqItem.quantity > 0 && newBoqItem.unitCost > 0 && (
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-center">
                <span className="text-xs text-slate-500">الإجمالي: </span>
                <span className="text-lg font-bold text-teal-700 dark:text-teal-400">{formatCurrency(newBoqItem.quantity * newBoqItem.unitCost)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBoqItem(false)}>إلغاء</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleAddBoqItem} disabled={!newBoqItem.description || newBoqItem.quantity <= 0 || newBoqItem.unitCost <= 0}>
              إضافة البند
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Interaction Dialog */}
      <Dialog open={showAddInteraction} onOpenChange={setShowAddInteraction}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل تواصل جديد</DialogTitle>
            <DialogDescription>سجل تفاعل جديد مع العميل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>العميل *</Label>
                <Select value={newInteraction.clientId} onValueChange={v => setNewInteraction(p => ({ ...p, clientId: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent>
                    {DEMO_PROJECTS.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.client}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المشروع *</Label>
                <Select value={newInteraction.projectId} onValueChange={v => setNewInteraction(p => ({ ...p, projectId: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent>
                    {DEMO_PROJECTS.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>نوع التواصل *</Label>
                <Select value={newInteraction.type} onValueChange={v => setNewInteraction(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['meeting', 'call', 'email', 'whatsapp'] as const).map(t => (
                      <SelectItem key={t} value={t}>{getInteractionTypeLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>التاريخ *</Label>
                <Input type="date" value={newInteraction.date} onChange={e => setNewInteraction(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الموضوع *</Label>
              <Input value={newInteraction.subject} onChange={e => setNewInteraction(p => ({ ...p, subject: e.target.value }))} placeholder="موضوع التواصل" />
            </div>
            <div className="space-y-2">
              <Label>التفاصيل</Label>
              <Textarea value={newInteraction.description} onChange={e => setNewInteraction(p => ({ ...p, description: e.target.value }))} placeholder="وصف تفصيلي..." />
            </div>
            <div className="space-y-2">
              <Label>النتيجة</Label>
              <Input value={newInteraction.outcome} onChange={e => setNewInteraction(p => ({ ...p, outcome: e.target.value }))} placeholder="نتيجة التواصل" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInteraction(false)}>إلغاء</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleAddInteraction} disabled={!newInteraction.clientId || !newInteraction.projectId || !newInteraction.subject}>
              تسجيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
