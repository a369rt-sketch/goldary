import { NextRequest, NextResponse } from "next/server";
import { getGoldSnapshot, type GoldSnapshot } from "@/app/lib/goldServer";

// بوت تيليغرام لأسعار الذهب (Phase 3).
// الإعداد: أنشئي بوتاً عبر @BotFather → ضعي TELEGRAM_BOT_TOKEN في بيئة Vercel،
// ثم عيّني الـwebhook:
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://goldary.vercel.app/api/telegram/webhook&secret_token=<SECRET>
// (اختياري) TELEGRAM_WEBHOOK_SECRET للتحقق أن الطلب من تيليغرام.

export const dynamic = "force-dynamic";

const iqd = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-US");

const WELCOME =
  "أهلاً بك في بوت Goldary للذهب 🪙\n\nأرسل /price للحصول على أسعار الذهب الحالية في العراق.";

function formatPrices(s: GoldSnapshot): string {
  const date = new Date(s.recordedAt).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return [
    "🏆 أسعار الذهب — Goldary",
    "",
    `• عيار 24: ${iqd(s.price_gram_24k)} د.ع/غ`,
    `• عيار 22: ${iqd(s.price_gram_22k)} د.ع/غ`,
    `• عيار 21 (بيع): ${iqd(s.sell_gram_21k)} د.ع/غ`,
    `• عيار 21 (شراء): ${iqd(s.buy_gram_21k)} د.ع/غ`,
    "",
    s.ounceUsd ? `الأونصة: $${s.ounceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "",
    `الدولار: ${iqd(s.usdToIqd)} د.ع`,
    "",
    `آخر تحديث: ${date}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return; // غير مُعدّ بعد — لا نرسل
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  }).catch((e) => console.error("telegram send failed:", e));
}

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
    await sendMessage(chatId, WELCOME);
  } else if (isPriceQuery(text)) {
    const snap = await getGoldSnapshot();
    await sendMessage(chatId, snap ? formatPrices(snap) : "لا تتوفر أسعار حالياً، حاول لاحقاً.");
  } else {
    await sendMessage(chatId, "أرسل /price لأسعار الذهب الحالية.");
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
