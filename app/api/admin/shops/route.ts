import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCaller } from "@/app/lib/authServer";

// جلب كل المحلات للأدمن — service role يتجاوز RLS فيظهر حتى الـpending
// (المتصفح تحت RLS يرى المعتمدة فقط، فتطلع لوحة الأدمن فاضية).
const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ترتيب العرض: pending أولاً ثم approved ثم rejected ثم hidden، والأحدث ضمن كل مجموعة.
const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
  hidden: 3,
};

export async function GET(request: NextRequest) {
  const caller = await getCaller(request);
  if (!caller.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!caller.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await service
    .from("shops")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin shops fetch failed:", error.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  type Row = { status: string; created_at: string };
  const shops = (data ?? []).slice().sort((a: Row, b: Row) => {
    const sa = STATUS_ORDER[a.status] ?? 9;
    const sb = STATUS_ORDER[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });

  return NextResponse.json({ shops });
}
