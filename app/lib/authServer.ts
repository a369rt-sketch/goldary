import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// عميل service role (يتجاوز RLS) — للتحقق من جدول admins فقط هنا
const service = createClient(URL, SERVICE);

export type Caller = {
  user: { id: string; email?: string } | null;
  isAdmin: boolean;
};

// يتحقق من هوية المستخدم عبر الـJWT في ترويسة Authorization، ويحدّد إن كان أدمن.
export async function getCaller(req: NextRequest): Promise<Caller> {
  const authz = req.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return { user: null, isAdmin: false };

  const scoped = createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await scoped.auth.getUser();
  if (error || !data.user) return { user: null, isAdmin: false };

  const { data: adminRow } = await service
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return {
    user: { id: data.user.id, email: data.user.email ?? undefined },
    isAdmin: !!adminRow,
  };
}

// هل يحقّ للمتصل التصرّف على محل معيّن؟ (المالك، أو الأدمن، أو موظف فعّال بالبريد)
export async function canActOnShop(caller: Caller, shopId: string): Promise<boolean> {
  if (!caller.user) return false;
  if (caller.user.id === shopId) return true; // المالك (shop_id = uid)
  if (caller.isAdmin) return true;
  if (!caller.user.email) return false;
  const { data } = await service
    .from("shop_staff")
    .select("id")
    .eq("shop_id", shopId)
    .ilike("email", caller.user.email)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  return !!data;
}
