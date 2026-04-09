"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Copy,
  Check,
  Download,
  MessageSquare,
  Zap,
  Mic,
  MicOff,
  Volume2,
  StopCircle,
  RefreshCw,
  AlertCircle,
  Shield,
  Users,
  Calculator,
  HardHat,
  DollarSign,
  Bell,
  Lightbulb,
  Plus,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Clock,
  Clipboard,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

interface Props {
  language: "ar" | "en";
  projectId?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
  tokensUsed?: number;
}

interface ConversationMeta {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

const CONVERSATIONS_KEY = "blueprint-ai-conversations";

const quickSuggestions = [
  {
    icon: Calculator,
    ar: "كيف أضع ميزانية مشروع؟",
    en: "How to set project budget?",
    arMsg: "كيف أضع ميزانية مشروع إنشائي بشكل احترافي؟",
    enMsg: "How do I set a professional budget for a construction project?",
  },
  {
    icon: AlertTriangle,
    ar: "ما هي مخاطر التأخير؟",
    en: "What are delay risks?",
    arMsg: "ما هي أبرز مخاطر التأخير في المشاريع الإنشائية وكيف أتعامل معها؟",
    enMsg: "What are the main delay risks in construction projects and how to handle them?",
  },
  {
    icon: HardHat,
    ar: "كيف أكتب تقرير موقع؟",
    en: "How to write a site report?",
    arMsg: "كيف أكتب تقرير زيارة موقع احترافي يشمل جميع التفاصيل المطلوبة؟",
    enMsg: "How do I write a professional site visit report with all required details?",
  },
  {
    icon: Users,
    ar: "نصائح لإدارة الفريق",
    en: "Team management tips",
    arMsg: "أعطني نصائح عملية لإدارة فريق هندسي في مكتب استشارات؟",
    enMsg: "Give me practical tips for managing an engineering team in a consultancy office?",
  },
  {
    icon: TrendingUp,
    ar: "حساب تكلفة البناء",
    en: "Construction cost estimate",
    arMsg: "ما هي الطرق المعتمدة لحساب تكلفة البناء في الإمارات؟",
    enMsg: "What are the standard methods for calculating construction costs in the UAE?",
  },
  {
    icon: Shield,
    ar: "شروط بلدية دبي",
    en: "Dubai Municipality rules",
    arMsg: "ما هي المتطلبات الأساسية للحصول على ترخيص بناء من بلدية دبي؟",
    enMsg: "What are the main requirements for getting a building permit from Dubai Municipality?",
  },
];

const quickActions = [
  {
    icon: Sparkles,
    ar: "ملخص المشاريع",
    en: "Project Summary",
    arMsg: "أعطني ملخصاً شاملاً لجميع المشاريع الحالية وحالتها",
    enMsg: "Give me a comprehensive summary of all current projects and their status",
    color: "from-teal-500 to-cyan-500",
    bgLight: "bg-teal-50 dark:bg-teal-950/30",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    icon: AlertTriangle,
    ar: "المهام المتأخرة",
    en: "Overdue Tasks",
    arMsg: "ما هي المهام المتأخرة حالياً وأحتاج إلى اتخاذ إجراء فوري بشأنها؟",
    enMsg: "What tasks are currently overdue and need immediate action?",
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: DollarSign,
    ar: "الحالة المالية",
    en: "Financial Status",
    arMsg: "أعطني تقريراً عن الحالة المالية الحالية: الإيرادات، المصروفات، الفواتير المستحقة",
    enMsg: "Give me a report on the current financial status: revenue, expenses, outstanding invoices",
    color: "from-emerald-500 to-green-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Bell,
    ar: "تنبيهات مهمة",
    en: "Important Alerts",
    arMsg: "ما هي التنبيهات والتحذيرات المهمة التي أحتاج لمعرفتها فوراً؟",
    enMsg: "What are the important alerts and warnings I need to know about immediately?",
    color: "from-red-500 to-rose-500",
    bgLight: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    icon: Lightbulb,
    ar: "اقتراحات تحسين",
    en: "Improvement Suggestions",
    arMsg: "بناءً على بيانات النظام الحالية، ما هي أفضل اقتراحات التحسين لتحسين الأداء؟",
    enMsg: "Based on the current system data, what are the top improvement suggestions to enhance performance?",
    color: "from-violet-500 to-purple-500",
    bgLight: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
];

const aiModels = [
  { value: "gpt-4", label: "GPT-4", desc: "Advanced" },
  { value: "gpt-3.5", label: "GPT-3.5", desc: "Fast" },
  { value: "claude-3", label: "Claude 3", desc: "Balanced" },
];

// Code block with copy button component
function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-950 group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900 border-b border-slate-700 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          {language && (
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Clipboard className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre ref={codeRef} className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-slate-200 font-mono">{children}</code>
      </pre>
    </div>
  );
}

// Inline code component
function InlineCode({ children }: { children?: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-rose-600 dark:text-rose-400 text-[13px] font-mono font-medium">
      {children}
    </code>
  );
}

// Markdown renderer for AI messages with full styling
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-2 pb-0.5 border-b border-slate-200/60 dark:border-slate-700/60">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2.5 mb-1">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 mb-1">
            {children}
          </h4>
        ),
        // Bold
        strong: ({ children }) => (
          <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>
        ),
        // Italic
        em: ({ children }) => (
          <em className="italic text-slate-700 dark:text-slate-300">{children}</em>
        ),
        // Paragraph
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 mb-1.5 last:mb-0">
            {children}
          </p>
        ),
        // Unordered list
        ul: ({ children }) => (
          <ul className="my-2 space-y-1 text-sm text-slate-800 dark:text-slate-200 list-disc list-inside marker:text-teal-500 dark:marker:text-teal-400">
            {children}
          </ul>
        ),
        // Ordered list
        ol: ({ children }) => (
          <ol className="my-2 space-y-1 text-sm text-slate-800 dark:text-slate-200 list-decimal list-inside marker:text-teal-500 dark:marker:text-teal-400">
            {children}
          </ol>
        ),
        // List item
        li: ({ children }) => (
          <li className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 pl-1">
            {children}
          </li>
        ),
        // Code blocks
        pre: ({ children }) => {
          // Extract className from the code child
          const codeChild = children as React.ReactElement;
          const className = (codeChild?.props as any)?.className || "";
          return <CodeBlock className={className}>{(codeChild?.props as any)?.children}</CodeBlock>;
        },
        // Inline code (but not inside pre)
        code: ({ children, className }) => {
          // If inside a pre block, let the pre handler deal with it
          if (className) return <code className={className}>{children}</code>;
          return <InlineCode>{children}</InlineCode>;
        },
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="my-3 px-4 py-3 border-s-2 border-s-teal-400 dark:border-s-teal-600 bg-teal-50/50 dark:bg-teal-950/20 rounded-r-xl text-sm text-slate-700 dark:text-slate-300">
            {children}
          </blockquote>
        ),
        // Table
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-start text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {children}
          </td>
        ),
        // Horizontal rule
        hr: () => (
          <hr className="my-3 border-slate-200 dark:border-slate-700" />
        ),
        // Links
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 underline underline-offset-2 hover:text-teal-700 dark:hover:text-teal-300 transition-colors font-medium"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// Generate suggested follow-up replies based on AI response content
function generateSuggestedReplies(content: string, isAr: boolean): string[] {
  const lower = content.toLowerCase();
  const suggestions: string[] = [];

  if (/project|مشروع|مشاريع/.test(lower)) {
    suggestions.push(isAr ? "أظهر التفاصيل الكاملة للمشروع الأول" : "Show full details of the first project");
    suggestions.push(isAr ? "ما هي نسبة الإنجاز الإجمالية؟" : "What is the overall progress rate?");
  }
  if (/task|مهم|مهام|overdue|متأخر/.test(lower)) {
    suggestions.push(isAr ? "اعرض تفاصيل أول مهمة متأخرة" : "Show details for the first overdue task");
    suggestions.push(isAr ? "كيف يمكن تقليل التأخيرات؟" : "How can we reduce delays?");
  }
  if (/invoice|budget|financial|فاتور|ميزاني|revenue|payment|مالي/.test(lower)) {
    suggestions.push(isAr ? "ما هي الفواتير المتأخرة التي تحتاج متابعة؟" : "Which overdue invoices need follow-up?");
    suggestions.push(isAr ? "أظهر مقارنة المصروفات بالإيرادات" : "Show expenses vs revenue comparison");
  }
  if (/alert|تنبيه|warning|خطر|risk/.test(lower)) {
    suggestions.push(isAr ? "ما هي خطوات المعالجة المطلوبة؟" : "What are the required action steps?");
    suggestions.push(isAr ? "أنشئ خطة طوارئ لهذه التنبيهات" : "Create an emergency plan for these alerts");
  }
  if (/improve|تحسين|suggestion|اقتراح|recommend/.test(lower)) {
    suggestions.push(isAr ? "أعطني خطة تنفيذية لهذه الاقتراحات" : "Give me an action plan for these suggestions");
    suggestions.push(isAr ? "ما الأولويات الموصى بها؟" : "What are the recommended priorities?");
  }
  if (/employee|موظف|hr|team|فريق/.test(lower)) {
    suggestions.push(isAr ? "ما هو عبء العمل الحالي لكل قسم؟" : "What is the current workload per department?");
  }
  if (/site|موقع|visit|زيارة|defect|عيب/.test(lower)) {
    suggestions.push(isAr ? "ما هي العيوب الحرجة التي تحتاج اهتماماً؟" : "What critical defects need attention?");
  }
  if (/contract|عقد/.test(lower)) {
    suggestions.push(isAr ? "أعرض العقود قريبة الانتهاء" : "Show contracts near expiration");
  }

  // Default suggestions if none matched
  if (suggestions.length < 2) {
    suggestions.push(isAr ? "هل يمكنك توضيح أكثر؟" : "Can you elaborate more?");
    suggestions.push(isAr ? "أعطني أمثلة عملية" : "Give me practical examples");
  }

  return suggestions.slice(0, 3);
}

