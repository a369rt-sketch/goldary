import { createClient } from "@supabase/supabase-js";

// عميل Supabase مشترك للمتصفّح — يحفظ جلسة المستخدم ويجدّدها تلقائياً.
// نستعمله للمصادقة (Auth) عبر OTP.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
