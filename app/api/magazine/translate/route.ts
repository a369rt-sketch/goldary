import { NextRequest, NextResponse } from "next/server";
import { getCaller } from "@/app/lib/authServer";

// ترجمة تلقائية عربي→إنجليزي لمقال المجلة عبر Claude API (Messages API, REST).
// النتيجة تُخزَّن كمسودة (translation_status='draft') ويراجعها الأدمن قبل الاعتماد.
// لا تُعرض هذه الترجمة للجمهور حتى تصبح 'approved' (تُفرض في طبقة العرض).

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5"; // كما اعتُمد للمرحلة B (Haiku 4.5)

const SYSTEM_PROMPT = [
  "You are a professional Arabic-to-English translator for Goldary, an Iraqi gold & finance magazine.",
  "Translate faithfully into natural, fluent English suitable for a general audience.",
  "Preserve the Markdown structure EXACTLY: headings (##), lists, blockquotes (>), bold (**), links, and images ![alt](url).",
  "Keep all numbers, prices, and units unchanged. Do not add, remove, or summarize any content.",
  "Return only the translated fields.",
].join(" ");

// مخطط المخرجات المضمون (structured outputs) — Haiku 4.5 يدعمه
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    title_en: { type: "string" },
    excerpt_en: { type: "string" },
    content_en: { type: "string" },
  },
  required: ["title_en", "excerpt_en", "content_en"],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  try {
    const caller = await getCaller(request);
    if (!caller.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY غير مضبوط على الخادم" },
        { status: 500 }
      );
    }

    const { title, excerpt, content } = await request.json();
    if (!title || !content) {
      return NextResponse.json(
        { error: "العنوان والمحتوى مطلوبان للترجمة" },
        { status: 400 }
      );
    }

    const userPayload = JSON.stringify({
      title,
      excerpt: excerpt ?? "",
      content,
    });

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
        messages: [
          {
            role: "user",
            content:
              "Translate the Arabic fields in this JSON to English:\n" + userPayload,
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Anthropic API error:", res.status, detail);
      return NextResponse.json(
        { error: "تعذّرت الترجمة التلقائية، حاول مرة أخرى" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "رفض النموذج ترجمة هذا المحتوى" },
        { status: 422 }
      );
    }

    const textBlock = Array.isArray(data.content)
      ? data.content.find((b: { type: string }) => b.type === "text")
      : null;
    if (!textBlock?.text) {
      return NextResponse.json(
        { error: "استجابة ترجمة غير متوقعة" },
        { status: 502 }
      );
    }

    let parsed: { title_en?: string; excerpt_en?: string; content_en?: string };
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return NextResponse.json(
        { error: "تعذّر تحليل ناتج الترجمة" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      title_en: parsed.title_en ?? "",
      excerpt_en: parsed.excerpt_en ?? "",
      content_en: parsed.content_en ?? "",
    });
  } catch (error) {
    console.error("Translate error:", error);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
