"use client";

import { useCallback, useEffect, useState } from "react";
import { getStaff, createStaff, updateStaff, deleteStaff, type Staff } from "@/app/lib/staff";

export default function ShopStaff({ shopUserId }: { shopUserId: string }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    setStaff(await getStaff(shopUserId));
    setLoading(false);
  }, [shopUserId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy("add");
    await createStaff(shopUserId, {
      name: name.trim(),
      role: role.trim() || null,
      phone: phone.trim() || null,
    });
    setName("");
    setRole("");
    setPhone("");
    await load();
    setBusy(null);
  }

  async function toggle(s: Staff) {
    setBusy(s.id);
    await updateStaff(s.id, { active: !s.active });
    await load();
    setBusy(null);
  }

  async function remove(s: Staff) {
    if (!confirm(`حذف الموظف «${s.name}»؟ (تبقى فواتيره لكن بلا إسناد)`)) return;
    setBusy(s.id);
    await deleteStaff(s.id);
    await load();
    setBusy(null);
  }

  return (
    <section className="si card">
      <div className="card-title" style={{ marginBottom: 14 }}>الموظفون</div>

      <form className="stf-form" onSubmit={add}>
        <input className="input" placeholder="اسم الموظف" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input" placeholder="الدور (بائع/مدير…)" value={role} onChange={(e) => setRole(e.target.value)} list="stf-roles" />
        <datalist id="stf-roles">
          <option value="بائع" />
          <option value="مدير" />
          <option value="صائغ" />
          <option value="محاسب" />
        </datalist>
        <input className="input" placeholder="الهاتف (اختياري)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button type="submit" className="stf-add" disabled={busy === "add"}>
          {busy === "add" ? "…" : "＋ إضافة"}
        </button>
      </form>

      {loading ? (
        <p className="muted">جارٍ التحميل…</p>
      ) : staff.length === 0 ? (
        <p className="muted">لا يوجد موظفون بعد.</p>
      ) : (
        <div className="stf-list">
          {staff.map((s) => (
            <div className={s.active ? "stf-li" : "stf-li off"} key={s.id}>
              <div className="stf-main">
                <span className="stf-name">{s.name}</span>
                {s.role && <span className="stf-role">{s.role}</span>}
                {!s.active && <span className="stf-inactive">موقوف</span>}
              </div>
              {s.phone && <span className="muted stf-phone" dir="ltr">{s.phone}</span>}
              <div className="stf-actions">
                <button type="button" className="stf-btn" disabled={busy === s.id} onClick={() => toggle(s)}>
                  {s.active ? "إيقاف" : "تفعيل"}
                </button>
                <button type="button" className="stf-btn stf-del" disabled={busy === s.id} onClick={() => remove(s)}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .stf-form {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr auto;
          gap: 8px;
          margin-bottom: 14px;
        }
        .stf-add {
          border: 0;
          border-radius: 10px;
          padding: 9px 16px;
          font-weight: 800;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          white-space: nowrap;
        }
        .stf-add:disabled {
          opacity: 0.6;
        }
        .stf-list {
          display: grid;
          gap: 8px;
        }
        .stf-li {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(215, 180, 90, 0.18);
          border-radius: 12px;
          padding: 10px 12px;
        }
        .stf-li.off {
          opacity: 0.55;
        }
        .stf-main {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .stf-name {
          font-weight: 700;
          color: var(--gold2);
        }
        .stf-role {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(215, 180, 90, 0.15);
          color: var(--gold2);
        }
        .stf-inactive {
          font-size: 11px;
          color: #e6a866;
        }
        .stf-phone {
          font-size: 13px;
        }
        .stf-actions {
          display: flex;
          gap: 6px;
        }
        .stf-btn {
          border: 1px solid rgba(215, 180, 90, 0.35);
          background: transparent;
          color: var(--gold2);
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 13px;
          cursor: pointer;
        }
        .stf-del {
          color: #e66;
          border-color: rgba(220, 60, 60, 0.4);
        }
        @media (max-width: 600px) {
          .stf-form {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </section>
  );
}
