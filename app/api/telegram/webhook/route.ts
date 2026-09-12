import { NextRequest, NextResponse } from "next/server";
import { getGoldSnapshot } from "@/app/lib/goldServer";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { formatPrices, sendTelegram, WELCOME } from "@/app/lib/telegram";

// بوت تيليغرام لأسعار الذهب (Phase 3).
// الإعداد: أنشئي بوتاً عبر @BotFather → TELEGRAM_BOT_TOKEN في بيئة Vercel، ثم:
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://goldary.vercel.app/api/telegram/webhook&secret_token=<SECRET>
// (اختياري) TELEGRAM_WEBHOOK_SECRET للتحقق أن الطلب من تيليغرام.

export const dynamic = "force-dynamic";

function isPriceQuery(text: string) {
  const cmd = text.split(/\s+/)[0].toLowerCase();
  return (
    cmd === "/price" ||
    cmd === "/prices" ||
    text.includes("سعر") ||
    text.includes("أسعار") ||
    text.includes("اسعار")
  );
}

export async function POST(req: NextRequest) {
  // تحقّق أن الطلب من تيليغرام (إن ضُبط السر)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: {
    message?: { text?: string; chat?: { id?: number } };
    edited_message?: { text?: string; chat?: { id?: number } };
  } = {};
  try {
    update = await req.json();
  } catch {
    /* تجاهل */
  }

  const msg = update.message ?? update.edited_message;
  const chatId = msg?.chat?.id;
  const text = (msg?.text ?? "").trim();
  if (!chatId || !text) return NextResponse.json({ ok: true });

  const cmd = text.split(/\s+/)[0].toLowerCase();

  if (cmd === "/start" || cmd === "/help") {
    await sendTelegram(chatId, WELCOME);
  } else if (cmd === "/subscribe") {
    await supabaseAdmin.from("telegram_subscribers").upsert({ chat_id: chatId });
    await sendTelegram(chatId, "✅ تم اشتراكك في التحديث اليومي لأسعار الذهب. أرسل /unsubscribe للإلغاء.");
  } else if (cmd === "/unsubscribe") {
    await supabaseAdmin.from("telegram_subscribers").delete().eq("chat_id", chatId);
    await sendTelegram(chatId, "تم إلغاء اشتراكك. يمكنك الاشتراك مجدداً بـ /subscribe.");
  } else if (isPriceQuery(text)) {
    const snap = await getGoldSnapshot();
    await sendTelegram(chatId, snap ? formatPrices(snap) : "لا تتوفر أسعار حالياً، حاول لاحقاً.");
  } else {
    await sendTelegram(chatId, "أرسل /price لأسعار الذهب الحالية أو /subscribe للتحديث اليومي.");
  }

  // تيليغرام يتوقّع 200 دائماً
  return NextResponse.json({ ok: true });
}

// معاينة نص الأسعار (للاختبار/التحقق بدون بوت حي) — بيانات عامة
export async function GET() {
  const snap = await getGoldSnapshot();
  return NextResponse.json({
    ok: !!snap,
    configured: !!process.env.TELEGRAM_BOT_TOKEN,
    preview: snap ? formatPrices(snap) : null,
  });
}
