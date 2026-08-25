"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export type AuthRole = {
  loading: boolean;
  userId: string | null;
  isAdmin: boolean;
};

// hook: حالة المستخدم ودوره (أدمن أم لا)، متزامنة مع تغيّر المصادقة.
export function useAuthRole(): AuthRole {
  const [state, setState] = useState<AuthRole>({
    loading: true,
    userId: null,
    isAdmin: false,
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;

      if (!user) {
        setState({ loading: false, userId: null, isAdmin: false });
        return;
      }

      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;

      setState({ loading: false, userId: user.id, isAdmin: !!adminRow });
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

// fetch مع ترويسة Authorization من جلسة Supabase الحالية.
export async function authFetch(input: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
