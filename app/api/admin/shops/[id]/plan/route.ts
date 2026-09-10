import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCaller } from "@/app/lib/authServer";

const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAY = 24 * 60 * 60 * 1000;

// تفعيل/إلغاء خطة اشتراك محل — الأدمن فقط (service role يتجاوز قفل الأعمدة)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = await getCaller(request);
  if (!caller.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!caller.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const action = body.action;

  if (action !== "month" && action !== "year" && action !== "free") {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  let plan: "free" | "pro" = "free";
  let expires: string | null = null;

  if (action !== "free") {
    // نمدّد من الأبعد بين الآن وتاريخ الانتهاء الحالي (تراكمي)
    const { data: shop } = await service
      .from("shops")
      .select("plan_expires_at")
      .eq("id", id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const current = shop.plan_expires_at ? new Date(shop.plan_expires_at).getTime() : 0;
    const base = Math.max(Date.now(), current);
    const days = action === "year" ? 365 : 30;
    plan = "pro";
    expires = new Date(base + days * DAY).toISOString();
  }

  const { data, error } = await service
    .from("shops")
    .update({ plan, plan_expires_at: expires })
    .eq("id", id)
    .select("id, plan, plan_expires_at")
    .maybeSingle();

  if (error) {
    console.error("Plan update failed:", error.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, shop: data });
}
