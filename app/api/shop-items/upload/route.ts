import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCaller } from "@/app/lib/authServer";

// رفع صور القطع عبر service role — يتجاوز سياسات Storage RLS التي تمنع رفع العميل (403).
const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "shop-images";

export async function POST(request: NextRequest) {
  try {
    const caller = await getCaller(request);
    if (!caller.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `items/${caller.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error } = await service.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (error) {
      console.error("Item image upload failed:", error.message);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data } = service.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("Upload route error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
