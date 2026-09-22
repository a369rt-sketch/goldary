import { createClient } from "@supabase/supabase-js";

// عميل Supabase مشترك للمتصفّح — يحفظ جلسة المستخدم ويجدّدها تلقائياً.
// نستعمله للمصادقة (Auth) عبر OTP.
//
// lock: قفل بلا عمليّة (no-op). افتراضياً يستعمل supabase-js قفل navigator.locks
// لتنسيق تجديد التوكن بين التبويبات، لكنه قد يتجمّد ولا يُطلَق أحياناً، فتعلّق
// getUser()/getSession() للأبد (شاشة "جارٍ التحقق/التحميل" لا تنتهي). تعطيله
// يزيل التجمّد؛ الثمن الوحيد احتمال تجديد مزدوج نادر بين تبويبين (غير ضارّ).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      lock: function <R>(
        _name: string,
        _acquireTimeout: number,
        fn: () => Promise<R>
      ): Promise<R> {
        return fn();
      },
    },
  }
);
