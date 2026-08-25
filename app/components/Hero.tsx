"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/app/lib/i18n";

type P = { x: number; y: number; r: number; vx: number; vy: number; a: number };

// قسم البطل: حقل جزيئات ذهبية + توهّج نابض + عنوان متحرّك — بثيم Goldary (ذهبي/أسود).
export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useT();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0,
      H = 0,
      raf = 0;
    let particles: P[] = [];

    function resize() {
      const rect = host!.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // كثافة أقل على الشاشات الصغيرة للأداء
      const count = Math.max(14, Math.min(64, Math.round(W / 20)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.7 + 0.6,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22 - 0.04,
        a: Math.random() * 0.5 + 0.25,
      }));
    }

    function frame() {
      ctx!.clearRect(0, 0, W, H);

      // خيوط رابطة بين الجزيئات القريبة (constellation)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x,
            dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120) {
            const o = (1 - Math.sqrt(d2) / 120) * 0.18;
            ctx!.strokeStyle = `rgba(215,180,90,${o})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(q.x, q.y);
            ctx!.stroke();
          }
        }
      }

      // الجزيئات
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = W + 5;
        else if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5;
        else if (p.y > H + 5) p.y = -5;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(242,210,123,${p.a})`;
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = "rgba(215,180,90,0.75)";
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      raf = requestAnimationFrame(frame);
    }

    resize();
    if (reduce) {
      // بلا حركة: نرسم إطاراً ثابتاً واحداً فقط
      raf = requestAnimationFrame(() => {
        frame();
        cancelAnimationFrame(raf);
      });
    } else {
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="hero" aria-label="Goldary">
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-content">
        <h1 className="hero-title">GOLDARY</h1>
        <p className="hero-sub">{t.curated_by}</p>
        <p className="hero-lead">{t.hero_tagline}</p>
      </div>

      <style jsx>{`
        .hero {
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          margin: 22px 0 8px;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 44px 28px;
          border: 1px solid rgba(215, 180, 90, 0.18);
          background:
            radial-gradient(120% 140% at 100% 0%, rgba(215, 180, 90, 0.1), transparent 55%),
            radial-gradient(120% 140% at 0% 100%, rgba(242, 210, 123, 0.06), transparent 55%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.25));
        }
        .hero-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        /* توهّج ذهبي نابض يملأ الفراغ خلف العنوان */
        .hero-glow {
          position: absolute;
          z-index: 0;
          width: 420px;
          height: 420px;
          top: 50%;
          inset-inline-start: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            rgba(242, 210, 123, 0.22),
            rgba(215, 180, 90, 0.08) 45%,
            transparent 70%
          );
          filter: blur(20px);
          pointer-events: none;
          animation: glowPulse 6s ease-in-out infinite;
        }
        .hero-content {
          position: relative;
          z-index: 1;
        }
        .hero-title {
          margin: 0;
          font-size: 68px;
          font-weight: 900;
          letter-spacing: 3px;
          line-height: 1.02;
          background: linear-gradient(135deg, #fff 0%, #f2d27b 45%, #d7b45a 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both,
            titleGlow 4.5s ease-in-out 0.9s infinite;
        }
        .hero-sub {
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 15px;
          letter-spacing: 1px;
          animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
        }
        .hero-lead {
          margin: 16px 0 0;
          max-width: 640px;
          font-size: 18px;
          line-height: 1.7;
          color: var(--text);
          animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes titleGlow {
          0%,
          100% {
            filter: drop-shadow(0 0 0 rgba(242, 210, 123, 0));
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(242, 210, 123, 0.45));
          }
        }
        @keyframes glowPulse {
          0%,
          100% {
            opacity: 0.55;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.12);
          }
        }

        /* ===== موبايل ===== */
        @media (max-width: 767px) {
          .hero {
            min-height: 230px;
            padding: 34px 20px;
            border-radius: 18px;
            text-align: center;
          }
          .hero-title {
            font-size: 44px;
            letter-spacing: 2px;
          }
          .hero-lead {
            font-size: 15px;
            margin-inline: auto;
          }
          .hero-glow {
            width: 300px;
            height: 300px;
          }
        }

        /* احترام تفضيل تقليل الحركة */
        @media (prefers-reduced-motion: reduce) {
          .hero-title,
          .hero-sub,
          .hero-lead,
          .hero-glow {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
