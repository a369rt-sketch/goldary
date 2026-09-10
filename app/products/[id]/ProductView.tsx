"use client";

import { useRef, useState } from "react";
import { useT } from "@/app/lib/i18n";
import { provinces } from "@/app/lib/provinces";
import { type ShopItem } from "@/app/lib/shopItems";
import { type Shop } from "@/app/lib/shops";
import Lightbox from "@/app/components/Lightbox";
import VerifiedBadge from "@/app/components/VerifiedBadge";

const provinceName = (key: string) =>
  provinces.find((p) => p.key === key)?.name ?? key;

// تطبيع رقم واتساب لصيغة wa.me (أرقام عراقية: 0 → 964)
function waNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
}

export default function ProductView({ item, shop }: { item: ShopItem; shop: Shop }) {
  const { t, dir } = useT();
  const imgs = item.image_urls?.length ? item.image_urls : item.image_url ? [item.image_url] : [];
  const [active, setActive] = useState(0);
  const [lb, setLb] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const current = imgs[active] ?? null;
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);

  const go = (d: 1 | -1) => setActive((a) => (a + d + imgs.length) % imgs.length);
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.changedTouches[0].clientX;
    swiped.current = false;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null || imgs.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    swiped.current = true;
    go(dx < 0 ? 1 : -1);
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: item.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* أُلغيت المشاركة */
    }
  }

  return (
    <main className="container" dir={dir}>
      <div className="row-between">
        <a href="/collection" className="btn-secondary">{t.back}</a>
        <button type="button" className="btn-secondary" onClick={share}>
          {copied ? t.share_copied : t.share}
        </button>
      </div>

      <div className="pv-grid">
        {/* الصور */}
        <div className="pv-media">
          <div
            className="pv-main"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={() => {
              if (!swiped.current && current) setLb(active);
            }}
          >
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current} alt={item.name} />
            ) : (
              <span className="pv-noimg">💍</span>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="pv-thumbs">
              {imgs.map((u, i) => (
                <button
                  key={u}
                  type="button"
                  className={i === active ? "pv-thumb on" : "pv-thumb"}
                  onClick={() => setActive(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* المعلومات */}
        <div className="pv-info">
          <h1 className="title" style={{ margin: 0, fontSize: 32 }}>{item.name}</h1>

          <a href={`/shops/${shop.id}`} className="pv-shop">
            🏪 {shop.name} <VerifiedBadge />
          </a>
          <div className="muted small">{provinceName(shop.province)}</div>

          <div className="pv-specs">
            <div className="pv-spec">
              <span className="muted">{t.product_karat}</span>
              <b>{item.karat ?? "—"}</b>
            </div>
            <div className="pv-spec">
              <span className="muted">{t.product_weight}</span>
              <b>{item.weight != null ? `${item.weight} غ` : "—"}</b>
            </div>
          </div>

          {item.description ? <p className="pv-desc">{item.description}</p> : null}

          {item.tags && item.tags.length > 0 && (
            <div className="pv-tags">
              {item.tags.map((tg) => (
                <span className="pv-tag" key={tg}>{tg}</span>
              ))}
            </div>
          )}

          <div className="pv-actions">
            {shop.phone ? (
              <a href={`tel:${shop.phone}`} className="btn-primary small-btn">{t.call}</a>
            ) : null}
            {shop.whatsapp ? (
              <a
                href={`https://wa.me/${waNumber(shop.whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary small-btn"
              >
                {t.whatsapp}
              </a>
            ) : null}
            <a href={`/shops/${shop.id}`} className="btn-secondary small-btn">{t.view_shop}</a>
          </div>
        </div>
      </div>

      <Lightbox
        images={imgs}
        index={lb}
        alt={item.name}
        onClose={() => setLb(null)}
        onNavigate={(n) => {
          setLb(n);
          setActive(n);
        }}
      />

      <style jsx>{`
        .pv-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-top: 12px;
        }
        @media (min-width: 768px) {
          .pv-grid {
            grid-template-columns: minmax(0, 420px) 1fr;
            align-items: start;
          }
        }
        .pv-main {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(215, 180, 90, 0.25);
          background: rgba(255, 255, 255, 0.05);
          display: grid;
          place-items: center;
          cursor: zoom-in;
          touch-action: pan-y;
        }
        .pv-main img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .pv-noimg {
          font-size: 64px;
        }
        .pv-thumbs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .pv-thumb {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          overflow: hidden;
          padding: 0;
          cursor: pointer;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .pv-thumb.on {
          border: 2px solid var(--gold2);
        }
        .pv-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pv-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pv-shop {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--gold2);
          text-decoration: none;
          font-weight: 700;
          width: fit-content;
        }
        .pv-specs {
          display: flex;
          gap: 24px;
          padding: 12px 0;
          border-top: 1px solid var(--stroke);
          border-bottom: 1px solid var(--stroke);
        }
        .pv-spec {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 15px;
        }
        .pv-desc {
          color: var(--text);
          line-height: 1.7;
          margin: 0;
        }
        .pv-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .pv-tag {
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(215, 180, 90, 0.12);
          border: 1px solid rgba(215, 180, 90, 0.28);
          color: var(--gold2);
        }
        .pv-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 6px;
        }
      `}</style>
    </main>
  );
}