// Check speech recognition support (safe for SSR)
function getSpeechRecognitionSupport(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

// Speech Recognition hook
function useSpeechRecognition(isAr: boolean) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => getSpeechRecognitionSupport());
  const recognitionRef = useRef<any>(null);
  const supportedRef = useRef(isSupported);

  useEffect(() => {
    if (!supportedRef.current) return;

    const w = window as any;
    const SpeechRecognitionClass = (w.SpeechRecognition || w.webkitSpeechRecognition) as any;

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = isAr ? "ar-AE" : "en-US";
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [isAr]);

  const startListening = useCallback(
    (onResult: (text: string, isFinal: boolean) => void) => {
      if (!recognitionRef.current) return;

      const recognition = recognitionRef.current;
      recognition.lang = isAr ? "ar-AE" : "en-US";
      recognition.onresult = (event: any) => {
        const results = event.results;
        const last = results[results.length - 1];
        const text = last[0].transcript;
        onResult(text, last.isFinal);
      };
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.start();
    },
    [isAr]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}

// Text-to-Speech hook
function useSpeechSynthesis() {
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const speak = useCallback((text: string, msgId: string, isAr: boolean) => {
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/#/g, "")
      .replace(/  • /g, "")
      .replace(/\n{2,}/g, ". ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isAr ? "ar-AE" : "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    if (isAr) {
      const arVoice = voices.find((v) => v.lang.startsWith("ar"));
      if (arVoice) utterance.voice = arVoice;
    } else {
      const enVoice = voices.find((v) => v.lang.startsWith("en"));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
  }, []);

  return { speakingMsgId, speak, stop };
}

// localStorage helpers for conversations
function loadConversations(): ConversationMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CONVERSATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: ConversationMeta[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations.slice(0, 50)));
  } catch {
    // localStorage might be full
  }
}

