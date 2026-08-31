import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCaller } from "@/app/lib/authServer";

const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// إلغاء نشر قطعة: published → draft (المالك فقط)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = await getCaller(request);
  if (!caller.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { data: item } = await service
    .from("shop_items")
    .select("shop_id")
    .eq("id", id)
    .maybeSingle();

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.shop_id !== caller.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await service
    .from("shop_items")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Unpublish failed:", error.message);
    return NextResponse.json({ error: "Failed to unpublish" }, { status: 500 });
  }
  return NextResponse.json({ success: true, item: data[0] });
}
