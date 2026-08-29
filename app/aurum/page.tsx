"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import AurumLogin from "./AurumLogin";
import AurumDashboard from "./AurumDashboard";

export default function AurumPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUserId(data.user?.id ?? null);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: { id?: string } } | null) => {
        setUserId(session?.user?.id ?? null);
      }
    );
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="au-main" dir="rtl">
      {/* الشعار + الشعار النصي */}
      <header className="au-hero">
        <h1 className="au-logo">
          <span className="au-aurum">Aurum</span>
          <span className="au-by">by Goldary</span>
        </h1>
        <p className="au-tagline">ادّخري بذكاء. استثمري بذهب</p>
      </header>

      {/* تنبيه دائم */}
      <div className="au-disclaimer">
        ⚠️ هذه أداة تخطيط وتعليم مالي فقط، وليست نصيحة استثمارية.
      </div>

      {loading ? (
        <p className="au-loading">جارٍ التحميل…</p>
      ) : userId ? (
        <AurumDashboard userId={userId} />
      ) : (
        <AurumLogin />
      )}

      <style jsx>{`
        .au-main {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 18px 80px;
          position: relative;
        }
        .au-hero {
          text-align: center;
          padding: 26px 0 10px;
          position: relative;
        }
        .au-logo {
          margin: 0;
          line-height: 1.1;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .au-aurum {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 52px;
          font-weight: 700;
          letter-spacing: 2px;
          background: linear-gradient(135deg, #fff 0%, #f2d27b 45%, #d7b45a 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .au-by {
          font-size: 15px;
          letter-spacing: 3px;
          color: var(--muted);
          text-transform: uppercase;
        }
        .au-tagline {
          margin: 14px 0 0;
          color: var(--gold2);
          font-size: 18px;
          font-weight: 600;
        }
        .au-disclaimer {
          margin: 22px auto 26px;
          max-width: 640px;
          text-align: center;
          background: rgba(215, 180, 90, 0.08);
          border: 1px solid rgba(215, 180, 90, 0.3);
          border-radius: 14px;
          padding: 12px 16px;
          color: var(--gold2);
          font-size: 13px;
          line-height: 1.7;
        }
        .au-loading {
          text-align: center;
          color: var(--muted);
        }

        @media (max-width: 520px) {
          .au-aurum {
            font-size: 42px;
          }
          .au-tagline {
            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}