export default function AIAssistant({ language: lang, projectId }: Props) {
  const isAr = lang === "ar";
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => `conv-${Date.now()}`);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [lastApiTokens, setLastApiTokens] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const { isListening, isSupported, startListening, stopListening } =
    useSpeechRecognition(isAr);
  const { speakingMsgId, speak, stop } = useSpeechSynthesis();

  // Estimate token count (rough: ~4 chars per token)
  const totalTokens = useMemo(() => {
    return messages.reduce((sum, msg) => {
      return sum + Math.ceil(msg.content.length / 4);
    }, 0);
  }, [messages]);

  // Auto-generate project summary welcome message when projectId is provided
  useEffect(() => {
    if (!projectId || messages.length > 0) return;

    let cancelled = false;

    const fetchProjectSummary = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok || cancelled) return;
        const project = await res.json();
        if (cancelled) return;

        const statusLabels: Record<string, { ar: string; en: string }> = {
          active: { ar: "نشط", en: "Active" },
          completed: { ar: "مكتمل", en: "Completed" },
          delayed: { ar: "متأخر", en: "Delayed" },
          on_hold: { ar: "معلق", en: "On Hold" },
          cancelled: { ar: "ملغي", en: "Cancelled" },
        };
        const statusLabel = statusLabels[project.status] || { ar: project.status, en: project.status };
        const clientName = project.client?.name || project.client?.company || "N/A";
        const budgetFormatted = project.budget
          ? `${project.budget.toLocaleString("en-AE")} AED`
          : isAr
            ? "غير محدد"
            : "Not set";
        const endDateFormatted = project.endDate
          ? new Date(project.endDate).toLocaleDateString(isAr ? "ar-AE" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : isAr
            ? "غير محدد"
            : "Not set";

        const taskStats = project.taskStats || {};
        const totalTasks = taskStats.total || 0;
        const doneTasks = taskStats.done || 0;

        const welcomeMsg: Message = {
          id: `msg-welcome-${projectId}`,
          role: "assistant",
          content: isAr
            ? `## 📊 ملخص المشروع: ${project.name}\n\n| البيان | التفاصيل |\n|--------|---------|\n| **الحالة** | ${statusLabel.ar} |\n| **نسبة الإنجاز** | ${project.progress}% |\n| **الميزانية** | ${budgetFormatted} |\n| **العميل** | ${clientName} |\n| **الموقع** | ${project.location || "غير محدد"} |\n| **تاريخ الانتهاء** | ${endDateFormatted} |\n\n**المهام:** ${doneTasks} من ${totalTasks} مكتملة\n\nيمكنني مساعدتك في متابعة هذا المشروع. اسألني عن المهام، الفواتير، فريق العمل، أو أي تفاصيل أخرى!`
            : `## 📊 Project Summary: ${project.nameEn || project.name}\n\n| Detail | Value |\n|--------|-------|\n| **Status** | ${statusLabel.en} |\n| **Progress** | ${project.progress}% |\n| **Budget** | ${budgetFormatted} |\n| **Client** | ${clientName} |\n| **Location** | ${project.location || "Not set"} |\n| **Deadline** | ${endDateFormatted} |\n\n**Tasks:** ${doneTasks} of ${totalTasks} completed\n\nI can help you track this project. Ask me about tasks, invoices, team, or any other details!`,
          timestamp: new Date(),
        };

        setMessages([welcomeMsg]);
      } catch {
        // Silently fail - the user can still use the chat normally
      }
    };

    fetchProjectSummary();

    return () => {
      cancelled = true;
    };
  }, [projectId, messages.length, isAr]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    setConversations(loadConversations());
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Pre-load voices for TTS
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis?.getVoices();
    };
    window.speechSynthesis?.addEventListener?.("voiceschanged", handleVoicesChanged);
    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", handleVoicesChanged);
    };
  }, []);

  // Save current conversation to localStorage when messages change
  useEffect(() => {
    if (messages.length === 0) return;

    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "")
      : isAr
        ? "محادثة جديدة"
        : "New Chat";

    const meta: ConversationMeta = {
      id: conversationId,
      title,
      timestamp: new Date().toISOString(),
      messages,
    };

    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== conversationId);
      const updated = [meta, ...filtered].slice(0, 50);
      saveConversations(updated);
      return updated;
    });
  }, [messages, conversationId, isAr]);

  // Start new conversation
  const startNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(`conv-${Date.now()}`);
    setLastApiTokens(null);
    window.speechSynthesis.cancel();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Load a conversation from history
  const loadConversation = useCallback((conv: ConversationMeta) => {
    setMessages(conv.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
    setConversationId(conv.id);
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(
    (e: React.MouseEvent, convId: string) => {
      e.stopPropagation();
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== convId);
        saveConversations(updated);
        return updated;
      });
      if (convId === conversationId) {
        startNewChat();
      }
    },
    [conversationId, startNewChat]
  );

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setLastApiTokens(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationId,
          userId: user?.id,
          language: lang,
          projectId,
        }),
      });

      const data = await res.json();

      if (data.message && !data.error) {
        const aiMsg: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          tokensUsed: data.usage?.total_tokens || null,
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (data.usage?.total_tokens) {
          setLastApiTokens(data.usage.total_tokens);
        }
      } else {
        const errorMsg: Message = {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content:
            data.message ||
            (isAr
              ? "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى."
              : "Sorry, an error occurred while processing your request. Please try again."),
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: isAr
          ? "عذراً، حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى."
          : "Sorry, a server connection error occurred. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    // Remove current conversation from history
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== conversationId);
      saveConversations(updated);
      return updated;
    });
    setMessages([]);
    setClearDialogOpen(false);
    setLastApiTokens(null);
    window.speechSynthesis.cancel();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const exportChat = () => {
    const lines = messages.map((msg) => {
      const time = msg.timestamp.toLocaleTimeString(isAr ? "ar-AE" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const role =
        msg.role === "user"
          ? isAr
            ? "أنت"
            : "You"
          : isAr
            ? "المساعد"
            : "AI";
      return `[${time}] ${role}: ${msg.content}`;
    });
    const text = lines.join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blueprint-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMessage = async (msg: Message) => {
    await navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text, isFinal) => {
        setInput(isFinal ? text : text);
        if (isFinal) {
          inputRef.current?.focus();
        }
      });
    }
  };

  const handleRetry = async () => {
    const lastErrorIdx = [...messages].reverse().findIndex((m) => m.isError);
    if (lastErrorIdx === -1) return;

    const actualIdx = messages.length - 1 - lastErrorIdx;
    let userMsg = "";
    for (let i = actualIdx - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMsg = messages[i].content;
        break;
      }
    }

    if (!userMsg) return;

    setMessages((prev) => prev.filter((_, idx) => idx !== actualIdx));
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          conversationId,
          userId: user?.id,
          language: lang,
          projectId,
        }),
      });

      const data = await res.json();

      if (data.message && !data.error) {
        const aiMsg: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          tokensUsed: data.usage?.total_tokens || null,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content:
            data.message ||
            (isAr
              ? "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى."
              : "Sorry, an error occurred. Please try again."),
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: isAr
          ? "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى."
          : "Sorry, a connection error occurred. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSpeak = (msg: Message) => {
    if (speakingMsgId === msg.id) {
      stop();
    } else {
      speak(msg.content, msg.id, isAr);
    }
  };

  const initialSuggestions = useMemo(() => quickSuggestions.slice(0, 4), []);

  const ttsSupported = useMemo(() => {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }, []);

  // Get the last AI message for suggested replies
  const lastAiMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && !messages[i].isError) {
        return messages[i];
      }
    }
    return null;
  }, [messages]);

  const suggestedReplies = useMemo(() => {
    if (!lastAiMessage || isLoading) return [];
    return generateSuggestedReplies(lastAiMessage.content, isAr);
  }, [lastAiMessage, isLoading, isAr]);

  // Format relative time for conversation history
  const formatRelativeTime = useCallback(
    (timestamp: string) => {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMs / 3600000);
      const diffDay = Math.floor(diffMs / 86400000);

      if (diffMin < 1) return isAr ? "الآن" : "Now";
      if (diffMin < 60) return isAr ? `منذ ${diffMin} د` : `${diffMin}m ago`;
      if (diffHour < 24) return isAr ? `منذ ${diffHour} س` : `${diffHour}h ago`;
      if (diffDay < 7) return isAr ? `منذ ${diffDay} ي` : `${diffDay}d ago`;
      return date.toLocaleDateString(isAr ? "ar-AE" : "en-US", {
        month: "short",
        day: "numeric",
      });
    },
    [isAr]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex gap-3 h-[calc(100vh-10rem)] max-w-6xl mx-auto">
        {/* Conversation History Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0 overflow-hidden"
            >
              <Card className="h-full flex flex-col p-0 overflow-hidden">
                {/* Sidebar Header */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-teal-500" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? "المحادثات السابقة" : "Chat History"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-teal-600"
                          onClick={startNewChat}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {isAr ? "محادثة جديدة" : "New Chat"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-slate-600"
                          onClick={() => setSidebarOpen(false)}
                        >
                          <PanelLeftClose className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {isAr ? "إغلاق" : "Close"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {isAr ? "لا توجد محادثات سابقة" : "No previous conversations"}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => loadConversation(conv)}
                          className={cn(
                            "w-full group flex items-start gap-2.5 p-2.5 rounded-lg text-start transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            conv.id === conversationId &&
                              "bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/50"
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            <MessageSquare className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                              {conv.title}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-2.5 w-2.5 text-slate-400" />
                              <span className="text-[10px] text-slate-400">
                                {formatRelativeTime(conv.timestamp)}
                              </span>
                              <span className="text-[10px] text-slate-300 dark:text-slate-600 mx-0.5">•</span>
                              <span className="text-[10px] text-slate-400">
                                {conv.messages.length} {isAr ? "رسالة" : "msgs"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => deleteConversation(e, conv.id)}
                            className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                            title={isAr ? "حذف" : "Delete"}
                          >
                            <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-500" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar Footer */}
                <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={startNewChat}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-950/50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? "محادثة جديدة" : "New Chat"}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600 hover:border-teal-300 dark:hover:border-teal-700"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isAr ? "سجل المحادثات" : "Chat History"}
                </TooltipContent>
              </Tooltip>

              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {isAr ? "مساعد بلوبرنت الذكي" : "BluePrint AI Assistant"}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {isAr ? "متصل ومتاح" : "Online and ready"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-8 w-auto gap-1.5 text-xs rounded-lg border-slate-200 dark:border-slate-700">
                  <Zap className="h-3 w-3 text-violet-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-xs">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-slate-400 ms-2">({model.desc})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Export Chat */}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportChat}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 h-8 gap-1.5 rounded-lg"
                  title={isAr ? "تصدير المحادثة" : "Export Chat"}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isAr ? "تصدير" : "Export"}</span>
                </Button>
              )}

              {/* Clear Chat */}
              {messages.length > 0 && (
                <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:text-red-500 h-8 gap-1.5 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{isAr ? "مسح" : "Clear"}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm" dir={isAr ? "rtl" : "ltr"}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-red-500" />
                        {isAr ? "مسح المحادثة" : "Clear Chat"}
                      </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr
                        ? "هل أنت متأكد من مسح جميع الرسائل؟ لا يمكن التراجع عن هذا الإجراء."
                        : "Are you sure you want to clear all messages? This action cannot be undone."}
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClearDialogOpen(false)}
                        className="h-9 rounded-lg"
                      >
                        {isAr ? "إلغاء" : "Cancel"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={clearChat}
                        className="h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5 me-1.5" />
                        {isAr ? "مسح الكل" : "Clear All"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {quickActions.map((action) => (
              <button
                key={action.en}
                onClick={() => handleSend(isAr ? action.arMsg : action.enMsg)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all shrink-0",
                  "hover:shadow-md active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
                  `border-slate-200 dark:border-slate-700 hover:border-transparent`,
                  `hover:bg-gradient-to-r ${action.color} hover:text-white hover:shadow-lg`,
                  `text-slate-600 dark:text-slate-400`
                )}
              >
                <action.icon className="h-3.5 w-3.5" />
                {isAr ? action.ar : action.en}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{ scrollbarGutter: "stable" }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 flex items-center justify-center mb-5 shadow-lg shadow-teal-500/5">
                    <Sparkles className="h-10 w-10 text-teal-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {isAr ? "مرحباً بك في مساعد بلوبرنت الذكي 👋" : "Welcome to BluePrint AI Assistant 👋"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md leading-relaxed">
                    {isAr
                      ? "يمكنني مساعدتك في إدارة المشاريع، متابعة المهام، مراجعة الفواتير، وتحليل البيانات. اطرح سؤالاً أو اختر من الاقتراحات أدناه للبدء."
                      : "I can help you manage projects, track tasks, review invoices, and analyze data. Ask a question or choose from the suggestions below to get started."}
                  </p>

                  {/* Initial Quick Suggestions - Enhanced Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                    {initialSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.ar}
                        onClick={() => handleSend(isAr ? suggestion.arMsg : suggestion.enMsg)}
                        className="group relative flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 hover:from-teal-50/80 hover:to-cyan-50/80 dark:hover:from-teal-950/30 dark:hover:to-cyan-950/30 transition-all text-sm text-start hover:shadow-lg hover:shadow-teal-500/5 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 flex items-center justify-center shrink-0 group-hover:from-teal-200 group-hover:to-cyan-200 dark:group-hover:from-teal-800 dark:group-hover:to-cyan-800 transition-colors shadow-sm">
                          <suggestion.icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {isAr ? suggestion.ar : suggestion.en}
                        </span>
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-teal-400/30 dark:group-hover:border-teal-600/30 transition-colors pointer-events-none" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={cn("flex gap-3 group", msg.role === "user" ? "flex-row-reverse" : "")}
                      >
                        {/* Avatar */}
                        <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                          <AvatarFallback
                            className={
                              msg.role === "user"
                                ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xs shadow-sm shadow-teal-500/20"
                                : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 text-xs"
                            }
                          >
                            {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>

                        {/* Message Bubble */}
                        <div className={cn("max-w-[80%] relative", msg.role === "user" ? "text-end" : "text-start")}>
                          {msg.role === "user" ? (
                            <div className="inline-block rounded-2xl rounded-tr-sm bg-gradient-to-br from-teal-500 to-teal-600 text-white px-4 py-3 shadow-md shadow-teal-500/15">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <div className="flex items-center justify-end gap-2 mt-1.5">
                                <span className="text-[10px] text-teal-200">
                                  {msg.timestamp.toLocaleTimeString(isAr ? "ar-AE" : "en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <button
                                  onClick={() => handleCopyMessage(msg)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10"
                                  title={isAr ? "نسخ" : "Copy"}
                                >
                                  {copiedMsgId === msg.id ? (
                                    <Check className="h-3 w-3 text-teal-200" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-teal-200" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : msg.isError ? (
                            /* Error Message with Retry */
                            <div className="inline-block text-start">
                              <div className="rounded-2xl rounded-tl-sm bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 px-4 py-3 border border-red-200 dark:border-red-800/50">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                  <div className="text-sm leading-relaxed">{msg.content}</div>
                                </div>
                                <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-red-200/50 dark:border-red-800/50">
                                  <span className="text-[10px] text-red-400 dark:text-red-500">
                                    {msg.timestamp.toLocaleTimeString(isAr ? "ar-AE" : "en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <button
                                    onClick={handleRetry}
                                    disabled={isLoading}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                  >
                                    <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                                    {isAr ? "إعادة المحاولة" : "Retry"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="inline-block text-start">
                              <div className="rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 border-s-2 border-s-0 border-s-teal-500 dark:border-s-teal-600">
                                <div className="text-sm leading-relaxed">
                                  <MarkdownRenderer content={msg.content} />
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                      {msg.timestamp.toLocaleTimeString(isAr ? "ar-AE" : "en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {msg.tokensUsed && (
                                      <span className="text-[10px] text-violet-400 dark:text-violet-500 flex items-center gap-0.5">
                                        <Zap className="h-2.5 w-2.5" />
                                        {msg.tokensUsed}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    {/* TTS Button for AI messages */}
                                    {ttsSupported && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() => handleSpeak(msg)}
                                            className={cn(
                                              "opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50",
                                              speakingMsgId === msg.id && "opacity-100"
                                            )}
                                          >
                                            {speakingMsgId === msg.id ? (
                                              <StopCircle className="h-3 w-3 text-red-500 animate-pulse" />
                                            ) : (
                                              <Volume2 className="h-3 w-3 text-slate-400" />
                                            )}
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                          {speakingMsgId === msg.id
                                            ? isAr
                                              ? "إيقاف القراءة"
                                              : "Stop reading"
                                            : isAr
                                              ? "قراءة بصوت عالٍ"
                                              : "Read aloud"}
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    {/* Copy button */}
                                    <button
                                      onClick={() => handleCopyMessage(msg)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                                      title={isAr ? "نسخ" : "Copy"}
                                    >
                                      {copiedMsgId === msg.id ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-3 w-3 text-slate-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Suggested Replies - show after last AI message */}
                              {idx === messages.length - 1 && suggestedReplies.length > 0 && !isLoading && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.3 }}
                                  className="flex flex-wrap gap-1.5 mt-2"
                                >
                                  {suggestedReplies.map((reply) => (
                                    <button
                                      key={reply}
                                      onClick={() => handleSend(reply)}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border border-teal-200 dark:border-teal-800/50 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-100 dark:hover:bg-teal-950/40 hover:border-teal-300 dark:hover:border-teal-700 transition-all"
                                    >
                                      <Lightbulb className="h-2.5 w-2.5" />
                                      {reply}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing Indicator - Enhanced */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-500 text-xs">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800 border-s-2 border-s-0 border-s-teal-500 dark:border-s-teal-600 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {isAr ? "جاري التفكير..." : "Thinking..."}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-3">
              {/* Compact suggestion chips */}
              {messages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {quickSuggestions.map((s) => (
                    <button
                      key={s.ar}
                      onClick={() => handleSend(isAr ? s.arMsg : s.enMsg)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:pointer-events-none hover:shadow-sm"
                    >
                      <s.icon className="h-3 w-3" />
                      {isAr ? s.ar : s.en}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isAr ? "اكتب رسالتك هنا..." : "Type your message here..."}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 ps-4 text-sm",
                      isListening
                        ? "pe-4 border-red-400 dark:border-red-500 ring-2 ring-red-400/20 dark:ring-red-500/20"
                        : "pe-24"
                    )}
                  />
                  {/* Listening indicator overlay */}
                  {isListening && (
                    <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                      </span>
                      <span className="text-xs text-red-500 font-medium animate-pulse">
                        {isAr ? "جاري الاستماع..." : "Listening..."}
                      </span>
                    </div>
                  )}
                  {/* Message Count & Token Usage Indicator */}
                  {messages.length > 0 && !isListening && (
                    <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50">
                        <MessageSquare className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400 tabular-nums font-medium">{messages.length}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50">
                        <Zap className="h-3 w-3 text-violet-400" />
                        <span className="text-[10px] text-slate-400 tabular-nums font-medium">
                          {totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mic Button */}
                {isSupported ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleMicClick}
                        variant={isListening ? "default" : "outline"}
                        size="icon"
                        className={cn(
                          "h-11 w-11 rounded-xl shrink-0 transition-all",
                          isListening
                            ? "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/25 animate-pulse"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-teal-400 dark:hover:border-teal-600"
                        )}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {isListening
                        ? isAr
                          ? "إيقاف التسجيل"
                          : "Stop recording"
                        : isAr
                          ? "إدخال صوتي"
                          : "Voice input"}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-xl shrink-0 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                        disabled
                      >
                        <MicOff className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {isAr ? "الإدخال الصوتي غير مدعوم في هذا المتصفح" : "Voice input not supported in this browser"}
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Send Button */}
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white p-0 shrink-0 shadow-md shadow-teal-500/20 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center flex items-center justify-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                {isAr
                  ? "مساعد بلوبرنت الذكي يستخدم الذكاء الاصطناعي لتقديم المساعدة. تأكد من مراجعة المعلومات الهامة."
                  : "BluePrint AI uses artificial intelligence for assistance. Please verify important information."}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
