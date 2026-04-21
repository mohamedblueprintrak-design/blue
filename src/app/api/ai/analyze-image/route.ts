import { NextRequest, NextResponse } from 'next/server';

// Lazy-load ZAI SDK to avoid bundling issues and missing .z-ai-config at import time
async function getZAI() {
  try {
    const mod = await import('z-ai-web-dev-sdk');
    return mod.default;
  } catch (importError) {
    console.warn('[AI] Failed to import z-ai-web-dev-sdk:', importError instanceof Error ? importError.message : importError);
    return null;
  }
}

/**
 * Read ZAI config directly from .z-ai-config file.
 * Used as a backup when env vars are not set.
 */
function readZaiConfigFile(): { baseUrl: string; apiKey: string; chatId?: string; userId?: string; token?: string } | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const configPaths = [
      path.join(process.cwd(), '.z-ai-config'),
      path.join(os.homedir(), '.z-ai-config'),
      '/etc/.z-ai-config',
    ];

    for (const configPath of configPaths) {
      try {
        if (fs.existsSync(configPath)) {
          const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (data.baseUrl && data.apiKey) {
            return data;
          }
        }
      } catch {
        // Try next path
      }
    }
  } catch {
    // Module loading failed
  }
  return null;
}

let _cachedFileConfig: ReturnType<typeof readZaiConfigFile> | undefined = undefined;
function getCachedZaiFileConfig() {
  if (_cachedFileConfig === undefined) {
    _cachedFileConfig = readZaiConfigFile();
  }
  return _cachedFileConfig;
}

/**
 * Call ZAI Vision API directly via HTTP.
 * Reads config from (in priority order):
 *   1. Environment variables (ZAI_BASE_URL, ZAI_API_KEY, etc.)
 *   2. .z-ai-config file (in project dir, home dir, or /etc/)
 *   3. Hardcoded defaults
 */
async function callZaiVisionDirect(
  messages: Array<{ role: string; content: unknown }>,
): Promise<string> {
  const fileConfig = getCachedZaiFileConfig();

  const baseUrl = process.env.ZAI_BASE_URL || fileConfig?.baseUrl || 'http://172.25.136.193:8080/v1';
  const apiKey = process.env.ZAI_API_KEY || fileConfig?.apiKey || 'Z.ai';
  const chatId = process.env.ZAI_CHAT_ID || fileConfig?.chatId || '';
  const userId = process.env.ZAI_USER_ID || fileConfig?.userId || '';
  const token = process.env.ZAI_TOKEN || fileConfig?.token || '';

  const url = `${baseUrl}/chat/completions/vision`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-Z-AI-From': 'Z',
  };
  if (chatId) headers['X-Chat-Id'] = chatId;
  if (userId) headers['X-User-Id'] = userId;
  if (token) headers['X-Token'] = token;

  const body = { messages, thinking: { type: 'disabled' } };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ZAI vision direct call failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeout);
  }
}

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

    // Try ZAI SDK first, then fall back to direct HTTP call
    const visionMessages = [
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

    let analysis = '';
    let tokens = 0;

    // Tier 1: Try ZAI SDK
    const ZAI = await getZAI();
    if (ZAI) {
      try {
        const zai = await ZAI.create();
        const completion = await (zai.chat.completions as any).createVision({
          messages: visionMessages,
          thinking: { type: 'disabled' }
        });
        analysis = completion?.choices?.[0]?.message?.content || '';
        tokens = completion?.usage?.total_tokens || 0;
      } catch (sdkError) {
        console.warn('[AI] ZAI Vision SDK failed, trying direct HTTP:', sdkError instanceof Error ? sdkError.message : sdkError);
      }
    }

    // Tier 2: Direct HTTP call (no .z-ai-config needed)
    if (!analysis) {
      try {
        analysis = await callZaiVisionDirect(visionMessages as any);
      } catch (directError) {
        console.warn('[AI] ZAI Vision direct call failed:', directError instanceof Error ? directError.message : directError);
        return NextResponse.json(
          { success: false, error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً' },
          { status: 503 }
        );
      }
    }

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
