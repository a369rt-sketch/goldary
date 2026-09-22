import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCaller } from "@/app/lib/authServer";

// تغيير حالة محل (موافقة/رفض/إخفاء/إعادة للانتظار) — الأدمن فقط، service role يتجاوز RLS.
const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED = ["pending", "approved", "rejected", "hidden"] as const;
type Status = (typeof ALLOWED)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = await getCaller(request);
  if (!caller.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!caller.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  const status = body.status as Status | undefined;

  if (!status || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const { data, error } = await service
    .from("shops")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("Shop status update failed:", error.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, shop: data });
}
