import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { getGoldSnapshot } from "@/app/lib/goldServer";
import { formatPrices, sendTelegram } from "@/app/lib/telegram";

// بثّ يومي لأسعار الذهب إلى مشتركي تيليغرام.
// يُجدوَل في vercel.json؛ محميّ بـ CRON_SECRET (Vercel يحقنه كـ Bearer).
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const snap = await getGoldSnapshot();
  if (!snap) return NextResponse.json({ ok: false, error: "no price feed" }, { status: 503 });

  const { data: subs, error } = await supabaseAdmin
    .from("telegram_subscribers")
    .select("chat_id");
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const text = "🔔 تحديث أسعار الذهب اليومي\n\n" + formatPrices(snap);
  let sent = 0;
  for (const s of subs ?? []) {
    if (await sendTelegram(s.chat_id as number, text)) sent++;
  }

  return NextResponse.json({ ok: true, subscribers: subs?.length ?? 0, sent });
}
