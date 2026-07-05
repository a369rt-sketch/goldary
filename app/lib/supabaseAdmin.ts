import { createClient } from "@supabase/supabase-js";

// عميل خادمي بصلاحية service role — يتجاوز RLS للكتابة في gram_prices.
// ⚠️ ممنوع استيراده في أي مكوّن "use client" — المفتاح يبقى على الخادم فقط.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
