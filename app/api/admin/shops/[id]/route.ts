import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCaller } from "@/app/lib/authServer";

// حذف نهائي لمحل — الأدمن فقط، service role يتجاوز RLS.
const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = await getCaller(request);
  if (!caller.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!caller.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { error } = await service.from("shops").delete().eq("id", id);

  if (error) {
    console.error("Shop delete failed:", error.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
