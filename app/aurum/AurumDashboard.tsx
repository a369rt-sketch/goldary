"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { getLatestGramPrice } from "@/app/lib/gramPrices";
import { getShopsWithPrices, pricesByKarat } from "@/app/lib/shops";
import { getAllPublishedItems, type ShopItem } from "@/app/lib/shopItems";
import {
  GOAL_TYPES,
  goalTypeMeta,
  fmtIqd,
  getGramHistory,
  cheapestDay,
  type AurumGoal,
  type GoalType,
  type GramPoint,
} from "@/app/lib/aurum";

type ShopSuggestion = { id: string; name: string; price: number };
type ShopRef = { id: string; name: string };

export default function AurumDashboard({ userId }: { userId: string }) {
  const [goals, setGoals] = useState<AurumGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellGram, setSellGram] = useState<number | null>(null);
  const [shops, setShops] = useState<ShopSuggestion[]>([]);
  const [history, setHistory] = useState<GramPoint[]>([]);
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [shopMap, setShopMap] = useState<Record<string, ShopRef>>({});

  const loadGoals = useCallback(async () => {
    const { data } = await supabase
      .from("aurum_goals")
      .select("*")
      .order("created_at", { ascending: false });
    setGoals((data as AurumGoal[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGoals();
    getLatestGramPrice().then((g) => setSellGram(g ? Number(g.sell_gram_iqd) : null));
    getGramHistory().then(setHistory);
    getAllPublishedItems().then(setItems);
    getShopsWithPrices().then((list) => {
      const s = list
        .map((sh) => ({ id: sh.id, name: sh.name, price: pricesByKarat(sh.prices)["21K"] }))
        .filter((x): x is ShopSuggestion => x.price != null)
        .sort((a, b) => a.price - b.price)
        .slice(0, 3);
      setShops(s);
      // خريطة owner_id → {id, name} لربط القطع بمحلاتها
      const map: Record<string, ShopRef> = {};
      for (const sh of list) {
        const owner = (sh as { owner_id?: string }).owner_id;
        if (owner) map[owner] = { id: sh.id, name: sh.name };
      }
      setShopMap(map);
    });
  }, [loadGoals]);

  const totalSaved = useMemo(
    () => goals.reduce((s, g) => s + (Number(g.current_amount) || 0), 0),
    [goals]
  );
  const totalGrams = sellGram ? totalSaved / sellGram : 0;
  const cheapest = useMemo(() => cheapestDay(history), [history]);

  // قطع مقترحة: القابلة للشراء ضمن الرصيد أولاً (الأغلى)، ثم الأقرب فالأرخص
  const suggestions = useMemo(() => {
    const priced = items.filter((i) => i.price != null);
    const affordable = priced
      .filter((i) => (i.price as number) <= totalSaved)
      .sort((a, b) => (b.price as number) - (a.price as number));
    const rest = priced
      .filter((i) => (i.price as number) > totalSaved)
      .sort((a, b) => (a.price as number) - (b.price as number));
    return [...affordable, ...rest].slice(0, 6);
  }, [items, totalSaved]);

  async function createGoal(form: NewGoal) {
    const target = Number(form.target_amount);
    const monthly = Number(form.monthly_saving) || 0;
    const duration = monthly > 0 ? Math.ceil(target / monthly) : null;
    await supabase.from("aurum_goals").insert({
      user_id: userId,
      goal_name: form.goal_name,
      goal_type: form.goal_type,
      target_amount: target,
      monthly_saving: monthly || null,
      duration_months: duration,
      current_amount: 0,
      status: "active",
    });
    setCreating(false);
    await loadGoals();
  }

  async function deposit(goal: AurumGoal, amount: number) {
    await supabase.from("aurum_transactions").insert({ goal_id: goal.id, amount });
    const next = (Number(goal.current_amount) || 0) + amount;
    await supabase
      .from("aurum_goals")
      .update({
        current_amount: next,
        status: next >= Number(goal.target_amount) ? "completed" : "active",
      })
      .eq("id", goal.id);
    await loadGoals();
  }

  async function removeGoal(id: string) {
    if (!confirm("حذف هذا الهدف وكل إيداعاته؟")) return;
    await supabase.from("aurum_goals").delete().eq("id", id);
    await loadGoals();
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="au-dash" dir="rtl">
      <div className="au-toolbar">
        <button className="au-primary" onClick={() => setCreating((v) => !v)}>
          {creating ? "إغلاق" : "＋ هدف جديد"}
        </button>
        <button className="au-ghost" onClick={logout}>
          تسجيل الخروج
        </button>
      </div>

      {creating && <GoalForm onCreate={createGoal} />}

      {loading ? (
        <p className="au-muted">جارٍ التحميل…</p>
      ) : goals.length === 0 ? (
        <div className="au-empty">
          <p>لا توجد أهداف بعد. ابدئي هدفك الأول للادّخار بالذهب ✨</p>
        </div>
      ) : (
        <div className="au-goals">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              sellGram={sellGram}
              onDeposit={deposit}
              onDelete={removeGoal}
            />
          ))}
        </div>
      )}

      {/* ذكاء استثماري عام */}
      {goals.length > 0 && (
        <section className="au-intel">
          <h2 className="au-h2">الذكاء الاستثماري</h2>

          <div className="au-intel-grid">
            {/* نقداً مقابل ذهباً */}
            <div className="au-tile">
              <div className="au-tile-t">نقداً مقابل ذهباً</div>
              <div className="au-cmp">
                <div>
                  <span className="au-lbl">إجمالي مدخراتك</span>
                  <b>{fmtIqd(totalSaved)}</b>
                </div>
                <div>
                  <span className="au-lbl">بسعر الذهب اليوم</span>
                  <b className="au-gold">
                    {sellGram ? `${totalGrams.toFixed(2)} غرام` : "—"}
                  </b>
                </div>
              </div>
              <p className="au-note">
                الذهب يميل للحفاظ على القيمة أمام تراجع قوة النقد الشرائية على المدى الطويل.
              </p>
            </div>

            {/* أرخص يوم */}
            <div className="au-tile">
              <div className="au-tile-t">أرخص يوم للشراء مؤخراً</div>
              {cheapest ? (
                <>
                  <b className="au-gold au-big">{fmtIqd(cheapest.sell)}</b>
                  <span className="au-lbl">
                    {new Date(cheapest.date).toLocaleDateString("ar-EG", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </>
              ) : (
                <span className="au-lbl">لا تتوفر بيانات كافية</span>
              )}
              {sellGram && (
                <p className="au-note">سعر الغرام اليوم: {fmtIqd(sellGram)}</p>
              )}
            </div>

            {/* محلات مقترحة */}
            <div className="au-tile">
              <div className="au-tile-t">محلات بأفضل سعر (21K)</div>
              {shops.length ? (
                <div className="au-shops">
                  {shops.map((s, i) => (
                    <a key={s.id} href={`/shops/${s.id}`} className="au-shop">
                      <span className="au-rank">{i + 1}</span>
                      <span className="au-shop-name">{s.name}</span>
                      <span className="au-gold">{fmtIqd(s.price)}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <span className="au-lbl">لا توجد محلات بعد</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* قطع مقترحة من معروضات الصاغة */}
      {suggestions.length > 0 && (
        <section className="au-intel">
          <h2 className="au-h2">قطع مقترحة لكِ</h2>
          <div className="au-pieces">
            {suggestions.map((it) => {
              const ref = shopMap[it.shop_id];
              const affordable = it.price != null && it.price <= totalSaved;
              const card = (
                <>
                  <div className="au-piece-img">
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt={it.name} />
                    ) : (
                      <span>💍</span>
                    )}
                    {affordable && <span className="au-afford">ضمن رصيدك ✓</span>}
                  </div>
                  <div className="au-piece-body">
                    <div className="au-piece-name">{it.name}</div>
                    <div className="au-lbl">
                      {it.karat ?? "—"}
                      {it.weight != null ? ` · ${it.weight} غ` : ""}
                      {ref ? ` · ${ref.name}` : ""}
                    </div>
                    <div className="au-gold" style={{ marginTop: 4, fontWeight: 700 }}>
                      {it.price != null ? fmtIqd(it.price) : "—"}
                    </div>
                  </div>
                </>
              );
              return ref ? (
                <a key={it.id} href={`/shops/${ref.id}`} className="au-piece">
                  {card}
                </a>
              ) : (
                <div key={it.id} className="au-piece">
                  {card}
                </div>
              );
            })}
          </div>
          <p className="au-note" style={{ marginTop: 12 }}>
            اقتراحات تعليمية من معروضات صاغة Goldary — ليست عرض بيع أو نصيحة.
          </p>
        </section>
      )}

      <style jsx>{`
        .au-pieces {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }
        .au-piece {
          display: block;
          text-decoration: none;
          color: var(--text);
          border: 1px solid rgba(215, 180, 90, 0.2);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.2);
          transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .au-piece:hover {
          border-color: rgba(215, 180, 90, 0.55);
          transform: translateY(-2px);
        }
        .au-piece-img {
          position: relative;
          height: 130px;
          background: rgba(255, 255, 255, 0.05);
          display: grid;
          place-items: center;
          font-size: 34px;
        }
        .au-piece-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .au-afford {
          position: absolute;
          top: 8px;
          inset-inline-end: 8px;
          background: rgba(60, 180, 90, 0.9);
          color: #06210f;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
        }
        .au-piece-body {
          padding: 10px 12px;
        }
        .au-piece-name {
          font-weight: 700;
          color: var(--gold2);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>

      <style jsx>{`
        .au-dash {
          margin-top: 8px;
        }
        .au-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 18px;
        }
        .au-primary {
          border: 0;
          border-radius: 999px;
          padding: 11px 20px;
          font-weight: 800;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
        .au-ghost {
          background: transparent;
          border: 1px solid rgba(215, 180, 90, 0.4);
          color: var(--gold2);
          border-radius: 999px;
          padding: 11px 18px;
          cursor: pointer;
        }
        .au-muted,
        .au-empty {
          color: var(--muted);
        }
        .au-empty {
          text-align: center;
          border: 1px dashed rgba(215, 180, 90, 0.3);
          border-radius: 18px;
          padding: 40px 20px;
        }
        .au-goals {
          display: grid;
          gap: 14px;
        }
        .au-intel {
          margin-top: 34px;
        }
        .au-h2 {
          color: var(--gold2);
          font-size: 22px;
          margin: 0 0 14px;
        }
        .au-intel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }
        .au-tile {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(215, 180, 90, 0.22);
          border-radius: 18px;
          padding: 18px;
        }
        .au-tile-t {
          color: var(--gold2);
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .au-cmp {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .au-cmp b {
          display: block;
          font-size: 18px;
          margin-top: 4px;
        }
        .au-lbl {
          color: var(--muted);
          font-size: 12px;
        }
        .au-gold {
          color: var(--gold2);
        }
        .au-big {
          display: block;
          font-size: 24px;
          margin: 4px 0;
        }
        .au-note {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.7;
          margin: 12px 0 0;
        }
        .au-shops {
          display: grid;
          gap: 8px;
        }
        .au-shop {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text);
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.25);
        }
        .au-shop:hover {
          background: rgba(215, 180, 90, 0.1);
        }
        .au-rank {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          color: #111;
          font-weight: 800;
          font-size: 12px;
          flex-shrink: 0;
        }
        .au-shop-name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

// ---------- نموذج إنشاء هدف ----------
type NewGoal = {
  goal_name: string;
  goal_type: GoalType;
  target_amount: string;
  monthly_saving: string;
};

function GoalForm({ onCreate }: { onCreate: (g: NewGoal) => Promise<void> }) {
  const [form, setForm] = useState<NewGoal>({
    goal_name: "",
    goal_type: "marriage",
    target_amount: "",
    monthly_saving: "",
  });
  const [busy, setBusy] = useState(false);

  const target = Number(form.target_amount) || 0;
  const monthly = Number(form.monthly_saving) || 0;
  const months = monthly > 0 ? Math.ceil(target / monthly) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.goal_name.trim() || target <= 0) return;
    setBusy(true);
    await onCreate(form);
    setBusy(false);
  }

  return (
    <form className="gf" onSubmit={submit} dir="rtl">
      <div className="gf-row">
        <label>اسم الهدف</label>
        <input
          value={form.goal_name}
          onChange={(e) => setForm({ ...form, goal_name: e.target.value })}
          placeholder="مثال: مصاغ الزواج"
          required
        />
      </div>

      <div className="gf-row">
        <label>نوع الهدف</label>
        <div className="gf-types">
          {GOAL_TYPES.map((t) => (
            <button
              type="button"
              key={t.key}
              className={form.goal_type === t.key ? "gf-type active" : "gf-type"}
              onClick={() => setForm({ ...form, goal_type: t.key })}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gf-grid">
        <div className="gf-row">
          <label>المبلغ المستهدف (د.ع)</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.target_amount}
            onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
            placeholder="5000000"
            required
          />
        </div>
        <div className="gf-row">
          <label>الادّخار الشهري (د.ع)</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.monthly_saving}
            onChange={(e) => setForm({ ...form, monthly_saving: e.target.value })}
            placeholder="250000"
          />
        </div>
      </div>

      {months != null && (
        <p className="gf-hint">
          ستصلين لهدفك خلال <b>{months}</b> شهر تقريباً بهذا الادّخار.
        </p>
      )}

      <button type="submit" className="gf-submit" disabled={busy}>
        {busy ? "جارٍ الإنشاء…" : "إنشاء الهدف"}
      </button>

      <style jsx>{`
        .gf {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(215, 180, 90, 0.28);
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 18px;
        }
        .gf-row {
          margin-bottom: 14px;
        }
        .gf-row label {
          display: block;
          color: var(--gold2);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .gf input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(215, 180, 90, 0.3);
          border-radius: 12px;
          padding: 11px 13px;
          color: #fff;
          outline: none;
        }
        .gf input:focus {
          border-color: var(--gold2);
        }
        .gf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .gf-types {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .gf-type {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(215, 180, 90, 0.3);
          color: var(--text);
          border-radius: 999px;
          padding: 8px 14px;
          cursor: pointer;
          font-size: 14px;
        }
        .gf-type.active {
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          color: #111;
          font-weight: 700;
          border-color: transparent;
        }
        .gf-hint {
          color: var(--muted);
          font-size: 13px;
          margin: 4px 0 0;
        }
        .gf-hint b {
          color: var(--gold2);
        }
        .gf-submit {
          width: 100%;
          margin-top: 14px;
          border: 0;
          border-radius: 999px;
          padding: 12px;
          font-weight: 800;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
        @media (max-width: 520px) {
          .gf-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
}

// ---------- بطاقة هدف ----------
function GoalCard({
  goal,
  sellGram,
  onDeposit,
  onDelete,
}: {
  goal: AurumGoal;
  sellGram: number | null;
  onDeposit: (g: AurumGoal, amount: number) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const meta = goalTypeMeta(goal.goal_type);
  const target = Number(goal.target_amount) || 0;
  const current = Number(goal.current_amount) || 0;
  const remaining = Math.max(0, target - current);
  const monthly = Number(goal.monthly_saving) || 0;
  const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : null;
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const done = current >= target && target > 0;

  // الذكاء: كم غرام يكفيه الرصيد الحالي
  const grams = sellGram ? Math.floor(current / sellGram) : 0;

  async function submitDeposit() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setBusy(true);
    await onDeposit(goal, amt);
    setBusy(false);
    setAmount("");
    setAddOpen(false);
  }

  return (
    <div className="gc" dir="rtl">
      <div className="gc-head">
        <div className="gc-title">
          <span className="gc-icon">{meta.icon}</span>
          <div>
            <b>{goal.goal_name}</b>
            <span className="gc-type">{meta.label}</span>
          </div>
        </div>
        <button className="gc-del" onClick={() => onDelete(goal.id)} aria-label="حذف">
          ✕
        </button>
      </div>

      {/* شريط التقدّم */}
      <div className="gc-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="gc-stats">
        <span>{fmtIqd(current)}</span>
        <span className="au-muted">{Math.round(pct)}%</span>
        <span className="au-muted">{fmtIqd(target)}</span>
      </div>

      <div className="gc-meta">
        <div>
          <span className="au-muted">المتبقّي</span>
          <b>{done ? "اكتمل 🎉" : fmtIqd(remaining)}</b>
        </div>
        <div>
          <span className="au-muted">الأشهر المتبقّية</span>
          <b>{done ? "—" : monthsLeft != null ? `${monthsLeft} شهر` : "—"}</b>
        </div>
      </div>

      {/* تنبيه ذكي: يكفي لشراء ذهب */}
      {grams >= 1 && (
        <div className="gc-alert">
          🪙 رصيدك يكفي لشراء <b>{grams} غرام</b> ذهب (21K) بسعر اليوم.
        </div>
      )}

      {addOpen ? (
        <div className="gc-add">
          <input
            type="number"
            inputMode="numeric"
            placeholder="مبلغ الإيداع (د.ع)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={submitDeposit} disabled={busy}>
            {busy ? "…" : "إضافة"}
          </button>
        </div>
      ) : (
        !done && (
          <button className="gc-addbtn" onClick={() => setAddOpen(true)}>
            ＋ أضيفي إيداعاً
          </button>
        )
      )}

      <style jsx>{`
        .gc {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(215, 180, 90, 0.25);
          border-radius: 18px;
          padding: 18px;
        }
        .gc-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .gc-title {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .gc-icon {
          font-size: 26px;
        }
        .gc-title b {
          display: block;
          font-size: 17px;
        }
        .gc-type {
          color: var(--muted);
          font-size: 12px;
        }
        .gc-del {
          background: none;
          border: 0;
          color: var(--muted);
          cursor: pointer;
          font-size: 16px;
        }
        .gc-del:hover {
          color: #ff8f8f;
        }
        .gc-bar {
          height: 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
          margin: 16px 0 8px;
        }
        .gc-bar i {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #d7b45a, #f2d27b);
          transition: width 0.4s ease;
        }
        .gc-stats {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 600;
        }
        .gc-meta {
          display: flex;
          gap: 20px;
          margin-top: 14px;
        }
        .gc-meta b {
          display: block;
          font-size: 16px;
          margin-top: 2px;
        }
        .au-muted {
          color: var(--muted);
          font-size: 12px;
        }
        .gc-alert {
          margin-top: 14px;
          background: rgba(215, 180, 90, 0.12);
          border: 1px solid rgba(215, 180, 90, 0.4);
          color: var(--gold2);
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
        }
        .gc-addbtn {
          margin-top: 14px;
          width: 100%;
          background: transparent;
          border: 1px dashed rgba(215, 180, 90, 0.4);
          color: var(--gold2);
          border-radius: 12px;
          padding: 10px;
          cursor: pointer;
        }
        .gc-add {
          margin-top: 14px;
          display: flex;
          gap: 8px;
        }
        .gc-add input {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(215, 180, 90, 0.3);
          border-radius: 12px;
          padding: 10px 12px;
          color: #fff;
          outline: none;
        }
        .gc-add button {
          border: 0;
          border-radius: 12px;
          padding: 0 18px;
          font-weight: 800;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
      `}</style>
    </div>
  );
}
