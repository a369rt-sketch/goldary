import { type GoldSnapshot } from "@/app/lib/goldServer";

// أدوات تيليغرام المشتركة (خادمية) — يستعملها الـwebhook وكرون البثّ.

const iqd = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-US");

export const WELCOME =
  "أهلاً بك في بوت Goldary للذهب 🪙\n\n" +
  "• /price — أسعار الذهب الحالية\n" +
  "• /subscribe — اشترك في التحديث اليومي\n" +
  "• /unsubscribe — إلغاء الاشتراك";

export function formatPrices(s: GoldSnapshot): string {
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

// يرسل رسالة عبر bot API. يعيد true عند النجاح (لإحصاء البثّ).
export async function sendTelegram(chatId: number | string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false; // غير مُعدّ بعد
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    return res.ok;
  } catch (e) {
    console.error("telegram send failed:", e);
    return false;
  }
}
