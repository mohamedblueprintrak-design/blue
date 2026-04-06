import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 20;
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

// System prompts for different image analysis task types
const SYSTEM_PROMPTS: Record<string, string> = {
  'site-photo': `أنت مهندس موقع متخصص في تقييم صور مواقع البناء.
قم بتحليل الصورة المقدمة وقدم:
1. وصف دقيق لما تراه
2. تقييم حالة العمل والتقدم
3. أي مشاكل أو مخاطر محتملة
4. توصيات للتحسين
5. نسبة التقدير للإنجاز (إن أمكن)

استخدم اللغة العربية في الرد.`,

  'blueprint-read': `أنت مهندس مدني متخصص في قراءة المخططات الهندسية.
قم بتحليل المخطط المقدم وقدم:
1. نوع المخطط (معماري/إنشائي/كهربائي/ميكانيكي)
2. الأبعاد والمساحات الرئيسية
3. التفاصيل الهندسية المهمة
4. أي ملاحظات أو مشاكل محتملة
5. المتطلبات للتنفيذ

استخدم اللغة العربية في الرد.`,

  'progress-detection': `أنت خبير تقييم تقدم مشاريع البناء.
قم بتحليل الصورة وقدم:
1. نسبة الإنجاز التقريبية
2. المرحلة الحالية للمشروع
3. جودة العمل الظاهرة
4. أي تأخيرات أو مشاكل محتملة

استخدم اللغة العربية.`,

  'safety-inspection': `أنت خبير سلامة موقع بناء معتمد.
قم بتحليل الصورة وقدم:
1. تقييم السلامة العام (1-10)
2. المخاطر المحددة
3. المخالفات إن وجدت
4. التوصيات الضرورية
5. الإجراءات المطلوبة فوراً

استخدم اللغة العربية.`,

  'damage-assessment': `أنت خبير تقييم أضرار مباني.
قم بتحليل الصورة وقدم:
1. نوع الضرر
2. شدة الضرر (بسيط/متوسط/شديد/حرج)
3. الأسباب المحتملة
4. التوصيات للإصلاح
5. التقدير الأولي للتكلفة (نطاق)

استخدم اللغة العربية.`,

  'defect-analysis': `أنت مهندس جودة متخصص في تحليل عيوب البناء.
قم بتحليل صورة العيب المقدم وقدم:
1. وصف العيب
2. شدة العيب (بسيط/متوسط/شديد)
3. الأسباب المحتملة
4. التوصيات للإصلاح
5. كيفية الوقاية مستقبلاً

استخدم اللغة العربية.`,

  'image-analysis': `أنت محلل صور ذكي.
قم بتحليل الصورة المقدمة وقدم وصفاً تفصيلياً وتحليلاً شاملاً.
استخدم اللغة العربية في الرد.`
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
      image,
      prompt = 'قم بتحليل هذه الصورة',
      taskType = 'image-analysis'
    } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'الصورة مطلوبة' },
        { status: 400 }
      );
    }

    // Get system prompt for task type
    const systemPrompt = SYSTEM_PROMPTS[taskType] || SYSTEM_PROMPTS['image-analysis'];

    // Prepare image URL
    let base64ImageUrl: string;
    if (image.startsWith('data:')) {
      // Already has data URI
      base64ImageUrl = image;
    } else if (image.startsWith('http')) {
      // URL - convert to base64 or pass directly
      base64ImageUrl = image;
    } else {
      // Assume raw base64
      base64ImageUrl = `data:image/jpeg;base64,${image}`;
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Use vision API
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: prompt },
          {
            type: 'image_url' as const,
            image_url: { url: base64ImageUrl }
          }
        ]
      }
    ];

    const completion = await (zai.chat.completions as any).createVision({
      messages,
      thinking: { type: 'disabled' }
    });

    const analysis = completion?.choices?.[0]?.message?.content || '';
    const tokens = completion?.usage?.total_tokens || 0;

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        taskType,
        tokens: {
          input: Math.ceil(tokens * 0.3),
          output: Math.ceil(tokens * 0.7),
          total: tokens
        }
      }
    });

  } catch (error) {
    console.error('Image Analysis Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تحليل الصورة' },
      { status: 500 }
    );
  }
}
