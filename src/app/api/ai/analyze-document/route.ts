import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW = 60000;

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_REQUESTS - record.count };
}

// System prompts for different document analysis types
const SYSTEM_PROMPTS: Record<string, string> = {
  'contract-analysis': `أنت مستشار قانوني متخصص في عقود المقاولات والبناء في الإمارات العربية المتحدة.

قم بتحليل العقد المقدم وقدم:

## ملخص العقد
- أطراف العقد
- موضوع العقد
- القيمة والمدة
- تاريخ التوقيع

## المخاطر والتحذيرات
حدد البنود التي قد تشكل مخاطر مثل:
- شروط جزائية غير متوازنة
- التزامات غير واضحة
- غرامات مالية مرتفعة
- شروط تعسفية

## البنود الإيجابية
- البنود العادلة
- الضمانات المطلوبة
- آليات تسوية النزاعات

## التوصيات
- تعديلات مقترحة
- بنود ينصح بإضافتها
- نقاط تحتاج توضيح

استخدم اللغة العربية والتنسيق الواضح.`,

  'document-review': `أنت خبير مراجعة مستندات هندسية وإدارية.
قم بمراجعة المستند المقدم وقدم:
1. ملخص المحتوى
2. الأخطاء والتناقضات إن وجدت
3. النقاط الناقصة
4. التوصيات للتحسين
5. حالة المستند (كامل/ناقص/يحتاج مراجعة)

استخدم اللغة العربية.`,

  'invoice-extraction': `أنت خبير استخراج بيانات الفواتير.
من الفاتورة المقدمة، استخرج:
1. رقم الفاتورة وتاريخها
2. اسم المورد والعميل
3. قائمة الأصناف والكميات والأسعار
4. المجموع الفرعي والضريبة والإجمالي
5. شروط الدفع

قدم البيانات بتنسيق JSON إن أمكن.`,

  'document-analysis': `أنت محلل مستندات ذكي.
قم بتحليل المستند المقدم وقدم:
1. نوع المستند
2. ملخص المحتوى
3. النقاط الرئيسية
4. التحليل والاستنتاجات

استخدم اللغة العربية.`,

  'legal-analysis': `أنت مستشار قانوني متخصص في قوانين البناء والإنشاء في الإمارات.
قم بتحليل المسألة القانونية أو المستند المقدم وقدم:
1. الإطار القانوني المطبق
2. الحقوق والالتزامات
3. المخاطر القانونية
4. التوصيات والإجراءات المطلوبة
5. المراجع القانونية ذات الصلة

استخدم اللغة العربية.`
};

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز الحد المسموح من الطلبات' },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const {
      document,
      prompt = 'قم بتحليل هذا المستند',
      taskType = 'document-analysis'
    } = body;

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'المستند مطلوب' },
        { status: 400 }
      );
    }

    // Check document length
    if (document.length > 500000) {
      return NextResponse.json(
        { success: false, error: 'المستند طويل جداً. الحد الأقصى 500,000 حرف.' },
        { status: 400 }
      );
    }

    // Get system prompt for task type
    const systemPrompt = SYSTEM_PROMPTS[taskType] || SYSTEM_PROMPTS['document-analysis'];

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Check if the document is base64 (file) or plain text
    let userContent: Array<{ type: string; text?: string; file_url?: { url: string } }>;

    if (document.startsWith('data:') || (document.length > 200 && /^[A-Za-z0-9+/=]+$/.test(document.substring(0, 200)))) {
      // Base64 encoded file - use vision API with file_url
      const base64DataUrl = document.startsWith('data:') ? document : `data:application/octet-stream;base64,${document}`;
      userContent = [
        { type: 'text', text: prompt },
        { type: 'file_url', file_url: { url: base64DataUrl } }
      ];
    } else {
      // Plain text document
      userContent = [
        { type: 'text', text: `${prompt}\n\n---\n\nالمستند:\n\n${document}` }
      ];
    }

    // Build messages
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: userContent as any
      }
    ];

    // Call AI model - use vision API for file uploads, regular for text
    let completion: any;
    if (userContent.length > 1 && userContent[1].type === 'file_url') {
      completion = await (zai.chat.completions as any).createVision({
        messages,
        thinking: { type: 'disabled' }
      });
    } else {
      completion = await zai.chat.completions.create({
        messages,
        temperature: 0.5,
      });
    }

    const analysis = completion?.choices?.[0]?.message?.content || '';
    const tokens = completion?.usage?.total_tokens || 0;

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        taskType,
        tokens: {
          input: Math.ceil(tokens * 0.7),
          output: Math.ceil(tokens * 0.3),
          total: tokens
        }
      }
    });

  } catch (error) {
    console.error('Document Analysis Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تحليل المستند' },
      { status: 500 }
    );
  }
}
