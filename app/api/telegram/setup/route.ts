import { NextRequest, NextResponse } from "next/server";

// تفعيل بنقرة: يضبط webhook تيليغرام تلقائياً على هذا الدومين.
// زوري: /api/telegram/setup?secret=<CRON_SECRET> (بعد ضبط TELEGRAM_BOT_TOKEN في البيئة).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (!secret || url.searchParams.get("secret") !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN غير مضبوط في بيئة Vercel بعد" },
      { status: 400 }
    );
  }

  const webhookUrl = `${url.origin}/api/telegram/webhook`;
  const body: Record<string, string> = { url: webhookUrl };
  const wsecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (wsecret) body.secret_token = wsecret;

  let telegram: unknown = null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    telegram = await res.json();
  } catch (e) {
    return NextResponse.json({ ok: false, error: "telegram request failed", detail: String(e) }, { status: 502 });
  }

  const tgOk = !!(telegram as { ok?: boolean })?.ok;
  return NextResponse.json({ ok: tgOk, webhookUrl, secured: !!wsecret, telegram });
}
