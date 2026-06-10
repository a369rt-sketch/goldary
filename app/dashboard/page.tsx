"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import {
  pricesByKarat,
  type Shop,
  type ShopKarat,
  type ShopPrice,
} from "@/app/lib/shops";
import { provinces } from "@/app/lib/provinces";

// مسار تسجيل الدخول (موجود بالمشروع) — عدّله من هنا لو تغيّر
const LOGIN_PATH = "/owner/login";

const KARATS: ShopKarat[] = ["24K", "22K", "21K", "18K"];

// قيمة عمود karats (بدون K) المقابلة لكل عيار
const KARAT_VALUE: Record<ShopKarat, string> = {
  "24K": "24",
  "22K": "22",
  "21K": "21",
  "18K": "18",
};

const emptyInputs = (): Record<ShopKarat, string> => ({
  "24K": "",
  "22K": "",
  "21K": "",
  "18K": "",
});

const BUCKET = "shop-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// نوع المحل مع مصفوفة صور المعرض (غير موجودة بنوع Shop الأساسي)
type ShopRow = Shop & { gallery_urls: string[] | null; karats: string[] | null };

// تحقّق: صورة فقط وحجم معقول
function validateImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "الملف يجب أن يكون صورة";
  if (file.size > MAX_IMAGE_BYTES) return "حجم الصورة يجب أن يكون أقل من 5 ميغابايت";
  return null;
}

// الامتداد من نوع MIME فقط (لا نستعمل اسم الملف لتجنّب أحرف ترفضها Supabase)
function extFromMime(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

// استخراج مسار التخزين من الرابط العام (للحذف)
function storagePathFromUrl(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [shop, setShop] = useState<ShopRow | null>(null);

  // نموذج معلومات المحل
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const [infoErr, setInfoErr] = useState("");

  // نموذج الأسعار
  const [latest, setLatest] = useState<Record<ShopKarat, number | null>>(
    pricesByKarat([])
  );
  const [priceInputs, setPriceInputs] = useState<Record<ShopKarat, string>>(
    emptyInputs()
  );
  const [savingPrices, setSavingPrices] = useState(false);
  const [priceMsg, setPriceMsg] = useState("");
  const [priceErr, setPriceErr] = useState("");

  // عيارات المحل (قيم بدون K مثل العمود)
  const [selectedKarats, setSelectedKarats] = useState<string[]>([]);
  const [savingKarats, setSavingKarats] = useState(false);
  const [karatsMsg, setKaratsMsg] = useState("");
  const [karatsErr, setKaratsErr] = useState("");

  // الشعار
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState("");
  const [logoErr, setLogoErr] = useState("");

  // المعرض
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryMsg, setGalleryMsg] = useState("");
  const [galleryErr, setGalleryErr] = useState("");

  // جلب آخر سعر لكل عيار (نموذج append: آخر سطر هو الحالي)
  async function loadPrices(shopId: string) {
    const { data } = await supabase
      .from("shop_prices")
      .select("*")
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: true });

    setLatest(pricesByKarat((data ?? []) as ShopPrice[]));
  }

  // التحقق من الجلسة + جلب محل المستخدم
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!auth.user) {
        router.replace(LOGIN_PATH);
        return;
      }

      setUserId(auth.user.id);

      const { data: shopRow } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", auth.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (shopRow) {
        const s = shopRow as ShopRow;
        setShop(s);
        setName(s.name ?? "");
        setProvince(s.province ?? "");
        setPhone(s.phone ?? "");
        setWhatsapp(s.whatsapp ?? "");
        setAddress(s.address ?? "");
        setSelectedKarats(s.karats ?? []);
        await loadPrices(s.id);
      }

      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  // حفظ معلومات المحل (update على نفس السطر)
  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!shop) return;

    setInfoMsg("");
    setInfoErr("");

    if (!name.trim()) {
      setInfoErr("اسم المحل مطلوب");
      return;
    }

    setSavingInfo(true);
    const { error } = await supabase
      .from("shops")
      .update({
        name: name.trim(),
        province,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        address: address.trim() || null,
      })
      .eq("id", shop.id)
      .eq("owner_id", userId);
    setSavingInfo(false);

    if (error) {
      setInfoErr("تعذّر حفظ المعلومات، حاول مرة أخرى");
      return;
    }

    setShop({
      ...shop,
      name: name.trim(),
      province,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      address: address.trim() || null,
    });
    setInfoMsg("تم حفظ معلومات المحل");
  }

  // حفظ الأسعار (insert سطر جديد لكل عيار مكتوب)
  async function savePrices(e: React.FormEvent) {
    e.preventDefault();
    if (!shop) return;

    setPriceMsg("");
    setPriceErr("");

    const shopKarats = shop.karats ?? [];
    const rows = KARATS.filter(
      (k) => shopKarats.includes(KARAT_VALUE[k]) && priceInputs[k].trim() !== ""
    )
      .map((k) => ({ shop_id: shop.id, karat: k, price: Number(priceInputs[k]) }))
      .filter((r) => Number.isFinite(r.price) && r.price >= 0);

    if (rows.length === 0) {
      setPriceErr("أدخل سعراً صحيحاً واحداً على الأقل");
      return;
    }

    setSavingPrices(true);
    const { error } = await supabase.from("shop_prices").insert(rows);
    setSavingPrices(false);

    if (error) {
      setPriceErr("تعذّر حفظ الأسعار، حاول مرة أخرى");
      return;
    }

    setPriceInputs(emptyInputs());
    await loadPrices(shop.id);
    setPriceMsg("تم حفظ الأسعار");
  }

  // تبديل اختيار عيار
  function toggleKarat(value: string) {
    setSelectedKarats((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  // حفظ عيارات المحل (update على عمود karats)
  async function saveKarats(e: React.FormEvent) {
    e.preventDefault();
    if (!shop) return;

    setKaratsMsg("");
    setKaratsErr("");
    setSavingKarats(true);

    const { error } = await supabase
      .from("shops")
      .update({ karats: selectedKarats })
      .eq("id", shop.id)
      .eq("owner_id", userId);

    setSavingKarats(false);

    if (error) {
      setKaratsErr("تعذّر حفظ العيارات، حاول مرة أخرى");
      return;
    }

    setShop({ ...shop, karats: selectedKarats });
    setKaratsMsg("تم حفظ العيارات");
  }

  // رفع الشعار (صورة واحدة)
  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // اسمح بإعادة اختيار نفس الملف لاحقاً
    if (!file || !shop) return;

    setLogoMsg("");
    setLogoErr("");

    const invalid = validateImage(file);
    if (invalid) {
      setLogoErr(invalid);
      return;
    }

    setLogoUploading(true);
    const path = `${shop.id}/logo-${Date.now()}.${extFromMime(file.type)}`;
    console.log("Logo upload → bucket:", BUCKET, "| shop.id:", shop.id, "| path:", path);

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setLogoUploading(false);
      console.error("Logo upload failed:", upErr.message);
      setLogoErr(upErr.message);
      return;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const logo_url = pub.publicUrl;

    const { error: dbErr } = await supabase
      .from("shops")
      .update({ logo_url })
      .eq("id", shop.id)
      .eq("owner_id", userId);

    setLogoUploading(false);

    if (dbErr) {
      console.error("Logo URL save failed:", dbErr.message);
      setLogoErr(dbErr.message);
      return;
    }

    setShop({ ...shop, logo_url });
    setLogoMsg("تم تحديث الشعار");
  }

  // رفع صور متعددة للمعرض
  async function onGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0 || !shop) return;

    setGalleryMsg("");
    setGalleryErr("");

    for (const f of files) {
      const invalid = validateImage(f);
      if (invalid) {
        setGalleryErr(invalid);
        return;
      }
    }

    setGalleryBusy(true);
    const stamp = Date.now();
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${shop.id}/gallery-${stamp}-${i}.${extFromMime(file.type)}`;
      console.log("Gallery upload → bucket:", BUCKET, "| shop.id:", shop.id, "| path:", path);

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) {
        setGalleryBusy(false);
        console.error("Gallery upload failed:", upErr.message);
        setGalleryErr(upErr.message);
        return;
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(pub.publicUrl);
    }

    const updated = [...(shop.gallery_urls ?? []), ...urls];

    const { error: dbErr } = await supabase
      .from("shops")
      .update({ gallery_urls: updated })
      .eq("id", shop.id)
      .eq("owner_id", userId);

    setGalleryBusy(false);

    if (dbErr) {
      console.error("Gallery save failed:", dbErr.message);
      setGalleryErr(dbErr.message);
      return;
    }

    setShop({ ...shop, gallery_urls: updated });
    setGalleryMsg("تم رفع الصور");
  }

  // حذف صورة من المعرض (Storage + المصفوفة)
  async function deleteGalleryImage(url: string) {
    if (!shop) return;

    setGalleryMsg("");
    setGalleryErr("");
    setGalleryBusy(true);

    const path = storagePathFromUrl(url);
    if (path) {
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove([path]);
      if (rmErr) {
        setGalleryBusy(false);
        setGalleryErr("تعذّر حذف الصورة، حاول مرة أخرى");
        return;
      }
    }

    const updated = (shop.gallery_urls ?? []).filter((u) => u !== url);

    const { error: dbErr } = await supabase
      .from("shops")
      .update({ gallery_urls: updated })
      .eq("id", shop.id)
      .eq("owner_id", userId);

    setGalleryBusy(false);

    if (dbErr) {
      setGalleryErr("تعذّر تحديث المعرض، حاول مرة أخرى");
      return;
    }

    setShop({ ...shop, gallery_urls: updated });
    setGalleryMsg("تم حذف الصورة");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace(LOGIN_PATH);
  }

  if (loading) {
    return (
      <main className="container" dir="rtl">
        <p className="muted">جارٍ التحميل…</p>
      </main>
    );
  }

  return (
    <main className="container" dir="rtl">
      <div className="row-between">
        <h1 className="title">لوحة التحكم</h1>
        <button type="button" className="btn-secondary" onClick={logout}>
          تسجيل الخروج
        </button>
      </div>

      {!shop ? (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card-title">لا يوجد محل مرتبط بحسابك بعد</div>
          <p className="muted" style={{ marginTop: 6 }}>
            تواصل مع الإدارة لربط محلك بحسابك حتى تتمكن من إدارته.
          </p>
        </div>
      ) : (
        <>
          {/* معلومات المحل */}
          <form className="card" style={{ maxWidth: 520 }} onSubmit={saveInfo}>
            <div className="card-title" style={{ marginBottom: 12 }}>
              معلومات المحل
            </div>

            <label className="label" htmlFor="name">اسم المحل</label>
            <input
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
            />

            <label className="label" htmlFor="province" style={{ marginTop: 12 }}>
              المحافظة
            </label>
            <select
              id="province"
              className="input"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              style={{ width: "100%" }}
            >
              {provinces.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>

            <label className="label" htmlFor="phone" style={{ marginTop: 12 }}>
              الهاتف
            </label>
            <input
              id="phone"
              className="input"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%" }}
            />

            <label className="label" htmlFor="whatsapp" style={{ marginTop: 12 }}>
              واتساب
            </label>
            <input
              id="whatsapp"
              className="input"
              dir="ltr"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              style={{ width: "100%" }}
            />

            <label className="label" htmlFor="address" style={{ marginTop: 12 }}>
              العنوان
            </label>
            <input
              id="address"
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: "100%" }}
            />

            {infoErr && <p className="error" style={{ marginTop: 12 }}>{infoErr}</p>}
            {infoMsg && (
              <p className="small" style={{ marginTop: 12, color: "#86efac" }}>
                {infoMsg}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={savingInfo}
              style={{ marginTop: 16, width: "100%" }}
            >
              {savingInfo ? "جارٍ الحفظ…" : "حفظ المعلومات"}
            </button>
          </form>

          {/* عيارات المحل */}
          <form
            className="card"
            style={{ maxWidth: 520, marginTop: 18 }}
            onSubmit={saveKarats}
          >
            <div className="card-title" style={{ marginBottom: 4 }}>
              عيارات المحل
            </div>
            <p className="muted small" style={{ marginTop: 0, marginBottom: 12 }}>
              اختر العيارات التي يتعامل بها محلك. ستظهر هذه فقط في تحديث الأسعار وصفحة المحل.
            </p>

            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              {KARATS.map((k) => {
                const value = KARAT_VALUE[k];
                const checked = selectedKarats.includes(value);
                return (
                  <label
                    key={k}
                    className={checked ? "chip active" : "chip"}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKarat(value)}
                      style={{ marginInlineEnd: 6 }}
                    />
                    {k}
                  </label>
                );
              })}
            </div>

            {karatsErr && <p className="error" style={{ marginTop: 12 }}>{karatsErr}</p>}
            {karatsMsg && (
              <p className="small" style={{ marginTop: 12, color: "#86efac" }}>
                {karatsMsg}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={savingKarats}
              style={{ marginTop: 16, width: "100%" }}
            >
              {savingKarats ? "جارٍ الحفظ…" : "حفظ العيارات"}
            </button>
          </form>

          {/* الأسعار */}
          <form
            className="card"
            style={{ maxWidth: 520, marginTop: 18 }}
            onSubmit={savePrices}
          >
            <div className="card-title" style={{ marginBottom: 4 }}>
              تحديث الأسعار
            </div>

            {(shop.karats ?? []).length === 0 ? (
              <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
                اختر عياراتك أولاً من قسم عيارات المحل.
              </p>
            ) : (
              <>
                <p className="muted small" style={{ marginTop: 0, marginBottom: 12 }}>
                  اكتب السعر الجديد للعيار الذي تريد تحديثه فقط. (السعر الحالي يظهر داخل الحقل)
                </p>

                {KARATS.filter((k) =>
                  (shop.karats ?? []).includes(KARAT_VALUE[k])
                ).map((k) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <label className="label" htmlFor={`price-${k}`}>
                      عيار {k}
                    </label>
                    <input
                      id={`price-${k}`}
                      className="input"
                      type="number"
                      min={0}
                      dir="ltr"
                      placeholder={
                        latest[k] != null
                          ? `الحالي: ${latest[k]!.toLocaleString()}`
                          : "لا يوجد سعر بعد"
                      }
                      value={priceInputs[k]}
                      onChange={(e) =>
                        setPriceInputs({ ...priceInputs, [k]: e.target.value })
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                ))}

                {priceErr && <p className="error" style={{ marginTop: 4 }}>{priceErr}</p>}
                {priceMsg && (
                  <p className="small" style={{ marginTop: 4, color: "#86efac" }}>
                    {priceMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingPrices}
                  style={{ marginTop: 12, width: "100%" }}
                >
                  {savingPrices ? "جارٍ الحفظ…" : "حفظ الأسعار"}
                </button>
              </>
            )}
          </form>

          {/* شعار المحل */}
          <div className="card" style={{ maxWidth: 520, marginTop: 18 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>
              شعار المحل
            </div>

            <div className="row" style={{ alignItems: "center", gap: 14 }}>
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt="شعار المحل"
                  width={72}
                  height={72}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid rgba(215,180,90,0.35)",
                  }}
                />
              ) : (
                <span className="muted small">لا يوجد شعار</span>
              )}

              <label
                className="btn-primary small-btn"
                style={{
                  cursor: logoUploading ? "default" : "pointer",
                  opacity: logoUploading ? 0.6 : 1,
                }}
              >
                {logoUploading ? "جارٍ الرفع…" : "رفع شعار"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={logoUploading}
                  onChange={onLogoChange}
                />
              </label>
            </div>

            {logoErr && <p className="error" style={{ marginTop: 12 }}>{logoErr}</p>}
            {logoMsg && (
              <p className="small" style={{ marginTop: 12, color: "#86efac" }}>
                {logoMsg}
              </p>
            )}
          </div>

          {/* معرض الصور */}
          <div className="card" style={{ maxWidth: 520, marginTop: 18 }}>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <div className="card-title">معرض الصور</div>
              <label
                className="btn-primary small-btn"
                style={{
                  cursor: galleryBusy ? "default" : "pointer",
                  opacity: galleryBusy ? 0.6 : 1,
                }}
              >
                {galleryBusy ? "جارٍ الرفع…" : "رفع صور"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  disabled={galleryBusy}
                  onChange={onGalleryChange}
                />
              </label>
            </div>

            {(shop.gallery_urls ?? []).length === 0 ? (
              <p className="muted small" style={{ margin: 0 }}>لا توجد صور بعد</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                  gap: 10,
                }}
              >
                {(shop.gallery_urls ?? []).map((url) => (
                  <div key={url} style={{ position: "relative" }}>
                    <img
                      src={url}
                      alt="صورة من المعرض"
                      style={{
                        width: "100%",
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.14)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => deleteGalleryImage(url)}
                      disabled={galleryBusy}
                      title="حذف الصورة"
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 24,
                        height: 24,
                        padding: 0,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)",
                        color: "#ff6b6b",
                        border: "1px solid rgba(255,107,107,0.6)",
                        cursor: galleryBusy ? "default" : "pointer",
                        fontSize: 12,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {galleryErr && <p className="error" style={{ marginTop: 12 }}>{galleryErr}</p>}
            {galleryMsg && (
              <p className="small" style={{ marginTop: 12, color: "#86efac" }}>
                {galleryMsg}
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
